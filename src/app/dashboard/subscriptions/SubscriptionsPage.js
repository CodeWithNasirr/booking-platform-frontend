"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import { getSubscriptions, cancelSubscription, pauseSubscription } from "../custom-requests/lib/api";
import toast from "react-hot-toast";
import {
  RefreshCw,
  Search,
  Pause,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800",
    dot: "bg-green-400",
    icon: CheckCircle,
  },
  paused: {
    label: "Paused",
    color: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-400",
    icon: Pause,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800",
    dot: "bg-red-400",
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    color: "bg-gray-100 text-gray-800",
    dot: "bg-gray-400",
    icon: AlertCircle,
  },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export default function SubscriptionsPage() {
  const router = useRouter();
  const { t, activeTenant, isRTL } = useApp();
  const { allowed: canManage } = useTenantPermission("custom_requests.manage");

  const tenantId = activeTenant?.id || activeTenant;

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSubscriptions = useCallback(async () => {
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

      const data = await getSubscriptions(tenantId, params);
      setSubscriptions(data?.results || data || []);
    } catch (err) {
      if (err.status === 401) {
        router.push("/auth/login");
        return;
      }
      setError(err.message || "Failed to load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, router, tenantId]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCancel = async (subId) => {
    if (!window.confirm(t("subscriptions.confirmCancel") || "Are you sure you want to cancel this subscription?")) return;
    try {
      setActionLoading(subId);
      await cancelSubscription(tenantId, subId);
      toast.success(t("subscriptions.cancelled") || "Subscription cancelled");
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.message || "Failed to cancel subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async (subId) => {
    try {
      setActionLoading(subId);
      await pauseSubscription(tenantId, subId);
      toast.success(t("subscriptions.paused") || "Subscription paused");
      fetchSubscriptions();
    } catch (err) {
      toast.error(err.message || "Failed to pause subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const statusCounts = subscriptions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`max-w-7xl mx-auto p-6 ${isRTL ? "text-right" : ""}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {t("subscriptions.title") || "Subscriptions"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {subscriptions.length} {t("common.total") || "total"}
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
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
            placeholder={t("subscriptions.searchPlaceholder") || "Search subscriptions..."}
            className={`w-full sm:w-96 border rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"}`}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            statusFilter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {t("common.all") || "All"} ({subscriptions.length})
        </button>
        {ALL_STATUSES.map((s) => {
          const count = statusCounts[s] || 0;
          if (!count && statusFilter !== s) return null;
          const config = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
                statusFilter === s
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              {config.label}
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
          <button onClick={fetchSubscriptions} className="text-blue-600 hover:underline text-sm">
            {t("common.tryAgain") || "Try again"}
          </button>
        </div>
      )}

      {!loading && !error && subscriptions.length === 0 && (
        <div className="text-center py-16">
          <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg text-gray-500">
            {t("subscriptions.empty.title") || "No subscriptions"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {t("subscriptions.empty.description") || "Subscriptions will appear here"}
          </p>
        </div>
      )}

      {!loading && !error && subscriptions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}>
                  <th className="px-4 py-3">{t("subscriptions.table.customer") || "Customer"}</th>
                  <th className="px-4 py-3">{t("subscriptions.table.service") || "Service"}</th>
                  <th className="px-4 py-3">{t("subscriptions.table.status") || "Status"}</th>
                  <th className="px-4 py-3 hidden md:table-cell">{t("subscriptions.table.billing") || "Billing"}</th>
                  <th className="px-4 py-3">{t("subscriptions.table.price") || "Price"}</th>
                  <th className="px-4 py-3 hidden lg:table-cell">{t("subscriptions.table.nextBilling") || "Next Billing"}</th>
                  {canManage && (
                    <th className="px-4 py-3">{t("subscriptions.table.actions") || "Actions"}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions.map((sub) => {
                  const sc = STATUS_CONFIG[sub.status] || {};
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{sub.customer_name || "-"}</div>
                        <div className="text-xs text-gray-400">{sub.customer_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">{sub.service_name || "-"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label || sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-gray-600 capitalize">
                          {sub.billing_type || sub.billing_cycle || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">
                          {sub.currency || "USD"} {parseFloat(sub.price || sub.amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-500">
                          {sub.next_billing_date
                            ? new Date(sub.next_billing_date).toLocaleDateString()
                            : "-"}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          {sub.status === "active" && (
                            <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                              <button
                                onClick={() => handlePause(sub.id)}
                                disabled={actionLoading === sub.id}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50 transition"
                              >
                                <Pause className="w-3 h-3" />
                                {t("common.pause") || "Pause"}
                              </button>
                              <button
                                onClick={() => handleCancel(sub.id)}
                                disabled={actionLoading === sub.id}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition"
                              >
                                <XCircle className="w-3 h-3" />
                                {t("common.cancel") || "Cancel"}
                              </button>
                            </div>
                          )}
                          {sub.status === "paused" && (
                            <button
                              onClick={() => handleCancel(sub.id)}
                              disabled={actionLoading === sub.id}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition"
                            >
                              <XCircle className="w-3 h-3" />
                              {t("common.cancel") || "Cancel"}
                            </button>
                          )}
                        </td>
                      )}
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
