"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import {
  Bar,
  Bubble,
  Doughnut,
  Line,
  Pie,
  PolarArea,
  Radar,
  Scatter,
} from "react-chartjs-2";

import { AdminShell } from "@/components/frontend/AdminShell";
import { apiGet } from "@/lib/browser-api";
import {
  DASHBOARD_GREETING_MESSAGES,
  DASHBOARD_GREETING_STYLES,
} from "@/lib/dashboard-greeting";

const appName = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "App";

type WeatherState = {
  isLoading: boolean;
  place: string;
  temperature: string;
  condition: string;
};

type AdminProfile = {
  name: string;
  role: string;
};

type AdminUsersListResponse = {
  data?: {
    pagination?: {
      total?: number;
    };
  };
};

type AdminWalletsListResponse = {
  data?: {
    pagination?: {
      total?: number;
    };
  };
};

type AdminWalletRequestsResponse = {
  data?: {
    pagination?: {
      total?: number;
    };
  };
};

type MyWalletResponse = {
  data?: {
    amount?: string;
    updated_at?: string;
  };
};

type MyWalletRequestListResponse = {
  data?: {
    pagination?: {
      total?: number;
    };
  };
};

type DashboardAnalyticsData = {
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

type DashboardAnalyticsResponse = {
  data?: DashboardAnalyticsData;
};

type WalletRequestNotice = {
  id: string;
  amount: string;
  status: "pending" | "approved" | "rejected" | string;
  requester_name: string;
  requester_email: string;
  reviewer_name: string;
  reviewer_email: string;
  review_note: string;
  created_at: string | null;
  reviewed_at: string | null;
  updated_at: string | null;
};

type WalletRequestNotificationsResponse = {
  data?: {
    items?: WalletRequestNotice[];
  };
};

type InsightCard = {
  label: string;
  value: string;
  hint: string;
  iconClass: string;
  href?: string;
  trend?: "up" | "down" | "same";
};

type GreetingPeriod = keyof typeof DASHBOARD_GREETING_MESSAGES;

const GREETING_ROTATE_MS = 30_000;

const weatherCodeLabel: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Heavy rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
};

const defaultWeather = {
  latitude: 16.8409,
  longitude: 96.1735,
  place: "Detecting location...",
};

const weatherCodeIcon: Record<number, string> = {
  0: "mdi-weather-sunny",
  1: "mdi-weather-partly-cloudy",
  2: "mdi-weather-partly-cloudy",
  3: "mdi-weather-cloudy",
  45: "mdi-weather-fog",
  48: "mdi-weather-fog",
  51: "mdi-weather-rainy",
  53: "mdi-weather-rainy",
  55: "mdi-weather-pouring",
  61: "mdi-weather-rainy",
  63: "mdi-weather-pouring",
  65: "mdi-weather-pouring",
  71: "mdi-weather-snowy",
  73: "mdi-weather-snowy-heavy",
  75: "mdi-weather-snowy-heavy",
  80: "mdi-weather-rainy",
  81: "mdi-weather-pouring",
  82: "mdi-weather-pouring",
  95: "mdi-weather-lightning-rainy",
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
);

export default function AdminHomePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [weather, setWeather] = useState<WeatherState>({
    isLoading: true,
    place: defaultWeather.place,
    temperature: "--",
    condition: "Loading weather...",
  });
  const [weatherIconClass, setWeatherIconClass] =
    useState("mdi-weather-cloudy");
  const [locationNote, setLocationNote] = useState("");
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState("");
  const [chartAnalytics, setChartAnalytics] =
    useState<DashboardAnalyticsData | null>(null);
  const [chartRangeDays, setChartRangeDays] = useState<7 | 30 | 90>(7);
  const [chartAnalyticsLoading, setChartAnalyticsLoading] = useState(true);
  const [chartAnalyticsError, setChartAnalyticsError] = useState("");
  const [workflowNotices, setWorkflowNotices] = useState<WalletRequestNotice[]>(
    [],
  );
  const [workflowNoticesLoading, setWorkflowNoticesLoading] = useState(true);
  const [workflowNoticesError, setWorkflowNoticesError] = useState("");
  const previousInsightValues = useRef<Record<string, number>>({});

  useEffect(() => {
    setCurrentTime(new Date());

    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const buildInsightCards = (
      rawCards: Array<InsightCard & { metricValue: number }>,
    ): InsightCard[] => {
      const previous = previousInsightValues.current;
      const next: Record<string, number> = {};

      const cards = rawCards.map((item) => {
        const prev = previous[item.label];
        let trend: InsightCard["trend"];

        if (typeof prev === "number") {
          if (item.metricValue > prev) trend = "up";
          else if (item.metricValue < prev) trend = "down";
          else trend = "same";
        }

        next[item.label] = item.metricValue;

        return {
          label: item.label,
          value: item.value,
          hint: item.hint,
          iconClass: item.iconClass,
          href: item.href,
          trend,
        };
      });

      previousInsightValues.current = next;
      return cards;
    };

    const loadInsights = async () => {
      setInsightLoading(true);
      setInsightError("");

      try {
        const role = adminProfile?.role || "admin";

        if (role === "super_admin") {
          const [usersRes, walletsRes, pendingRes] = await Promise.all([
            apiGet<AdminUsersListResponse>(
              "/api/admin/admin-users?page=1&pageSize=1",
            ),
            apiGet<AdminWalletsListResponse>(
              "/api/admin/admin-wallets?page=1&pageSize=1",
            ),
            apiGet<AdminWalletRequestsResponse>(
              "/api/admin/admin-wallet-requests?page=1&pageSize=1&status=pending",
            ),
          ]);

          if (isCancelled) return;

          const usersTotal = usersRes.data?.pagination?.total ?? 0;
          const walletsTotal = walletsRes.data?.pagination?.total ?? 0;
          const pendingTotal = pendingRes.data?.pagination?.total ?? 0;

          setInsightCards(
            buildInsightCards([
              {
                label: "Admin Users",
                value: usersTotal.toLocaleString(),
                metricValue: usersTotal,
                hint: "Total user records",
                iconClass: "mdi-account-group",
                href: "/admin/admin-user",
              },
              {
                label: "Admin Wallets",
                value: walletsTotal.toLocaleString(),
                metricValue: walletsTotal,
                hint: "Wallet accounts in system",
                iconClass: "mdi-wallet",
                href: "/admin/wallet",
              },
              {
                label: "Pending Requests",
                value: pendingTotal.toLocaleString(),
                metricValue: pendingTotal,
                hint: "Waiting for approval",
                iconClass: "mdi-timer-sand",
                href: "/admin/admin-wallet-request",
              },
            ]),
          );
        } else {
          const [myWalletRes, myRequestsRes] = await Promise.all([
            apiGet<MyWalletResponse>("/api/admin/my-wallet"),
            apiGet<MyWalletRequestListResponse>(
              "/api/admin/my-wallet/add-amount-requests?page=1&pageSize=1",
            ),
          ]);

          if (isCancelled) return;

          const walletAmount = myWalletRes.data?.amount || "0.00";
          const walletAmountNumber = Number.parseFloat(walletAmount) || 0;
          const requestsTotal = myRequestsRes.data?.pagination?.total ?? 0;
          const walletUpdatedAt = myWalletRes.data?.updated_at;
          const walletUpdatedHint = walletUpdatedAt
            ? `Updated ${new Date(walletUpdatedAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "Current wallet balance";

          setInsightCards(
            buildInsightCards([
              {
                label: "My Wallet",
                value: `${walletAmount} MMK`,
                metricValue: walletAmountNumber,
                hint: walletUpdatedHint,
                iconClass: "mdi-wallet-outline",
                href: "/admin/my-wallet",
              },
              {
                label: "My Requests",
                value: requestsTotal.toLocaleString(),
                metricValue: requestsTotal,
                hint: "Top-up requests submitted",
                iconClass: "mdi-file-document-outline",
                href: "/admin/my-wallet",
              },
            ]),
          );
        }
      } catch {
        if (isCancelled) return;
        setInsightCards([]);
        setInsightError("Unable to load dashboard insights.");
      } finally {
        if (!isCancelled) setInsightLoading(false);
      }
    };

    void loadInsights();

    const insightRefresh = window.setInterval(() => {
      void loadInsights();
    }, 60 * 1000);

    return () => {
      isCancelled = true;
      window.clearInterval(insightRefresh);
    };
  }, [
    adminProfile?.role,
    weather.condition,
    weather.isLoading,
    weather.temperature,
  ]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiGet<{ data?: AdminProfile }>("/api/admin/profile");
        if (res.data) {
          setAdminProfile(res.data);
        }
      } catch {
        setAdminProfile(null);
      }
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadChartAnalytics = async () => {
      setChartAnalyticsLoading(true);
      setChartAnalyticsError("");

      try {
        const res = await apiGet<DashboardAnalyticsResponse>(
          `/api/admin/dashboard-analytics?days=${chartRangeDays}`,
        );

        if (isCancelled) return;
        setChartAnalytics(res.data ?? null);
      } catch {
        if (isCancelled) return;
        setChartAnalytics(null);
        setChartAnalyticsError("Unable to load chart analytics.");
      } finally {
        if (!isCancelled) setChartAnalyticsLoading(false);
      }
    };

    void loadChartAnalytics();

    const analyticsRefresh = window.setInterval(
      () => {
        void loadChartAnalytics();
      },
      2 * 60 * 1000,
    );

    return () => {
      isCancelled = true;
      window.clearInterval(analyticsRefresh);
    };
  }, [adminProfile?.role, chartRangeDays]);

  useEffect(() => {
    let isCancelled = false;

    const loadWorkflowNotices = async () => {
      setWorkflowNoticesLoading(true);
      setWorkflowNoticesError("");

      try {
        const res = await apiGet<WalletRequestNotificationsResponse>(
          "/api/admin/wallet-request-notifications",
        );

        if (isCancelled) return;
        setWorkflowNotices(res.data?.items ?? []);
      } catch {
        if (isCancelled) return;
        setWorkflowNotices([]);
        setWorkflowNoticesError("Unable to load workflow notifications.");
      } finally {
        if (!isCancelled) setWorkflowNoticesLoading(false);
      }
    };

    void loadWorkflowNotices();

    const noticeRefresh = window.setInterval(() => {
      void loadWorkflowNotices();
    }, 60 * 1000);

    return () => {
      isCancelled = true;
      window.clearInterval(noticeRefresh);
    };
  }, [adminProfile?.role]);

  useEffect(() => {
    let isCancelled = false;

    const resolveCurrentPosition = async () => {
      if (!("geolocation" in navigator)) {
        throw new Error("Geolocation unsupported");
      }

      return new Promise<{ latitude: number; longitude: number }>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            () => reject(new Error("Location permission denied")),
            { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
          );
        },
      );
    };

    const loadWeather = async () => {
      try {
        setLocationNote("");
        const coords = await resolveCurrentPosition();
        const place = `Your location (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})`;

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code`,
        );

        if (!res.ok) {
          throw new Error("Weather request failed");
        }

        const payload = (await res.json()) as {
          current?: { temperature_2m?: number; weather_code?: number };
        };

        const temp = payload.current?.temperature_2m;
        const code = payload.current?.weather_code;

        if (isCancelled) return;

        const iconClass =
          typeof code === "number"
            ? (weatherCodeIcon[code] ?? "mdi-weather-cloudy")
            : "mdi-weather-cloudy";

        setWeatherIconClass(iconClass);

        setWeather({
          isLoading: false,
          place,
          temperature:
            typeof temp === "number" ? `${Math.round(temp)}°C` : "--",
          condition:
            typeof code === "number"
              ? (weatherCodeLabel[code] ?? "Weather update")
              : "Weather update",
        });
      } catch {
        if (isCancelled) return;
        setWeatherIconClass("mdi-weather-cloudy");
        setLocationNote("Allow location permission to get current weather.");
        setWeather({
          isLoading: false,
          place: "Location unavailable",
          temperature: "--",
          condition: "Weather unavailable",
        });
      }
    };

    void loadWeather();

    const weatherRefresh = window.setInterval(
      () => {
        void loadWeather();
      },
      10 * 60 * 1000,
    );

    return () => {
      isCancelled = true;
      window.clearInterval(weatherRefresh);
    };
  }, []);

  const greetingPeriod = useMemo<GreetingPeriod>(() => {
    if (!currentTime) return "AFTERNOON";
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return "MORNING";
    if (hour >= 12 && hour < 17) return "AFTERNOON";
    if (hour >= 17 && hour < 21) return "EVENING";
    return "NIGHT";
  }, [currentTime]);

  const greetingStyle = useMemo(
    () => DASHBOARD_GREETING_STYLES[greetingPeriod],
    [greetingPeriod],
  );

  const periodMessage = useMemo(() => {
    const messages = DASHBOARD_GREETING_MESSAGES[greetingPeriod];
    if (!currentTime) return messages[0];

    const rotateIndex = Math.floor(currentTime.getTime() / GREETING_ROTATE_MS);
    return messages[rotateIndex % messages.length];
  }, [currentTime, greetingPeriod]);

  const dateText = useMemo(() => {
    if (!currentTime) return "--";
    return currentTime.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [currentTime]);

  const timeText = useMemo(() => {
    if (!currentTime) return "--:-- --";
    return currentTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [currentTime]);

  const weatherSummary = useMemo(() => {
    if (weather.isLoading) return "Updating";
    return weather.condition;
  }, [weather]);

  const roleLabel = useMemo(() => {
    const role = adminProfile?.role || "admin";
    return role === "super_admin" ? "Super Admin" : "Admin";
  }, [adminProfile?.role]);

  const isSuperAdmin = adminProfile?.role === "super_admin";

  const greetingSurfaceStyle = useMemo(
    () =>
      ({
        "--greeting-surface-bg": greetingStyle.background,
        "--greeting-surface-border": `${greetingStyle.color}33`,
        "--greeting-surface-bubble": `${greetingStyle.color}18`,
      }) as React.CSSProperties,
    [greetingStyle.background, greetingStyle.color],
  );

  const displayInsightCards = useMemo<InsightCard[]>(() => {
    if (!insightLoading) return insightCards;

    return [
      {
        label: "Loading",
        value: "--",
        hint: "Please wait...",
        iconClass: "mdi-loading mdi-spin",
      },
      {
        label: "Loading",
        value: "--",
        hint: "Please wait...",
        iconClass: "mdi-loading mdi-spin",
      },
      {
        label: "Loading",
        value: "--",
        hint: "Please wait...",
        iconClass: "mdi-loading mdi-spin",
      },
    ];
  }, [insightCards, insightLoading]);

  const chartData = useMemo(() => {
    const fallbackLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return {
      labels: chartAnalytics?.labels ?? fallbackLabels,
      requestsDaily:
        chartAnalytics?.requestsDaily ??
        new Array(fallbackLabels.length).fill(0),
      approvedDaily:
        chartAnalytics?.approvedDaily ??
        new Array(fallbackLabels.length).fill(0),
      rejectedDaily:
        chartAnalytics?.rejectedDaily ??
        new Array(fallbackLabels.length).fill(0),
      amountDaily:
        chartAnalytics?.amountDaily ?? new Array(fallbackLabels.length).fill(0),
      requestedAmountDaily:
        chartAnalytics?.requestedAmountDaily ??
        new Array(fallbackLabels.length).fill(0),
      approvedAmountDaily:
        chartAnalytics?.approvedAmountDaily ??
        new Array(fallbackLabels.length).fill(0),
      statusBreakdown: chartAnalytics?.statusBreakdown ?? {
        pending: 0,
        approved: 0,
        rejected: 0,
        other: 0,
      },
      walletDistribution: chartAnalytics?.walletDistribution ?? {
        small: 0,
        medium: 0,
        large: 0,
      },
      radarMetrics: chartAnalytics?.radarMetrics ?? [0, 0, 0, 0, 0, 0, 0],
      scatterPoints: chartAnalytics?.scatterPoints ?? [],
      bubblePoints: chartAnalytics?.bubblePoints ?? [],
      rangeDays: chartAnalytics?.rangeDays ?? chartRangeDays,
      updatedAt: chartAnalytics?.updatedAt ?? "",
    };
  }, [chartAnalytics, chartRangeDays]);

  const commonChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            boxWidth: 10,
          },
        },
      },
    }),
    [],
  );

  const lineChartDataset = useMemo(
    () => ({
      labels: chartData.labels,
      datasets: [
        {
          label: "Requests",
          data: chartData.requestsDaily,
          fill: true,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.18)",
          tension: 0.35,
          pointRadius: 3,
        },
        {
          label: "Approved",
          data: chartData.approvedDaily,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: "Rejected",
          data: chartData.rejectedDaily,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    }),
    [
      chartData.labels,
      chartData.requestsDaily,
      chartData.approvedDaily,
      chartData.rejectedDaily,
    ],
  );

  const barChartDataset = useMemo(
    () => ({
      labels: chartData.labels,
      datasets: isSuperAdmin
        ? [
            {
              label: "Request Amount",
              data: chartData.requestedAmountDaily,
              backgroundColor: "rgba(59, 130, 246, 0.55)",
              borderColor: "#3b82f6",
              borderWidth: 1,
              borderRadius: 6,
            },
            {
              label: "Approved Amount",
              data: chartData.approvedAmountDaily,
              backgroundColor: "rgba(16, 185, 129, 0.55)",
              borderColor: "#10b981",
              borderWidth: 1,
              borderRadius: 6,
            },
          ]
        : [
            {
              label: "Request Amount",
              data: chartData.requestedAmountDaily,
              backgroundColor: "rgba(16, 185, 129, 0.55)",
              borderColor: "#10b981",
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
    }),
    [
      chartData.approvedAmountDaily,
      chartData.labels,
      chartData.requestedAmountDaily,
      isSuperAdmin,
    ],
  );

  const doughnutChartDataset = useMemo(
    () => ({
      labels: ["Pending", "Approved", "Rejected", "Other"],
      datasets: [
        {
          data: [
            chartData.statusBreakdown.pending,
            chartData.statusBreakdown.approved,
            chartData.statusBreakdown.rejected,
            chartData.statusBreakdown.other,
          ],
          backgroundColor: ["#f59e0b", "#10b981", "#ef4444", "#94a3b8"],
          borderWidth: 0,
        },
      ],
    }),
    [chartData.statusBreakdown],
  );

  const pieChartDataset = useMemo(
    () => ({
      labels: ["Small", "Medium", "Large"],
      datasets: [
        {
          data: [
            chartData.walletDistribution.small,
            chartData.walletDistribution.medium,
            chartData.walletDistribution.large,
          ],
          backgroundColor: ["#60a5fa", "#10b981", "#6366f1"],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    }),
    [chartData.walletDistribution],
  );

  const radarChartDataset = useMemo(
    () => ({
      labels: [
        "Requests",
        "Approved",
        "Rejected",
        "Pending",
        "Avg Amount",
        "Max Amount",
        "Active Days",
      ],
      datasets: [
        {
          label: "Quality Score",
          data: chartData.radarMetrics,
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.20)",
          pointBackgroundColor: "#8b5cf6",
        },
      ],
    }),
    [chartData.radarMetrics],
  );

  const polarChartDataset = useMemo(
    () => ({
      labels: ["Pending", "Approved", "Rejected", "Small", "Large"],
      datasets: [
        {
          data: [
            chartData.statusBreakdown.pending,
            chartData.statusBreakdown.approved,
            chartData.statusBreakdown.rejected,
            chartData.walletDistribution.small,
            chartData.walletDistribution.large,
          ],
          backgroundColor: [
            "rgba(59, 130, 246, 0.45)",
            "rgba(16, 185, 129, 0.45)",
            "rgba(245, 158, 11, 0.45)",
            "rgba(236, 72, 153, 0.45)",
            "rgba(148, 163, 184, 0.45)",
          ],
          borderWidth: 1,
        },
      ],
    }),
    [chartData.statusBreakdown, chartData.walletDistribution],
  );

  const scatterChartDataset = useMemo(
    () => ({
      datasets: [
        {
          label: "Scatter Distribution",
          data: chartData.scatterPoints,
          pointBackgroundColor: "#0ea5e9",
          pointRadius: 5,
        },
      ],
    }),
    [chartData.scatterPoints],
  );

  const bubbleChartDataset = useMemo(
    () => ({
      datasets: [
        {
          label: "Risk Bubble",
          data: chartData.bubblePoints,
          backgroundColor: "rgba(244, 63, 94, 0.42)",
          borderColor: "#f43f5e",
        },
      ],
    }),
    [chartData.bubblePoints],
  );

  return (
    <AdminShell
      title="Dashboard"
      titleIconClass="ti-home"
      breadcrumb={`Welcome to ${appName} Dashboard`}
      breadcrumbSingle
    >
      <div className="col-12">
        <div className="card admin-dashboard-session-card">
          <div
            className="card-body admin-dashboard-session-surface"
            style={greetingSurfaceStyle}
          >
            <div className="admin-dashboard-session-layout">
              <div className="admin-dashboard-session-main">
                <div className="admin-dashboard-weather-mark">
                  <i
                    className={`mdi ${weatherIconClass} admin-dashboard-weather-icon-float`}
                    aria-hidden="true"
                    style={{ color: greetingStyle.color }}
                  />
                </div>
                <div>
                  <h3
                    className="admin-dashboard-session-title mb-1"
                    style={{ color: greetingStyle.color }}
                  >
                    {greetingStyle.title}, {adminProfile?.name || "Admin"} -{" "}
                    {roleLabel}
                  </h3>
                  <p
                    key={periodMessage}
                    className="admin-dashboard-session-text admin-dashboard-session-text-animated mb-0"
                  >
                    {periodMessage}
                  </p>
                </div>
              </div>
              <div className="admin-dashboard-session-side">
                <div
                  className="admin-dashboard-session-time"
                  style={{ color: greetingStyle.color }}
                >
                  {timeText}
                </div>
                <div className="admin-dashboard-session-date">{dateText}</div>
                <div className="admin-dashboard-session-weather">
                  <span>{weatherSummary}</span>
                  <i className={`mdi ${weatherIconClass}`} aria-hidden="true" />
                  <strong>{weather.temperature}</strong>
                </div>
                <small className="d-block mt-1 text-muted">
                  {locationNote || weather.place}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 mt-2">
        <div className="card admin-dashboard-analysis-card">
          <div className="card-body py-3">
            <div className="admin-dashboard-analysis-header">
              <h4 className="mb-0">Operational Analysis</h4>
              <small className="text-muted">
                Live quick overview for this dashboard session
              </small>
            </div>

            {insightError ? (
              <div className="alert alert-warning mb-0 mt-3 py-2" role="alert">
                {insightError}
              </div>
            ) : null}

            <div className="row g-2 mt-1">
              {displayInsightCards.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="col-12 col-md-6 col-xl-4"
                >
                  {item.href && !insightLoading ? (
                    <Link
                      href={item.href}
                      className="admin-dashboard-analysis-link"
                    >
                      <div className="admin-dashboard-analysis-item">
                        <div className="admin-dashboard-analysis-icon">
                          <i
                            className={`mdi ${item.iconClass}`}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="admin-dashboard-analysis-content">
                          <div className="admin-dashboard-analysis-label">
                            {item.label}
                          </div>
                          <div className="admin-dashboard-analysis-value">
                            {item.value}
                            {item.trend ? (
                              <span
                                className={`admin-dashboard-trend-badge admin-dashboard-trend-${item.trend}`}
                              >
                                {item.trend === "up"
                                  ? "Up"
                                  : item.trend === "down"
                                    ? "Down"
                                    : "Flat"}
                              </span>
                            ) : null}
                          </div>
                          <small className="text-muted">{item.hint}</small>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="admin-dashboard-analysis-item">
                      <div className="admin-dashboard-analysis-icon">
                        <i
                          className={`mdi ${item.iconClass}`}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="admin-dashboard-analysis-content">
                        <div className="admin-dashboard-analysis-label">
                          {item.label}
                        </div>
                        <div className="admin-dashboard-analysis-value">
                          {item.value}
                        </div>
                        <small className="text-muted">{item.hint}</small>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 mt-2">
        <div className="card admin-dashboard-analysis-card">
          <div className="card-body py-3">
            <div className="admin-dashboard-analysis-header">
              <h4 className="mb-0">Workflow Notifications</h4>
              <small className="text-muted">
                Latest wallet request updates for your role
              </small>
            </div>

            {workflowNoticesError ? (
              <div className="alert alert-warning mb-0 mt-3 py-2" role="alert">
                {workflowNoticesError}
              </div>
            ) : null}

            <div className="table-responsive mt-2">
              <table className="table table-sm table-bordered mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Requester</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {workflowNoticesLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-3">
                        Loading notifications...
                      </td>
                    </tr>
                  ) : null}

                  {!workflowNoticesLoading
                    ? workflowNotices.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>
                            <div>{item.requester_name}</div>
                            <small className="text-muted">
                              {item.requester_email}
                            </small>
                          </td>
                          <td>{item.amount}</td>
                          <td>
                            <span
                              className={`badge ${
                                item.status === "approved"
                                  ? "bg-success"
                                  : item.status === "rejected"
                                    ? "bg-danger"
                                    : "bg-warning text-dark"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>
                            {item.updated_at
                              ? new Date(item.updated_at).toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "-"}
                          </td>
                          <td>{item.review_note || "-"}</td>
                        </tr>
                      ))
                    : null}

                  {!workflowNoticesLoading && workflowNotices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-3">
                        No workflow notifications yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 mt-2">
        <div className="card admin-dashboard-analysis-card">
          <div className="card-body py-3">
            <div className="admin-dashboard-analysis-header">
              <h4 className="mb-0">All Chart Types</h4>
              <small className="text-muted">
                Unified visual analytics for both admin roles (
                {chartData.rangeDays}
                -day)
                {chartData.updatedAt
                  ? ` • Updated ${new Date(
                      chartData.updatedAt,
                    ).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""}
              </small>
            </div>

            <div className="admin-dashboard-range-filter mt-2">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  className={`admin-dashboard-range-btn ${chartRangeDays === days ? "is-active" : ""}`}
                  onClick={() => setChartRangeDays(days as 7 | 30 | 90)}
                  disabled={chartAnalyticsLoading}
                >
                  {days}D
                </button>
              ))}
            </div>

            {chartAnalyticsError ? (
              <div className="alert alert-warning mb-0 mt-3 py-2" role="alert">
                {chartAnalyticsError}
              </div>
            ) : null}

            <div className="row g-2 mt-1">
              <div className="col-12 col-xl-6">
                <div className="admin-dashboard-chart-card">
                  <h6>Daily Request Flow</h6>
                  <div className="admin-dashboard-chart-body">
                    <Line
                      data={lineChartDataset}
                      options={commonChartOptions}
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-6">
                <div className="admin-dashboard-chart-card">
                  <h6>
                    {isSuperAdmin
                      ? "Daily Request vs Approved Amount"
                      : "Daily Request Amount"}
                  </h6>
                  <div className="admin-dashboard-chart-body">
                    <Bar data={barChartDataset} options={commonChartOptions} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="admin-dashboard-chart-card">
                  <h6>Request Status Share</h6>
                  <div className="admin-dashboard-chart-body admin-dashboard-chart-body-sm">
                    <Doughnut
                      data={doughnutChartDataset}
                      options={commonChartOptions}
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="admin-dashboard-chart-card">
                  <h6>Wallet Tier Distribution</h6>
                  <div className="admin-dashboard-chart-body admin-dashboard-chart-body-sm">
                    <Pie data={pieChartDataset} options={commonChartOptions} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="admin-dashboard-chart-card">
                  <h6>Operations Performance Radar</h6>
                  <div className="admin-dashboard-chart-body admin-dashboard-chart-body-sm">
                    <Radar
                      data={radarChartDataset}
                      options={commonChartOptions}
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="admin-dashboard-chart-card">
                  <h6>Status and Wallet Pressure Mix</h6>
                  <div className="admin-dashboard-chart-body admin-dashboard-chart-body-sm">
                    <PolarArea
                      data={polarChartDataset}
                      options={commonChartOptions}
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-6">
                <div className="admin-dashboard-chart-card">
                  <h6>Day-to-Request Correlation</h6>
                  <div className="admin-dashboard-chart-body">
                    <Scatter
                      data={scatterChartDataset}
                      options={commonChartOptions}
                    />
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-6">
                <div className="admin-dashboard-chart-card">
                  <h6>Amount and Load Bubble Matrix</h6>
                  <div className="admin-dashboard-chart-body">
                    <Bubble
                      data={bubbleChartDataset}
                      options={commonChartOptions}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
