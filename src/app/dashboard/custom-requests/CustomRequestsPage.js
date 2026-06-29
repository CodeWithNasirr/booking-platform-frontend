"use client";

/**
 * Custom Requests — CRM workspace (V2.E)
 *
 * Three-pane layout:
 *   left   — status filters + counts (Pending / Negotiating / Quoted / …)
 *   center — request list with search + last-message preview
 *   right  — conversation pane: header, quote panel, timeline-merged
 *            feed, sticky composer, quick-action sidebar
 *
 * The detail page /dashboard/custom-requests/[id] still works as a
 * deep link — when no ?selected= param is set we route the click
 * here, when one IS set we drive the right pane.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import { useRealtime } from "@/lib/realtime";
import { applyRequestEnvelope, applyTenantRequestSummary } from "@/lib/realtimePatches";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCw,
  Send,
  Paperclip,
  CheckCircle,
  XCircle,
  RotateCcw,
  UserPlus,
  Inbox,
  MessageSquareDashed,
} from "lucide-react";

import {
  getCustomRequests,
  getCustomRequest,
  assignProvider,
  submitQuote,
  acceptQuote,
  rejectQuote,
  rejectRequest,
  listAssignableProviders,
  postRequestMessage,
  counterRequestQuote,
  reopenRequest,
} from "./lib/api";

const STATUS_TONE = {
  pending: { dot: "bg-yellow-400", chip: "bg-yellow-100 text-yellow-800" },
  negotiating: { dot: "bg-blue-400", chip: "bg-blue-100 text-blue-800" },
  quoted: { dot: "bg-indigo-400", chip: "bg-indigo-100 text-indigo-800" },
  accepted: { dot: "bg-emerald-400", chip: "bg-emerald-100 text-emerald-800" },
  converted: { dot: "bg-purple-400", chip: "bg-purple-100 text-purple-800" },
  completed: { dot: "bg-slate-400", chip: "bg-slate-100 text-slate-800" },
  rejected: { dot: "bg-rose-400", chip: "bg-rose-100 text-rose-800" },
  cancelled: { dot: "bg-gray-400", chip: "bg-gray-100 text-gray-700" },
};

const FILTERS = [
  "all",
  "pending",
  "negotiating",
  "quoted",
  "accepted",
  "converted",
  "completed",
  "rejected",
  "cancelled",
];

const TIMELINE_LABELS = {
  request_created: "Request created",
  provider_assigned: "Provider assigned",
  provider_unassigned: "Provider unassigned",
  quote_submitted: "Quote submitted",
  quote_updated: "Quote updated",
  quote_accepted: "Quote accepted",
  quote_rejected: "Quote declined",
  quote_countered: "Revision requested",
  message_posted: null,
  info_requested: null,
  file_uploaded: "File uploaded",
  status_changed: "Status changed",
  order_created: "Order created",
  request_rejected: "Request declined",
  request_cancelled: "Request cancelled",
};

const TERMINAL = new Set(["accepted", "converted", "completed", "rejected", "cancelled"]);

export default function CustomRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeTenant } = useApp();
  const { allowed: canManage } = useTenantPermission("custom_requests.manage");

  const tenantId = activeTenant?.id || activeTenant;
  const selectedId = searchParams.get("selected");

  // ── List state ──────────────────────────────────────────────────
  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── Detail state ────────────────────────────────────────────────
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [replyKind, setReplyKind] = useState("message");
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const feedEndRef = useRef(null);

  // ── Search debounce ─────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Fetch list ──────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    if (!tenantId) return;
    setListLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const data = await getCustomRequests(tenantId, params);
      setRequests(data?.results || data || []);
      setListError(null);
    } catch (err) {
      if (err.status === 401) router.push("/auth/login");
      else setListError(err.message || "Failed to load requests");
    } finally {
      setListLoading(false);
    }
  }, [tenantId, statusFilter, debouncedSearch, router]);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── Fetch detail ────────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    if (!tenantId || !selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    try {
      const data = await getCustomRequest(tenantId, selectedId);
      setDetail(data);
    } catch (err) {
      toast.error(err.message || "Failed to load request");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [tenantId, selectedId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  useEffect(() => {
    if (detail) feedEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [detail?.messages?.length, detail?.timeline?.length]);

  // Realtime: subscribe to the selected request AND the tenant
  // requests topic so the list refreshes when activity lands on a
  // row that isn't currently selected.
  const cookieToken = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.cookie.match(/access_token=([^;]+)/)?.[1] || null;
  }, []);
  const realtimeTopics = useMemo(() => {
    const t = [];
    if (tenantId) t.push(`tenant:${tenantId}:requests`);
    if (selectedId) t.push(`custom_request:${selectedId}`);
    return t;
  }, [tenantId, selectedId]);
  useRealtime({
    topics: realtimeTopics,
    auth: { jwt: cookieToken },
    onEvent: (envelope) => {
      if (!envelope?.entity_type) return;
      // List rows update from the summary envelope; detail
      // updates from typed entity envelopes.
      if (envelope.entity_type === "custom_request.summary") {
        setRequests((prev) => applyTenantRequestSummary(prev, envelope));
        return;
      }
      if (envelope.topic?.startsWith("custom_request:")) {
        setDetail((prev) => (prev ? applyRequestEnvelope(prev, envelope) : prev));
      }
    },
  });

  // ── Status counts ───────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: requests.length };
    for (const r of requests) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [requests]);

  // ── Selection helpers ───────────────────────────────────────────
  function selectRequest(id) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    router.push(`/dashboard/custom-requests?${params.toString()}`);
  }
  function clearSelection() {
    router.push("/dashboard/custom-requests");
  }

  async function refreshBoth() {
    await Promise.all([fetchList(), fetchDetail()]);
  }

  // ── Actions ─────────────────────────────────────────────────────
  async function handleSend() {
    const body = reply.trim();
    if (!body || sending || !detail) return;
    setSending(true);
    try {
      await postRequestMessage(tenantId, detail.id, body, replyKind);
      setReply("");
      setReplyKind("message");
      await fetchDetail();
    } catch (err) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleReject() {
    if (!detail) return;
    if (!window.confirm("Reject this request?")) return;
    setActionBusy(true);
    try {
      await rejectRequest(tenantId, detail.id);
      toast.success("Request rejected");
      await refreshBoth();
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleReopen() {
    if (!detail) return;
    setActionBusy(true);
    try {
      await reopenRequest(tenantId, detail.id);
      toast.success("Reopened");
      await refreshBoth();
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleAcceptQuote(quoteId) {
    if (!detail) return;
    setActionBusy(true);
    try {
      await acceptQuote(tenantId, detail.id, quoteId);
      toast.success("Quote accepted — order created");
      await refreshBoth();
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleRejectQuote(quoteId) {
    if (!detail) return;
    setActionBusy(true);
    try {
      await rejectQuote(tenantId, detail.id, quoteId);
      toast.success("Quote rejected");
      await refreshBoth();
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
      {/* LEFT — filters */}
      <aside className="w-56 border-r bg-white p-4 overflow-y-auto hidden lg:block">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Filter
        </h2>
        <ul className="space-y-1">
          {FILTERS.map((status) => {
            const tone = STATUS_TONE[status];
            const isActive = statusFilter === status;
            const count = counts[status] || 0;
            return (
              <li key={status}>
                <button
                  onClick={() => setStatusFilter(status)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                    isActive ? "bg-gray-900 text-white" : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-2 capitalize">
                    {tone && <span className={`w-2 h-2 rounded-full ${tone.dot}`} />}
                    {status}
                  </span>
                  <span className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"}`}>
                    {count || ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* CENTER — list */}
      <section className={`${selectedId ? "hidden xl:flex" : "flex"} flex-col w-full xl:w-96 border-r bg-white`}>
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, customer, request #"
              className="w-full border rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{requests.length} requests</span>
            <button onClick={fetchList} className="flex items-center gap-1 text-blue-600 hover:underline">
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {listLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : listError ? (
            <p className="p-6 text-red-600 text-sm text-center">{listError}</p>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nothing here"
              hint={debouncedSearch ? `No results for "${debouncedSearch}"` : "No requests match this filter."}
            />
          ) : (
            <ul className="divide-y">
              {requests.map((r) => {
                const tone = STATUS_TONE[r.status] || STATUS_TONE.pending;
                const isSelected = r.id === selectedId;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => selectRequest(r.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate flex-1">
                          {r.title}
                        </p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${tone.chip}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        #{r.request_number} · {r.customer_name || r.customer_email || "—"}
                      </p>
                      {r.budget_max && (
                        <p className="text-xs text-gray-400 mt-0.5">Budget up to {r.budget_max}</p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* RIGHT — conversation */}
      <main className="flex-1 flex flex-col bg-gray-50">
        {!selectedId ? (
          <EmptyState
            icon={MessageSquareDashed}
            title="Select a request"
            hint="Pick a request on the left to see its conversation, timeline, and quotes."
          />
        ) : detailLoading || !detail ? (
          <div className="p-6 space-y-3">
            <div className="h-12 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-32 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-64 rounded-lg bg-gray-100 animate-pulse" />
          </div>
        ) : (
          <DetailPane
            request={detail}
            tenantId={tenantId}
            canManage={canManage}
            actionBusy={actionBusy}
            reply={reply}
            setReply={setReply}
            replyKind={replyKind}
            setReplyKind={setReplyKind}
            sending={sending}
            onSend={handleSend}
            onClose={clearSelection}
            onRefresh={refreshBoth}
            onReject={handleReject}
            onReopen={handleReopen}
            onAcceptQuote={handleAcceptQuote}
            onRejectQuote={handleRejectQuote}
            feedEndRef={feedEndRef}
          />
        )}
      </main>
    </div>
  );
}

// ── DetailPane ─────────────────────────────────────────────────────

function DetailPane({
  request, tenantId, canManage, actionBusy,
  reply, setReply, replyKind, setReplyKind, sending,
  onSend, onClose, onRefresh, onReject, onReopen,
  onAcceptQuote, onRejectQuote, feedEndRef,
}) {
  const tone = STATUS_TONE[request.status] || STATUS_TONE.pending;
  const isLocked = TERMINAL.has(request.status);
  const isReopenable = ["rejected", "cancelled", "completed"].includes(request.status);

  const feed = useMemo(() => buildFeed(request), [request]);
  const activeQuote = useMemo(() => {
    return (request.quotes || []).find((q) =>
      q.status === "pending" || q.status === "countered"
    ) || (request.quotes || [])[0];
  }, [request]);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold truncate">{request.title}</h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${tone.chip}`}>
              {request.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            #{request.request_number} · {request.customer_name || request.customer_email}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 xl:hidden">
            Close
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation column */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {/* Description */}
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">{request.description}</p>
              <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                {(request.budget_min || request.budget_max) && (
                  <Cell label="Budget">
                    {request.budget_min || ""}
                    {request.budget_min && request.budget_max && " – "}
                    {request.budget_max || ""}
                  </Cell>
                )}
                {request.deadline && <Cell label="Deadline">{request.deadline}</Cell>}
                {request.provider_name && <Cell label="Provider">{request.provider_name}</Cell>}
              </div>
            </div>

            {/* Active quote */}
            {activeQuote && (
              <QuoteBox
                quote={activeQuote}
                canAct={canManage && !isLocked}
                onAccept={() => onAcceptQuote(activeQuote.id)}
                onReject={() => onRejectQuote(activeQuote.id)}
              />
            )}

            {/* Feed */}
            {feed.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {feed.map((item) =>
                  item.kind === "system"
                    ? <SystemRow key={item.key} item={item} />
                    : <Bubble key={item.key} item={item} />
                )}
                <div ref={feedEndRef} />
              </div>
            )}
          </div>

          {/* Sticky composer */}
          <div className="border-t bg-white px-4 py-3">
            {isLocked ? (
              <div className="text-sm text-gray-500 text-center py-2">
                This request is locked.
                {canManage && isReopenable && (
                  <button onClick={onReopen} disabled={actionBusy}
                    className="ml-3 text-blue-600 hover:underline inline-flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" /> Reopen
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-xs mb-2">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="kind" checked={replyKind === "message"}
                      onChange={() => setReplyKind("message")} />
                    Message
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="kind" checked={replyKind === "info_request"}
                      onChange={() => setReplyKind("info_request")} />
                    Request info
                  </label>
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        onSend();
                      }
                    }}
                    rows={2}
                    placeholder="Write a reply…"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={onSend}
                    disabled={sending || !reply.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    {sending ? "…" : <Send className="w-4 h-4 inline" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick-actions sidebar */}
        <aside className="w-64 border-l bg-white p-4 overflow-y-auto hidden xl:block">
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide mb-3">Customer</h3>
          <div className="text-sm space-y-1 mb-5">
            <div>{request.customer_name || "—"}</div>
            <div className="text-gray-500">{request.customer_email}</div>
            {request.customer_phone && <div className="text-gray-500">{request.customer_phone}</div>}
          </div>

          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide mb-3">Provider</h3>
          {request.provider_name ? (
            <div className="text-sm mb-5">{request.provider_name}</div>
          ) : (
            <div className="text-sm text-gray-400 mb-5">Not assigned</div>
          )}

          {canManage && (
            <div className="space-y-2">
              <ProviderAssigner
                tenantId={tenantId}
                requestId={request.id}
                onAssigned={onRefresh}
                disabled={actionBusy || isLocked}
              />
              {!isLocked && (
                <button onClick={onReject} disabled={actionBusy}
                  className="w-full px-3 py-2 text-sm border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50 disabled:opacity-50">
                  Reject request
                </button>
              )}
              {isReopenable && (
                <button onClick={onReopen} disabled={actionBusy}
                  className="w-full px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen
                </button>
              )}
            </div>
          )}

          {request.converted_order && (
            <a
              href={`/dashboard/orders/${request.converted_order}`}
              className="block mt-5 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg text-center hover:bg-purple-700"
            >
              View order
            </a>
          )}
        </aside>
      </div>
    </>
  );
}

function ProviderAssigner({ tenantId, requestId, onAssigned, disabled }) {
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || providers.length > 0 || loading) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await listAssignableProviders(tenantId);
        if (!cancelled) setProviders(result?.results || result || []);
      } catch (err) {
        toast.error(err.message || "Failed to load providers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, tenantId, providers.length, loading]);

  async function handleAssign() {
    if (!selected) return;
    setBusy(true);
    try {
      await assignProvider(tenantId, requestId, selected);
      toast.success("Provider assigned");
      setOpen(false);
      setSelected("");
      onAssigned?.();
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} disabled={disabled}
        className="w-full px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1">
        <UserPlus className="w-3.5 h-3.5" />
        Assign provider
      </button>
    );
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
      <select value={selected} onChange={(e) => setSelected(e.target.value)}
        disabled={loading}
        className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white">
        <option value="">{loading ? "Loading…" : "Select a provider"}</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name || p.full_name || p.email || p.id}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button onClick={handleAssign} disabled={!selected || busy}
          className="flex-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg disabled:opacity-50">
          {busy ? "…" : "Assign"}
        </button>
        <button onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs bg-gray-200 rounded-lg">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Pieces ─────────────────────────────────────────────────────────

function QuoteBox({ quote, canAct, onAccept, onReject }) {
  const versions = quote.revisions_history || [];
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
          Current quote
        </h3>
        <span className="text-[10px] text-gray-400">
          {versions.length > 0 && `v${versions.length}`}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-xl font-extrabold text-gray-900">
          {quote.currency} {quote.price}
        </span>
        <span className="text-sm text-gray-500">{quote.delivery_days} days</span>
        {quote.revisions > 0 && <span className="text-sm text-gray-500">· {quote.revisions} revisions</span>}
        <span className="text-xs text-gray-400 capitalize ml-auto">{quote.status}</span>
      </div>
      {quote.message && (
        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{quote.message}</p>
      )}
      {versions.length > 1 && (
        <details className="text-xs text-gray-600 mt-2">
          <summary className="cursor-pointer hover:text-gray-800">History</summary>
          <ol className="mt-2 space-y-1.5">
            {versions.map((r) => (
              <li key={r.id} className="border-l-2 border-gray-200 pl-2">
                v{r.version} — {r.currency} {r.price} · {r.delivery_days}d
              </li>
            ))}
          </ol>
        </details>
      )}
      {canAct && (quote.status === "pending" || quote.status === "countered") && (
        <div className="flex gap-2 mt-3">
          <button onClick={onAccept}
            className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Accept
          </button>
          <button onClick={onReject}
            className="px-3 py-1.5 text-xs border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50 inline-flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

function Bubble({ item }) {
  const isAdmin = item.author_role === "admin";
  const isCustomer = item.author_role === "customer";
  const isInfo = item.msg_kind === "info_request";

  const align = isAdmin ? "justify-center" : isCustomer ? "justify-start" : "justify-end";
  const bg = isAdmin
    ? "bg-gray-100 border-gray-200"
    : isCustomer
      ? "bg-blue-50 border-blue-100"
      : isInfo
        ? "bg-amber-50 border-amber-200"
        : "bg-emerald-50 border-emerald-100";

  return (
    <div className={`flex ${align}`}>
      <div className={`max-w-[80%] rounded-2xl border ${bg} px-4 py-2 shadow-sm`}>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[11px] font-semibold text-gray-700">
            {item.author_name}
            {isInfo && <span className="ml-1 text-amber-700">· needs info</span>}
          </span>
          <span className="text-[10px] text-gray-400">{new Date(item.at).toLocaleString()}</span>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-line">{item.body}</p>
      </div>
    </div>
  );
}

function SystemRow({ item }) {
  const label = TIMELINE_LABELS[item.event] || item.event;
  return (
    <div className="flex items-center gap-2 my-1 text-[11px] text-gray-500">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200">
        {label}
        {item.metadata?.from && item.metadata?.to && (
          <> · {item.metadata.from} → {item.metadata.to}</>
        )}
      </span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

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
    if (TIMELINE_LABELS[ev.event] === null) continue;
    items.push({
      kind: "system",
      key: `t-${ev.id}`,
      at: ev.created_at,
      event: ev.event,
      actor_role: ev.actor_role,
      metadata: ev.metadata || {},
    });
  }
  items.sort((a, b) => new Date(a.at) - new Date(b.at));
  return items;
}

function Cell({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-800 mt-0.5 text-sm">{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
      <Icon className="w-10 h-10 mb-3" />
      <p className="font-medium text-gray-600">{title}</p>
      <p className="text-sm mt-1">{hint}</p>
    </div>
  );
}
