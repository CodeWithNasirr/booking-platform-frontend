"use client";

/**
 * ProviderRequestDetailClient — V3.F.3.
 *
 * Two-column on desktop (conversation left, context sidebar
 * right), single-column on mobile with the sidebar collapsed
 * below the conversation. The provider sees:
 *
 *   - request context (customer + tenant + dates + budget)
 *   - active quote (read-only — the tenant owns pricing)
 *   - attachments
 *   - the conversation thread
 *   - a sticky composer
 *
 * No quote creation, no provider assignment, no customer
 * management. V3.E business rule.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, RefreshCw, MessageCircle, User, Calendar, Wallet } from "lucide-react";

import { useApp } from "@/contexts/AppContext";
import { useRealtime } from "@/lib/realtime";
import { applyRequestEnvelope } from "@/lib/realtimePatches";
import DashboardLayout from "@/components/provider/DashboardLayout";

import {
  StatusBadge,
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
  Avatar,
  BrandRoot,
} from "@/components/ui";

import { fetchProviderRequest, postProviderMessage } from "../api";

export default function ProviderRequestDetailClient({ id }) {
  return (
    <DashboardLayout pageName="Custom Request">
      <BrandRoot className="contents">
        <Inner id={id} />
      </BrandRoot>
    </DashboardLayout>
  );
}

function Inner({ id }) {
  const router = useRouter();
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [replyBody, setReplyBody] = useState("");
  const [replyKind, setReplyKind] = useState("message");
  const [sendingReply, setSendingReply] = useState(false);
  // Optimistic outbound queue — local placeholders rendered as
  // "Sending…" until realtime echoes the persisted row.
  const [pendingMessages, setPendingMessages] = useState([]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchProviderRequest(tenantId, id);
      setRequest(data);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [tenantId, id]);

  useEffect(() => { load(); }, [load]);

  const cookieToken = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.cookie.match(/access_token=([^;]+)/)?.[1] || null;
  }, []);

  useRealtime({
    topics: id ? [`custom_request:${id}`] : [],
    auth: { jwt: cookieToken },
    onEvent: (envelope) => {
      if (!envelope?.entity_type) return;
      setRequest((prev) => (prev ? applyRequestEnvelope(prev, envelope) : prev));
    },
    onReconnect: () => { load(); },
  });

  const isLocked = TERMINAL_STATUSES.has(request?.status);
  const activeQuote = useMemo(() => {
    if (!request?.quotes) return null;
    return request.quotes.find((q) => q.status === "pending" || q.status === "countered")
      || request.quotes[0] || null;
  }, [request]);

  async function handleSendReply() {
    const body = replyBody.trim();
    if (!body || sendingReply) return;
    const optimistic = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      body,
      at: new Date().toISOString(),
      author_role: "provider",
      author_name: "You",
    };
    setPendingMessages((q) => [...q, optimistic]);
    const restoreBody = body;
    const restoreKind = replyKind;
    setReplyBody("");
    setReplyKind("message");
    setSendingReply(true);
    try {
      await postProviderMessage(tenantId, id, body, restoreKind);
      // Realtime echoes the persisted message;
      // the reconciliation effect below drops the pending entry.
    } catch (err) {
      setPendingMessages((q) => q.filter((m) => m.id !== optimistic.id));
      setReplyBody(restoreBody);
      setReplyKind(restoreKind);
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingReply(false);
    }
  }

  useEffect(() => {
    if (pendingMessages.length === 0 || !request?.messages?.length) return;
    const now = Date.now();
    const stillPending = pendingMessages.filter((p) => {
      const match = request.messages.find((m) =>
        m.author_role === "provider"
        && (m.body || "").trim() === p.body.trim()
        && now - new Date(m.created_at).getTime() < 5 * 60 * 1000,
      );
      return !match;
    });
    if (stillPending.length !== pendingMessages.length) {
      setPendingMessages(stillPending);
    }
  }, [pendingMessages, request?.messages]);

  // ── Render guards ───────────────────────────────────────────────
  if (loading && !request) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <RequestDetailSkeleton />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <Card padding="lg">
          <EmptyState
            icon={RefreshCw}
            title="Couldn't load this request"
            hint={error || "Try refreshing — the tenant may have unassigned it."}
            action={(
              <Button onClick={() => router.push("/provider/custom-requests")}>
                Back to inbox
              </Button>
            )}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-32">
      {/* Back affordance — real tap target */}
      <div className="mb-4">
        <button
          onClick={() => router.push("/provider/custom-requests")}
          className="inline-flex items-center gap-1.5 h-10 px-3 -ml-3 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to inbox</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Conversation column */}
        <div className="space-y-4 min-w-0">
          <Card padding="lg" className="space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-mono">#{request.request_number}</p>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">{request.title}</h1>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <StatusTimeline status={request.status} />
            <p className="text-gray-700 whitespace-pre-line text-[15px] leading-relaxed">
              {request.description}
            </p>
          </Card>

          {activeQuote && <QuoteCard quote={activeQuote} />}

          {request.files?.length > 0 && (
            <Card padding="lg">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Attachments
              </h2>
              <AttachmentGrid files={request.files} />
            </Card>
          )}

          <Card padding="lg">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" />
              Conversation
            </h2>
            <ConversationFeed
              request={request}
              viewer="provider"
              pendingMessages={pendingMessages}
            />
          </Card>
        </div>

        {/* Context sidebar (collapses below on mobile) */}
        <aside className="space-y-4">
          <Card padding="lg">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Customer
            </h2>
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
          </Card>

          <Card padding="lg">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Brief
            </h2>
            <dl className="space-y-2.5 text-sm">
              {(request.budget_min || request.budget_max) && (
                <div className="flex items-start gap-2">
                  <Wallet className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-gray-500">Budget</dt>
                    <dd className="text-gray-800">
                      {request.budget_min || ""}
                      {request.budget_min && request.budget_max && " – "}
                      {request.budget_max || ""}
                    </dd>
                  </div>
                </div>
              )}
              {request.deadline && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-gray-500">Deadline</dt>
                    <dd className="text-gray-800">{request.deadline}</dd>
                  </div>
                </div>
              )}
              {request.created_at && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-gray-500">Submitted</dt>
                    <dd className="text-gray-800">
                      {new Date(request.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </div>
              )}
              {request.provider_name && (
                <div className="flex items-start gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-gray-500">Assigned to</dt>
                    <dd className="text-gray-800">{request.provider_name}</dd>
                  </div>
                </div>
              )}
            </dl>
          </Card>

          {/* Tenant-owned actions — surfaced as a quiet note, not
              buttons. Reminds the provider these decisions live
              with the tenant. */}
          <Card padding="lg" variant="inset">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-700">Quotes and approvals</span> are managed
              by the tenant. Share context in the conversation and the team will price the work
              for the customer.
            </p>
          </Card>
        </aside>
      </div>

      <StickyComposer
        value={replyBody}
        onChange={setReplyBody}
        onSend={handleSendReply}
        sending={sendingReply}
        disabled={isLocked}
        locked={isLocked}
        lockedMessage="This request is locked."
        allowKind
        kind={replyKind}
        onKindChange={setReplyKind}
        sticky
      />
    </div>
  );
}
