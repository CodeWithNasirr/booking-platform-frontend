"use client";

import React, { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useSuperAdmin } from "@/contexts/SuperAdminContext";
import { fetchAuditLogs } from "@/lib/platformApi";
import {
  Search,
  RefreshCcw,
  Loader2,
  ScrollText,
  CheckCircle,
  XCircle,
  Shield,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  UserPlus,
  Key,
  AlertTriangle,
} from "lucide-react";

const ACTION_ICONS = {
  login: LogIn,
  logout: LogOut,
  create: UserPlus,
  update: Edit,
  delete: Trash2,
  suspend: AlertTriangle,
  activate: CheckCircle,
  permission_grant: Key,
  permission_revoke: Key,
  role_change: Shield,
  access_attempt: AlertTriangle,
};

const ACTION_COLORS = {
  login: "text-green-600 bg-green-50",
  logout: "text-gray-600 bg-gray-50",
  create: "text-blue-600 bg-blue-50",
  update: "text-amber-600 bg-amber-50",
  delete: "text-red-600 bg-red-50",
  suspend: "text-orange-600 bg-orange-50",
  activate: "text-green-600 bg-green-50",
  permission_grant: "text-purple-600 bg-purple-50",
  permission_revoke: "text-purple-600 bg-purple-50",
  role_change: "text-indigo-600 bg-indigo-50",
  access_attempt: "text-red-600 bg-red-50",
};

export default function LogsPage() {
  const { hasPermission } = useSuperAdmin();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      params.limit = 200;
      const data = await fetchAuditLogs(params);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
    setLoading(false);
  }, [actionFilter]);

  useEffect(() => {
    if (hasPermission("system.view_logs")) {
      loadLogs();
    } else {
      setLoading(false);
    }
  }, [loadLogs, hasPermission]);

  const filtered = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.resource_type?.toLowerCase().includes(q)
    );
  });

  if (!hasPermission("system.view_logs")) {
    return (
      <SuperAdminLayout title="Audit Logs" description="Platform activity logs">
        <div className="flex flex-col items-center justify-center py-32 text-gray-500">
          <Shield className="w-12 h-12 mb-3 text-gray-300" />
          <p>You don't have permission to view audit logs.</p>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Audit Logs"
      description="Platform activity and security events"
      breadcrumbs={[{ label: "Logs & Audit" }]}
    >
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs…"
              className="w-full pl-10 h-11 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 px-4 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full lg:w-48 h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 bg-white"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="suspend">Suspend</option>
            <option value="activate">Activate</option>
            <option value="permission_grant">Permission Grant</option>
            <option value="permission_revoke">Permission Revoke</option>
            <option value="role_change">Role Change</option>
            <option value="access_attempt">Access Attempt</option>
          </select>

          <button
            onClick={loadLogs}
            className="h-11 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Logs list */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <ScrollText className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm">No logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((log) => {
                const Icon = ACTION_ICONS[log.action] || Shield;
                const colorClass = ACTION_COLORS[log.action] || "text-gray-600 bg-gray-50";

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">
                          {log.action_display || log.action}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{log.resource_type}</span>
                        {!log.is_success && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full font-medium">
                            <XCircle className="w-3 h-3" /> Failed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 truncate">{log.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span>{log.user_email || "System"}</span>
                        {log.ip_address && <span>IP: {log.ip_address}</span>}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-sm text-gray-500">Showing {filtered.length} log entries</p>
        )}
      </div>
    </SuperAdminLayout>
  );
}