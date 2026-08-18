"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/apiClient";
import {
  RotateCcw,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Filter,
  Plus,
  ArrowRight,
  Zap,
  AlertTriangle,
  FileText,
  Calendar,
} from "lucide-react";

const MAROON = "#8B1E3F";

const activeTenant = Cookies.get("active_tenant");

const tenantApi = (url, options = {}) =>
  apiFetch(url, activeTenant, options);

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(d, t) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("refunds.time.justNow");
  if (mins < 60) return t("refunds.time.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("refunds.time.hoursAgo", { count: hrs });
  return t("refunds.time.daysAgo", { count: Math.floor(hrs / 24) });
}

/* ────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  requested:  { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500",   icon: Clock,       labelKey: "refunds.status.pendingReview" },
  approved:   { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500",    icon: CheckCircle, labelKey: "refunds.status.approved" },
  processing: { bg: "bg-purple-50",   text: "text-purple-700",  dot: "bg-purple-500",  icon: Loader2,     labelKey: "refunds.status.processing" },
  completed:  { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle, labelKey: "refunds.status.completed" },
  failed:     { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500",     icon: XCircle,     labelKey: "refunds.status.failed" },
  cancelled:  { bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400",    icon: XCircle,     labelKey: "refunds.status.cancelled" },
};

function StatusBadge({ status, t }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.cancelled;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {t(s.labelKey)}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value ?? "—"}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Issue Refund Modal
   ──────────────────────────────────────────────── */

function IssueRefundModal({ onClose, onSubmit, submitting, t }) {
  const [type, setType] = useState("booking");
  const [entityId, setEntityId] = useState("");
  const [reason, setReason] = useState("admin_initiated");
  const [detail, setDetail] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [skipPolicy, setSkipPolicy] = useState(false);

  const reasonOptions = [
    { value: "admin_initiated", labelKey: "refunds.reason.adminInitiated" },
    { value: "customer_cancelled", labelKey: "refunds.reason.customerCancelled" },
    { value: "service_not_delivered", labelKey: "refunds.reason.serviceNotDelivered" },
    { value: "quality_issue", labelKey: "refunds.reason.qualityIssue" },
    { value: "duplicate_payment", labelKey: "refunds.reason.duplicatePayment" },
  ];

  function handleSubmit() {
    const payload = {
      [type === "booking" ? "booking_id" : "order_id"]: entityId,
      reason,
      reason_detail: detail,
      skip_policy: skipPolicy,
    };
    if (skipPolicy && customAmount) {
      payload.amount = customAmount;
    }
    onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("refunds.modal.issue.title")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {["booking", "order"].map(tType => (
              <button key={tType} onClick={() => setType(tType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  type === tType ? "text-white" : "text-gray-600 bg-gray-100"
                }`}
                style={type === tType ? { backgroundColor: MAROON } : {}}>
                {t(`refunds.modal.issue.${tType}`)}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t(`refunds.modal.issue.${type}Id`)}
            </label>
            <input value={entityId} onChange={e => setEntityId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
              placeholder="UUID" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("refunds.modal.issue.reason")}</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30">
              {reasonOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("refunds.modal.issue.notes")}</label>
            <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
              placeholder={t("refunds.modal.issue.notesPlaceholder")} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="skipPolicy" checked={skipPolicy}
              onChange={e => setSkipPolicy(e.target.checked)}
              className="rounded border-gray-300" />
            <label htmlFor="skipPolicy" className="text-xs text-gray-600">
              {t("refunds.modal.issue.skipPolicy")}
            </label>
          </div>

          {skipPolicy && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("refunds.modal.issue.refundAmount")}</label>
              <input type="number" step="0.01" value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
                placeholder="0.00" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            {t("common.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={submitting || !entityId}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: MAROON }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("refunds.modal.issue.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Detail Modal with Timeline
   ──────────────────────────────────────────────── */

function RefundDetailModal({ refund, onClose, onApprove, onReject, onRetry, t }) {
  if (!refund) return null;

  const timeline = refund.timeline || [];
  const canApprove = refund.status === "requested" && refund.requires_manual_review;
  const canRetry = refund.status === "failed";

  const summaryFields = [
    { labelKey: "refunds.detail.source", value: refund.booking_number || refund.order_number || "—" },
    { labelKey: "refunds.detail.customer", value: refund.customer_name || refund.customer_email || "—" },
    { labelKey: "refunds.detail.requested", value: `${refund.currency} ${refund.requested_amount}` },
    { labelKey: "refunds.detail.approved", value: refund.approved_amount ? `${refund.currency} ${refund.approved_amount}` : "—" },
    { labelKey: "refunds.detail.customerGets", value: `${refund.currency} ${refund.customer_refund}` },
    { labelKey: "refunds.detail.policy", value: refund.policy_applied || "—" },
    { labelKey: "refunds.detail.gateway", value: refund.gateway_provider || "—" },
    { labelKey: "refunds.detail.gatewayRef", value: refund.external_refund_id || "—" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[5vh] overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{t("refunds.detail.title", { number: refund.refund_number })}</h3>
            <StatusBadge status={refund.status} t={t} />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {summaryFields.map(({ labelKey, value }) => (
              <div key={labelKey}>
                <span className="text-xs text-gray-500 block">{t(labelKey)}</span>
                <span className="text-xs font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          {refund.last_error && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs font-medium text-red-700 mb-0.5">{t("refunds.detail.lastError")}</p>
              <p className="text-xs text-red-600 break-words">{refund.last_error}</p>
              <p className="text-[10px] text-red-400 mt-1">
                {t("refunds.detail.retry", { count: refund.retry_count, max: refund.max_retries })}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{t("refunds.detail.timeline")}</h4>
            <div className="space-y-3">
              {timeline.map((ev, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 mt-1 shrink-0" />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-medium text-gray-900">{ev.event}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{ev.detail}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{ev.actor}</span>
                      {ev.time && <span className="text-[10px] text-gray-400">· {formatDate(ev.time)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(canApprove || canRetry) && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-200 shrink-0">
            {canApprove && (
              <>
                <button onClick={() => onReject(refund.id)}
                  className="px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                  {t("refunds.detail.reject")}
                </button>
                <button onClick={() => onApprove(refund.id)}
                  className="px-4 py-2 text-xs font-medium text-white rounded-lg bg-emerald-600 hover:bg-emerald-700">
                  {t("refunds.detail.approve")}
                </button>
              </>
            )}
            {canRetry && (
              <button onClick={() => onRetry(refund.id)}
                className="px-4 py-2 text-xs font-medium text-white rounded-lg"
                style={{ backgroundColor: MAROON }}>
                {t("refunds.detail.retryBtn")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════ */

function RefundsContent() {
  const { t } = useApp();

  const [loading, setLoading] = useState(true);
  const [refunds, setRefunds] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showIssue, setShowIssue] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── Load ────────────────────────────── */
  const loadRefunds = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, page_size: 20 });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const data = await tenantApi(`/api/v1/payments/tenant/refunds/?${params}`);
      setRefunds(data.results || []);
      setTotalCount(data.count || 0);
      setTotalPages(data.pages || 1);
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  const loadStats = useCallback(async () => {
    try {
      const data = await tenantApi("/api/v1/payments/tenant/refunds/stats/");
      setStats(data);
    } catch {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadRefunds(); }, [loadRefunds]);
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  /* ── Load detail with timeline ────────── */
  async function openDetail(refund) {
    try {
      const full = await tenantApi(`/api/v1/payments/tenant/refunds/${refund.id}/`);
      setSelectedRefund(full);
    } catch {
      setSelectedRefund(refund);
    }
  }

  /* ── Actions ─────────────────────────── */
  async function handleIssue(payload) {
    setSubmitting(true);
    try {
      await tenantApi("/api/v1/payments/tenant/refunds/issue/", {
        method: "POST", body: JSON.stringify(payload),
      });
      showToast(t("refunds.toast.created"));
      setShowIssue(false);
      loadRefunds();
      loadStats();
    } catch (e) {
      showToast(e.message || t("refunds.toast.failed"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id) {
    try {
      await tenantApi(`/api/v1/payments/tenant/refunds/${id}/approve/`, { method: "POST" });
      showToast(t("refunds.toast.approved"));
      setSelectedRefund(null);
      loadRefunds();
      loadStats();
    } catch (e) { showToast(e.message, "error"); }
  }

  async function handleReject(id) {
    try {
      await tenantApi(`/api/v1/payments/tenant/refunds/${id}/reject/`, { method: "POST" });
      showToast(t("refunds.toast.rejected"));
      setSelectedRefund(null);
      loadRefunds();
      loadStats();
    } catch (e) { showToast(e.message, "error"); }
  }

  async function handleRetry(id) {
    try {
      await tenantApi(`/api/v1/payments/tenant/refunds/${id}/retry/`, { method: "POST" });
      showToast(t("refunds.toast.retryQueued"));
      setSelectedRefund(null);
      loadRefunds();
    } catch (e) { showToast(e.message, "error"); }
  }

  async function handleExport() {
    try {
      const res = await tenantApi(`/api/v1/payments/tenant/refunds/export/`, {
        headers: authHeaders(), credentials: "include",
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `refunds-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("refunds.toast.exported"));
    } catch { showToast(t("refunds.toast.exportFailed"), "error"); }
  }

  /* ── Render ──────────────────────────── */
  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("refunds.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("refunds.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> {t("refunds.export")}
          </button>
          <button onClick={() => setShowIssue(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: MAROON }}>
            <Plus className="w-4 h-4" /> {t("refunds.issueRefund")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={RotateCcw} label={t("refunds.stats.total")} value={stats?.total ?? "—"} color="from-gray-500 to-gray-600" />
        <StatCard icon={Clock} label={t("refunds.stats.needsReview")} value={stats?.needs_review ?? "—"} color="from-amber-500 to-amber-600" />
        <StatCard icon={Loader2} label={t("refunds.stats.processing")} value={stats?.pending ?? "—"} color="from-blue-500 to-blue-600" />
        <StatCard icon={CheckCircle} label={t("refunds.stats.completed")} value={stats?.completed ?? "—"} color="from-emerald-500 to-emerald-600" />
        <StatCard icon={XCircle} label={t("refunds.stats.failed")} value={stats?.failed ?? "—"} color="from-red-500 to-red-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t("refunds.searchPlaceholder")}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30">
            <option value="all">{t("refunds.allStatuses")}</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{t(v.labelKey)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: MAROON }} />
          </div>
        ) : refunds.length === 0 ? (
          <div className="text-center py-20">
            <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{t("refunds.empty.title")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("refunds.table.refundNum")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("refunds.table.source")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("refunds.table.customer")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("refunds.table.amount")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("refunds.table.reason")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("refunds.table.status")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">{t("refunds.table.time")}</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {refunds.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/60 cursor-pointer transition-colors"
                      onClick={() => openDetail(r)}>
                      <td className="px-5 py-3.5">
                        <code className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">
                          {r.refund_number}
                        </code>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {r.booking_number ? <Calendar className="w-3.5 h-3.5 text-gray-400" /> : <FileText className="w-3.5 h-3.5 text-gray-400" />}
                          <span className="text-xs text-gray-700">{r.booking_number || r.order_number || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="text-sm text-gray-900 block truncate max-w-[140px]">{r.customer_name || "—"}</span>
                          <span className="text-[10px] text-gray-400">{r.customer_email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-900">{r.currency} {r.customer_refund}</span>
                        {r.customer_refund !== r.requested_amount && (
                          <span className="text-[10px] text-gray-400 block">
                            {t("refunds.table.of")} {r.currency} {r.requested_amount}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-600">{(r.reason || "").replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={r.status} t={t} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500">{timeAgo(r.created_at, t)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={e => { e.stopPropagation(); openDetail(r); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                          <Eye className="w-3 h-3" /> {t("refunds.view")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {t("refunds.pagination.showing", {
                  from: ((page - 1) * 20) + 1,
                  to: Math.min(page * 20, totalCount),
                  total: totalCount
                })}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="px-3 py-1 text-xs text-gray-600">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showIssue && (
        <IssueRefundModal
          onClose={() => setShowIssue(false)}
          onSubmit={handleIssue}
          submitting={submitting}
          t={t}
        />
      )}

      {selectedRefund && (
        <RefundDetailModal
          refund={selectedRefund}
          onClose={() => setSelectedRefund(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onRetry={handleRetry}
          t={t}
        />
      )}
    </div>
  );
}

export default function RefundsPage() {
  return (
    <TenantPermissionGate permission="refunds.view">
      <RefundsContent />
    </TenantPermissionGate>
  );
}




// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useApp } from "@/contexts/AppContext";
// import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
// import Cookies from "js-cookie";
// import { apiFetch } from "@/lib/apiClient";
// import {
//   RotateCcw,
//   Search,
//   Loader2,
//   AlertCircle,
//   CheckCircle,
//   XCircle,
//   Clock,
//   RefreshCw,
//   Download,
//   X,
//   Eye,
//   ChevronLeft,
//   ChevronRight,
//   DollarSign,
//   Filter,
//   Plus,
//   ArrowRight,
//   Zap,
//   AlertTriangle,
//   FileText,
//   Calendar,
// } from "lucide-react";

// const MAROON = "#8B1E3F";
// // const API = process.env.NEXT_PUBLIC_API_URL || "";

// // function authHeaders() {
// //   const token = Cookies.get("access_token");
// //   const tenant = Cookies.get("active_tenant");
// //   return {
// //     Authorization: token ? `Bearer ${token}` : "",
// //     "X-Tenant": tenant || "",
// //     "Content-Type": "application/json",
// //   };
// // }

// // async function apiFetch(path, opts = {}) {
// //   const res = await fetch(`${API}${path}`, {
// //     headers: authHeaders(), credentials: "include", ...opts,
// //   });
// //   if (!res.ok) {
// //     const body = await res.json().catch(() => ({}));
// //     throw new Error(body.detail || `API ${res.status}`);
// //   }
// //   return res.json();
// // }

//   const activeTenant = Cookies.get("active_tenant");

//   const tenantApi = (url, options = {}) =>
//     apiFetch(url, activeTenant, options);

// function formatDate(d) {
//   if (!d) return "—";
//   return new Date(d).toLocaleDateString("en-US", {
//     month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
//   });
// }

// function timeAgo(d) {
//   if (!d) return "";
//   const diff = Date.now() - new Date(d).getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 1) return "Just now";
//   if (mins < 60) return `${mins}m ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24) return `${hrs}h ago`;
//   return `${Math.floor(hrs / 24)}d ago`;
// }

// /* ────────────────────────────────────────────────── */

// const STATUS_CONFIG = {
//   requested:  { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500",   icon: Clock,       label: "Pending Review" },
//   approved:   { bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500",    icon: CheckCircle, label: "Approved" },
//   processing: { bg: "bg-purple-50",   text: "text-purple-700",  dot: "bg-purple-500",  icon: Loader2,     label: "Processing" },
//   completed:  { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle, label: "Completed" },
//   failed:     { bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500",     icon: XCircle,     label: "Failed" },
//   cancelled:  { bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400",    icon: XCircle,     label: "Cancelled" },
// };

// function StatusBadge({ status }) {
//   const s = STATUS_CONFIG[status] || STATUS_CONFIG.cancelled;
//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
//       <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
//       {s.label}
//     </span>
//   );
// }

// function StatCard({ icon: Icon, label, value, color }) {
//   return (
//     <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
//       <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
//         <Icon className="w-5 h-5 text-white" />
//       </div>
//       <div className="text-2xl font-semibold text-gray-900">{value ?? "—"}</div>
//       <div className="text-sm text-gray-500 mt-0.5">{label}</div>
//     </div>
//   );
// }

// /* ────────────────────────────────────────────────
//    Issue Refund Modal
//    ──────────────────────────────────────────────── */

// function IssueRefundModal({ onClose, onSubmit, submitting }) {
//   const [type, setType] = useState("booking");
//   const [entityId, setEntityId] = useState("");
//   const [reason, setReason] = useState("admin_initiated");
//   const [detail, setDetail] = useState("");
//   const [customAmount, setCustomAmount] = useState("");
//   const [skipPolicy, setSkipPolicy] = useState(false);

//   function handleSubmit() {
//     const payload = {
//       [type === "booking" ? "booking_id" : "order_id"]: entityId,
//       reason,
//       reason_detail: detail,
//       skip_policy: skipPolicy,
//     };
//     if (skipPolicy && customAmount) {
//       payload.amount = customAmount;
//     }
//     onSubmit(payload);
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
//         <div className="flex items-center justify-between p-5 border-b border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-900">Issue Refund</h3>
//           <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         <div className="p-5 space-y-4">
//           <div className="flex gap-2">
//             {["booking", "order"].map(t => (
//               <button key={t} onClick={() => setType(t)}
//                 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
//                   type === t ? "text-white" : "text-gray-600 bg-gray-100"
//                 }`}
//                 style={type === t ? { backgroundColor: MAROON } : {}}
//               >
//                 {t === "booking" ? "Booking" : "Order"}
//               </button>
//             ))}
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               {type === "booking" ? "Booking" : "Order"} ID
//             </label>
//             <input value={entityId} onChange={e => setEntityId(e.target.value)}
//               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
//               placeholder="UUID" />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
//             <select value={reason} onChange={e => setReason(e.target.value)}
//               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30">
//               <option value="admin_initiated">Admin Initiated</option>
//               <option value="customer_cancelled">Customer Cancelled</option>
//               <option value="service_not_delivered">Service Not Delivered</option>
//               <option value="quality_issue">Quality Issue</option>
//               <option value="duplicate_payment">Duplicate Payment</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
//             <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={2}
//               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
//               placeholder="Internal note (optional)" />
//           </div>

//           <div className="flex items-center gap-2">
//             <input type="checkbox" id="skipPolicy" checked={skipPolicy}
//               onChange={e => setSkipPolicy(e.target.checked)}
//               className="rounded border-gray-300" />
//             <label htmlFor="skipPolicy" className="text-xs text-gray-600">
//               Override policy — set custom refund amount
//             </label>
//           </div>

//           {skipPolicy && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
//               <input type="number" step="0.01" value={customAmount}
//                 onChange={e => setCustomAmount(e.target.value)}
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
//                 placeholder="0.00" />
//             </div>
//           )}
//         </div>

//         <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
//           <button onClick={onClose} disabled={submitting}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
//             Cancel
//           </button>
//           <button onClick={handleSubmit} disabled={submitting || !entityId}
//             className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
//             style={{ backgroundColor: MAROON }}>
//             {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
//             Issue Refund
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ────────────────────────────────────────────────
//    Detail Modal with Timeline
//    ──────────────────────────────────────────────── */

// function RefundDetailModal({ refund, onClose, onApprove, onReject, onRetry }) {
//   if (!refund) return null;

//   const timeline = refund.timeline || [];
//   const canApprove = refund.status === "requested" && refund.requires_manual_review;
//   const canRetry = refund.status === "failed";

//   return (
//     <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[5vh] overflow-y-auto">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
//         <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
//           <div>
//             <h3 className="text-base font-semibold text-gray-900">Refund {refund.refund_number}</h3>
//             <StatusBadge status={refund.status} />
//           </div>
//           <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-5 space-y-5">
//           {/* Summary */}
//           <div className="grid grid-cols-2 gap-3 text-sm">
//             {[
//               ["Source", refund.booking_number || refund.order_number || "—"],
//               ["Customer", refund.customer_name || refund.customer_email || "—"],
//               ["Requested", `${refund.currency} ${refund.requested_amount}`],
//               ["Approved", refund.approved_amount ? `${refund.currency} ${refund.approved_amount}` : "—"],
//               ["Customer Gets", `${refund.currency} ${refund.customer_refund}`],
//               ["Policy", refund.policy_applied || "—"],
//               ["Gateway", refund.gateway_provider || "—"],
//               ["Gateway Ref", refund.external_refund_id || "—"],
//             ].map(([label, value]) => (
//               <div key={label}>
//                 <span className="text-xs text-gray-500 block">{label}</span>
//                 <span className="text-xs font-medium text-gray-900">{value}</span>
//               </div>
//             ))}
//           </div>

//           {refund.last_error && (
//             <div className="p-3 bg-red-50 rounded-lg">
//               <p className="text-xs font-medium text-red-700 mb-0.5">Last Error</p>
//               <p className="text-xs text-red-600 break-words">{refund.last_error}</p>
//               <p className="text-[10px] text-red-400 mt-1">Retry {refund.retry_count}/{refund.max_retries}</p>
//             </div>
//           )}

//           {/* Timeline */}
//           <div>
//             <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h4>
//             <div className="space-y-3">
//               {timeline.map((ev, i) => (
//                 <div key={i} className="flex gap-3">
//                   <div className="flex flex-col items-center">
//                     <div className="w-2.5 h-2.5 rounded-full bg-gray-300 mt-1 shrink-0" />
//                     {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
//                   </div>
//                   <div className="pb-3">
//                     <p className="text-xs font-medium text-gray-900">{ev.event}</p>
//                     <p className="text-[11px] text-gray-500 mt-0.5">{ev.detail}</p>
//                     <div className="flex items-center gap-2 mt-0.5">
//                       <span className="text-[10px] text-gray-400">{ev.actor}</span>
//                       {ev.time && <span className="text-[10px] text-gray-400">· {formatDate(ev.time)}</span>}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {(canApprove || canRetry) && (
//           <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-200 shrink-0">
//             {canApprove && (
//               <>
//                 <button onClick={() => onReject(refund.id)}
//                   className="px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
//                   Reject
//                 </button>
//                 <button onClick={() => onApprove(refund.id)}
//                   className="px-4 py-2 text-xs font-medium text-white rounded-lg bg-emerald-600 hover:bg-emerald-700">
//                   Approve Refund
//                 </button>
//               </>
//             )}
//             {canRetry && (
//               <button onClick={() => onRetry(refund.id)}
//                 className="px-4 py-2 text-xs font-medium text-white rounded-lg"
//                 style={{ backgroundColor: MAROON }}>
//                 Retry Refund
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════
//    MAIN PAGE
//    ════════════════════════════════════════════════════ */

// function RefundsContent() {
//   const { t } = useApp();
//   const activeTenant = Cookies.get("active_tenant");

//   const [loading, setLoading] = useState(true);
//   const [refunds, setRefunds] = useState([]);
//   const [stats, setStats] = useState(null);
//   const [totalCount, setTotalCount] = useState(0);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);

//   // Filters
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [search, setSearch] = useState("");

//   // Modals
//   const [selectedRefund, setSelectedRefund] = useState(null);
//   const [showIssue, setShowIssue] = useState(false);
//   const [submitting, setSubmitting] = useState(false);

//   // Toast
//   const [toast, setToast] = useState(null);
//   function showToast(msg, type = "success") {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 3500);
//   }

//   /* ── Load ────────────────────────────── */
//   const loadRefunds = useCallback(async () => {
//     try {
//       setLoading(true);
//       const params = new URLSearchParams({ page, page_size: 20 });
//       if (statusFilter !== "all") params.set("status", statusFilter);
//       if (search) params.set("search", search);

//       const data = await tenantApi(`/api/v1/payments/tenant/refunds/?${params}`);
//       setRefunds(data.results || []);
//       setTotalCount(data.count || 0);
//       setTotalPages(data.pages || 1);
//     } catch {
//       setRefunds([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [page, statusFilter, search]);

//   const loadStats = useCallback(async () => {
//     try {
//       const data = await tenantApi("/api/v1/payments/tenant/refunds/stats/");
//       setStats(data);
//     } catch {}
//   }, []);

//   useEffect(() => { loadStats(); }, [loadStats]);
//   useEffect(() => { loadRefunds(); }, [loadRefunds]);
//   useEffect(() => { setPage(1); }, [statusFilter, search]);

//   /* ── Load detail with timeline ────────── */
//   async function openDetail(refund) {
//     try {
//       const full = await tenantApi(`/api/v1/payments/tenant/refunds/${refund.id}/`);
//       setSelectedRefund(full);
//     } catch {
//       setSelectedRefund(refund);
//     }
//   }

//   /* ── Actions ─────────────────────────── */
//   async function handleIssue(payload) {
//     setSubmitting(true);
//     try {
//       await tenantApi("/api/v1/payments/tenant/refunds/issue/", {
//         method: "POST", body: JSON.stringify(payload),
//       });
//       showToast("Refund created");
//       setShowIssue(false);
//       loadRefunds();
//       loadStats();
//     } catch (e) {
//       showToast(e.message || "Failed", "error");
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   async function handleApprove(id) {
//     try {
//       await tenantApi(`/api/v1/payments/tenant/refunds/${id}/approve/`, { method: "POST" });
//       showToast("Refund approved — processing started");
//       setSelectedRefund(null);
//       loadRefunds();
//       loadStats();
//     } catch (e) { showToast(e.message, "error"); }
//   }

//   async function handleReject(id) {
//     try {
//       await tenantApi(`/api/v1/payments/tenant/refunds/${id}/reject/`, { method: "POST" });
//       showToast("Refund rejected");
//       setSelectedRefund(null);
//       loadRefunds();
//       loadStats();
//     } catch (e) { showToast(e.message, "error"); }
//   }

//   async function handleRetry(id) {
//     try {
//       await tenantApi(`/api/v1/payments/tenant/refunds/${id}/retry/`, { method: "POST" });
//       showToast("Refund retry queued");
//       setSelectedRefund(null);
//       loadRefunds();
//     } catch (e) { showToast(e.message, "error"); }
//   }

//   async function handleExport() {
//     try {
//       const res = await tenantApi(`/api/v1/payments/tenant/refunds/export/`, {
//         headers: authHeaders(), credentials: "include",
//       });
//       const blob = await res.blob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `refunds-${new Date().toISOString().split("T")[0]}.csv`;
//       a.click();
//       URL.revokeObjectURL(url);
//       showToast("Export downloaded");
//     } catch { showToast("Export failed", "error"); }
//   }

//   /* ── Render ──────────────────────────── */
//   return (
//     <div className="space-y-6">
//       {toast && (
//         <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
//           {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
//           {toast.msg}
//         </div>
//       )}

//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Refunds</h1>
//           <p className="text-sm text-gray-500 mt-1">Manage customer refund requests and issue refunds</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button onClick={handleExport}
//             className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
//             <Download className="w-4 h-4" /> Export
//           </button>
//           <button onClick={() => setShowIssue(true)}
//             className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
//             style={{ backgroundColor: MAROON }}>
//             <Plus className="w-4 h-4" /> Issue Refund
//           </button>
//         </div>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
//         <StatCard icon={RotateCcw} label="Total" value={stats?.total ?? "—"} color="from-gray-500 to-gray-600" />
//         <StatCard icon={Clock} label="Needs Review" value={stats?.needs_review ?? "—"} color="from-amber-500 to-amber-600" />
//         <StatCard icon={Loader2} label="Processing" value={stats?.pending ?? "—"} color="from-blue-500 to-blue-600" />
//         <StatCard icon={CheckCircle} label="Completed" value={stats?.completed ?? "—"} color="from-emerald-500 to-emerald-600" />
//         <StatCard icon={XCircle} label="Failed" value={stats?.failed ?? "—"} color="from-red-500 to-red-600" />
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-xl border border-gray-200 p-4">
//         <div className="flex flex-col sm:flex-row gap-3">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input type="text" value={search} onChange={e => setSearch(e.target.value)}
//               placeholder="Search by refund #, booking #, order #, or email..."
//               className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]" />
//           </div>
//           <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
//             className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30">
//             <option value="all">All Statuses</option>
//             {Object.entries(STATUS_CONFIG).map(([k, v]) => (
//               <option key={k} value={k}>{v.label}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <Loader2 className="w-6 h-6 animate-spin" style={{ color: MAROON }} />
//           </div>
//         ) : refunds.length === 0 ? (
//           <div className="text-center py-20">
//             <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
//             <p className="text-gray-500 text-sm">No refunds found</p>
//           </div>
//         ) : (
//           <>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="bg-gray-50 text-left">
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Refund #</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Reason</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
//                     <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase" />
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {refunds.map(r => (
//                     <tr key={r.id} className="hover:bg-gray-50/60 cursor-pointer transition-colors"
//                       onClick={() => openDetail(r)}>
//                       <td className="px-5 py-3.5">
//                         <code className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded">
//                           {r.refund_number}
//                         </code>
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <div className="flex items-center gap-1.5">
//                           {r.booking_number ? <Calendar className="w-3.5 h-3.5 text-gray-400" /> : <FileText className="w-3.5 h-3.5 text-gray-400" />}
//                           <span className="text-xs text-gray-700">{r.booking_number || r.order_number || "—"}</span>
//                         </div>
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <div>
//                           <span className="text-sm text-gray-900 block truncate max-w-[140px]">{r.customer_name || "—"}</span>
//                           <span className="text-[10px] text-gray-400">{r.customer_email}</span>
//                         </div>
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <span className="text-sm font-semibold text-gray-900">{r.currency} {r.customer_refund}</span>
//                         {r.customer_refund !== r.requested_amount && (
//                           <span className="text-[10px] text-gray-400 block">of {r.currency} {r.requested_amount}</span>
//                         )}
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <span className="text-xs text-gray-600">{(r.reason || "").replace(/_/g, " ")}</span>
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <StatusBadge status={r.status} />
//                       </td>
//                       <td className="px-5 py-3.5">
//                         <span className="text-xs text-gray-500">{timeAgo(r.created_at)}</span>
//                       </td>
//                       <td className="px-5 py-3.5 text-right">
//                         <button onClick={e => { e.stopPropagation(); openDetail(r); }}
//                           className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
//                           <Eye className="w-3 h-3" /> View
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
//               <span className="text-xs text-gray-500">
//                 Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, totalCount)} of {totalCount}
//               </span>
//               <div className="flex items-center gap-1">
//                 <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
//                   className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
//                   <ChevronLeft className="w-4 h-4 text-gray-600" />
//                 </button>
//                 <span className="px-3 py-1 text-xs text-gray-600">{page} / {totalPages}</span>
//                 <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
//                   className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
//                   <ChevronRight className="w-4 h-4 text-gray-600" />
//                 </button>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Modals */}
//       {showIssue && (
//         <IssueRefundModal
//           onClose={() => setShowIssue(false)}
//           onSubmit={handleIssue}
//           submitting={submitting}
//         />
//       )}

//       {selectedRefund && (
//         <RefundDetailModal
//           refund={selectedRefund}
//           onClose={() => setSelectedRefund(null)}
//           onApprove={handleApprove}
//           onReject={handleReject}
//           onRetry={handleRetry}
//         />
//       )}
//     </div>
//   );
// }

// export default function RefundsPage() {
//   return (
//     <TenantPermissionGate permission="refunds.view">
//       <RefundsContent />
//     </TenantPermissionGate>
//   );
// }