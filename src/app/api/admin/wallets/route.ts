import { getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

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
        "account_number",
        "account_person",
        "amount",
        "created_at",
        "updated_at",
    ] as const;
    const sortByRaw = url.searchParams.get("sortBy") || "created_at";
    const sortBy = allowedSortKeys.includes(
        sortByRaw as (typeof allowedSortKeys)[number],
    )
        ? sortByRaw
        : "created_at";
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
                      user: {
                          name: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                  },
                  {
                      user: {
                          email: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                  },
                  {
                      user: {
                          phone: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                  },
              ],
          }
        : undefined;

    const total = await prisma.wallet.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const skip = (currentPage - 1) * pageSize;

    const wallets = await prisma.wallet.findMany({
        where,
        include: { user: true },
        orderBy:
            sortBy === "account_person"
                ? { user: { name: sortDir } }
                : { [sortBy]: sortDir },
        skip,
        take: pageSize,
    });

    return successResponse("Wallets", {
        items: wallets.map((wallet) => ({
            id: wallet.id.toString(),
            account_number: wallet.account_number,
            amount: Number(wallet.amount).toFixed(2),
            account_person: wallet.user?.name || "-",
            created_at: wallet.created_at,
            updated_at: wallet.updated_at,
            user: wallet.user
                ? {
                      id: wallet.user.id.toString(),
                      name: wallet.user.name,
                      email: wallet.user.email,
                      phone: wallet.user.phone,
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
