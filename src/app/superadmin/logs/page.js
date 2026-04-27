// // app/superadmin/logs/page.jsx


// src/app/superadmin/logs/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import {
  Search, Filter, Download, RefreshCcw, ChevronLeft, ChevronRight,
  Activity, Shield, AlertTriangle, CheckCircle, XCircle, Info,
  Clock, User, Eye, X, Loader2, Calendar,
} from "lucide-react";
import { fetchAuditLogs } from "@/lib/platformApi";

const MAROON = "#800020";

const ACTION_STYLES = {
  login:             { bg: "bg-blue-50",    text: "text-blue-700",    icon: CheckCircle },
  logout:            { bg: "bg-gray-100",   text: "text-gray-600",    icon: Info },
  create:            { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
  update:            { bg: "bg-amber-50",   text: "text-amber-700",   icon: Info },
  delete:            { bg: "bg-red-50",     text: "text-red-700",     icon: XCircle },
  suspend:           { bg: "bg-red-50",     text: "text-red-700",     icon: AlertTriangle },
  activate:          { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
  permission_grant:  { bg: "bg-purple-50",  text: "text-purple-700",  icon: Shield },
  permission_revoke: { bg: "bg-orange-50",  text: "text-orange-700",  icon: Shield },
  role_change:       { bg: "bg-indigo-50",  text: "text-indigo-700",  icon: User },
  access_attempt:    { bg: "bg-red-50",     text: "text-red-700",     icon: AlertTriangle },
};

const RESOURCE_STYLES = {
  platform_auth:     { bg: "bg-blue-50",   text: "text-blue-700" },
  platform_employee: { bg: "bg-purple-50", text: "text-purple-700" },
  tenant:            { bg: "bg-emerald-50", text: "text-emerald-700" },
  tenant_document:   { bg: "bg-amber-50",  text: "text-amber-700" },
};

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "suspend", label: "Suspend" },
  { value: "activate", label: "Activate" },
  { value: "permission_grant", label: "Permission Grant" },
  { value: "permission_revoke", label: "Permission Revoke" },
  { value: "role_change", label: "Role Change" },
  { value: "access_attempt", label: "Access Attempt" },
];

const RESOURCE_OPTIONS = [
  { value: "", label: "All Resources" },
  { value: "platform_auth", label: "Authentication" },
  { value: "platform_employee", label: "Employees" },
  { value: "tenant", label: "Tenants" },
  { value: "tenant_document", label: "Documents" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function ActionBadge({ action }) {
  const s = ACTION_STYLES[action] || { bg: "bg-gray-100", text: "text-gray-600", icon: Info };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <Icon className="w-3 h-3" />
      {action?.replace(/_/g, " ")}
    </span>
  );
}

function ResourceBadge({ type }) {
  const s = RESOURCE_STYLES[type] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {type?.replace(/_/g, " ")}
    </span>
  );
}

function StatusDot({ success }) {
  return (
    <span className={`w-2 h-2 rounded-full inline-block ${success ? "bg-emerald-500" : "bg-red-500"}`} />
  );
}

// ─── Detail Modal ──────────────────────────────────────────

function LogDetailModal({ log, onClose }) {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Log Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 block mb-1">Action</span>
              <ActionBadge action={log.action} />
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Status</span>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${log.is_success ? "text-emerald-700" : "text-red-700"}`}>
                <StatusDot success={log.is_success} />
                {log.is_success ? "Success" : "Failed"}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Resource</span>
              <ResourceBadge type={log.resource_type} />
            </div>
            <div>
              <span className="text-xs text-gray-500 block mb-1">Timestamp</span>
              <span className="text-sm text-gray-900">{formatDate(log.created_at)}</span>
            </div>
          </div>

          <div>
            <span className="text-xs text-gray-500 block mb-1">User</span>
            <span className="text-sm text-gray-900">{log.user_email || "System"}</span>
          </div>

          <div>
            <span className="text-xs text-gray-500 block mb-1">Description</span>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{log.description}</p>
          </div>

          {log.resource_id && (
            <div>
              <span className="text-xs text-gray-500 block mb-1">Resource ID</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{log.resource_id}</code>
            </div>
          )}

          {log.ip_address && (
            <div>
              <span className="text-xs text-gray-500 block mb-1">IP Address</span>
              <span className="text-sm text-gray-700 font-mono">{log.ip_address}</span>
            </div>
          )}

          {log.user_agent && (
            <div>
              <span className="text-xs text-gray-500 block mb-1">User Agent</span>
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 break-all">{log.user_agent}</p>
            </div>
          )}

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <span className="text-xs text-gray-500 block mb-1">Metadata</span>
              <pre className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [limit, setLimit] = useState(50);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, security: 0 });

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit };
      if (actionFilter) params.action = actionFilter;
      if (resourceFilter) params.resource_type = resourceFilter;

      const data = await fetchAuditLogs(params);
      const logsArray = Array.isArray(data) ? data : data?.results || [];
      setLogs(logsArray);

      // Compute stats
      setStats({
        total: logsArray.length,
        success: logsArray.filter(l => l.is_success).length,
        failed: logsArray.filter(l => !l.is_success).length,
        security: logsArray.filter(l => ["access_attempt", "login", "logout"].includes(l.action)).length,
      });
    } catch (err) {
      setError(err.message || "Failed to load logs");
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, resourceFilter, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Client-side search filter
  const filtered = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.description?.toLowerCase().includes(q) ||
      log.user_email?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.resource_type?.toLowerCase().includes(q)
    );
  });

  const statCards = [
    { label: "Total Events", value: stats.total, icon: Activity, color: "from-blue-500 to-blue-600" },
    { label: "Successful", value: stats.success, icon: CheckCircle, color: "from-emerald-500 to-emerald-600" },
    { label: "Failed", value: stats.failed, icon: XCircle, color: "from-red-500 to-red-600" },
    { label: "Security Events", value: stats.security, icon: Shield, color: "from-purple-500 to-purple-600" },
  ];

  return (
    <SuperAdminLayout
      title="Logs & Audit Trail"
      description="Monitor system activity and security events"
      breadcrumbs={[{ label: "Logs" }]}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description, user, or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ "--tw-ring-color": MAROON }}
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 min-w-[160px]"
            >
              {ACTION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 min-w-[160px]"
            >
              {RESOURCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 min-w-[120px]"
            >
              <option value={25}>Last 25</option>
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
              <option value={250}>Last 250</option>
            </select>

            <button
              onClick={loadLogs}
              disabled={loading}
              className="h-11 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={loadLogs} className="ml-auto text-sm font-medium text-red-700 hover:text-red-900">
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading logs...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Activity className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No audit logs found</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Resource</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">IP</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <StatusDot success={log.is_success} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-gray-900">{log.user_email || "System"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-5 py-3.5">
                        <ResourceBadge type={log.resource_type} />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-gray-600 max-w-xs truncate" title={log.description}>
                          {log.description}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">
                        {log.ip_address || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Count */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/50">
              <p className="text-sm text-gray-600">
                Showing {filtered.length} of {logs.length} log entries
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </SuperAdminLayout>
  );
}















// import ComingSoon from "@/components/ui/ComingSoon";

// export default function LogsPage() {
//   return <ComingSoon title="Logs Page" />;
// }
