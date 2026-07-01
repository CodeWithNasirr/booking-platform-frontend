// src/app/tenant-site/[domain]/my-orders/[orderId]/MyOrderDetailClient.js
"use client";

/**
 * MyOrderDetailClient — Single Order Detail Page
 *
 * Fetches a single order by ID and displays full detail view
 * with messages, files, status history, and actions.
 *
 * Route: /{domain}/my-orders/{orderId}
 *
 * Auth strategy (matches CustomerOrdersDashboard):
 *   1. Try customer_token (logged-in JWT) → Authorization: Bearer
 *   2. Try customer_order_token_{tenantId} (guest OTP) → X-Order-Token
 *   3. If neither exists or API returns 401/403 → redirect to /{domain}/my-orders
 *      (where CustomerOrdersDashboard handles email verification)
 *
 * NEVER redirects to /login — tenant sites use email-based access.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import LayoutRenderer from "../../LayoutRenderer";
import { tenantRoutes } from "@/lib/tenantRoutes";
import {
  BrandRoot, Card, PageHeader, Button, EmptyState,
} from "@/components/ui";
import {
  OrderStatusBadge, OrderStatusTimeline, OrderProgressCard,
  OrderTimelineFeed, OrderConversation,
} from "@/components/orders";
import { useRealtime } from "@/lib/realtime";
import { applyOrderEnvelope } from "@/lib/realtimePatches";
import { uploadWithProgress } from "@/lib/uploadWithProgress";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Token resolution ───

function resolveToken(domain) {
  // Priority 1: logged-in customer JWT
  const customerToken = localStorage.getItem("customer_token");
  if (customerToken) {
    return { token: customerToken, type: "jwt" };
  }

  // Priority 2: guest OTP token (keyed by domain since we don't have tenantId here)
  // Check both domain-keyed and tenantId-keyed variants
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith("customer_order_token_")) {
      const guestToken = localStorage.getItem(key);
      if (guestToken) {
        return { token: guestToken, type: "guest" };
      }
    }
  }

  return { token: null, type: null };
}

function buildHeaders(domain, token, tokenType) {
  const headers = { "Content-Type": "application/json" };
  if (domain) headers["X-Tenant"] = domain;

  if (token) {
    if (tokenType === "guest") {
      headers["X-Order-Token"] = token;
    } else {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function apiFetch(url, domain, token, tokenType, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include", 
    headers: {
      ...buildHeaders(domain, token, tokenType),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = new Error(`${res.status}`);
    err.status = res.status;
    try { err.data = await res.json(); } catch {}
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================

export default function MyOrderDetailClient({ domain, orderId,site,header,footer}) {
  const router = useRouter();
  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  const [order, setOrder] = useState(null);
  // console.log(order,"customer")
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Store resolved auth for reuse across API calls
  const authRef = useRef({ token: null, type: null });

  // ─── Auth Fetch Adapter for OrderChatPanel ───
  const authFetch = useCallback(
    async (path, tenantId, options = {}) => {
      const { token, type } = authRef.current;

      return apiFetch(
        `${API_BASE}${path}`,
        domain,
        token,
        type,
        options
      );
    },
    [domain]
  );

  // ─── Fetch Order Detail ───
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Resolve token (JWT or guest OTP)
      const auth = resolveToken(domain);
      authRef.current = auth;

      if (!auth.token) {
        // No token at all → go to my-orders where email verification runs
        router.push(tenantRoutes.myOrders());
        return;
      }

      const data = await apiFetch(
        `${API_BASE}/api/v1/orders/${orderId}/public-detail`,
        domain,
        auth.token,
        auth.type
      );

      setOrder(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        // Token invalid/expired → go back to my-orders for re-verification
        // Do NOT redirect to /login — tenant sites use email-based access
        router.push(tenantRoutes.myOrders());
        return;
      }

      if (err.status === 404) {
        setError("Order not found.");
        return;
      }

      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [domain, orderId, router]);

  useEffect(() => {
    if (domain && orderId) {
      fetchOrder();
    }
  }, [fetchOrder, domain, orderId]);

  // ─── Realtime — patch order in-place from order:<id> topic ───
  useRealtime({
    topics: orderId ? [`order:${orderId}`] : [],
    auth: {
      jwt: authRef.current.type === "jwt" ? authRef.current.token : null,
      requestToken: authRef.current.type === "guest" ? authRef.current.token : null,
    },
    onEvent: (envelope) => {
      setOrder((prev) => applyOrderEnvelope(prev, envelope));
    },
    onReconnect: () => { fetchOrder(); },
  });

  // ─── Accept Delivery ───
  const handleAcceptDelivery = async () => {
    const { token, type } = authRef.current;

    try {
      setActionLoading("accept");

      await apiFetch(
        `${API_BASE}/api/v1/orders/${orderId}/accept_delivery/`,
        domain,
        token,
        type,
        { method: "POST" }
      );

      await fetchOrder();
    } catch (err) {
      setError(err.data?.error || "Failed to accept delivery.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Request Revision ───
  const [revisionMessage, setRevisionMessage] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const handleRequestRevision = async () => {
    if (!revisionMessage.trim()) return;
    const { token, type } = authRef.current;

    try {
      setActionLoading("revision");

      await apiFetch(
        `${API_BASE}/api/v1/orders/${orderId}/request_revision/`,
        domain,
        token,
        type,
        {
          method: "POST",
          body: JSON.stringify({ message: revisionMessage }),
        }
      );

      setRevisionMessage("");
      setShowRevisionForm(false);
      await fetchOrder();
    } catch (err) {
      setError(err.data?.error || "Failed to request revision.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Cancel Order ───
  const handleCancel = async () => {
    const { token, type } = authRef.current;

    try {
      setActionLoading("cancel");

      await apiFetch(
        `${API_BASE}/api/v1/orders/${orderId}/cancel/`,
        domain,
        token,
        type,
        {
          method: "POST",
          body: JSON.stringify({ reason: "Customer requested cancellation" }),
        }
      );

      await fetchOrder();
    } catch (err) {
      setError(err.data?.error || "Failed to cancel order.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ─── Error / Not Found ───
  if (error || !order) {
    return (
      <BrandRoot>
        <div className="max-w-4xl mx-auto px-4 py-16">
          <EmptyState
            title={error || "Order not found"}
            hint="This order may have been removed or you no longer have access to it."
            action={
              <Button variant="secondary" onClick={() => router.push(tenantRoutes.myOrders())}>
                Back to My Orders
              </Button>
            }
          />
        </div>
      </BrandRoot>
    );
  }

  const isTerminal = ["completed", "cancelled", "refunded"].includes(order.status);

  return (
  <BrandRoot>
   {headerSection.length > 0 && (
    <LayoutRenderer sections={headerSection} site={site} />
   )}

   <main className="min-h-screen bg-gray-50">

    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <button
        onClick={() => router.push(tenantRoutes.myOrders())}
        aria-label="Back to My Orders"
        className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1.5 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to My Orders
      </button>

      {/* Status Timeline — visual lifecycle at a glance */}
      <div className="mb-6">
        <OrderStatusTimeline status={order.status} />
      </div>

      {/* Progress hero — status-aware "what happens next" copy */}
      <OrderProgressCard
        order={order}
        viewer="customer"
        providerName={order.provider_name}
        customerName={order.customer_name}
        className="mb-6"
      />

      {/* Order Header */}
      <Card padding="lg" className="mb-6">
        <PageHeader
          title={order.service_name || "Order"}
          subtitle={<span className="font-mono text-gray-400">#{order.order_number}</span>}
          actions={<OrderStatusBadge status={order.status} />}
        />

        <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400 text-xs uppercase">Amount</span>
            <p className="font-semibold text-gray-800">
              {order.currency || "USD"} {order.total_amount}
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-xs uppercase">Delivery</span>
            <p className="font-semibold text-gray-800">
              {order.delivery_days ? `${order.delivery_days} days` : "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-xs uppercase">Created</span>
            <p className="font-semibold text-gray-800">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          {order.provider_name && (
            <div>
              <span className="text-gray-400 text-xs uppercase">Provider</span>
              <p className="font-semibold text-gray-800">{order.provider_name}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Delivery actions — accept or revise the delivery */}
      {order.status === "delivered" && (
        <Card padding="lg" className="mb-6 !bg-emerald-50 !border-emerald-200">
          <h3 className="font-bold text-emerald-800 mb-2">Your order has been delivered</h3>
          <p className="text-sm text-emerald-700 mb-4">
            Review the deliverables and accept, or request changes.
          </p>

          {!showRevisionForm ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleAcceptDelivery}
                loading={actionLoading === "accept"}
                disabled={actionLoading !== null}
                className="flex-1 !bg-emerald-600 hover:!bg-emerald-700"
              >
                Accept delivery
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowRevisionForm(true)}
                disabled={actionLoading !== null}
                className="flex-1"
              >
                Request revision
                {order.can_request_revision === false && " (unavailable)"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <label htmlFor="order-revision-msg" className="sr-only">Revision notes</label>
              <textarea
                id="order-revision-msg"
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                placeholder="Describe what needs to be changed…"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary,#3B82F6)]/30"
              />
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleRequestRevision}
                  loading={actionLoading === "revision"}
                  disabled={actionLoading !== null || !revisionMessage.trim()}
                  className="flex-1"
                >
                  Submit revision request
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowRevisionForm(false); setRevisionMessage(""); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Cancel button */}
      {["paid", "accepted"].includes(order.status) && (
        <div className="mb-6">
          <button
            onClick={handleCancel}
            disabled={actionLoading !== null}
            className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50 text-sm"
          >
            {actionLoading === "cancel" ? "Cancelling..." : "Cancel Order"}
          </button>
        </div>
      )}

      {/* Delivery files */}
      {order.files?.filter((f) => (f.file_type || f.category) === "delivery").length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Deliverables</h2>
          <div className="space-y-2">
            {order.files
              .filter((f) => (f.file_type || f.category) === "delivery")
              .map((file) => (
                <a
                  key={file.id}
                  href={file.download_url || file.file_url || file.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {file.file_name || file.original_filename || "File"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ""}
                    </p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium shrink-0">Download</span>
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Timeline — chronological lifecycle feed */}
      {(order.timeline_events || []).length > 0 && (
        <Card padding="lg" className="mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Activity</h2>
          <OrderTimelineFeed events={order.timeline_events || []} />
        </Card>
      )}

      {/* Conversation — feed + composer + upload queue tray */}
      <Card padding="none" className="mb-6 overflow-hidden">
        <div className="p-4 sm:p-5">
          <OrderConversation
            order={order}
            viewer="customer"
            locked={isTerminal}
            lockedMessage="This order is closed."
            showComposer={!isTerminal}
            onSendMessage={async (content) => {
              await apiFetch(
                `${API_BASE}/api/v1/orders/${orderId}/messages/`,
                domain,
                authRef.current.token,
                authRef.current.type,
                { method: "POST", body: JSON.stringify({ content }) },
              );
            }}
            onUploadFile={async (file, { onProgress, signal }) => {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("category", "delivery");
              const headers = {};
              if (domain) headers["X-Tenant"] = domain;
              if (authRef.current.token) {
                headers[authRef.current.type === "guest" ? "X-Order-Token" : "Authorization"] =
                  authRef.current.type === "guest"
                    ? authRef.current.token
                    : `Bearer ${authRef.current.token}`;
              }
              await uploadWithProgress(
                `${API_BASE}/api/v1/orders/${orderId}/upload_file/`,
                fd,
                { headers, onProgress, signal },
              );
            }}
          />
        </div>
      </Card>

      {/* Review */}
      {order.review && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
          <h2 className="font-bold text-gray-900 mb-2">Your Review</h2>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`text-lg ${s <= order.review.rating ? "text-amber-400" : "text-gray-200"}`}>★</span>
            ))}
            <span className="text-sm text-gray-500 ml-1">{order.review.rating}/5</span>
          </div>
          {order.review.comment && (
            <p className="text-sm text-gray-600">{order.review.comment}</p>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-5 py-3 rounded-xl text-sm shadow-lg z-50 flex items-center gap-3">
          {error}
          <button onClick={() => setError(null)} className="font-bold hover:opacity-80">×</button>
        </div>
      )}
    </div>
    

   </main>

   {/* {footerSection.length > 0 && (
    <LayoutRenderer sections={footerSection} site={site} />
   )} */}
  </BrandRoot>
  );
}