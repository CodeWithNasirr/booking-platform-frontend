"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/t";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  MoreVertical,
  Zap,
  Star,
  Crown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  fetchBillingStats,
  fetchPlans,
  fetchPlan,
  deletePlan,
  togglePlanStatus,
  fetchPlanSubscribers,
  fetchPlanChanges,
  reviewPlanChange,
} from "@/lib/platformApi";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const MAROON = "#800020";
const MAROON_DARK = "#5C0018";

const TIER_ICONS = {
  free: Package,
  starter: Zap,
  professional: Star,
  enterprise: Crown,
};

const TIER_GRADIENTS = {
  free: "from-gray-500 to-gray-600",
  starter: "from-blue-500 to-blue-600",
  professional: "from-purple-500 to-purple-600",
  enterprise: "from-amber-500 to-amber-600",
};

const TIER_BORDER = {
  free: "border-gray-200",
  starter: "border-blue-200",
  professional: "border-purple-200",
  enterprise: "border-amber-200",
};

const STATUS_STYLES = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  inactive: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  archived: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
};

const CHANGE_STATUS = {
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700" },
  rejected: { bg: "bg-red-50", text: "text-red-700" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600" },
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function formatCurrency(amount, currency = "USD") {
  if (amount == null || isNaN(amount)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function StatusBadge({ status, map = STATUS_STYLES }) {
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value ?? "—"}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Dropdown Menu (native)
   ──────────────────────────────────────────── */

function DropdownMenu({ items, trigger }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {trigger || <MoreVertical className="w-4 h-4 text-gray-500" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
          {items.map((item, i) =>
            item.divider ? (
              <hr key={i} className="my-1 border-gray-100" />
            ) : (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick?.(); }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${item.danger ? "text-red-600" : "text-gray-700"}`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Subscribers Modal
   ──────────────────────────────────────────── */

function SubscribersModal({ plan, onClose }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!plan) return;

    setLoading(true);
    setData(null);

    fetchPlanSubscribers(plan.id)
      .then((res) => {
        const subscribers = (Array.isArray(res) ? res : []).map((s) => ({
          ...s,
          tenant_status: s.status,
          subscription_status: s.status,
          currency: s.currency || "SAR",
        }));

        setData({
          subscribers,
          count: subscribers.length,
        });
      })
      .catch(() =>
        setData({
          subscribers: [],
          count: 0,
        })
      )
      .finally(() => setLoading(false));
  }, [plan]);

  if (!plan) return null;

  const subscriberStatusMap = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    trialing: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    past_due: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    cancelled: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("superadmin.billing.subscribers_modal_title", { name: plan.name })}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {t("superadmin.billing.subscribers_modal_desc", { count: data?.count ?? "..." })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : !data?.subscribers?.length ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {t("superadmin.billing.no_subscribers")}
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("superadmin.billing.subscriber_column_tenant")}</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("superadmin.billing.subscriber_column_status")}</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("superadmin.billing.subscriber_column_price")}</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t("superadmin.billing.subscriber_column_start")}</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.subscribers.map((s) => (
                  <tr key={s.tenant_id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-gray-900">{s.tenant_name}</div>
                      <div className="text-xs text-gray-400 capitalize">{s.tenant_status}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={s.subscription_status} map={subscriberStatusMap} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">
                      {formatCurrency(s.price, s.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {formatDate(s.start_date)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          onClose();
                          router.push(`/superadmin/tenants/${s.tenant_id}`);
                        }}
                        className="text-xs font-medium hover:underline"
                        style={{ color: MAROON }}
                      >
                        {t("superadmin.billing.subscriber_view")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Delete Confirm Modal
   ──────────────────────────────────────────── */

function DeleteModal({ plan, onClose, onConfirm, loading }) {
  const { t } = useTranslation();
  if (!plan) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("superadmin.billing.delete_modal_title")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600"
            dangerouslySetInnerHTML={{
              __html: t("superadmin.billing.delete_modal_desc", { name: plan.name }),
            }}
          />
          {(plan.subscriber_count > 0) && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700"
                dangerouslySetInnerHTML={{
                  __html: t("superadmin.billing.delete_modal_warning", {
                    count: plan.subscriber_count,
                    plural: plan.subscriber_count !== 1 ? "s" : "",
                  }),
                }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("superadmin.billing.delete_modal_archive")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Review Change Request Modal
   ──────────────────────────────────────────── */

function ReviewModal({ change, onClose, onReview, loading }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState("");
  if (!change) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("superadmin.billing.review_modal_title")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("superadmin.billing.review_modal_tenant")}</span>
            <span className="text-gray-900 font-medium">{change.tenant_name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("superadmin.billing.review_modal_change")}</span>
            <span className="text-gray-900">
              {change.from_plan_name || "—"} → {change.to_plan_name || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("superadmin.billing.review_modal_type")}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium capitalize ${
              change.change_type === "upgrade" ? "text-emerald-600" : "text-amber-600"
            }`}>
              {change.change_type === "upgrade"
                ? <ArrowUpRight className="w-3.5 h-3.5" />
                : <ArrowDownRight className="w-3.5 h-3.5" />}
              {change.change_type}
            </span>
          </div>
          {change.reason && (
            <div className="text-sm">
              <span className="text-gray-500 block mb-1">{t("superadmin.billing.review_modal_reason")}</span>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-2.5 text-xs">{change.reason}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("superadmin.billing.review_modal_notes_label")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={t("superadmin.billing.review_modal_notes_placeholder")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button
            onClick={() => onReview("reject", notes)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("superadmin.billing.review_modal_reject")}
          </button>
          <button
            onClick={() => onReview("approve", notes)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: MAROON }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("superadmin.billing.review_modal_approve")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */

export default function BillingPlansPage() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();

  /* ── State ─────────────────────────────── */
  const [stats, setStats] = useState(null);

  const [plans, setPlans] = useState([]);
  const [planDetails, setPlanDetails] = useState({}); // id → detail with features

  const [changes, setChanges] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modals
  const [subscribersPlan, setSubscribersPlan] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [reviewingChange, setReviewingChange] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // expanded plan features
  const [expandedPlan, setExpandedPlan] = useState(null);

  // toast
  const [toast, setToast] = useState(null);
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── Load data ─────────────────────────── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, plansData, changesData] = await Promise.all([
        fetchBillingStats().catch(() => null),
        fetchPlans().catch(() => []),
        fetchPlanChanges({ status: "pending" }).catch(() => []),
      ]);
      setStats(statsData);
      setPlans(Array.isArray(plansData) ? plansData : plansData?.results || []);
      setChanges(Array.isArray(changesData) ? changesData : changesData?.results || []);
    } catch (err) {
      setError(err.message || t("superadmin.billing.toast_load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Load plan detail (features) ───────── */
  async function loadPlanDetail(planId) {
    if (planDetails[planId]) return;
    try {
      const detail = await fetchPlan(planId);
      setPlanDetails((prev) => ({ ...prev, [planId]: detail }));
    } catch {
      // silent
    }
  }

  function toggleExpand(planId) {
    if (expandedPlan === planId) {
      setExpandedPlan(null);
    } else {
      setExpandedPlan(planId);
      loadPlanDetail(planId);
    }
  }

  /* ── Actions ───────────────────────────── */
  async function handleToggleStatus(plan) {
    try {
      setActionLoading(true);
      const res = await togglePlanStatus(plan.id);
      showToast(t("superadmin.billing.toast_status_toggled", { name: plan.name, status: res.status }));
      loadData();
    } catch (err) {
      showToast(err.message || t("superadmin.billing.toast_toggle_error"), "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingPlan) return;
    try {
      setActionLoading(true);
      await deletePlan(deletingPlan.id);
      showToast(t("superadmin.billing.toast_archived", { name: deletingPlan.name }));
      setDeletingPlan(null);
      loadData();
    } catch (err) {
      showToast(err.message || t("superadmin.billing.toast_archive_error"), "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReview(action, notes) {
    if (!reviewingChange) return;
    try {
      setActionLoading(true);
      await reviewPlanChange(reviewingChange.id, action, notes);
      showToast(t("superadmin.billing.toast_reviewed", { action }));
      setReviewingChange(null);
      loadData();
    } catch (err) {
      showToast(err.message || t("superadmin.billing.toast_review_error"), "error");
    } finally {
      setActionLoading(false);
    }
  }

  /* ── Loading / Error ───────────────────── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: MAROON }} />
        <p className="text-gray-500 text-sm">{t("superadmin.billing.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-gray-700 font-medium">{error}</p>
        <button onClick={loadData} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: MAROON }}>
          {t("superadmin.billing.retry")}
        </button>
      </div>
    );
  }

  /* ── Derived ───────────────────────────── */
  const activePlans = plans.filter((p) => p.status !== "archived");

  /* ────────────────────────────────────────
    RENDER
    ──────────────────────────────────────── */
  return (
    <div className="space-y-6">
    <SuperAdminLayout
        title={t("superadmin.billing.title")}
        description={t("superadmin.billing.description")}
        breadcrumbs={[{ label: t("superadmin.billing.title") }]}
      >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("superadmin.billing.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("superadmin.billing.description")}</p>
        </div>
        <button
          onClick={() => router.push("/superadmin/billing/plans/new")}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ backgroundColor: MAROON }}
        >
          <Plus className="w-4 h-4" />
          {t("superadmin.billing.create_plan")}
        </button>
      </div>

      {/* ── Stats ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label={t("superadmin.billing.stat_active_plans")}
          value={stats?.active_plans ?? activePlans.filter((p) => p.status === "active").length}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={Users}
          label={t("superadmin.billing.stat_active_subscriptions")}
          value={stats?.active_subscriptions != null ? stats.active_subscriptions.toLocaleString() : "—"}
          color="from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={DollarSign}
          label={t("superadmin.billing.stat_mrr")}
          value={stats?.monthly_revenue != null ? formatCurrency(stats.monthly_revenue) : "—"}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label={t("superadmin.billing.stat_growth_rate")}
          value={stats?.growth_rate ?? "—"}
          color="from-pink-500 to-pink-600"
        />

        <StatCard
          icon={Clock}
          label={t("superadmin.billing.stat_pending_changes")}
          value={stats?.pending_changes ?? changes.length}
          color="from-amber-500 to-amber-600"
        />
      </div>

      {/* ── Revenue by Plan ──────────────────── */}
      {stats?.revenue_by_plan?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{t("superadmin.billing.revenue_by_plan")}</h2>
          <div className="space-y-3">
            {stats.revenue_by_plan.map((rp) => {
              const maxRevenue = Math.max(...stats.revenue_by_plan.map((r) => Number(r.revenue) || 0), 1);
              const pct = ((Number(rp.revenue) || 0) / maxRevenue) * 100;
              return (
                <div key={rp.plan_name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 capitalize font-medium">{rp.plan_name || "Unknown"}</span>
                    <span className="text-gray-500">
                      {t("superadmin.billing.revenue_subscribers", {
                        count: rp.count,
                        plural: rp.count !== 1 ? "s" : "",
                        revenue: formatCurrency(rp.revenue),
                      })}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: MAROON }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Plans Header ─────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("superadmin.billing.plans_header")}
          <span className="ml-2 text-sm font-normal text-gray-500">{t("superadmin.billing.plans_count", { count: activePlans.length })}</span>
        </h2>
      </div>

      {/* ── Plans Grid ───────────────────────── */}
      {activePlans.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">{t("superadmin.billing.no_plans")}</p>
          <button
            onClick={() => router.push("/superadmin/billing/plans/new")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: MAROON }}
          >
            <Plus className="w-4 h-4" /> {t("superadmin.billing.create_first_plan")}
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {activePlans.map((plan) => {
            const TierIcon = TIER_ICONS[plan.tier] || Package;
            const gradient = TIER_GRADIENTS[plan.tier] || TIER_GRADIENTS.free;
            const borderClass = TIER_BORDER[plan.tier] || "border-gray-200";
            const isExpanded = expandedPlan === plan.id;
            const detail = planDetails[plan.id];
            const features = detail?.features || [];

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border ${borderClass} hover:shadow-lg transition-all relative ${plan.is_popular ? "ring-2 ring-[#800020]/20" : ""}`}
              >
                {/* Popular badge */}
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: MAROON }}>
                    {t("superadmin.billing.most_popular")}
                  </div>
                )}

                <div className="p-6">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <TierIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                          <StatusBadge status={plan.status} />
                        </div>
                        {plan.tagline && (
                          <p className="text-xs text-gray-500 mt-0.5">{plan.tagline}</p>
                        )}
                      </div>
                    </div>

                    <DropdownMenu
                      items={[
                        {
                          icon: Edit,
                          label: t("superadmin.billing.edit_plan"),
                          onClick: () => router.push(`/superadmin/billing/plans/${plan.id}/edit`),
                        },
                        {
                          icon: Users,
                          label: t("superadmin.billing.view_subscribers"),
                          onClick: () => setSubscribersPlan(plan),
                        },
                        {
                          icon: plan.status === "active" ? ToggleLeft : ToggleRight,
                          label: plan.status === "active" ? t("superadmin.billing.deactivate") : t("superadmin.billing.activate"),
                          onClick: () => handleToggleStatus(plan),
                        },
                        { divider: true },
                        {
                          icon: Trash2,
                          label: t("superadmin.billing.archive_plan"),
                          danger: true,
                          onClick: () => setDeletingPlan(plan),
                        },
                      ]}
                    />
                  </div>

                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(plan.price_monthly, plan.currency)}
                      </span>
                      <span className="text-gray-500 text-sm">{t("superadmin.billing.per_month")}</span>
                    </div>
                    {plan.price_yearly > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">
                          {formatCurrency(plan.price_yearly, plan.currency)}{t("superadmin.billing.per_year")}
                        </span>
                        {plan.yearly_discount_pct > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600">
                            {t("superadmin.billing.save_pct", { pct: plan.yearly_discount_pct })}
                          </span>
                        )}
                      </div>
                    )}
                    {plan.trial_days > 0 && (
                      <p className="text-xs text-amber-600 mt-1.5">
                        {t("superadmin.billing.trial_days", { days: plan.trial_days })}
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {t("superadmin.billing.subscribers_count", {
                        count: plan.active_subscribers ?? 0,
                        plural: (plan.active_subscribers ?? 0) !== 1 ? "s" : "",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {t("superadmin.billing.features_count", {
                        count: plan.features_count ?? 0,
                        plural: (plan.features_count ?? 0) !== 1 ? "s" : "",
                      })}
                    </span>
                    <span className="capitalize text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-600">
                      {plan.tier}
                    </span>
                  </div>

                  {/* Expand / Collapse Features */}
                  <button
                    onClick={() => toggleExpand(plan.id)}
                    className="w-full flex items-center justify-between py-2 text-sm font-medium transition-colors hover:text-[#800020]"
                    style={{ color: isExpanded ? MAROON : "#6b7280" }}
                  >
                    <span>{isExpanded ? t("superadmin.billing.hide_features") : t("superadmin.billing.show_features")}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-2 animate-in slide-in-from-top-2">
                      {!detail ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                        </div>
                      ) : features.length === 0 ? (
                        <p className="text-xs text-gray-400 py-3">{t("superadmin.billing.no_features")}</p>
                      ) : (
                        features.map((f) => (
                          <div key={f.id} className="flex items-center gap-2.5">
                            {f.is_included ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-emerald-600" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                <X className="w-3 h-3 text-gray-300" />
                              </div>
                            )}
                            <span className={`text-sm ${f.is_included ? "text-gray-700" : "text-gray-400"}`}>
                              {f.name}
                              {f.rendered_value && f.feature_type !== "boolean" && (
                                <span className="ml-1 text-xs text-gray-400">({f.rendered_value})</span>
                              )}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom actions */}
                <div className="border-t border-gray-100 px-6 py-3 flex gap-2">
                  <button
                    onClick={() => router.push(`/superadmin/billing/plans/${plan.id}/edit`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> {t("superadmin.billing.edit")}
                  </button>
                  <button
                    onClick={() => setSubscribersPlan(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: MAROON }}
                  >
                    <Users className="w-3.5 h-3.5" /> {t("superadmin.billing.subscribers")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pending Plan Changes ──────────────── */}
      {changes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{t("superadmin.billing.pending_changes")}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{t("superadmin.billing.pending_changes_desc", { count: changes.length, plural: changes.length !== 1 ? "s" : "" })}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_tenant")}</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_change")}</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_type")}</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_requested")}</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {changes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-gray-900">{c.tenant_name}</div>
                      <div className="text-xs text-gray-400">{c.requested_by_email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">
                      {c.from_plan_name || "—"} → {c.to_plan_name || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium capitalize ${
                        c.change_type === "upgrade" ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {c.change_type === "upgrade"
                          ? <ArrowUpRight className="w-3.5 h-3.5" />
                          : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {c.change_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setReviewingChange(c)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        {t("superadmin.billing.review")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quick Links ──────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            icon: Users,
            color: "text-blue-500",
            label: t("superadmin.billing.quick_link_subscriptions"),
            desc: t("superadmin.billing.quick_link_subscriptions_desc"),
            href: "/superadmin/billing/subscriptions",
          },
          {
            icon: DollarSign,
            color: "text-emerald-500",
            label: t("superadmin.billing.quick_link_invoices"),
            desc: t("superadmin.billing.quick_link_invoices_desc"),
            href: "/superadmin/billing/invoices",
          },
          {
            icon: TrendingUp,
            color: "text-purple-500",
            label: t("superadmin.billing.quick_link_analytics"),
            desc: t("superadmin.billing.quick_link_analytics_desc"),
            href: "/superadmin/billing/analytics",
          },
        ].map((link) => (
          <button
            key={link.label}
            onClick={() => router.push(link.href)}
            className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-[#800020]/30 hover:shadow-md transition-all group"
          >
            <link.icon className={`w-7 h-7 ${link.color} mb-2`} />
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#800020] transition-colors">{link.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
          </button>
        ))}
      </div>

      {/* ── Modals ──────────────────────────── */}
      {subscribersPlan && (
        <SubscribersModal
          plan={subscribersPlan}
          onClose={() => setSubscribersPlan(null)}
        />
      )}

      {deletingPlan && (
        <DeleteModal
          plan={deletingPlan}
          loading={actionLoading}
          onClose={() => setDeletingPlan(null)}
          onConfirm={handleDelete}
        />
      )}

      {reviewingChange && (
        <ReviewModal
          change={reviewingChange}
          loading={actionLoading}
          onClose={() => setReviewingChange(null)}
          onReview={handleReview}
        />
      )}
    </SuperAdminLayout>
    </div>
  );
}