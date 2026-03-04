"use client";

/**
 * CustomerOrdersDashboard.js
 *
 * Customer-facing order list + detail view.
 * Route: /orders (list) or /orders/{id} (detail)
 *
 * Features:
 *  - Filter by status
 *  - View order details + files + messages
 *  - Accept delivery / request revision
 *  - Leave review
 */

import { useState, useEffect, useRef } from "react";
import { useTenantLang } from "../contexts/TenantLangContext";
import { useTenantTheme } from "../contexts/TenantThemeContext";
import { resolveTranslated } from "../[domain]/utils/resolveTranslated";
import {
  fetchMyOrders,
  fetchOrderDetail,
  acceptDelivery,
  requestRevision,
  cancelOrder,
  sendOrderMessage,
  fetchOrderMessages,
  getStatusConfig,
} from "@/lib/orderApi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function CustomerOrdersDashboard({ domain, token, orderId = null }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = language;

  // If orderId is provided, show detail view directly
  if (orderId) {
    return <OrderDetailView domain={domain} token={token} orderId={orderId} theme={theme} lang={lang} isRTL={isRTL} />;
  }

  return <OrderListView domain={domain} token={token} theme={theme} lang={lang} isRTL={isRTL} />;
}

// =============================================================================
// ORDER LIST VIEW
// =============================================================================
function OrderListView({ domain, token, theme, lang, isRTL }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, [filter]);

  async function loadOrders() {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "all") params.status = filter;
      const data = await fetchMyOrders(domain, token, params);
      setOrders(data.results || data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filters = [
    { key: "all", label: { en: "All", ar: "الكل", ur: "سب" } },
    { key: "in_progress", label: { en: "In Progress", ar: "قيد التنفيذ", ur: "جاری" } },
    { key: "delivered", label: { en: "Delivered", ar: "تم التسليم", ur: "ڈیلیور" } },
    { key: "completed", label: { en: "Completed", ar: "مكتمل", ur: "مکمل" } },
    { key: "revision_requested", label: { en: "Revisions", ar: "المراجعات", ur: "ریویژنز" } },
  ];

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? "rtl" : ""}`}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {resolveTranslated({ en: "My Orders", ar: "طلباتي", ur: "میرے آرڈرز" }, lang)}
      </h1>

      {/* Filters */}
      <div className={`flex gap-2 mb-6 overflow-x-auto pb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key ? "text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            style={{ backgroundColor: filter === f.key ? theme.primary_color || "#3B82F6" : undefined }}
          >
            {resolveTranslated(f.label, lang)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500">
            {resolveTranslated({ en: "No orders found", ar: "لم يتم العثور على طلبات", ur: "کوئی آرڈر نہیں ملا" }, lang)}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} theme={theme} lang={lang} isRTL={isRTL} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, theme, lang, isRTL }) {
  const status = getStatusConfig(order.status);
  return (
    <a
      href={`/orders/${order.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className={`flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-900">{order.order_number}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
              {status.icon} {status.label}
            </span>
          </div>
          <p className="text-gray-600 text-sm">{order.service_name}</p>
          {order.provider_name && (
            <p className="text-gray-400 text-xs mt-1">
              {resolveTranslated({ en: "Provider:", ar: "مقدم الخدمة:", ur: "فراہم کنندہ:" }, lang)} {order.provider_name}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: theme.primary_color || "#3B82F6" }}>
            ${Number(order.total_amount).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(order.created_at).toLocaleDateString()}
          </p>
          {order.is_overdue && (
            <span className="text-xs text-red-500 font-medium">
              {resolveTranslated({ en: "Overdue", ar: "متأخر", ur: "تاخیر" }, lang)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// =============================================================================
// ORDER DETAIL VIEW
// =============================================================================
function OrderDetailView({ domain, token, orderId, theme, lang, isRTL }) {
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [revisionMessage, setRevisionMessage] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    try {
      const data = await fetchOrderDetail(domain, token, orderId);
      setOrder(data);
      setMessages(data.messages || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptDelivery() {
    setActionLoading(true);
    try {
      await acceptDelivery(domain, token, orderId, showReview ? reviewData : null);
      await loadOrder();
      setShowReview(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRequestRevision() {
    if (!revisionMessage.trim()) return;
    setActionLoading(true);
    try {
      await requestRevision(domain, token, orderId, revisionMessage);
      setRevisionMessage("");
      setShowRevisionForm(false);
      await loadOrder();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm(resolveTranslated({ en: "Cancel this order?", ar: "إلغاء هذا الطلب؟", ur: "یہ آرڈر منسوخ کریں؟" }, lang))) return;
    setActionLoading(true);
    try {
      await cancelOrder(domain, token, orderId);
      await loadOrder();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim()) return;
    try {
      const msg = await sendOrderMessage(domain, token, orderId, newMessage);
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-gray-500">{error || "Order not found"}</p>
      </div>
    );
  }

  const status = getStatusConfig(order.status);

  return (
    <div className={`max-w-3xl mx-auto p-6 space-y-6 ${isRTL ? "rtl" : ""}`}>
      {/* Header */}
      <div className={`flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${status.color}`}>
              {status.icon} {status.label}
            </span>
          </div>
          <p className="text-gray-600">{order.service_name}</p>
        </div>
        <p className="text-2xl font-bold" style={{ color: theme.primary_color || "#3B82F6" }}>
          ${Number(order.total_amount).toFixed(2)}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Order Info */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <Row label={resolveTranslated({ en: "Provider", ar: "مقدم الخدمة", ur: "فراہم کنندہ" }, lang)} value={order.provider_name || "—"} isRTL={isRTL} />
        <Row label={resolveTranslated({ en: "Ordered", ar: "تاريخ الطلب", ur: "آرڈر کی تاریخ" }, lang)} value={new Date(order.created_at).toLocaleDateString()} isRTL={isRTL} />
        {order.due_date && (
          <Row label={resolveTranslated({ en: "Due Date", ar: "تاريخ الاستحقاق", ur: "آخری تاریخ" }, lang)} value={new Date(order.due_date).toLocaleDateString()} isRTL={isRTL} />
        )}
        <Row label={resolveTranslated({ en: "Revisions Used", ar: "المراجعات المستخدمة", ur: "استعمال شدہ ریویژنز" }, lang)} value={`${order.revisions_used || 0} / ${order.revisions_allowed || 0}`} isRTL={isRTL} />
      </div>

      {/* Delivery Files */}
      {order.files?.filter((f) => f.category === "delivery").length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900">
            {resolveTranslated({ en: "Deliverables", ar: "المخرجات", ur: "ڈیلیوریبلز" }, lang)}
          </h3>
          <div className="space-y-2">
            {order.files
              .filter((f) => f.category === "delivery")
              .map((file) => (
                <a
                  key={file.id}
                  href={file.file_url || file.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.original_filename || file.file_name}</p>
                    <p className="text-xs text-gray-500">{file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ""}</p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {resolveTranslated({ en: "Download", ar: "تحميل", ur: "ڈاؤنلوڈ" }, lang)}
                  </span>
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {order.status === "delivered" && (
        <div className="space-y-4 bg-green-50 rounded-xl p-5">
          <h3 className="font-bold text-green-800">
            {resolveTranslated({ en: "Your order has been delivered!", ar: "تم تسليم طلبك!", ur: "آپ کا آرڈر ڈیلیور ہو گیا!" }, lang)}
          </h3>

          {/* Accept Delivery */}
          {!showReview ? (
            <div className="flex gap-3">
              <button
                onClick={() => setShowReview(true)}
                className="flex-1 py-3 text-white rounded-xl font-semibold hover:opacity-90"
                style={{ backgroundColor: "#10B981" }}
              >
                {resolveTranslated({ en: "Accept Delivery", ar: "قبول التسليم", ur: "ڈیلیوری قبول کریں" }, lang)}
              </button>
              <button
                onClick={() => setShowRevisionForm(true)}
                className="flex-1 py-3 bg-orange-100 text-orange-800 rounded-xl font-semibold hover:bg-orange-200"
              >
                {resolveTranslated({ en: "Request Revision", ar: "طلب مراجعة", ur: "ریویژن کی درخواست" }, lang)}
                {order.can_request_revision ? "" : " ❌"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {resolveTranslated({ en: "Leave a review (optional)", ar: "اترك تقييماً (اختياري)", ur: "ریویو دیں (اختیاری)" }, lang)}
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData((r) => ({ ...r, rating: star }))}
                    className={`text-2xl ${star <= reviewData.rating ? "text-yellow-400" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData((r) => ({ ...r, comment: e.target.value }))}
                placeholder={resolveTranslated({ en: "Your feedback...", ar: "ملاحظاتك...", ur: "آپ کی رائے..." }, lang)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAcceptDelivery}
                  disabled={actionLoading}
                  className="flex-1 py-3 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#10B981" }}
                >
                  {actionLoading ? "..." : resolveTranslated({ en: "Submit & Accept", ar: "إرسال وقبول", ur: "جمع کریں اور قبول کریں" }, lang)}
                </button>
                <button onClick={() => setShowReview(false)} className="px-4 py-3 text-gray-600">
                  {resolveTranslated({ en: "Cancel", ar: "إلغاء", ur: "منسوخ" }, lang)}
                </button>
              </div>
            </div>
          )}

          {/* Revision Form */}
          {showRevisionForm && (
            <div className="mt-4 space-y-3">
              <textarea
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                placeholder={resolveTranslated({ en: "Describe what needs to be changed...", ar: "صف ما يحتاج للتغيير...", ur: "بتائیں کیا تبدیل کرنا ہے..." }, lang)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleRequestRevision}
                  disabled={actionLoading || !revisionMessage.trim()}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {actionLoading ? "..." : resolveTranslated({ en: "Submit Revision Request", ar: "إرسال طلب المراجعة", ur: "ریویژن کی درخواست جمع کریں" }, lang)}
                </button>
                <button onClick={() => setShowRevisionForm(false)} className="px-4 py-3 text-gray-600">
                  {resolveTranslated({ en: "Cancel", ar: "إلغاء", ur: "منسوخ" }, lang)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Button (only for certain statuses) */}
      {["paid", "accepted"].includes(order.status) && (
        <button
          onClick={handleCancel}
          disabled={actionLoading}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 disabled:opacity-50"
        >
          {resolveTranslated({ en: "Cancel Order", ar: "إلغاء الطلب", ur: "آرڈر منسوخ کریں" }, lang)}
        </button>
      )}

      {/* Messages */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900">
          {resolveTranslated({ en: "Messages", ar: "الرسائل", ur: "پیغامات" }, lang)}
        </h3>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center py-6 text-sm">
              {resolveTranslated({ en: "No messages yet", ar: "لا توجد رسائل بعد", ur: "ابھی تک کوئی پیغام نہیں" }, lang)}
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.is_system
                    ? "bg-blue-50 text-blue-800 text-sm italic"
                    : msg.sender_type === "customer"
                    ? "bg-gray-100 ml-8"
                    : "bg-white border mr-8"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {msg.sender_name} · {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Send Message */}
        {!["completed", "cancelled", "refunded"].includes(order.status) && (
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={resolveTranslated({ en: "Type a message...", ar: "اكتب رسالة...", ur: "پیغام لکھیں..." }, lang)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90"
              style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
            >
              {resolveTranslated({ en: "Send", ar: "إرسال", ur: "بھیجیں" }, lang)}
            </button>
          </div>
        )}
      </div>

      {/* Review (if completed) */}
      {order.review && (
        <div className="bg-yellow-50 rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-2">
            {resolveTranslated({ en: "Your Review", ar: "تقييمك", ur: "آپ کا ریویو" }, lang)}
          </h3>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={s <= order.review.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
            ))}
          </div>
          {order.review.comment && <p className="text-sm text-gray-600">{order.review.comment}</p>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, isRTL }) {
  return (
    <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-medium text-gray-900 text-sm">{value}</span>
    </div>
  );
}