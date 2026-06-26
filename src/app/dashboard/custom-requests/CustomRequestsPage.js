"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import { getCustomRequests } from "./lib/api";
import {
  FileText,
  Search,
  RefreshCw,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  ArrowRightCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-400",
    icon: Clock,
  },
  negotiating: {
    label: "Negotiating",
    color: "bg-blue-100 text-blue-800",
    dot: "bg-blue-400",
    icon: MessageSquare,
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-100 text-green-800",
    dot: "bg-green-400",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    dot: "bg-red-400",
    icon: XCircle,
  },
  converted: {
    label: "Converted",
    color: "bg-purple-100 text-purple-800",
    dot: "bg-purple-400",
    icon: ArrowRightCircle,
  },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);
const TABS = ["all", ...ALL_STATUSES];

export default function CustomRequestsPage() {
  const router = useRouter();
  const { t, activeTenant, isRTL } = useApp();
  const { allowed: canManage } = useTenantPermission("custom_requests.manage");

  const tenantId = activeTenant?.id || activeTenant;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tenantId) {
        router.push("/auth/login");
        return;
      }

      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const data = await getCustomRequests(tenantId, params);
      setRequests(data?.results || data || []);
    } catch (err) {
      if (err.status === 401) {
        router.push("/auth/login");
        return;
      }
      setError(err.message || "Failed to load custom requests.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, router, tenantId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRequestClick = (id) => {
    router.push(`/dashboard/custom-requests/${id}`);
  };

  const statusCounts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`max-w-7xl mx-auto p-6 ${isRTL ? "text-right" : ""}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t("customRequests.title") || "Custom Requests"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {requests.length} {t("common.total") || "total"}
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          {t("common.refresh") || "Refresh"}
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("customRequests.searchPlaceholder") || "Search by title or customer..."}
            className={`w-full sm:w-96 border rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => {
          const count = tab === "all" ? requests.length : statusCounts[tab] || 0;
          if (tab !== "all" && !count && statusFilter !== tab) return null;
          const config = STATUS_CONFIG[tab];
          return (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
                statusFilter === tab
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {config && (
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              )}
              {config?.label || t("common.all") || "All"}
              {count ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-red-600 text-lg mb-3">{error}</p>
          <button onClick={fetchRequests} className="text-blue-600 hover:underline text-sm">
            {t("common.tryAgain") || "Try again"}
          </button>
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg text-gray-500">
            {t("customRequests.empty.title") || "No custom requests"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {debouncedSearch
              ? `No results for "${debouncedSearch}"`
              : statusFilter !== "all"
                ? `No ${STATUS_CONFIG[statusFilter]?.label?.toLowerCase()} requests`
                : t("customRequests.empty.description") || "Custom requests will appear here"}
          </p>
        </div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}>
                  <th className="px-4 py-3">{t("customRequests.table.request") || "Request #"}</th>
                  <th className="px-4 py-3">{t("customRequests.table.customer") || "Customer"}</th>
                  <th className="px-4 py-3 hidden md:table-cell">{t("customRequests.table.title") || "Title"}</th>
                  <th className="px-4 py-3 hidden sm:table-cell">{t("customRequests.table.budget") || "Budget"}</th>
                  <th className="px-4 py-3 hidden lg:table-cell">{t("customRequests.table.deadline") || "Deadline"}</th>
                  <th className="px-4 py-3">{t("customRequests.table.status") || "Status"}</th>
                  <th className="px-4 py-3 hidden sm:table-cell">{t("customRequests.table.date") || "Date"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => {
                  const sc = STATUS_CONFIG[req.status] || {};
                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleRequestClick(req.id)}
                      className="hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">
                          #{req.request_number || req.id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">{req.customer_name || "-"}</div>
                        <div className="text-xs text-gray-400">{req.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm text-gray-700 max-w-xs truncate">
                          {req.title}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm font-medium">
                          {req.budget_min && req.budget_max
                            ? `${req.currency || "USD"} ${req.budget_min} - ${req.budget_max}`
                            : req.budget
                              ? `${req.currency || "USD"} ${req.budget}`
                              : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">
                          {req.deadline
                            ? new Date(req.deadline).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sc.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label || req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-500">
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
