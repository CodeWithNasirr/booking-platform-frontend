"use client";

import {
  Calendar,
  DollarSign,
  UsersRound,
  Package,
  TrendingUp,
  TrendingDown,
  Globe,
  Loader2
} from "lucide-react";
import React, { useState, useEffect } from "react";

import { Button } from "@/app/ui/button";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import { getTenantWebsiteUrl } from "@/lib/tenantUrl";
import Cookies from "js-cookie";

import { useTenantPermission } from "@/lib/useTenantPermission";
import useRenderTrace from "@/lib/useRenderTrace";


export default function DashboardHome() {
  useRenderTrace("DashboardHome(tenant)");
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const token = Cookies.get("access_token");

  const { allowed: canViewServices } = useTenantPermission("services.view");
  const { allowed: canViewBookings } = useTenantPermission("bookings.view");
  const { allowed: canViewProviders } = useTenantPermission("providers.view");

  const { allowed: canViewCalendar } = useTenantPermission("calendar.view");

  const router = useRouter();
  const {
    user,
    loadingUser,
    tenants,
    requiresOnboarding,
    activeTenant,
    t, isRTL,hasProviders,language,
  } = useApp();

  const url = getTenantWebsiteUrl(tenants);

  const tenantId = activeTenant;

  useBlockBackNavigation(!!user);

  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "X-Tenant": tenantId,
        ...(options.headers || {}),
      },
    credentials: "include", 

    });
  };

  const fetchDashboardData = async () => {
    const [overview, revenue, recent] =
      await Promise.all([
        apiFetch(
          "/api/v1/dashboard/overview/",
          tenantId
        ),

        apiFetch(
          "/api/v1/dashboard/revenue/",
          tenantId
        ),

        apiFetch(
          "/api/v1/dashboard/recent-bookings/",
          tenantId
        ),
      ]);

    return {
      overview,
      revenue,
      recent,
    };
  };





  /* DATA FETCHING */
  useEffect(() => {
  
    if (!user || !tenantId) return;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        console.log("[AUTH-TRACE] tenant dashboard fetch START");

        const { overview, revenue, recent } = await fetchDashboardData();
        console.log("[AUTH-TRACE] tenant dashboard fetch SETTLED");

        setStats([
          {
            title: t("dashboard.stats.totalBookings"),
            value: overview.total_bookings?.toLocaleString() || "0",
            change: overview.bookings_change || "+0%",
            isPositive: !overview.bookings_change?.includes("-"),
            icon: Calendar,
            color: "from-[#8B1E3F] to-[#A8325A]",
          },
          {
            title: t("dashboard.stats.totalRevenue"),
            value: new Intl.NumberFormat("en-SA", {
              style: "currency",
              currency: overview.currency || "SAR",
              maximumFractionDigits: 0,
            }).format(overview.revenue || 0),
            change: overview.revenue_change || "+0%",
            isPositive: !overview.revenue_change?.includes("-"),
            icon: DollarSign,
            color: "from-[#8B1E3F] to-[#A8325A]",
          },
          {
            title: t("dashboard.stats.totalCustomers"),
            value: overview.active_customers?.toLocaleString() || "0",
            change: overview.customers_change || "+0%",
            isPositive: !overview.customers_change?.includes("-"),
            icon: UsersRound,
            color: "from-[#8B1E3F] to-[#A8325A]",
          },
          {
            title: t("dashboard.stats.activeServices"),
            value: overview.active_services?.toString() || "0",
            change: overview.services_change || "+0",
            isPositive: !overview.services_change?.includes("-"),
            icon: Package,
            color: "from-[#8B1E3F] to-[#A8325A]",
          },
        ]);

        setRevenueData(
          revenue.map((r) => ({
            day: new Date(r.day).toLocaleDateString("en-US", { weekday: "short" }),
            bookings: r.bookings,
          }))
        );

        setRecentBookings(recent);
        setLastUpdated(new Date());
      } catch (e) {
        console.error(e);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user, tenantId,language]);


  // NOTE: auth + onboarding are enforced ONCE by <AuthGate> in the layout.
  // The old in-page guards here (redirect to "/" on a transient !user, and a
  // duplicate onboarding redirect) fought AuthGate and produced the
  // /dashboard → / → /auth/login bounce — DashboardHome mounting on a brief
  // null-user render fired router.replace("/"). Removed; AuthGate is the
  // single source of truth.

  /* REFRESH HANDLER */
  const handleRefresh = async () => {
    if (loading) return;

    try {
      setLoading(true);
      const { overview, revenue, recent } = await fetchDashboardData();
      // reuse same setters
    } catch {
      setError("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };


  /* DEFAULT STATS FOR LOADING STATE */
 const defaultStats = [
  {
    title: t("dashboard.stats.totalBookings"),
    value: "...",
    change: "+0%",
    isPositive: true,
    icon: Calendar,
    color: "from-[#8B1E3F] to-[#A8325A]",
  },
  {
    title: t("dashboard.stats.totalRevenue"),
    value: "...",
    change: "+0%",
    isPositive: true,
    icon: DollarSign,
    color: "from-[#8B1E3F] to-[#A8325A]",
  },
  {
    title: t("dashboard.stats.totalCustomers"),
    value: "...",
    change: "+0%",
    isPositive: true,
    icon: UsersRound,
    color: "from-[#8B1E3F] to-[#A8325A]",
  },
  {
    title: t("dashboard.stats.activeServices"),
    value: "...",
    change: "+0",
    isPositive: true,
    icon: Package,
    color: "from-[#8B1E3F] to-[#A8325A]",
  },
  ];


  const displayStats = stats || defaultStats;

  return (
    <div className="space-y-6">

      {/* ================= WELCOME ================= */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#A8325A] text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("dashboard.welcome")}</h1>
            {lastUpdated && (
              <p className="text-rose-200 text-sm mt-1">
                {t("dashboard.lastUpdated")}: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
              title={t("dashboard.refresh")}
            >
              <Loader2 className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            
            <Link
              href={url ?? "#"}
              target="_blank"
              className="inline-flex items-center bg-white text-[#8B1E3F] hover:bg-rose-50 px-4 py-2 rounded-lg text-sm font-medium w-fit transition"
            >
              <Globe className="w-4 h-4 mr-2" />
              {t("dashboard.visitWebsite")}
            </Link>
          </div>
        </div>

        <p className="text-rose-100 mt-2">
         {t("dashboard.todaySummary")}
        </p>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => {
          const Icon = stat.icon;
          const isLoading = !stats && loading;
          
          return (
            <div
              key={index}
              className={`p-5 sm:p-6 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition min-h-[140px] ${isLoading ? "animate-pulse opacity-70" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.title}</div>
            </div>
          );
        })}
      </div>

      {/* ================= CHART ================= */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("dashboard.weeklyOverview")}
          </h2>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
        </div>

        <div className={`${loading && revenueData.length === 0 ? "opacity-50" : ""}`}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData.length > 0 ? revenueData : [
              { day: "Mon", bookings: 0 },
              { day: "Tue", bookings: 0 },
              { day: "Wed", bookings: 0 },
              { day: "Thu", bookings: 0 },
              { day: "Fri", bookings: 0 },
              { day: "Sat", bookings: 0 },
              { day: "Sun", bookings: 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis className="hidden sm:block" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#fff", 
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#8B1E3F"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= RECENT BOOKINGS ================= */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("dashboard.recentBookings")}
            </h2>
            {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
          </div>

          {canViewBookings && (
          <Link href="/dashboard/bookings">
            <Button variant="outline" size="sm">
             {t("dashboard.viewAll")}
            </Button>
          </Link>
          )}

        </div>

        <div className="space-y-4">
          {recentBookings.length === 0 && loading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-gray-200 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-gray-200 rounded"></div>
                    <div className="w-24 h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
              </div>
            ))
          ) : recentBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
             {t("dashboard.noBookings")}
            </div>
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-gray-200 hover:bg-rose-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B1E3F] to-[#A8325A] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>

                  <div>
                    <div className="font-medium text-gray-900">
                      {booking.customer}
                    </div>
                    <div className="text-sm text-gray-600">
                      {booking.service}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end sm:gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.time}
                    </div>
                    <div className="text-sm text-gray-600">
                      {booking.currency} {booking.amount}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : booking.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : booking.status === "scheduled"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                  {t(`dashboard.booking.${booking.status}`)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {canViewServices && (
          <Link href="/dashboard/services" className="p-5 sm:p-6 rounded-xl bg-white border border-gray-200 hover:shadow-lg text-center active:scale-[0.98] transition group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center mx-auto mb-3 transition">
              <Package className="w-8 h-8 text-[#8B1E3F]" />
            </div>
            <div className="font-medium text-gray-900"> {t("dashboard.manageServices")}</div>
          <div className="text-sm text-gray-600">{t("dashboard.manageServicesDesc")}</div>
        </Link>
        )}

        {canViewProviders && hasProviders && (
          <Link href="/dashboard/providers" className="p-5 sm:p-6 rounded-xl bg-white border border-gray-200 hover:shadow-lg text-center active:scale-[0.98] transition group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center mx-auto mb-3 transition">
              <UsersRound className="w-8 h-8 text-[#8B1E3F]" />
            </div>
            <div className="font-medium text-gray-900">{t("dashboard.manageStaff")}</div>
            <div className="text-sm text-gray-600">{t("dashboard.manageStaffDesc")}</div>
          </Link>
        )}

         {/* Individual owners: My Schedule (replaces Manage Staff) */}
        {!hasProviders && (
          <Link href="/dashboard/schedule" className="p-5 sm:p-6 rounded-xl bg-white border border-gray-200 hover:shadow-lg text-center active:scale-[0.98] transition group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center mx-auto mb-3 transition">
              <Calendar className="w-8 h-8 text-[#8B1E3F]" />
            </div>
            <div className="font-medium text-gray-900">{t("dashboard.mySchedule") || "My Schedule"}</div>
            <div className="text-sm text-gray-600">{t("dashboard.myScheduleDesc") || "Manage your availability"}</div>
          </Link>
        )}

        {canViewCalendar && (
          <Link href="/dashboard/calendar" className="p-5 sm:p-6 rounded-xl bg-white border border-gray-200 hover:shadow-lg text-center active:scale-[0.98] transition group">
            <div className="w-12 h-12 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center mx-auto mb-3 transition">
              <Calendar className="w-8 h-8 text-[#8B1E3F]" />
            </div>
            <div className="font-medium text-gray-900"> {t("dashboard.viewCalendar")}</div>
            <div className="text-sm text-gray-600">{t("dashboard.viewCalendarDesc")}</div>
          </Link>
        )}
      </div>
    </div>
  );
}