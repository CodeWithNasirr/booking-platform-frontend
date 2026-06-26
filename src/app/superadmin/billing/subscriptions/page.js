"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/t";
import {
  ArrowLeft,
  Users,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  Package,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  fetchBillingStats,
  fetchPlans,
  fetchPlanSubscribers,
} from "@/lib/platformApi";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

const MAROON = "#800020";

function StatusBadge({ status, t }) {
  const SUB_STATUS = {
    active:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: t("superadmin.billing.subscriber_status_active") },
    trialing:  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   label: t("superadmin.billing.subscriber_status_trialing") },
    past_due:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     label: t("superadmin.billing.subscriber_status_past_due") },
    cancelled: { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400",    label: t("superadmin.billing.subscriber_status_cancelled") },
  };

  const s = SUB_STATUS[status] || SUB_STATUS.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function formatCurrency(amount, currency = "USD") {
  if (amount == null || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(Number(amount));
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [plans, setPlans] = useState([]);
  const [allSubs, setAllSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Filters
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  /* ── Load data ─────────────────────────── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, plansData] = await Promise.all([
        fetchBillingStats().catch(() => null),
        fetchPlans().catch(() => []),
      ]);

      setStats(statsData);
      const plansList = Array.isArray(plansData) ? plansData : plansData?.results || [];
      setPlans(plansList);

      // Fetch subscribers for each plan in parallel
      const activePlans = plansList.filter((p) => p.status !== "archived");
      const results = await Promise.all(
        activePlans.map(async (p) => {
          try {
            const res = await fetchPlanSubscribers(p.id);
            return (Array.isArray(res) ? res : []).map((s) => ({
              ...s,
              tenant_status: s.status,
              subscription_status: s.status,
              plan_name: p.name,
              plan_slug: p.slug,
              plan_tier: p.tier,
            }));
          } catch {
            return [];
          }
        })
      );

      setAllSubs(results.flat());
    } catch (err) {
      setError(err.message || t("superadmin.billing.toast_load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Filter ────────────────────────────── */
  const filtered = allSubs.filter((s) => {
    if (planFilter !== "all" && s.plan_slug !== planFilter) return false;
    if (statusFilter !== "all" && s.subscription_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.tenant_name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /* ── Loading / Error ───────────────────── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: MAROON }} />
        <p className="text-gray-500 text-sm">{t("superadmin.billing.loading_subscriptions")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-700 font-medium">{error}</p>
        <button onClick={loadData} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: MAROON }}>{t("superadmin.billing.retry")}</button>
      </div>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">{t("superadmin.billing.subscriptions_title")}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {t("superadmin.billing.subscriptions_desc", {
                  count: stats?.total_subscribers?.toLocaleString() ?? allSubs.length,
                  mrr: stats?.mrr != null ? ` · ${t("superadmin.billing.mrr_label")}: ${formatCurrency(stats.mrr)}` : "",
                })}
              </p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" /> {t("superadmin.billing.refresh")}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("superadmin.billing.stat_total"), value: allSubs.length, color: "text-gray-900" },
            { label: t("superadmin.billing.stat_active_subs"), value: allSubs.filter((s) => s.subscription_status === "active").length, color: "text-emerald-600" },
            { label: t("superadmin.billing.stat_trialing"), value: allSubs.filter((s) => s.subscription_status === "trialing").length, color: "text-amber-600" },
            { label: t("superadmin.billing.stat_past_due"), value: allSubs.filter((s) => s.subscription_status === "past_due").length, color: "text-red-600" },
          ].map((st) => (
            <div key={st.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`text-2xl font-semibold ${st.color}`}>{st.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{st.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("superadmin.billing.search_tenant_placeholder")}
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
              />
            </div>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/30"
            >
              <option value="all">{t("superadmin.billing.filter_all_plans")}</option>
              {plans.filter((p) => p.status !== "archived").map((p) => (
                <option key={p.slug} value={p.slug}>{p.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/30"
            >
              <option value="all">{t("superadmin.billing.filter_all_statuses")}</option>
              <option value="active">{t("superadmin.billing.subscriber_status_active")}</option>
              <option value="trialing">{t("superadmin.billing.subscriber_status_trialing")}</option>
              <option value="past_due">{t("superadmin.billing.subscriber_status_past_due")}</option>
              <option value="cancelled">{t("superadmin.billing.subscriber_status_cancelled")}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {allSubs.length === 0 ? t("superadmin.billing.no_subscriptions_found") : t("superadmin.billing.no_filter_results")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_tenant")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_plan")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_status")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_price")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_start")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_end")}</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((s, i) => (
                    <tr key={`${s.tenant_id}-${i}`} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-gray-900">{s.tenant_name}</div>
                        <div className="text-xs text-gray-400 capitalize">{s.tenant_status}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 capitalize">
                          {s.plan_name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={s.subscription_status} t={t} />
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">
                        {formatCurrency(s.price, s.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(s.start_date)}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(s.end_date)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => router.push(`/superadmin/tenants/${s.tenant_id}`)}
                          className="text-xs font-medium hover:underline"
                          style={{ color: MAROON }}
                        >
                          {t("superadmin.billing.view_tenant")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
              {t("superadmin.billing.showing_subscriptions", { filtered: filtered.length, total: allSubs.length, plural: allSubs.length !== 1 ? "s" : "" })}
            </div>
          )}
        </div>
      </SuperAdminLayout>
    </div>
  );
}