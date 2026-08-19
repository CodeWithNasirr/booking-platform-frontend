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
import { Button, EmptyState } from "@/components/ui";
import PortalBrandRoot from "@/app/tenant-site/components/portalBrand";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import { getPaymentState, makeFormatters } from "@/app/dashboard/orders/components/orderPresentation";
import {
  OrderStatusBadge, OrderStatusTimeline, OrderProgressCard,
  OrderTimelineFeed, OrderConversation,
} from "@/components/orders";
import { useRealtime } from "@/lib/realtime";
import { CallDock } from "@/components/collaboration";
import { applyOrderEnvelope } from "@/lib/realtimePatches";
import { uploadWithProgress } from "@/lib/uploadWithProgress";
import {
  ArrowLeft, Info, MessageSquare, Wallet, Truck, User, Package, Clock,
  Download, CheckCircle, XCircle, Star,
} from "lucide-react";

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

  // Auth lives in state (not just a ref) so the useRealtime effect
  // re-runs the moment we resolve a token. authRef mirrors it for
  // synchronous access from callbacks (upload/send).
  const authRef = useRef({ token: null, type: null });
  const [auth, setAuth] = useState({ token: null, type: null });

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
      const nextAuth = resolveToken(domain);
      authRef.current = nextAuth;
      setAuth(nextAuth);
      const auth = nextAuth;

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
      jwt: auth.type === "jwt" ? auth.token : null,
      orderToken: auth.type === "guest" ? auth.token : null,
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
  const [tab, setTab] = useState("chat"); // mobile: details | chat

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

  // ─── Pay now — hosted checkout redirect ───
  const handlePayNow = async () => {
    const { token, type } = authRef.current;
    try {
      setActionLoading("pay");
      // Return to this order page whether payment succeeds or the
      // customer bails; both gateways forward these on to their
      // success/cancel handlers.
      const here = typeof window !== "undefined" ? window.location.href : "";
      const data = await apiFetch(
        `${API_BASE}/api/v1/orders/${orderId}/pay/`,
        domain,
        token,
        type,
        {
          method: "POST",
          body: JSON.stringify({ success_url: here, cancel_url: here }),
        },
      );
      const url = data?.checkout?.checkout_url;
      if (url) {
        window.location.href = url;
        return;
      }
      // No URL returned — refresh so any state change lands, and
      // show the customer whatever the server persisted.
      await fetchOrder();
      setError("Payment gateway did not return a checkout URL.");
    } catch (err) {
      setError(err.data?.error || err.message || "Failed to start payment.");
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

  // ─── Branded chrome ──
  const Chrome = ({ children }) => (
    <>
      {headerSection.length > 0 && <LayoutRenderer sections={headerSection} site={site} />}
      <main className="min-h-screen bg-muted">{children}</main>
      {footerSection.length > 0 && <LayoutRenderer sections={footerSection} site={site} />}
    </>
  );

  if (loading) {
    return <Chrome><div className="flex justify-center py-24"><Spinner size="lg" /></div></Chrome>;
  }

  if (!order) {
    return (
      <Chrome>
        <PortalBrandRoot site={site} className="max-w-md mx-auto px-4 py-16">
          <EmptyState
            title={error || "Order not found"}
            hint="This order may have been removed or you no longer have access to it."
            action={<Button variant="primary" onClick={() => router.push(tenantRoutes.myOrders())}>Back to my orders</Button>}
          />
        </PortalBrandRoot>
      </Chrome>
    );
  }

  const isTerminal = ["completed", "cancelled", "refunded"].includes(order.status);
  const pay = getPaymentState(order, null);
  const { money } = makeFormatters(false, order.currency || "USD");
  const hide = (name) => (tab !== name ? "max-lg:hidden" : "");
  const deliverables = (order.files || []).filter((f) => (f.file_type || f.category) === "delivery");
  const primaryAction =
    order.status === "pending_payment" ? { label: actionLoading === "pay" ? "Starting…" : "Pay now", onClick: handlePayNow, busy: actionLoading === "pay" }
    : order.status === "delivered" ? { label: actionLoading === "accept" ? "Accepting…" : "Accept delivery", onClick: handleAcceptDelivery, busy: actionLoading === "accept" }
    : null;

  const Section = ({ icon: Icon, title, action, children }) => (
    <section className="rounded-xl border border-border bg-card p-4">
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">{title}</h3>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
  const Row = ({ label, children, tone }) => (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm text-end tabular-nums ${tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-foreground"}`}>{children}</span>
    </div>
  );

  return (
    <Chrome>
      <PortalBrandRoot site={site} className="max-w-5xl mx-auto px-4 py-6">
        <button onClick={() => router.push(tenantRoutes.myOrders())} className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to my orders
        </button>

        {/* Header */}
        <header className="rounded-xl border border-border bg-card p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{order.service_name || "Order"}</h1>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">#{order.order_number}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <OrderStatusBadge status={order.status} />
              <Badge variant={pay.tone}>{pay.label}</Badge>
            </div>
          </div>
        </header>

        {/* Mobile tabs */}
        <div className="lg:hidden mb-4">
          <Tabs value={tab} onChange={setTab} variant="segment" className="w-full" items={[
            { value: "details", label: "Details", icon: Info },
            { value: "chat", label: "Chat", icon: MessageSquare },
          ]} />
        </div>

        {/* Workspace */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6 lg:items-start">
          {/* LEFT — details */}
          <div className={`space-y-4 min-w-0 ${hide("details")}`}>
            {/* Progress */}
            <div className="rounded-xl border border-border bg-card p-4">
              <OrderStatusTimeline status={order.status} />
            </div>
            <OrderProgressCard
              order={order}
              viewer="customer"
              onAction={order.status === "pending_payment" ? handlePayNow : undefined}
              actionLoading={actionLoading === "pay"}
              providerName={order.provider_name}
              customerName={order.customer_name}
            />

            {/* Overview */}
            <Section icon={Package} title="Service details">
              <Row label="Amount">{money(order.total_amount)}</Row>
              <Row label="Delivery">{order.delivery_days ? `${order.delivery_days} days` : "—"}</Row>
              <Row label="Created">{new Date(order.created_at).toLocaleDateString()}</Row>
            </Section>

            {/* Provider */}
            {order.provider_name && (
              <Section icon={User} title="Provider">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                    {(order.provider_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <p className="text-sm font-medium text-foreground">{order.provider_name}</p>
                </div>
              </Section>
            )}

            {/* Pricing / payment */}
            <Section icon={Wallet} title="Pricing & payment">
              <Row label="Total">{money(order.total_amount)}</Row>
              {order.amount_paid != null && <Row label="Amount paid" tone="success">{money(order.amount_paid)}</Row>}
              {order.amount_remaining > 0 && <Row label="Remaining" tone="danger">{money(order.amount_remaining)}</Row>}
            </Section>

            {/* Delivery — deliverables + accept/revise */}
            {(deliverables.length > 0 || order.status === "delivered") && (
              <Section icon={Truck} title="Delivery">
                {deliverables.length > 0 && (
                  <ul className="space-y-2 mb-3">
                    {deliverables.map((file) => {
                      const name = file.file_name || file.original_filename || "File";
                      const kb = file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : "";
                      return (
                        <li key={file.id}>
                          <a href={file.download_url || file.file_url || file.file} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted transition-colors">
                            <span className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0"><Package className="w-4 h-4" /></span>
                            <span className="text-sm text-foreground truncate flex-1">{name}</span>
                            {kb && <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{kb}</span>}
                            <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {order.status === "delivered" && (
                  !showRevisionForm ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="success" onClick={handleAcceptDelivery} loading={actionLoading === "accept"} disabled={actionLoading !== null} className="flex-1" leftIcon={<CheckCircle className="w-4 h-4" />}>Accept delivery</Button>
                      <Button variant="secondary" onClick={() => setShowRevisionForm(true)} disabled={actionLoading !== null} className="flex-1">Request revision{order.can_request_revision === false && " (unavailable)"}</Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea value={revisionMessage} onChange={(e) => setRevisionMessage(e.target.value)} rows={3} placeholder="Describe what needs to be changed…" />
                      <div className="flex gap-2">
                        <Button variant="primary" onClick={handleRequestRevision} loading={actionLoading === "revision"} disabled={actionLoading !== null || !revisionMessage.trim()} className="flex-1">Submit revision request</Button>
                        <Button variant="ghost" onClick={() => { setShowRevisionForm(false); setRevisionMessage(""); }}>Cancel</Button>
                      </div>
                    </div>
                  )
                )}
              </Section>
            )}

            {/* Activity */}
            {(order.timeline_events || []).length > 0 && (
              <Section icon={Clock} title="Activity">
                <OrderTimelineFeed events={order.timeline_events || []} />
              </Section>
            )}

            {/* Review (read-only) */}
            {order.review && (
              <Section icon={Star} title="Your review">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (<Star key={s} className={`w-4 h-4 ${s <= order.review.rating ? "text-warning fill-warning" : "text-border"}`} />))}
                  <span className="text-sm text-muted-foreground ms-1">{order.review.rating}/5</span>
                </div>
                {order.review.comment && <p className="text-sm text-foreground">{order.review.comment}</p>}
              </Section>
            )}

            {/* Cancel */}
            {["paid", "accepted"].includes(order.status) && (
              <Button variant="secondary" onClick={handleCancel} loading={actionLoading === "cancel"} disabled={actionLoading !== null} className="w-full text-danger border-danger/30 hover:bg-danger-soft" leftIcon={<XCircle className="w-4 h-4" />}>
                Cancel order
              </Button>
            )}
          </div>

          {/* RIGHT — chat + call */}
          <div className={`space-y-3 ${hide("chat")}`}>
            <CallDock
              subjectType="order"
              subjectId={orderId}
              tenantId={order?.tenant || order?.tenant_id}
              authMode={auth.type === "guest" ? "guest" : "jwt"}
              jwt={auth.type === "jwt" ? auth.token : null}
              guestToken={auth.type === "guest" ? auth.token : null}
              selfName={order?.customer_name || "You"}
              canStart={!!(order.provider || order.provider_id) && ["accepted", "in_progress", "delivered", "revision_requested"].includes(order.status)}
            />
            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[68vh] lg:h-[72vh]">
              <div className="flex items-center gap-2 px-4 h-12 border-b border-border shrink-0">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground leading-tight">Messages</h2>
                  <p className="text-[11px] text-muted-foreground leading-tight">Chat with the team &amp; share files</p>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <OrderConversation
                  order={order}
                  viewer="customer"
                  fill
                  locked={isTerminal}
                  lockedMessage="This order is closed."
                  showComposer={!isTerminal}
                  onSendMessage={async (content) => {
                    await apiFetch(`${API_BASE}/api/v1/orders/${orderId}/messages/`, domain, authRef.current.token, authRef.current.type, { method: "POST", body: JSON.stringify({ content }) });
                  }}
                  onUploadFile={async (file, { onProgress, signal }) => {
                    const fd = new FormData();
                    fd.append("file", file);
                    fd.append("category", "delivery");
                    const headers = {};
                    if (domain) headers["X-Tenant"] = domain;
                    if (authRef.current.token) {
                      headers[authRef.current.type === "guest" ? "X-Order-Token" : "Authorization"] =
                        authRef.current.type === "guest" ? authRef.current.token : `Bearer ${authRef.current.token}`;
                    }
                    await uploadWithProgress(`${API_BASE}/api/v1/orders/${orderId}/upload_file/`, fd, { headers, onProgress, signal });
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sticky action bar (bottom action controls) */}
        {primaryAction && (
          <div className={`${tab === "chat" ? "hidden" : "flex"} lg:hidden fixed inset-x-0 bottom-0 z-30 items-center gap-2 border-t border-border bg-surface p-3`} style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
            <Button variant="primary" size="md" className="flex-1" onClick={primaryAction.onClick} loading={primaryAction.busy} disabled={actionLoading !== null}>{primaryAction.label}</Button>
          </div>
        )}
        {primaryAction && tab !== "chat" && <div className="h-20 lg:hidden" aria-hidden="true" />}
      </PortalBrandRoot>

      {/* Error toast */}
      {error && order && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-danger text-danger-foreground px-5 py-3 rounded-xl text-sm shadow-lg z-50 flex items-center gap-3">
          {error}
          <button onClick={() => setError(null)} className="font-bold hover:opacity-80" aria-label="Dismiss">×</button>
        </div>
      )}
    </Chrome>
  );
}
