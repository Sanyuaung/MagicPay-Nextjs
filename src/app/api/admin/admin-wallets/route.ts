import { z } from "zod";

import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const createSchema = z.object({
  admin_user_id: z.coerce.bigint(),
  account_number: z.string().trim().optional(),
  amount: z.coerce.number().min(0).optional(),
});

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);
  if (!isSuperAdmin(admin)) {
    return errorResponse("Forbidden. Super admin only.", {}, 403);
  }

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize") || 10)),
  );
  const search = (url.searchParams.get("search") || "").trim();

  const allowedSortKeys = [
    "account_number",
    "amount",
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
          {
            account_number: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            admin_user: {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            admin_user: {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            admin_user: {
              phone: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : undefined;

  const total = await prisma.adminWallet.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const items = await prisma.adminWallet.findMany({
    where,
    include: { admin_user: true },
    orderBy: { [sortBy]: sortDir },
    skip,
    take: pageSize,
  });

  return successResponse("Admin wallets", {
    items: items.map((item) => ({
      id: item.id.toString(),
      admin_user_id: item.admin_user_id.toString(),
      account_number: item.account_number,
      amount: Number(item.amount).toFixed(2),
      created_at: item.created_at,
      updated_at: item.updated_at,
      admin_user: {
        id: item.admin_user.id.toString(),
        name: item.admin_user.name,
        email: item.admin_user.email,
        phone: item.admin_user.phone,
      },
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

    const adminUser = await prisma.adminUser.findUnique({
      where: { id: payload.admin_user_id },
    });
    if (!adminUser) return errorResponse("Admin user not found.", {}, 404);

    const existing = await prisma.adminWallet.findUnique({
      where: { admin_user_id: payload.admin_user_id },
    });
    if (existing) {
      return errorResponse("Admin wallet already exists.", {}, 422);
    }

    const accountNumber =
      payload.account_number?.trim() ||
      `ADM${payload.admin_user_id.toString().padStart(10, "0")}`;

    const created = await prisma.adminWallet.create({
      data: {
        admin_user_id: payload.admin_user_id,
        account_number: accountNumber,
        amount: payload.amount ?? 0,
      },
    });

    return successResponse("Admin wallet created successfully.", {
      id: created.id.toString(),
      admin_user_id: created.admin_user_id.toString(),
      account_number: created.account_number,
      amount: Number(created.amount).toFixed(2),
      created_at: created.created_at,
      updated_at: created.updated_at,
    });
  } catch (error) {
    return errorResponse("Validation failed.", error, 422);
  }
}
