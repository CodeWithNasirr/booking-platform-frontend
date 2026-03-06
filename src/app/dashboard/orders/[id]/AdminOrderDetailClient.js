// src/app/dashboard/orders/[id]/AdminOrderDetailClient.js
"use client";

/**
 * AdminOrderDetailClient — Dashboard Order Detail View
 *
 * Step 8: Full admin order detail with:
 * - router.push() for back navigation (no window.location.href)
 * - All admin actions: update status, cancel, complete
 * - Message thread display
 * - File list display
 * - Status history timeline
 * - Uses existing GET /api/v1/orders/{id}/ endpoint
 * - Uses existing POST endpoints for actions
 */

import { authFetch } from "../lib/api";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";


// ─── Status config ───

const STATUS_CONFIG = {
  pending_payment: { label: "Pending Payment", color: "bg-yellow-100 text-yellow-800" },
  paid:            { label: "Paid",            color: "bg-blue-100 text-blue-800" },
  in_progress:     { label: "In Progress",     color: "bg-purple-100 text-purple-800" },
  delivered:       { label: "Delivered",        color: "bg-teal-100 text-teal-800" },
  completed:       { label: "Completed",        color: "bg-green-100 text-green-800" },
  cancelled:       { label: "Cancelled",        color: "bg-red-100 text-red-800" },
  refunded:        { label: "Refunded",         color: "bg-gray-100 text-gray-800" },
};

// Admin-allowed transitions per status
const ADMIN_TRANSITIONS = {
  pending_payment: [],
  paid:            ["in_progress", "cancelled"],
  in_progress:     ["delivered", "cancelled"],
  delivered:       ["completed", "in_progress"],
  completed:       [],
  cancelled:       [],
  refunded:        [],
};

const TRANSITION_LABELS = {
  in_progress: "Start Work",
  delivered:   "Mark Delivered",
  completed:   "Complete Order",
  cancelled:   "Cancel Order",
};

export default function AdminOrderDetailClient({ orderId }) {
  const router = useRouter();
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // ─── Fetch order detail ───
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tenantId) {
        router.push("/auth/login");
        return;
      }

      const data = await authFetch(
        `/api/v1/orders/${orderId}/`,
        tenantId
      );

      setOrder(data);
    } catch (err) {
      if (err.status === 401) {
        router.push("/auth/login");
        return;
      }

      if (err.status === 404) {
        setError("Order not found.");
        return;
      }

      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId, tenantId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ─── Update status ───
  const handleStatusUpdate = async (newStatus) => {
    try {
      setActionLoading(newStatus);

      await authFetch(
        `/api/v1/orders/${orderId}/update-status/`,
        tenantId,
        {
          method: "POST",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      await fetchOrder();
    } catch (err) {
      alert(err.message || "Failed to update status.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Cancel order ───
  const handleCancel = async () => {
    try {
      setActionLoading("cancel");

      await authFetch(
        `/api/v1/orders/${orderId}/cancel/`,
        tenantId,
        {
          method: "POST",
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      setShowCancelModal(false);
      setCancelReason("");
      await fetchOrder();
    } catch (err) {
      alert(err.message || "Failed to cancel.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Complete order ───
    const handleComplete = async () => {
    try {
      setActionLoading("complete");

      await authFetch(
        `/api/v1/orders/${orderId}/complete/`,
        tenantId,
        {
          method: "POST",
        }
      );

      await fetchOrder();
    } catch (err) {
      alert(err.message || "Failed to complete.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Send message ───
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      setSendingMessage(true);

      await authFetch(
        `/api/v1/orders/${orderId}/add-message/`,
        tenantId,
        {
          method: "POST",
          body: JSON.stringify({ content: messageText.trim() }),
        }
      );

      setMessageText("");
      await fetchOrder();
    } catch (err) {
      alert(err.message || "Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={fetchOrder} className="text-blue-600 hover:underline text-sm">
            Try again
          </button>
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="text-gray-500 hover:underline text-sm"
          >
            Back to orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const sc = STATUS_CONFIG[order.status] || {};
  const transitions = ADMIN_TRANSITIONS[order.status] || [];
  const nonCancelTransitions = transitions.filter((s) => s !== "cancelled");

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Back button — router.push, NOT window.location.href */}
      <button
        onClick={() => router.push("/dashboard/orders")}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        ← Back to orders
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.service_name || "Order"}</h1>
          <p className="text-sm text-gray-500 mt-1">#{order.order_number}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${sc.color}`}>
          {sc.label || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Main column ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Admin actions */}
          {(nonCancelTransitions.length > 0 || transitions.includes("cancelled")) && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Actions</h3>
              <div className="flex flex-wrap gap-2">
                {/* Status transitions */}
                {nonCancelTransitions.map((nextStatus) => {
                  const isComplete = nextStatus === "completed";
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => isComplete ? handleComplete() : handleStatusUpdate(nextStatus)}
                      disabled={actionLoading !== null}
                      className={`px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-50 ${
                        isComplete
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {actionLoading === nextStatus || actionLoading === "complete"
                        ? "..."
                        : TRANSITION_LABELS[nextStatus] || nextStatus}
                    </button>
                  );
                })}

                {/* Cancel button */}
                {transitions.includes("cancelled") && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 text-sm rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Messages ({order.messages?.length || 0})
            </h3>

            {order.messages?.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                {order.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg text-sm ${
                      msg.is_system_message
                        ? "bg-gray-50 text-gray-500 italic"
                        : "bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-xs">
                        {msg.sender_name || "System"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p>{msg.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">No messages yet.</p>
            )}

            {/* Send message */}
            {!["cancelled", "refunded", "completed"].includes(order.status) && (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Send a message..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !messageText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingMessage ? "..." : "Send"}
                </button>
              </form>
            )}
          </div>

          {/* Files */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Files ({order.files?.length || 0})
            </h3>
            {order.files?.length > 0 ? (
              <div className="space-y-2">
                {order.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <span className="font-medium">{file.file_name || file.original_filename || "File"}</span>
                      <span className="text-xs text-gray-400 ml-2">{file.uploaded_by_name || ""}</span>
                    </div>
                    {file.file_url && (
                      <a
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No files uploaded.</p>
            )}
          </div>

          {/* Status history */}
          {order.status_history?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Status History</h3>
              <div className="space-y-3">
                {order.status_history.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                    <div>
                      <div>
                        <span className="font-medium">{entry.from_status || "—"}</span>
                        {" → "}
                        <span className="font-medium">{entry.to_status}</span>
                      </div>
                      {entry.note && <p className="text-gray-500 text-xs mt-0.5">{entry.note}</p>}
                      <p className="text-gray-400 text-xs">
                        {entry.changed_by_name || "System"} · {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review */}
          {order.review && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Customer Review</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-yellow-500 text-lg">
                  {"★".repeat(order.review.rating)}
                  {"☆".repeat(5 - order.review.rating)}
                </span>
                <span className="text-sm font-medium">{order.review.rating}/5</span>
              </div>
              {order.review.comment && (
                <p className="text-sm text-gray-600">{order.review.comment}</p>
              )}
            </div>
          )}
        </div>

        {/* ─── Sidebar ─── */}
        <div className="space-y-6">
          {/* Order info card */}
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Order Details</h3>

            <InfoRow label="Amount" value={`${order.currency || "USD"} ${parseFloat(order.total_amount || 0).toFixed(2)}`} />
            <InfoRow label="Paid" value={`${order.currency || "USD"} ${parseFloat(order.amount_paid || 0).toFixed(2)}`} />
            <InfoRow label="Delivery" value={order.delivery_days ? `${order.delivery_days} days` : "—"} />
            <InfoRow label="Revisions" value={`${order.revisions_used || 0} / ${order.revisions_allowed || 0}`} />

            {order.created_at && (
              <InfoRow label="Created" value={new Date(order.created_at).toLocaleDateString()} />
            )}
            {order.delivered_at && (
              <InfoRow label="Delivered" value={new Date(order.delivered_at).toLocaleDateString()} />
            )}
            {order.completed_at && (
              <InfoRow label="Completed" value={new Date(order.completed_at).toLocaleDateString()} />
            )}
            {order.cancelled_at && (
              <>
                <InfoRow label="Cancelled" value={new Date(order.cancelled_at).toLocaleDateString()} />
                {order.cancelled_reason && (
                  <InfoRow label="Reason" value={order.cancelled_reason} />
                )}
              </>
            )}

            {order.stripe_payment_intent_id && (
              <InfoRow label="Stripe PI" value={order.stripe_payment_intent_id} mono />
            )}
          </div>

          {/* Customer card */}
          <div className="bg-white rounded-lg shadow p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Customer</h3>
            <p className="text-sm font-medium">{order.customer_name || "—"}</p>
            <p className="text-sm text-gray-500">{order.customer_email || "—"}</p>
            {order.customer_phone && (
              <p className="text-sm text-gray-500">{order.customer_phone}</p>
            )}
          </div>

          {/* Provider card */}
          <div className="bg-white rounded-lg shadow p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Provider</h3>
            <p className="text-sm font-medium">{order.provider_name || "Unassigned"}</p>
            {order.provider_email && (
              <p className="text-sm text-gray-500">{order.provider_email}</p>
            )}
          </div>

          {/* Requirements */}
          {order.requirements && Object.keys(order.requirements).length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Requirements</h3>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-48">
                {JSON.stringify(order.requirements, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2">Cancel Order</h3>
            <p className="text-sm text-gray-500 mb-4">
              This action cannot be undone. The customer will be notified.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading === "cancel"}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === "cancel" ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper component ───

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}