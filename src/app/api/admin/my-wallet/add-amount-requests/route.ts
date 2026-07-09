import { z } from "zod";

import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const createSchema = z.object({
  amount: z.coerce.number().min(1),
  description: z.string().trim().min(1).optional(),
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
  const status = (url.searchParams.get("status") || "").trim().toLowerCase();
  const from = (url.searchParams.get("from") || "").trim();
  const to = (url.searchParams.get("to") || "").trim();

  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : null;
  const toDate = to ? new Date(`${to}T00:00:00.000Z`) : null;

  const createdAtFilter: { gte?: Date; lt?: Date } = {};
  if (fromDate && !Number.isNaN(fromDate.getTime())) {
    createdAtFilter.gte = fromDate;
  }
  if (toDate && !Number.isNaN(toDate.getTime())) {
    createdAtFilter.lt = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
  }

  const where = {
    requester_admin_user_id: admin.id,
    ...(status ? { status } : {}),
    ...(Object.keys(createdAtFilter).length > 0
      ? { created_at: createdAtFilter }
      : {}),
  };

  const total = await prisma.adminWalletRequest.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const items = await prisma.adminWalletRequest.findMany({
    where,
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    skip,
    take: pageSize,
  });

  return successResponse("Own wallet add-amount requests", {
    items: items.map((item) => ({
      id: item.id.toString(),
      amount: Number(item.amount).toFixed(2),
      description: item.description || "",
      status: item.status,
      review_note: item.review_note || "",
      reviewed_at: item.reviewed_at,
      reviewer: item.reviewer
        ? {
            id: item.reviewer.id.toString(),
            name: item.reviewer.name,
            email: item.reviewer.email,
          }
        : null,
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
  if (isSuperAdmin(admin)) {
    return errorResponse(
      "Super admin can update wallet directly. No request needed.",
      {},
      422,
    );
  }

  try {
    const payload = createSchema.parse(await req.json());

    const pendingCount = await prisma.adminWalletRequest.count({
      where: {
        requester_admin_user_id: admin.id,
        status: "pending",
      },
    });

    if (pendingCount >= 5) {
      return errorResponse(
        "You already have too many pending requests.",
        {},
        422,
      );
    }

    const created = await prisma.adminWalletRequest.create({
      data: {
        requester_admin_user_id: admin.id,
        amount: payload.amount,
        description: payload.description || "",
        status: "pending",
      },
    });

    return successResponse("Top-up request sent to super admin.", {
      id: created.id.toString(),
      amount: Number(created.amount).toFixed(2),
      status: created.status,
      created_at: created.created_at,
    });
  } catch (error) {
    return errorResponse("Validation failed.", error, 422);
  }
}
