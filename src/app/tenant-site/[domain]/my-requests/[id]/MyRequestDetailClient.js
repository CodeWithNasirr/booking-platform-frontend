"use client";

/**
 * MyRequestDetailClient — V3.F.2 customer portal.
 *
 * Apple-Support / Stripe-Customer-Portal feel:
 *
 *   - Brand-led header strip carrying the tenant logo + business
 *     name so the customer reads this as the business's product,
 *     not ours.
 *   - StatusTimeline rail above the fold — the customer's first
 *     question ("where is my request?") gets answered before
 *     anything scrolls.
 *   - Quote becomes the hero whenever one is active.
 *   - Single-column, generous spacing, 44 px touch targets.
 *   - Sticky composer pinned over the iOS home indicator via
 *     env(safe-area-inset-bottom).
 *
 * Everything composes from the design system + shared
 * custom-request primitives. Brand colours flow from
 * <BrandRoot> via CSS variables.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, MessageCircle, Inbox } from "lucide-react";

import LayoutRenderer from "../../LayoutRenderer";
import { useTenantLang } from "../../../contexts/TenantLangContext";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { useRealtime } from "@/lib/realtime";
import { applyRequestEnvelope } from "@/lib/realtimePatches";
import {
  ConversationFeed,
  QuoteCard,
  AttachmentGrid,
  StickyComposer,
  StatusTimeline,
  RequestDetailSkeleton,
  TERMINAL_STATUSES,
} from "@/components/custom-requests";
import {
  Card,
  Button,
  EmptyState,
  BrandRoot,
  useBrand,
} from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

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
    <BrandRoot className="contents">
      <CustomerPortalDetail
        domain={domain}
        requestId={requestId}
        site={site}
        header={header}
        footer={footer}
      />
    </BrandRoot>
  );
}

function CustomerPortalDetail({ domain, requestId, site, header, footer }) {
  const { isRTL } = useTenantLang();
  const brand = useBrand();
  const searchParams = useSearchParams();
  const tenantId = site?.tenant?.id;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isGuestToken, setIsGuestToken] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

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

  // ── Realtime ────────────────────────────────────────────────────
  useRealtime({
    topics: requestId ? [`custom_request:${requestId}`] : [],
    auth: {
      jwt: !isGuestToken ? authToken : null,
      requestToken: isGuestToken ? authToken : null,
    },
    onEvent: (envelope) => {
      if (!envelope?.entity_type) return;
      setRequest((prev) => (prev ? applyRequestEnvelope(prev, envelope) : prev));
    },
    onReconnect: () => { fetchRequest(); },
  });

  // ── Derived ─────────────────────────────────────────────────────
  const activeQuote = useMemo(() => {
    if (!request?.quotes) return null;
    return request.quotes.find((q) => q.status === "pending" || q.status === "countered")
      || request.quotes[0]
      || null;
  }, [request]);

  const isLocked = TERMINAL_STATUSES.has(request?.status);
  const businessName = brand.businessName || site?.tenant?.name || "";
  const tenantLogo = brand.logo || site?.tenant?.logo;

  // ── Actions ─────────────────────────────────────────────────────
  async function handleSend() {
    const body = reply.trim();
    if (!body || sending) return;
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
      setReply("");
    } catch (err) {
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

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

  async function uploadFiles(files) {
    if (!files || files.length === 0 || isLocked) return;
    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("file_type", "attachment");
        const headers = tokenHeaders(tenantId || domain, authToken, isGuestToken);
        delete headers["Content-Type"];
        const res = await fetch(
          `${API_BASE}/api/v1/custom-requests/${requestId}/upload_file/`,
          { method: "POST", headers, body: form, credentials: "include" },
        );
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      }
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────
  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  if (needsAuth) {
    return (
      <Shell header={headerSection} footer={footerSection} site={site} isRTL={isRTL}>
        <Card className="max-w-md mx-auto text-center">
          <h2 className="text-lg font-semibold mb-2">Sign in to view this request</h2>
          <p className="text-sm text-gray-600 mb-5">
            Use the verification link in your email, or go to your dashboard to enter a code.
          </p>
          <Link
            href={tenantRoutes.myRequests()}
            className="inline-flex items-center justify-center h-11 px-6 rounded-xl font-medium bg-[color:var(--brand-primary,#3B82F6)] text-[color:var(--brand-primary-fg,#fff)] hover:brightness-110"
          >
            Go to My Requests
          </Link>
        </Card>
      </Shell>
    );
  }

  if (loading && !request) {
    return (
      <Shell header={headerSection} footer={footerSection} site={site} isRTL={isRTL}>
        <div className="max-w-3xl mx-auto"><RequestDetailSkeleton /></div>
      </Shell>
    );
  }

  if (error && !request) {
    return (
      <Shell header={headerSection} footer={footerSection} site={site} isRTL={isRTL}>
        <EmptyState
          icon={Inbox}
          title="We couldn't load this request"
          hint={error}
          action={(
            <Button variant="primary" onClick={fetchRequest} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Try again
            </Button>
          )}
          className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm"
        />
      </Shell>
    );
  }

  return (
    <Shell header={headerSection} footer={footerSection} site={site} isRTL={isRTL}>
      <div className="max-w-3xl mx-auto pb-32 space-y-5">
        {/* Brand strip — frames the page as the tenant's product */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href={tenantRoutes.myRequests()}
            className="inline-flex items-center gap-1.5 h-10 px-3 -ml-3 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">My requests</span>
          </Link>
          {(tenantLogo || businessName) && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              {tenantLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenantLogo} alt="" className="w-7 h-7 rounded-lg object-contain" />
              )}
              {businessName && <span className="font-semibold">{businessName}</span>}
            </div>
          )}
        </div>

        {/* Hero card */}
        <Card padding="lg" className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 font-mono">#{request.request_number}</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">{request.title}</h1>
          </div>

          <StatusTimeline status={request.status} />

          <p className="text-gray-700 whitespace-pre-line text-[15px] leading-relaxed">
            {request.description}
          </p>

          {(request.budget_min || request.budget_max || request.deadline) && (
            <dl className="grid grid-cols-2 gap-3 pt-2 text-sm">
              {(request.budget_min || request.budget_max) && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-gray-500">Budget</dt>
                  <dd className="text-gray-800 mt-0.5">
                    {request.budget_min || ""}
                    {request.budget_min && request.budget_max && " – "}
                    {request.budget_max || ""}
                  </dd>
                </div>
              )}
              {request.deadline && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-gray-500">Deadline</dt>
                  <dd className="text-gray-800 mt-0.5">{request.deadline}</dd>
                </div>
              )}
            </dl>
          )}
        </Card>

        {/* Quote hero — the customer's call-to-action moment */}
        {activeQuote && (
          <QuoteCard
            quote={activeQuote}
            canAccept canReject canCounter
            disabled={isLocked || actionBusy}
            onAccept={() => quoteAction("accept_quote", activeQuote.id)}
            onReject={() => quoteAction("reject_quote", activeQuote.id)}
            onCounter={() => handleCounter(activeQuote.id)}
          />
        )}

        {/* Conversion success card */}
        {request.status === "converted" && request.converted_order && (
          <Card padding="lg" className="!bg-[color:var(--brand-primary,#3B82F6)]/5 !border-[color:var(--brand-primary,#3B82F6)]/20">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Your request is now an order
            </p>
            <p className="text-sm text-gray-600 mb-3">
              Track delivery, files, and messages on the order page.
            </p>
            <Link
              href={tenantRoutes.myOrder(request.converted_order)}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium bg-[color:var(--brand-primary,#3B82F6)] text-[color:var(--brand-primary-fg,#fff)] hover:brightness-110"
            >
              Open order →
            </Link>
          </Card>
        )}

        {/* Attachments */}
        {request.files?.length > 0 && (
          <Card padding="lg">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Attachments
            </h2>
            <AttachmentGrid files={request.files} />
          </Card>
        )}

        {/* Conversation */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-2">
            <MessageCircle className="w-3.5 h-3.5" />
            Conversation
          </h2>
          {(request.messages?.length === 0 && request.timeline?.length <= 1)
            ? (
              <EmptyState
                icon={MessageCircle}
                title="Thanks for sending this in"
                hint={`The ${businessName || "team"} is reviewing your request. You'll get an email when there's an update.`}
                className="py-6"
              />
            )
            : <ConversationFeed request={request} viewer="customer" />}
        </Card>
      </div>

      {/* Sticky composer — always above the iOS home indicator */}
      <StickyComposer
        value={reply}
        onChange={setReply}
        onSend={handleSend}
        onAttach={uploadFiles}
        sending={sending}
        uploading={uploading}
        locked={isLocked}
        sticky
      />
    </Shell>
  );
}

function Shell({ header, footer, site, isRTL, children }) {
  return (
    <>
      {header.length > 0 && <LayoutRenderer sections={header} site={site} />}
      <main className={`min-h-screen bg-gray-50 ${isRTL ? "rtl" : ""}`} dir={isRTL ? "rtl" : undefined}>
        <div className="px-4 sm:px-6 py-6 sm:py-10">{children}</div>
      </main>
      {footer.length > 0 && <LayoutRenderer sections={footer} site={site} />}
    </>
  );
}
