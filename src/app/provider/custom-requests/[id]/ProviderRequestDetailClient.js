"use client";

/**
 * ProviderRequestDetailClient
 *
 * Composed from the shared @/components/custom-requests primitives
 * so the provider view matches the customer and tenant CRM
 * presentation. Provider-specific bits are quote submission +
 * info_request kind on the composer.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Send } from "lucide-react";
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
  submitQuote,
  postProviderMessage,
} from "../api";

export default function ProviderRequestDetailClient({ id }) {
  const router = useRouter();
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quote, setQuote] = useState({ price: "", delivery_days: "", message: "", revisions: 1 });
  const [submitting, setSubmitting] = useState(false);

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
  const hasOwnActive = (request?.quotes || []).some((q) => q.status === "pending" || q.status === "countered");

  async function handleSubmitQuote(e) {
    e.preventDefault();
    if (!quote.price || !quote.message || !quote.delivery_days || submitting) return;
    setSubmitting(true);
    try {
      await submitQuote(tenantId, id, {
        price: parseFloat(quote.price),
        delivery_days: parseInt(quote.delivery_days, 10),
        revisions: parseInt(quote.revisions || 1, 10),
        message: quote.message,
      });
      toast.success("Quote sent");
      setShowQuoteForm(false);
      setQuote({ price: "", delivery_days: "", message: "", revisions: 1 });
    } catch (err) {
      toast.error(err.message || "Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  }

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

        {/* Active quote (read-only for provider; provider sends new revisions via form) */}
        {activeQuote && (
          <QuoteCard quote={activeQuote} />
        )}

        {/* Submit-quote form */}
        {!isLocked && !hasOwnActive && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase text-gray-500 tracking-wide">
                Your quote
              </h2>
              <button
                onClick={() => setShowQuoteForm((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send className="w-4 h-4" /> {showQuoteForm ? "Cancel" : "Submit quote"}
              </button>
            </div>
            {showQuoteForm && (
              <form onSubmit={handleSubmitQuote} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number" step="0.01" required
                    value={quote.price}
                    onChange={(e) => setQuote({ ...quote, price: e.target.value })}
                    placeholder="Price"
                    aria-label="Price"
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number" required
                    value={quote.delivery_days}
                    onChange={(e) => setQuote({ ...quote, delivery_days: e.target.value })}
                    placeholder="Delivery days"
                    aria-label="Delivery days"
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  required rows={3}
                  value={quote.message}
                  onChange={(e) => setQuote({ ...quote, message: e.target.value })}
                  placeholder="What's included"
                  aria-label="Quote message"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send quote"}
                </button>
              </form>
            )}
          </div>
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
