// src/app/dashboard/orders/AdminOrdersClient.js
"use client";

/**
 * AdminOrdersClient — Dashboard Order List
 *
 * Step 8 Fixes:
 * - router.push() instead of window.location.href
 * - Proper loading, error, and empty states
 * - Uses existing GET /api/v1/orders/ (admin gets all orders via get_queryset)
 * - Search and status filtering via query params
 * - No new auth, no new endpoints
 */
// import { authFetch } from "./lib/api";
import { apiFetch as authFetch } from '@/lib/apiClient';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import { BrandRoot, Button, EmptyState } from "@/components/ui";
import { OrderStatusBadge } from "@/components/orders";
import { useRealtime } from "@/lib/realtime";
import { applyTenantOrderSummary } from "@/lib/realtimePatches";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";



// ─── Status config ───

// const STATUS_CONFIG = {
//   pending_payment: { label: "Pending Payment", color: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-400" },
//   paid:            { label: "Paid",            color: "bg-blue-100 text-blue-800",     dot: "bg-blue-400" },
//   in_progress:     { label: "In Progress",     color: "bg-purple-100 text-purple-800", dot: "bg-purple-400" },
//   delivered:       { label: "Delivered",        color: "bg-teal-100 text-teal-800",     dot: "bg-teal-400" },
//   completed:       { label: "Completed",        color: "bg-green-100 text-green-800",   dot: "bg-green-400" },
//   cancelled:       { label: "Cancelled",        color: "bg-red-100 text-red-800",       dot: "bg-red-400" },
//   refunded:        { label: "Refunded",         color: "bg-gray-100 text-gray-800",     dot: "bg-gray-400" },
// };

const STATUS_CONFIG = {
  pending_payment: {
    labelKey: "bookings.status.pendingPayment",
    color: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-400",
  },
  paid: {
    labelKey: "bookings.status.paid",
    color: "bg-blue-100 text-blue-800",
    dot: "bg-blue-400",
  },
  in_progress: {
    labelKey: "bookings.status.inProgress",
    color: "bg-purple-100 text-purple-800",
    dot: "bg-purple-400",
  },
  delivered: {
    labelKey: "bookings.status.delivered",
    color: "bg-teal-100 text-teal-800",
    dot: "bg-teal-400",
  },
  completed: {
    labelKey: "bookings.status.completed",
    color: "bg-green-100 text-green-800",
    dot: "bg-green-400",
  },
  cancelled: {
    labelKey: "bookings.status.cancelled",
    color: "bg-red-100 text-red-800",
    dot: "bg-red-400",
  },
  refunded: {
    labelKey: "bookings.status.refunded",
    color: "bg-gray-100 text-gray-800",
    dot: "bg-gray-400",
  },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export default function AdminOrdersClient() {
  const router = useRouter();


  const { allowed: canView } = useTenantPermission("orders.view");
  const { allowed: canManage } = useTenantPermission("orders.manage");

  const { t, activeTenant } = useApp();
    // Handle both object and string tenant ID
    const tenantId = activeTenant?.id || activeTenant;

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Fetch orders ───
  const fetchOrders = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    if (!tenantId) {
      router.push("/auth/login");
      return;
    }

    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);

    const qs = params.toString() ? `?${params.toString()}` : "";

    const data = await authFetch(
      `/api/v1/orders/${qs}`,
      tenantId
    );

    setOrders(data?.results || data || []);
  } catch (err) {
    if (err.status === 401) {
      router.push("/auth/login");
      return;
    }

    setError(err.message || "Failed to load orders.");
  } finally {
    setLoading(false);
  }
}, [statusFilter, debouncedSearch, router, tenantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ─── Realtime — tenant order feed ───
  useRealtime({
    topics: tenantId ? [`tenant:${tenantId}:orders`] : [],
    onEvent: (envelope) => {
      if (envelope?.entity_type === "order.summary") {
        setOrders((prev) => applyTenantOrderSummary(prev, envelope));
      }
    },
    onReconnect: () => { fetchOrders(); },
  });

  // ─── Navigate to detail (SPA — no full reload) ───
  const handleOrderClick = (orderId) => {
    if (!canManage) return;
    router.push(`/dashboard/orders/${orderId}`);
  };

  // ─── Status counts ───
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // ─── Stats summary ───
  const totalRevenue = orders.reduce((sum, o) => {
    return ["paid", "in_progress", "delivered", "completed"].includes(o.status)
      ? sum + parseFloat(o.total_amount || 0)
      : sum;
  }, 0);

  return (
    <BrandRoot>
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("orders.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {orders.length} {t("orders.total")} · ${totalRevenue.toFixed(2)} {t("orders.revenue")}
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="text-sm text-blue-600 hover:underline"
        >
         {t("common.refresh")}
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("orders.searchPlaceholder")}
          className="w-full sm:w-96 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            statusFilter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
        {t("common.all")} ({orders.length})
        </button>
        {ALL_STATUSES.map((s) => {
          const count = statusCounts[s];
          if (!count && statusFilter !== s) return null; // hide empty statuses
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
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
              {STATUS_CONFIG[s].label}
              {count ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-2" role="status" aria-busy="true" aria-label="Loading orders">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <EmptyState
          title={t("orders.error.load")}
          hint={error}
          action={<Button variant="primary" onClick={fetchOrders}>Try again</Button>}
        />
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <EmptyState
          title={t("orders.empty.title")}
          hint={
            debouncedSearch
              ? t("orders.empty.searchResults", { search: debouncedSearch })
              : statusFilter !== "all"
                ? `No ${statusFilter.replace(/_/g, " ")} orders`
                : t("orders.empty.description")
          }
        />
      )}

      {/* Order table */}
      {!loading && !error && orders.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">{t("orders.table.order")}</th>
                <th className="px-4 py-3">{t("orders.table.customer")}</th>
                <th className="px-4 py-3 hidden md:table-cell">{t("orders.table.provider")}</th>
                <th className="px-4 py-3">{t("orders.table.status")}</th>
                <th className="px-4 py-3 text-right">{t("orders.table.amount")}</th>
                <th className="px-4 py-3 hidden sm:table-cell">{t("orders.table.date")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
                const sc = STATUS_CONFIG[order.status] || {};
                return (
                  <tr
                    key={order.id}
                    onClick={() => handleOrderClick(order.id)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
                    {/* Order info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        {order.service_name || t("common.notAvailable")}
                        {order.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                            {order.unread_count > 9 ? '9+' : order.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">#{order.order_number}</div>
                    </td>
                    {/* <td className="px-4 py-3">
                      <div className="font-medium text-sm">
                        {order.service_name || "—"}
                      </div>
                      <div className="text-xs text-gray-400">
                        #{order.order_number}
                      </div>
                    </td> */}

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="text-sm">{order.customer_name || "—"}</div>
                      <div className="text-xs text-gray-400">
                        {order.customer_email}
                      </div>
                    </td>

                    {/* Provider */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {order.provider_name || t("orders.unassigned")}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium">
                        {order.currency || "USD"} {parseFloat(order.total_amount || 0).toFixed(2)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </BrandRoot>
  );
}