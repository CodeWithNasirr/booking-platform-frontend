"use client";

/**
 * MyRequestDetailClient — V3 customer portal.
 *
 * Composed entirely from shared components in
 * src/components/custom-requests so the tenant CRM, provider
 * panel, and customer portal all render the same widgets with
 * the same spacing / tone / interaction rules.
 *
 * Auth cascade:
 *   1. cookie access_token (registered user)
 *   2. ?t= magic-link → POST /access-via-token/
 *   3. stored customer_request_token_{tenantId}
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import LayoutRenderer from "../../LayoutRenderer";
import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { useRealtime } from "@/lib/realtime";
import { applyRequestEnvelope } from "@/lib/realtimePatches";
import {
  StatusBadge,
  ConversationFeed,
  QuoteCard,
  AttachmentGrid,
  StickyComposer,
  RequestDetailSkeleton,
  TERMINAL_STATUSES,
} from "@/components/custom-requests";

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
<<<<<<< HEAD
  const { language: lang, isRTL } = useTenantLang();
  
=======
  const { isRTL } = useTenantLang();
>>>>>>> 1309309d81fd4b0c4f62efd7b0d1e1fdcab7d26b
  const theme = useTenantTheme();
  const searchParams = useSearchParams();
  // const tenantId = site?.tenant?.id;
  const tenantId = site.tenant_id;
  const primary = theme?.primary_color || "#3B82F6";

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

  // ── Data fetch (initial + reconnect fallback) ───────────────────
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
        setError("Request not found.");
      } else {
        setError("Failed to load this request.");
      }
    } finally {
      setLoading(false);
    }
  }, [authToken, isGuestToken, tenantId, domain, requestId]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  // ── Realtime — patch in-place; refetch only on (re)connect ───────
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
      || request.quotes[0] || null;
  }, [request]);

  const isLocked = TERMINAL_STATUSES.has(request?.status);

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
      // Realtime will push the message; no refetch needed.
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
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Sign in to view this request</h2>
          <p className="text-sm text-gray-600 mb-5">
            Use the verification link in your email, or go to your dashboard to enter a code.
          </p>
          <Link
            href={tenantRoutes.myRequests()}
            className="inline-block px-5 py-2.5 rounded-xl text-white font-medium"
            style={{ backgroundColor: primary }}
          >
            Go to My Requests
          </Link>
        </div>
      </Shell>
    );
  }

  if (loading || !request) {
    return (
      <Shell header={headerSection} footer={footerSection} site={site} isRTL={isRTL}>
        {error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <div className="max-w-3xl mx-auto"><RequestDetailSkeleton /></div>
        )}
      </Shell>
    );
  }

  return (
    <Shell header={headerSection} footer={footerSection} site={site} isRTL={isRTL}>
      <div className="max-w-3xl mx-auto pb-32 space-y-6">
        <Link href={tenantRoutes.myRequests()} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to my requests
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{request.title}</h1>
              <p className="text-xs text-gray-500 mt-0.5">#{request.request_number}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-gray-700 mt-4 whitespace-pre-line">{request.description}</p>
        </div>

        {activeQuote && (
          <QuoteCard
            quote={activeQuote}
            primary={primary}
            canAccept canReject canCounter
            disabled={isLocked || actionBusy}
            onAccept={() => quoteAction("accept_quote", activeQuote.id)}
            onReject={() => quoteAction("reject_quote", activeQuote.id)}
            onCounter={() => handleCounter(activeQuote.id)}
          />
        )}

        {request.files?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h2>
            <AttachmentGrid files={request.files} />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Conversation</h2>
          <ConversationFeed request={request} viewer="customer" />
        </div>

        {request.status === "converted" && request.converted_order && (
          <Link
            href={tenantRoutes.myOrder(request.converted_order)}
            className="block bg-purple-50 border border-purple-200 rounded-2xl p-5 text-sm text-purple-900 hover:bg-purple-100"
          >
            This request became an order — view the order →
          </Link>
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
        primary={primary}
        sticky
      />
    </Shell>
  );
}

function Shell({ header, footer, site, isRTL, children }) {
  return (
    <>
      {header.length > 0 && <LayoutRenderer sections={header} site={site} />}
      <main className={`min-h-screen bg-gray-50 py-10 ${isRTL ? "rtl" : ""}`}>
        <div className="px-4">{children}</div>
      </main>
      {footer.length > 0 && <LayoutRenderer sections={footer} site={site} />}
    </>
  );
}
