import { z } from "zod";
import bcrypt from "bcryptjs";

import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";
import { formatUserAgentSummary } from "@/lib/user-agent";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\d+$/),
  role: z.enum(["super_admin", "admin"]).optional(),
  password: z.string().min(6).max(20),
});

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);
  if (!isSuperAdmin(admin)) {
    return errorResponse("Forbidden. Super admin only.", {}, 403);
  }

  const [adminIds, walletOwnerIds] = await Promise.all([
    prisma.adminUser.findMany({ select: { id: true } }),
    prisma.adminWallet.findMany({ select: { admin_user_id: true } }),
  ]);

  const hasWallet = new Set(
    walletOwnerIds.map((item) => item.admin_user_id.toString()),
  );
  const missingWalletRows = adminIds
    .filter((item) => !hasWallet.has(item.id.toString()))
    .map((item) => ({
      admin_user_id: item.id,
      account_number: `ADM${item.id.toString().padStart(10, "0")}`,
      amount: 0,
    }));

  if (missingWalletRows.length > 0) {
    await prisma.adminWallet.createMany({
      data: missingWalletRows,
      skipDuplicates: true,
    });
  }

  const url = new URL(req.url);
  const sortFields = [
    "name",
    "email",
    "phone",
    "role",
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
          { role: { contains: search, mode: "insensitive" as const } },
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
      role: item.role,
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
  if (!isSuperAdmin(admin)) {
    return errorResponse("Forbidden. Super admin only.", {}, 403);
  }

  try {
    const payload = createSchema.parse(await req.json());
    const created = await prisma.$transaction(async (tx) => {
      const adminUser = await tx.adminUser.create({
        data: {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          role: payload.role || "admin",
          password: await bcrypt.hash(payload.password, 12),
        },
      });

      await tx.adminWallet.create({
        data: {
          admin_user_id: adminUser.id,
          account_number: `ADM${adminUser.id.toString().padStart(10, "0")}`,
          amount: 0,
        },
      });

      return adminUser;
    });
    return successResponse("Admin user created successfully.", {
      id: created.id.toString(),
      name: created.name,
      email: created.email,
      phone: created.phone,
      role: created.role,
      ip: created.ip,
      user_agent: created.user_agent,
      created_at: created.created_at,
      updated_at: created.updated_at,
    });
  } catch (error) {
    return errorResponse("Validation failed.", error, 422);
  }
}
