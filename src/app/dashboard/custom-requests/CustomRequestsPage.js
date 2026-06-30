"use client";

/**
 * Custom Requests — CRM workspace (V3.F.4).
 *
 * Three-pane Linear/Stripe-style shell:
 *
 *   left   — vertical filter rail with live counts (lg+) /
 *            horizontal FilterBar above the list (sm)
 *   center — searchable request list with thread-density rows
 *   right  — conversation pane + context sidebar
 *
 * Mobile back-stack: when ?selected= is set the conversation
 * fills the viewport and the list is hidden underneath a sticky
 * back header. xl+ shows everything side-by-side.
 *
 * Composes from the platform design system; mounts BrandRoot at
 * the page root so every primitive picks up the active tenant's
 * accent automatically.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import { useRealtime } from "@/lib/realtime";
import { applyRequestEnvelope, applyTenantRequestSummary } from "@/lib/realtimePatches";
import toast from "react-hot-toast";
import {
  ArrowLeft,
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
  submitQuote,
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
import {
  Card,
  SectionCard,
  PageHeader,
  Button,
  SearchInput,
  FilterBar,
  EmptyState,
  Avatar,
  BrandRoot,
} from "@/components/ui";

const FILTERS = [
  "all", "pending", "negotiating", "quoted",
  "accepted", "converted", "completed", "rejected", "cancelled",
];

const FILTER_TONES = {
  all:         null,
  pending:     "yellow",
  negotiating: "blue",
  quoted:      "indigo",
  accepted:    "emerald",
  converted:   "purple",
  completed:   "slate",
  rejected:    "rose",
  cancelled:   "gray",
};

function relTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(iso).toLocaleDateString();
}

export default function CustomRequestsPage() {
  return (
    <BrandRoot className="contents">
      <Workspace />
    </BrandRoot>
  );
}

function Workspace() {
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
  // Optimistic outbound queue — same shape as the customer
  // portal so all three roles render their own messages
  // instantly while the API + realtime round-trip in the
  // background.
  const [pendingMessages, setPendingMessages] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Fetches ─────────────────────────────────────────────────────
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

  const refreshBoth = useCallback(async () => {
    await Promise.all([fetchList(), fetchDetail()]);
  }, [fetchList, fetchDetail]);

  // ── Realtime ────────────────────────────────────────────────────
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

  // ── Derived ─────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: requests.length };
    for (const r of requests) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [requests]);

  const pulse = useMemo(() => {
    if (!requests.length) return "Nothing in the queue";
    const parts = [];
    if (counts.pending) parts.push(`${counts.pending} new`);
    if (counts.negotiating) parts.push(`${counts.negotiating} in chat`);
    if (counts.quoted) parts.push(`${counts.quoted} quoted`);
    if (counts.accepted) parts.push(`${counts.accepted} accepted`);
    return parts.length ? parts.join(" · ") : `${requests.length} total`;
  }, [requests.length, counts]);

  // ── Selection helpers ───────────────────────────────────────────
  function selectRequest(id) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    router.push(`/dashboard/custom-requests?${params.toString()}`);
  }
  function clearSelection() {
    router.push("/dashboard/custom-requests");
  }

  // ── Actions ─────────────────────────────────────────────────────
  async function handleSend() {
    const body = reply.trim();
    if (!body || sending || !detail) return;
    const optimistic = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      body,
      at: new Date().toISOString(),
      author_role: "admin",
      author_name: "You",
      requestId: detail.id,
      kind: replyKind,
    };
    setPendingMessages((q) => [...q, optimistic]);
    const restoreBody = body;
    const restoreKind = replyKind;
    setReply("");
    setReplyKind("message");
    setSending(true);
    try {
      await postRequestMessage(tenantId, detail.id, body, restoreKind);
      // Realtime patches the persisted row; reconciliation
      // effect below drops the pending entry on match.
    } catch (err) {
      setPendingMessages((q) => q.filter((m) => m.id !== optimistic.id));
      setReply(restoreBody);
      setReplyKind(restoreKind);
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  // Reconcile pending entries against the live messages array.
  // Scoped to the currently-selected request so switching
  // requests doesn't reapply stale optimistic entries.
  useEffect(() => {
    if (pendingMessages.length === 0) return;
    if (!detail?.messages?.length) {
      // Drop any pending entries that belong to a different request.
      const sameRequest = pendingMessages.filter((p) => p.requestId === detail?.id);
      if (sameRequest.length !== pendingMessages.length) {
        setPendingMessages(sameRequest);
      }
      return;
    }
    const now = Date.now();
    const stillPending = pendingMessages.filter((p) => {
      if (p.requestId !== detail.id) return false;
      const match = detail.messages.find((m) =>
        (m.author_role === "admin")
        && (m.body || "").trim() === p.body.trim()
        && now - new Date(m.created_at).getTime() < 5 * 60 * 1000,
      );
      return !match;
    });
    if (stillPending.length !== pendingMessages.length) {
      setPendingMessages(stillPending);
    }
  }, [pendingMessages, detail?.messages, detail?.id]);

  // Visible pendings for the currently-open detail.
  const visiblePending = useMemo(
    () => pendingMessages.filter((p) => p.requestId === detail?.id),
    [pendingMessages, detail?.id],
  );

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

  const filterOptions = useMemo(() => FILTERS.map((s) => ({
    value: s,
    label: s === "all" ? "All" : (STATUS_TONE[s]?.label || s),
    count: counts[s] || 0,
    tone: FILTER_TONES[s],
  })), [counts]);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 flex flex-col">
      {/* Page header — single source of truth for title + pulse */}
      <div className="bg-white border-b">
        <div className="px-4 sm:px-6 py-4">
          <PageHeader
            title="Custom Requests"
            subtitle={pulse}
            actions={(
              <Button
                variant="secondary" size="sm"
                onClick={fetchList}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
            )}
          />
        </div>
        {/* Mobile / tablet filter bar (vertical rail hidden) */}
        <div className="px-4 sm:px-6 py-2 lg:hidden">
          <FilterBar
            value={statusFilter}
            onChange={setStatusFilter}
            options={filterOptions}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* LEFT — vertical filter rail (lg+) */}
        <aside
          className="hidden lg:flex flex-col w-56 border-r bg-white p-3 overflow-y-auto"
          aria-label="Status filters"
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            View
          </p>
          <ul className="space-y-0.5">
            {filterOptions.map((opt) => {
              const isActive = statusFilter === opt.value;
              return (
                <li key={opt.value}>
                  <button
                    onClick={() => setStatusFilter(opt.value)}
                    aria-pressed={isActive}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary,#3B82F6)]/30 ${
                      isActive
                        ? "bg-[color:var(--brand-primary,#3B82F6)]/10 text-gray-900 font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {opt.tone && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            { yellow: "bg-yellow-400", blue: "bg-blue-400",
                              indigo: "bg-indigo-400", emerald: "bg-emerald-400",
                              purple: "bg-purple-400", slate: "bg-slate-400",
                              rose: "bg-rose-400", gray: "bg-gray-400" }[opt.tone]
                          }`}
                        />
                      )}
                      <span className="capitalize truncate">{opt.label}</span>
                    </span>
                    {opt.count > 0 && (
                      <span className={`text-xs tabular-nums ${isActive ? "text-gray-700" : "text-gray-400"}`}>
                        {opt.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* CENTER — list */}
        <section
          className={`${selectedId ? "hidden xl:flex" : "flex"} flex-col w-full xl:w-[26rem] border-r bg-white`}
          aria-label="Request list"
        >
          <div className="p-3 border-b">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search title, customer, #number"
              ariaLabel="Search requests"
            />
            <p className="text-[11px] text-gray-500 mt-2 px-1">
              {requests.length} {requests.length === 1 ? "result" : "results"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {listLoading ? (
              <ListRowSkeleton count={5} />
            ) : listError ? (
              <Card padding="lg">
                <EmptyState
                  icon={RefreshCw}
                  title="Couldn't load requests"
                  hint={listError}
                  action={<Button onClick={fetchList}>Try again</Button>}
                />
              </Card>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Nothing here"
                hint={debouncedSearch ? `No results for "${debouncedSearch}"` : "No requests match this view."}
              />
            ) : (
              <ul className="space-y-1.5">
                {requests.map((r) => {
                  const isSelected = r.id === selectedId;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => selectRequest(r.id)}
                        aria-current={isSelected ? "true" : undefined}
                        className={`w-full text-left rounded-xl border transition p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary,#3B82F6)]/30 ${
                          isSelected
                            ? "bg-[color:var(--brand-primary,#3B82F6)]/8 border-[color:var(--brand-primary,#3B82F6)]/30"
                            : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <Avatar
                            name={r.customer_name || r.customer_email}
                            role="customer"
                            size="sm"
                            className="mt-0.5"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {r.title}
                              </p>
                              <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">
                                {relTime(r.updated_at || r.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              #{r.request_number} · {r.customer_name || r.customer_email || "—"}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <StatusBadge status={r.status} size="sm" />
                              {r.budget_max && (
                                <span className="text-[10px] text-gray-500">
                                  up to {r.budget_max}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* RIGHT — conversation pane */}
        <main className={`${selectedId ? "flex" : "hidden xl:flex"} flex-col flex-1 bg-gray-50 min-w-0`} aria-label="Conversation">
          {!selectedId ? (
            <EmptyState
              icon={MessageSquareDashed}
              title="Select a request"
              hint="Pick a request on the left to see its conversation, timeline, and quote."
              className="flex-1 self-stretch justify-center"
            />
          ) : detailLoading || !detail ? (
            <div className="p-6 max-w-3xl mx-auto w-full">
              <RequestDetailSkeleton />
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
              pendingMessages={visiblePending}
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
    </div>
  );
}

// ── DetailPane ─────────────────────────────────────────────────────

function DetailPane({
  request, tenantId, canManage, actionBusy,
  reply, setReply, replyKind, setReplyKind, sending,
  pendingMessages = [],
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
      {/* Sticky header — carries the mobile back button */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              aria-label="Back to list"
              className="xl:hidden -ml-2 h-10 w-10 inline-flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold truncate">{request.title}</h2>
                <StatusBadge status={request.status} size="sm" />
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                #{request.request_number} · {request.customer_name || request.customer_email}
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            aria-label="Refresh"
            className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Conversation column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            <Card padding="lg">
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
            </Card>

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

            {/* V3.E business rule — tenant-only quote composer */}
            {canManage && !isLocked && (
              <QuoteComposer
                tenantId={tenantId}
                request={request}
                isRevision={Boolean(activeQuote)}
              />
            )}

            <Card padding="lg">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Conversation
              </h3>
              <ConversationFeed
                request={request}
                viewer="admin"
                pendingMessages={pendingMessages}
              />
            </Card>
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

        {/* Context sidebar (xl+) */}
        <aside
          className="hidden xl:flex flex-col w-72 border-l bg-white overflow-y-auto"
          aria-label="Request context"
        >
          <div className="p-4 space-y-4">
            <SectionCard title="Customer" padding="md">
              <div className="flex items-center gap-3">
                <Avatar
                  name={request.customer_name || request.customer_email}
                  role="customer"
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {request.customer_name || "—"}
                  </p>
                  {request.customer_email && (
                    <p className="text-xs text-gray-500 truncate">{request.customer_email}</p>
                  )}
                  {request.customer_phone && (
                    <p className="text-xs text-gray-500 truncate">{request.customer_phone}</p>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Provider" padding="md">
              {request.provider_name ? (
                <div className="flex items-center gap-3">
                  <Avatar name={request.provider_name} role="provider" size="md" />
                  <p className="text-sm text-gray-800 truncate">{request.provider_name}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Not assigned yet</p>
              )}
            </SectionCard>

            {canManage && (
              <div className="space-y-2">
                <ProviderAssigner
                  tenantId={tenantId}
                  requestId={request.id}
                  onAssigned={onRefresh}
                  disabled={actionBusy || isLocked}
                />
                {!isLocked && (
                  <Button
                    variant="danger" size="sm" onClick={onReject} disabled={actionBusy}
                    className="w-full"
                  >
                    Reject request
                  </Button>
                )}
                {isReopenable && (
                  <Button
                    variant="outline" size="sm" onClick={onReopen} disabled={actionBusy}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    className="w-full"
                  >
                    Reopen
                  </Button>
                )}
              </div>
            )}

            {request.converted_order && (
              <a
                href={`/dashboard/orders/${request.converted_order}`}
                className="block px-3 py-2 text-sm bg-[color:var(--brand-primary,#3B82F6)] text-[color:var(--brand-primary-fg,#fff)] rounded-xl text-center hover:brightness-110"
              >
                View order →
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

// ── Composed primitives stay file-local ────────────────────────────

function QuoteComposer({ tenantId, request, isRevision }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    price: "", currency: "SAR", delivery_days: "", revisions: 1, message: "",
  });
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    if (!request.provider_id && !request.provider) {
      toast.error("Assign a provider first — the quote is pinned to them.");
      return;
    }
    setBusy(true);
    try {
      await submitQuote(tenantId, request.id, {
        price: parseFloat(form.price),
        currency: form.currency || "SAR",
        delivery_days: parseInt(form.delivery_days, 10),
        revisions: parseInt(form.revisions || 1, 10),
        message: form.message,
      });
      toast.success(isRevision ? "Revision sent" : "Quote sent");
      setOpen(false);
      setForm({ price: "", currency: "SAR", delivery_days: "", revisions: 1, message: "" });
    } catch (err) {
      toast.error(err.message || "Failed to send quote");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition"
      >
        + {isRevision ? "Send a revised quote" : "Issue a quote to the customer"}
      </button>
    );
  }

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            {isRevision ? "Send a revised quote" : "Issue a quote"}
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <input
            type="number" step="0.01" required min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Price"
            aria-label="Price"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary,#3B82F6)]/30"
          />
          <input
            type="text"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
            placeholder="SAR"
            aria-label="Currency"
            maxLength={3}
            className="border rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary,#3B82F6)]/30"
          />
          <input
            type="number" required min="1"
            value={form.delivery_days}
            onChange={(e) => setForm({ ...form, delivery_days: e.target.value })}
            placeholder="Days"
            aria-label="Delivery days"
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary,#3B82F6)]/30"
          />
        </div>

        <textarea
          required rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="What's included, scope, deliverables…"
          aria-label="Quote message"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary,#3B82F6)]/30"
        />

        <Button type="submit" loading={busy} className="w-full">
          {isRevision ? "Send revision" : "Send quote"}
        </Button>
      </form>
    </Card>
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
      <Button
        variant="primary" size="sm"
        onClick={() => setOpen(true)} disabled={disabled}
        leftIcon={<UserPlus className="w-3.5 h-3.5" />}
        className="w-full"
      >
        Assign provider
      </Button>
    );
  }

  return (
    <div className="border rounded-xl p-3 space-y-2 bg-gray-50">
      <label className="sr-only" htmlFor="provider-select">Provider</label>
      <select
        id="provider-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={loading}
        className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white"
      >
        <option value="">{loading ? "Loading…" : "Select a provider"}</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name || p.full_name || p.email || p.id}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAssign} disabled={!selected || busy} className="flex-1">
          {busy ? "…" : "Assign"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
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
