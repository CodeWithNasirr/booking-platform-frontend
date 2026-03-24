// src/app/provider/orders/ProviderOrderDetailClient.js
"use client";

/**
 * ProviderOrderDetailClient — Provider Order Detail View
 *
 * Step 11 (Fixed): 2-column layout with chat panel
 *
 * API endpoints used (matching Step 10 backend):
 *   GET  /api/v1/orders/{id}/              ← order detail
 *   POST /api/v1/orders/{id}/start_work/   ← paid/accepted → in_progress
 *   POST /api/v1/orders/{id}/deliver/      ← in_progress → delivered
 *   GET  /api/v1/orders/{id}/messages/     ← fetch messages (via chat panel)
 *   POST /api/v1/orders/{id}/messages/     ← send message (via chat panel)
 *   POST /api/v1/orders/{id}/upload_file/  ← upload file (via chat panel)
 *
 * Provider CANNOT: cancel, complete, review, refund, accept_order, decline_order
 * (accept/decline removed — orders auto-assigned, provider starts work directly)
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { authFetch } from "./orderApi";
import OrderChatPanel from "@/components/orders/OrderChatPanel";

// ─── Status config ───

const STATUS_CONFIG = {
  pending_payment:    { label: "Pending Payment",    color: "bg-amber-50 text-amber-700 border border-amber-200",     icon: "⏳" },
  paid:               { label: "New Order",          color: "bg-blue-50 text-blue-700 border border-blue-200",        icon: "🔔" },
  accepted:           { label: "Accepted",           color: "bg-indigo-50 text-indigo-700 border border-indigo-200",  icon: "✓" },
  in_progress:        { label: "In Progress",        color: "bg-violet-50 text-violet-700 border border-violet-200",  icon: "⚡" },
  delivered:          { label: "Delivered",           color: "bg-teal-50 text-teal-700 border border-teal-200",       icon: "📦" },
  completed:          { label: "Completed",          color: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: "✅" },
  revision_requested: { label: "Revision Requested", color: "bg-orange-50 text-orange-700 border border-orange-200",  icon: "🔄" },
  cancelled:          { label: "Cancelled",          color: "bg-red-50 text-red-700 border border-red-200",           icon: "✕" },
  refunded:           { label: "Refunded",           color: "bg-gray-50 text-gray-600 border border-gray-200",        icon: "↩" },
};

// Provider-allowed actions — maps to specific backend endpoints
const PROVIDER_ACTIONS = {
  // paid:               [{ endpoint: "start_work", label: "Start Working",      icon: "🚀" }],
  accepted:           [{ endpoint: "start_work", label: "Start Working",      icon: "🚀" }],
  in_progress:        [{ endpoint: "deliver",    label: "Submit Delivery",    icon: "📦", needsMessage: true }],
  revision_requested: [{ endpoint: "deliver",    label: "Resubmit Delivery", icon: "📦", needsMessage: true }],
  pending_assignment: [
  { action: "assign_provider", label: "Assign Provider", style: "primary"}
  ],
  // Everything else: no actions
};


export default function ProviderOrderDetailClient({ orderId }) {
  const router = useRouter();
  const { language, activeTenant, tenants, user, isRTL } = useApp();

  const tenantId = activeTenant?.id || activeTenant;
  const tenant = tenants?.find(t => t.id === activeTenant);
  const theme = tenant?.settings?.branding || {};
  const primaryColor = theme.primary_color || "#3B82F6";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  

  // ─── Fetch order: GET /orders/{id}/ ───
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!tenantId) { router.push("/auth/login"); return; }

      const data = await authFetch(`/api/v1/orders/${orderId}/`, tenantId);
      setOrder(data);
    } catch (err) {
      if (err.status === 401) { router.push("/auth/login"); return; }
      if (err.status === 404) { setError("Order not found or not assigned to you."); return; }
      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId, tenantId, router]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ─── Call action endpoint: POST /orders/{id}/{endpoint}/ ───
  const handleAction = async (actionDef) => {
    // If action needs a delivery message, show form first
    if (actionDef.needsMessage && !showDeliveryForm) {
      setShowDeliveryForm(true);
      return;
    }

    try {
      setActionLoading(actionDef.endpoint);

      const body = {};
      if (actionDef.endpoint === "deliver" && deliveryMessage.trim()) {
        body.message = deliveryMessage.trim();
      }

      await authFetch(`/api/v1/orders/${orderId}/${actionDef.endpoint}/`, tenantId, {
        method: "POST",
        ...(Object.keys(body).length > 0
          ? { body: JSON.stringify(body) }
          : {}),
      });

      setShowDeliveryForm(false);
      setDeliveryMessage("");
      await fetchOrder();
    } catch (err) {
      alert(err.message || `Failed: ${actionDef.label}`);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-56 bg-gray-100 rounded-xl animate-pulse" />
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
          <button onClick={fetchOrder} className="text-blue-600 hover:underline text-sm">Try again</button>
          <button onClick={() => router.push("/provider/orders")} className="text-gray-500 hover:underline text-sm">Back to orders</button>
        </div>
      </div>
    );
  }

  const sc = STATUS_CONFIG[order.status] || {};
  const actions = PROVIDER_ACTIONS[order.status] || [];
  const isTerminal = ["completed", "cancelled", "refunded"].includes(order.status);
  
  return (
    <div className={`max-w-7xl mx-auto p-6 ${isRTL ? "rtl" : ""}`}>
      {/* Back */}
      <button
        onClick={() => router.push("/provider/orders")}
        className="text-sm text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1.5 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to orders
      </button>

      {/* ═══ 2-Column Grid ═══ */}
      <div className="grid grid-cols-12 gap-6">

        {/* ═══ LEFT COLUMN (8/12) ═══ */}
        <div className="col-span-12 lg:col-span-8 space-y-5">

          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{order.service_name || "Order"}</h1>
                <p className="text-sm text-gray-400 mt-0.5 font-mono">#{order.order_number}</p>
                {order.package_name && (
                  <p className="text-xs text-gray-400 mt-1">Package: {order.package_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {order.is_overdue && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                    ⏰ Overdue
                  </span>
                )}
                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${sc.color}`}>
                  {sc.icon} {sc.label || order.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-gray-100">
              <QuickStat label="Customer" value={order.customer_name_display || order.customer_name || "—"} />
              <QuickStat label="Ordered" value={new Date(order.created_at).toLocaleDateString()} />
              {order.due_date && (
                <QuickStat label="Due Date" value={new Date(order.due_date).toLocaleDateString()} />
              )}
              <QuickStat label="Revisions" value={`${order.revisions_used || 0}/${order.revisions_allowed || 0}`} />
            </div>
          </div>

          {/* Earnings */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Earnings</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] text-gray-400">Order Total</p>
                <p className="text-lg font-bold text-gray-800">
                  ${parseFloat(order.total_amount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Platform Fee</p>
                <p className="text-lg font-bold text-red-500">
                  -${parseFloat(order.platform_fee || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">You Earn</p>
                <p className="text-lg font-bold text-emerald-600">
                  ${parseFloat(order.provider_earning || order.total_amount || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Provider action panel */}
          {actions.length > 0 && (
            <div
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: `${primaryColor}08`,
                borderColor: `${primaryColor}30`,
              }}
            >
              {/* Revision notice */}
              {order.status === "revision_requested" && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                  ⚠️ Customer requested a revision. Please review feedback and resubmit.
                </div>
              )}

              {/* Delivery form */}
              {showDeliveryForm ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">Submit Delivery</h3>
                  <p className="text-sm text-gray-500">Describe what you're delivering to the customer.</p>
                  <textarea
                    value={deliveryMessage}
                    onChange={(e) => setDeliveryMessage(e.target.value)}
                    placeholder="Delivery message — describe what's included..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction({ endpoint: "deliver", needsMessage: false })}
                      disabled={actionLoading || !deliveryMessage.trim()}
                      className="flex-1 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {actionLoading === "deliver" ? "Submitting..." : "📦 Submit Delivery"}
                    </button>
                    <button
                      onClick={() => { setShowDeliveryForm(false); setDeliveryMessage(""); }}
                      className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {actions.map((a) => (
                    <button
                      key={a.endpoint}
                      onClick={() => handleAction(a)}
                      disabled={actionLoading !== null}
                      className="flex-1 min-w-[180px] py-3 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {actionLoading === a.endpoint ? "..." : `${a.icon} ${a.label}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Requirements */}
          {order.requirements && Object.keys(order.requirements).length > 0 && (
            <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Requirements</h3>
              <div className="space-y-2">
                {Object.entries(order.requirements).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="text-gray-400 capitalize min-w-[120px]">{key.replace(/_/g, " ")}:</span>
                    <span className="text-gray-700">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer review */}
          {order.review && (
            <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Review</h3>
              <div className="flex items-center gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-lg ${s <= order.review.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
                ))}
                <span className="text-sm text-gray-500 ml-1">{order.review.rating}/5</span>
              </div>
              {order.review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed">{order.review.comment}</p>
              )}
            </div>
          )}
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
                role: "provider"
              }}
              readOnly={isTerminal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}