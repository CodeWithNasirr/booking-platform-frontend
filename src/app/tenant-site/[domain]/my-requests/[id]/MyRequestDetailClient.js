"use client";

/**
 * MyRequestDetailClient — V2 customer portal.
 *
 * One page, one timeline. The timeline + message thread are merged
 * into a single chronological feed, with system blocks rendered
 * differently from chat bubbles. Customer messages float right,
 * provider messages left, admin messages center. A sticky composer
 * pinned to the bottom accepts text + drag-drop attachments.
 *
 * Auth resolution cascade (unchanged from V1):
 *   1. cookie access_token (registered user)
 *   2. ?t= magic-link → POST /access-via-token/ (notification email)
 *   3. stored customer_request_token_{tenantId}
 *   4. else → bounce to /my-requests with auth UI
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import LayoutRenderer from "../../LayoutRenderer";
import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { useRealtime } from "@/lib/realtime";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const STATUS_TONE = {
  pending: { bg: "bg-yellow-100", fg: "text-yellow-800" },
  negotiating: { bg: "bg-blue-100", fg: "text-blue-800" },
  quoted: { bg: "bg-indigo-100", fg: "text-indigo-800" },
  accepted: { bg: "bg-emerald-100", fg: "text-emerald-800" },
  converted: { bg: "bg-purple-100", fg: "text-purple-800" },
  completed: { bg: "bg-slate-100", fg: "text-slate-800" },
  rejected: { bg: "bg-rose-100", fg: "text-rose-800" },
  cancelled: { bg: "bg-gray-100", fg: "text-gray-700" },
};

const TIMELINE_LABELS = {
  request_created: "Request created",
  provider_assigned: "Provider assigned",
  provider_unassigned: "Provider unassigned",
  quote_submitted: "Quote submitted",
  quote_updated: "Quote updated",
  quote_accepted: "Quote accepted",
  quote_rejected: "Quote declined",
  quote_countered: "Revision requested",
  message_posted: null,        // rendered as a bubble, not a system row
  info_requested: null,        // same
  file_uploaded: "File uploaded",
  status_changed: "Status changed",
  order_created: "Order created",
  request_rejected: "Request declined",
  request_cancelled: "Request cancelled",
};

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

function fileExt(name = "") {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function isImageName(name) {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(fileExt(name));
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function MyRequestDetailClient({ domain, requestId, site, header, footer }) {
  const { language: lang, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const searchParams = useSearchParams();
  const tenantId = site?.tenant?.id;
  const primary = theme?.primary_color || "#3B82F6";

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [isGuestToken, setIsGuestToken] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const fileInputRef = useRef(null);
  const feedEndRef = useRef(null);

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
        setError("Request not found.");
      } else {
        setError("Failed to load this request.");
      }
    } finally {
      setLoading(false);
    }
  }, [authToken, isGuestToken, tenantId, domain, requestId]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  // Live updates: subscribe to this request's topic and refetch
  // when the server tells us something landed. JWT or guest token
  // is enough — backend authorises per topic.
  useRealtime({
    topics: requestId ? [`custom_request:${requestId}`] : [],
    auth: {
      jwt: !isGuestToken ? authToken : null,
      requestToken: isGuestToken ? authToken : null,
    },
    onEvent: (msg) => {
      if (!msg?.event) return;
      if (msg.event.startsWith("message.") || msg.event.startsWith("timeline.")) {
        fetchRequest();
      }
    },
  });

  // Auto-scroll feed when new content lands.
  useEffect(() => {
    if (!request) return;
    feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [request?.messages?.length, request?.timeline?.length]);

  // ── Derived ─────────────────────────────────────────────────────
  const feed = useMemo(() => buildFeed(request), [request]);
  const activeQuote = useMemo(() => {
    if (!request?.quotes) return null;
    const pending = request.quotes.find((q) => q.status === "pending" || q.status === "countered");
    return pending || request.quotes[0] || null;
  }, [request]);
  const isLocked = useMemo(() => {
    return ["accepted", "converted", "completed", "rejected", "cancelled"].includes(request?.status);
  }, [request?.status]);

  // ── Actions ─────────────────────────────────────────────────────
  async function send(payload) {
    return apiJson(
      `${API_BASE}/api/v1/custom-requests/${requestId}/messages/`,
      {
        method: "POST",
        headers: tokenHeaders(tenantId || domain, authToken, isGuestToken),
        body: JSON.stringify(payload),
      },
    );
  }

  async function handleSend() {
    const body = reply.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await send({ body, kind: "message" });
      setReply("");
      await fetchRequest();
    } catch (err) {
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  async function handleAcceptQuote(quoteId) {
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

  async function handleRejectQuote(quoteId) {
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
      alert(err.message || "Failed to decline quote");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleCounter(quoteId) {
    const note = window.prompt("What change are you asking for?");
    if (note === null) return;
    try {
      await apiJson(
        `${API_BASE}/api/v1/custom-requests/${requestId}/counter_request/`,
        {
          method: "POST",
          headers: tokenHeaders(tenantId || domain, authToken, isGuestToken),
          body: JSON.stringify({ quote_id: quoteId, note }),
        },
      );
      await fetchRequest();
    } catch (err) {
      alert(err.message || "Failed to send revision request");
    }
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
        // FormData sets its own Content-Type with boundary.
        delete headers["Content-Type"];
        const res = await fetch(
          `${API_BASE}/api/v1/custom-requests/${requestId}/upload_file/`,
          { method: "POST", headers, body: form, credentials: "include" },
        );
        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      }
      await fetchRequest();
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
          <Skeletons />
        )}
      </Shell>
    );
  }

  const tone = STATUS_TONE[request.status] || STATUS_TONE.pending;

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
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tone.bg} ${tone.fg}`}>
              {request.status}
            </span>
          </div>

          <p className="text-gray-700 mt-4 whitespace-pre-line">{request.description}</p>

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 text-sm">
            {(request.budget_min || request.budget_max) && (
              <Cell label="Budget">
                {request.budget_min || ""}
                {request.budget_min && request.budget_max && " – "}
                {request.budget_max || ""}
              </Cell>
            )}
            {request.deadline && <Cell label="Deadline">{request.deadline}</Cell>}
            {request.provider_name && <Cell label="Provider">{request.provider_name}</Cell>}
          </dl>
        </div>

        {/* Active quote card */}
        {activeQuote && (
          <QuoteCard
            quote={activeQuote}
            primary={primary}
            disabled={isLocked || actionBusy}
            onAccept={() => handleAcceptQuote(activeQuote.id)}
            onReject={() => handleRejectQuote(activeQuote.id)}
            onCounter={() => handleCounter(activeQuote.id)}
          />
        )}

        {/* Attachments grid */}
        {request.files?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {request.files.map((f) => (
                <a
                  key={f.id}
                  href={f.file}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 transition"
                >
                  {isImageName(f.file_name) ? (
                    <img src={f.file} alt={f.file_name} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="h-24 flex items-center justify-center bg-gray-50 text-xs uppercase font-bold text-gray-400">
                      {fileExt(f.file_name) || "file"}
                    </div>
                  )}
                  <p className="text-xs text-gray-600 px-2 py-1 truncate">{f.file_name}</p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Conversation feed */}
        <div
          className={`bg-white rounded-2xl border shadow-sm p-4 sm:p-6 transition ${
            dragging ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-100"
          }`}
          onDragOver={(e) => { e.preventDefault(); if (!isLocked) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (isLocked) return;
            uploadFiles(e.dataTransfer.files);
          }}
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Conversation</h2>
          {feed.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {feed.map((item) =>
                item.kind === "system"
                  ? <SystemRow key={item.key} item={item} />
                  : <MessageBubble key={item.key} item={item} primary={primary} />
              )}
              <div ref={feedEndRef} />
            </div>
          )}
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

      {/* Sticky composer */}
      <div
        className={`fixed inset-x-0 bottom-0 border-t bg-white/95 backdrop-blur ${isRTL ? "rtl" : ""}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-3xl mx-auto p-3 sm:p-4 flex items-end gap-2">
          {isLocked ? (
            <p className="text-sm text-gray-500 py-3">
              This request is locked. Contact the team if you need changes.
            </p>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => uploadFiles(e.target.files)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                title="Attach file"
              >
                📎
              </button>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Write a reply…"
                className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 max-h-32"
              />
              <button
                onClick={handleSend}
                disabled={sending || !reply.trim()}
                className="px-4 py-2 rounded-xl text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                {sending ? "…" : "Send"}
              </button>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ── Building the merged feed ───────────────────────────────────────

function buildFeed(request) {
  if (!request) return [];
  const items = [];
  for (const m of request.messages || []) {
    items.push({
      kind: "message",
      key: `m-${m.id}`,
      at: m.created_at,
      author_role: m.author_role || "customer",
      author_name: m.author_name || m.author_email || "—",
      msg_kind: m.kind,
      body: m.body,
    });
  }
  for (const ev of request.timeline || []) {
    if (TIMELINE_LABELS[ev.event] === null) continue; // bubble already
    items.push({
      kind: "system",
      key: `t-${ev.id}`,
      at: ev.created_at,
      event: ev.event,
      actor_role: ev.actor_role,
      actor_name: ev.actor_name || ev.actor_email || "",
      metadata: ev.metadata || {},
    });
  }
  items.sort((a, b) => new Date(a.at) - new Date(b.at));
  return items;
}

// ── Components ─────────────────────────────────────────────────────

function MessageBubble({ item, primary }) {
  const role = item.author_role;
  const isCustomer = role === "customer";
  const isAdmin = role === "admin";
  const isInfo = item.msg_kind === "info_request";

  const align = isCustomer ? "justify-end" : isAdmin ? "justify-center" : "justify-start";
  const bg = isCustomer
    ? "bg-blue-50 border-blue-100"
    : isAdmin
      ? "bg-gray-100 border-gray-200"
      : isInfo
        ? "bg-amber-50 border-amber-200"
        : "bg-white border-gray-200";

  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[80%] rounded-2xl border ${bg} px-4 py-2.5 shadow-sm`}>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
            {item.author_name}
            {isInfo && <span className="ml-1 text-amber-700 normal-case">· needs info</span>}
          </span>
          <span className="text-[10px] text-gray-400">{fmtTime(item.at)}</span>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-line">{item.body}</p>
      </div>
    </div>
  );
}

function SystemRow({ item }) {
  const label = TIMELINE_LABELS[item.event] || item.event;
  return (
    <div className="flex items-center gap-2 my-2 text-[11px] text-gray-500">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200">
        {label}
        {item.metadata?.from && item.metadata?.to && (
          <> · {item.metadata.from} → {item.metadata.to}</>
        )}
      </span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

function QuoteCard({ quote, primary, disabled, onAccept, onReject, onCounter }) {
  const versions = quote.revisions_history || [];
  const latest = versions[versions.length - 1];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Current quote</h2>
        <span className="text-xs text-gray-400">
          {versions.length > 0 ? `Version ${versions.length}` : ""}
        </span>
      </div>
      <div className="flex items-baseline gap-4">
        <span className="text-2xl font-extrabold" style={{ color: primary }}>
          {quote.currency} {quote.price}
        </span>
        <span className="text-sm text-gray-500">{quote.delivery_days} days delivery</span>
        {quote.revisions > 0 && (
          <span className="text-sm text-gray-500">· {quote.revisions} revisions</span>
        )}
      </div>
      {quote.message && (
        <p className="text-sm text-gray-700 whitespace-pre-line">{quote.message}</p>
      )}

      {versions.length > 1 && (
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer hover:text-gray-800">Show version history</summary>
          <ol className="mt-2 space-y-2">
            {versions.map((r) => (
              <li key={r.id} className="border-l-2 border-gray-200 pl-3">
                <div className="font-medium">v{r.version} — {r.currency} {r.price} · {r.delivery_days}d</div>
                <p className="text-gray-500 whitespace-pre-line">{r.message}</p>
              </li>
            ))}
          </ol>
        </details>
      )}

      {quote.status === "pending" || quote.status === "countered" ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={onAccept}
            disabled={disabled}
            className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: primary }}
          >
            Accept
          </button>
          <button
            onClick={onCounter}
            disabled={disabled}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Ask for revision
          </button>
          <button
            onClick={onReject}
            disabled={disabled}
            className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-sm font-medium hover:bg-rose-50 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-500 capitalize">Quote {quote.status}</p>
      )}
    </div>
  );
}

function Cell({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="text-gray-800 mt-0.5">{children}</dd>
    </div>
  );
}

function Skeletons() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
      <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
      <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
    </div>
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
