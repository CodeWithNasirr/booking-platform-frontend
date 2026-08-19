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

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import { useRealtime } from "@/lib/realtime";
import {
  applyRequestEnvelope, applyTenantRequestSummary, applyOrderEnvelope,
} from "@/lib/realtimePatches";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  RefreshCw,
  RotateCcw,
  UserPlus,
  Inbox,
  MessageSquareDashed,
  Clock,
  Loader2,
  CheckCircle,
  ShoppingBag,
  MoreVertical,
  MessageSquare,
  LayoutPanelLeft,
  History,
  Paperclip,
  SearchX,
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
  fetchOrderSummary,
} from "./lib/api";
import {
  StatusBadge,
  ConversationFeed,
  QuoteCard,
  StickyComposer,
  PostAcceptanceCard,
  AttachmentGrid,
  StatusTimeline,
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
  IconButton,
  Badge,
  Tabs,
  Drawer,
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
  // Unread tracking — populated from tenant-feed envelopes on
  // non-selected rows; cleared when the admin selects a row.
  // In-memory only (no backend "read receipt" needed yet).
  const [unreadIds, setUnreadIds] = useState(() => new Set());
  // Per-row toast throttle so a chatty thread doesn't spam.
  const lastToastAtRef = useRef(new Map());

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

  // Order summary for the selected detail. Soft fetch — admins
  // can read any order in the tenant; failures degrade the
  // PostAcceptanceCard to the generic shape without inline
  // status pill or price.
  const [detailOrder, setDetailOrder] = useState(null);
  const fetchDetailOrder = useCallback(async () => {
    const orderId = detail?.converted_order;
    const inScope = ["converted", "completed"].includes(detail?.status);
    if (!orderId || !inScope || !tenantId) {
      setDetailOrder(null);
      return;
    }
    try {
      const data = await fetchOrderSummary(tenantId, orderId);
      setDetailOrder(data);
    } catch {
      setDetailOrder(null);
    }
  }, [detail?.converted_order, detail?.status, tenantId]);

  useEffect(() => { fetchDetailOrder(); }, [fetchDetailOrder]);

  const refreshBoth = useCallback(async () => {
    await Promise.all([fetchList(), fetchDetail(), fetchDetailOrder()]);
  }, [fetchList, fetchDetail, fetchDetailOrder]);

  // ── Realtime ────────────────────────────────────────────────────
  const cookieToken = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.cookie.match(/access_token=([^;]+)/)?.[1] || null;
  }, []);
  const orderTopicId = detail?.converted_order;
  const realtimeTopics = useMemo(() => {
    const t = [];
    if (tenantId) t.push(`tenant:${tenantId}:requests`);
    if (selectedId) t.push(`custom_request:${selectedId}`);
    if (orderTopicId) t.push(`order:${orderTopicId}`);
    return t;
  }, [tenantId, selectedId, orderTopicId]);

  useRealtime({
    topics: realtimeTopics,
    auth: { jwt: cookieToken },
    onEvent: (envelope) => {
      if (!envelope?.entity_type) return;
      if (envelope.entity_type === "custom_request.summary") {
        setRequests((prev) => applyTenantRequestSummary(prev, envelope));
        const id = envelope.payload?.id || envelope.entity_id;
        if (id && id !== selectedId) {
          // Mark unread + announce. Selected rows skip both.
          setUnreadIds((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
          });
          announceActivity(id, envelope.payload);
        }
        return;
      }
      if (envelope.entity_type.startsWith("order.")) {
        setDetailOrder((prev) => applyOrderEnvelope(prev, envelope));
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

  // Whenever the selected request changes, drop it from the
  // unread set — opening the conversation IS the read action.
  useEffect(() => {
    if (!selectedId) return;
    setUnreadIds((prev) => {
      if (!prev.has(selectedId)) return prev;
      const next = new Set(prev);
      next.delete(selectedId);
      return next;
    });
  }, [selectedId]);

  // Toast helper — brand-tinted, throttled per request, click to
  // jump straight to the conversation. Uses toast.custom so the
  // tile renders the actual request title + customer line.
  const announceActivity = useCallback((id, payload) => {
    if (id === selectedId) return;
    const now = Date.now();
    const last = lastToastAtRef.current.get(id) || 0;
    if (now - last < 5000) return;
    lastToastAtRef.current.set(id, now);

    const title = payload?.title || "Custom request";
    const customer = payload?.customer_name || payload?.customer_email || "";

    toast.custom((t) => (
      <button
        type="button"
        onClick={() => { toast.dismiss(t.id); selectRequest(id); }}
        className={`${t.visible ? "animate-in" : "animate-out"} max-w-sm w-full bg-white border border-gray-100 shadow-lg rounded-2xl px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50`}
      >
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full mt-2 bg-[color:var(--brand-primary,#3B82F6)] shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
          <p className="text-xs text-gray-500 truncate">
            New activity{customer ? ` · ${customer}` : ""}
          </p>
        </div>
        <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 uppercase tracking-wide font-semibold">
          Open
        </span>
      </button>
    ), { duration: 4500 });
  }, [selectedId, router]);  // selectRequest reads searchParams via router; safe

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

  // Unread broken down per status so each filter row can show
  // both the total count and how many are unread within it.
  const unreadCounts = useMemo(() => {
    const m = { all: 0 };
    for (const r of requests) {
      if (!unreadIds.has(r.id)) continue;
      m.all += 1;
      m[r.status] = (m[r.status] || 0) + 1;
    }
    return m;
  }, [requests, unreadIds]);

  const filterOptions = useMemo(() => FILTERS.map((s) => ({
    value: s,
    label: s === "all" ? "All" : (STATUS_TONE[s]?.label || s),
    count: counts[s] || 0,
    unread: unreadCounts[s] || 0,
    tone: FILTER_TONES[s],
  })), [counts, unreadCounts]);

  // KPI summary (task: New / Pending / In progress / Converted / Closed)
  const kpis = [
    { key: "new", label: "New requests", value: counts.pending || 0, icon: Inbox, chip: "bg-accent text-accent-foreground" },
    { key: "pending", label: "Pending", value: counts.quoted || 0, icon: Clock, chip: "bg-warning-soft text-warning-soft-foreground" },
    { key: "inprogress", label: "In progress", value: (counts.negotiating || 0) + (counts.accepted || 0), icon: Loader2, chip: "bg-info-soft text-info-soft-foreground" },
    { key: "converted", label: "Converted", value: counts.converted || 0, icon: ShoppingBag, chip: "bg-success-soft text-success-soft-foreground" },
    { key: "closed", label: "Closed", value: (counts.completed || 0) + (counts.rejected || 0) + (counts.cancelled || 0), icon: CheckCircle, chip: "bg-muted text-muted-foreground" },
  ];

  const hasActiveFilters = Boolean(debouncedSearch) || statusFilter !== "all";

  // ── Render ──────────────────────────────────────────────────────
  // DETAIL screen
  if (selectedId) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
        {detailLoading || !detail ? (
          <div className="max-w-3xl mx-auto w-full"><RequestDetailSkeleton /></div>
        ) : (
          <DetailPane
            request={detail}
            order={detailOrder}
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
      </div>
    );
  }

  // LIST screen
  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Custom Requests</h1>
            <span className="inline-flex items-center px-2 h-6 rounded-full bg-muted text-muted-foreground text-xs font-semibold tabular-nums">
              {requests.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{pulse}</p>
        </div>
        <Button variant="secondary" size="md" onClick={fetchList} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.chip}`}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search title, customer, #number"
          ariaLabel="Search requests"
        />
        <FilterBar value={statusFilter} onChange={setStatusFilter} options={filterOptions} ariaLabel="Status filters" />
      </div>

      {/* List states */}
      {listLoading ? (
        <div className="space-y-3">
          <div className="hidden md:block rounded-xl border border-border bg-card p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse m-2" />
            ))}
          </div>
          <div className="md:hidden"><ListRowSkeleton count={5} /></div>
        </div>
      ) : listError ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState icon={RefreshCw} title="Couldn't load requests" hint={listError} action={<Button variant="primary" onClick={fetchList}>Try again</Button>} />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={hasActiveFilters ? SearchX : Inbox}
            title="No requests found"
            hint={debouncedSearch ? `No results for "${debouncedSearch}"` : hasActiveFilters ? "No requests match this filter." : "Custom requests will appear here."}
          />
        </div>
      ) : (
        <RequestList requests={requests} unreadIds={unreadIds} onOpen={selectRequest} />
      )}
    </div>
  );
}

// ── List (desktop table + mobile cards) ────────────────────────────
function RequestList({ requests, unreadIds, onOpen }) {
  const cols = ["customer", "title", "activity", "status", "unread"];
  const labels = { customer: "Customer", title: "Request", activity: "Last activity", status: "Status", unread: "Unread" };
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {cols.map((c) => (
                  <th key={c} className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${c === "unread" ? "text-end" : "text-start"}`}>
                    {labels[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((r) => {
                const unread = unreadIds.has(r.id);
                return (
                  <tr key={r.id} onClick={() => onOpen(r.id)} className="cursor-pointer hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.customer_name || r.customer_email} role="customer" size="sm" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate max-w-[180px]">{r.customer_name || "—"}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">{r.customer_email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground truncate max-w-[280px]">{r.title}</div>
                      <div className="text-xs text-muted-foreground">#{r.request_number}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-muted-foreground">{relTime(r.updated_at || r.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={r.status} size="sm" /></td>
                    <td className="px-4 py-3 whitespace-nowrap text-end">
                      {unread
                        ? <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">•</span>
                        : <span className="text-muted-foreground/50">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {requests.map((r) => {
          const unread = unreadIds.has(r.id);
          return (
            <button
              key={r.id}
              onClick={() => onOpen(r.id)}
              className="w-full text-start rounded-xl border border-border bg-card p-4 active:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`font-semibold text-foreground truncate ${unread ? "font-bold" : ""}`}>{r.title}</span>
                  {unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
                <StatusBadge status={r.status} size="sm" className="shrink-0" />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">#{r.request_number}</div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={r.customer_name || r.customer_email} role="customer" size="sm" />
                  <span className="text-sm text-foreground truncate">{r.customer_name || r.customer_email || "—"}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{relTime(r.updated_at || r.created_at)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── DetailPane ─────────────────────────────────────────────────────

function DetailPane({
  request, order, tenantId, canManage, actionBusy,
  reply, setReply, replyKind, setReplyKind, sending,
  pendingMessages = [],
  onSend, onClose, onRefresh, onReject, onReopen,
  onAcceptQuote, onRejectQuote,
}) {
  const [tab, setTab] = useState("chat"); // mobile: request | chat | activity
  const [showActions, setShowActions] = useState(false);

  const isLocked = TERMINAL_STATUSES.has(request.status);
  const isReopenable = ["rejected", "cancelled", "completed"].includes(request.status);
  const isPostAcceptance =
    ["converted", "completed", "rejected", "cancelled"].includes(request.status);

  const activeQuote = useMemo(() => {
    return (request.quotes || []).find((q) => q.status === "pending" || q.status === "countered")
      || (request.quotes || [])[0];
  }, [request]);

  const files = request.files || request.attachments || [];
  const hide = (name) => (tab !== name ? "max-lg:hidden" : "");
  const customer = request.customer_name || request.customer_email || "—";
  const hasActions = canManage;

  const tabItems = [
    { value: "request", label: "Request", icon: LayoutPanelLeft },
    { value: "chat", label: "Chat", icon: MessageSquare },
    { value: "activity", label: "Activity", icon: History },
  ];

  // Request context block (description + budget + attachments + quote)
  const requestBlock = (
    <div className={`space-y-4 ${hide("request")}`}>
      <section className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm text-foreground whitespace-pre-line">{request.description}</p>
        <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
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
      </section>

      {files.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attachments</h3>
          </div>
          <AttachmentGrid files={files} />
        </section>
      )}

      {!isPostAcceptance && activeQuote && (
        <QuoteCard
          quote={activeQuote}
          canAccept={canManage && !isLocked}
          canReject={canManage && !isLocked}
          disabled={actionBusy}
          onAccept={() => onAcceptQuote(activeQuote.id)}
          onReject={() => onRejectQuote(activeQuote.id)}
        />
      )}

      {!isPostAcceptance && canManage && !isLocked && (
        <QuoteComposer tenantId={tenantId} request={request} isRevision={Boolean(activeQuote)} />
      )}

      {isPostAcceptance && (
        <PostAcceptanceCard
          request={request}
          order={order}
          viewer="admin"
          providerName={request.provider_name}
          customerName={request.customer_name || request.customer_email}
          orderHref={request.converted_order ? `/dashboard/orders/${request.converted_order}` : null}
        />
      )}
    </div>
  );

  // Conversation (bounded panel, pinned composer)
  const chatBlock = (
    <div className={`${hide("chat")} rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[70vh] min-h-[440px]`}>
      <div className="hidden lg:flex items-center gap-2 px-4 h-12 border-b border-border shrink-0">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Conversation</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <ConversationFeed request={request} viewer="admin" pendingMessages={pendingMessages} />
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
  );

  // Activity block
  const activityBlock = (
    <div className={`space-y-4 ${hide("activity")}`}>
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</h3>
        </div>
        <StatusTimeline status={request.status} />
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex items-baseline justify-between gap-3 py-1">
            <span className="text-muted-foreground">Submitted</span>
            <span className="text-foreground">{relTime(request.created_at)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 py-1">
            <span className="text-muted-foreground">Last activity</span>
            <span className="text-foreground">{relTime(request.updated_at || request.created_at)}</span>
          </div>
        </div>
      </section>
    </div>
  );

  // Sidebar info (customer + provider + converted link)
  const infoCards = (
    <div className={`space-y-4 ${hide("request")}`}>
      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Customer</h3>
        <div className="flex items-center gap-3">
          <Avatar name={request.customer_name || request.customer_email} role="customer" size="lg" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{request.customer_name || "—"}</p>
            {request.customer_email && <p className="text-xs text-muted-foreground truncate">{request.customer_email}</p>}
            {request.customer_phone && <p className="text-xs text-muted-foreground truncate">{request.customer_phone}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Provider</h3>
        {request.provider_name ? (
          <div className="flex items-center gap-3">
            <Avatar name={request.provider_name} role="provider" size="md" />
            <p className="text-sm text-foreground truncate">{request.provider_name}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not assigned yet</p>
        )}
      </section>

      {request.converted_order && (
        <a
          href={`/dashboard/orders/${request.converted_order}`}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted"
        >
          <ShoppingBag className="w-4 h-4" />
          Open order page
        </a>
      )}
    </div>
  );

  // Actions group (assign / reject / reopen)
  const actionsGroup = (
    <div className="space-y-2">
      <ProviderAssigner
        tenantId={tenantId}
        requestId={request.id}
        onAssigned={onRefresh}
        disabled={actionBusy || isLocked}
      />
      {!isLocked && (
        <Button variant="secondary" size="md" onClick={onReject} disabled={actionBusy} className="w-full text-danger border-danger/30 hover:bg-danger-soft">
          Reject request
        </Button>
      )}
      {isReopenable && (
        <Button variant="outline" size="md" onClick={onReopen} disabled={actionBusy} leftIcon={<RotateCcw className="w-4 h-4" />} className="w-full">
          Reopen
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Header */}
      <header className="rounded-xl border border-border bg-card p-4 mb-4">
        <div className="flex items-center gap-3">
          <IconButton label="Back to requests" icon={ArrowLeft} variant="ghost" onClick={onClose} className="shrink-0" />
          <div className="w-10 h-10 hidden sm:block shrink-0">
            <Avatar name={request.customer_name || request.customer_email} role="customer" size="lg" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h1 className="text-lg font-bold text-foreground truncate">{request.title}</h1>
              <span className="text-xs font-mono text-muted-foreground">#{request.request_number}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground truncate">{customer}</span>
              <StatusBadge status={request.status} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <IconButton label="Refresh" icon={RefreshCw} variant="outline" onClick={onRefresh} />
            {hasActions && (
              <IconButton label="Actions" icon={MoreVertical} variant="outline" onClick={() => setShowActions(true)} className="lg:hidden" />
            )}
          </div>
        </div>
      </header>

      {/* Mobile segmented navigation */}
      <div className="lg:hidden mb-4">
        <Tabs value={tab} onChange={setTab} items={tabItems} variant="segment" className="w-full" />
      </div>

      {/* Workspace */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 lg:items-start">
        <div className="space-y-4 min-w-0">
          {requestBlock}
          {chatBlock}
          {activityBlock}
        </div>
        <aside className="mt-4 lg:mt-0 lg:sticky lg:top-4 space-y-4">
          {infoCards}
          {hasActions && <div className="hidden lg:block">{actionsGroup}</div>}
        </aside>
      </div>

      {/* Mobile actions bottom sheet */}
      {hasActions && (
        <Drawer open={showActions} onClose={() => setShowActions(false)} side="bottom" title="Actions">
          {actionsGroup}
        </Drawer>
      )}
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
