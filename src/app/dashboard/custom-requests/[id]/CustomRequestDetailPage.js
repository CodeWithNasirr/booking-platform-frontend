"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import toast from "react-hot-toast";
import {
  getCustomRequest,
  assignProvider,
  submitQuote,
  acceptQuote,
  rejectQuote,
  rejectRequest,
} from "../lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  FileText,
  Paperclip,
  CheckCircle,
  XCircle,
  Send,
  ShoppingBag,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  negotiating: { label: "Negotiating", color: "bg-blue-100 text-blue-800" },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  converted: { label: "Converted", color: "bg-purple-100 text-purple-800" },
};

const QUOTE_STATUS = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
};

export default function CustomRequestDetailPage({ id }) {
  const router = useRouter();
  const { t, activeTenant, isRTL } = useApp();
  const { allowed: canManage } = useTenantPermission("custom_requests.manage");

  const tenantId = activeTenant?.id || activeTenant;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteData, setQuoteData] = useState({
    price: "",
    message: "",
    delivery_days: "",
  });

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [providerId, setProviderId] = useState("");

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomRequest(tenantId, id);
      setRequest(data);
    } catch (err) {
      if (err.status === 401) {
        router.push("/auth/login");
        return;
      }
      setError(err.message || "Failed to load request.");
    } finally {
      setLoading(false);
    }
  }, [tenantId, id, router]);

  useEffect(() => {
    if (tenantId && id) fetchRequest();
  }, [fetchRequest, tenantId, id]);

  const handleAssignProvider = async () => {
    if (!providerId) return;
    try {
      setActionLoading(true);
      await assignProvider(tenantId, id, providerId);
      toast.success(t("customRequests.providerAssigned") || "Provider assigned");
      setShowAssignForm(false);
      setProviderId("");
      fetchRequest();
    } catch (err) {
      toast.error(err.message || "Failed to assign provider");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!quoteData.price) return;
    try {
      setActionLoading(true);
      await submitQuote(tenantId, id, {
        price: parseFloat(quoteData.price),
        message: quoteData.message,
        delivery_days: quoteData.delivery_days ? parseInt(quoteData.delivery_days) : 7,
      });
      toast.success(t("customRequests.quoteSent") || "Quote submitted");
      setShowQuoteForm(false);
      setQuoteData({ price: "", message: "", delivery_days: "" });
      fetchRequest();
    } catch (err) {
      toast.error(err.message || "Failed to submit quote");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    try {
      setActionLoading(true);
      await acceptQuote(tenantId, id, quoteId);
      toast.success(t("customRequests.quoteAccepted") || "Quote accepted");
      fetchRequest();
    } catch (err) {
      toast.error(err.message || "Failed to accept quote");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectQuote = async (quoteId) => {
    try {
      setActionLoading(true);
      await rejectQuote(tenantId, id, quoteId);
      toast.success(t("customRequests.quoteRejected") || "Quote rejected");
      fetchRequest();
    } catch (err) {
      toast.error(err.message || "Failed to reject quote");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!window.confirm(t("customRequests.confirmReject") || "Are you sure you want to reject this request?")) return;
    try {
      setActionLoading(true);
      await rejectRequest(tenantId, id);
      toast.success(t("customRequests.requestRejected") || "Request rejected");
      fetchRequest();
    } catch (err) {
      toast.error(err.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewOrder = () => {
    if (request.converted_order) {
      router.push(`/dashboard/orders/${request.converted_order}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 text-lg mb-3">{error}</p>
        <button onClick={fetchRequest} className="text-blue-600 hover:underline text-sm">
          {t("common.tryAgain") || "Try again"}
        </button>
      </div>
    );
  }

  if (!request) return null;

  const sc = STATUS_CONFIG[request.status] || {};
  const quotes = request.quotes || [];
  const attachments = request.files || request.attachments || [];
  const hasAcceptedQuote = quotes.some((q) => q.status === "accepted");

  return (
    <div className={`max-w-5xl mx-auto p-6 ${isRTL ? "text-right" : ""}`}>
      <button
        onClick={() => router.push("/dashboard/custom-requests")}
        className={`flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <BackArrow className="w-4 h-4" />
        {t("common.back") || "Back to Custom Requests"}
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {request.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            #{request.request_number || request.id}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${sc.color}`}>
          {sc.label || request.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t("customRequests.details") || "Request Details"}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">
              {request.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{t("customRequests.budget") || "Budget"}:</span>
                {request.budget_min && request.budget_max
                  ? `${request.currency || "USD"} ${request.budget_min} - ${request.budget_max}`
                  : request.budget
                    ? `${request.currency || "USD"} ${request.budget}`
                    : "-"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{t("customRequests.deadline") || "Deadline"}:</span>
                {request.deadline
                  ? new Date(request.deadline).toLocaleDateString()
                  : "-"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{t("customRequests.submitted") || "Submitted"}:</span>
                {new Date(request.created_at).toLocaleDateString()}
              </div>
              {request.provider_name && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{t("customRequests.provider") || "Provider"}:</span>
                  {request.provider_name}
                </div>
              )}
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5" />
                {t("customRequests.attachments") || "Attachments"}
              </h2>
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.file || att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 rounded hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4" />
                    {att.file_name || att.name || `Attachment ${idx + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {t("customRequests.quotes") || "Quotes"} ({quotes.length})
              </h2>
              {canManage && request.status !== "rejected" && request.status !== "converted" && (
                <button
                  onClick={() => setShowQuoteForm(!showQuoteForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Send className="w-4 h-4" />
                  {t("customRequests.submitQuote") || "Submit Quote"}
                </button>
              )}
            </div>

            {showQuoteForm && (
              <form onSubmit={handleSubmitQuote} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("customRequests.quotePrice") || "Price"} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quoteData.price}
                    onChange={(e) => setQuoteData({ ...quoteData, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("customRequests.quoteMessage") || "Message"} *
                  </label>
                  <textarea
                    value={quoteData.message}
                    onChange={(e) => setQuoteData({ ...quoteData, message: e.target.value })}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("customRequests.deliveryDays") || "Delivery Days"} *
                  </label>
                  <input
                    type="number"
                    value={quoteData.delivery_days}
                    onChange={(e) => setQuoteData({ ...quoteData, delivery_days: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {actionLoading ? t("common.sending") || "Sending..." : t("common.submit") || "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuoteForm(false)}
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    {t("common.cancel") || "Cancel"}
                  </button>
                </div>
              </form>
            )}

            {quotes.length === 0 && !showQuoteForm && (
              <p className="text-sm text-gray-400 py-4">
                {t("customRequests.noQuotes") || "No quotes submitted yet"}
              </p>
            )}

            <div className="space-y-3">
              {quotes.map((quote) => {
                const qs = QUOTE_STATUS[quote.status] || {};
                return (
                  <div key={quote.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <div>
                        <span className="text-lg font-semibold">
                          {quote.currency || request.currency || "SAR"} {parseFloat(quote.price).toFixed(2)}
                        </span>
                        {quote.delivery_days && (
                          <span className="text-sm text-gray-500 ml-3">
                            {quote.delivery_days} {t("customRequests.days") || "days"}
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${qs.color}`}>
                        {qs.label || quote.status}
                      </span>
                    </div>
                    {quote.message && (
                      <p className="text-sm text-gray-600 mb-3">{quote.message}</p>
                    )}
                    {quote.provider_name && (
                      <p className="text-xs text-gray-400 mb-2">
                        {t("customRequests.by") || "By"}: {quote.provider_name}
                      </p>
                    )}
                    {canManage && quote.status === "pending" && (
                      <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <button
                          onClick={() => handleAcceptQuote(quote.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {t("common.accept") || "Accept"}
                        </button>
                        <button
                          onClick={() => handleRejectQuote(quote.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {t("common.reject") || "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {t("customRequests.customer") || "Customer"}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                {request.customer_name || "-"}
              </div>
              {request.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {request.customer_email}
                </div>
              )}
              {request.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {request.customer_phone}
                </div>
              )}
            </div>
          </div>

          {canManage && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">
                {t("customRequests.actions") || "Actions"}
              </h2>
              <div className="space-y-3">
                {request.status !== "rejected" && request.status !== "converted" && (
                  <button
                    onClick={() => setShowAssignForm(!showAssignForm)}
                    className="w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    {t("customRequests.assignProvider") || "Assign Provider"}
                  </button>
                )}

                {showAssignForm && (
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <input
                      type="text"
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value)}
                      placeholder={t("customRequests.providerIdPlaceholder") || "Provider ID"}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <button
                        onClick={handleAssignProvider}
                        disabled={actionLoading || !providerId}
                        className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                      >
                        {t("common.assign") || "Assign"}
                      </button>
                      <button
                        onClick={() => { setShowAssignForm(false); setProviderId(""); }}
                        className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      >
                        {t("common.cancel") || "Cancel"}
                      </button>
                    </div>
                  </div>
                )}

                {request.converted_order && (
                  <button
                    onClick={handleViewOrder}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {t("customRequests.viewOrder") || "View Order"}
                  </button>
                )}

                {request.status !== "rejected" && request.status !== "converted" && (
                  <button
                    onClick={handleRejectRequest}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {t("customRequests.rejectRequest") || "Reject Request"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
