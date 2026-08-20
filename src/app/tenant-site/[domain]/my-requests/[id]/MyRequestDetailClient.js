"use client";

/**
 * MyRequestDetailClient — customer portal, single custom request.
 *
 * Rebuilt (Phase 9) to share the visual language of the customer
 * Booking and Order detail pages:
 *
 *   - Branded chrome via <PortalBrandRoot> (tenant accent flows into
 *     the Phase-1 semantic tokens) on a bg-muted canvas.
 *   - Desktop: two-column workspace — request information / progress /
 *     attachments / activity on the left, the CONVERSATION pinned as a
 *     tall right rail (the primary interaction).
 *   - Mobile: Details | Chat segmented tabs; Chat is a full-screen
 *     conversation with a sticky composer and no horizontal overflow.
 *   - Realtime, optimistic messaging, quote actions and uploads are
 *     UNCHANGED — only the presentation was rebuilt.
 *
 * Auth (UNCHANGED): cookie JWT → Authorization: Bearer; magic-link
 * (?t=) → access-via-token → guest X-Request-Token; stored guest token;
 * else prompt to sign in.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RefreshCw, MessageCircle, Inbox, Info, FileText,
  Paperclip, Clock, Wallet, CalendarClock,
} from "lucide-react";

import LayoutRenderer from "../../LayoutRenderer";
import { useTenantLang } from "../../../contexts/TenantLangContext";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { useRealtime } from "@/lib/realtime";
import { applyRequestEnvelope, applyOrderEnvelope } from "@/lib/realtimePatches";
import {
  ConversationFeed,
  QuoteCard,
  AttachmentGrid,
  StickyComposer,
  StatusTimeline,
  StatusBadge,
  RequestDetailSkeleton,
  PostAcceptanceCard,
  UploadQueueTray,
  useUploadQueue,
  TERMINAL_STATUSES,
  TIMELINE_LABELS,
} from "@/components/custom-requests";
import { uploadWithProgress } from "@/lib/uploadWithProgress";
import { Button, EmptyState } from "@/components/ui";
import PortalBrandRoot, { getTenantBrand } from "@/app/tenant-site/components/portalBrand";
import Tabs from "@/components/ui/Tabs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Once a request leaves the negotiation phase the QuoteCard
// stops being the relevant CTA — PostAcceptanceCard takes over.
const POST_ACCEPTANCE_STATUSES = new Set([
  "converted", "completed", "rejected", "cancelled",
]);

function readCookieToken() {
  if (typeof document === "undefined") return null;
  return document.cookie.match(/access_token=([^;]+)/)?.[1] || null;
}

function tokenHeaders(tenantRef, token, isGuest) {
  const h = { "Content-Type": "application/json" };
  if (tenantRef) h["X-Tenant"] = tenantRef;
  if (token) {
    if (isGuest) h["X-Request-Token"] = token;
    else h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

async function apiJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, credentials: "include" });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(data.error || data.detail || `${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export default function MyRequestDetailClient({ domain, requestId, site, header, footer }) {
  return (
    <CustomerPortalDetail
      domain={domain}
      requestId={requestId}
      site={site}
      header={header}
      footer={footer}
    />
  );
}

function CustomerPortalDetail({ domain, requestId, site, header, footer }) {
  const { isRTL } = useTenantLang();
  const brand = getTenantBrand(site);
  const searchParams = useSearchParams();

  const tenantId = site?.tenant_id;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isGuestToken, setIsGuestToken] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [tab, setTab] = useState("chat"); // mobile: details | chat (conversation is primary)
  // Optimistic outbound queue — bubbles render immediately as
  // "Sending…" and clear when realtime patches the persisted
  // message into request.messages.
  const [pendingMessages, setPendingMessages] = useState([]);
  // Order summary fetched once when the request enters a
  // post-acceptance state.
  const [order, setOrder] = useState(null);

  // ── Auth resolution ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cookieToken = readCookieToken();
      if (cookieToken) {
        if (!cancelled) {
          setAuthToken(cookieToken);
          setIsGuestToken(false);
        }
        return;
      }

      const magic = searchParams?.get("t");
      if (magic && tenantId) {
        try {
          const result = await apiJson(`${API_BASE}/api/v1/custom-requests/access-via-token/`, {
            method: "POST",
            headers: tokenHeaders(tenantId || domain),
            body: JSON.stringify({ token: magic }),
          });
          if (cancelled) return;
          setAuthToken(result.token);
          setIsGuestToken(true);
          try {
            localStorage.setItem(`customer_request_token_${tenantId}`, result.token);
            if (result.email) {
              localStorage.setItem(`customer_request_email_${tenantId}`, result.email);
            }
            const url = new URL(window.location.href);
            url.searchParams.delete("t");
            window.history.replaceState({}, "", url.toString());
          } catch {}
          return;
        } catch {}
      }

      try {
        const stored = tenantId && localStorage.getItem(`customer_request_token_${tenantId}`);
        if (stored) {
          if (!cancelled) {
            setAuthToken(stored);
            setIsGuestToken(true);
          }
          return;
        }
      } catch {}

      if (!cancelled) setNeedsAuth(true);
    })();
    return () => { cancelled = true; };
  }, [domain, tenantId, searchParams]);

  // ── Data fetch ──────────────────────────────────────────────────
  const fetchRequest = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const data = await apiJson(
        `${API_BASE}/api/v1/custom-requests/${requestId}/`,
        { headers: tokenHeaders(tenantId || domain, authToken, isGuestToken) },
      );
      setRequest(data);
      setError(null);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setNeedsAuth(true);
        setAuthToken(null);
      } else if (err.status === 404) {
        setError("We couldn't find this request.");
      } else {
        setError("Something went wrong loading your request.");
      }
    } finally {
      setLoading(false);
    }
  }, [authToken, isGuestToken, tenantId, domain, requestId]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  // ── Order summary (post-acceptance) ─────────────────────────────
  const fetchOrderSummary = useCallback(async () => {
    const orderId = request?.converted_order;
    const inScope = ["converted", "completed"].includes(request?.status);
    if (!orderId || !inScope || !authToken) {
      setOrder(null);
      return;
    }
    try {
      const data = await apiJson(
        `${API_BASE}/api/v1/orders/${orderId}/`,
        { headers: tokenHeaders(tenantId || domain, authToken, isGuestToken) },
      );
      setOrder(data);
    } catch {
      setOrder(null);
    }
  }, [request?.converted_order, request?.status, authToken, isGuestToken, tenantId, domain]);

  useEffect(() => { fetchOrderSummary(); }, [fetchOrderSummary]);

  // ── Realtime ────────────────────────────────────────────────────
  const orderTopicId = request?.converted_order;
  const realtimeTopics = useMemo(() => {
    const topics = requestId ? [`custom_request:${requestId}`] : [];
    if (orderTopicId) topics.push(`order:${orderTopicId}`);
    return topics;
  }, [requestId, orderTopicId]);

  useRealtime({
    topics: realtimeTopics,
    auth: {
      jwt: !isGuestToken ? authToken : null,
      requestToken: isGuestToken ? authToken : null,
    },
    onEvent: (envelope) => {
      if (!envelope?.entity_type) return;
      if (envelope.entity_type.startsWith("custom_request.")) {
        setRequest((prev) => (prev ? applyRequestEnvelope(prev, envelope) : prev));
        return;
      }
      if (envelope.entity_type.startsWith("order.")) {
        setOrder((prev) => applyOrderEnvelope(prev, envelope));
      }
    },
    onReconnect: () => {
      fetchRequest();
      if (orderTopicId) fetchOrderSummary();
    },
  });

  // ── Derived ─────────────────────────────────────────────────────
  const activeQuote = useMemo(() => {
    if (!request?.quotes) return null;
    return request.quotes.find((q) => q.status === "pending" || q.status === "countered")
      || request.quotes[0]
      || null;
  }, [request]);

  const isLocked = TERMINAL_STATUSES.has(request?.status);
  const businessName = brand.name || site?.tenant?.name || "";
  const tenantLogo = brand.logo || site?.tenant?.logo;

  // ── Actions ─────────────────────────────────────────────────────
  async function handleSend() {
    const body = reply.trim();
    if (!body || sending) return;
    const optimistic = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      body,
      at: new Date().toISOString(),
      author_role: "customer",
      author_name: "You",
    };
    setPendingMessages((q) => [...q, optimistic]);
    setReply("");
    setSending(true);
    try {
      await apiJson(
        `${API_BASE}/api/v1/custom-requests/${requestId}/messages/`,
        {
          method: "POST",
          headers: tokenHeaders(tenantId || domain, authToken, isGuestToken),
          body: JSON.stringify({ body, kind: "message" }),
        },
      );
    } catch (err) {
      setPendingMessages((q) => q.filter((m) => m.id !== optimistic.id));
      setReply(body);
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  // Reconcile: when the realtime feed grows to include a message
  // matching a pending entry's body within the last minute, drop
  // the optimistic placeholder.
  useEffect(() => {
    if (pendingMessages.length === 0 || !request?.messages?.length) return;
    const now = Date.now();
    const stillPending = pendingMessages.filter((p) => {
      const match = request.messages.find((m) =>
        (m.author_role === "customer" || !m.author_role)
        && (m.body || "").trim() === p.body.trim()
        && now - new Date(m.created_at).getTime() < 5 * 60 * 1000,
      );
      return !match;
    });
    if (stillPending.length !== pendingMessages.length) {
      setPendingMessages(stillPending);
    }
  }, [pendingMessages, request?.messages]);

  async function quoteAction(actionPath, quoteId, extra = {}) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await apiJson(
        `${API_BASE}/api/v1/custom-requests/${requestId}/${actionPath}/`,
        {
          method: "POST",
          headers: tokenHeaders(tenantId || domain, authToken, isGuestToken),
          body: JSON.stringify({ quote_id: quoteId, ...extra }),
        },
      );
    } catch (err) {
      alert(err.message || "Action failed");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCounter(quoteId) {
    const note = window.prompt("What change are you asking for?");
    if (note === null) return;
    await quoteAction("counter_request", quoteId, { note });
  }

  // Upload queue — real per-file progress, cancel, retry.
  const uploadOne = useCallback(async (file, { onProgress, signal }) => {
    const form = new FormData();
    form.append("file", file);
    form.append("file_type", "attachment");
    const headers = tokenHeaders(tenantId || domain, authToken, isGuestToken);
    delete headers["Content-Type"]; // FormData sets its own boundary
    return uploadWithProgress(
      `${API_BASE}/api/v1/custom-requests/${requestId}/upload_file/`,
      form,
      { headers, onProgress, signal },
    );
  }, [tenantId, domain, authToken, isGuestToken, requestId]);

  const {
    queue: uploadQueue, busy: uploading,
    enqueue: enqueueUploads,
    cancel: cancelUpload, retry: retryUpload,
    dismiss: dismissUpload, clearDone: clearDoneUploads,
  } = useUploadQueue({ upload: uploadOne });

  function uploadFiles(files) {
    if (isLocked) return;
    enqueueUploads(files);
  }

  // ── Render ──────────────────────────────────────────────────────
  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  const Chrome = ({ children }) => (
    <>
      {headerSection.length > 0 && <LayoutRenderer sections={headerSection} site={site} />}
      <main className={`min-h-screen bg-muted ${isRTL ? "rtl" : ""}`} dir={isRTL ? "rtl" : undefined}>
        {children}
      </main>
      {footerSection.length > 0 && <LayoutRenderer sections={footerSection} site={site} />}
    </>
  );

  if (needsAuth) {
    return (
      <Chrome>
        <PortalBrandRoot site={site} className="max-w-md mx-auto px-4 py-16">
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-3"><Inbox className="w-6 h-6" /></div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Sign in to view this request</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Use the verification link in your email, or go to your dashboard to enter a code.
            </p>
            <Link href={tenantRoutes.myRequests()} className="inline-flex items-center justify-center h-11 px-6 rounded-xl font-medium bg-primary text-primary-foreground hover:brightness-110 transition">
              Go to My Requests
            </Link>
          </div>
        </PortalBrandRoot>
      </Chrome>
    );
  }

  if (loading && !request) {
    return (
      <Chrome>
        <PortalBrandRoot site={site} className="max-w-5xl mx-auto px-4 py-6">
          <RequestDetailSkeleton />
        </PortalBrandRoot>
      </Chrome>
    );
  }

  if (error && !request) {
    return (
      <Chrome>
        <PortalBrandRoot site={site} className="max-w-md mx-auto px-4 py-16">
          <EmptyState
            icon={Inbox}
            title="We couldn't load this request"
            hint={error}
            action={(
              <Button variant="primary" onClick={fetchRequest} leftIcon={<RefreshCw className="w-4 h-4" />}>Try again</Button>
            )}
            className="bg-card rounded-2xl border border-border shadow-sm"
          />
        </PortalBrandRoot>
      </Chrome>
    );
  }

  const hide = (name) => (tab !== name ? "max-lg:hidden" : "");
  const conversationEmpty =
    request.messages?.length === 0 && request.timeline?.length <= 1 && pendingMessages.length === 0;
  const activityEvents = (request.timeline || []).filter((ev) => TIMELINE_LABELS[ev.event] !== null);

  return (
    <Chrome>
      <PortalBrandRoot site={site} className="max-w-5xl mx-auto px-4 py-6">
        {/* Back + brand */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link href={tenantRoutes.myRequests()} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
            <span className="hidden sm:inline">Back to my requests</span>
            <span className="sm:hidden">Back</span>
          </Link>
          {(tenantLogo || businessName) && (
            <div className="flex items-center gap-2 text-sm text-foreground min-w-0">
              {tenantLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenantLogo} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
              )}
              {businessName && <span className="font-semibold truncate">{businessName}</span>}
            </div>
          )}
        </div>

        {/* Header card */}
        <header className="rounded-xl border border-border bg-card p-4 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{request.title}</h1>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">#{request.request_number}</p>
            </div>
            <div className="shrink-0"><StatusBadge status={request.status} /></div>
          </div>
        </header>

        {/* Mobile tabs */}
        <div className="lg:hidden mb-4">
          <Tabs value={tab} onChange={setTab} variant="segment" className="w-full" items={[
            { value: "details", label: "Details", icon: Info },
            { value: "chat", label: "Conversation", icon: MessageCircle },
          ]} />
        </div>

        {/* Workspace */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6 lg:items-start">
          {/* LEFT — request details */}
          <div className={`space-y-4 min-w-0 ${hide("details")}`}>
            {/* Progress */}
            <Section icon={Clock} title="Status & progress">
              <StatusTimeline status={request.status} />
            </Section>

            {/* Quote hero (only while negotiating) */}
            {!POST_ACCEPTANCE_STATUSES.has(request.status) && activeQuote && (
              <QuoteCard
                quote={activeQuote}
                canAccept canReject canCounter
                disabled={isLocked || actionBusy}
                onAccept={() => quoteAction("accept_quote", activeQuote.id)}
                onReject={() => quoteAction("reject_quote", activeQuote.id)}
                onCounter={() => handleCounter(activeQuote.id)}
              />
            )}

            {/* Post-acceptance actions (pay / track / review / wrap up) */}
            <PostAcceptanceCard
              request={request}
              order={order}
              orderHref={request.converted_order ? tenantRoutes.myOrder(request.converted_order) : null}
              providerName={request.provider_name || businessName}
            />

            {/* Request information */}
            <Section icon={FileText} title="Request information">
              {request.description && (
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{request.description}</p>
              )}
              {(request.budget_min || request.budget_max || request.deadline) && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {(request.budget_min || request.budget_max) && (
                    <Field icon={Wallet} label="Budget">
                      {request.budget_min || ""}
                      {request.budget_min && request.budget_max && " – "}
                      {request.budget_max || ""}
                    </Field>
                  )}
                  {request.deadline && (
                    <Field icon={CalendarClock} label="Deadline">{request.deadline}</Field>
                  )}
                </div>
              )}
            </Section>

            {/* Attachments */}
            {(request.files?.length > 0 || uploadQueue.length > 0) && (
              <Section icon={Paperclip} title="Attachments">
                {request.files?.length > 0 && <AttachmentGrid files={request.files} />}
                {uploadQueue.length > 0 && (
                  <UploadQueueTray
                    queue={uploadQueue}
                    onCancel={cancelUpload}
                    onRetry={retryUpload}
                    onDismiss={dismissUpload}
                    onClearDone={clearDoneUploads}
                    className={request.files?.length > 0 ? "mt-3" : ""}
                  />
                )}
              </Section>
            )}

            {/* Activity timeline */}
            {activityEvents.length > 0 && (
              <Section icon={Clock} title="Activity">
                <ActivityTimeline events={activityEvents} />
              </Section>
            )}
          </div>

          {/* RIGHT — conversation (primary interaction) */}
          <div className={`${hide("chat")}`}>
            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[68vh] lg:h-[72vh]">
              <div className="flex items-center gap-2 px-4 h-12 border-b border-border shrink-0">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground leading-tight">Conversation</h2>
                  <p className="text-[11px] text-muted-foreground leading-tight">Chat with {businessName || "the team"} &amp; share files</p>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
                {conversationEmpty ? (
                  <EmptyState
                    icon={MessageCircle}
                    title="Thanks for sending this in"
                    hint={`${businessName || "The team"} is reviewing your request. You'll get an email when there's an update.`}
                    className="py-6"
                  />
                ) : (
                  <ConversationFeed request={request} viewer="customer" pendingMessages={pendingMessages} />
                )}
              </div>
              <StickyComposer
                value={reply}
                onChange={setReply}
                onSend={handleSend}
                onAttach={uploadFiles}
                sending={sending}
                uploading={uploading}
                locked={isLocked}
                lockedMessage="This request is closed."
              />
            </div>
          </div>
        </div>
      </PortalBrandRoot>
    </Chrome>
  );
}

// ── Local presentational helpers (shared visual language) ──

function Section({ icon: Icon, title, children }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <p className="text-sm text-foreground mt-0.5 tabular-nums break-words">{children}</p>
    </div>
  );
}

function ActivityTimeline({ events }) {
  return (
    <ol className="space-y-3">
      {events.map((ev) => {
        const label = TIMELINE_LABELS[ev.event] || ev.event;
        const from = ev.metadata?.from;
        const to = ev.metadata?.to;
        const when = ev.created_at ? new Date(ev.created_at) : null;
        return (
          <li key={ev.id} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <span className="w-px flex-1 bg-border mt-1" />
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-sm text-foreground">
                {label}
                {from && to && <span className="text-muted-foreground"> · {from} → {to}</span>}
              </p>
              {when && !Number.isNaN(when.getTime()) && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {when.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
