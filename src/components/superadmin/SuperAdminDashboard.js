"use client";

import React, { useState, useEffect } from "react";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import { fetchPlatformDashboard } from "@/lib/platformApi";
import {
  Users,
  DollarSign,
  Package,
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useTranslation } from "@/lib/t";

// Chart wrapper to prevent hydration issues
const ChartContainer = ({ children, height = 300 }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        style={{ height: `${height}px`, width: "100%" }}
        className="flex items-center justify-center bg-gray-50 rounded-lg"
      >
        <div className="animate-pulse text-gray-400 text-sm">Loading chart…</div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px`, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
};

const MAROON = "#8B1E3F";


export default function SuperAdminDashboard() {
  const { hasPermission, platform } = useSuperAdmin();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();


  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchPlatformDashboard();
        if (!cancelled) setDashData(data);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);


  const PIE_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];

  // ── Build stat cards from real data (with fallbacks) ─────────
 const tenantStats = dashData?.tenants || {};
  const employeeStats = dashData?.employees || {};

  // Revenue object
  const revenueObject = dashData?.revenue || {};
  const revenueData = revenueObject?.growth || [];

  // Current MRR
  const currentMRR = revenueObject?.current_mrr || null;

  // Plan distribution
  const rawPlanDistribution = dashData?.plan_distribution || [];



  
  const planDistribution = rawPlanDistribution.map((plan, index) => ({
    ...plan,
    color: PIE_COLORS[index % PIE_COLORS.length],
  }));

  const stats = [
    {
      title: t("superadmin.stats.total_tenants"),
      value: tenantStats.total ?? "—",
      change: "+12.5%",
      isPositive: true,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      visible: hasPermission("tenants.view"),
    },
    {
      title: t("superadmin.stats.active_tenants"),
      value: tenantStats.active ?? "—",
      change: "+8.1%",
      isPositive: true,
      icon: Package,
      color: "from-green-500 to-green-600",
      visible: hasPermission("tenants.view"),
    },
    {
      title: t("superadmin.stats.platform_employees"),
      value: employeeStats.active ?? "—",
      change: "",
      isPositive: true,
      icon: ShieldCheck,
      color: "from-purple-500 to-purple-600",
      visible: hasPermission("employees.view"),
    },
   {
    title: t("superadmin.stats.monthly_revenue"),
    value: currentMRR ? `${currentMRR}` : "—",
    change: "",
    isPositive: true,
    icon: DollarSign,
    color: "from-emerald-500 to-emerald-600",
    visible: hasPermission("analytics.view_revenue"),
  },
  ];

  // Static demo data for charts (replace with real data when endpoints exist)
  // const revenueData = [
  //   { month: "Jan", revenue: 45000 },
  //   { month: "Feb", revenue: 52000 },
  //   { month: "Mar", revenue: 61000 },
  //   { month: "Apr", revenue: 73000 },
  //   { month: "May", revenue: 89000 },
  //   { month: "Jun", revenue: 124580 },
  // ];

  // const planDistribution = [
  //   { name: "Starter", value: 450, color: "#3B82F6" },
  //   { name: "Professional", value: 380, color: "#8B5CF6" },
  //   { name: "Business", value: 220, color: "#10B981" },
  //   { name: "Enterprise", value: 39, color: "#F59E0B" },
  // ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Welcome banner ─────────────────────────────────── */}
      <div
        className="p-6 rounded-xl text-white"
        style={{
          background: `linear-gradient(135deg, ${MAROON} 0%, #6B1631 100%)`,
        }}
      >
        <h2 className="text-xl font-semibold">
         {t("superadmin.dashboard.welcome_back")} {platform?.role_display ? `, ${platform.role_display}` : ""}
        </h2>
        <p className="text-white/70 text-sm mt-1">
          {t("superadmin.dashboard.subtitle")}

        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats
          .filter((s) => s.visible)
          .map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {stat.change && (
                    <div
                      className={`flex items-center gap-1 text-sm ${
                        stat.isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{stat.change}</span>
                    </div>
                  )}
                </div>
                <div className="text-3xl text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.title}</div>
              </div>
            );
          })}
      </div>

      {/* ── Charts ─────────────────────────────────────────── */}
      {hasPermission("analytics.view_revenue") && revenueData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="p-6 rounded-xl bg-white border border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl text-gray-900">{t("superadmin.charts.revenue_growth")}</h2>
              <p className="text-sm text-gray-600">{t("superadmin.charts.last_6_months")}</p>
            </div>
            <ChartContainer height={300}>
              <LineChart data={revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={MAROON}
                  strokeWidth={3}
                  dot={{ fill: MAROON, r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </div>

          {/* Plan Distribution */}
          <div className="p-6 rounded-xl bg-white border border-gray-200">
            <div className="mb-6">
              <h2 className="text-xl text-gray-900">{t("superadmin.charts.plan_distribution")}</h2>
              <p className="text-sm text-gray-600">{t("superadmin.charts.active_subscriptions")}</p>
            </div>
            <div className="flex items-center gap-8" style={{ height: "250px" }}>
              <div className="w-1/2 h-full">
                <ChartContainer height={250}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {planDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="flex-1 space-y-3">
                {planDistribution.map((plan, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: plan.color }}
                      />
                      <span className="text-sm text-gray-700">{plan.name}</span>
                    </div>
                    <span className="text-sm text-gray-900">{plan.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick access based on permissions ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hasPermission("tenants.view") && (
          <QuickLink
            href="/superadmin/tenants"
            title={t("superadmin.quick.manage_tenants")}
            desc={t("superadmin.quick.manage_tenants_desc")}

          />
        )}
        {hasPermission("employees.view") && (
          <QuickLink
            href="/superadmin/sub-admins"
            title={t("superadmin.quick.subadmin_management")}
            desc={t("superadmin.quick.subadmin_management_desc")}
          />
        )}
        {hasPermission("system.view_logs") && (
          <QuickLink
            href="/superadmin/logs"
            title={t("superadmin.quick.audit_logs")}
            desc={t("superadmin.quick.audit_logs_desc")}
          />
        )}
      </div>
    </div>
  );
}

function QuickLink({ href, title, desc }) {
  return (
    <a
      href={href}
      className="group p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-[#8B1E3F]/30 transition-all flex items-center justify-between"
    >
      <div>
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#8B1E3F] transition-colors">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#8B1E3F] transition-colors" />
    </a>
  );
}