import { z } from "zod";
import bcrypt from "bcryptjs";

import { getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { formatUserAgentSummary } from "@/lib/user-agent";

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
    const sortFields = [
        "name",
        "email",
        "phone",
        "ip",
        "user_agent",
        "created_at",
        "updated_at",
    ] as const;
    const defaultSort = "updated_at";

    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(
        100,
        Math.max(1, Number(url.searchParams.get("pageSize") || 10)),
    );
    const search = (url.searchParams.get("search") || "").trim();
    const sortByRaw = url.searchParams.get("sortBy") || defaultSort;
    const sortBy = sortFields.includes(sortByRaw as (typeof sortFields)[number])
        ? sortByRaw
        : defaultSort;
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

    const total = await prisma.adminUser.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * pageSize;

    const items = await prisma.adminUser.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip,
        take: pageSize,
    });
    return successResponse("Admin users", {
        items: items.map((item) => ({
            id: item.id.toString(),
            name: item.name,
            email: item.email,
            phone: item.phone,
            ip: item.ip,
            user_agent: formatUserAgentSummary(item.user_agent),
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
        const created = await prisma.adminUser.create({
            data: {
                name: payload.name,
                email: payload.email,
                phone: payload.phone,
                password: await bcrypt.hash(payload.password, 12),
            },
        });
        return successResponse("Admin user created successfully.", {
            id: created.id.toString(),
            name: created.name,
            email: created.email,
            phone: created.phone,
            ip: created.ip,
            user_agent: created.user_agent,
            created_at: created.created_at,
            updated_at: created.updated_at,
        });
    } catch (error) {
        return errorResponse("Validation failed.", error, 422);
    }
}
