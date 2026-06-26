"use client";

import Cookies from "js-cookie";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Calendar,
  DollarSign,
  Star,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Loader2,
  Target,
  CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";

// ─── API Layer ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function fetchWithAuth(endpoint, activeTenant, options = {}) {
  const token = Cookies.get("access_token");
  if (!activeTenant) throw new Error("Tenant not ready");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      "X-Tenant": activeTenant,
      ...options.headers,
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.detail || data?.message || `Request failed: ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

const analyticsAPI = {
  getKPIs: (params, tenant) =>
    apiFetch(`/api/v1/analytics/kpis/?${new URLSearchParams(params)}`, tenant),
  getBookingsOverTime: (params, tenant) =>
    apiFetch(
      `/api/v1/analytics/bookings-over-time/?${new URLSearchParams(params)}`,
      tenant
    ),
  getRevenueByCategory: (params, tenant) =>
    apiFetch(
      `/api/v1/analytics/revenue-by-category/?${new URLSearchParams(params)}`,
      tenant
    ),
  getRevenueTrends: (params, tenant) =>
    apiFetch(
      `/api/v1/analytics/revenue-trends/?${new URLSearchParams(params)}`,
      tenant
    ),
  getPeakHours: (params, tenant) =>
    apiFetch(
      `/api/v1/analytics/peak-hours/?${new URLSearchParams(params)}`,
      tenant
    ),
  getTopServices: (params, tenant) =>
    apiFetch(
      `/api/v1/analytics/top-services/?${new URLSearchParams(params)}`,
      tenant
    ),
  getTopProviders: (params, tenant) =>
    apiFetch(
      `/api/v1/analytics/top-providers/?${new URLSearchParams(params)}`,
      tenant
    ),
  getBookingStatusOverview: (params, tenant) =>
    apiFetch(
      `/api/v1/analytics/booking-status/?${new URLSearchParams(params)}`,
      tenant
    ),
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { labelKey: "analytics.dateRange.7d", value: "7d" },
  { labelKey: "analytics.dateRange.30d", value: "30d" },
  { labelKey: "analytics.dateRange.90d", value: "90d" },
  { labelKey: "analytics.dateRange.lastMonth", value: "last_month" },
  { labelKey: "analytics.dateRange.thisYear", value: "this_year" },
];

// Maroon combination palette
const CHART_COLORS = [
  "#8B1E3F",
  "#A8345C",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

const STATUS_COLORS = {
  completed: "#10B981",
  confirmed: "#8B1E3F",
  upcoming: "#8B1E3F",
  in_progress: "#3B82F6",
  scheduled: "#06b6d4",
  pending_payment: "#F59E0B",
  deposit_paid: "#a855f7",
  paid: "#8b5cf6",
  cancelled: "#EF4444",
  refunded: "#f97316",
  no_show: "#64748b",
};

const STATUS_LABEL_KEYS = {
  completed: "analytics.status.completed",
  confirmed: "analytics.status.confirmed",
  upcoming: "analytics.status.upcoming",
  in_progress: "analytics.status.inProgress",
  scheduled: "analytics.status.scheduled",
  pending_payment: "analytics.status.pendingPayment",
  deposit_paid: "analytics.status.depositPaid",
  paid: "analytics.status.paid",
  cancelled: "analytics.status.cancelled",
  refunded: "analytics.status.refunded",
  no_show: "analytics.status.noShow",
};

// ─── Utility Helpers ─────────────────────────────────────────────────────────

/**
 * FIX: Safely extract display text from a value that may be a multilingual
 * object like { en: "Haircut", ar: "قص شعر" } — prevents "Objects are not
 * valid as a React child" error.
 */
function toText(val, fallback = "—") {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return val.en || val.ar || val.ur || Object.values(val)[0] || fallback;
  }
  return fallback;
}

function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "SAR 0";
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num) {
  if (num == null) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatPercent(value) {
  if (value == null) return "+0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function getDateRangeParams(rangeValue) {
  const now = new Date();
  const fmt = (d) => d.toISOString().split("T")[0];
  const daysAgo = (n) => new Date(now - n * 86400000);

  switch (rangeValue) {
    case "7d":
      return { start_date: fmt(daysAgo(7)), end_date: fmt(now) };
    case "30d":
      return { start_date: fmt(daysAgo(30)), end_date: fmt(now) };
    case "90d":
      return { start_date: fmt(daysAgo(90)), end_date: fmt(now) };
    case "last_month":
      return {
        start_date: fmt(
          new Date(now.getFullYear(), now.getMonth() - 1, 1)
        ),
        end_date: fmt(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "this_year":
      return {
        start_date: fmt(new Date(now.getFullYear(), 0, 1)),
        end_date: fmt(now),
      };
    default:
      return { start_date: fmt(daysAgo(30)), end_date: fmt(now) };
  }
}

// ─── Reusable: Maroon Tooltip ────────────────────────────────────────────────

function MaroonTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white text-gray-900 text-xs rounded-lg px-3 py-2 shadow-xl border border-[#8B1E3F]">
      <p className="text-gray-500 mb-1 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant, t } = useApp();
  const router = useRouter();
  const [dateRange, setDateRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useBlockBackNavigation(!!user);

  useEffect(() => {
    if (!loadingUser && !user) router.replace("/");
  }, [loadingUser, user, router]);

  useEffect(() => {
    if (requiresOnboarding) router.replace("/auth/onboarding?step=1");
  }, [requiresOnboarding, router]);

  // ── Data states ──────────────────────────────────────────────────────────
  const [kpis, setKPIs] = useState(null);
  const [bookingsOverTime, setBookingsOverTime] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [bookingStatus, setBookingStatus] = useState(null);

  const loadAnalytics = useCallback(
    async (showFullLoader = true) => {
      if (!activeTenant) return;
      const params = getDateRangeParams(dateRange);
      if (showFullLoader) setLoading(true);
      else setRefreshing(true);

      try {
        const [
          kpiRes,
          bookingsRes,
          catRes,
          trendsRes,
          peakRes,
          svcRes,
          provRes,
          statusRes,
        ] = await Promise.allSettled([
          analyticsAPI.getKPIs(params, activeTenant),
          analyticsAPI.getBookingsOverTime(params, activeTenant),
          analyticsAPI.getRevenueByCategory(params, activeTenant),
          analyticsAPI.getRevenueTrends(params, activeTenant),
          analyticsAPI.getPeakHours(params, activeTenant),
          analyticsAPI.getTopServices(params, activeTenant),
          analyticsAPI.getTopProviders(params, activeTenant),
          analyticsAPI.getBookingStatusOverview(params, activeTenant),
        ]);

        const val = (r) =>
          r.status === "fulfilled" ? r.value : null;
        const list = (r) =>
          r.status === "fulfilled"
            ? r.value?.results || r.value || []
            : [];

        if (val(kpiRes)) setKPIs(val(kpiRes));
        setBookingsOverTime(list(bookingsRes));
        setRevenueByCategory(list(catRes));
        setRevenueTrends(list(trendsRes));
        setPeakHours(list(peakRes));
        setTopServices(list(svcRes));
        setTopProviders(list(provRes));
        if (val(statusRes)) setBookingStatus(val(statusRes));
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange, activeTenant]
  );

  useEffect(() => {
    loadAnalytics(true);
  }, [loadAnalytics]);

  // ── Derived data ─────────────────────────────────────────────────────────

  // Revenue by category — safely unwrap multilingual category names
  const categoryData = useMemo(
    () =>
      revenueByCategory.map((d) => ({
        ...d,
        name: toText(d.category, t("analytics.empty.other")),
      })),
    [revenueByCategory, t]
  );

  // Peak hours — format hour number to readable label
  const peakHoursData = useMemo(
    () =>
      peakHours.map((d) => ({
        ...d,
        label:
          d.hour != null
            ? `${d.hour > 12 ? d.hour - 12 : d.hour || 12} ${d.hour >= 12 ? t("analytics.time.pm") : t("analytics.time.am")}`
            : "?",
      })),
    [peakHours, t]
  );

  // Booking status cards
  const statusCards = useMemo(() => {
    if (!bookingStatus) return [];
    return Object.entries(bookingStatus)
      .filter(([, count]) => typeof count === "number" && count > 0)
      .map(([key, value]) => ({
        key,
        label: t(STATUS_LABEL_KEYS[key] || key),
        value,
        color: STATUS_COLORS[key] || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [bookingStatus, t]);

  const statusTotal = useMemo(
    () => statusCards.reduce((s, d) => s + d.value, 0),
    [statusCards]
  );

  // KPI cards config
  const kpiCards = useMemo(() => [
    {
      title: t("analytics.kpi.totalBookings"),
      value: formatNumber(kpis?.total_bookings),
      change: kpis?.bookings_change,
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: t("analytics.kpi.revenue"),
      value: formatCurrency(kpis?.total_revenue || 0),
      change: kpis?.revenue_change,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      title: t("analytics.kpi.conversionRate"),
      value: `${kpis?.conversion_rate?.toFixed(1) || "0"}%`,
      change: kpis?.conversion_change,
      icon: Target,
      color: "from-[#8B1E3F] to-[#6B1630]",
    },
    {
      title: t("analytics.kpi.avgRating"),
      value: kpis?.avg_rating?.toFixed(2) || "—",
      change: kpis?.rating_change,
      icon: Star,
      color: "from-amber-500 to-amber-600",
    },
  ], [t, kpis]);

  // ── Guards ───────────────────────────────────────────────────────────────

  if (requiresOnboarding || loadingUser) return null;

  // ── Skeleton helpers ─────────────────────────────────────────────────────

  const SkeletonKPI = () => (
    <div className="animate-pulse p-6 rounded-xl bg-white border border-[#8B1E3F]/10">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div className="w-16 h-6 rounded-full bg-gray-200" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-20" />
    </div>
  );

  const SkeletonChart = () => (
    <div className="animate-pulse bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
      <div className="h-5 bg-gray-200 rounded w-40 mb-6" />
      <div className="flex items-center justify-center" style={{ height: 320 }}>
        <Loader2 className="w-6 h-6 text-[#8B1E3F]/30 animate-spin" />
      </div>
    </div>
  );

  const SkeletonList = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-[72px] bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 bg-[#FAF5F7] min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("analytics.title")}
          </h1>
          <p className="text-gray-600 mt-1">
            {t("analytics.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none bg-white cursor-pointer hover:border-[#8B1E3F]/50 transition-colors shadow-sm"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {t(r.labelKey)}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadAnalytics(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-white hover:border-[#8B1E3F]/30 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-white hover:border-[#8B1E3F]/30 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            {t("analytics.export")}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonKPI key={i} />)
          : kpiCards.map((kpi, index) => {
              const Icon = kpi.icon;
              const isPositive = kpi.change >= 0;
              const hasChange =
                kpi.change !== undefined && kpi.change !== null;

              return (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {hasChange && (
                      <div
                        className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${
                          isPositive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUp className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" />
                        )}
                        {formatPercent(kpi.change)}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {kpi.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {kpi.title}
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Charts Row 1: Bookings Over Time + Revenue by Category ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Over Time */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {t("analytics.chart.bookingsOverTime")}
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-[#8B1E3F]" />
                <span className="text-gray-600">{t("analytics.chart.bookings")}</span>
              </div>
            </div>
            {/* FIX: explicit style height on wrapper — prevents ResponsiveContainer -1 error */}
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bookingsOverTime}>
                  <defs>
                    <linearGradient
                      id="colorBookings"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8B1E3F"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="#8B1E3F"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={(props) => (
                      <MaroonTooltip
                        {...props}
                        formatter={(v) => `${v} ${t("analytics.chart.bookings")}`}
                      />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name={t("analytics.chart.bookings")}
                    stroke="#8B1E3F"
                    fill="url(#colorBookings)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue by Category – Donut */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {t("analytics.chart.revenueByCategory")}
              </h2>
            </div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="name"
                  >
                    {categoryData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #8B1E3F",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => [
                      formatCurrency(value),
                      t("analytics.kpi.revenue"),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {categoryData.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {categoryData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#8B1E3F]/5 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {categoryData.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">
                {t("analytics.empty.noCategoryData")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Charts Row 2: Revenue Trends + Peak Hours ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {t("analytics.chart.revenueTrends")}
              </h2>
            </div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrends}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <Tooltip
                    content={(props) => (
                      <MaroonTooltip
                        {...props}
                        formatter={(v) => formatCurrency(v)}
                      />
                    )}
                  />
                  <Bar
                    dataKey="revenue"
                    name={t("analytics.kpi.revenue")}
                    fill="#8B1E3F"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Peak Hours */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {t("analytics.chart.peakHours")}
              </h2>
              <span className="text-sm text-gray-600">
                {t("analytics.chart.avgBookingsPerHour")}
              </span>
            </div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                  <Tooltip
                    content={(props) => (
                      <MaroonTooltip
                        {...props}
                        formatter={(v) => `${v} ${t("analytics.chart.bookings")}`}
                      />
                    )}
                  />
                  <Bar
                    dataKey="count"
                    name={t("analytics.chart.bookings")}
                    fill="#A8345C"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Top Performers ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {t("analytics.chart.topServices")}
            </h2>
            <button onClick={() => router.push('/dashboard/services')} className="px-4 py-2 text-sm font-medium text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors">
              {t("analytics.viewAll")}
            </button>
          </div>

          {loading ? (
            <SkeletonList />
          ) : !topServices?.length ? (
            <div className="text-center py-8 text-sm text-gray-400">
              {t("analytics.empty.noServiceData")}
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map((service, index) => (
                <div
                  key={service.id || index}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                      <span className="text-white font-bold">
                        {service.rank || index + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      {/* FIX: toText() prevents rendering {en: "..."} objects */}
                      <div className="font-semibold text-gray-900 group-hover:text-[#8B1E3F] transition-colors truncate">
                        {toText(service.name, t("analytics.empty.serviceFallback"))}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {formatNumber(service.bookings_count)} {t("analytics.chart.bookings")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(service.revenue)}
                    </div>
                    {service.avg_rating ? (
                      <div className="flex items-center justify-end gap-1 text-sm text-green-600">
                        <Star className="w-3 h-3 fill-current" />
                        {service.avg_rating.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Providers */}
        <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              {t("analytics.chart.topProviders")}
            </h2>
            <button onClick={() => router.push('/dashboard/providers')} className="px-4 py-2 text-sm font-medium text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors">
              {t("analytics.viewAll")}
            </button>
          </div>

          {loading ? (
            <SkeletonList />
          ) : !topProviders?.length ? (
            <div className="text-center py-8 text-sm text-gray-400">
              {t("analytics.empty.noProviderData")}
            </div>
          ) : (
            <div className="space-y-3">
              {topProviders.map((provider, index) => {
                const name = toText(provider.name, t("analytics.empty.providerFallback"));
                const initials = name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={provider.id || index}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
                        {initials || "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 group-hover:text-[#8B1E3F] transition-colors truncate">
                          {name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {toText(provider.specialty, "")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(provider.revenue)}
                      </div>
                      {provider.avg_rating ? (
                        <div className="flex items-center justify-end gap-1 text-sm text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          {provider.avg_rating.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Booking Status Overview ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {t("analytics.chart.bookingStatus")}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : statusCards.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            {t("analytics.empty.noStatusData")}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusCards.slice(0, 8).map((status) => (
              <div
                key={status.key}
                className="p-6 rounded-xl border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all bg-white group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${status.color}20` }}
                >
                  <CheckCircle
                    className="w-6 h-6"
                    style={{ color: status.color }}
                  />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatNumber(status.value)}
                </div>
                <div className="text-sm text-gray-600">{status.label}</div>
                {statusTotal > 0 && (
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(status.value / statusTotal) * 100}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




// "use client";

// import Cookies from "js-cookie";
// import { useState, useEffect, useCallback, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import { useApp } from "@/contexts/AppContext";
// import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
// import {
//   AreaChart,
//   Area,
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
// } from "recharts";
// import {
//   Calendar,
//   DollarSign,
//   Star,
//   ArrowUp,
//   ArrowDown,
//   Download,
//   RefreshCw,
//   Loader2,
//   Target,
//   CheckCircle,
// } from "lucide-react";
// import { apiFetch } from "@/lib/apiClient";
// // ─── API Layer ───────────────────────────────────────────────────────────────

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// async function fetchWithAuth(endpoint, activeTenant, options = {}) {
//   const token = Cookies.get("access_token");
//   if (!activeTenant) throw new Error("Tenant not ready");

//   const res = await fetch(`${API_BASE}${endpoint}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//       "X-Tenant": activeTenant,
//       ...options.headers,
//     },
//   });

//   let data = null;
//   try {
//     data = await res.json();
//   } catch {
//     data = null;
//   }

//   if (!res.ok) {
//     const message =
//       data?.detail || data?.message || `Request failed: ${res.status}`;
//     const error = new Error(message);
//     error.status = res.status;
//     error.data = data;
//     throw error;
//   }

//   return data;
// }

// const analyticsAPI = {
//   getKPIs: (params, t) =>
//     apiFetch(`/api/v1/analytics/kpis/?${new URLSearchParams(params)}`, t),
//   getBookingsOverTime: (params, t) =>
//     apiFetch(
//       `/api/v1/analytics/bookings-over-time/?${new URLSearchParams(params)}`,
//       t
//     ),
//   getRevenueByCategory: (params, t) =>
//     apiFetch(
//       `/api/v1/analytics/revenue-by-category/?${new URLSearchParams(params)}`,
//       t
//     ),
//   getRevenueTrends: (params, t) =>
//     apiFetch(
//       `/api/v1/analytics/revenue-trends/?${new URLSearchParams(params)}`,
//       t
//     ),
//   getPeakHours: (params, t) =>
//     apiFetch(
//       `/api/v1/analytics/peak-hours/?${new URLSearchParams(params)}`,
//       t
//     ),
//   getTopServices: (params, t) =>
//     apiFetch(
//       `/api/v1/analytics/top-services/?${new URLSearchParams(params)}`,
//       t
//     ),
//   getTopProviders: (params, t) =>
//     apiFetch(
//       `/api/v1/analytics/top-providers/?${new URLSearchParams(params)}`,
//       t
//     ),
//   getBookingStatusOverview: (params, t) =>
//     apiFetch(
//       `/api/v1/analytics/booking-status/?${new URLSearchParams(params)}`,
//       t
//     ),
// };

// // ─── Constants ───────────────────────────────────────────────────────────────

// const DATE_RANGES = [
//   { label: "This Week", value: "7d" },
//   { label: "This Month", value: "30d" },
//   { label: "This Quarter", value: "90d" },
//   { label: "Last Month", value: "last_month" },
//   { label: "This Year", value: "this_year" },
// ];

// // Maroon combination palette
// const CHART_COLORS = [
//   "#8B1E3F",
//   "#A8345C",
//   "#10B981",
//   "#F59E0B",
//   "#3B82F6",
//   "#8b5cf6",
//   "#ec4899",
//   "#14b8a6",
// ];

// const STATUS_COLORS = {
//   completed: "#10B981",
//   confirmed: "#8B1E3F",
//   upcoming: "#8B1E3F",
//   in_progress: "#3B82F6",
//   scheduled: "#06b6d4",
//   pending_payment: "#F59E0B",
//   deposit_paid: "#a855f7",
//   paid: "#8b5cf6",
//   cancelled: "#EF4444",
//   refunded: "#f97316",
//   no_show: "#64748b",
// };

// // ─── Utility Helpers ─────────────────────────────────────────────────────────

// /**
//  * FIX: Safely extract display text from a value that may be a multilingual
//  * object like { en: "Haircut", ar: "قص شعر" } — prevents "Objects are not
//  * valid as a React child" error.
//  */
// function toText(val, fallback = "—") {
//   if (val === null || val === undefined) return fallback;
//   if (typeof val === "string") return val;
//   if (typeof val === "number") return String(val);
//   if (typeof val === "object") {
//     return val.en || val.ar || val.ur || Object.values(val)[0] || fallback;
//   }
//   return fallback;
// }

// function formatCurrency(amount) {
//   if (amount == null || isNaN(amount)) return "SAR 0";
//   return new Intl.NumberFormat("en-SA", {
//     style: "currency",
//     currency: "SAR",
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(amount);
// }

// function formatNumber(num) {
//   if (num == null) return "0";
//   if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
//   if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
//   return num.toLocaleString();
// }

// function formatPercent(value) {
//   if (value == null) return "+0%";
//   return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
// }

// function getDateRangeParams(rangeValue) {
//   const now = new Date();
//   const fmt = (d) => d.toISOString().split("T")[0];
//   const daysAgo = (n) => new Date(now - n * 86400000);

//   switch (rangeValue) {
//     case "7d":
//       return { start_date: fmt(daysAgo(7)), end_date: fmt(now) };
//     case "30d":
//       return { start_date: fmt(daysAgo(30)), end_date: fmt(now) };
//     case "90d":
//       return { start_date: fmt(daysAgo(90)), end_date: fmt(now) };
//     case "last_month":
//       return {
//         start_date: fmt(
//           new Date(now.getFullYear(), now.getMonth() - 1, 1)
//         ),
//         end_date: fmt(new Date(now.getFullYear(), now.getMonth(), 0)),
//       };
//     case "this_year":
//       return {
//         start_date: fmt(new Date(now.getFullYear(), 0, 1)),
//         end_date: fmt(now),
//       };
//     default:
//       return { start_date: fmt(daysAgo(30)), end_date: fmt(now) };
//   }
// }

// // ─── Reusable: Maroon Tooltip ────────────────────────────────────────────────

// function MaroonTooltip({ active, payload, label, formatter }) {
//   if (!active || !payload?.length) return null;
//   return (
//     <div className="bg-white text-gray-900 text-xs rounded-lg px-3 py-2 shadow-xl border border-[#8B1E3F]">
//       <p className="text-gray-500 mb-1 font-medium">{label}</p>
//       {payload.map((entry, i) => (
//         <p key={i} className="flex items-center gap-2">
//           <span
//             className="w-2 h-2 rounded-full"
//             style={{ backgroundColor: entry.color }}
//           />
//           <span className="text-gray-600">{entry.name}:</span>
//           <span className="font-semibold">
//             {formatter ? formatter(entry.value) : entry.value}
//           </span>
//         </p>
//       ))}
//     </div>
//   );
// }

// // ─── Main Page Component ─────────────────────────────────────────────────────

// export default function AnalyticsPage() {
//   const { user, loadingUser, requiresOnboarding, activeTenant } = useApp();
//   const router = useRouter();
//   const [dateRange, setDateRange] = useState("30d");
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   useBlockBackNavigation(!!user);

//   useEffect(() => {
//     if (!loadingUser && !user) router.replace("/");
//   }, [loadingUser, user, router]);

//   useEffect(() => {
//     if (requiresOnboarding) router.replace("/auth/onboarding?step=1");
//   }, [requiresOnboarding, router]);

//   // ── Data states ──────────────────────────────────────────────────────────
//   const [kpis, setKPIs] = useState(null);
//   const [bookingsOverTime, setBookingsOverTime] = useState([]);
//   const [revenueByCategory, setRevenueByCategory] = useState([]);
//   const [revenueTrends, setRevenueTrends] = useState([]);
//   const [peakHours, setPeakHours] = useState([]);
//   const [topServices, setTopServices] = useState([]);
//   const [topProviders, setTopProviders] = useState([]);
//   const [bookingStatus, setBookingStatus] = useState(null);

//   const loadAnalytics = useCallback(
//     async (showFullLoader = true) => {
//       if (!activeTenant) return;
//       const params = getDateRangeParams(dateRange);
//       if (showFullLoader) setLoading(true);
//       else setRefreshing(true);

//       try {
//         const [
//           kpiRes,
//           bookingsRes,
//           catRes,
//           trendsRes,
//           peakRes,
//           svcRes,
//           provRes,
//           statusRes,
//         ] = await Promise.allSettled([
//           analyticsAPI.getKPIs(params, activeTenant),
//           analyticsAPI.getBookingsOverTime(params, activeTenant),
//           analyticsAPI.getRevenueByCategory(params, activeTenant),
//           analyticsAPI.getRevenueTrends(params, activeTenant),
//           analyticsAPI.getPeakHours(params, activeTenant),
//           analyticsAPI.getTopServices(params, activeTenant),
//           analyticsAPI.getTopProviders(params, activeTenant),
//           analyticsAPI.getBookingStatusOverview(params, activeTenant),
//         ]);

//         const val = (r) =>
//           r.status === "fulfilled" ? r.value : null;
//         const list = (r) =>
//           r.status === "fulfilled"
//             ? r.value?.results || r.value || []
//             : [];

//         if (val(kpiRes)) setKPIs(val(kpiRes));
//         setBookingsOverTime(list(bookingsRes));
//         setRevenueByCategory(list(catRes));
//         setRevenueTrends(list(trendsRes));
//         setPeakHours(list(peakRes));
//         setTopServices(list(svcRes));
//         setTopProviders(list(provRes));
//         if (val(statusRes)) setBookingStatus(val(statusRes));
//       } catch (err) {
//         console.error("Failed to load analytics:", err);
//       } finally {
//         setLoading(false);
//         setRefreshing(false);
//       }
//     },
//     [dateRange, activeTenant]
//   );

//   useEffect(() => {
//     loadAnalytics(true);
//   }, [loadAnalytics]);

//   // ── Derived data ─────────────────────────────────────────────────────────

//   // Revenue by category — safely unwrap multilingual category names
//   const categoryData = useMemo(
//     () =>
//       revenueByCategory.map((d) => ({
//         ...d,
//         name: toText(d.category, "Other"),
//       })),
//     [revenueByCategory]
//   );

//   // Peak hours — format hour number to readable label
//   const peakHoursData = useMemo(
//     () =>
//       peakHours.map((d) => ({
//         ...d,
//         label:
//           d.hour != null
//             ? `${d.hour > 12 ? d.hour - 12 : d.hour || 12} ${d.hour >= 12 ? "PM" : "AM"}`
//             : "?",
//       })),
//     [peakHours]
//   );

//   // Booking status cards
//   const statusCards = useMemo(() => {
//     if (!bookingStatus) return [];
//     return Object.entries(bookingStatus)
//       .filter(([, count]) => typeof count === "number" && count > 0)
//       .map(([key, value]) => ({
//         key,
//         label: key
//           .replace(/_/g, " ")
//           .replace(/\b\w/g, (c) => c.toUpperCase()),
//         value,
//         color: STATUS_COLORS[key] || "#64748b",
//       }))
//       .sort((a, b) => b.value - a.value);
//   }, [bookingStatus]);

//   const statusTotal = useMemo(
//     () => statusCards.reduce((s, d) => s + d.value, 0),
//     [statusCards]
//   );

//   // ── Guards ───────────────────────────────────────────────────────────────

//   if (requiresOnboarding || loadingUser) return null;

//   // ── Skeleton helpers ─────────────────────────────────────────────────────

//   const SkeletonKPI = () => (
//     <div className="animate-pulse p-6 rounded-xl bg-white border border-[#8B1E3F]/10">
//       <div className="flex items-center justify-between mb-4">
//         <div className="w-12 h-12 rounded-xl bg-gray-200" />
//         <div className="w-16 h-6 rounded-full bg-gray-200" />
//       </div>
//       <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
//       <div className="h-4 bg-gray-100 rounded w-20" />
//     </div>
//   );

//   const SkeletonChart = () => (
//     <div className="animate-pulse bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
//       <div className="h-5 bg-gray-200 rounded w-40 mb-6" />
//       <div className="flex items-center justify-center" style={{ height: 320 }}>
//         <Loader2 className="w-6 h-6 text-[#8B1E3F]/30 animate-spin" />
//       </div>
//     </div>
//   );

//   const SkeletonList = () => (
//     <div className="space-y-3">
//       {[...Array(5)].map((_, i) => (
//         <div key={i} className="h-[72px] bg-gray-100 rounded-xl animate-pulse" />
//       ))}
//     </div>
//   );

//   // ── KPI card config ──────────────────────────────────────────────────────

//   const kpiCards = [
//     {
//       title: "Total Bookings",
//       value: formatNumber(kpis?.total_bookings),
//       change: kpis?.bookings_change,
//       icon: Calendar,
//       color: "from-blue-500 to-blue-600",
//     },
//     {
//       title: "Revenue",
//       value: formatCurrency(kpis?.total_revenue || 0),
//       change: kpis?.revenue_change,
//       icon: DollarSign,
//       color: "from-green-500 to-green-600",
//     },
//     {
//       title: "Conversion Rate",
//       value: `${kpis?.conversion_rate?.toFixed(1) || "0"}%`,
//       change: kpis?.conversion_change,
//       icon: Target,
//       color: "from-[#8B1E3F] to-[#6B1630]",
//     },
//     {
//       title: "Avg. Rating",
//       value: kpis?.avg_rating?.toFixed(2) || "—",
//       change: kpis?.rating_change,
//       icon: Star,
//       color: "from-amber-500 to-amber-600",
//     },
//   ];

//   // ── Render ───────────────────────────────────────────────────────────────

//   return (
//     <div className="space-y-6 p-6 bg-[#FAF5F7] min-h-screen">
//       {/* ── Header ─────────────────────────────────────────────────────── */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">
//             Analytics & Insights
//           </h1>
//           <p className="text-gray-600 mt-1">
//             Track your business performance and metrics
//           </p>
//         </div>
//         <div className="flex items-center gap-3">
//           <select
//             value={dateRange}
//             onChange={(e) => setDateRange(e.target.value)}
//             className="px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none bg-white cursor-pointer hover:border-[#8B1E3F]/50 transition-colors shadow-sm"
//           >
//             {DATE_RANGES.map((r) => (
//               <option key={r.value} value={r.value}>
//                 {r.label}
//               </option>
//             ))}
//           </select>

//           <button
//             onClick={() => loadAnalytics(false)}
//             disabled={refreshing}
//             className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-white hover:border-[#8B1E3F]/30 transition-all shadow-sm disabled:opacity-50"
//           >
//             <RefreshCw
//               className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
//             />
//           </button>

//           <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-white hover:border-[#8B1E3F]/30 transition-all shadow-sm">
//             <Download className="w-4 h-4" />
//             Export
//           </button>
//         </div>
//       </div>

//       {/* ── KPI Cards ──────────────────────────────────────────────────── */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {loading
//           ? [...Array(4)].map((_, i) => <SkeletonKPI key={i} />)
//           : kpiCards.map((kpi, index) => {
//               const Icon = kpi.icon;
//               const isPositive = kpi.change >= 0;
//               const hasChange =
//                 kpi.change !== undefined && kpi.change !== null;

//               return (
//                 <div
//                   key={index}
//                   className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all duration-300 group"
//                 >
//                   <div className="flex items-center justify-between mb-4">
//                     <div
//                       className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
//                     >
//                       <Icon className="w-6 h-6 text-white" />
//                     </div>
//                     {hasChange && (
//                       <div
//                         className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${
//                           isPositive
//                             ? "bg-green-100 text-green-700"
//                             : "bg-red-100 text-red-700"
//                         }`}
//                       >
//                         {isPositive ? (
//                           <ArrowUp className="w-3.5 h-3.5" />
//                         ) : (
//                           <ArrowDown className="w-3.5 h-3.5" />
//                         )}
//                         {formatPercent(kpi.change)}
//                       </div>
//                     )}
//                   </div>
//                   <div className="text-2xl font-bold text-gray-900 mb-1">
//                     {kpi.value}
//                   </div>
//                   <div className="text-sm text-gray-600 font-medium">
//                     {kpi.title}
//                   </div>
//                 </div>
//               );
//             })}
//       </div>

//       {/* ── Charts Row 1: Bookings Over Time + Revenue by Category ────── */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Bookings Over Time */}
//         {loading ? (
//           <SkeletonChart />
//         ) : (
//           <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-lg font-bold text-gray-900">
//                 Bookings Over Time
//               </h2>
//               <div className="flex items-center gap-2 text-sm">
//                 <div className="w-3 h-3 rounded-full bg-[#8B1E3F]" />
//                 <span className="text-gray-600">Bookings</span>
//               </div>
//             </div>
//             {/* FIX: explicit style height on wrapper — prevents ResponsiveContainer -1 error */}
//             <div style={{ width: "100%", height: 320 }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={bookingsOverTime}>
//                   <defs>
//                     <linearGradient
//                       id="colorBookings"
//                       x1="0"
//                       y1="0"
//                       x2="0"
//                       y2="1"
//                     >
//                       <stop
//                         offset="0%"
//                         stopColor="#8B1E3F"
//                         stopOpacity={0.3}
//                       />
//                       <stop
//                         offset="100%"
//                         stopColor="#8B1E3F"
//                         stopOpacity={0}
//                       />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     stroke="#f0f0f0"
//                   />
//                   <XAxis
//                     dataKey="date"
//                     stroke="#9CA3AF"
//                     style={{ fontSize: "12px" }}
//                   />
//                   <YAxis
//                     stroke="#9CA3AF"
//                     style={{ fontSize: "12px" }}
//                     allowDecimals={false}
//                   />
//                   <Tooltip
//                     content={(props) => (
//                       <MaroonTooltip
//                         {...props}
//                         formatter={(v) => `${v} bookings`}
//                       />
//                     )}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="count"
//                     name="Bookings"
//                     stroke="#8B1E3F"
//                     fill="url(#colorBookings)"
//                     strokeWidth={2}
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         )}

//         {/* Revenue by Category – Donut */}
//         {loading ? (
//           <SkeletonChart />
//         ) : (
//           <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-lg font-bold text-gray-900">
//                 Revenue by Category
//               </h2>
//             </div>
//             <div style={{ width: "100%", height: 320 }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={categoryData}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={60}
//                     outerRadius={100}
//                     paddingAngle={5}
//                     dataKey="revenue"
//                     nameKey="name"
//                   >
//                     {categoryData.map((_, i) => (
//                       <Cell
//                         key={i}
//                         fill={CHART_COLORS[i % CHART_COLORS.length]}
//                       />
//                     ))}
//                   </Pie>
//                   <Tooltip
//                     contentStyle={{
//                       backgroundColor: "white",
//                       border: "1px solid #8B1E3F",
//                       borderRadius: "8px",
//                       boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
//                     }}
//                     formatter={(value) => [
//                       formatCurrency(value),
//                       "Revenue",
//                     ]}
//                   />
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//             {categoryData.length > 0 && (
//               <div className="grid grid-cols-2 gap-4 mt-4">
//                 {categoryData.map((item, index) => (
//                   <div
//                     key={index}
//                     className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#8B1E3F]/5 transition-colors"
//                   >
//                     <div
//                       className="w-3 h-3 rounded-full flex-shrink-0"
//                       style={{
//                         backgroundColor:
//                           CHART_COLORS[index % CHART_COLORS.length],
//                       }}
//                     />
//                     <div className="flex-1 min-w-0">
//                       <div className="text-sm font-semibold text-gray-900 truncate">
//                         {item.name}
//                       </div>
//                       <div className="text-xs text-gray-600">
//                         {formatCurrency(item.revenue)}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//             {categoryData.length === 0 && (
//               <div className="text-center py-8 text-sm text-gray-400">
//                 No category data yet
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* ── Charts Row 2: Revenue Trends + Peak Hours ────────────────── */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Revenue Trends */}
//         {loading ? (
//           <SkeletonChart />
//         ) : (
//           <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-lg font-bold text-gray-900">
//                 Revenue Trends
//               </h2>
//             </div>
//             <div style={{ width: "100%", height: 320 }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={revenueTrends}>
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     stroke="#f0f0f0"
//                   />
//                   <XAxis
//                     dataKey="date"
//                     stroke="#9CA3AF"
//                     style={{ fontSize: "12px" }}
//                   />
//                   <YAxis
//                     stroke="#9CA3AF"
//                     style={{ fontSize: "12px" }}
//                     tickFormatter={(v) => formatCurrency(v)}
//                   />
//                   <Tooltip
//                     content={(props) => (
//                       <MaroonTooltip
//                         {...props}
//                         formatter={(v) => formatCurrency(v)}
//                       />
//                     )}
//                   />
//                   <Bar
//                     dataKey="revenue"
//                     name="Revenue"
//                     fill="#8B1E3F"
//                     radius={[8, 8, 0, 0]}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         )}

//         {/* Peak Hours */}
//         {loading ? (
//           <SkeletonChart />
//         ) : (
//           <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-lg font-bold text-gray-900">
//                 Peak Hours
//               </h2>
//               <span className="text-sm text-gray-600">
//                 Average bookings per hour
//               </span>
//             </div>
//             <div style={{ width: "100%", height: 320 }}>
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={peakHoursData}>
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     stroke="#f0f0f0"
//                   />
//                   <XAxis
//                     dataKey="label"
//                     stroke="#9CA3AF"
//                     style={{ fontSize: "12px" }}
//                   />
//                   <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
//                   <Tooltip
//                     content={(props) => (
//                       <MaroonTooltip
//                         {...props}
//                         formatter={(v) => `${v} bookings`}
//                       />
//                     )}
//                   />
//                   <Bar
//                     dataKey="count"
//                     name="Bookings"
//                     fill="#A8345C"
//                     radius={[8, 8, 0, 0]}
//                   />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* ── Top Performers ─────────────────────────────────────────────── */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Top Services */}
//         <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-lg font-bold text-gray-900">
//               Top Services
//             </h2>
//             <button onClick={() => router.push('/dashboard/services')} className="px-4 py-2 text-sm font-medium text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors">
//               View All
//             </button>
        
//           </div>

//           {loading ? (
//             <SkeletonList />
//           ) : !topServices?.length ? (
//             <div className="text-center py-8 text-sm text-gray-400">
//               No service data yet
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {topServices.map((service, index) => (
//                 <div
//                   key={service.id || index}
//                   className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all group cursor-pointer"
//                 >
//                   <div className="flex items-center gap-4 min-w-0">
//                     <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
//                       <span className="text-white font-bold">
//                         {service.rank || index + 1}
//                       </span>
//                     </div>
//                     <div className="min-w-0">
//                       {/* FIX: toText() prevents rendering {en: "..."} objects */}
//                       <div className="font-semibold text-gray-900 group-hover:text-[#8B1E3F] transition-colors truncate">
//                         {toText(service.name, "Service")}
//                       </div>
//                       <div className="text-sm text-gray-600 flex items-center gap-1">
//                         <Calendar className="w-3 h-3 flex-shrink-0" />
//                         {formatNumber(service.bookings_count)} bookings
//                       </div>
//                     </div>
//                   </div>
//                   <div className="text-right flex-shrink-0 ml-4">
//                     <div className="font-bold text-gray-900">
//                       {formatCurrency(service.revenue)}
//                     </div>
//                     {service.avg_rating ? (
//                       <div className="flex items-center justify-end gap-1 text-sm text-green-600">
//                         <Star className="w-3 h-3 fill-current" />
//                         {service.avg_rating.toFixed(1)}
//                       </div>
//                     ) : (
//                       <span className="text-xs text-gray-300">—</span>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Top Providers */}
//         <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-lg font-bold text-gray-900">
//               Top Providers
//             </h2>
//             <button onClick={() => router.push('/dashboard/providers')} className="px-4 py-2 text-sm font-medium text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors">
//               View All
//             </button>
//           </div>

//           {loading ? (
//             <SkeletonList />
//           ) : !topProviders?.length ? (
//             <div className="text-center py-8 text-sm text-gray-400">
//               No provider data yet
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {topProviders.map((provider, index) => {
//                 const name = toText(provider.name, "Provider");
//                 const initials = name
//                   .split(" ")
//                   .map((w) => w[0])
//                   .join("")
//                   .slice(0, 2)
//                   .toUpperCase();

//                 return (
//                   <div
//                     key={provider.id || index}
//                     className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all group cursor-pointer"
//                   >
//                     <div className="flex items-center gap-4 min-w-0">
//                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
//                         {initials || "?"}
//                       </div>
//                       <div className="min-w-0">
//                         <div className="font-semibold text-gray-900 group-hover:text-[#8B1E3F] transition-colors truncate">
//                           {name}
//                         </div>
//                         <div className="text-sm text-gray-600">
//                           {toText(provider.specialty, "")}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="text-right flex-shrink-0 ml-4">
//                       <div className="font-bold text-gray-900">
//                         {formatCurrency(provider.revenue)}
//                       </div>
//                       {provider.avg_rating ? (
//                         <div className="flex items-center justify-end gap-1 text-sm text-amber-500">
//                           <Star className="w-3 h-3 fill-current" />
//                           {provider.avg_rating.toFixed(1)}
//                         </div>
//                       ) : (
//                         <span className="text-xs text-gray-300">—</span>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── Booking Status Overview ──────────────────────────────────── */}
//       <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-lg font-bold text-gray-900">
//             Booking Status Overview
//           </h2>
//         </div>

//         {loading ? (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {[...Array(4)].map((_, i) => (
//               <div
//                 key={i}
//                 className="h-36 bg-gray-100 rounded-xl animate-pulse"
//               />
//             ))}
//           </div>
//         ) : statusCards.length === 0 ? (
//           <div className="text-center py-8 text-sm text-gray-400">
//             No booking status data yet
//           </div>
//         ) : (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             {statusCards.slice(0, 8).map((status) => (
//               <div
//                 key={status.key}
//                 className="p-6 rounded-xl border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all bg-white group"
//               >
//                 <div
//                   className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
//                   style={{ backgroundColor: `${status.color}20` }}
//                 >
//                   <CheckCircle
//                     className="w-6 h-6"
//                     style={{ color: status.color }}
//                   />
//                 </div>
//                 <div className="text-2xl font-bold text-gray-900 mb-1">
//                   {formatNumber(status.value)}
//                 </div>
//                 <div className="text-sm text-gray-600">{status.label}</div>
//                 {statusTotal > 0 && (
//                   <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full rounded-full transition-all duration-500"
//                       style={{
//                         width: `${(status.value / statusTotal) * 100}%`,
//                         backgroundColor: status.color,
//                       }}
//                     />
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }