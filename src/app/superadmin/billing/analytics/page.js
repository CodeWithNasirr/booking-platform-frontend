"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/t";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Loader2,
  AlertCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Activity,
  Layers,
  Target,
  Minus,
} from "lucide-react";
import {
  fetchAnalyticsOverview,
  fetchMrrHistory,
  fetchChurnData,
  fetchCohortData,
  fetchGrowthData,
  fetchPlanMix,
} from "@/lib/platformApi";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */
const MAROON = "#800020";
const MAROON_LIGHT = "#F5E6EB";
const EMERALD = "#059669";
const RED = "#DC2626";
const AMBER = "#D97706";
const BLUE = "#2563EB";

/* ────────────────────────────────────────────
   Formatters
   ──────────────────────────────────────────── */
function fmtCurrency(amount) {
  const n = Number(amount);
  if (isNaN(n)) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

function fmtPercent(val) {
  const n = Number(val);
  if (isNaN(n)) return "0%";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

/* ────────────────────────────────────────────
   UI Components
   ──────────────────────────────────────────── */

function KpiCard({ icon: Icon, label, value, subtext, gradient, trend, trendLabel }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend != null && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
            Number(trend) >= 0 ? "text-emerald-600" : "text-red-500"
          }`}>
            {Number(trend) >= 0
              ? <ArrowUpRight className="w-3.5 h-3.5" />
              : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(Number(trend)).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {subtext && <div className="text-[10px] text-gray-400 mt-1">{subtext}</div>}
    </div>
  );
}

function PeriodSelector({ value, onChange, t }) {
  const PERIOD_OPTIONS = [
    { value: 3, label: t("superadmin.billing.period_3mo") },
    { value: 6, label: t("superadmin.billing.period_6mo") },
    { value: 12, label: t("superadmin.billing.period_12mo") },
    { value: 24, label: t("superadmin.billing.period_24mo") },
  ];

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === opt.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
    </div>
  );
}

function SectionError({ msg, onRetry, t }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <AlertCircle className="w-5 h-5 text-red-400" />
      <p className="text-xs text-gray-500">{msg}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-medium hover:underline" style={{ color: MAROON }}>{t("superadmin.billing.retry")}</button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Bar Chart (native CSS)
   ──────────────────────────────────────────── */

function BarChart({ data, dataKey, labelKey = "label", color = MAROON, height = 160, format = "currency", t }) {
  if (!data?.length) return <div className="text-center text-xs text-gray-400 py-8">{t("superadmin.billing.no_data")}</div>;
  const vals = data.map((d) => Number(d[dataKey]) || 0);
  const max = Math.max(...vals, 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const val = Number(d[dataKey]) || 0;
        const pct = (val / max) * 100;
        const label = format === "currency" ? fmtCurrency(val) : `${val}${format === "percent" ? "%" : ""}`;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
              {d[labelKey]}: {label}
            </div>
            <span className="text-[9px] text-gray-400 truncate max-w-full">
              {label}
            </span>
            <div
              className="w-full rounded-t-sm transition-all hover:opacity-80"
              style={{
                height: `${Math.max(pct, 3)}%`,
                backgroundColor: color,
                opacity: 0.6 + (i / data.length) * 0.4,
              }}
            />
            <span className="text-[9px] text-gray-400 truncate max-w-full">{d[labelKey]?.split(" ")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────
   Dual Bar Chart (new vs churned)
   ──────────────────────────────────────────── */

function DualBarChart({ data, key1, key2, labelKey = "label", color1 = EMERALD, color2 = RED, height = 160, t }) {
  if (!data?.length) return <div className="text-center text-xs text-gray-400 py-8">{t("superadmin.billing.no_data")}</div>;
  const allVals = data.flatMap((d) => [Number(d[key1]) || 0, Number(d[key2]) || 0]);
  const max = Math.max(...allVals, 1);

  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const v1 = Number(d[key1]) || 0;
          const v2 = Number(d[key2]) || 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex gap-0.5 items-end w-full" style={{ height: height - 20 }}>
                <div className="flex-1 rounded-t-sm" style={{ height: `${(v1 / max) * 100}%`, backgroundColor: color1, minHeight: v1 > 0 ? 4 : 0 }} />
                <div className="flex-1 rounded-t-sm" style={{ height: `${(v2 / max) * 100}%`, backgroundColor: color2, minHeight: v2 > 0 ? 4 : 0 }} />
              </div>
              <span className="text-[9px] text-gray-400">{d[labelKey]?.split(" ")[0]}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color1 }} /> {t("superadmin.billing.legend_new")}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color2 }} /> {t("superadmin.billing.legend_churned")}
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Cohort Retention Heatmap
   ──────────────────────────────────────────── */

function CohortHeatmap({ data, t }) {
  if (!data?.length) return <div className="text-center text-xs text-gray-400 py-8">{t("superadmin.billing.no_cohort_data")}</div>;

  const maxMonths = Math.max(...data.map((c) => c.retention?.length || 0));

  function cellColor(pct) {
    if (pct >= 90) return "bg-emerald-600 text-white";
    if (pct >= 75) return "bg-emerald-400 text-white";
    if (pct >= 60) return "bg-emerald-200 text-gray-800";
    if (pct >= 40) return "bg-amber-200 text-gray-800";
    if (pct >= 20) return "bg-red-200 text-gray-800";
    return "bg-red-400 text-white";
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr>
            <th className="text-left py-1 px-2 text-gray-500 font-medium w-24">{t("superadmin.billing.cohort_column_cohort")}</th>
            <th className="text-center py-1 px-1 text-gray-500 font-medium w-10">{t("superadmin.billing.cohort_column_size")}</th>
            {Array.from({ length: maxMonths }, (_, i) => (
              <th key={i} className="text-center py-1 px-1 text-gray-400 font-normal">
                {t("superadmin.billing.cohort_month_prefix")}{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.cohort}>
              <td className="py-1 px-2 text-gray-700 font-medium whitespace-nowrap">{c.label}</td>
              <td className="py-1 px-1 text-center text-gray-500">{c.size}</td>
              {c.retention?.map((pct, i) => (
                <td key={i} className="py-1 px-1 text-center">
                  <span className={`inline-block w-full rounded px-1 py-0.5 text-[10px] font-medium ${cellColor(pct)}`}>
                    {pct}%
                  </span>
                </td>
              ))}
              {/* Fill empty cells */}
              {Array.from({ length: maxMonths - (c.retention?.length || 0) }, (_, i) => (
                <td key={`empty-${i}`} className="py-1 px-1 text-center">
                  <span className="inline-block w-full rounded px-1 py-0.5 bg-gray-50 text-gray-300">—</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────────────────────────────────
   Plan Mix Revenue Breakdown
   ──────────────────────────────────────────── */

function PlanMixSection({ data, totalMrr, t }) {
  if (!data?.length) return <div className="text-center text-xs text-gray-400 py-8">{t("superadmin.billing.no_plan_data")}</div>;

  return (
    <div className="space-y-4">
      {data.map((p) => {
        const rev = Number(p.revenue) || 0;
        const pct = Number(p.revenue_pct) || 0;
        return (
          <div key={p.plan_name}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 capitalize">{p.plan_name}</span>
                <span className="text-xs text-gray-400">{t("superadmin.billing.subscribers_count", { count: p.subscribers, plural: p.subscribers !== 1 ? "s" : "" })}</span>
                <span className="text-[10px] text-gray-400">{t("superadmin.billing.avg_price_prefix")} {fmtCurrency(p.avg_price)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-900">{fmtCurrency(rev)}{t("superadmin.billing.per_month_suffix")}</span>
                <span className="text-xs text-gray-400 w-12 text-right">{pct}%</span>
              </div>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: MAROON }} />
            </div>
            {/* Plan movement */}
            {(p.inbound_changes_30d > 0 || p.outbound_changes_30d > 0) && (
              <div className="flex items-center gap-4 mt-1.5">
                {p.inbound_changes_30d > 0 && (
                  <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" /> {t("superadmin.billing.inbound_changes", { count: p.inbound_changes_30d })}
                  </span>
                )}
                {p.outbound_changes_30d > 0 && (
                  <span className="text-[10px] text-red-500 flex items-center gap-0.5">
                    <ArrowDownRight className="w-3 h-3" /> {t("superadmin.billing.outbound_changes", { count: p.outbound_changes_30d })}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
        <span className="text-sm font-semibold text-gray-700">{t("superadmin.billing.total_mrr_label")}</span>
        <span className="text-sm font-bold text-gray-900">{fmtCurrency(totalMrr)}{t("superadmin.billing.per_month_suffix")}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */

export default function AnalyticsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // Period selector state
  const [mrrMonths, setMrrMonths] = useState(12);
  const [churnMonths, setChurnMonths] = useState(6);
  const [cohortMonths, setCohortMonths] = useState(6);
  const [growthMonths, setGrowthMonths] = useState(12);

  // Data state
  const [overview, setOverview] = useState(null);
  const [mrrHistory, setMrrHistory] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [cohortData, setCohortData] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [planMix, setPlanMix] = useState(null);

  // Loading / error per section
  const [loadState, setLoadState] = useState({
    overview: "loading", mrr: "loading", churn: "loading",
    cohort: "loading", growth: "loading", mix: "loading",
  });
  const [errors, setErrors] = useState({});

  function setSection(key, state, error = null) {
    setLoadState((p) => ({ ...p, [key]: state }));
    if (error) setErrors((p) => ({ ...p, [key]: error }));
  }

  // ── Loaders ──

  const loadOverview = useCallback(async () => {
    setSection("overview", "loading");
    try {
      const data = await fetchAnalyticsOverview();
      setOverview(data);
      setSection("overview", "done");
    } catch (e) { setSection("overview", "error", e.message); }
  }, []);

  const loadMrr = useCallback(async (months) => {
    setSection("mrr", "loading");
    try {
      const data = await fetchMrrHistory(months);
      setMrrHistory(data);
      setSection("mrr", "done");
    } catch (e) { setSection("mrr", "error", e.message); }
  }, []);

  const loadChurn = useCallback(async (months) => {
    setSection("churn", "loading");
    try {
      const data = await fetchChurnData(months);
      setChurnData(data);
      setSection("churn", "done");
    } catch (e) { setSection("churn", "error", e.message); }
  }, []);

  const loadCohort = useCallback(async (months) => {
    setSection("cohort", "loading");
    try {
      const data = await fetchCohortData(months);
      setCohortData(data);
      setSection("cohort", "done");
    } catch (e) { setSection("cohort", "error", e.message); }
  }, []);

  const loadGrowth = useCallback(async (months) => {
    setSection("growth", "loading");
    try {
      const data = await fetchGrowthData(months);
      setGrowthData(data);
      setSection("growth", "done");
    } catch (e) { setSection("growth", "error", e.message); }
  }, []);

  const loadMix = useCallback(async () => {
    setSection("mix", "loading");
    try {
      const data = await fetchPlanMix();
      setPlanMix(data);
      setSection("mix", "done");
    } catch (e) { setSection("mix", "error", e.message); }
  }, []);

  // ── Initial load ──
  useEffect(() => { loadOverview(); loadMix(); }, [loadOverview, loadMix]);
  useEffect(() => { loadMrr(mrrMonths); }, [mrrMonths, loadMrr]);
  useEffect(() => { loadChurn(churnMonths); }, [churnMonths, loadChurn]);
  useEffect(() => { loadCohort(cohortMonths); }, [cohortMonths, loadCohort]);
  useEffect(() => { loadGrowth(growthMonths); }, [growthMonths, loadGrowth]);

  function refreshAll() {
    loadOverview();
    loadMrr(mrrMonths);
    loadChurn(churnMonths);
    loadCohort(cohortMonths);
    loadGrowth(growthMonths);
    loadMix();
  }

  // ── Derived ──
  const mrrGrowth = mrrHistory?.data?.length >= 2
    ? mrrHistory.data[mrrHistory.data.length - 1].growth_pct
    : null;

  /* ────────────────────────────────────────
     RENDER
     ──────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <SuperAdminLayout>
        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/superadmin/billing")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t("superadmin.billing.back_to_billing")}
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("superadmin.billing.revenue_analytics_title")}</h1>
              <p className="text-sm text-gray-500 mt-1">{t("superadmin.billing.revenue_analytics_desc")}</p>
            </div>
            <button
              onClick={refreshAll}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" /> {t("superadmin.billing.refresh_all")}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════
           KPI CARDS — from /analytics/overview/
           ═══════════════════════════════════════ */}
        {loadState.overview === "loading" ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-gray-100 mb-3" />
                <div className="h-7 w-24 bg-gray-100 rounded mb-1" />
                <div className="h-4 w-32 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        ) : loadState.overview === "error" ? (
          <SectionError msg={errors.overview || t("superadmin.billing.error_load_overview")} onRetry={loadOverview} t={t} />
        ) : overview && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={DollarSign}
                label={t("superadmin.billing.kpi_mrr")}
                value={fmtCurrency(overview.mrr)}
                gradient="from-emerald-500 to-emerald-600"
                trend={mrrGrowth}
              />
              <KpiCard
                icon={Users}
                label={t("superadmin.billing.kpi_active_subscribers")}
                value={overview.total_subscribers?.toLocaleString()}
                gradient="from-blue-500 to-blue-600"
                subtext={`${t("superadmin.billing.arr_prefix")}: ${fmtCurrency(overview.arr)}`}
              />
              <KpiCard
                icon={Target}
                label={t("superadmin.billing.kpi_arpu")}
                value={fmtCurrency(overview.arpu)}
                gradient="from-purple-500 to-purple-600"
                subtext={`${t("superadmin.billing.ltv_prefix")}: ${fmtCurrency(overview.ltv_estimate)}`}
              />
              <KpiCard
                icon={TrendingDown}
                label={t("superadmin.billing.kpi_churn_rate")}
                value={`${overview.churn_rate_pct}%`}
                gradient="from-amber-500 to-amber-600"
                subtext={`${overview.churned_count_30d} ${t("superadmin.billing.churned_suffix")} · ${fmtCurrency(overview.churned_mrr_30d)} ${t("superadmin.billing.lost_suffix")}`}
              />
            </div>

            {/* MRR Movement (30d) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t("superadmin.billing.movement_new_mrr"), value: overview.new_mrr_30d, color: "text-emerald-600", icon: ArrowUpRight },
                { label: t("superadmin.billing.movement_expansion"), value: overview.expansion_revenue_30d, color: "text-blue-600", icon: TrendingUp },
                { label: t("superadmin.billing.movement_contraction"), value: overview.contraction_revenue_30d, color: "text-amber-600", icon: TrendingDown },
                { label: t("superadmin.billing.movement_net_new"), value: overview.net_new_mrr_30d, color: Number(overview.net_new_mrr_30d) >= 0 ? "text-emerald-600" : "text-red-600", icon: Activity },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
                  <m.icon className={`w-4 h-4 ${m.color}`} />
                  <div>
                    <div className={`text-sm font-semibold ${m.color}`}>{fmtCurrency(m.value)}</div>
                    <div className="text-[10px] text-gray-400">{m.label} {t("superadmin.billing.period_30d_suffix")}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════
           MRR HISTORY — from /analytics/mrr-history/
           ═══════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader title={t("superadmin.billing.mrr_trend_title")} subtitle={t("superadmin.billing.mrr_trend_desc")}>
            <PeriodSelector value={mrrMonths} onChange={setMrrMonths} t={t} />
          </SectionHeader>
          {loadState.mrr === "loading" ? <SectionLoader /> :
           loadState.mrr === "error" ? <SectionError msg={errors.mrr} onRetry={() => loadMrr(mrrMonths)} t={t} /> : (
            <>
              <BarChart data={mrrHistory?.data} dataKey="mrr" height={180} color={MAROON} t={t} />
              {/* Summary row */}
              {mrrHistory?.data?.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                  {mrrHistory.data.slice(-3).map((d) => (
                    <div key={d.month} className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{d.label}</span>: {fmtCurrency(d.mrr)}
                      <span className={`ml-1 ${Number(d.growth_pct) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {fmtPercent(d.growth_pct)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════
           ROW: Churn + Growth side by side
           ═══════════════════════════════════════ */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* CHURN — from /analytics/churn/ */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader title={t("superadmin.billing.churn_rate_title")} subtitle={churnData ? `${t("superadmin.billing.avg_prefix")}: ${churnData.average_churn_rate}%` : ""}>
              <PeriodSelector value={churnMonths} onChange={setChurnMonths} t={t} />
            </SectionHeader>
            {loadState.churn === "loading" ? <SectionLoader /> :
             loadState.churn === "error" ? <SectionError msg={errors.churn} onRetry={() => loadChurn(churnMonths)} t={t} /> : (
              <>
                <BarChart data={churnData?.data} dataKey="churn_rate" height={160} color={RED} format="percent" t={t} />
                {churnData?.data?.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-50">
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{t("superadmin.billing.avg_churn_label")}: <span className="font-medium text-gray-600">{churnData.average_churn_rate}%</span></span>
                      <span>{t("superadmin.billing.total_churned_label")}: {churnData.data.reduce((s, d) => s + d.churned_count, 0)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* GROWTH — from /analytics/growth/ */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <SectionHeader title={t("superadmin.billing.growth_title")} subtitle={t("superadmin.billing.growth_desc")}>
              <PeriodSelector value={growthMonths} onChange={setGrowthMonths} t={t} />
            </SectionHeader>
            {loadState.growth === "loading" ? <SectionLoader /> :
             loadState.growth === "error" ? <SectionError msg={errors.growth} onRetry={() => loadGrowth(growthMonths)} t={t} /> : (
              <>
                <DualBarChart
                  data={growthData?.data}
                  key1="new_subscribers"
                  key2="churned"
                  height={160}
                  t={t}
                />
                {growthData?.data?.length > 0 && (() => {
                  const last = growthData.data[growthData.data.length - 1];
                  return (
                    <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                      <span>{t("superadmin.billing.current_active_label")}: <span className="font-medium text-gray-600">{last.total_active}</span></span>
                      <span>{t("superadmin.billing.net_this_month_label")}: <span className={`font-medium ${last.net_change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {last.net_change >= 0 ? "+" : ""}{last.net_change}
                      </span></span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════
           COHORT RETENTION — from /analytics/cohorts/
           ═══════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader title={t("superadmin.billing.cohort_title")} subtitle={t("superadmin.billing.cohort_desc")}>
            <PeriodSelector value={cohortMonths} onChange={setCohortMonths} t={t} />
          </SectionHeader>
          {loadState.cohort === "loading" ? <SectionLoader /> :
           loadState.cohort === "error" ? <SectionError msg={errors.cohort} onRetry={() => loadCohort(cohortMonths)} t={t} /> : (
            <CohortHeatmap data={cohortData?.data} t={t} />
          )}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <span className="text-[10px] text-gray-400">{t("superadmin.billing.cohort_reading_hint")}</span>
            <div className="flex items-center gap-1.5 ml-auto">
              {[
                { label: "90%+", cls: "bg-emerald-600" },
                { label: "75%+", cls: "bg-emerald-400" },
                { label: "60%+", cls: "bg-emerald-200" },
                { label: "40%+", cls: "bg-amber-200" },
                { label: "<40%", cls: "bg-red-300" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-0.5 text-[9px] text-gray-400">
                  <span className={`w-2 h-2 rounded-sm ${l.cls}`} /> {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
           PLAN MIX — from /analytics/plan-mix/
           ═══════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SectionHeader title={t("superadmin.billing.plan_mix_title")} subtitle={t("superadmin.billing.plan_mix_desc")} />
          {loadState.mix === "loading" ? <SectionLoader /> :
           loadState.mix === "error" ? <SectionError msg={errors.mix} onRetry={loadMix} t={t} /> : (
            <PlanMixSection data={planMix?.data} totalMrr={planMix?.total_mrr} t={t} />
          )}
        </div>

        {/* ═══════════════════════════════════════
           GROWTH DETAIL TABLE — from /analytics/growth/
           ═══════════════════════════════════════ */}
        {growthData?.data?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">{t("superadmin.billing.growth_detail_title")}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{t("superadmin.billing.growth_detail_desc")}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase">{t("superadmin.billing.growth_column_month")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase text-right">{t("superadmin.billing.growth_column_new")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase text-right">{t("superadmin.billing.growth_column_churned")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase text-right">{t("superadmin.billing.growth_column_net")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase text-right">{t("superadmin.billing.growth_column_upgrades")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase text-right">{t("superadmin.billing.growth_column_downgrades")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase text-right">{t("superadmin.billing.growth_column_total_active")}</th>
                    <th className="px-4 py-2.5 text-[10px] font-medium text-gray-500 uppercase text-right">{t("superadmin.billing.growth_column_new_revenue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {growthData.data.map((d) => (
                    <tr key={d.month} className="hover:bg-gray-50/60">
                      <td className="px-4 py-2.5 text-xs font-medium text-gray-700">{d.label}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-emerald-600">+{d.new_subscribers}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-red-500">{d.churned > 0 ? `-${d.churned}` : "0"}</td>
                      <td className="px-4 py-2.5 text-xs text-right font-medium">
                        <span className={d.net_change >= 0 ? "text-emerald-600" : "text-red-500"}>
                          {d.net_change >= 0 ? "+" : ""}{d.net_change}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-right text-blue-600">{d.upgrades}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-amber-600">{d.downgrades}</td>
                      <td className="px-4 py-2.5 text-xs text-right font-medium text-gray-900">{d.total_active}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-gray-600">{fmtCurrency(d.new_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SuperAdminLayout>
    </div>
  );
}