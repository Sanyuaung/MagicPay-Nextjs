import { z } from "zod";
import bcrypt from "bcryptjs";

import { getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { formatUserAgentSummary } from "@/lib/user-agent";
import { getOrCreateWallet } from "@/lib/wallet";

const createSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().regex(/^\d+$/),
    password: z.string().min(6).max(20),
});

export async function GET(req: Request) {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(
        100,
        Math.max(1, Number(url.searchParams.get("pageSize") || 10)),
    );
    const search = (url.searchParams.get("search") || "").trim();

    const allowedSortKeys = [
        "name",
        "email",
        "phone",
        "ip",
        "user_agent",
        "login_at",
        "created_at",
        "updated_at",
    ] as const;
    const sortByRaw = url.searchParams.get("sortBy") || "updated_at";
    const sortBy = allowedSortKeys.includes(
        sortByRaw as (typeof allowedSortKeys)[number],
    )
        ? sortByRaw
        : "updated_at";
    const sortDir =
        (url.searchParams.get("sortDir") || "desc").toLowerCase() === "asc"
            ? "asc"
            : "desc";

    const where = search
        ? {
              OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  {
                      email: {
                          contains: search,
                          mode: "insensitive" as const,
                      },
                  },
                  { phone: { contains: search, mode: "insensitive" as const } },
                  { ip: { contains: search, mode: "insensitive" as const } },
                  {
                      user_agent: {
                          contains: search,
                          mode: "insensitive" as const,
                      },
                  },
              ],
          }
        : undefined;

    const total = await prisma.user.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * pageSize;

    const items = await prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip,
        take: pageSize,
    });
    return successResponse("Users", {
        items: items.map((item) => ({
            id: item.id.toString(),
            name: item.name,
            email: item.email,
            phone: item.phone,
            ip: item.ip,
            user_agent: formatUserAgentSummary(item.user_agent),
            login_at: item.login_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
        })),
        pagination: {
            page: currentPage,
            pageSize,
            total,
            totalPages,
        },
    });
}

export async function POST(req: Request) {
    const admin = await getAdminUser();
    if (!admin) return errorResponse("Unauthenticated.", {}, 401);

    try {
        const payload = createSchema.parse(await req.json());
        const created = await prisma.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                password: await bcrypt.hash(payload.password, 12),
            },
        });
        await getOrCreateWallet(created);
        return successResponse("User and wallet created successfully.", {
            id: created.id.toString(),
            name: created.name,
            email: created.email,
            phone: created.phone,
            ip: created.ip,
            user_agent: created.user_agent,
            login_at: created.login_at,
            created_at: created.created_at,
            updated_at: created.updated_at,
        });
    } catch (error) {
        return errorResponse("Validation failed.", error, 422);
    }
}
