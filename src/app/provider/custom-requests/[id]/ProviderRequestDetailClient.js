"use client";

/**
 * ProviderRequestDetailClient
 *
 * Business rule (V3.E): the provider does NOT issue quotes.
 * Quotes belong to the tenant. The provider participates in the
 * conversation, can share context with the tenant (including
 * info_request style notes), uploads files, and watches quote
 * status. Pricing decisions are the tenant's.
 *
 * Composed from the shared @/components/custom-requests primitives
 * so the provider view stays visually consistent with the
 * customer portal and tenant CRM.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
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
  RequestDetailSkeleton,
  TERMINAL_STATUSES,
} from "@/components/custom-requests";

import {
  fetchProviderRequest,
  postProviderMessage,
} from "../api";

export default function ProviderRequestDetailClient({ id }) {
  const router = useRouter();
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [replyBody, setReplyBody] = useState("");
  const [replyKind, setReplyKind] = useState("message");
  const [sendingReply, setSendingReply] = useState(false);

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
    setSendingReply(true);
    try {
      await postProviderMessage(tenantId, id, body, replyKind);
      setReplyBody("");
      setReplyKind("message");
    } catch (err) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingReply(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout pageName="Custom Request">
        <div className="p-6 max-w-4xl mx-auto">
          <RequestDetailSkeleton />
        </div>
      </DashboardLayout>
    );
  }
  if (error || !request) {
    return (
      <DashboardLayout pageName="Custom Request">
        <div className="p-6 max-w-4xl mx-auto text-center">
          <p className="text-red-600">{error || "Request not found"}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageName="Custom Request">
      <div className="p-6 max-w-4xl mx-auto space-y-6 pb-32">
        <button
          onClick={() => router.push("/provider/custom-requests")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <h1 className="text-xl font-bold">{request.title}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-xs text-gray-500">#{request.request_number}</p>
          <p className="text-gray-700 mt-4 whitespace-pre-line">{request.description}</p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 text-sm">
            {(request.budget_min || request.budget_max) && (
              <Cell label="Budget">
                {request.budget_min} {request.budget_min && request.budget_max && "– "}{request.budget_max}
              </Cell>
            )}
            {request.deadline && <Cell label="Deadline">{request.deadline}</Cell>}
            <Cell label="Customer">{request.customer_name || request.customer_email || "—"}</Cell>
          </dl>
        </div>

        {/* Quote is read-only here. Providers can see status and
            history but cannot create or revise quotes — the
            tenant owns the customer-facing pricing decision. */}
        {activeQuote && (
          <QuoteCard quote={activeQuote} />
        )}

        {request.files?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h2>
            <AttachmentGrid files={request.files} />
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Conversation</h2>
          <ConversationFeed request={request} viewer="provider" />
        </div>
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
    </DashboardLayout>
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
