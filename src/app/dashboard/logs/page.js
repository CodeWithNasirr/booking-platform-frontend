"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { useTenantRBAC } from "@/contexts/TenantRBACContext";
import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
import Cookies from "js-cookie";
import {
  ScrollText,
  Search,
  Loader2,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  User,
  Edit,
  Trash2,
  CreditCard,
  ArrowRightLeft,
  Plus,
  Shield,
  Eye,
  FileText,
  Calendar,
  Activity,
  TrendingUp,
  Users,
  Zap,
  RotateCcw,
} from "lucide-react";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const MAROON = "#8B1E3F";
const API = process.env.NEXT_PUBLIC_API_URL || "";

const ACTION_CONFIG = {
  create:         { labelKey: "logs.action.create",        icon: Plus,            bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  update:         { labelKey: "logs.action.update",        icon: Edit,            bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500" },
  delete:         { labelKey: "logs.action.delete",        icon: Trash2,          bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500" },
  status_change:  { labelKey: "logs.action.statusChange",  icon: ArrowRightLeft,  bg: "bg-purple-50",   text: "text-purple-700",  dot: "bg-purple-500" },
  payment:        { labelKey: "logs.action.payment",       icon: CreditCard,      bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500" },
  refund:         { labelKey: "logs.action.refund",        icon: RotateCcw,       bg: "bg-orange-50",   text: "text-orange-700",  dot: "bg-orange-500" },
  milestone_release: { labelKey: "logs.action.milestone", icon: Zap,             bg: "bg-cyan-50",     text: "text-cyan-700",    dot: "bg-cyan-500" },
  dispute:        { labelKey: "logs.action.dispute",       icon: Shield,          bg: "bg-rose-50",     text: "text-rose-700",    dot: "bg-rose-500" },
};

const MODEL_ICONS = {
  Booking:   Calendar,
  Order:     FileText,
  Service:   Zap,
  Provider:  Users,
  User:      User,
};

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function authHeaders() {
  const token = Cookies.get("access_token");
  const tenant = Cookies.get("active_tenant");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "X-Tenant": tenant || "",
    "Content-Type": "application/json",
  };
}

async function apiFetch(path, params = {}) {
  const url = new URL(`${API}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== "all") url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { headers: authHeaders(), credentials: "include" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(d, t) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("logs.time.justNow");
  if (mins < 60) return t("logs.time.minutesAgo", { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t("logs.time.hoursAgo", { count: hrs });
  const days = Math.floor(hrs / 24);
  if (days < 7) return t("logs.time.daysAgo", { count: days });
  return formatDateShort(d);
}

/* ────────────────────────────────────────────
   Action Badge
   ──────────────────────────────────────────── */

function ActionBadge({ action, t }) {
  const cfg = ACTION_CONFIG[action] || {
    labelKey: "logs.action.unknown", icon: Activity, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400",
  };
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <Icon className="w-3 h-3" />
      {t(cfg.labelKey)}
    </span>
  );
}

/* ────────────────────────────────────────────
   Stat Card
   ──────────────────────────────────────────── */

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

/* ────────────────────────────────────────────
   Diff Viewer
   ──────────────────────────────────────────── */

function DiffViewer({ oldValues, newValues, t }) {
  if ((!oldValues || !Object.keys(oldValues).length) &&
      (!newValues || !Object.keys(newValues).length)) {
    return <p className="text-xs text-gray-400 italic">{t("logs.changes.none")}</p>;
  }

  const allKeys = [...new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {}),
  ])].sort();

  // Filter out noisy internal fields
  const ignoreKeys = ["updated_at", "id", "tenant"];
  const keys = allKeys.filter((k) => !ignoreKeys.includes(k));

  if (!keys.length) {
    return <p className="text-xs text-gray-400 italic">{t("logs.changes.noMeaningful")}</p>;
  }

  return (
    <div className="space-y-2">
      {keys.map((key) => {
        const oldVal = oldValues?.[key];
        const newVal = newValues?.[key];
        const changed = oldVal !== newVal && oldVal !== undefined;

        return (
          <div key={key} className="flex items-start gap-3 text-xs">
            <span className="w-28 shrink-0 font-medium text-gray-500 pt-0.5 truncate" title={key}>
              {key.replace(/_/g, " ")}
            </span>
            <div className="flex-1 min-w-0">
              {changed && oldVal !== undefined && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="text-red-600 line-through truncate break-all">
                    {typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal || "—")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${changed ? "bg-emerald-400" : "bg-gray-300"}`} />
                <span className={`truncate break-all ${changed ? "text-emerald-700 font-medium" : "text-gray-600"}`}>
                  {typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal || "—")}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────
   Log Detail Modal
   ──────────────────────────────────────────── */

function LogDetailModal({ log, onClose, t }) {
  if (!log) return null;
  const cfg = ACTION_CONFIG[log.action_type] || ACTION_CONFIG.create;
  const ModelIcon = MODEL_ICONS[log.model_name] || FileText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
              <cfg.icon className={`w-5 h-5 ${cfg.text}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{t(cfg.labelKey)}</h3>
              <p className="text-xs text-gray-400">{timeAgo(log.created_at, t)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            {[
              [t("logs.detail.model"), <span key="m" className="flex items-center gap-1.5"><ModelIcon className="w-3.5 h-3.5 text-gray-400" />{log.model_name}</span>],
              [t("logs.detail.objectId"), <code key="o" className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded break-all">{log.object_id?.slice(0, 8)}...</code>],
              [t("logs.detail.user"), log.user_name || t("logs.system")],
              [t("logs.detail.email"), log.user_email || "—"],
              [t("logs.detail.ipAddress"), log.ip_address || "—"],
              [t("logs.detail.time"), formatDate(log.created_at)],
            ].map(([label, value]) => (
              <div key={label} className="text-sm">
                <span className="text-gray-500 text-xs block mb-0.5">{label}</span>
                <span className="text-gray-900 text-xs font-medium">{value}</span>
              </div>
            ))}
          </div>

          {/* User Agent */}
          {log.user_agent && (
            <div>
              <span className="text-xs text-gray-500 block mb-1">{t("logs.detail.device")}</span>
              <p className="text-[11px] text-gray-600 bg-gray-50 rounded-lg px-3 py-2 break-all leading-relaxed">
                {log.user_agent.length > 120 ? log.user_agent.slice(0, 120) + "…" : log.user_agent}
              </p>
            </div>
          )}

          {/* Changes */}
          <div>
            <span className="text-xs font-semibold text-gray-700 block mb-2">{t("logs.detail.changes")}</span>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <DiffViewer oldValues={log.old_values} newValues={log.new_values} t={t} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */

function AuditLogsContent() {
  const { t, activeTenant, user } = useApp();

  /* ── State ─────────────────────────────── */
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Toast
  const [toast, setToast] = useState(null);
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ── Load stats ────────────────────────── */
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await apiFetch("/api/v1/logs/stats/");
      setStats(data);
    } catch {
      // Stats are non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* ── Load logs ─────────────────────────── */
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch("/api/v1/logs/", {
        page,
        page_size: pageSize,
        action_type: actionFilter,
        model_name: modelFilter,
        search,
        date_from: dateFrom,
        date_to: dateTo,
      });
      setLogs(data.results || []);
      setTotalPages(data.pages || 1);
      setTotalCount(data.count || 0);
    } catch (err) {
      setError(t("logs.error.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, modelFilter, search, dateFrom, dateTo, t]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [actionFilter, modelFilter, search, dateFrom, dateTo]);

  /* ── Export ────────────────────────────── */
  async function handleExport() {
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.set("action_type", actionFilter);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(
        `${API}/api/v1/logs/export/?${params.toString()}`,
        { headers: authHeaders(), credentials: "include" }
      );

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("logs.export.success"));
    } catch {
      showToast(t("logs.export.failed"), "error");
    }
  }

  /* ── Unique models from data ───────────── */
  const uniqueModels = [...new Set(logs.map((l) => l.model_name))].sort();

  /* ── Render ────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("dashboard.logs.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("dashboard.logs.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {t("logs.refresh")}
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: MAROON }}
          >
            <Download className="w-4 h-4" />
            {t("logs.export.csv")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label={t("dashboard.logs.today")}
          value={stats?.today ?? "—"}
          color="from-[#8B1E3F] to-[#A8325A]"
        />
        <StatCard
          icon={TrendingUp}
          label={t("dashboard.logs.this_week")}
          value={stats?.this_week ?? "—"}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={ScrollText}
          label={t("dashboard.logs.this_month")}
          value={stats?.this_month ?? "—"}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          icon={FileText}
          label={t("dashboard.logs.total")}
          value={stats?.total?.toLocaleString() ?? "—"}
          color="from-gray-500 to-gray-600"
        />
      </div>

      {/* Active Users (mini bar) */}
      {stats?.active_users?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">{t("logs.activeUsers.title")}</h3>
          <div className="space-y-2">
            {stats.active_users.map((u, i) => {
              const max = stats.active_users[0]?.actions || 1;
              const pct = (u.actions / max) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B1E3F] to-[#A8325A] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {(u.name || "S").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-gray-700 truncate">{u.name || u.email}</span>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">{u.actions} {t("logs.activeUsers.actions")}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: MAROON }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("logs.search.placeholder")}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
            />
          </div>

          {/* Action type */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
          >
            <option value="all">{t("logs.filter.allActions")}</option>
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{t(cfg.labelKey)}</option>
            ))}
          </select>

          {/* Model */}
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
          >
            <option value="all">{t("logs.filter.allModels")}</option>
            {uniqueModels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Date range */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
            placeholder={t("logs.filter.from")}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
            placeholder={t("logs.filter.to")}
          />

          {/* Clear */}
          {(search || actionFilter !== "all" || modelFilter !== "all" || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch("");
                setActionFilter("all");
                setModelFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 shrink-0"
              title={t("logs.filter.clear")}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: MAROON }} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-gray-600">{error}</p>
            <button onClick={loadLogs} className="text-sm font-medium" style={{ color: MAROON }}>
              {t("logs.retry")}
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{t("logs.empty.title")}</p>
            <p className="text-gray-400 text-xs mt-1">{t("logs.empty.subtitle")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("logs.table.action")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("logs.table.model")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("logs.table.user")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("logs.table.ip")}</th>
                    <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("logs.table.time")}</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => {
                    const ModelIcon = MODEL_ICONS[log.model_name] || FileText;
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-5 py-3.5">
                          <ActionBadge action={log.action_type} t={t} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <ModelIcon className="w-4 h-4 text-gray-400" />
                            <div>
                              <span className="text-sm font-medium text-gray-900">{log.model_name}</span>
                              <span className="text-[10px] text-gray-400 block">
                                {log.object_id?.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 text-gray-500" />
                            </div>
                            <div>
                              <span className="text-sm text-gray-900 block truncate max-w-[120px]">
                                {log.user_name || t("logs.system")}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-gray-500 font-mono">
                            {log.ip_address || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div>
                            <span className="text-xs text-gray-700 block">{timeAgo(log.created_at, t)}</span>
                            <span className="text-[10px] text-gray-400">{formatDateShort(log.created_at)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            {t("logs.view")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                {t("logs.pagination.showing", { 
                  from: ((page - 1) * pageSize) + 1, 
                  to: Math.min(page * pageSize, totalCount), 
                  total: totalCount.toLocaleString() 
                })}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (page <= 3) {
                    p = i + 1;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = page - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        p === page
                          ? "text-white"
                          : "text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                      style={p === page ? { backgroundColor: MAROON } : {}}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          t={t}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Page Export (with permission gate)
   ──────────────────────────────────────────── */

export default function AuditLogsPage() {
  return (
    <TenantPermissionGate permission="settings.view">
      <AuditLogsContent />
    </TenantPermissionGate>
  );
}


// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useApp } from "@/contexts/AppContext";
// import { useTenantRBAC } from "@/contexts/TenantRBACContext";
// import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";
// import Cookies from "js-cookie";
// import {
//   ScrollText,
//   Search,
//   Loader2,
//   AlertCircle,
//   Filter,
//   Download,
//   RefreshCw,
//   ChevronLeft,
//   ChevronRight,
//   X,
//   Clock,
//   User,
//   Edit,
//   Trash2,
//   CreditCard,
//   ArrowRightLeft,
//   Plus,
//   Shield,
//   Eye,
//   FileText,
//   Calendar,
//   Activity,
//   TrendingUp,
//   Users,
//   Zap,
//   RotateCcw,
// } from "lucide-react";

// /* ────────────────────────────────────────────
//    Constants
//    ──────────────────────────────────────────── */

// const MAROON = "#8B1E3F";
// const API = process.env.NEXT_PUBLIC_API_URL || "";

// const ACTION_CONFIG = {
//   create:         { label: "Created",        icon: Plus,            bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
//   update:         { label: "Updated",        icon: Edit,            bg: "bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500" },
//   delete:         { label: "Deleted",        icon: Trash2,          bg: "bg-red-50",      text: "text-red-700",     dot: "bg-red-500" },
//   status_change:  { label: "Status Change",  icon: ArrowRightLeft,  bg: "bg-purple-50",   text: "text-purple-700",  dot: "bg-purple-500" },
//   payment:        { label: "Payment",        icon: CreditCard,      bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500" },
//   refund:         { label: "Refund",         icon: RotateCcw,       bg: "bg-orange-50",   text: "text-orange-700",  dot: "bg-orange-500" },
//   milestone_release: { label: "Milestone",   icon: Zap,             bg: "bg-cyan-50",     text: "text-cyan-700",    dot: "bg-cyan-500" },
//   dispute:        { label: "Dispute",        icon: Shield,          bg: "bg-rose-50",     text: "text-rose-700",    dot: "bg-rose-500" },
// };

// const MODEL_ICONS = {
//   Booking:   Calendar,
//   Order:     FileText,
//   Service:   Zap,
//   Provider:  Users,
//   User:      User,
// };

// /* ────────────────────────────────────────────
//    Helpers
//    ──────────────────────────────────────────── */

// function authHeaders() {
//   const token = Cookies.get("access_token");
//   const tenant = Cookies.get("active_tenant");
//   return {
//     Authorization: token ? `Bearer ${token}` : "",
//     "X-Tenant": tenant || "",
//     "Content-Type": "application/json",
//   };
// }

// async function apiFetch(path, params = {}) {
//   const url = new URL(`${API}${path}`);
//   Object.entries(params).forEach(([k, v]) => {
//     if (v != null && v !== "" && v !== "all") url.searchParams.set(k, v);
//   });
//   const res = await fetch(url.toString(), { headers: authHeaders(), credentials: "include" });
//   if (!res.ok) throw new Error(`API ${res.status}`);
//   return res.json();
// }

// function formatDate(d) {
//   if (!d) return "—";
//   return new Date(d).toLocaleDateString("en-US", {
//     month: "short", day: "numeric", year: "numeric",
//     hour: "2-digit", minute: "2-digit",
//   });
// }

// function formatDateShort(d) {
//   if (!d) return "—";
//   return new Date(d).toLocaleDateString("en-US", {
//     month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
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
//   const days = Math.floor(hrs / 24);
//   if (days < 7) return `${days}d ago`;
//   return formatDateShort(d);
// }

// /* ────────────────────────────────────────────
//    Action Badge
//    ──────────────────────────────────────────── */

// function ActionBadge({ action }) {
//   const cfg = ACTION_CONFIG[action] || {
//     label: action, icon: Activity, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400",
//   };
//   const Icon = cfg.icon;

//   return (
//     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
//       <Icon className="w-3 h-3" />
//       {cfg.label}
//     </span>
//   );
// }

// /* ────────────────────────────────────────────
//    Stat Card
//    ──────────────────────────────────────────── */

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

// /* ────────────────────────────────────────────
//    Diff Viewer
//    ──────────────────────────────────────────── */

// function DiffViewer({ oldValues, newValues }) {
//   if ((!oldValues || !Object.keys(oldValues).length) &&
//       (!newValues || !Object.keys(newValues).length)) {
//     return <p className="text-xs text-gray-400 italic">No field changes recorded</p>;
//   }

//   const allKeys = [...new Set([
//     ...Object.keys(oldValues || {}),
//     ...Object.keys(newValues || {}),
//   ])].sort();

//   // Filter out noisy internal fields
//   const ignoreKeys = ["updated_at", "id", "tenant"];
//   const keys = allKeys.filter((k) => !ignoreKeys.includes(k));

//   if (!keys.length) {
//     return <p className="text-xs text-gray-400 italic">No meaningful changes</p>;
//   }

//   return (
//     <div className="space-y-2">
//       {keys.map((key) => {
//         const oldVal = oldValues?.[key];
//         const newVal = newValues?.[key];
//         const changed = oldVal !== newVal && oldVal !== undefined;

//         return (
//           <div key={key} className="flex items-start gap-3 text-xs">
//             <span className="w-28 shrink-0 font-medium text-gray-500 pt-0.5 truncate" title={key}>
//               {key.replace(/_/g, " ")}
//             </span>
//             <div className="flex-1 min-w-0">
//               {changed && oldVal !== undefined && (
//                 <div className="flex items-center gap-1.5 mb-0.5">
//                   <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
//                   <span className="text-red-600 line-through truncate break-all">
//                     {typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal || "—")}
//                   </span>
//                 </div>
//               )}
//               <div className="flex items-center gap-1.5">
//                 <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${changed ? "bg-emerald-400" : "bg-gray-300"}`} />
//                 <span className={`truncate break-all ${changed ? "text-emerald-700 font-medium" : "text-gray-600"}`}>
//                   {typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal || "—")}
//                 </span>
//               </div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// /* ────────────────────────────────────────────
//    Log Detail Modal
//    ──────────────────────────────────────────── */

// function LogDetailModal({ log, onClose }) {
//   if (!log) return null;
//   const cfg = ACTION_CONFIG[log.action_type] || ACTION_CONFIG.create;
//   const ModelIcon = MODEL_ICONS[log.model_name] || FileText;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
//         {/* Header */}
//         <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
//           <div className="flex items-center gap-3">
//             <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
//               <cfg.icon className={`w-5 h-5 ${cfg.text}`} />
//             </div>
//             <div>
//               <h3 className="text-base font-semibold text-gray-900">{cfg.label}</h3>
//               <p className="text-xs text-gray-400">{timeAgo(log.created_at)}</p>
//             </div>
//           </div>
//           <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-y-auto p-5 space-y-4">
//           {/* Meta info */}
//           <div className="grid grid-cols-2 gap-3">
//             {[
//               ["Model", <span key="m" className="flex items-center gap-1.5"><ModelIcon className="w-3.5 h-3.5 text-gray-400" />{log.model_name}</span>],
//               ["Object ID", <code key="o" className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded break-all">{log.object_id?.slice(0, 8)}...</code>],
//               ["User", log.user_name || "System"],
//               ["Email", log.user_email || "—"],
//               ["IP Address", log.ip_address || "—"],
//               ["Time", formatDate(log.created_at)],
//             ].map(([label, value]) => (
//               <div key={label} className="text-sm">
//                 <span className="text-gray-500 text-xs block mb-0.5">{label}</span>
//                 <span className="text-gray-900 text-xs font-medium">{value}</span>
//               </div>
//             ))}
//           </div>

//           {/* User Agent */}
//           {log.user_agent && (
//             <div>
//               <span className="text-xs text-gray-500 block mb-1">Device</span>
//               <p className="text-[11px] text-gray-600 bg-gray-50 rounded-lg px-3 py-2 break-all leading-relaxed">
//                 {log.user_agent.length > 120 ? log.user_agent.slice(0, 120) + "…" : log.user_agent}
//               </p>
//             </div>
//           )}

//           {/* Changes */}
//           <div>
//             <span className="text-xs font-semibold text-gray-700 block mb-2">Changes</span>
//             <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
//               <DiffViewer oldValues={log.old_values} newValues={log.new_values} />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════
//    MAIN PAGE
//    ════════════════════════════════════════════ */

// function AuditLogsContent() {
//   const { t, activeTenant, user } = useApp();

//   /* ── State ─────────────────────────────── */
//   const [stats, setStats] = useState(null);
//   const [logs, setLogs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [statsLoading, setStatsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedLog, setSelectedLog] = useState(null);

//   // Pagination
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalCount, setTotalCount] = useState(0);
//   const pageSize = 20;

//   // Filters
//   const [search, setSearch] = useState("");
//   const [actionFilter, setActionFilter] = useState("all");
//   const [modelFilter, setModelFilter] = useState("all");
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");

//   // Toast
//   const [toast, setToast] = useState(null);
//   function showToast(msg, type = "success") {
//     setToast({ msg, type });
//     setTimeout(() => setToast(null), 3000);
//   }

//   /* ── Load stats ────────────────────────── */
//   const loadStats = useCallback(async () => {
//     try {
//       setStatsLoading(true);
//       const data = await apiFetch("/api/v1/logs/stats/");
//       setStats(data);
//     } catch {
//       // Stats are non-critical
//     } finally {
//       setStatsLoading(false);
//     }
//   }, []);

//   /* ── Load logs ─────────────────────────── */
//   const loadLogs = useCallback(async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await apiFetch("/api/v1/logs/", {
//         page,
//         page_size: pageSize,
//         action_type: actionFilter,
//         model_name: modelFilter,
//         search,
//         date_from: dateFrom,
//         date_to: dateTo,
//       });
//       setLogs(data.results || []);
//       setTotalPages(data.pages || 1);
//       setTotalCount(data.count || 0);
//     } catch (err) {
//       setError("Failed to load audit logs");
//     } finally {
//       setLoading(false);
//     }
//   }, [page, actionFilter, modelFilter, search, dateFrom, dateTo]);

//   useEffect(() => { loadStats(); }, [loadStats]);
//   useEffect(() => { loadLogs(); }, [loadLogs]);

//   // Reset page on filter change
//   useEffect(() => { setPage(1); }, [actionFilter, modelFilter, search, dateFrom, dateTo]);

//   /* ── Export ────────────────────────────── */
//   async function handleExport() {
//     try {
//       const params = new URLSearchParams();
//       if (actionFilter !== "all") params.set("action_type", actionFilter);
//       if (dateFrom) params.set("date_from", dateFrom);
//       if (dateTo) params.set("date_to", dateTo);

//       const res = await fetch(
//         `${API}/api/v1/logs/export/?${params.toString()}`,
//         { headers: authHeaders(), credentials: "include" }
//       );

//       if (!res.ok) throw new Error();

//       const blob = await res.blob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
//       a.click();
//       URL.revokeObjectURL(url);
//       showToast("Logs exported");
//     } catch {
//       showToast("Export failed", "error");
//     }
//   }

//   /* ── Unique models from data ───────────── */
//   const uniqueModels = [...new Set(logs.map((l) => l.model_name))].sort();

//   /* ── Render ────────────────────────────── */
//   return (
//     <div className="space-y-6">

//       {/* Toast */}
//       {toast && (
//         <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
//           {toast.msg}
//         </div>
//       )}

//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">
//             {t("dashboard.logs.title") || "Activity Logs"}
//           </h1>
//           <p className="text-sm text-gray-500 mt-1">
//             {t("dashboard.logs.subtitle") || "Track all actions and changes across your business"}
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={loadLogs}
//             disabled={loading}
//             className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
//           >
//             <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
//             Refresh
//           </button>
//           <button
//             onClick={handleExport}
//             className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg"
//             style={{ backgroundColor: MAROON }}
//           >
//             <Download className="w-4 h-4" />
//             Export CSV
//           </button>
//         </div>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         <StatCard
//           icon={Activity}
//           label={t("dashboard.logs.today") || "Today"}
//           value={stats?.today ?? "—"}
//           color="from-[#8B1E3F] to-[#A8325A]"
//         />
//         <StatCard
//           icon={TrendingUp}
//           label={t("dashboard.logs.this_week") || "This Week"}
//           value={stats?.this_week ?? "—"}
//           color="from-blue-500 to-blue-600"
//         />
//         <StatCard
//           icon={ScrollText}
//           label={t("dashboard.logs.this_month") || "This Month"}
//           value={stats?.this_month ?? "—"}
//           color="from-purple-500 to-purple-600"
//         />
//         <StatCard
//           icon={FileText}
//           label={t("dashboard.logs.total") || "Total Logs"}
//           value={stats?.total?.toLocaleString() ?? "—"}
//           color="from-gray-500 to-gray-600"
//         />
//       </div>

//       {/* Active Users (mini bar) */}
//       {stats?.active_users?.length > 0 && (
//         <div className="bg-white rounded-xl border border-gray-200 p-5">
//           <h3 className="text-sm font-semibold text-gray-900 mb-3">Most Active Users (30 days)</h3>
//           <div className="space-y-2">
//             {stats.active_users.map((u, i) => {
//               const max = stats.active_users[0]?.actions || 1;
//               const pct = (u.actions / max) * 100;
//               return (
//                 <div key={i} className="flex items-center gap-3">
//                   <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B1E3F] to-[#A8325A] flex items-center justify-center shrink-0">
//                     <span className="text-[10px] font-bold text-white">
//                       {(u.name || "S").charAt(0).toUpperCase()}
//                     </span>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between mb-0.5">
//                       <span className="text-xs font-medium text-gray-700 truncate">{u.name || u.email}</span>
//                       <span className="text-[10px] text-gray-400 shrink-0 ml-2">{u.actions} actions</span>
//                     </div>
//                     <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                       <div
//                         className="h-full rounded-full transition-all"
//                         style={{ width: `${pct}%`, backgroundColor: MAROON }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="bg-white rounded-xl border border-gray-200 p-4">
//         <div className="flex flex-col lg:flex-row gap-3">
//           {/* Search */}
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               placeholder="Search by model, object ID, or email..."
//               className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30 focus:border-[#8B1E3F]"
//             />
//           </div>

//           {/* Action type */}
//           <select
//             value={actionFilter}
//             onChange={(e) => setActionFilter(e.target.value)}
//             className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
//           >
//             <option value="all">All Actions</option>
//             {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
//               <option key={key} value={key}>{cfg.label}</option>
//             ))}
//           </select>

//           {/* Model */}
//           <select
//             value={modelFilter}
//             onChange={(e) => setModelFilter(e.target.value)}
//             className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
//           >
//             <option value="all">All Models</option>
//             {uniqueModels.map((m) => (
//               <option key={m} value={m}>{m}</option>
//             ))}
//           </select>

//           {/* Date range */}
//           <input
//             type="date"
//             value={dateFrom}
//             onChange={(e) => setDateFrom(e.target.value)}
//             className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
//             placeholder="From"
//           />
//           <input
//             type="date"
//             value={dateTo}
//             onChange={(e) => setDateTo(e.target.value)}
//             className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]/30"
//             placeholder="To"
//           />

//           {/* Clear */}
//           {(search || actionFilter !== "all" || modelFilter !== "all" || dateFrom || dateTo) && (
//             <button
//               onClick={() => {
//                 setSearch("");
//                 setActionFilter("all");
//                 setModelFilter("all");
//                 setDateFrom("");
//                 setDateTo("");
//               }}
//               className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 shrink-0"
//               title="Clear filters"
//             >
//               <X className="w-4 h-4 text-gray-500" />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Logs Table */}
//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         {loading ? (
//           <div className="flex items-center justify-center py-20">
//             <Loader2 className="w-6 h-6 animate-spin" style={{ color: MAROON }} />
//           </div>
//         ) : error ? (
//           <div className="flex flex-col items-center justify-center py-20 gap-3">
//             <AlertCircle className="w-8 h-8 text-red-400" />
//             <p className="text-sm text-gray-600">{error}</p>
//             <button onClick={loadLogs} className="text-sm font-medium" style={{ color: MAROON }}>
//               Retry
//             </button>
//           </div>
//         ) : logs.length === 0 ? (
//           <div className="text-center py-20">
//             <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
//             <p className="text-gray-500 text-sm">No activity logs found</p>
//             <p className="text-gray-400 text-xs mt-1">Actions will appear here as they happen</p>
//           </div>
//         ) : (
//           <>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="bg-gray-50 text-left">
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
//                     <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
//                     <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" />
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                   {logs.map((log) => {
//                     const ModelIcon = MODEL_ICONS[log.model_name] || FileText;
//                     return (
//                       <tr
//                         key={log.id}
//                         className="hover:bg-gray-50/60 transition-colors cursor-pointer"
//                         onClick={() => setSelectedLog(log)}
//                       >
//                         <td className="px-5 py-3.5">
//                           <ActionBadge action={log.action_type} />
//                         </td>
//                         <td className="px-5 py-3.5">
//                           <div className="flex items-center gap-2">
//                             <ModelIcon className="w-4 h-4 text-gray-400" />
//                             <div>
//                               <span className="text-sm font-medium text-gray-900">{log.model_name}</span>
//                               <span className="text-[10px] text-gray-400 block">
//                                 {log.object_id?.slice(0, 8)}...
//                               </span>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-5 py-3.5">
//                           <div className="flex items-center gap-2">
//                             <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
//                               <User className="w-3 h-3 text-gray-500" />
//                             </div>
//                             <div>
//                               <span className="text-sm text-gray-900 block truncate max-w-[120px]">
//                                 {log.user_name || "System"}
//                               </span>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-5 py-3.5">
//                           <span className="text-xs text-gray-500 font-mono">
//                             {log.ip_address || "—"}
//                           </span>
//                         </td>
//                         <td className="px-5 py-3.5">
//                           <div>
//                             <span className="text-xs text-gray-700 block">{timeAgo(log.created_at)}</span>
//                             <span className="text-[10px] text-gray-400">{formatDateShort(log.created_at)}</span>
//                           </div>
//                         </td>
//                         <td className="px-5 py-3.5 text-right">
//                           <button
//                             onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
//                             className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
//                           >
//                             <Eye className="w-3 h-3" />
//                             View
//                           </button>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination */}
//             <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
//               <span className="text-xs text-gray-500">
//                 Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount.toLocaleString()}
//               </span>
//               <div className="flex items-center gap-1">
//                 <button
//                   onClick={() => setPage((p) => Math.max(1, p - 1))}
//                   disabled={page <= 1}
//                   className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
//                 >
//                   <ChevronLeft className="w-4 h-4 text-gray-600" />
//                 </button>
//                 {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
//                   let p;
//                   if (totalPages <= 5) {
//                     p = i + 1;
//                   } else if (page <= 3) {
//                     p = i + 1;
//                   } else if (page >= totalPages - 2) {
//                     p = totalPages - 4 + i;
//                   } else {
//                     p = page - 2 + i;
//                   }
//                   return (
//                     <button
//                       key={p}
//                       onClick={() => setPage(p)}
//                       className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
//                         p === page
//                           ? "text-white"
//                           : "text-gray-600 border border-gray-200 hover:bg-gray-50"
//                       }`}
//                       style={p === page ? { backgroundColor: MAROON } : {}}
//                     >
//                       {p}
//                     </button>
//                   );
//                 })}
//                 <button
//                   onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                   disabled={page >= totalPages}
//                   className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
//                 >
//                   <ChevronRight className="w-4 h-4 text-gray-600" />
//                 </button>
//               </div>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Detail Modal */}
//       {selectedLog && (
//         <LogDetailModal
//           log={selectedLog}
//           onClose={() => setSelectedLog(null)}
//         />
//       )}
//     </div>
//   );
// }

// /* ────────────────────────────────────────────
//    Page Export (with permission gate)
//    ──────────────────────────────────────────── */

// export default function AuditLogsPage() {
//   return (
//     <TenantPermissionGate permission="settings.view">
//       <AuditLogsContent />
//     </TenantPermissionGate>
//   );
// }