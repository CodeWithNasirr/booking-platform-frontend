"use client";

/**
 * Custom Requests — CRM workspace.
 *
 * Three-pane layout:
 *   left   — status filters with live counts
 *   center — request list with search + last-message preview
 *   right  — conversation pane composed from shared components
 *
 * Detail page /dashboard/custom-requests/[id] remains as a deep
 * link — when no ?selected= param is set we route clicks there,
 * when it IS set we drive the right pane in-place.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import { useRealtime } from "@/lib/realtime";
import { applyRequestEnvelope, applyTenantRequestSummary } from "@/lib/realtimePatches";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCw,
  RotateCcw,
  UserPlus,
  Inbox,
  MessageSquareDashed,
} from "lucide-react";

import {
  getCustomRequests,
  getCustomRequest,
  assignProvider,
  acceptQuote,
  rejectQuote,
  rejectRequest,
  listAssignableProviders,
  postRequestMessage,
  reopenRequest,
} from "./lib/api";
import {
  StatusBadge,
  ConversationFeed,
  QuoteCard,
  StickyComposer,
  ListRowSkeleton,
  RequestDetailSkeleton,
  STATUS_TONE,
  TERMINAL_STATUSES,
} from "@/components/custom-requests";

const FILTERS = [
  "all", "pending", "negotiating", "quoted",
  "accepted", "converted", "completed", "rejected", "cancelled",
];

export default function CustomRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeTenant } = useApp();
  const { allowed: canManage } = useTenantPermission("custom_requests.manage");

  const tenantId = activeTenant?.id || activeTenant;
  const selectedId = searchParams.get("selected");

  // List state
  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Detail state
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [replyKind, setReplyKind] = useState("message");
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

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

  // Realtime: list + detail update in-place; reconnect runs one
  // REST resync.
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

  const refreshBoth = useCallback(async () => {
    await Promise.all([fetchList(), fetchDetail()]);
  }, [fetchList, fetchDetail]);

  useRealtime({
    topics: realtimeTopics,
    auth: { jwt: cookieToken },
    onEvent: (envelope) => {
      if (!envelope?.entity_type) return;
      if (envelope.entity_type === "custom_request.summary") {
        setRequests((prev) => applyTenantRequestSummary(prev, envelope));
        return;
      }
      if (envelope.topic?.startsWith("custom_request:")) {
        setDetail((prev) => (prev ? applyRequestEnvelope(prev, envelope) : prev));
      }
    },
    onReconnect: () => { refreshBoth(); },
  });

  const counts = useMemo(() => {
    const c = { all: requests.length };
    for (const r of requests) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [requests]);

  function selectRequest(id) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    router.push(`/dashboard/custom-requests?${params.toString()}`);
  }
  function clearSelection() {
    router.push("/dashboard/custom-requests");
  }

  async function handleSend() {
    const body = reply.trim();
    if (!body || sending || !detail) return;
    setSending(true);
    try {
      await postRequestMessage(tenantId, detail.id, body, replyKind);
      setReply("");
      setReplyKind("message");
      // Realtime pushes the message — no refetch needed.
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
    } catch (err) {
      toast.error(err.message || "Failed");
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
      {/* LEFT — filters */}
      <aside
        className="w-56 border-r bg-white p-4 overflow-y-auto hidden lg:block"
        aria-label="Status filters"
      >
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
                  aria-pressed={isActive}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
      <section
        className={`${selectedId ? "hidden xl:flex" : "flex"} flex-col w-full xl:w-96 border-r bg-white`}
        aria-label="Request list"
      >
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, customer, request #"
              aria-label="Search requests"
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
            <div className="p-4">
              <ListRowSkeleton count={4} />
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
                const isSelected = r.id === selectedId;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => selectRequest(r.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate flex-1">
                          {r.title}
                        </p>
                        <StatusBadge status={r.status} size="sm" />
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
      <main className="flex-1 flex flex-col bg-gray-50" aria-label="Conversation">
        {!selectedId ? (
          <EmptyState
            icon={MessageSquareDashed}
            title="Select a request"
            hint="Pick a request on the left to see its conversation, timeline, and quotes."
          />
        ) : detailLoading || !detail ? (
          <div className="p-6"><RequestDetailSkeleton /></div>
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
          />
        )}
      </main>
    </div>
  );
}

function DetailPane({
  request, tenantId, canManage, actionBusy,
  reply, setReply, replyKind, setReplyKind, sending,
  onSend, onClose, onRefresh, onReject, onReopen,
  onAcceptQuote, onRejectQuote,
}) {
  const isLocked = TERMINAL_STATUSES.has(request.status);
  const isReopenable = ["rejected", "cancelled", "completed"].includes(request.status);

  const activeQuote = useMemo(() => {
    return (request.quotes || []).find((q) => q.status === "pending" || q.status === "countered")
      || (request.quotes || [])[0];
  }, [request]);

  return (
    <>
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold truncate">{request.title}</h1>
            <StatusBadge status={request.status} size="sm" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            #{request.request_number} · {request.customer_name || request.customer_email}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            aria-label="Refresh request"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
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

            {activeQuote && (
              <QuoteCard
                quote={activeQuote}
                canAccept={canManage && !isLocked}
                canReject={canManage && !isLocked}
                disabled={actionBusy}
                onAccept={() => onAcceptQuote(activeQuote.id)}
                onReject={() => onRejectQuote(activeQuote.id)}
              />
            )}

            <ConversationFeed request={request} viewer="admin" />
          </div>

          <StickyComposer
            value={reply}
            onChange={setReply}
            onSend={onSend}
            sending={sending}
            disabled={isLocked}
            locked={isLocked}
            lockedMessage="This request is locked."
            onReopen={canManage && isReopenable ? onReopen : undefined}
            allowKind
            kind={replyKind}
            onKindChange={setReplyKind}
          />
        </div>

        {/* Quick-actions sidebar */}
        <aside
          className="w-64 border-l bg-white p-4 overflow-y-auto hidden xl:block"
          aria-label="Quick actions"
        >
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

    const loadProviders = async () => {
      setLoading(true);

      try {
        const result = await listAssignableProviders(tenantId);
    

        if (!cancelled) {
          setProviders([...result]); // or simply setProviders(result)
        }
      } catch (err) {
        toast.error(err.message || "Failed to load providers");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProviders();

    return () => {
      cancelled = true;
    };
  }, [open, tenantId]);

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
      <label className="sr-only" htmlFor="provider-select">Provider</label>
      <select id="provider-select" value={selected} onChange={(e) => setSelected(e.target.value)}
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
