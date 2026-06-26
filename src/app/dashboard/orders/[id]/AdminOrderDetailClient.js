// src/app/dashboard/orders/[id]/AdminOrderDetailClient.js
"use client";

/**
 * AdminOrderDetailClient — Dashboard Order Detail View
 *
 * Step 11 (Fixed): 2-column layout with chat panel
 *
 * API endpoints used (matching Step 10 backend):
 *   GET  /api/v1/orders/{id}/              ← order detail
 *   POST /api/v1/orders/{id}/accept_order/ ← accept
 *   POST /api/v1/orders/{id}/start_work/   ← start work
 *   POST /api/v1/orders/{id}/deliver/      ← mark delivered
 *   POST /api/v1/orders/{id}/accept_delivery/ ← complete order
 *   POST /api/v1/orders/{id}/request_revision/ ← revision
 *   POST /api/v1/orders/{id}/cancel/       ← cancel
 *   GET  /api/v1/orders/{id}/messages/     ← fetch messages (via chat panel)
 *   POST /api/v1/orders/{id}/messages/     ← send message (via chat panel)
 *   POST /api/v1/orders/{id}/upload_file/  ← upload file (via chat panel)
 */

// import { authFetch } from "../lib/api";
import { apiFetch as authFetch } from '@/lib/apiClient';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import OrderChatPanel from "@/components/orders/OrderChatPanel";
import { useTenantPermission } from "@/lib/useTenantPermission";
// ─── Status config ───

const STATUS_CONFIG = {
  pending_payment:    { label: "Pending Payment",    color: "bg-amber-50 text-amber-700 border border-amber-200",     icon: "⏳" },
  pending_assignment: {
    label: "Waiting Provider Assignment",
    color: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    icon: "👤"
  },
  paid:               { label: "Paid",               color: "bg-blue-50 text-blue-700 border border-blue-200",        icon: "💳" },
  accepted:           { label: "Accepted",           color: "bg-indigo-50 text-indigo-700 border border-indigo-200",  icon: "✓" },
  in_progress:        { label: "In Progress",        color: "bg-violet-50 text-violet-700 border border-violet-200",  icon: "⚡" },
  delivered:          { label: "Delivered",           color: "bg-teal-50 text-teal-700 border border-teal-200",       icon: "📦" },
  completed:          { label: "Completed",          color: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: "✅" },
  revision_requested: { label: "Revision Requested", color: "bg-orange-50 text-orange-700 border border-orange-200",  icon: "🔄" },
  cancelled:          { label: "Cancelled",          color: "bg-red-50 text-red-700 border border-red-200",           icon: "✕" },
  refunded:           { label: "Refunded",           color: "bg-gray-50 text-gray-600 border border-gray-200",        icon: "↩" },
};

// Admin actions per status — each maps to a specific backend endpoint
const ADMIN_ACTIONS = {
  pending_assignment: [
  { action: "assign_provider", label: "Assign Provider", style: "primary" }
  ],
  pending_payment: [],
  paid: [
    // { endpoint: "accept_order", label: "Accept Order", style: "primary" },
    // { endpoint: "start_work",   label: "Start Work",   style: "primary" },
    // { action: "cancel",         label: "Cancel",        style: "danger" },
  ],
  accepted: [
    { endpoint: "start_work", label: "Start Work", style: "primary" },
    { action: "cancel",       label: "Cancel",     style: "danger" },
  ],
  in_progress: [
    { action: "deliver", label: "Mark Delivered", style: "primary" },
    { action: "cancel",    label: "Cancel",         style: "danger" },
  ],
  delivered: [
    { action: "complete",             label: "Complete Order",    style: "success" },
    // { endpoint: "request_revision",   label: "Request Revision",  style: "secondary" },
    // { endpoint: "start_work",         label: "Reopen",            style: "secondary" },
  ],
  revision_requested: [
    { endpoint: "start_work", label: "Resume Work", style: "primary" },
    { action: "cancel",       label: "Cancel",      style: "danger" },
  ],
  completed: [],
  cancelled: [],
  refunded:  [],
};

const ACTION_STYLES = {
  primary:   "bg-blue-600 text-white hover:bg-blue-700",
  success:   "bg-emerald-600 text-white hover:bg-emerald-700",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  danger:    "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
};

export default function AdminOrderDetailClient({ orderId }) {
  const router = useRouter();
  const { activeTenant, user,t } = useApp();

  const { allowed: canView } = useTenantPermission("orders.view");
  const { allowed: canManage } = useTenantPermission("orders.manage");
  
  const isAgency = activeTenant?.has_providers === true;
  const tenantId = activeTenant?.id || activeTenant;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

    // Deliver modal
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Provider Assignment 
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

 

  // ─── Fetch order detail ───
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!tenantId) { router.push("/auth/login"); return; }

      const data = await authFetch(`/api/v1/orders/${orderId}/`, tenantId);
      setOrder(data);
    } catch (err) {
      if (err.status === 401) { router.push("/auth/login"); return; }
      if (err.status === 404) { setError("Order not found."); return; }
      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId, tenantId, router]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);


  const fetchProviders = async () => {
    try {
      const data = await authFetch(
        `/api/v1/services/${order.service_id}/providers/`,
        tenantId
      );
      setProviders(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Call a specific action endpoint: POST /orders/{id}/{endpoint}/ ───
  const callAction = async (endpoint) => {
    try {
      setActionLoading(endpoint);
      await authFetch(
        `/api/v1/orders/${orderId}/${endpoint}/`,
        tenantId,
        { method: "POST" }
      );
      await fetchOrder();
    } catch (err) {
      alert(err.message || `Failed: ${endpoint}`);
    } finally {
      setActionLoading(null);
    }
  };


  const handleDeliver = async () => {
    try {
      setActionLoading("deliver");

      await authFetch(
        `/api/v1/orders/${orderId}/deliver/`,
        tenantId,
        {
          method: "POST",
          body: JSON.stringify({
            message: deliveryMessage
          })
        }
      );

      setShowDeliverModal(false);
      setDeliveryMessage("");

      await fetchOrder();

    } catch (err) {
    
    console.error(err);
    alert(err.data?.error || err.message);
  
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Cancel: POST /orders/{id}/cancel/ ───
  const handleCancel = async () => {
    try {
      setActionLoading("cancel");
      await authFetch(`/api/v1/orders/${orderId}/cancel/`, tenantId, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });
      setShowCancelModal(false);
      setCancelReason("");
      await fetchOrder();
    } catch (err) {
      alert(err.message || "Failed to cancel.");
    } finally {
      setActionLoading(null);
    }
  };


  const confirmAssignProvider = async () => {

    if (!selectedProvider) return;

    try {

      setActionLoading("assign_provider");

      await authFetch(
        `/api/v1/orders/${orderId}/assign_provider/`,
        tenantId,
        {
          method: "POST",
          body: JSON.stringify({
            provider_id: selectedProvider
          })
        }
      );

      setShowAssignModal(false);
      setSelectedProvider(null);

      await fetchOrder();

    } catch (err) {
      alert(err.message || "Failed to assign provider");
    } finally {
      setActionLoading(null);
    }

  };


  // ─── Complete: POST /orders/{id}/accept_delivery/ ───
  const handleComplete = async () => {
    try {
      setActionLoading("complete");
      await authFetch(`/api/v1/orders/${orderId}/complete/`, tenantId, {
        method: "POST",
      });
      await fetchOrder();
    } catch (err) {
      alert(err.message || "Failed to complete.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Action dispatcher ───
  const handleAction = (actionDef) => {
    if (!canManage) return;

    if (actionDef.action === "cancel") {
      setShowCancelModal(true);
    }

    else if (actionDef.action === "assign_provider") {
      setShowAssignModal(true);
      fetchProviders();
    }

    else if (actionDef.action === "complete") {
      handleComplete();
    }

    else if (actionDef.action === "deliver") {
      setShowDeliverModal(true);
    }

    else if (actionDef.endpoint) {
      callAction(actionDef.endpoint);
    }

  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
        <p className="text-red-600 text-lg mb-4">{error || "Order not found."}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={fetchOrder} className="text-blue-600 hover:underline text-sm">{t("orderDetail.tryAgain")}</button>
          <button onClick={() => router.push("/dashboard/orders")} className="text-gray-500 hover:underline text-sm">{t("orderDetail.backToOrders")}</button>
        </div>
      </div>
    );
  }

  const sc = STATUS_CONFIG[order.status] || {};
  let actions = ADMIN_ACTIONS[order.status] || [];

  // hide assign button for individual tenant
  if (!isAgency) {
    actions = actions.filter(a => a.action !== "assign_provider");
  }
  const isTerminal = ["completed", "cancelled", "refunded"].includes(order.status);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/orders")}
        className="text-sm text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1.5 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {t("orderDetail.backToOrders")}
      </button>

      {/* ═══ 2-Column Grid ═══ */}
      <div className="grid grid-cols-12 gap-6">
        {/* ═══ LEFT COLUMN (8/12) ═══ */}
        <div className="col-span-12 lg:col-span-8 space-y-5">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {order.service_name || "Order"}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5 font-mono">
                  #{order.order_number}
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${sc.color}`}
              >
                {sc.icon} {sc.label || order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100">
              <QuickStat
                label="Amount"
                value={`${order.currency || "USD"} ${parseFloat(order.total_amount || 0).toFixed(2)}`}
              />
              <QuickStat
                label="Delivery"
                value={
                  order.delivery_days ? `${order.delivery_days} days` : "—"
                }
              />
              <QuickStat
                label="Revisions"
                value={`${order.revisions_used || 0}/${order.revisions_allowed || 0}`}
              />
              <QuickStat
                label="Created"
                value={new Date(order.created_at).toLocaleDateString()}
              />
            </div>
          </div>

          {/* Action bar */}
          {actions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap gap-2">
               {canManage && actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => handleAction(a)}
                    disabled={actionLoading !== null}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      ACTION_STYLES[a.style] || ACTION_STYLES.secondary
                    }`}
                  >
                    {actionLoading === (a.endpoint || a.action)
                      ? "..."
                      : a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* People cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PersonCard
              title="Customer"
              name={order.customer_name_display || order.customer_name || "—"}
              email={order.customer_email}
              phone={order.customer_phone}
            />
            <PersonCard
              title="Provider"
              name={order.provider_name || "Waiting Assignment"}
              email={order.provider_email}
            />
          </div>

          {/* Requirements */}
          {order.requirements && Object.keys(order.requirements).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Requirements
              </h3>
              <div className="space-y-2">
                {Object.entries(order.requirements).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="text-gray-400 capitalize min-w-[120px]">
                      {key.replace(/_/g, " ")}:
                    </span>
                    <span className="text-gray-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status history */}
          {order.status_history?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Timeline
              </h3>
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-100" />
                <div className="space-y-4">
                  {order.status_history.map((entry, i) => {
                    const toConf = STATUS_CONFIG[entry.to_status] || {};
                    return (
                      <div key={i} className="flex gap-3 relative">
                        <div className="w-[15px] h-[15px] rounded-full bg-white border-2 border-gray-200 shrink-0 mt-0.5 z-10" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">
                              {entry.from_status || "Created"}
                            </span>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="text-gray-300"
                            >
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md ${toConf.color || "bg-gray-100"}`}
                            >
                              {toConf.label || entry.to_status}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {entry.notes}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-300 mt-0.5">
                            {entry.changed_by_name || "System"} ·{" "}
                            {new Date(
                              entry.created_at || entry.changed_at,
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Review */}
          {order.review && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Customer Review
              </h3>
              <div className="flex items-center gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={`text-lg ${s <= order.review.rating ? "text-amber-400" : "text-gray-200"}`}
                  >
                    ★
                  </span>
                ))}
                <span className="text-sm text-gray-500 ml-1">
                  {order.review.rating}/5
                </span>
              </div>
              {order.review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {order.review.comment}
                </p>
              )}
            </div>
          )}

          {/* Order detail card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Order Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <DetailRow
                label="Subtotal"
                value={`${order.currency || "USD"} ${parseFloat(order.subtotal || 0).toFixed(2)}`}
              />
              <DetailRow
                label="Platform Fee"
                value={`${order.currency || "USD"} ${parseFloat(order.platform_fee || 0).toFixed(2)}`}
              />
              <DetailRow
                label="Provider Earning"
                value={`${order.currency || "USD"} ${parseFloat(order.provider_earning || 0).toFixed(2)}`}
              />
              {order.stripe_payment_intent_id && (
                <DetailRow
                  label="Stripe PI"
                  value={order.stripe_payment_intent_id}
                  mono
                />
              )}
              {order.delivered_at && (
                <DetailRow
                  label="Delivered"
                  value={new Date(order.delivered_at).toLocaleString()}
                />
              )}
              {order.completed_at && (
                <DetailRow
                  label="Completed"
                  value={new Date(order.completed_at).toLocaleString()}
                />
              )}
              {order.cancelled_at && (
                <>
                  <DetailRow
                    label="Cancelled"
                    value={new Date(order.cancelled_at).toLocaleString()}
                  />
                  {order.cancellation_reason && (
                    <DetailRow
                      label="Reason"
                      value={order.cancellation_reason}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN (4/12) — Chat Panel ═══ */}
        <div className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-6">
          
            <OrderChatPanel
              orderId={orderId}
              tenantId={tenantId}
              authFetch={authFetch}
              initialMessages={order.messages || []}
              files={order.files || []}
              onRefresh={fetchOrder}
              currentUser={{
                id: user?.id,
                role: "admin"
              }}
              readOnly={isTerminal}
            />
           
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Cancel Order
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading === "cancel"}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === "cancel"
                  ? "Cancelling..."
                  : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* showAssignModal Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Provider</h3>

            <select
              className="w-full border rounded-lg p-2 mb-4"
              value={selectedProvider || ""}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <option value="">Select Provider</option>

              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={confirmAssignProvider}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliver Modal */}
      {showDeliverModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Deliver Order
            </h3>

            <p className="text-sm text-gray-400 mb-4">
              Send a delivery message to the customer.
            </p>

            <textarea
              value={deliveryMessage}
              onChange={(e) => setDeliveryMessage(e.target.value)}
              placeholder="Write delivery message..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeliverModal(false);
                  setDeliveryMessage("");
                }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={handleDeliver}
                disabled={actionLoading === "deliver"}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === "deliver"
                  ? "Delivering..."
                  : "Confirm Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───

function QuickStat({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function PersonCard({ title, name, email, phone }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-[11px] text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-sm font-semibold text-gray-800">{name}</p>
      {email && <p className="text-xs text-gray-400 mt-0.5">{email}</p>}
      {phone && <p className="text-xs text-gray-400">{phone}</p>}
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs font-medium text-gray-600 text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
