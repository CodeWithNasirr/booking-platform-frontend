"use client";

import { useState, useEffect, useCallback } from "react";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useTranslation } from "@/lib/t";
import Cookies from "js-cookie";
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Loader2,
  Eye,
  DollarSign,
  RotateCcw,
  Zap,
  Activity,
  Timer,
  FileWarning,
  ArrowRightLeft,
  MonitorCheck,
} from "lucide-react";

const MAROON = "#8B1E3F";
const API = process.env.NEXT_PUBLIC_API_URL || "";

function platformHeaders() {
  const token = Cookies.get("platform_access_token") || Cookies.get("access_token");
  return { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" };
}

async function platformFetch(path) {
  const res = await fetch(`${API}${path}`, { headers: platformHeaders(), credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function platformPost(path) {
  const res = await fetch(`${API}${path}`, { method: "POST", headers: platformHeaders(), credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function platformPostBody(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST", headers: platformHeaders(), credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.detail || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ────────────────────────────────────────────────
   Superadmin Issue-Refund Modal
   Select tenant → refundable record → full/partial → confirm.
   Reuses the backend by-record endpoint (tenant Refund model + Moyasar).
   ──────────────────────────────────────────────── */

function SuperadminRefundModal({ onClose, onDone, t }) {
  const [tenantSearch, setTenantSearch] = useState("");
  const [tenants, setTenants] = useState([]);
  const [tenant, setTenant] = useState(null);

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [record, setRecord] = useState(null);

  const [mode, setMode] = useState("full");
  const [partial, setPartial] = useState("");
  const [detail, setDetail] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Tenant search
  useEffect(() => {
    if (tenant) return undefined;
    let cancelled = false;
    const h = setTimeout(async () => {
      try {
        const qs = tenantSearch ? `?search=${encodeURIComponent(tenantSearch)}` : "";
        const d = await platformFetch(`/api/v1/platform/tenants/${qs}`);
        const list = Array.isArray(d) ? d : (d?.results || []);
        if (!cancelled) setTenants(list.slice(0, 15));
      } catch { if (!cancelled) setTenants([]); }
    }, 250);
    return () => { cancelled = true; clearTimeout(h); };
  }, [tenantSearch, tenant]);

  // Refundable records for the chosen tenant
  useEffect(() => {
    if (!tenant || record) return undefined;
    let cancelled = false;
    setLoadingRecords(true);
    (async () => {
      try {
        const d = await platformFetch(
          `/api/v1/platform/refunds/refundable/?tenant_id=${tenant.id}`);
        if (!cancelled) setRecords(d?.results || []);
      } catch { if (!cancelled) setRecords([]); }
      finally { if (!cancelled) setLoadingRecords(false); }
    })();
    return () => { cancelled = true; };
  }, [tenant, record]);

  const refundable = record ? parseFloat(record.refundable) : 0;
  const amount = mode === "full" ? refundable
    : Math.min(parseFloat(partial || "0") || 0, refundable);
  const amountValid = amount > 0 && amount <= refundable + 1e-9;
  const money = (v) => `${record?.currency || ""} ${Number(v).toFixed(2)}`;

  async function submit() {
    if (!record || !amountValid) return;
    setSubmitting(true); setError("");
    try {
      await platformPostBody("/api/v1/platform/refunds/by-record/", {
        tenant_id: tenant.id,
        [record.kind === "booking" ? "booking_id" : "order_id"]: record.id,
        amount: amount.toFixed(2),
        reason: "admin_initiated",
        reason_detail: detail,
      });
      onDone?.();
      onClose();
    } catch (e) {
      setError(e.message || "Refund failed");
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">{t("monitoring_refund_issue_title")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">{error}</div>
          )}

          {/* 1 — tenant */}
          {!tenant && (
            <>
              <div className="relative">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-gray-400" />
                <input autoFocus value={tenantSearch} onChange={e => setTenantSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 ps-9 pe-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": `${MAROON}30` }}
                  placeholder={t("monitoring_refund_tenant_search")} />
              </div>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {tenants.length === 0 && (
                  <div className="p-6 text-center text-sm text-gray-400">{t("monitoring_refund_no_tenants")}</div>
                )}
                {tenants.map(tn => (
                  <button key={tn.id} onClick={() => setTenant(tn)}
                    className="w-full text-start p-3 hover:bg-rose-50/60 text-sm font-medium text-gray-900">
                    {tn.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 2 — record */}
          {tenant && !record && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900">{tenant.name}</span>
                <button onClick={() => { setTenant(null); setRecords([]); }}
                  className="text-xs text-gray-500 underline">{t("monitoring_refund_change")}</button>
              </div>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {loadingRecords && (
                  <div className="p-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline text-gray-400" /></div>
                )}
                {!loadingRecords && records.length === 0 && (
                  <div className="p-6 text-center text-sm text-gray-400">{t("monitoring_refund_no_records")}</div>
                )}
                {records.map(r => (
                  <button key={`${r.kind}:${r.id}`} onClick={() => setRecord(r)}
                    className="w-full text-start p-3 hover:bg-rose-50/60 flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="font-medium text-gray-900 truncate">{r.number}</span>
                      <span className="block text-xs text-gray-500 truncate">{r.customer_name || r.customer_email}</span>
                    </span>
                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: MAROON }}>
                      {r.currency} {Number(r.refundable).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 3 — amount + confirm */}
          {record && (
            <>
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{record.number}</span>
                  <button onClick={() => setRecord(null)} className="text-xs text-gray-500 underline">
                    {t("monitoring_refund_change")}
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {tenant.name} · {t("monitoring_refund_refundable")}: <b>{money(refundable)}</b>
                </div>
              </div>

              <div className="flex gap-2">
                {["full", "partial"].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium ${mode === m ? "text-white" : "text-gray-600 bg-gray-100"}`}
                    style={mode === m ? { backgroundColor: MAROON } : {}}>
                    {t(`monitoring_refund_${m}`)}
                  </button>
                ))}
              </div>

              {mode === "partial" && (
                <input type="number" step="0.01" min="0" max={refundable} value={partial}
                  onChange={e => setPartial(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="0.00" />
              )}

              <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder={t("monitoring_refund_note")} />

              {confirming && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    {t("monitoring_refund_warning", { amount: money(amount), tenant: tenant.name })}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {record && (
          <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 sticky bottom-0 bg-white">
            <button onClick={onClose} disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              {t("common.cancel") || "Cancel"}
            </button>
            {!confirming ? (
              <button onClick={() => setConfirming(true)} disabled={!amountValid}
                className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: MAROON }}>
                {t("monitoring_refund_review")}
              </button>
            ) : (
              <button onClick={submit} disabled={submitting || !amountValid}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: MAROON }}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("monitoring_refund_confirm")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(d, t) {
  if (!d) return "";

  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);

  if (hrs < 1) {
    return t("time_minutes_ago", {
      m: Math.floor(diff / 60000),
    });
  }

  if (hrs < 24) {
    return t("time_hours_ago", { h: hrs });
  }

  return t("time_days_ago", {
    d: Math.floor(hrs / 24),
  });
}

const REFUND_STATUS = {
  requested:  { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500" },
  approved:   { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500" },
  processing: { bg: "bg-purple-50",   text: "text-purple-700",  dot: "bg-purple-500" },
  completed:  { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  failed:     { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500" },
  cancelled:  { bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400" },
};

const DISPUTE_STATUS = {
  needs_response: { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
  under_review:   { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  won:            { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  lost:           { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500" },
  closed:         { bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400" },
};

function StatusBadge({ status, map, t }) {
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(`monitoring_status_${status}`) || status?.replace(/_/g, " ")}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value ?? "—"}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count, urgent }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active ? "border-[#8B1E3F] text-[#8B1E3F]" : "border-transparent text-gray-500 hover:text-gray-700"
      }`}>
      <Icon className="w-4 h-4" />
      {label}
      {count != null && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
          urgent ? "bg-red-100 text-red-700" : active ? "bg-[#8B1E3F]/10 text-[#8B1E3F]" : "bg-gray-100 text-gray-500"
        }`}>{count}</span>
      )}
    </button>
  );
}

/* ════════════════════════════════════════════════════
   MAIN PAGE — READ-ONLY MONITORING
   ════════════════════════════════════════════════════ */

export default function PlatformMonitoringPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [refunds, setRefunds] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [webhookFailures, setWebhookFailures] = useState([]);

  const [toast, setToast] = useState(null);
  const [showRefund, setShowRefund] = useState(false);
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      platformFetch("/api/v1/platform/refunds/?status=failed").then(d => setRefunds(Array.isArray(d) ? d : d?.results || [])).catch(() => {}),
      platformFetch("/api/v1/platform/disputes/?status=needs_response").then(d => setDisputes(Array.isArray(d) ? d : d?.results || [])).catch(() => {}),
      platformFetch("/api/v1/platform/reconciliation/stats/").then(setReconciliation).catch(() => {}),
      platformFetch("/api/v1/platform/webhooks/failures/").then(d => setWebhookFailures(Array.isArray(d) ? d : d?.results || [])).catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function triggerReconciliation() {
    try {
      await platformPost("/api/v1/platform/reconciliation/run/");
      showToast(t("monitoring_reconciliation_triggered"));
      setTimeout(loadAll, 5000);
    } catch { showToast(t("monitoring_failed"), "error"); }
  }

  const failedRefunds = refunds.length;
  const urgentDisputes = disputes.length;

  return (
    <SuperAdminLayout
      title={t("monitoring_title")}
      description={t("monitoring_description")}
      breadcrumbs={[{ label: t("monitoring_breadcrumb") }]}
    >
      <div className="space-y-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
            {toast.msg}
          </div>
        )}

        {/* Monitoring badge + issue-refund action */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg w-fit">
            <MonitorCheck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">
              {t("monitoring_badge")}
            </span>
          </div>
          <button onClick={() => setShowRefund(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: MAROON }}>
            <RotateCcw className="w-4 h-4" />
            {t("monitoring_refund_issue_title")}
          </button>
        </div>

        {showRefund && (
          <SuperadminRefundModal
            t={t}
            onClose={() => setShowRefund(false)}
            onDone={() => { showToast(t("monitoring_refund_success")); setTimeout(loadAll, 3000); }}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={XCircle} label={t("monitoring_stat_failed_refunds")} value={failedRefunds} color="from-red-500 to-red-600" />
          <StatCard icon={Shield} label={t("monitoring_stat_open_disputes")} value={urgentDisputes} color="from-amber-500 to-amber-600" />
          <StatCard icon={Activity} label={t("monitoring_stat_stuck_payments")} value={reconciliation?.stuck_bookings ?? "—"} color="from-purple-500 to-purple-600" />
          <StatCard icon={Activity} label={t("monitoring_stat_stuck_orders")} value={reconciliation?.stuck_orders ?? "—"} color="from-indigo-500 to-indigo-600" />
          <StatCard icon={FileWarning} label={t("monitoring_stat_webhook_errors")} value={webhookFailures.length} color="from-gray-500 to-gray-600" />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-0 overflow-x-auto">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")} icon={Activity} label={t("monitoring_tab_overview")} />
            <TabButton active={tab === "failed-refunds"} onClick={() => setTab("failed-refunds")} icon={XCircle} label={t("monitoring_tab_failed_refunds")} count={failedRefunds} urgent={failedRefunds > 0} />
            <TabButton active={tab === "disputes"} onClick={() => setTab("disputes")} icon={Shield} label={t("monitoring_tab_disputes")} count={urgentDisputes} urgent={urgentDisputes > 0} />
            <TabButton active={tab === "reconciliation"} onClick={() => setTab("reconciliation")} icon={ArrowRightLeft} label={t("monitoring_tab_reconciliation")} />
            <TabButton active={tab === "webhooks"} onClick={() => setTab("webhooks")} icon={Zap} label={t("monitoring_tab_webhooks")} count={webhookFailures.length} />
          </div>
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-4">
            {failedRefunds > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">{t("monitoring_failed_refunds_alert", { count: failedRefunds })}</p>
                  <p className="text-xs text-red-600 mt-1">{t("monitoring_failed_refunds_sub")}</p>
                </div>
              </div>
            )}
            {urgentDisputes > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{t("monitoring_disputes_alert", { count: urgentDisputes })}</p>
                  <p className="text-xs text-amber-600 mt-1">{t("monitoring_disputes_sub")}</p>
                </div>
              </div>
            )}
            {(reconciliation?.stuck_bookings > 0 || reconciliation?.stuck_orders > 0) && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <Activity className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    {t("monitoring_stuck_payments_alert", { count: (reconciliation?.stuck_bookings || 0) + (reconciliation?.stuck_orders || 0) })}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">{t("monitoring_stuck_payments_sub")}</p>
                </div>
              </div>
            )}
            {failedRefunds === 0 && urgentDisputes === 0 && !reconciliation?.stuck_bookings && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-emerald-800">{t("monitoring_all_healthy")}</p>
                <p className="text-xs text-emerald-600 mt-1">{t("monitoring_all_healthy_sub")}</p>
              </div>
            )}
          </div>
        )}

        {/* Failed Refunds (READ-ONLY) */}
        {tab === "failed-refunds" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {refunds.length === 0 ? (
              <div className="text-center py-16"><CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t("monitoring_no_failed_refunds")}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_refund_number")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_tenant")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_amount")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_error")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_retries")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_failed_at")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {refunds.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-3.5"><code className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">{r.refund_number}</code></td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{r.tenant_name || "—"}</td>
                        <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{r.currency} {r.customer_refund}</td>
                        <td className="px-5 py-3.5 text-xs text-red-600 max-w-xs truncate">{r.last_error?.slice(0, 80)}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{r.retry_count}/{r.max_retries}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{timeAgo(r.failed_at || r.created_at, t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Disputes (READ-ONLY) */}
        {tab === "disputes" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {disputes.length === 0 ? (
              <div className="text-center py-16"><CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t("monitoring_no_disputes")}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_dispute_number")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_tenant")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_amount")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_reason")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_status")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_deadline")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {disputes.map(d => {
                      const hoursLeft = d.evidence_due_by ? Math.max(0, (new Date(d.evidence_due_by) - Date.now()) / 3600000) : null;
                      const isUrgent = hoursLeft !== null && hoursLeft < 24;
                      return (
                        <tr key={d.id} className={`hover:bg-gray-50/60 ${isUrgent ? "bg-red-50/30" : ""}`}>
                          <td className="px-5 py-3.5"><code className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">{d.dispute_number}</code></td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">{d.tenant_name || "—"}</td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{d.currency} {d.amount}</td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">{d.reason?.replace(/_/g, " ")}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={d.status} map={DISPUTE_STATUS} t={t} /></td>
                          <td className="px-5 py-3.5">
                            {d.evidence_due_by ? (
                              <span className={`text-xs ${isUrgent ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                                {isUrgent && <Timer className="w-3 h-3 inline mr-1" />}
                                {hoursLeft < 1 ? t("monitoring_less_than_1h") : t("monitoring_hours_left", { h: Math.floor(hoursLeft) })}
                              </span>
                            ) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Reconciliation */}
        {tab === "reconciliation" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t("monitoring_reconciliation_title")}</h3>
                <p className="text-sm text-gray-500 mt-1">{t("monitoring_reconciliation_desc")}</p>
              </div>
              <button onClick={triggerReconciliation}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
                style={{ backgroundColor: MAROON }}>
                <RefreshCw className="w-4 h-4" /> {t("monitoring_run_reconciliation")}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm font-medium text-gray-700 mb-2">{t("monitoring_stuck_bookings")}</div>
                <div className="text-3xl font-semibold text-gray-900">{reconciliation?.stuck_bookings ?? "—"}</div>
                <p className="text-xs text-gray-400 mt-1">{t("monitoring_stuck_bookings_sub")}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm font-medium text-gray-700 mb-2">{t("monitoring_stuck_orders")}</div>
                <div className="text-3xl font-semibold text-gray-900">{reconciliation?.stuck_orders ?? "—"}</div>
                <p className="text-xs text-gray-400 mt-1">{t("monitoring_stuck_orders_sub")}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-sm font-medium text-gray-700 mb-2">{t("monitoring_stale_schedules")}</div>
                <div className="text-3xl font-semibold text-gray-900">{reconciliation?.stale_schedules ?? "—"}</div>
                <p className="text-xs text-gray-400 mt-1">{t("monitoring_stale_schedules_sub")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Webhooks */}
        {tab === "webhooks" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {webhookFailures.length === 0 ? (
              <div className="text-center py-16"><CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-3" /><p className="text-sm text-gray-500">{t("monitoring_no_webhooks")}</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_event_id")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_type")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_provider")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_error")}</th>
                      <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("monitoring_col_time")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {webhookFailures.map(w => (
                      <tr key={w.id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-3.5"><code className="text-[10px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded break-all">{w.external_event_id?.slice(0, 24)}...</code></td>
                        <td className="px-5 py-3.5 text-xs text-gray-700">{w.event_type}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{w.provider}</td>
                        <td className="px-5 py-3.5 text-xs text-red-600 max-w-xs truncate">{w.error?.slice(0, 80)}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{timeAgo(w.created_at, t)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}