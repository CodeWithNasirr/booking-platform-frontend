"use client";

/**
 * MyRequestDetailClient
 * =====================
 *
 * Customer-facing detail view for a single custom service request.
 *
 * Auth model (in priority order):
 *   1. ?t=<magic_token> — exchanged once for a session token via
 *      /api/v1/custom-requests/access-via-token/. Used when the
 *      customer clicks the link in a notification email.
 *   2. customer_request_token_{tenantId} from localStorage — saved
 *      on public submit and after OTP verification.
 *   3. access_token cookie — registered users.
 *
 * Surfaces:
 *   - request metadata + status timeline
 *   - quotes (accept / reject)
 *   - message thread (post replies, see provider info-requests)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import LayoutRenderer from "../../LayoutRenderer";
import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { tenantRoutes } from "@/lib/tenantRoutes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  negotiating: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  converted: "bg-purple-100 text-purple-800",
  cancelled: "bg-gray-100 text-gray-800",
};

function readCookieToken() {
  if (typeof document === "undefined") return null;
  return document.cookie.match(/access_token=([^;]+)/)?.[1] || null;
}

function tokenHeaders(tenantRef, token, isGuest) {
  const h = { "Content-Type": "application/json" };
  // Prefer tenant UUID (most reliable) and fall back to the slug
  // from the URL. Backend middleware accepts either.
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
  const { language: lang, isRTL } = useTenantLang();
  
  const theme = useTenantTheme();
  const searchParams = useSearchParams();
  // const tenantId = site?.tenant?.id;
  const tenantId = site?.id;
  const primary = theme?.primary_color || "#3B82F6";

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isGuestToken, setIsGuestToken] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const threadRef = useRef(null);

  // ── Resolve a usable token ──
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      // 1. Cookie auth
      const cookieToken = readCookieToken();
      if (cookieToken) {
        if (!cancelled) {
          setAuthToken(cookieToken);
          setIsGuestToken(false);
        }
        return;
      }

      // 2. Magic-link exchange
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
            // Clean ?t= from the URL so refresh-with-token doesn't loop.
            const url = new URL(window.location.href);
            url.searchParams.delete("t");
            window.history.replaceState({}, "", url.toString());
          } catch {}
          return;
        } catch {
          // fall through to localStorage / needsAuth
        }
      }

      // 3. Stored request token
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
    }
    resolve();
    return () => { cancelled = true; };
  }, [domain, tenantId, searchParams]);

  // ── Fetch the request once we have a token ──
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
  }, [authToken, isGuestToken, domain, requestId]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  // ── Actions ──
  async function acceptQuote(quoteId) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await apiJson(
        `${API_BASE}/api/v1/custom-requests/${requestId}/accept_quote/`,
        {
          method: "POST",
          headers: tokenHeaders(tenantId || domain, authToken, isGuestToken),
          body: JSON.stringify({ quote_id: quoteId }),
        },
      );
      await fetchRequest();
    } catch (err) {
      alert(err.message || "Failed to accept quote");
    } finally {
      setActionBusy(false);
    }
  }

  async function rejectQuote(quoteId) {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await apiJson(
        `${API_BASE}/api/v1/custom-requests/${requestId}/reject_quote/`,
        {
          method: "POST",
          headers: tokenHeaders(tenantId || domain, authToken, isGuestToken),
          body: JSON.stringify({ quote_id: quoteId }),
        },
      );
      await fetchRequest();
    } catch (err) {
      alert(err.message || "Failed to reject quote");
    } finally {
      setActionBusy(false);
    }
  }

  async function sendReply() {
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
      await fetchRequest();
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
    } catch (err) {
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  // ── Render ──
  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  if (needsAuth) {
    return (
      <Shell headerSection={headerSection} footerSection={footerSection} site={site} isRTL={isRTL}>
        <div className="max-w-md mx-auto bg-white rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Sign in to view this request</h2>
          <p className="text-sm text-gray-600 mb-5">
            Use the verification link in your email, or go to your dashboard to enter the code we sent.
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
      <Shell headerSection={headerSection} footerSection={footerSection} site={site} isRTL={isRTL}>
        {error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        )}
      </Shell>
    );
  }

  const statusColor = STATUS_COLORS[request.status] || STATUS_COLORS.pending;
  const quotes = request.quotes || [];
  const messages = request.messages || [];
  const acceptedQuote = quotes.find((q) => q.status === "accepted");
  const isClosed = ["accepted", "rejected", "converted", "cancelled"].includes(request.status);

  return (
    <Shell headerSection={headerSection} footerSection={footerSection} site={site} isRTL={isRTL}>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href={tenantRoutes.myRequests()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to my requests
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{request.title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {request.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">#{request.request_number}</p>
          <p className="text-gray-700 mt-4 whitespace-pre-line">{request.description}</p>

          <dl className="grid grid-cols-2 gap-4 mt-5 text-sm">
            {(request.budget_min || request.budget_max) && (
              <Cell label="Budget">
                {request.budget_min && `${request.budget_min}`}
                {request.budget_min && request.budget_max && " – "}
                {request.budget_max && `${request.budget_max}`}
              </Cell>
            )}
            {request.deadline && <Cell label="Deadline">{request.deadline}</Cell>}
            {request.provider_name && <Cell label="Provider">{request.provider_name}</Cell>}
          </dl>
        </div>

        {/* Quotes */}
        {quotes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-3">Quotes</h2>
            <div className="space-y-3">
              {quotes.map((q) => (
                <div key={q.id} className="border rounded-xl p-4">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <span className="text-lg font-bold" style={{ color: primary }}>
                      {q.currency || "SAR"} {q.price}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.status === "accepted" ? "bg-green-100 text-green-700" :
                      q.status === "rejected" ? "bg-red-100 text-red-700" :
                      q.status === "countered" ? "bg-amber-100 text-amber-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {q.status}
                    </span>
                  </div>
                  {q.message && <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{q.message}</p>}
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>{q.delivery_days} days delivery</span>
                    {q.revisions > 0 && <span>{q.revisions} revisions</span>}
                    {q.provider_name && <span>by {q.provider_name}</span>}
                  </div>

                  {!isClosed && !acceptedQuote && q.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => acceptQuote(q.id)}
                        disabled={actionBusy}
                        className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: primary }}
                      >
                        Accept quote
                      </button>
                      <button
                        onClick={() => rejectQuote(q.id)}
                        disabled={actionBusy}
                        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-3">Conversation</h2>
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet.</p>
          ) : (
            <div ref={threadRef} className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl p-3 ${
                    m.author_role === "customer" ? "bg-blue-50" :
                    m.kind === "info_request" ? "bg-amber-50" :
                    "bg-gray-50"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-semibold text-gray-700">
                      {m.author_name || m.author_email || "—"}
                      {m.kind === "info_request" && (
                        <span className="ml-2 text-amber-700">needs info</span>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">{m.body}</p>
                </div>
              ))}
            </div>
          )}

          {!isClosed && (
            <div className="mt-4 flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Write a reply…"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          )}
        </div>

        {request.status === "converted" && request.converted_order && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 text-sm text-purple-900">
            This request became an order.{" "}
            <Link href={tenantRoutes.myOrder(request.converted_order)} className="font-medium underline">
              View the order →
            </Link>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Cell({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-gray-800 mt-0.5">{children}</dd>
    </div>
  );
}

function Shell({ headerSection, footerSection, site, isRTL, children }) {
  return (
    <>
      {headerSection.length > 0 && <LayoutRenderer sections={headerSection} site={site} />}
      <main className={`min-h-screen bg-gray-50 py-10 ${isRTL ? "rtl" : ""}`}>
        <div className="px-4">{children}</div>
      </main>
      {footerSection.length > 0 && <LayoutRenderer sections={footerSection} site={site} />}
    </>
  );
}
