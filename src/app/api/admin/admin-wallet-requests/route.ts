import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { buildSimpleTablePdf } from "@/lib/pdf-report";
import { prisma } from "@/lib/prisma";
import { getRiskThresholdsFromUrl } from "@/lib/risk-thresholds";
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
  const minAmountRaw = (url.searchParams.get("minAmount") || "").trim();
  const maxAmountRaw = (url.searchParams.get("maxAmount") || "").trim();
  const from = (url.searchParams.get("from") || "").trim();
  const to = (url.searchParams.get("to") || "").trim();
  const exportType = (url.searchParams.get("export") || "")
    .trim()
    .toLowerCase();
  const thresholds = getRiskThresholdsFromUrl(url);

  const minAmount = minAmountRaw === "" ? NaN : Number(minAmountRaw);
  const maxAmount = maxAmountRaw === "" ? NaN : Number(maxAmountRaw);

  const amountFilter: { gte?: number; lte?: number } = {};
  if (Number.isFinite(minAmount) && minAmount >= 0)
    amountFilter.gte = minAmount;
  if (Number.isFinite(maxAmount) && maxAmount >= 0)
    amountFilter.lte = maxAmount;

  const createdAtFilter: { gte?: Date; lt?: Date } = {};
  if (from) {
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    if (!Number.isNaN(fromDate.getTime())) createdAtFilter.gte = fromDate;
  }
  if (to) {
    const toDate = new Date(`${to}T00:00:00.000Z`);
    if (!Number.isNaN(toDate.getTime())) {
      createdAtFilter.lt = new Date(toDate.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  const where = {
    ...(status ? { status } : {}),
    ...(Object.keys(amountFilter).length > 0 ? { amount: amountFilter } : {}),
    ...(Object.keys(createdAtFilter).length > 0
      ? { created_at: createdAtFilter }
      : {}),
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

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const agingCutoff = new Date(
    now.getTime() - thresholds.agingPendingHours * 60 * 60 * 1000,
  );

  if (exportType === "pdf") {
    const exportItems = await prisma.adminWalletRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 120,
    });

    const statusCounts = exportItems.reduce(
      (acc, item) => {
        if (item.status === "approved") acc.approved += 1;
        else if (item.status === "rejected") acc.rejected += 1;
        else if (item.status === "pending") acc.pending += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 },
    );

    const highAmountRows = exportItems.filter(
      (item) => Number(item.amount) >= thresholds.highAmount,
    ).length;

    const pdfBytes = await buildSimpleTablePdf({
      title: "Wallet Requests Report",
      subtitle: `Generated ${new Date().toLocaleString("en-GB")} • Max rows 120`,
      summaryLines: [
        `Totals -> Pending: ${statusCounts.pending}, Approved: ${statusCounts.approved}, Rejected: ${statusCounts.rejected}`,
        `Risk thresholds -> High amount >= ${thresholds.highAmount}, Aging >= ${thresholds.agingPendingHours}h, Frequent requester >= ${thresholds.frequentRequesterCount}/7d`,
        `High amount rows in report: ${highAmountRows}`,
      ],
      headers: [
        "ID",
        "Requester",
        "Amount",
        "Status",
        "Review Note",
        "Created",
      ],
      rows: exportItems.map((item) => [
        item.id.toString(),
        item.requester.name,
        Number(item.amount).toFixed(2),
        item.status,
        item.review_note || "-",
        item.created_at ? item.created_at.toISOString().slice(0, 19) : "-",
      ]),
    });

    const filename = `wallet-requests-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (exportType === "csv") {
    const exportItems = await prisma.adminWalletRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
    });

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const header = [
      "ID",
      "Requester Name",
      "Requester Email",
      "Requester Phone",
      "Amount",
      "Status",
      "Description",
      "Review Note",
      "Reviewed By",
      "Reviewed At",
      "Created At",
    ];

    const rows = exportItems.map((item) => {
      const reviewedBy = item.reviewer
        ? `${item.reviewer.name} (${item.reviewer.email})`
        : "";

      return [
        item.id.toString(),
        item.requester.name,
        item.requester.email,
        item.requester.phone,
        Number(item.amount).toFixed(2),
        item.status,
        item.description || "",
        item.review_note || "",
        reviewedBy,
        item.reviewed_at ? item.reviewed_at.toISOString() : "",
        item.created_at ? item.created_at.toISOString() : "",
      ]
        .map((cell) => escapeCsv(cell))
        .join(",");
    });

    const csvText = [header.map((cell) => `"${cell}"`).join(","), ...rows].join(
      "\n",
    );

    const filename = `wallet-requests-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvText, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

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

  const requesterIds = Array.from(
    new Set(items.map((item) => item.requester_admin_user_id.toString())),
  ).map((id) => BigInt(id));

  const [
    requesterRecentGroups,
    highAmountCount,
    agingPendingCount,
    frequentRequesterGroups,
  ] = await Promise.all([
    requesterIds.length > 0
      ? prisma.adminWalletRequest.groupBy({
          by: ["requester_admin_user_id"],
          where: {
            requester_admin_user_id: { in: requesterIds },
            created_at: { gte: sevenDaysAgo },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    prisma.adminWalletRequest.count({
      where: {
        amount: { gte: thresholds.highAmount },
        created_at: { gte: sevenDaysAgo },
      },
    }),
    prisma.adminWalletRequest.count({
      where: {
        status: "pending",
        created_at: { lt: agingCutoff },
      },
    }),
    prisma.adminWalletRequest.groupBy({
      by: ["requester_admin_user_id"],
      where: {
        created_at: { gte: sevenDaysAgo },
      },
      _count: { _all: true },
      having: {
        requester_admin_user_id: {
          _count: {
            gte: thresholds.frequentRequesterCount,
          },
        },
      },
    }),
  ]);

  const requesterRecentMap = new Map<string, number>(
    requesterRecentGroups.map((group) => [
      group.requester_admin_user_id.toString(),
      group._count._all,
    ]),
  );

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
      requester_recent_7d_count:
        requesterRecentMap.get(item.requester_admin_user_id.toString()) ?? 0,
      is_high_amount: Number(item.amount) >= thresholds.highAmount,
      is_aging_pending:
        item.status === "pending" &&
        !!item.created_at &&
        item.created_at.getTime() < agingCutoff.getTime(),
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
    risk_summary: {
      high_amount_7d: highAmountCount,
      aging_pending: agingPendingCount,
      frequent_requesters_7d: frequentRequesterGroups.length,
    },
    risk_thresholds: {
      high_amount: thresholds.highAmount,
      aging_pending_hours: thresholds.agingPendingHours,
      frequent_requester_count: thresholds.frequentRequesterCount,
    },
  });
}
