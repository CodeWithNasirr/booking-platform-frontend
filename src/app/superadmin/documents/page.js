// // src/app/superadmin/documents/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useTranslation } from "@/lib/t";
import {
  FileText, Search, Filter, Eye, Check, X, Clock, AlertCircle,
  CheckCircle, XCircle, RefreshCcw, Loader2, ChevronLeft, ChevronRight,
  Download, FileCheck, FileX, Calendar, Building2, Mail, ExternalLink,
} from "lucide-react";
import {
  fetchDocuments,
  fetchDocumentDetail,
  approveDocument,
  rejectDocument,
  fetchDocumentStats,
} from "@/lib/platformApi";

const MAROON = "#800020";

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function formatDate(d, locale = "en-US") {
  if (!d) return "—";
  return new Date(d).toLocaleString(locale, {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/* ────────────────────────────────────────────
   Reject Modal
   ──────────────────────────────────────────── */

function RejectModal({ doc, onClose, onConfirm, loading, t }) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("superadmin.documents.reject_title")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              {t("superadmin.documents.reject_desc", { name: doc.tenant?.name, type: t(`superadmin.documents.type_${doc.document_type}`) || doc.document_type })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t("superadmin.documents.reject_hint")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("superadmin.documents.reason_label")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder={t("superadmin.documents.reason_placeholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] resize-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("superadmin.documents.internal_notes_label")}
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder={t("superadmin.documents.internal_notes_placeholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            {t("superadmin.common.cancel")}
          </button>
          <button
            onClick={() => onConfirm(reason, notes)}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("superadmin.documents.reject")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Document Drawer
   ──────────────────────────────────────────── */

function DocumentDrawer({ docId, onClose, onAction, t, isRTL }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (!docId) return;
    setLoading(true);
    fetchDocumentDetail(docId)
      .then(setDoc)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [docId]);

  const handleApprove = async () => {
    setActioning(true);
    try {
      await approveDocument(docId, "");
      onAction("approved");
    } finally {
      setActioning(false);
    }
  };

  const handleReject = async (reason, notes) => {
    setActioning(true);
    try {
      await rejectDocument(docId, reason, notes);
      setShowRejectModal(false);
      onAction("rejected");
    } finally {
      setActioning(false);
    }
  };

  if (!docId) return null;

  const statusConfig = {
    pending:  { label: t("superadmin.documents.status_pending"), bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", icon: Clock },
    approved: { label: t("superadmin.documents.status_approved"), bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle },
    rejected: { label: t("superadmin.documents.status_rejected"), bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", icon: XCircle },
    expired:  { label: t("superadmin.documents.status_expired"), bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400", icon: AlertCircle },
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className={`fixed top-0 z-50 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto ${isRTL ? "left-0" : "right-0"}`} dir={isRTL ? "rtl" : "ltr"}>
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : doc ? (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t(`superadmin.documents.type_${doc.document_type}`) || doc.document_type}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{doc.tenant?.name}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Status banner */}
            <div className="px-6 py-4">
              {(() => {
                const sc = statusConfig[doc.status] || statusConfig.pending;
                const Icon = sc.icon;
                return (
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${sc.bg} border ${sc.border}`}>
                    <Icon className={`w-5 h-5 ${sc.text}`} />
                    <span className={`text-sm font-semibold ${sc.text}`}>{sc.label}</span>
                  </div>
                );
              })()}

              {doc.status === "rejected" && doc.rejection_reason && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-semibold text-red-800 mb-1">{t("superadmin.documents.rejection_reason")}</p>
                  <p className="text-sm text-red-700">{doc.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Document preview */}
            <div className="px-6 pb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{t("superadmin.documents.preview_title")}</h4>
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                {doc.content_type?.startsWith("image/") ? (
                  <img src={doc.file_url} alt={doc.file_name} className="w-full max-h-96 object-contain bg-white" />
                ) : doc.content_type === "application/pdf" ? (
                  <iframe src={doc.file_url} title={doc.file_name} className="w-full h-96 bg-white" />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <FileText className="w-16 h-16 mb-3" />
                    <p className="text-sm font-medium">{doc.file_name}</p>
                    <p className="text-xs mt-1">{formatBytes(doc.file_size)}</p>
                  </div>
                )}
                <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">{doc.file_name}</span>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#800020] hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {t("superadmin.common.open")}
                  </a>
                </div>
              </div>
            </div>

            {/* Document info */}
            <div className="px-6 pb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{t("superadmin.documents.info_title")}</h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <InfoRow label={t("superadmin.documents.doc_number")} value={doc.document_number} />
                <InfoRow label={t("superadmin.documents.issuing_authority")} value={doc.issuing_authority} />
                <InfoRow label={t("superadmin.documents.issue_date")} value={doc.issue_date ? formatDate(doc.issue_date) : "—"} />
                <InfoRow label={t("superadmin.documents.expiry_date")} value={doc.expiry_date ? formatDate(doc.expiry_date) : "—"} />
                <InfoRow label={t("superadmin.documents.uploaded_by")} value={doc.uploaded_by} />
                <InfoRow label={t("superadmin.documents.uploaded_at")} value={formatDate(doc.uploaded_at)} />
                {doc.reviewed_at && (
                  <>
                    <InfoRow label={t("superadmin.documents.reviewed_by")} value={doc.reviewed_by} />
                    <InfoRow label={t("superadmin.documents.reviewed_at")} value={formatDate(doc.reviewed_at)} />
                  </>
                )}
              </div>
            </div>

            {/* Tenant info */}
            <div className="px-6 pb-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{t("superadmin.documents.tenant_title")}</h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{doc.tenant?.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{doc.tenant?.email}</p>
                  </div>
                  <a
                    href={`/superadmin/tenants/${doc.tenant?.id}`}
                    className="text-xs font-medium text-[#800020] hover:underline"
                  >
                    {t("superadmin.documents.view_tenant")} →
                  </a>
                </div>
              </div>
            </div>

            {/* Review history */}
            {doc.review_history?.length > 0 && (
              <div className="px-6 pb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">{t("superadmin.documents.review_history_title")}</h4>
                <div className="space-y-2">
                  {doc.review_history.map(h => (
                    <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        h.action === "approved" ? "bg-emerald-500" :
                        h.action === "rejected" ? "bg-red-500" : "bg-gray-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 capitalize">{t(`superadmin.documents.action_${h.action}`) || h.action}</span>
                          <span className="text-xs text-gray-500">{formatDate(h.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{t("superadmin.documents.by_actor", { actor: h.actor })}</p>
                        {h.reason && <p className="text-xs text-gray-700 mt-1">{h.reason}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {doc.status === "pending" && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actioning}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-xl hover:bg-red-50 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  {t("superadmin.documents.reject")}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actioning}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50"
                  style={{ backgroundColor: "#059669" }}
                >
                  {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {t("superadmin.documents.approve")}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-gray-400">{t("superadmin.documents.load_error")}</div>
        )}
      </div>

      {showRejectModal && (
        <RejectModal
          doc={doc}
          loading={actioning}
          onClose={() => setShowRejectModal(false)}
          onConfirm={handleReject}
          t={t}
        />
      )}
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value || "—"}</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */

export default function DocumentsPage() {
  const { t, isRTL } = useTranslation();

  const [docs, setDocs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.document_type = typeFilter;
      if (search) params.search = search;

      const data = await fetchDocuments(params);
      setDocs(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.count || 0);
    } catch (err) {
      showToast(err.message || t("superadmin.documents.load_error"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search, t]);

  const loadStats = useCallback(async () => {
    try {
      const data = await fetchDocumentStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);
  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadDocs();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAction = (decision) => {
    setSelectedDocId(null);
    showToast(t("superadmin.documents.action_toast", { decision }));
    loadDocs();
    loadStats();
  };

  const statCards = [
    { key: "pending", label: t("superadmin.documents.stat_pending"), color: "from-amber-500 to-amber-600", icon: Clock },
    { key: "approved", label: t("superadmin.documents.stat_approved"), color: "from-emerald-500 to-emerald-600", icon: CheckCircle },
    { key: "rejected", label: t("superadmin.documents.stat_rejected"), color: "from-red-500 to-red-600", icon: XCircle },
    { key: "verified", label: t("superadmin.documents.stat_verified"), color: "from-blue-500 to-blue-600", icon: FileCheck },
  ];

  const typeOptions = [
    { value: "commercial_registration", label: t("superadmin.documents.type_commercial_registration") },
    { value: "vat_certificate", label: t("superadmin.documents.type_vat_certificate") },
    { value: "national_id", label: t("superadmin.documents.type_national_id") },
    { value: "bank_letter", label: t("superadmin.documents.type_bank_letter") },
    { value: "trade_license", label: t("superadmin.documents.type_trade_license") },
    { value: "other", label: t("superadmin.documents.type_other") },
  ];

  const statusOptions = [
    { value: "all", label: t("superadmin.documents.filter_all_statuses") },
    { value: "pending", label: t("superadmin.documents.status_pending") },
    { value: "approved", label: t("superadmin.documents.status_approved") },
    { value: "rejected", label: t("superadmin.documents.status_rejected") },
    { value: "expired", label: t("superadmin.documents.status_expired") },
  ];

  return (
    <SuperAdminLayout
      title={t("superadmin.documents.title")}
      description={t("superadmin.documents.description")}
      breadcrumbs={[{ label: t("superadmin.nav.documents") }]}
    >
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
          } ${isRTL ? "left-4" : "right-4"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            const value = stat.key === "verified" ? stats?.total_tenants_verified : stats?.[`${stat.key}_count`];
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{value ?? 0}</div>
                <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? "right-3.5" : "left-3.5"}`} />
              <input
                type="text"
                placeholder={t("superadmin.documents.search_placeholder")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full h-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                style={{ "--tw-ring-color": MAROON }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 min-w-[160px]"
            >
              {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 min-w-[200px]"
            >
              <option value="all">{t("superadmin.documents.filter_all_types")}</option>
              {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <button
              onClick={loadDocs}
              className="h-11 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm"
            >
              <RefreshCcw className="w-4 h-4" />
              {t("superadmin.common.refresh")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FileText className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">{t("superadmin.documents.no_results")}</p>
              <p className="text-xs mt-1">{t("superadmin.documents.no_results_hint")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("superadmin.documents.column_tenant")}</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("superadmin.documents.column_type")}</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("superadmin.documents.column_status")}</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("superadmin.documents.column_doc_number")}</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("superadmin.documents.column_uploaded")}</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("superadmin.documents.column_action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {docs.map(doc => {
                    const sc = {
                      pending:  { label: t("superadmin.documents.status_pending"), bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
                      approved: { label: t("superadmin.documents.status_approved"), bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
                      rejected: { label: t("superadmin.documents.status_rejected"), bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
                      expired:  { label: t("superadmin.documents.status_expired"), bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
                    }[doc.status] || { label: t("superadmin.documents.status_pending"), bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setSelectedDocId(doc.id)}>
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium text-gray-900">{doc.tenant?.name}</div>
                          <div className="text-xs text-gray-500">{doc.tenant?.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-gray-700">{t(`superadmin.documents.type_${doc.document_type}`) || doc.document_type}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{doc.document_number || "—"}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(doc.uploaded_at)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && docs.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50/50">
              <p className="text-sm text-gray-600">
                {t("superadmin.documents.pagination_showing", { from: (page - 1) * 20 + 1, to: Math.min(page * 20, totalCount), total: totalCount })}
              </p>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white">
                  <ChevronLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                </button>
                <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white">
                  <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedDocId && (
        <DocumentDrawer
          docId={selectedDocId}
          onClose={() => setSelectedDocId(null)}
          onAction={handleAction}
          t={t}
          isRTL={isRTL}
        />
      )}
    </SuperAdminLayout>
  );
}



// "use client";

// import { useState, useEffect, useCallback } from "react";
// import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
// import {
//   FileText, Search, Filter, Eye, Check, X, Clock, AlertCircle,
//   CheckCircle, XCircle, RefreshCcw, Loader2, ChevronLeft, ChevronRight,
//   Download, FileCheck, FileX, Calendar, Building2, Mail, ExternalLink,
// } from "lucide-react";
// import {
//   fetchDocuments,
//   fetchDocumentDetail,
//   approveDocument,
//   rejectDocument,
//   fetchDocumentStats,
// } from "@/lib/platformApi";

// const MAROON = "#800020";

// const STATUS_CONFIGS = {
//   pending:  { label: "Pending Review", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", icon: Clock },
//   approved: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle },
//   rejected: { label: "Rejected", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", icon: XCircle },
//   expired:  { label: "Expired", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400", icon: AlertCircle },
// };

// const TYPE_LABELS = {
//   commercial_registration: "Commercial Registration (CR)",
//   vat_certificate: "VAT Certificate",
//   national_id: "National ID / Iqama",
//   bank_letter: "Bank IBAN Letter",
//   trade_license: "Trade License",
//   other: "Other",
// };

// function formatDate(d) {
//   if (!d) return "—";
//   return new Date(d).toLocaleString("en-US", {
//     month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
//   });
// }

// function formatBytes(bytes) {
//   if (!bytes) return "0 B";
//   const sizes = ["B", "KB", "MB"];
//   const i = Math.floor(Math.log(bytes) / Math.log(1024));
//   return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
// }

// // ═══════════════════════════════════════════════════════════════
// // REJECT MODAL
// // ═══════════════════════════════════════════════════════════════

// function RejectModal({ doc, onClose, onConfirm, loading }) {
//   const [reason, setReason] = useState("");
//   const [notes, setNotes] = useState("");

//   if (!doc) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
//         <div className="flex items-center justify-between p-5 border-b border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-900">Reject Document</h3>
//           <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>
//         <div className="p-5 space-y-4">
//           <div>
//             <p className="text-sm text-gray-600">
//               You're rejecting <strong>{doc.tenant?.name}'s</strong> {TYPE_LABELS[doc.document_type] || doc.document_type}.
//             </p>
//             <p className="text-xs text-gray-500 mt-1">The tenant will be notified with the reason below.</p>
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">
//               Reason <span className="text-red-500">*</span>
//             </label>
//             <textarea
//               value={reason}
//               onChange={e => setReason(e.target.value)}
//               rows={3}
//               placeholder="e.g. Document is unclear / expired / wrong type..."
//               className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] resize-none"
//               autoFocus
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1.5">
//               Internal Notes (optional)
//             </label>
//             <textarea
//               value={notes}
//               onChange={e => setNotes(e.target.value)}
//               rows={2}
//               placeholder="Internal notes (not shown to tenant)..."
//               className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 resize-none"
//             />
//           </div>
//         </div>
//         <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
//           <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
//             Cancel
//           </button>
//           <button
//             onClick={() => onConfirm(reason, notes)}
//             disabled={loading || !reason.trim()}
//             className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
//           >
//             {loading && <Loader2 className="w-4 h-4 animate-spin" />}
//             Reject
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════
// // DOCUMENT DETAIL DRAWER
// // ═══════════════════════════════════════════════════════════════

// function DocumentDrawer({ docId, onClose, onAction }) {
//   const [doc, setDoc] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [actioning, setActioning] = useState(false);
//   const [showRejectModal, setShowRejectModal] = useState(false);

//   useEffect(() => {
//     if (!docId) return;
//     setLoading(true);
//     fetchDocumentDetail(docId)
//       .then(setDoc)
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, [docId]);

//   const handleApprove = async () => {
//     setActioning(true);
//     try {
//       await approveDocument(docId, "");
//       onAction("approved");
//     } finally {
//       setActioning(false);
//     }
//   };

//   const handleReject = async (reason, notes) => {
//     setActioning(true);
//     try {
//       await rejectDocument(docId, reason, notes);
//       setShowRejectModal(false);
//       onAction("rejected");
//     } finally {
//       setActioning(false);
//     }
//   };

//   if (!docId) return null;

//   return (
//     <>
//       <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
//       <div className="fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
//         {loading ? (
//           <div className="flex items-center justify-center py-32">
//             <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
//           </div>
//         ) : doc ? (
//           <>
//             {/* Header */}
//             <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900">
//                   {TYPE_LABELS[doc.document_type] || doc.document_type}
//                 </h3>
//                 <p className="text-sm text-gray-500 mt-0.5">{doc.tenant?.name}</p>
//               </div>
//               <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
//                 <X className="w-5 h-5 text-gray-500" />
//               </button>
//             </div>

//             {/* Status banner */}
//             <div className="px-6 py-4">
//               {(() => {
//                 const sc = STATUS_CONFIGS[doc.status] || STATUS_CONFIGS.pending;
//                 const Icon = sc.icon;
//                 return (
//                   <div className={`flex items-center gap-3 p-3 rounded-xl ${sc.bg} border ${sc.border}`}>
//                     <Icon className={`w-5 h-5 ${sc.text}`} />
//                     <span className={`text-sm font-semibold ${sc.text}`}>{sc.label}</span>
//                   </div>
//                 );
//               })()}

//               {doc.status === "rejected" && doc.rejection_reason && (
//                 <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
//                   <p className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</p>
//                   <p className="text-sm text-red-700">{doc.rejection_reason}</p>
//                 </div>
//               )}
//             </div>

//             {/* Document preview */}
//             <div className="px-6 pb-6">
//               <h4 className="text-sm font-semibold text-gray-900 mb-3">Document Preview</h4>
//               <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
//                 {doc.content_type?.startsWith("image/") ? (
//                   <img src={doc.file_url} alt={doc.file_name} className="w-full max-h-96 object-contain bg-white" />
//                 ) : doc.content_type === "application/pdf" ? (
//                   <iframe src={doc.file_url} title={doc.file_name} className="w-full h-96 bg-white" />
//                 ) : (
//                   <div className="flex flex-col items-center justify-center py-12 text-gray-400">
//                     <FileText className="w-16 h-16 mb-3" />
//                     <p className="text-sm font-medium">{doc.file_name}</p>
//                     <p className="text-xs mt-1">{formatBytes(doc.file_size)}</p>
//                   </div>
//                 )}
//                 <div className="p-3 border-t border-gray-200 bg-white flex items-center justify-between">
//                   <span className="text-xs text-gray-500 truncate">{doc.file_name}</span>
//                   <a
//                     href={doc.file_url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="inline-flex items-center gap-1 text-xs font-medium text-[#800020] hover:underline"
//                   >
//                     <ExternalLink className="w-3 h-3" />
//                     Open
//                   </a>
//                 </div>
//               </div>
//             </div>

//             {/* Document info */}
//             <div className="px-6 pb-6">
//               <h4 className="text-sm font-semibold text-gray-900 mb-3">Document Information</h4>
//               <div className="bg-gray-50 rounded-xl p-4 space-y-3">
//                 <InfoRow label="Document Number" value={doc.document_number} />
//                 <InfoRow label="Issuing Authority" value={doc.issuing_authority} />
//                 <InfoRow label="Issue Date" value={doc.issue_date ? formatDate(doc.issue_date) : "—"} />
//                 <InfoRow label="Expiry Date" value={doc.expiry_date ? formatDate(doc.expiry_date) : "—"} />
//                 <InfoRow label="Uploaded By" value={doc.uploaded_by} />
//                 <InfoRow label="Uploaded At" value={formatDate(doc.uploaded_at)} />
//                 {doc.reviewed_at && (
//                   <>
//                     <InfoRow label="Reviewed By" value={doc.reviewed_by} />
//                     <InfoRow label="Reviewed At" value={formatDate(doc.reviewed_at)} />
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* Tenant info */}
//             <div className="px-6 pb-6">
//               <h4 className="text-sm font-semibold text-gray-900 mb-3">Tenant</h4>
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <div className="flex items-start justify-between">
//                   <div>
//                     <p className="font-medium text-gray-900">{doc.tenant?.name}</p>
//                     <p className="text-sm text-gray-500 mt-0.5">{doc.tenant?.email}</p>
//                   </div>
//                   <a
//                     href={`/superadmin/tenants/${doc.tenant?.id}`}
//                     className="text-xs font-medium text-[#800020] hover:underline"
//                   >
//                     View Tenant →
//                   </a>
//                 </div>
//               </div>
//             </div>

//             {/* Review history */}
//             {doc.review_history?.length > 0 && (
//               <div className="px-6 pb-6">
//                 <h4 className="text-sm font-semibold text-gray-900 mb-3">Review History</h4>
//                 <div className="space-y-2">
//                   {doc.review_history.map(h => (
//                     <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
//                       <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
//                         h.action === "approved" ? "bg-emerald-500" :
//                         h.action === "rejected" ? "bg-red-500" : "bg-gray-400"
//                       }`} />
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center justify-between">
//                           <span className="font-medium text-gray-900 capitalize">{h.action}</span>
//                           <span className="text-xs text-gray-500">{formatDate(h.created_at)}</span>
//                         </div>
//                         <p className="text-xs text-gray-600 mt-0.5">by {h.actor}</p>
//                         {h.reason && <p className="text-xs text-gray-700 mt-1">{h.reason}</p>}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Actions */}
//             {doc.status === "pending" && (
//               <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
//                 <button
//                   onClick={() => setShowRejectModal(true)}
//                   disabled={actioning}
//                   className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-xl hover:bg-red-50 disabled:opacity-50"
//                 >
//                   <X className="w-4 h-4" />
//                   Reject
//                 </button>
//                 <button
//                   onClick={handleApprove}
//                   disabled={actioning}
//                   className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50"
//                   style={{ backgroundColor: "#059669" }}
//                 >
//                   {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
//                   Approve
//                 </button>
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="p-8 text-center text-gray-400">Failed to load document</div>
//         )}
//       </div>

//       {showRejectModal && (
//         <RejectModal
//           doc={doc}
//           loading={actioning}
//           onClose={() => setShowRejectModal(false)}
//           onConfirm={handleReject}
//         />
//       )}
//     </>
//   );
// }

// function InfoRow({ label, value }) {
//   return (
//     <div className="flex items-start justify-between text-sm">
//       <span className="text-gray-500">{label}</span>
//       <span className="text-gray-900 font-medium text-right">{value || "—"}</span>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════
// // MAIN PAGE
// // ═══════════════════════════════════════════════════════════════

// export default function DocumentsPage() {
//   const [docs, setDocs] = useState([]);
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [statusFilter, setStatusFilter] = useState("pending");
//   const [typeFilter, setTypeFilter] = useState("all");
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalCount, setTotalCount] = useState(0);
//   const [selectedDocId, setSelectedDocId] = useState(null);
//   const [toast, setToast] = useState(null);

//   const showToast = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 3500);
//   };

//   const loadDocs = useCallback(async () => {
//     setLoading(true);
//     try {
//       const params = { page, page_size: 20 };
//       if (statusFilter !== "all") params.status = statusFilter;
//       if (typeFilter !== "all") params.document_type = typeFilter;
//       if (search) params.search = search;

//       const data = await fetchDocuments(params);
//       setDocs(data.results || []);
//       setTotalPages(data.total_pages || 1);
//       setTotalCount(data.count || 0);
//     } catch (err) {
//       showToast(err.message || "Failed to load documents", "error");
//     } finally {
//       setLoading(false);
//     }
//   }, [page, statusFilter, typeFilter, search]);

//   const loadStats = useCallback(async () => {
//     try {
//       const data = await fetchDocumentStats();
//       setStats(data);
//     } catch (err) {
//       console.error("Failed to load stats:", err);
//     }
//   }, []);

//   useEffect(() => { loadDocs(); }, [loadDocs]);
//   useEffect(() => { loadStats(); }, [loadStats]);

//   // Search debounce
//   useEffect(() => {
//     const t = setTimeout(() => {
//       setPage(1);
//       loadDocs();
//     }, 400);
//     return () => clearTimeout(t);
//   }, [search]);

//   const handleAction = (decision) => {
//     setSelectedDocId(null);
//     showToast(`Document ${decision}.`);
//     loadDocs();
//     loadStats();
//   };

//   const statCards = [
//     { label: "Pending", value: stats?.pending_count ?? 0, color: "from-amber-500 to-amber-600", icon: Clock },
//     { label: "Approved", value: stats?.approved_count ?? 0, color: "from-emerald-500 to-emerald-600", icon: CheckCircle },
//     { label: "Rejected", value: stats?.rejected_count ?? 0, color: "from-red-500 to-red-600", icon: XCircle },
//     { label: "Verified Tenants", value: stats?.total_tenants_verified ?? 0, color: "from-blue-500 to-blue-600", icon: FileCheck },
//   ];

//   return (
//     <SuperAdminLayout
//       title="Document Verification"
//       description="Review and verify tenant business documents"
//       breadcrumbs={[{ label: "Documents" }]}
//     >
//       {toast && (
//         <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
//           toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
//         }`}>
//           {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
//           {toast.msg}
//         </div>
//       )}

//       <div className="space-y-6">
//         {/* Stats */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           {statCards.map((stat, i) => {
//             const Icon = stat.icon;
//             return (
//               <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
//                 <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
//                   <Icon className="w-5 h-5 text-white" />
//                 </div>
//                 <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
//                 <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Filters */}
//         <div className="bg-white rounded-xl border border-gray-200 p-5">
//           <div className="flex flex-col lg:flex-row gap-3">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search by tenant name or email..."
//                 value={search}
//                 onChange={e => setSearch(e.target.value)}
//                 className="w-full pl-10 pr-4 h-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
//                 style={{ "--tw-ring-color": MAROON }}
//               />
//             </div>
//             <select
//               value={statusFilter}
//               onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
//               className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 min-w-[160px]"
//             >
//               <option value="all">All Statuses</option>
//               <option value="pending">Pending</option>
//               <option value="approved">Approved</option>
//               <option value="rejected">Rejected</option>
//               <option value="expired">Expired</option>
//             </select>
//             <select
//               value={typeFilter}
//               onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
//               className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 min-w-[200px]"
//             >
//               <option value="all">All Types</option>
//               {Object.entries(TYPE_LABELS).map(([k, v]) => (
//                 <option key={k} value={k}>{v}</option>
//               ))}
//             </select>
//             <button
//               onClick={loadDocs}
//               className="h-11 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm"
//             >
//               <RefreshCcw className="w-4 h-4" />
//               Refresh
//             </button>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           {loading ? (
//             <div className="flex items-center justify-center py-20">
//               <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
//             </div>
//           ) : docs.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-20 text-gray-400">
//               <FileText className="w-12 h-12 mb-3" />
//               <p className="text-sm font-medium">No documents found</p>
//               <p className="text-xs mt-1">Try adjusting your filters</p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="bg-gray-50 border-b border-gray-200">
//                     <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant</th>
//                     <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Document Type</th>
//                     <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
//                     <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Doc Number</th>
//                     <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded</th>
//                     <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {docs.map(doc => {
//                     const sc = STATUS_CONFIGS[doc.status] || STATUS_CONFIGS.pending;
//                     return (
//                       <tr key={doc.id} className="hover:bg-gray-50/60 cursor-pointer" onClick={() => setSelectedDocId(doc.id)}>
//                         <td className="px-5 py-3.5">
//                           <div className="text-sm font-medium text-gray-900">{doc.tenant?.name}</div>
//                           <div className="text-xs text-gray-500">{doc.tenant?.email}</div>
//                         </td>
//                         <td className="px-5 py-3.5">
//                           <span className="text-sm text-gray-700">{TYPE_LABELS[doc.document_type] || doc.document_type}</span>
//                         </td>
//                         <td className="px-5 py-3.5">
//                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
//                             <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
//                             {sc.label}
//                           </span>
//                         </td>
//                         <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{doc.document_number || "—"}</td>
//                         <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(doc.uploaded_at)}</td>
//                         <td className="px-5 py-3.5 text-right">
//                           <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
//                             <Eye className="w-4 h-4" />
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {/* Pagination */}
//           {!loading && docs.length > 0 && (
//             <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50/50">
//               <p className="text-sm text-gray-600">
//                 Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, totalCount)} of {totalCount}
//               </p>
//               <div className="flex items-center gap-2">
//                 <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white">
//                   <ChevronLeft className="w-4 h-4" />
//                 </button>
//                 <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
//                 <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-white">
//                   <ChevronRight className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Detail drawer */}
//       {selectedDocId && (
//         <DocumentDrawer
//           docId={selectedDocId}
//           onClose={() => setSelectedDocId(null)}
//           onAction={handleAction}
//         />
//       )}
//     </SuperAdminLayout>
//   );
// }