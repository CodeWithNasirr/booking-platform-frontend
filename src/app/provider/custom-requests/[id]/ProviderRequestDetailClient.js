"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Send } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useRealtime } from "@/lib/realtime";
import { applyRequestEnvelope } from "@/lib/realtimePatches";
import DashboardLayout from "@/components/provider/DashboardLayout";
import MessageThread from "@/components/shared/CustomRequestMessageThread";
import {
  fetchProviderRequest,
  submitQuote,
  postProviderMessage,
} from "../api";

const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-800",
  negotiating: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  converted: "bg-purple-100 text-purple-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function ProviderRequestDetailClient({ id }) {
  const router = useRouter();
  const { activeTenant, t } = useApp();
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

  // Realtime: provider gets pinged when the customer/admin replies
  // or anything lands on the timeline.
  const cookieToken = (() => {
    if (typeof document === "undefined") return null;
    return document.cookie.match(/access_token=([^;]+)/)?.[1] || null;
  })();
  useRealtime({
    topics: id ? [`custom_request:${id}`] : [],
    auth: { jwt: cookieToken },
    onEvent: (envelope) => {
      if (!envelope?.entity_type) return;
      setRequest((prev) => (prev ? applyRequestEnvelope(prev, envelope) : prev));
    },
  });

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
      load();
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
      load();
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
          <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
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

  const isClosed = ["accepted", "rejected", "converted", "cancelled"].includes(request.status);
  const hasOwnQuote = (request.quotes || []).some((q) => q.status === "pending");

  return (
    <DashboardLayout pageName="Custom Request">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.push("/provider/custom-requests")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
            <h1 className="text-xl font-bold">{request.title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[request.status] || ""}`}>
              {request.status}
            </span>
          </div>
          <p className="text-xs text-gray-500">#{request.request_number}</p>
          <p className="text-gray-700 mt-4 whitespace-pre-line">{request.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 text-sm">
            {(request.budget_min || request.budget_max) && (
              <Cell label="Budget">
                {request.budget_min} {request.budget_min && request.budget_max && "– "}{request.budget_max}
              </Cell>
            )}
            {request.deadline && <Cell label="Deadline">{request.deadline}</Cell>}
            <Cell label="Customer">{request.customer_name || request.customer_email || "—"}</Cell>
          </div>
        </div>

        {/* Quotes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Your Quote</h2>
            {!isClosed && !hasOwnQuote && (
              <button
                onClick={() => setShowQuoteForm((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send className="w-4 h-4" /> Submit Quote
              </button>
            )}
          </div>

          {showQuoteForm && (
            <form onSubmit={handleSubmitQuote} className="space-y-3 bg-gray-50 rounded-lg p-4 mb-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number" step="0.01" required
                  value={quote.price}
                  onChange={(e) => setQuote({ ...quote, price: e.target.value })}
                  placeholder="Price"
                  className="border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number" required
                  value={quote.delivery_days}
                  onChange={(e) => setQuote({ ...quote, delivery_days: e.target.value })}
                  placeholder="Delivery days"
                  className="border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <textarea
                required rows={3}
                value={quote.message}
                onChange={(e) => setQuote({ ...quote, message: e.target.value })}
                placeholder="What's included"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send Quote"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(false)}
                  className="px-4 py-2 text-sm bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {(request.quotes || []).length === 0 ? (
            <p className="text-sm text-gray-400">No quotes yet.</p>
          ) : (
            <div className="space-y-2">
              {(request.quotes || []).map((q) => (
                <div key={q.id} className="border rounded-lg p-3 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{q.currency || "SAR"} {q.price}</span>
                    <span className="text-xs text-gray-500">{q.status}</span>
                  </div>
                  <p className="text-gray-600">{q.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{q.delivery_days} days · {q.revisions} revisions</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <MessageThread
          messages={request.messages || []}
          canPost={!isClosed}
          allowInfoRequest
          replyBody={replyBody}
          setReplyBody={setReplyBody}
          replyKind={replyKind}
          setReplyKind={setReplyKind}
          onSend={handleSendReply}
          sending={sendingReply}
          isRTL={false}
          t={t}
        />
      </div>
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
