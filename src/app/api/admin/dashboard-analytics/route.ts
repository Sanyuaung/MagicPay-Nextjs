import { getAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/response";

const DAY_MS = 24 * 60 * 60 * 1000;
const ANALYTICS_TTL_MS = 2 * 60 * 1000;

type DashboardAnalyticsPayload = {
  labels: string[];
  requestsDaily: number[];
  approvedDaily: number[];
  rejectedDaily: number[];
  requestedAmountDaily: number[];
  approvedAmountDaily: number[];
  amountDaily: number[];
  statusBreakdown: {
    pending: number;
    approved: number;
    rejected: number;
    other: number;
  };
  walletDistribution: {
    small: number;
    medium: number;
    large: number;
  };
  radarMetrics: number[];
  scatterPoints: Array<{ x: number; y: number }>;
  bubblePoints: Array<{ x: number; y: number; r: number }>;
  rangeDays: 7 | 30 | 90;
  updatedAt: string;
};

const analyticsCache = new Map<
  string,
  { expiresAt: number; payload: DashboardAnalyticsPayload }
>();

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse("Unauthenticated.", {}, 401);

  const url = new URL(req.url);
  const rawDays = Number(url.searchParams.get("days") || 7);
  const rangeDays: 7 | 30 | 90 = rawDays === 30 || rawDays === 90 ? rawDays : 7;

  const cacheKey = `${admin.id.toString()}:${admin.role}:${rangeDays}`;
  const nowMs = Date.now();
  const cached = analyticsCache.get(cacheKey);
  if (cached && cached.expiresAt > nowMs) {
    return successResponse("Dashboard analytics", cached.payload);
  }

  const now = new Date();
  const endDay = startOfDay(now);
  const startRangeDay = new Date(endDay.getTime() - (rangeDays - 1) * DAY_MS);

  const labels: string[] = [];
  const dayKeys: string[] = [];
  for (let i = 0; i < rangeDays; i += 1) {
    const day = new Date(startRangeDay.getTime() + i * DAY_MS);
    labels.push(
      day.toLocaleDateString("en-GB", {
        ...(rangeDays === 7
          ? { weekday: "short" as const }
          : { day: "2-digit" as const, month: "short" as const }),
        timeZone: "UTC",
      }),
    );
    dayKeys.push(toDayKey(day));
  }

  const requestWhere =
    admin.role === "super_admin"
      ? { created_at: { gte: startRangeDay } }
      : {
          requester_admin_user_id: admin.id,
          created_at: { gte: startRangeDay },
        };

  const [requestRows, walletRows] = await Promise.all([
    prisma.adminWalletRequest.findMany({
      where: requestWhere,
      select: {
        status: true,
        amount: true,
        created_at: true,
      },
      orderBy: { created_at: "asc" },
    }),
    admin.role === "super_admin"
      ? prisma.adminWallet.findMany({
          select: { amount: true },
        })
      : prisma.adminWallet.findMany({
          where: { admin_user_id: admin.id },
          select: { amount: true },
        }),
  ]);

  const requestsDaily = new Array<number>(rangeDays).fill(0);
  const approvedDaily = new Array<number>(rangeDays).fill(0);
  const rejectedDaily = new Array<number>(rangeDays).fill(0);
  const requestedAmountDaily = new Array<number>(rangeDays).fill(0);
  const approvedAmountDaily = new Array<number>(rangeDays).fill(0);
  const amountDaily = new Array<number>(rangeDays).fill(0);

  const statusBreakdown = {
    pending: 0,
    approved: 0,
    rejected: 0,
    other: 0,
  };

  for (const row of requestRows) {
    if (!row.created_at) continue;

    const createdAt = new Date(row.created_at);
    const key = toDayKey(createdAt);
    const dayIndex = dayKeys.indexOf(key);
    const amount = Number(row.amount) || 0;

    if (dayIndex >= 0) {
      requestsDaily[dayIndex] += 1;
      requestedAmountDaily[dayIndex] = Number(
        (requestedAmountDaily[dayIndex] + amount).toFixed(2),
      );
      amountDaily[dayIndex] = Number(
        (amountDaily[dayIndex] + amount).toFixed(2),
      );

      if (row.status === "approved") {
        approvedDaily[dayIndex] += 1;
        approvedAmountDaily[dayIndex] = Number(
          (approvedAmountDaily[dayIndex] + amount).toFixed(2),
        );
      }
      if (row.status === "rejected") rejectedDaily[dayIndex] += 1;
    }

    if (row.status === "pending") statusBreakdown.pending += 1;
    else if (row.status === "approved") statusBreakdown.approved += 1;
    else if (row.status === "rejected") statusBreakdown.rejected += 1;
    else statusBreakdown.other += 1;
  }

  const walletDistribution = {
    small: 0,
    medium: 0,
    large: 0,
  };

  for (const wallet of walletRows) {
    const amount = Number(wallet.amount) || 0;
    if (amount < 1000) walletDistribution.small += 1;
    else if (amount < 5000) walletDistribution.medium += 1;
    else walletDistribution.large += 1;
  }

  const totalRequests = requestRows.length;
  const totalAmount = requestRows.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  );
  const avgAmount = totalRequests > 0 ? totalAmount / totalRequests : 0;
  const maxAmount = requestRows.reduce(
    (max, row) => Math.max(max, Number(row.amount) || 0),
    0,
  );
  const activeDays = requestsDaily.filter((count) => count > 0).length;

  const radarMetrics = [
    totalRequests,
    statusBreakdown.approved,
    statusBreakdown.rejected,
    statusBreakdown.pending,
    Number(avgAmount.toFixed(2)),
    Number(maxAmount.toFixed(2)),
    activeDays,
  ];

  const scatterPoints = requestsDaily.map((value, index) => ({
    x: index + 1,
    y: value,
  }));

  const bubblePoints = amountDaily
    .map((amount, index) => ({
      x: index + 1,
      y: amount,
      r: Math.max(5, Math.min(16, requestsDaily[index] * 2 + 4)),
    }))
    .filter((point) => point.y > 0)
    .slice(-5);

  const payload: DashboardAnalyticsPayload = {
    labels,
    requestsDaily,
    approvedDaily,
    rejectedDaily,
    requestedAmountDaily,
    approvedAmountDaily,
    amountDaily,
    statusBreakdown,
    walletDistribution,
    radarMetrics,
    scatterPoints,
    bubblePoints,
    rangeDays,
    updatedAt: new Date().toISOString(),
  };

  analyticsCache.set(cacheKey, {
    expiresAt: nowMs + ANALYTICS_TTL_MS,
    payload,
  });

  return successResponse("Dashboard analytics", payload);
}
