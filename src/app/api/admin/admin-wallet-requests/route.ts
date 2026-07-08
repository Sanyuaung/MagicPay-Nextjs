import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

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
  const status = (url.searchParams.get("status") || "").trim().toLowerCase();
  const search = (url.searchParams.get("search") || "").trim();

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            {
              requester: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              requester: {
                email: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const total = await prisma.adminWalletRequest.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const items = await prisma.adminWalletRequest.findMany({
    where,
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
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

  return successResponse("Admin wallet requests", {
    items: items.map((item) => ({
      id: item.id.toString(),
      requester_admin_user_id: item.requester_admin_user_id.toString(),
      amount: Number(item.amount).toFixed(2),
      description: item.description || "",
      status: item.status,
      review_note: item.review_note || "",
      reviewed_at: item.reviewed_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
      requester: {
        id: item.requester.id.toString(),
        name: item.requester.name,
        email: item.requester.email,
        phone: item.requester.phone,
      },
      reviewer: item.reviewer
        ? {
            id: item.reviewer.id.toString(),
            name: item.reviewer.name,
            email: item.reviewer.email,
          }
        : null,
    })),
    pagination: {
      page: currentPage,
      pageSize,
      total,
      totalPages,
    },
  });
}
