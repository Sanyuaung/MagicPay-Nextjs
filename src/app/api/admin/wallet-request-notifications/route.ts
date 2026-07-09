import { getAdminUser, isSuperAdmin } from "@/lib/admin-auth";
import { buildSimpleTablePdf } from "@/lib/pdf-report";
import { prisma } from "@/lib/prisma";
import { getRiskThresholdsFromUrl } from "@/lib/risk-thresholds";
import { errorResponse, successResponse } from "@/lib/response";

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("pageSize") || 8)),
  );
  const status = (url.searchParams.get("status") || "").trim().toLowerCase();
  const search = (url.searchParams.get("search") || "").trim();
  const from = (url.searchParams.get("from") || "").trim();
  const to = (url.searchParams.get("to") || "").trim();
  const exportType = (url.searchParams.get("export") || "")
    .trim()
    .toLowerCase();
  const thresholds = getRiskThresholdsFromUrl(url);

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
    ...(isSuperAdmin(admin) ? {} : { requester_admin_user_id: admin.id }),
    ...(status ? { status } : {}),
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
            {
              review_note: {
                contains: search,
                mode: "insensitive" as const,
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

  const agingCutoff = new Date(
    Date.now() - thresholds.agingPendingHours * 60 * 60 * 1000,
  );

  const requests = await prisma.adminWalletRequest.findMany({
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
    orderBy: [{ updated_at: "desc" }, { created_at: "desc" }, { id: "desc" }],
    skip,
    take: pageSize,
  });

  if (exportType === "csv") {
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
      orderBy: [{ updated_at: "desc" }, { created_at: "desc" }, { id: "desc" }],
    });

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = [
      "ID",
      "Requester Name",
      "Requester Email",
      "Amount",
      "Status",
      "Review Note",
      "Reviewer",
      "Created At",
      "Updated At",
    ];

    const rows = exportItems.map((item) => {
      const reviewer = item.reviewer
        ? `${item.reviewer.name} (${item.reviewer.email})`
        : "";

      return [
        item.id.toString(),
        item.requester.name,
        item.requester.email,
        Number(item.amount).toFixed(2),
        item.status,
        item.review_note || "",
        reviewer,
        item.created_at ? item.created_at.toISOString() : "",
        item.updated_at ? item.updated_at.toISOString() : "",
      ]
        .map((cell) => escapeCsv(cell))
        .join(",");
    });

    const csvText = [header.map((cell) => `"${cell}"`).join(","), ...rows].join(
      "\n",
    );

    const filename = `workflow-notifications-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvText, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

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
      orderBy: [{ updated_at: "desc" }, { created_at: "desc" }, { id: "desc" }],
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
      title: "Workflow Notifications Report",
      subtitle: `Generated ${new Date().toLocaleString("en-GB")} • Max rows 120`,
      summaryLines: [
        `Totals -> Pending: ${statusCounts.pending}, Approved: ${statusCounts.approved}, Rejected: ${statusCounts.rejected}`,
        `Risk thresholds -> High amount >= ${thresholds.highAmount}, Aging >= ${thresholds.agingPendingHours}h`,
        `High amount rows in report: ${highAmountRows}`,
      ],
      headers: [
        "ID",
        "Requester",
        "Amount",
        "Status",
        "Review Note",
        "Updated",
      ],
      rows: exportItems.map((item) => [
        item.id.toString(),
        item.requester.name,
        Number(item.amount).toFixed(2),
        item.status,
        item.review_note || "-",
        item.updated_at ? item.updated_at.toISOString().slice(0, 19) : "-",
      ]),
    });

    const filename = `workflow-notifications-${new Date().toISOString().slice(0, 10)}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const notices = requests.map((item) => ({
    id: item.id.toString(),
    amount: Number(item.amount).toFixed(2),
    status: item.status,
    requester_name: item.requester.name,
    requester_email: item.requester.email,
    reviewer_name: item.reviewer?.name || "",
    reviewer_email: item.reviewer?.email || "",
    review_note: item.review_note || "",
    is_aging_pending:
      item.status === "pending" &&
      !!item.created_at &&
      item.created_at.getTime() < agingCutoff.getTime(),
    is_high_amount: Number(item.amount) >= thresholds.highAmount,
    created_at: item.created_at,
    reviewed_at: item.reviewed_at,
    updated_at: item.updated_at,
  }));

  const riskSummary = notices.reduce(
    (acc, item) => {
      if (item.is_high_amount) acc.high_amount += 1;
      if (item.is_aging_pending) acc.aging_pending += 1;
      return acc;
    },
    { high_amount: 0, aging_pending: 0 },
  );

  return successResponse("Wallet request notifications", {
    items: notices,
    pagination: {
      page: currentPage,
      pageSize,
      total,
      totalPages,
    },
    risk_summary: riskSummary,
    risk_thresholds: {
      high_amount: thresholds.highAmount,
      aging_pending_hours: thresholds.agingPendingHours,
    },
  });
}
