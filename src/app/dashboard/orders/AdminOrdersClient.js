// src/app/dashboard/orders/AdminOrdersClient.js
"use client";

/**
 * AdminOrdersClient — Dashboard Order List (premium SaaS redesign)
 *
 * Backend/API/realtime/permission logic is unchanged:
 *  - GET /api/v1/orders/ (admin gets all orders via get_queryset)
 *  - search via query param (debounced); status is filtered client-side
 *    so KPIs + segmented counts stay coherent (same endpoint, fewer params)
 *  - realtime tenant order feed (order.summary) patches the list
 *  - orders.view gates the page (TenantPermissionGate); orders.manage
 *    gates navigation into a detail
 */

import { apiFetch as authFetch } from '@/lib/apiClient';

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import { useRealtime } from "@/lib/realtime";
import { applyTenantOrderSummary } from "@/lib/realtimePatches";
import Cookies from "js-cookie";

import { BrandRoot } from "@/components/ui/brand";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PackageOpen, SearchX } from "lucide-react";

import OrdersStats from "./components/OrdersStats";
import OrdersToolbar from "./components/OrdersToolbar";
import OrdersList from "./components/OrdersList";
import { REVENUE_STATUSES, makeFormatters } from "./components/orderPresentation";

export default function AdminOrdersClient() {
  const router = useRouter();
  const { t, isRTL, activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const { allowed: canManage } = useTenantPermission("orders.manage");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Fetch orders (search server-side; status filtered client-side) ───
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tenantId) {
        router.push("/auth/login");
        return;
      }

      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      const qs = params.toString() ? `?${params.toString()}` : "";

      const data = await authFetch(`/api/v1/orders/${qs}`, tenantId);
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
  }, [debouncedSearch, router, tenantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ─── Realtime — tenant order feed ───
  useRealtime({
    topics: tenantId ? [`tenant:${tenantId}:orders`] : [],
    auth: { jwt: Cookies.get("access_token") || null },
    onEvent: (envelope) => {
      if (envelope?.entity_type === "order.summary") {
        setOrders((prev) => applyTenantOrderSummary(prev, envelope));
      }
    },
    onReconnect: () => { fetchOrders(); },
  });

  const handleOpen = (orderId) => {
    if (!canManage) return;
    router.push(`/dashboard/orders/${orderId}`);
  };

  // ─── Derived data ───
  const statusCounts = useMemo(
    () => orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {}),
    [orders],
  );

  const visibleOrders = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter],
  );

  const currency = orders[0]?.currency || "SAR";
  const { money } = makeFormatters(isRTL, currency);
  const totalRevenue = useMemo(
    () => orders.reduce((s, o) => (REVENUE_STATUSES.includes(o.status) ? s + parseFloat(o.total_amount || 0) : s), 0),
    [orders],
  );

  const hasActiveFilters = Boolean(debouncedSearch) || statusFilter !== "all";

  return (
    <BrandRoot>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t("orders.title")}</h1>
              <span className="inline-flex items-center px-2 h-6 rounded-full bg-muted text-muted-foreground text-xs font-semibold tabular-nums">
                {orders.length}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {orders.length} {t("orders.total")} · <span className="font-medium text-foreground">{money(totalRevenue)}</span> {t("orders.revenue")}
            </p>
          </div>
        </header>

        {/* KPI row */}
        <OrdersStats orders={orders} currency={currency} />

        {/* Toolbar: search + segmented status filters (+ mobile drawer) */}
        <OrdersToolbar
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          statusCounts={statusCounts}
          totalCount={orders.length}
          onRefresh={fetchOrders}
        />

        {/* States */}
        {loading && <OrdersList loading orders={[]} canManage={canManage} onOpen={handleOpen} />}

        {!loading && error && (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={PackageOpen}
              title={t("orders.error.load")}
              hint={error}
              action={<Button variant="primary" onClick={fetchOrders}>{t("common.tryAgain")}</Button>}
            />
          </div>
        )}

        {!loading && !error && visibleOrders.length === 0 && (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={hasActiveFilters ? SearchX : PackageOpen}
              title={t("orders.empty.title")}
              hint={
                debouncedSearch
                  ? t("orders.empty.searchResults", { search: debouncedSearch })
                  : statusFilter !== "all"
                    ? `No ${statusFilter.replace(/_/g, " ")} orders`
                    : t("orders.empty.description")
              }
            />
          </div>
        )}

        {!loading && !error && visibleOrders.length > 0 && (
          <OrdersList orders={visibleOrders} canManage={canManage} onOpen={handleOpen} />
        )}
      </div>
    </BrandRoot>
  );
}
