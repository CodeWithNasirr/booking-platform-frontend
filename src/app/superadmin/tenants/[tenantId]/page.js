"use client";

import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import EditTenantModal from "../components/EditTenantModal";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ImpersonateButton from "@/components/superadmin/ImpersonateButton";
import { useTranslation } from "@/lib/t";

import {
  ArrowLeft, Globe, Users, Calendar, DollarSign, TrendingUp, Activity,
  Edit, Ban, CheckCircle, Mail, Phone, MapPin, ExternalLink, Download,
  Clock, Package, CreditCard, AlertCircle, Shield, FileText, Loader2, X,
  Save, AlertTriangle, Zap, ArrowUpDown, PlayCircle, XCircle, ChevronDown,
  Infinity, Hash, ToggleRight,
} from "lucide-react";

import {
  fetchTenant, fetchTenantMembers, suspendTenant, activateTenant,
  updateTenant, changeTenantPlan, cancelTenantSubscription, resumeTenantSubscription,
} from "@/lib/platformApi";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const MAROON = "#800020";
const MAROON_DARK = "#5C0018";

const STATUS_STYLES = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  trial: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  suspended: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

const TIER_STYLES = {
  free: { bg: "bg-gray-100", text: "text-gray-700" },
  starter: { bg: "bg-blue-50", text: "text-blue-700" },
  professional: { bg: "bg-purple-50", text: "text-purple-700" },
  enterprise: { bg: "bg-amber-50", text: "text-amber-700" },
};

const SUB_STATUS_STYLES = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700" },
  trialing: { bg: "bg-amber-50", text: "text-amber-700" },
  past_due: { bg: "bg-red-50", text: "text-red-700" },
  cancelled: { bg: "bg-gray-100", text: "text-gray-600" },
  expired: { bg: "bg-gray-100", text: "text-gray-500" },
  incomplete: { bg: "bg-orange-50", text: "text-orange-600" },
};

const DOC_STATUS_STYLES = {
  not_uploaded: { bg: "bg-gray-100", text: "text-gray-600" },
  pending: { bg: "bg-amber-50", text: "text-amber-700" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700" },
  rejected: { bg: "bg-red-50", text: "text-red-700" },
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function StatusBadge({ status, t, map = STATUS_STYLES }) {
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-700" };
  const isDoc = map === DOC_STATUS_STYLES;
  const label = isDoc
    ? t(`superadmin.tenant_detail.doc_status_${status}`)
    : t(`superadmin.tenant_detail.sub_status_${status}`) || status?.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
      {label}
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

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 break-all">{children || "—"}</span>
    </div>
  );
}

function formatDate(dateStr, locale = "en-US") {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(locale, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatCurrency(amount, currency = "USD", locale = "en-US") {
  if (amount == null) return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(num);
}

function buildAddress(t) {
  const parts = [t.address_line1, t.address_line2, t.city, t.state, t.postal_code, t.country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/* ────────────────────────────────────────────
   Modals
   ──────────────────────────────────────────── */

function SuspendModal({ tenant, onClose, onConfirm, loading, t }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("superadmin.tenant_detail.modals.suspend_title")}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            {t("superadmin.tenant_detail.modals.suspend_desc", { name: tenant?.name })}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t("superadmin.tenant_detail.modals.suspend_reason_placeholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
          />
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            {t("superadmin.common.cancel")}
          </button>
          <button onClick={() => onConfirm(reason)} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("superadmin.tenant_detail.actions.suspend")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivateModal({ tenant, onClose, onConfirm, loading, t }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("superadmin.tenant_detail.modals.activate_title")}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600">
            {t("superadmin.tenant_detail.modals.activate_desc", { name: tenant?.name })}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            {t("superadmin.common.cancel")}
          </button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: MAROON }}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("superadmin.tenant_detail.actions.activate")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePlanModal({ tenant, onClose, onConfirm, loading, t }) {
  const [planTier, setPlanTier] = useState(tenant?.subscription_tier || "starter");
  const [interval, setInterval] = useState("month");
  const tiers = ["free", "starter", "professional", "enterprise"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("superadmin.tenant_detail.modals.change_plan_title")}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            {t("superadmin.tenant_detail.modals.change_plan_desc", { name: tenant?.name })}
            {" "}
            {t("superadmin.tenant_detail.modals.change_plan_current", { tier: tenant?.subscription_tier })}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("superadmin.tenant_detail.modals.target_plan")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {tiers.map((tier) => (
                <button
                  key={tier}
                  onClick={() => setPlanTier(tier)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium border capitalize transition-all ${
                    planTier === tier
                      ? "border-[#800020] bg-[#800020]/5 text-[#800020] ring-2 ring-[#800020]/20"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  } ${tier === tenant?.subscription_tier ? "opacity-50" : ""}`}
                  disabled={tier === tenant?.subscription_tier}
                >
                  {t(`superadmin.tenants.tier_${tier}`) || tier}
                  {tier === tenant?.subscription_tier && (
                    <span className="block text-[10px] text-gray-400">{t("superadmin.common.current")}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {planTier !== "free" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("superadmin.tenant_detail.modals.billing_interval")}
              </label>
              <div className="flex gap-2">
                {["month", "year"].map((i) => (
                  <button
                    key={i}
                    onClick={() => setInterval(i)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      interval === i
                        ? "border-[#800020] bg-[#800020]/5 text-[#800020]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {i === "month" ? t("superadmin.common.monthly") : t("superadmin.common.yearly")}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                {t("superadmin.tenant_detail.modals.change_plan_warning")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            {t("superadmin.common.cancel")}
          </button>
          <button
            onClick={() => onConfirm(planTier, interval)}
            disabled={loading || planTier === tenant?.subscription_tier}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: MAROON }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("superadmin.tenant_detail.actions.change_plan")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.tenantId;
  const { t, isRTL } = useTranslation();

  const [tenant, setTenant] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [showSuspend, setShowSuspend] = useState(false);
  const [showActivate, setShowActivate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState(null);
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const tabs = [
    { key: "overview", label: t("superadmin.tenant_detail.tabs.overview") },
    { key: "billing", label: t("superadmin.tenant_detail.tabs.billing") },
    { key: "members", label: t("superadmin.tenant_detail.tabs.members") },
    { key: "activity", label: t("superadmin.tenant_detail.tabs.activity") },
  ];

  /* ── Data fetching ─────────────────────── */
  const loadTenant = useCallback(async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTenant(tenantId);
      setTenant(data);
    } catch (err) {
      setError(err.message || t("superadmin.tenant_detail.error_load"));
    } finally {
      setLoading(false);
    }
  }, [tenantId, t]);

  const loadMembers = useCallback(async () => {
    if (!tenantId) return;
    try {
      setMembersLoading(true);
      const data = await fetchTenantMembers(tenantId);
      setMembers(Array.isArray(data) ? data : data?.results || []);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadTenant(); }, [loadTenant]);
  useEffect(() => {
    if (activeTab === "members") loadMembers();
  }, [activeTab, loadMembers]);

  /* ── Tenant actions ────────────────────── */
  async function handleSuspend(reason) {
    try {
      setActionLoading(true);
      await suspendTenant(tenantId, reason);
      showToast(t("superadmin.tenant_detail.toast.suspend_success", { name: tenant.name }));
      setShowSuspend(false);
      loadTenant();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleActivate() {
    try {
      setActionLoading(true);
      await activateTenant(tenantId);
      showToast(t("superadmin.tenant_detail.toast.activate_success", { name: tenant.name }));
      setShowActivate(false);
      loadTenant();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEditSave(payload) {
    try {
      setActionLoading(true);
      const updated = await updateTenant(tenantId, payload);
      setTenant(updated);
      showToast(t("superadmin.tenant_detail.toast.update_success", { name: updated.name }));
      setShowEdit(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  /* ── Billing actions ───────────────────── */
  async function handleChangePlan(planTier, billingInterval) {
    try {
      setActionLoading(true);
      const result = await changeTenantPlan(tenantId, planTier, billingInterval);
      if (result.tenant) setTenant(result.tenant);
      else await loadTenant();
      showToast(result.detail || t("superadmin.tenant_detail.toast.plan_changed"));
      setShowChangePlan(false);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!window.confirm(t("superadmin.tenant_detail.confirm_cancel_subscription"))) return;
    try {
      setActionLoading(true);
      const result = await cancelTenantSubscription(tenantId);
      if (result.tenant) setTenant(result.tenant);
      else await loadTenant();
      showToast(result.detail || t("superadmin.tenant_detail.toast.cancelled"));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResumeSubscription() {
    try {
      setActionLoading(true);
      const result = await resumeTenantSubscription(tenantId);
      if (result.tenant) setTenant(result.tenant);
      else await loadTenant();
      showToast(result.detail || t("superadmin.tenant_detail.toast.resumed"));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  /* ── Loading / Error ───────────────────── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: MAROON }} />
        <p className="text-gray-500 text-sm">{t("superadmin.tenant_detail.loading")}</p>
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
        <button onClick={loadTenant} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: MAROON }}>
          {t("superadmin.common.retry")}
        </button>
      </div>
    );
  }

  if (!tenant) return null;

  /* ── Derived ───────────────────────────── */
  const address = buildAddress(tenant);
  const primaryDomain = tenant.domains?.find((d) => d.is_primary)?.domain;
  const sub = tenant.subscription;
  const tierStyle = TIER_STYLES[tenant.subscription_tier] || TIER_STYLES.free;

  // Group plan features by category
  const groupedFeatures = {};
  if (sub?.plan_features) {
    for (const f of sub.plan_features) {
      const cat = f.category || "core";
      if (!groupedFeatures[cat]) groupedFeatures[cat] = [];
      groupedFeatures[cat].push(f);
    }
  }

  const featureCategoryLabels = {
    core: t("superadmin.tenant_detail.feature_category.core"),
    providers: t("superadmin.tenant_detail.feature_category.providers"),
    bookings: t("superadmin.tenant_detail.feature_category.bookings"),
    communication: t("superadmin.tenant_detail.feature_category.communication"),
    analytics: t("superadmin.tenant_detail.feature_category.analytics"),
    support: t("superadmin.tenant_detail.feature_category.support"),
    integrations: t("superadmin.tenant_detail.feature_category.integrations"),
    branding: t("superadmin.tenant_detail.feature_category.branding"),
  };

  /* ────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────── */
  return (
    <SuperAdminLayout>
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"} ${isRTL ? "left-4" : "right-4"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Back */}
        <button onClick={() => router.push("/superadmin/tenants")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          {t("superadmin.tenant_detail.back_to_tenants")}
        </button>

        {/* ── Header ──────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${MAROON}, ${MAROON_DARK})` }}>
                {tenant.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{tenant.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                  {tenant.email && <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {tenant.email}</span>}
                  {tenant.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {tenant.phone}</span>}
                  {primaryDomain && <span className="inline-flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {primaryDomain}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={tenant.status} t={t} />
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${tierStyle.bg} ${tierStyle.text}`}>
                {t(`superadmin.tenants.tier_${tenant.subscription_tier}`) || tenant.subscription_tier}
              </span>
              <div className="flex items-center gap-2 ml-2">
                <ImpersonateButton tenantId={tenant.id} tenantName={tenant.name} />
                <button onClick={() => setShowEdit(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Edit className="w-4 h-4" /> {t("superadmin.tenant_detail.actions.edit")}
                </button>
                {(tenant.status === "active" || tenant.status === "trial") ? (
                  <button onClick={() => setShowSuspend(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50">
                    <Ban className="w-4 h-4" /> {t("superadmin.tenant_detail.actions.suspend")}
                  </button>
                ) : tenant.status === "suspended" ? (
                  <button onClick={() => setShowActivate(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: MAROON }}>
                    <CheckCircle className="w-4 h-4" /> {t("superadmin.tenant_detail.actions.activate")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label={t("superadmin.tenant_detail.stats.members")} value={tenant.stats?.total_members} color="from-blue-500 to-blue-600" />
          <StatCard icon={Users} label={t("superadmin.tenant_detail.stats.providers")} value={tenant.stats?.providers} color="from-purple-500 to-purple-600" />
          <StatCard icon={Users} label={t("superadmin.tenant_detail.stats.customers")} value={tenant.stats?.customers} color="from-emerald-500 to-emerald-600" />
          <StatCard icon={Calendar} label={t("superadmin.tenant_detail.stats.created")} value={formatDate(tenant.created_at)} color="from-amber-500 to-amber-600" />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-[#800020] text-[#800020]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ════════════════════════════════════════
           TAB: Overview
           ════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">{t("superadmin.tenant_detail.overview.business_info")}</h3>
              <InfoRow label={t("superadmin.tenant_detail.overview.business_name")}>{tenant.name}</InfoRow>
              <InfoRow label={t("superadmin.tenant_detail.overview.slug")}>{tenant.slug}</InfoRow>
              <InfoRow label={t("superadmin.tenant_detail.overview.email")}>{tenant.email}</InfoRow>
              <InfoRow label={t("superadmin.tenant_detail.overview.phone")}>{tenant.phone}</InfoRow>
              <InfoRow label={t("superadmin.tenant_detail.overview.address")}>{address}</InfoRow>
              <InfoRow label={t("superadmin.tenant_detail.overview.service_type")}><span className="capitalize">{tenant.service_type?.replace(/_/g, " ")}</span></InfoRow>
              <InfoRow label={t("superadmin.tenant_detail.overview.has_providers")}>{tenant.has_providers ? t("superadmin.common.yes") : t("superadmin.common.no")}</InfoRow>
              <InfoRow label={t("superadmin.tenant_detail.overview.description")}>{tenant.description || "—"}</InfoRow>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{t("superadmin.tenant_detail.overview.domains")}</h4>
                {tenant.domains?.length > 0 ? (
                  <div className="space-y-2">
                    {tenant.domains.map((d) => (
                      <div key={d.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-900">{d.domain}</span>
                          {d.is_primary && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded">{t("superadmin.tenant_detail.overview.primary")}</span>}
                          {d.is_custom && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded">{t("superadmin.tenant_detail.overview.custom")}</span>}
                        </div>
                        {d.is_verified ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">{t("superadmin.tenant_detail.overview.no_domains")}</p>}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t("superadmin.tenant_detail.overview.owner_info")}</h3>
                <InfoRow label={t("superadmin.tenant_detail.overview.owner_name")}>{tenant.owner?.full_name}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.overview.owner_email")}>{tenant.owner?.email}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.overview.owner_phone")}>{tenant.owner?.phone}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.overview.last_login")}>{tenant.owner?.last_login ? formatDate(tenant.owner.last_login) : t("superadmin.common.never")}</InfoRow>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t("superadmin.tenant_detail.overview.account_details")}</h3>
                <InfoRow label={t("superadmin.tenant_detail.overview.tenant_id")}><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tenant.id}</code></InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.overview.created")}>{formatDate(tenant.created_at)}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.overview.last_updated")}>{formatDate(tenant.updated_at)}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.overview.timezone")}>{tenant.timezone}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.overview.currency")}>{tenant.default_currency}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.overview.language")}>{tenant.default_language}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.overview.onboarding")}>
                  {tenant.onboarding_completed
                    ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> {t("superadmin.common.completed")}</span>
                    : <span className="text-amber-600">{t("superadmin.tenant_detail.overview.onboarding_step", { step: tenant.onboarding_step })}</span>}
                </InfoRow>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t("superadmin.tenant_detail.overview.business_document")}</h3>
                <InfoRow label={t("superadmin.common.status")}><StatusBadge status={tenant.business_document_status} t={t} map={DOC_STATUS_STYLES} /></InfoRow>
                {tenant.business_document && (
                  <InfoRow label={t("superadmin.common.document")}>
                    <a href={tenant.business_document} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: MAROON }}>
                      <FileText className="w-3.5 h-3.5" /> {t("superadmin.common.view")}
                    </a>
                  </InfoRow>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
           TAB: Billing
           ════════════════════════════════════════ */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* Cancellation banner */}
            {sub?.cancel_at_period_end && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">{t("superadmin.tenant_detail.billing.cancelling_title")}</p>
                    <p className="text-xs text-red-700">
                      {t("superadmin.tenant_detail.billing.access_ends")}{" "}
                      {formatDate(sub.status === "trialing" ? sub.trial_end : sub.current_period_end)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResumeSubscription}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                  {t("superadmin.tenant_detail.billing.resume")}
                </button>
              </div>
            )}

            {/* Billing action bar */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowChangePlan(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: MAROON }}
              >
                <ArrowUpDown className="w-4 h-4" /> {t("superadmin.tenant_detail.actions.change_plan")}
              </button>

              {sub && !sub.cancel_at_period_end && sub.status !== "cancelled" && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> {t("superadmin.tenant_detail.actions.cancel_subscription")}
                </button>
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* ── Subscription Details ── */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-5">{t("superadmin.tenant_detail.billing.subscription")}</h3>
                {sub ? (
                  <>
                    <InfoRow label={t("superadmin.tenant_detail.billing.plan")}>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${tierStyle.bg} ${tierStyle.text}`}>
                        {sub.plan_name}
                      </span>
                    </InfoRow>
                    <InfoRow label={t("superadmin.common.status")}><StatusBadge status={sub.status} t={t} map={SUB_STATUS_STYLES} /></InfoRow>
                    <InfoRow label={t("superadmin.tenant_detail.billing.billing")}>
                      <span className="capitalize">{sub.billing_interval === "year" ? t("superadmin.common.yearly") : t("superadmin.common.monthly")}</span>
                    </InfoRow>
                    <InfoRow label={t("superadmin.tenant_detail.billing.current_price")}>
                      {formatCurrency(sub.current_price, sub.currency)}
                      <span className="text-gray-400 ml-1">/ {sub.billing_interval === "year" ? t("superadmin.common.year") : t("superadmin.common.month")}</span>
                    </InfoRow>
                    <InfoRow label={t("superadmin.tenant_detail.billing.mrr")}>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        <TrendingUp className="w-3.5 h-3.5" /> {formatCurrency(sub.mrr, sub.currency)}
                      </span>
                    </InfoRow>
                    <InfoRow label={t("superadmin.tenant_detail.billing.start_date")}>{formatDate(sub.start_date)}</InfoRow>
                    <InfoRow label={t("superadmin.tenant_detail.billing.current_period")}>
                      {formatDate(sub.current_period_start)} — {formatDate(sub.current_period_end)}
                    </InfoRow>

                    {sub.status === "trialing" && (
                      <>
                        <InfoRow label={t("superadmin.tenant_detail.billing.trial_period")}>{formatDate(sub.trial_start)} — {formatDate(sub.trial_end)}</InfoRow>
                        <InfoRow label={t("superadmin.tenant_detail.billing.trial_remaining")}>
                          <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {sub.days_remaining_in_trial} {t("superadmin.tenant_detail.billing.days", { count: sub.days_remaining_in_trial })}
                          </span>
                        </InfoRow>
                      </>
                    )}

                    {sub.status !== "trialing" && sub.trial_end && (
                      <InfoRow label={t("superadmin.tenant_detail.billing.trial_ended")}>{formatDate(sub.trial_end)}</InfoRow>
                    )}

                    <InfoRow label={t("superadmin.tenant_detail.billing.trial_used")}>
                      {sub.has_used_trial
                        ? <span className="inline-flex items-center gap-1 text-gray-500"><CheckCircle className="w-3.5 h-3.5" /> {t("superadmin.common.yes")}</span>
                        : <span className="text-blue-600">{t("superadmin.tenant_detail.billing.eligible")}</span>}
                    </InfoRow>

                    {sub.cancelled_at && <InfoRow label={t("superadmin.tenant_detail.billing.cancelled_at")}>{formatDate(sub.cancelled_at)}</InfoRow>}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">{t("superadmin.tenant_detail.billing.no_subscription")}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t("superadmin.tenant_detail.billing.tier_label")}: <span className="capitalize font-medium">{tenant.subscription_tier}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* ── Stripe Integration ── */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-5">{t("superadmin.tenant_detail.billing.stripe_integration")}</h3>

                  {/* Platform billing (tenant pays us) */}
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {t("superadmin.tenant_detail.billing.platform_billing")}
                    <span className="ml-2 text-[10px] font-normal normal-case text-gray-400">{t("superadmin.tenant_detail.billing.tenant_pays_you")}</span>
                  </h4>
                  <InfoRow label={t("superadmin.tenant_detail.billing.subscription_id")}>
                    {sub?.stripe_subscription_id
                      ? <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{sub.stripe_subscription_id}</code>
                      : <span className="text-gray-400">{t("superadmin.common.none")}</span>}
                  </InfoRow>
                  <InfoRow label={t("superadmin.tenant_detail.billing.customer_id")}>
                    {sub?.stripe_customer_id
                      ? <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{sub.stripe_customer_id}</code>
                      : <span className="text-gray-400">{t("superadmin.common.none")}</span>}
                  </InfoRow>

                  {/* Stripe Connect (their customers pay them) */}
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {t("superadmin.tenant_detail.billing.stripe_connect")}
                      <span className="ml-2 text-[10px] font-normal normal-case text-gray-400">{t("superadmin.tenant_detail.billing.customers_pay_tenant")}</span>
                    </h4>
                    <InfoRow label={t("superadmin.tenant_detail.billing.account_id")}>
                      {tenant.stripe_account_id
                        ? <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{tenant.stripe_account_id}</code>
                        : <span className="text-gray-400">{t("superadmin.tenant_detail.billing.not_connected")}</span>}
                    </InfoRow>
                    <InfoRow label={t("superadmin.tenant_detail.billing.account_status")}>
                      <span className="capitalize">{tenant.stripe_account_status || "—"}</span>
                    </InfoRow>
                    <InfoRow label={t("superadmin.tenant_detail.billing.platform_fee")}>
                      {tenant.platform_fee_percent != null ? `${tenant.platform_fee_percent}%` : "—"}
                    </InfoRow>
                  </div>
                </div>

                {/* Plan Pricing */}
                {sub && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-5">{t("superadmin.tenant_detail.billing.plan_pricing")}</h3>
                    <InfoRow label={t("superadmin.common.monthly")}>{formatCurrency(sub.plan_price_monthly, sub.currency)}</InfoRow>
                    <InfoRow label={t("superadmin.common.yearly")}>{formatCurrency(sub.plan_price_yearly, sub.currency)}</InfoRow>
                    {parseFloat(sub.plan_price_yearly) > 0 && parseFloat(sub.plan_price_monthly) > 0 && (
                      <InfoRow label={t("superadmin.tenant_detail.billing.yearly_savings")}>
                        <span className="text-emerald-600 font-medium">
                          {Math.round((1 - parseFloat(sub.plan_price_yearly) / (parseFloat(sub.plan_price_monthly) * 12)) * 100)}% {t("superadmin.common.off")}
                        </span>
                      </InfoRow>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Plan Features (from SubscriptionPlan) ── */}
            {sub?.plan_features && sub.plan_features.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-5">
                  {t("superadmin.tenant_detail.billing.plan_features")} — {sub.plan_name}
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(groupedFeatures).map(([category, features]) => (
                    <div key={category}>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        {featureCategoryLabels[category] || category}
                      </h4>
                      <div className="space-y-2">
                        {features.map((f) => (
                          <div key={f.id} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2">
                              {f.feature_type === "boolean" ? (
                                f.is_included
                                  ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                  : <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                              ) : f.feature_type === "unlimited" ? (
                                <Infinity className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              ) : (
                                <Hash className="w-4 h-4 text-purple-500 flex-shrink-0" />
                              )}
                              <span className={`text-sm ${f.is_included ? "text-gray-800" : "text-gray-400"}`}>
                                {f.name}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-gray-500 ml-2">
                              {f.formatted_value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tenant Feature Flags (from tenant.features JSON) ── */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t("superadmin.tenant_detail.billing.feature_flags")}</h3>
                {tenant.features && Object.keys(tenant.features).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(tenant.features).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-gray-600">{key.replace(/_/g, " ")}</span>
                        {typeof val === "boolean" ? (
                          val ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-gray-300" />
                        ) : (
                          <span className="text-gray-900 font-medium">{String(val)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">{t("superadmin.tenant_detail.billing.no_feature_flags")}</p>}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">{t("superadmin.tenant_detail.billing.provider_config")}</h3>
                <InfoRow label={t("superadmin.tenant_detail.billing.self_registration")}>{tenant.allow_provider_self_register ? t("superadmin.common.allowed") : t("superadmin.common.disabled")}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.billing.require_approval")}>{tenant.require_provider_approval ? t("superadmin.common.yes") : t("superadmin.common.no")}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.billing.default_commission")}>{tenant.default_provider_commission != null ? `${tenant.default_provider_commission}%` : "—"}</InfoRow>
                <InfoRow label={t("superadmin.tenant_detail.billing.auto_assign")}>{tenant.auto_assign_bookings ? t("superadmin.common.enabled") : t("superadmin.common.disabled")}</InfoRow>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
           TAB: Members
           ════════════════════════════════════════ */}
        {activeTab === "members" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                {t("superadmin.tenant_detail.members.title")}{" "}
                <span className="ml-2 text-sm font-normal text-gray-500">({members.length})</span>
              </h3>
              <button onClick={loadMembers} disabled={membersLoading} className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
                {membersLoading ? t("superadmin.common.loading") : t("superadmin.common.refresh")}
              </button>
            </div>
            {membersLoading && members.length === 0 ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : members.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">{t("superadmin.tenant_detail.members.no_members")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.tenant_detail.members.column_user")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.tenant_detail.members.column_role")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.tenant_detail.members.column_status")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.tenant_detail.members.column_joined")}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium text-gray-900">{m.name || "—"}</div>
                          <div className="text-xs text-gray-500">{m.email}</div>
                        </td>
                        <td className="px-5 py-3.5"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-gray-100 text-gray-700">{m.role}</span></td>
                        <td className="px-5 py-3.5">
                          {m.is_active
                            ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t("superadmin.common.active")}</span>
                            : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> {t("superadmin.common.inactive")}</span>}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(m.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: Activity */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-5">{t("superadmin.tenant_detail.activity.title")}</h3>
            <p className="text-sm text-gray-400">{t("superadmin.tenant_detail.activity.empty")}</p>
          </div>
        )}

        {/* ── Modals ──────────────────────────── */}
        {showSuspend && <SuspendModal tenant={tenant} loading={actionLoading} onClose={() => setShowSuspend(false)} onConfirm={handleSuspend} t={t} />}
        {showActivate && <ActivateModal tenant={tenant} loading={actionLoading} onClose={() => setShowActivate(false)} onConfirm={handleActivate} t={t} />}
        {showEdit && <EditTenantModal tenant={tenant} loading={actionLoading} onClose={() => setShowEdit(false)} onSave={handleEditSave} />}
        {showChangePlan && <ChangePlanModal tenant={tenant} loading={actionLoading} onClose={() => setShowChangePlan(false)} onConfirm={handleChangePlan} t={t} />}
      </div>
    </SuperAdminLayout>
  );
}


// "use client";
// import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
// import EditTenantModal from "../components/EditTenantModal";
// import { useState, useEffect, useCallback } from "react";
// import { useParams, useRouter } from "next/navigation";
// import ImpersonateButton from "@/components/superadmin/ImpersonateButton";
// import {
//   ArrowLeft,
//   Globe,
//   Users,
//   Calendar,
//   DollarSign,
//   TrendingUp,
//   Activity,
//   Edit,
//   Ban,
//   CheckCircle,
//   Mail,
//   Phone,
//   MapPin,
//   ExternalLink,
//   Download,
//   Clock,
//   Package,
//   CreditCard,
//   AlertCircle,
//   Shield,
//   FileText,
//   Loader2,
//   X,
//   Save,
//   AlertTriangle,
//   Zap,
//   ArrowUpDown,
//   PlayCircle,
//   XCircle,
//   ChevronDown,
//   Infinity,
//   Hash,
//   ToggleRight,
// } from "lucide-react";
// import {
//   fetchTenant,
//   fetchTenantMembers,
//   suspendTenant,
//   activateTenant,
//   updateTenant,
//   changeTenantPlan,
//   cancelTenantSubscription,
//   resumeTenantSubscription,
// } from "@/lib/platformApi";

// /* ────────────────────────────────────────────
//    Constants
//    ──────────────────────────────────────────── */

// const MAROON = "#800020";
// const MAROON_DARK = "#5C0018";

// const TABS = [
//   { key: "overview", label: "Overview" },
//   { key: "billing", label: "Billing" },
//   { key: "members", label: "Members" },
//   { key: "activity", label: "Activity" },
// ];

// const STATUS_STYLES = {
//   active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
//   trial: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
//   suspended: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
//   pending: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
//   cancelled: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
// };

// const TIER_STYLES = {
//   free: { bg: "bg-gray-100", text: "text-gray-700" },
//   starter: { bg: "bg-blue-50", text: "text-blue-700" },
//   professional: { bg: "bg-purple-50", text: "text-purple-700" },
//   enterprise: { bg: "bg-amber-50", text: "text-amber-700" },
// };

// const SUB_STATUS_STYLES = {
//   active: { bg: "bg-emerald-50", text: "text-emerald-700" },
//   trialing: { bg: "bg-amber-50", text: "text-amber-700" },
//   past_due: { bg: "bg-red-50", text: "text-red-700" },
//   cancelled: { bg: "bg-gray-100", text: "text-gray-600" },
//   expired: { bg: "bg-gray-100", text: "text-gray-500" },
//   incomplete: { bg: "bg-orange-50", text: "text-orange-600" },
// };

// const DOC_STATUS_STYLES = {
//   not_uploaded: { bg: "bg-gray-100", text: "text-gray-600", label: "Not Uploaded" },
//   pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending Review" },
//   approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Approved" },
//   rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
// };

// const FEATURE_CATEGORY_LABELS = {
//   core: "Core Features",
//   providers: "Provider Management",
//   bookings: "Booking System",
//   communication: "Communication",
//   analytics: "Analytics & Reports",
//   support: "Support",
//   integrations: "Integrations",
//   branding: "Branding & Customization",
// };

// /* ────────────────────────────────────────────
//    Helpers
//    ──────────────────────────────────────────── */

// function StatusBadge({ status, map = STATUS_STYLES }) {
//   const s = map[status] || { bg: "bg-gray-100", text: "text-gray-700" };
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
//       {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
//       {(map === DOC_STATUS_STYLES ? s.label : null) || status?.replace(/_/g, " ")}
//     </span>
//   );
// }

// function StatCard({ icon: Icon, label, value, color }) {
//   return (
//     <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
//       <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
//         <Icon className="w-5 h-5 text-white" />
//       </div>
//       <div className="text-2xl font-semibold text-gray-900">{value ?? "—"}</div>
//       <div className="text-sm text-gray-500 mt-0.5">{label}</div>
//     </div>
//   );
// }

// function InfoRow({ label, children }) {
//   return (
//     <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-0 py-3 border-b border-gray-100 last:border-0">
//       <span className="text-sm text-gray-500 sm:w-40 shrink-0">{label}</span>
//       <span className="text-sm text-gray-900 break-all">{children || "—"}</span>
//     </div>
//   );
// }

// function formatDate(dateStr) {
//   if (!dateStr) return "—";
//   return new Date(dateStr).toLocaleDateString("en-US", {
//     year: "numeric", month: "short", day: "numeric",
//   });
// }

// function formatCurrency(amount, currency = "USD") {
//   if (amount == null) return "—";
//   const num = typeof amount === "string" ? parseFloat(amount) : amount;
//   if (isNaN(num)) return "—";
//   return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
// }

// function buildAddress(t) {
//   const parts = [t.address_line1, t.address_line2, t.city, t.state, t.postal_code, t.country].filter(Boolean);
//   return parts.length ? parts.join(", ") : null;
// }

// /* ────────────────────────────────────────────
//    Modals
//    ──────────────────────────────────────────── */

// function SuspendModal({ tenant, onClose, onConfirm, loading }) {
//   const [reason, setReason] = useState("");
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
//         <div className="flex items-center justify-between p-5 border-b border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-900">Suspend Tenant</h3>
//           <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
//         </div>
//         <div className="p-5 space-y-4">
//           <p className="text-sm text-gray-600">Suspend <strong>{tenant?.name}</strong>? This restricts their platform access.</p>
//           <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason (optional)..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]" />
//         </div>
//         <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
//           <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
//           <button onClick={() => onConfirm(reason)} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
//             {loading && <Loader2 className="w-4 h-4 animate-spin" />} Suspend
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ActivateModal({ tenant, onClose, onConfirm, loading }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
//         <div className="flex items-center justify-between p-5 border-b border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-900">Activate Tenant</h3>
//           <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
//         </div>
//         <div className="p-5">
//           <p className="text-sm text-gray-600">Reactivate <strong>{tenant?.name}</strong>? This restores full access.</p>
//         </div>
//         <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
//           <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
//           <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: MAROON }}>
//             {loading && <Loader2 className="w-4 h-4 animate-spin" />} Activate
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ChangePlanModal({ tenant, onClose, onConfirm, loading }) {
//   const [planTier, setPlanTier] = useState(tenant?.subscription_tier || "starter");
//   const [interval, setInterval] = useState("month");
//   const tiers = ["free", "starter", "professional", "enterprise"];

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
//         <div className="flex items-center justify-between p-5 border-b border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-900">Change Plan</h3>
//           <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
//         </div>
//         <div className="p-5 space-y-4">
//           <p className="text-sm text-gray-600">
//             Change plan for <strong>{tenant?.name}</strong>.
//             Current: <span className="font-semibold capitalize">{tenant?.subscription_tier}</span>
//           </p>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Plan</label>
//             <div className="grid grid-cols-2 gap-2">
//               {tiers.map((t) => (
//                 <button
//                   key={t}
//                   onClick={() => setPlanTier(t)}
//                   className={`px-3 py-2.5 rounded-lg text-sm font-medium border capitalize transition-all ${
//                     planTier === t
//                       ? "border-[#800020] bg-[#800020]/5 text-[#800020] ring-2 ring-[#800020]/20"
//                       : "border-gray-200 text-gray-600 hover:border-gray-300"
//                   } ${t === tenant?.subscription_tier ? "opacity-50" : ""}`}
//                   disabled={t === tenant?.subscription_tier}
//                 >
//                   {t}
//                   {t === tenant?.subscription_tier && (
//                     <span className="block text-[10px] text-gray-400">Current</span>
//                   )}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {planTier !== "free" && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Interval</label>
//               <div className="flex gap-2">
//                 {["month", "year"].map((i) => (
//                   <button
//                     key={i}
//                     onClick={() => setInterval(i)}
//                     className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
//                       interval === i
//                         ? "border-[#800020] bg-[#800020]/5 text-[#800020]"
//                         : "border-gray-200 text-gray-600 hover:border-gray-300"
//                     }`}
//                   >
//                     {i === "month" ? "Monthly" : "Yearly"}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
//             <div className="flex items-start gap-2">
//               <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
//               <p className="text-xs text-amber-700">
//                 This will modify the tenant's Stripe subscription immediately. If they have an active subscription, it will be updated via Stripe. The webhook will sync the change.
//               </p>
//             </div>
//           </div>
//         </div>
//         <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
//           <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
//           <button
//             onClick={() => onConfirm(planTier, interval)}
//             disabled={loading || planTier === tenant?.subscription_tier}
//             className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
//             style={{ backgroundColor: MAROON }}
//           >
//             {loading && <Loader2 className="w-4 h-4 animate-spin" />}
//             Change Plan
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════
//    MAIN PAGE
//    ════════════════════════════════════════════ */

// export default function TenantDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const tenantId = params.tenantId;

//   const [tenant, setTenant] = useState(null);
//   const [members, setMembers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [membersLoading, setMembersLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState("overview");

//   const [showSuspend, setShowSuspend] = useState(false);
//   const [showActivate, setShowActivate] = useState(false);
//   const [showEdit, setShowEdit] = useState(false);
//   const [showChangePlan, setShowChangePlan] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false);

//   const [toast, setToast] = useState(null);
//   function showToast(msg, type = "success") {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 3500);
//   }

//   /* ── Data fetching ─────────────────────── */
//   const loadTenant = useCallback(async () => {
//     if (!tenantId) return;
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await fetchTenant(tenantId);
//       setTenant(data);
//     } catch (err) {
//       setError(err.message || "Failed to load tenant details");
//     } finally {
//       setLoading(false);
//     }
//   }, [tenantId]);

//   const loadMembers = useCallback(async () => {
//     if (!tenantId) return;
//     try {
//       setMembersLoading(true);
//       const data = await fetchTenantMembers(tenantId);
//       setMembers(Array.isArray(data) ? data : data?.results || []);
//     } catch {
//       setMembers([]);
//     } finally {
//       setMembersLoading(false);
//     }
//   }, [tenantId]);

//   useEffect(() => { loadTenant(); }, [loadTenant]);
//   useEffect(() => {
//     if (activeTab === "members") loadMembers();
//   }, [activeTab, loadMembers]);

//   /* ── Tenant actions ────────────────────── */
//   async function handleSuspend(reason) {
//     try {
//       setActionLoading(true);
//       await suspendTenant(tenantId, reason);
//       showToast(`"${tenant.name}" suspended.`);
//       setShowSuspend(false);
//       loadTenant();
//     } catch (err) { showToast(err.message, "error"); }
//     finally { setActionLoading(false); }
//   }

//   async function handleActivate() {
//     try {
//       setActionLoading(true);
//       await activateTenant(tenantId);
//       showToast(`"${tenant.name}" activated.`);
//       setShowActivate(false);
//       loadTenant();
//     } catch (err) { showToast(err.message, "error"); }
//     finally { setActionLoading(false); }
//   }

//   async function handleEditSave(payload) {
//     try {
//       setActionLoading(true);
//       const updated = await updateTenant(tenantId, payload);
//       setTenant(updated);
//       showToast(`"${updated.name}" updated.`);
//       setShowEdit(false);
//     } catch (err) { showToast(err.message, "error"); }
//     finally { setActionLoading(false); }
//   }

//   /* ── Billing actions ───────────────────── */
//   async function handleChangePlan(planTier, billingInterval) {
//     try {
//       setActionLoading(true);
//       const result = await changeTenantPlan(tenantId, planTier, billingInterval);
//       if (result.tenant) setTenant(result.tenant);
//       else await loadTenant();
//       showToast(result.detail || "Plan changed.");
//       setShowChangePlan(false);
//     } catch (err) { showToast(err.message, "error"); }
//     finally { setActionLoading(false); }
//   }

//   async function handleCancelSubscription() {
//     if (!confirm("Cancel this tenant's subscription? They'll retain access until period end.")) return;
//     try {
//       setActionLoading(true);
//       const result = await cancelTenantSubscription(tenantId);
//       if (result.tenant) setTenant(result.tenant);
//       else await loadTenant();
//       showToast(result.detail || "Subscription cancelled.");
//     } catch (err) { showToast(err.message, "error"); }
//     finally { setActionLoading(false); }
//   }

//   async function handleResumeSubscription() {
//     try {
//       setActionLoading(true);
//       const result = await resumeTenantSubscription(tenantId);
//       if (result.tenant) setTenant(result.tenant);
//       else await loadTenant();
//       showToast(result.detail || "Subscription resumed.");
//     } catch (err) { showToast(err.message, "error"); }
//     finally { setActionLoading(false); }
//   }

//   /* ── Loading / Error ───────────────────── */
//   if (loading) {
//     return (
//       <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
//         <Loader2 className="w-8 h-8 animate-spin" style={{ color: MAROON }} />
//         <p className="text-gray-500 text-sm">Loading tenant details...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
//         <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
//           <AlertCircle className="w-7 h-7 text-red-500" />
//         </div>
//         <p className="text-gray-700 font-medium">{error}</p>
//         <button onClick={loadTenant} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: MAROON }}>Retry</button>
//       </div>
//     );
//   }

//   if (!tenant) return null;

//   /* ── Derived ───────────────────────────── */
//   const address = buildAddress(tenant);
//   const primaryDomain = tenant.domains?.find((d) => d.is_primary)?.domain;
//   const sub = tenant.subscription;
//   console.log(sub,"sub")
//   const tierStyle = TIER_STYLES[tenant.subscription_tier] || TIER_STYLES.free;

//   // Group plan features by category
//   const groupedFeatures = {};
//   if (sub?.plan_features) {
//     for (const f of sub.plan_features) {
//       const cat = f.category || "core";
//       if (!groupedFeatures[cat]) groupedFeatures[cat] = [];
//       groupedFeatures[cat].push(f);
//     }
//   }

//   /* ────────────────────────────────────────────
//      RENDER
//      ──────────────────────────────────────────── */
//   return (
//     <SuperAdminLayout>
//       <div className="space-y-6">
//         {/* Toast */}
//         {toast && (
//           <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
//             {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
//             {toast.msg}
//           </div>
//         )}

//         {/* Back */}
//         <button onClick={() => router.push("/superadmin/tenants")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
//           <ArrowLeft className="w-4 h-4" /> Back to Tenants
//         </button>

//         {/* ── Header ──────────────────────────── */}
//         <div className="bg-white rounded-xl border border-gray-200 p-6">
//           <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
//             <div className="flex items-start gap-4">
//               <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ background: `linear-gradient(135deg, ${MAROON}, ${MAROON_DARK})` }}>
//                 {tenant.name?.charAt(0)?.toUpperCase()}
//               </div>
//               <div className="min-w-0">
//                 <h1 className="text-2xl font-bold text-gray-900 truncate">{tenant.name}</h1>
//                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
//                   {tenant.email && <span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {tenant.email}</span>}
//                   {tenant.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {tenant.phone}</span>}
//                   {primaryDomain && <span className="inline-flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {primaryDomain}</span>}
//                 </div>
//               </div>
//             </div>
//             <div className="flex flex-wrap items-center gap-2">
//               <StatusBadge status={tenant.status} />
//               <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${tierStyle.bg} ${tierStyle.text}`}>
//                 {tenant.subscription_tier}
//               </span>
//               <div className="flex items-center gap-2 ml-2">
//                 <ImpersonateButton
//                   tenantId={tenant.id}
//                   tenantName={tenant.name}
//                 />
//                 <button onClick={() => setShowEdit(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
//                   <Edit className="w-4 h-4" /> Edit
//                 </button>
//                 {(tenant.status === "active" || tenant.status === "trial") ? (
//                   <button onClick={() => setShowSuspend(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50">
//                     <Ban className="w-4 h-4" /> Suspend
//                   </button>
//                 ) : tenant.status === "suspended" ? (
//                   <button onClick={() => setShowActivate(true)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: MAROON }}>
//                     <CheckCircle className="w-4 h-4" /> Activate
//                   </button>
//                 ) : null}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Quick Stats */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatCard icon={Users} label="Members" value={tenant.stats?.total_members} color="from-blue-500 to-blue-600" />
//           <StatCard icon={Users} label="Providers" value={tenant.stats?.providers} color="from-purple-500 to-purple-600" />
//           <StatCard icon={Users} label="Customers" value={tenant.stats?.customers} color="from-emerald-500 to-emerald-600" />
//           <StatCard icon={Calendar} label="Created" value={formatDate(tenant.created_at)} color="from-amber-500 to-amber-600" />
//         </div>

//         {/* Tabs */}
//         <div className="border-b border-gray-200">
//           <nav className="flex gap-1 -mb-px overflow-x-auto">
//             {TABS.map((tab) => (
//               <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key ? "border-[#800020] text-[#800020]" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
//                 {tab.label}
//               </button>
//             ))}
//           </nav>
//         </div>

//         {/* ════════════════════════════════════════
//            TAB: Overview (unchanged)
//            ════════════════════════════════════════ */}
//         {activeTab === "overview" && (
//           <div className="grid lg:grid-cols-2 gap-6">
//             <div className="bg-white rounded-xl border border-gray-200 p-6">
//               <h3 className="text-base font-semibold text-gray-900 mb-4">Business Information</h3>
//               <InfoRow label="Business Name">{tenant.name}</InfoRow>
//               <InfoRow label="Slug">{tenant.slug}</InfoRow>
//               <InfoRow label="Email">{tenant.email}</InfoRow>
//               <InfoRow label="Phone">{tenant.phone}</InfoRow>
//               <InfoRow label="Address">{address}</InfoRow>
//               <InfoRow label="Service Type"><span className="capitalize">{tenant.service_type?.replace(/_/g, " ")}</span></InfoRow>
//               <InfoRow label="Has Providers">{tenant.has_providers ? "Yes" : "No"}</InfoRow>
//               <InfoRow label="Description">{tenant.description || "—"}</InfoRow>
//               <div className="mt-5 pt-4 border-t border-gray-100">
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">Domains</h4>
//                 {tenant.domains?.length > 0 ? (
//                   <div className="space-y-2">
//                     {tenant.domains.map((d) => (
//                       <div key={d.id} className="flex items-center justify-between text-sm">
//                         <div className="flex items-center gap-2">
//                           <Globe className="w-3.5 h-3.5 text-gray-400" />
//                           <span className="text-gray-900">{d.domain}</span>
//                           {d.is_primary && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded">Primary</span>}
//                           {d.is_custom && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-50 text-purple-600 rounded">Custom</span>}
//                         </div>
//                         {d.is_verified ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
//                       </div>
//                     ))}
//                   </div>
//                 ) : <p className="text-sm text-gray-400">No domains configured</p>}
//               </div>
//             </div>
//             <div className="space-y-6">
//               <div className="bg-white rounded-xl border border-gray-200 p-6">
//                 <h3 className="text-base font-semibold text-gray-900 mb-4">Owner Information</h3>
//                 <InfoRow label="Name">{tenant.owner?.full_name}</InfoRow>
//                 <InfoRow label="Email">{tenant.owner?.email}</InfoRow>
//                 <InfoRow label="Phone">{tenant.owner?.phone}</InfoRow>
//                 <InfoRow label="Last Login">{tenant.owner?.last_login ? formatDate(tenant.owner.last_login) : "Never"}</InfoRow>
//               </div>
//               <div className="bg-white rounded-xl border border-gray-200 p-6">
//                 <h3 className="text-base font-semibold text-gray-900 mb-4">Account Details</h3>
//                 <InfoRow label="Tenant ID"><code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tenant.id}</code></InfoRow>
//                 <InfoRow label="Created">{formatDate(tenant.created_at)}</InfoRow>
//                 <InfoRow label="Last Updated">{formatDate(tenant.updated_at)}</InfoRow>
//                 <InfoRow label="Timezone">{tenant.timezone}</InfoRow>
//                 <InfoRow label="Currency">{tenant.default_currency}</InfoRow>
//                 <InfoRow label="Language">{tenant.default_language}</InfoRow>
//                 <InfoRow label="Onboarding">
//                   {tenant.onboarding_completed ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> Completed</span> : <span className="text-amber-600">Step {tenant.onboarding_step}</span>}
//                 </InfoRow>
//               </div>
//               <div className="bg-white rounded-xl border border-gray-200 p-6">
//                 <h3 className="text-base font-semibold text-gray-900 mb-4">Business Document</h3>
//                 <InfoRow label="Status"><StatusBadge status={tenant.business_document_status} map={DOC_STATUS_STYLES} /></InfoRow>
//                 {tenant.business_document && (
//                   <InfoRow label="Document"><a href={tenant.business_document} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ color: MAROON }}><FileText className="w-3.5 h-3.5" /> View</a></InfoRow>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ════════════════════════════════════════
//            TAB: Billing
//            ════════════════════════════════════════ */}
//         {activeTab === "billing" && (
//           <div className="space-y-6">
//             {/* Cancellation banner */}
//             {sub?.cancel_at_period_end && (
//               <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200">
//                 <div className="flex items-center gap-3">
//                   <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
//                   <div>
//                     <p className="text-sm font-semibold text-red-900">Subscription cancelling</p>
//                     <p className="text-xs text-red-700">
//                       Access ends{" "}
//                       {formatDate(
//                         sub.status === "trialing"
//                           ? sub.trial_end
//                           : sub.current_period_end
//                       )}
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={handleResumeSubscription}
//                   disabled={actionLoading}
//                   className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-1.5"
//                 >
//                   {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
//                   Resume
//                 </button>
//               </div>
//             )}

//             {/* Billing action bar */}
//             <div className="flex flex-wrap gap-2">
//               <button
//                 onClick={() => setShowChangePlan(true)}
//                 className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
//                 style={{ backgroundColor: MAROON }}
//               >
//                 <ArrowUpDown className="w-4 h-4" /> Change Plan
//               </button>

//               {sub && !sub.cancel_at_period_end && sub.status !== "cancelled" && (
//                 <button
//                   onClick={handleCancelSubscription}
//                   disabled={actionLoading}
//                   className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
//                 >
//                   <XCircle className="w-4 h-4" /> Cancel Subscription
//                 </button>
//               )}
//             </div>

//             <div className="grid lg:grid-cols-2 gap-6">
//               {/* ── Subscription Details ── */}
//               <div className="bg-white rounded-xl border border-gray-200 p-6">
//                 <h3 className="text-base font-semibold text-gray-900 mb-5">Subscription</h3>
//                 {sub ? (
//                   <>
//                     <InfoRow label="Plan">
//                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${tierStyle.bg} ${tierStyle.text}`}>
//                         {sub.plan_name}
//                       </span>
//                     </InfoRow>
//                     <InfoRow label="Status"><StatusBadge status={sub.status} map={SUB_STATUS_STYLES} /></InfoRow>
//                     <InfoRow label="Billing">
//                       <span className="capitalize">{sub.billing_interval === "year" ? "Yearly" : "Monthly"}</span>
//                     </InfoRow>
//                     <InfoRow label="Current Price">
//                       {formatCurrency(sub.current_price, sub.currency)}
//                       <span className="text-gray-400 ml-1">/ {sub.billing_interval}</span>
//                     </InfoRow>
//                     <InfoRow label="MRR">
//                       <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
//                         <TrendingUp className="w-3.5 h-3.5" /> {formatCurrency(sub.mrr, sub.currency)}
//                       </span>
//                     </InfoRow>
//                     <InfoRow label="Start Date">{formatDate(sub.start_date)}</InfoRow>
//                     <InfoRow label="Current Period">
//                       {formatDate(sub.current_period_start)} — {formatDate(sub.current_period_end)}
//                     </InfoRow>

//                     {sub.status === "trialing" && (
//                       <>
//                         <InfoRow label="Trial Period">{formatDate(sub.trial_start)} — {formatDate(sub.trial_end)}</InfoRow>
//                         <InfoRow label="Trial Remaining">
//                           <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
//                             <Clock className="w-3.5 h-3.5" />
//                             {sub.days_remaining_in_trial} day{sub.days_remaining_in_trial !== 1 ? "s" : ""}
//                           </span>
//                         </InfoRow>
//                       </>
//                     )}

//                     {sub.status !== "trialing" && sub.trial_end && (
//                       <InfoRow label="Trial Ended">{formatDate(sub.trial_end)}</InfoRow>
//                     )}

//                     <InfoRow label="Trial Used">
//                       {sub.has_used_trial
//                         ? <span className="inline-flex items-center gap-1 text-gray-500"><CheckCircle className="w-3.5 h-3.5" /> Yes</span>
//                         : <span className="text-blue-600">Eligible</span>}
//                     </InfoRow>

//                     {sub.cancelled_at && <InfoRow label="Cancelled At">{formatDate(sub.cancelled_at)}</InfoRow>}
//                   </>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center py-8 text-center">
//                     <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
//                       <Package className="w-6 h-6 text-gray-400" />
//                     </div>
//                     <p className="text-sm text-gray-500 font-medium">No subscription record</p>
//                     <p className="text-xs text-gray-400 mt-1">Tier: <span className="capitalize font-medium">{tenant.subscription_tier}</span></p>
//                   </div>
//                 )}
//               </div>

//               {/* ── Stripe Integration ── */}
//               <div className="space-y-6">
//                 <div className="bg-white rounded-xl border border-gray-200 p-6">
//                   <h3 className="text-base font-semibold text-gray-900 mb-5">Stripe Integration</h3>

//                   {/* Platform billing (tenant pays us) */}
//                   <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                     Platform Billing
//                     <span className="ml-2 text-[10px] font-normal normal-case text-gray-400">(tenant pays you)</span>
//                   </h4>
//                   <InfoRow label="Subscription ID">
//                     {sub?.stripe_subscription_id
//                       ? <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{sub.stripe_subscription_id}</code>
//                       : <span className="text-gray-400">None</span>}
//                   </InfoRow>
//                   <InfoRow label="Customer ID">
//                     {sub?.stripe_customer_id
//                       ? <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{sub.stripe_customer_id}</code>
//                       : <span className="text-gray-400">None</span>}
//                   </InfoRow>

//                   {/* Stripe Connect (their customers pay them) */}
//                   <div className="mt-5 pt-4 border-t border-gray-100">
//                     <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                       Stripe Connect
//                       <span className="ml-2 text-[10px] font-normal normal-case text-gray-400">(customers pay tenant)</span>
//                     </h4>
//                     <InfoRow label="Account ID">
//                       {tenant.stripe_account_id
//                         ? <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{tenant.stripe_account_id}</code>
//                         : <span className="text-gray-400">Not connected</span>}
//                     </InfoRow>
//                     <InfoRow label="Account Status">
//                       <span className="capitalize">{tenant.stripe_account_status || "—"}</span>
//                     </InfoRow>
//                     <InfoRow label="Platform Fee">
//                       {tenant.platform_fee_percent != null ? `${tenant.platform_fee_percent}%` : "—"}
//                     </InfoRow>
//                   </div>
//                 </div>

//                 {/* Plan Pricing */}
//                 {sub && (
//                   <div className="bg-white rounded-xl border border-gray-200 p-6">
//                     <h3 className="text-base font-semibold text-gray-900 mb-5">Plan Pricing</h3>
//                     <InfoRow label="Monthly">{formatCurrency(sub.plan_price_monthly, sub.currency)}</InfoRow>
//                     <InfoRow label="Yearly">{formatCurrency(sub.plan_price_yearly, sub.currency)}</InfoRow>
//                     {parseFloat(sub.plan_price_yearly) > 0 && parseFloat(sub.plan_price_monthly) > 0 && (
//                       <InfoRow label="Yearly Savings">
//                         <span className="text-emerald-600 font-medium">
//                           {Math.round((1 - parseFloat(sub.plan_price_yearly) / (parseFloat(sub.plan_price_monthly) * 12)) * 100)}% off
//                         </span>
//                       </InfoRow>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* ── Plan Features (from SubscriptionPlan) ── */}
//             {sub?.plan_features && sub.plan_features.length > 0 && (
//               <div className="bg-white rounded-xl border border-gray-200 p-6">
//                 <h3 className="text-base font-semibold text-gray-900 mb-5">Plan Features — {sub.plan_name}</h3>
//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {Object.entries(groupedFeatures).map(([category, features]) => (
//                     <div key={category}>
//                       <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
//                         {FEATURE_CATEGORY_LABELS[category] || category}
//                       </h4>
//                       <div className="space-y-2">
//                         {features.map((f) => (
//                           <div key={f.id} className="flex items-center justify-between py-1.5">
//                             <div className="flex items-center gap-2">
//                               {f.feature_type === "boolean" ? (
//                                 f.is_included
//                                   ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
//                                   : <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
//                               ) : f.feature_type === "unlimited" ? (
//                                 <Infinity className="w-4 h-4 text-blue-500 flex-shrink-0" />
//                               ) : (
//                                 <Hash className="w-4 h-4 text-purple-500 flex-shrink-0" />
//                               )}
//                               <span className={`text-sm ${f.is_included ? "text-gray-800" : "text-gray-400"}`}>
//                                 {f.name}
//                               </span>
//                             </div>
//                             <span className="text-xs font-medium text-gray-500 ml-2">
//                               {f.formatted_value}
//                             </span>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* ── Tenant Feature Flags (from tenant.features JSON) ── */}
//             <div className="grid lg:grid-cols-2 gap-6">
//               <div className="bg-white rounded-xl border border-gray-200 p-6">
//                 <h3 className="text-base font-semibold text-gray-900 mb-4">Tenant Feature Flags</h3>
//                 {tenant.features && Object.keys(tenant.features).length > 0 ? (
//                   <div className="space-y-2">
//                     {Object.entries(tenant.features).map(([key, val]) => (
//                       <div key={key} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
//                         <span className="text-gray-600">{key.replace(/_/g, " ")}</span>
//                         {typeof val === "boolean" ? (
//                           val ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-gray-300" />
//                         ) : (
//                           <span className="text-gray-900 font-medium">{String(val)}</span>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 ) : <p className="text-sm text-gray-400">No feature flags configured.</p>}
//               </div>

//               <div className="bg-white rounded-xl border border-gray-200 p-6">
//                 <h3 className="text-base font-semibold text-gray-900 mb-4">Provider Configuration</h3>
//                 <InfoRow label="Self Registration">{tenant.allow_provider_self_register ? "Allowed" : "Disabled"}</InfoRow>
//                 <InfoRow label="Require Approval">{tenant.require_provider_approval ? "Yes" : "No"}</InfoRow>
//                 <InfoRow label="Default Commission">{tenant.default_provider_commission != null ? `${tenant.default_provider_commission}%` : "—"}</InfoRow>
//                 <InfoRow label="Auto-assign">{tenant.auto_assign_bookings ? "Enabled" : "Disabled"}</InfoRow>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ════════════════════════════════════════
//            TAB: Members
//            ════════════════════════════════════════ */}
//         {activeTab === "members" && (
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <div className="flex items-center justify-between p-5 border-b border-gray-200">
//               <h3 className="text-base font-semibold text-gray-900">
//                 Team Members <span className="ml-2 text-sm font-normal text-gray-500">({members.length})</span>
//               </h3>
//               <button onClick={loadMembers} disabled={membersLoading} className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">
//                 {membersLoading ? "Loading..." : "Refresh"}
//               </button>
//             </div>
//             {membersLoading && members.length === 0 ? (
//               <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
//             ) : members.length === 0 ? (
//               <div className="text-center py-12 text-gray-400 text-sm">No members found</div>
//             ) : (
//               <div className="overflow-x-auto">
//                 <table className="w-full">
//                   <thead><tr className="bg-gray-50 text-left">
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
//                   </tr></thead>
//                   <tbody className="divide-y divide-gray-100">
//                     {members.map((m) => (
//                       <tr key={m.id} className="hover:bg-gray-50/60">
//                         <td className="px-5 py-3.5">
//                           <div className="text-sm font-medium text-gray-900">{m.name || "—"}</div>
//                           <div className="text-xs text-gray-500">{m.email}</div>
//                         </td>
//                         <td className="px-5 py-3.5"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize bg-gray-100 text-gray-700">{m.role}</span></td>
//                         <td className="px-5 py-3.5">
//                           {m.is_active
//                             ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span>
//                             : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" /> Inactive</span>}
//                         </td>
//                         <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(m.created_at)}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         )}

//         {/* TAB: Activity */}
//         {activeTab === "activity" && (
//           <div className="bg-white rounded-xl border border-gray-200 p-6">
//             <h3 className="text-base font-semibold text-gray-900 mb-5">Recent Activity</h3>
//             <p className="text-sm text-gray-400">Activity log will be connected from PlatformAuditLog.</p>
//           </div>
//         )}

//         {/* ── Modals ──────────────────────────── */}
//         {showSuspend && <SuspendModal tenant={tenant} loading={actionLoading} onClose={() => setShowSuspend(false)} onConfirm={handleSuspend} />}
//         {showActivate && <ActivateModal tenant={tenant} loading={actionLoading} onClose={() => setShowActivate(false)} onConfirm={handleActivate} />}
//         {showEdit && <EditTenantModal tenant={tenant} loading={actionLoading} onClose={() => setShowEdit(false)} onSave={handleEditSave} />}
//         {showChangePlan && <ChangePlanModal tenant={tenant} loading={actionLoading} onClose={() => setShowChangePlan(false)} onConfirm={handleChangePlan} />}
//       </div>
//     </SuperAdminLayout>
//   );
// }