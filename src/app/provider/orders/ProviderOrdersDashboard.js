"use client";

/**
 * ProviderOrdersDashboard.js — Fully i18n
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  fetchProviderOrders,
  fetchOrderDetail,
  acceptOrder,
  declineOrder,
  startWork,
  deliverOrder,
  uploadOrderFile,
  sendOrderMessage,
  getStatusConfig,
} from "./orderApi";
import { BrandRoot } from "@/components/ui";
import {
  OrderStatusBadge, OrderStatusTimeline, OrderProgressCard,
  OrderTimelineFeed, OrderConversation,
} from "@/components/orders";
import { useRealtime } from "@/lib/realtime";
import { applyOrderEnvelope, applyTenantOrderSummary } from "@/lib/realtimePatches";

export default function ProviderOrdersDashboard({ orderId = null }) {
  const { language, activeTenant, tenants, isRTL, t } = useApp();

  const tenant = tenants?.find(t => t.id === activeTenant);
  const theme = tenant?.settings?.branding || {};

  if (orderId) {
    return (
      <BrandRoot>
        <ProviderOrderDetail
          tenantId={activeTenant}
          orderId={orderId}
          theme={theme}
          lang={language}
          isRTL={isRTL}
          t={t}
        />
      </BrandRoot>
    );
  }

  return (
    <BrandRoot>
      <ProviderOrderList
        tenantId={activeTenant}
        theme={theme}
        lang={language}
        isRTL={isRTL}
        t={t}
      />
    </BrandRoot>
  );
}

// =============================================================================
// PROVIDER ORDER LIST
// =============================================================================
function ProviderOrderList({ tenantId, theme, lang, isRTL, t }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [filter]);

  // Live feed — patch in-place when other roles change something
  useRealtime({
    topics: tenantId ? [`tenant:${tenantId}:orders`] : [],
    onEvent: (envelope) => {
      if (envelope?.entity_type === "order.summary") {
        setOrders((prev) => applyTenantOrderSummary(prev, envelope));
      }
    },
    onReconnect: () => { loadOrders(); },
  });

  async function loadOrders() {
    setLoading(true);
    try {
      const params = {};
      if (filter === "new") params.status = "paid";
      else if (filter === "active") params.status = "in_progress";
      else if (filter === "delivered") params.status = "delivered";
      else if (filter === "completed") params.status = "completed";
      else if (filter === "revisions") params.status = "revision_requested";

      const data = await fetchProviderOrders(tenantId, params);
      setOrders(data.results || data || []);
    } catch (e) {
      console.error("Orders fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickAccept(e, orderId) {
    e.preventDefault();
    e.stopPropagation();
    setActionLoading(orderId);
    try {
      await acceptOrder(tenantId, orderId);
      await loadOrders();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleQuickDecline(e, orderId) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t("orders_decline_confirm"))) return;
    setActionLoading(orderId);
    try {
      await declineOrder(tenantId, orderId);
      await loadOrders();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  const filters = [
    { key: "all", label: t("orders_filter_all") },
    { key: "new", label: t("orders_filter_new") },
    { key: "active", label: t("orders_filter_active") },
    { key: "delivered", label: t("orders_filter_delivered") },
    { key: "revisions", label: t("orders_filter_revisions") },
    { key: "completed", label: t("orders_filter_completed") },
  ];

  const newCount = orders.filter((o) => o.status === "paid").length;
  const revisionCount = orders.filter((o) => o.status === "revision_requested").length;

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? "rtl" : ""}`}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("orders_title")}</h1>

      {/* Filters */}
      <div className={`flex gap-2 mb-6 overflow-x-auto pb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        {filters.map((f) => {
          const isActive = filter === f.key;
          const badge =
            f.key === "new" && filter === "all" && newCount > 0
              ? newCount
              : f.key === "revisions" && filter === "all" && revisionCount > 0
              ? revisionCount
              : null;

          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors relative ${
                isActive ? "text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={{ backgroundColor: isActive ? theme.primary_color || "#3B82F6" : undefined }}
            >
              {f.label}
              {badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500">{t("orders_no_orders")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <ProviderOrderCard
              key={order.id}
              order={order}
              theme={theme}
              lang={lang}
              isRTL={isRTL}
              t={t}
              actionLoading={actionLoading === order.id}
              onAccept={handleQuickAccept}
              onDecline={handleQuickDecline}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProviderOrderCard({ order, theme, lang, isRTL, t, actionLoading, onAccept, onDecline }) {
  const status = getStatusConfig(order.status);
  const isPaid = order.status === "paid";
  const isRevision = order.status === "revision_requested";

  return (
    <a
      href={`/provider/orders/${order.id}`}
      className={`block bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
        isPaid
          ? "border-blue-300 bg-blue-50/30"
          : isRevision
          ? "border-orange-300 bg-orange-50/30"
          : "border-gray-200"
      }`}
    >
      <div className={`flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-gray-900">{order.order_number}</span>
            {order.unread_count > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                {order.unread_count > 9 ? '9+' : order.unread_count}
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
              {status.icon} {status.label}
            </span>
            {order.is_overdue && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                ⏰ {t("orders_overdue")}
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm">{order.service_name}</p>
          {order.customer_name && (
            <p className="text-gray-400 text-xs mt-1">
              {t("orders_customer")}: {order.customer_name}
            </p>
          )}
          {order.due_date && (
            <p className="text-gray-400 text-xs mt-0.5">
              {t("orders_due_date")}: {new Date(order.due_date).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-lg font-bold" style={{ color: theme.primary_color || "#3B82F6" }}>
            ${Number(order.provider_earning || order.total_amount).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {isPaid && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-blue-200">
          <button
            onClick={(e) => onAccept(e, order.id)}
            disabled={actionLoading}
            className="flex-1 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: "#10B981" }}
          >
            {actionLoading ? "..." : `✓ ${t("orders_accept")}`}
          </button>
          <button
            onClick={(e) => onDecline(e, order.id)}
            disabled={actionLoading}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            {t("orders_decline")}
          </button>
        </div>
      )}

      {isRevision && (
        <div className="mt-3 pt-3 border-t border-orange-200">
          <p className="text-sm text-orange-700">⚠️ {t("orders_revision_notice")}</p>
        </div>
      )}
    </a>
  );
}

// =============================================================================
// PROVIDER ORDER DETAIL
// =============================================================================
function ProviderOrderDetail({ tenantId, orderId, theme, lang, isRTL, t }) {
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  // Realtime — patch order in-place; append messages on message.created
  useRealtime({
    topics: orderId ? [`order:${orderId}`] : [],
    onEvent: (envelope) => {
      setOrder((prev) => applyOrderEnvelope(prev, envelope));
      if (envelope?.entity_type === "order.message" && envelope.payload) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return seen.has(envelope.payload.id) ? prev : [...prev, envelope.payload];
        });
      }
    },
    onReconnect: () => { loadOrder(); },
  });

  async function loadOrder() {
    setLoading(true);
    try {
      const data = await fetchOrderDetail(tenantId, orderId);
      setOrder(data);
      setMessages(data.messages || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  async function handleAccept() {
    setActionLoading(true);
    setError(null);
    try {
      await acceptOrder(tenantId, orderId);
      showSuccess(t("orders_toast_accepted"));
      await loadOrder();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDecline() {
    if (!confirm(t("orders_decline_confirm"))) return;
    setActionLoading(true);
    setError(null);
    try {
      await declineOrder(tenantId, orderId);
      showSuccess(t("orders_toast_declined"));
      await loadOrder();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartWork() {
    setActionLoading(true);
    setError(null);
    try {
      await startWork(tenantId, orderId);
      showSuccess(t("orders_toast_started"));
      await loadOrder();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeliver() {
    if (!deliveryMessage.trim()) {
      setError(t("orders_delivery_error_empty"));
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await deliverOrder(tenantId, orderId, deliveryMessage);
      setDeliveryMessage("");
      showSuccess(t("orders_toast_delivered"));
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
      const msg = await sendOrderMessage(tenantId, orderId, newMessage);
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
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <p className="text-gray-500">{error || t("orders_not_found")}</p>
      </div>
    );
  }

  const status = getStatusConfig(order.status);
  const canDeliver = ["in_progress", "revision_requested"].includes(order.status);

  return (
    <div className={`max-w-3xl mx-auto p-6 space-y-6 ${isRTL ? "rtl" : ""}`}>
      {/* Back link */}
      <a href="/provider/orders" className="text-sm text-gray-500 hover:text-gray-700">
        {t("orders_back")}
      </a>

      {/* Status timeline + progress hero */}
      <OrderStatusTimeline status={order.status} />
      <OrderProgressCard
        order={order}
        viewer="provider"
        providerName={order.provider_name}
        customerName={order.customer_name}
      />

      {/* Header */}
      <div className={`flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
            {order.is_overdue && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
                ⏰ {t("orders_overdue")}
              </span>
            )}
          </div>
          <p className="text-gray-600">{order.service_name}</p>
          {order.package_name && (
            <p className="text-gray-400 text-sm mt-1">
              {t("orders_package")}: {order.package_name}
            </p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          ✓ {successMsg}
        </div>
      )}

      {/* Revision Alert */}
      {order.status === "revision_requested" && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-sm">
          ⚠️ {t("orders_revision_notice")}
        </div>
      )}

      {/* Earnings Breakdown */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
          {t("orders_earnings")}
        </h3>
        <Row label={t("orders_total")} value={`$${Number(order.total_amount).toFixed(2)}`} isRTL={isRTL} />
        {order.platform_fee && (
          <Row
            label={t("orders_platform_fee")}
            value={`-$${Number(order.platform_fee).toFixed(2)}`}
            isRTL={isRTL}
            valueClass="text-red-500"
          />
        )}
        <div className="border-t border-gray-200 pt-2">
          <Row
            label={t("orders_you_earn")}
            value={`$${Number(order.provider_earning || order.total_amount).toFixed(2)}`}
            isRTL={isRTL}
            labelClass="font-bold"
            valueClass="font-bold text-green-600"
          />
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-gray-50 rounded-xl p-5 space-y-3">
        <Row label={t("orders_customer")} value={order.customer_name || "—"} isRTL={isRTL} />
        <Row label={t("orders_ordered")} value={new Date(order.created_at).toLocaleDateString()} isRTL={isRTL} />
        {order.due_date && (
          <Row label={t("orders_due_date")} value={new Date(order.due_date).toLocaleDateString()} isRTL={isRTL} />
        )}
        <Row
          label={t("orders_revisions_used")}
          value={`${order.revisions_used || 0} / ${order.revisions_allowed || 0}`}
          isRTL={isRTL}
        />
      </div>

      {/* Customer Requirements */}
      {order.requirements && Object.keys(order.requirements).length > 0 && (
        <div className="bg-blue-50 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
            {t("orders_requirements")}
          </h3>
          {Object.entries(order.requirements).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium text-gray-700 capitalize">
                {key.replace(/_/g, " ")}:
              </span>{" "}
              <span className="text-gray-600">{String(value)}</span>
            </div>
          ))}
        </div>
      )}

      {/* === ACTION PANELS === */}

      {/* New Order — Accept / Decline */}
      {order.status === "paid" && (
        <div className="bg-blue-50 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-blue-800">
            🔔 {t("orders_new_order_title")}
          </h3>
          <p className="text-sm text-blue-700">
            {t("orders_new_order_desc")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="flex-1 py-3 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#10B981" }}
            >
              {actionLoading ? "..." : `✓ ${t("orders_accept")}`}
            </button>
            <button
              onClick={handleDecline}
              disabled={actionLoading}
              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50"
            >
              {t("orders_decline")}
            </button>
          </div>
        </div>
      )}

      {/* Accepted — Start Work */}
      {order.status === "accepted" && (
        <div className="bg-indigo-50 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-indigo-800">
            ✅ {t("orders_start_work_title")}
          </h3>
          <p className="text-sm text-indigo-700">
            {t("orders_start_work_desc")}
          </p>
          <button
            onClick={handleStartWork}
            disabled={actionLoading}
            className="w-full py-3 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            {actionLoading ? "..." : `🚀 ${t("orders_start_work")}`}
          </button>
        </div>
      )}

      {/* In Progress / Revision — File Upload + Deliver */}
      {canDeliver && (
        <div className="space-y-4">
          <FileUploadZone
            tenantId={tenantId}
            orderId={orderId}
            theme={theme}
            lang={lang}
            isRTL={isRTL}
            t={t}
            onUploadComplete={loadOrder}
          />

          <div className="bg-green-50 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-green-800">
              📦 {t("orders_deliver")}
            </h3>
            <textarea
              value={deliveryMessage}
              onChange={(e) => setDeliveryMessage(e.target.value)}
              placeholder={t("orders_delivery_placeholder")}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-transparent"
            />
            <button
              onClick={handleDeliver}
              disabled={actionLoading || !deliveryMessage.trim()}
              className="w-full py-3 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#10B981" }}
            >
              {actionLoading ? "..." : `📦 ${t("orders_deliver")}`}
            </button>
          </div>
        </div>
      )}

      {/* Existing Files */}
      <OrderFilesDisplay files={order.files} t={t} isRTL={isRTL} />

      {/* Customer Review */}
      {order.review && (
        <div className="bg-yellow-50 rounded-xl p-5">
          <h3 className="font-bold text-gray-900 mb-2">{t("orders_review")}</h3>
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={s <= order.review.rating ? "text-yellow-400" : "text-gray-300"}>
                ★
              </span>
            ))}
          </div>
          {order.review.comment && (
            <p className="text-sm text-gray-600">{order.review.comment}</p>
          )}
        </div>
      )}

      {/* Live activity feed — append-only timeline from backend */}
      {(order.timeline_events || []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Activity</h3>
          <OrderTimelineFeed events={order.timeline_events || []} />
        </div>
      )}

      {/* Conversation — feed + composer + upload queue tray */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        <h3 className="font-bold text-gray-900 mb-3">{t("orders_messages")}</h3>
        <OrderConversation
          order={{ ...order, messages }}
          viewer="provider"
          locked={["completed", "cancelled", "refunded"].includes(order.status)}
          lockedMessage={t("orders_locked") || "This order is closed."}
          showComposer={!["completed", "cancelled", "refunded"].includes(order.status)}
          onSendMessage={async (content) => {
            const msg = await sendOrderMessage(tenantId, orderId, content);
            if (msg?.id) {
              setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            }
          }}
          onUploadFile={async (file /*, { onProgress, signal } */) => {
            // uploadOrderFile is fetch-based (no progress); the queue
            // still shows pending/done state, just without a bar.
            await uploadOrderFile(tenantId, orderId, file);
          }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// FILE UPLOAD ZONE
// =============================================================================
function FileUploadZone({ tenantId, orderId, theme, lang, isRTL, t, onUploadComplete }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [category, setCategory] = useState("delivery");
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFiles = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;
      setUploading(true);

      const fileArr = Array.from(files);
      const progress = fileArr.map((f) => ({
        name: f.name,
        status: "uploading",
        error: null,
      }));
      setUploadProgress([...progress]);

      for (let i = 0; i < fileArr.length; i++) {
        try {
          await uploadOrderFile(tenantId, orderId, fileArr[i], category);
          progress[i].status = "done";
        } catch (e) {
          progress[i].status = "error";
          progress[i].error = e.message;
        }
        setUploadProgress([...progress]);
      }

      setUploading(false);
      const allDone = progress.every((p) => p.status === "done");
      if (allDone) {
        setTimeout(() => setUploadProgress([]), 2000);
      }
      onUploadComplete?.();
    },
    [tenantId, orderId, category, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e) => {
      processFiles(e.target.files);
      e.target.value = "";
    },
    [processFiles]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
          {t("orders_upload_files")}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{t("orders_file_category")}:</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white"
          >
            <option value="delivery">{t("orders_cat_delivery")}</option>
            <option value="work">{t("orders_cat_work")}</option>
          </select>
        </div>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <div className="text-4xl mb-2">{dragActive ? "📥" : "📎"}</div>
        <p className="text-sm text-gray-600">{t("orders_drag_drop")}</p>
        <p className="text-xs text-gray-400 mt-1">
          {category === "delivery" ? "📦" : "📁"}{" "}
          {category === "delivery" ? t("orders_cat_delivery") : t("orders_cat_work")}
        </p>
      </div>

      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                item.status === "uploading"
                  ? "bg-blue-50 text-blue-700"
                  : item.status === "done"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span className="text-lg">
                {item.status === "uploading" ? "⏳" : item.status === "done" ? "✅" : "❌"}
              </span>
              <span className="flex-1 truncate">{item.name}</span>
              {item.status === "uploading" && (
                <span className="text-xs">{t("orders_uploading")}</span>
              )}
              {item.error && <span className="text-xs">{item.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ORDER FILES DISPLAY
// =============================================================================
function OrderFilesDisplay({ files, t, isRTL }) {
  if (!files || files.length === 0) return null;

  const workFiles = files.filter((f) => f.category === "work");
  const deliveryFiles = files.filter((f) => f.category === "delivery");
  const requirementFiles = files.filter((f) => f.category === "requirement");

  function renderFileList(fileList, title) {
    if (fileList.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        {fileList.map((file) => (
          <a
            key={file.id}
            href={file.file_url || file.file}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.original_filename || file.file_name}
              </p>
              <p className="text-xs text-gray-500">
                {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ""}
                {file.uploaded_at ? ` · ${new Date(file.uploaded_at).toLocaleDateString()}` : ""}
              </p>
            </div>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderFileList(deliveryFiles, `📦 ${t("orders_delivery_files")}`)}
      {renderFileList(workFiles, `📁 ${t("orders_work_files")}`)}
      {renderFileList(requirementFiles, `📋 ${t("orders_requirements")}`)}
    </div>
  );
}

// =============================================================================
// UTILITIES
// =============================================================================
function Row({ label, value, isRTL, labelClass = "", valueClass = "" }) {
  return (
    <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
      <span className={`text-gray-500 text-sm ${labelClass}`}>{label}</span>
      <span className={`font-medium text-gray-900 text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}


// "use client";

// /**
//  * ProviderOrdersDashboard.js
//  *
//  * Provider-facing order management dashboard.
//  * Route: /provider/orders (list) or /provider/orders/{id} (detail)
//  *
//  * Features:
//  *  - List assigned orders with status filters
//  *  - Accept / Decline new orders
//  *  - Start work on accepted orders
//  *  - Upload work files (drag & drop + click)
//  *  - Submit delivery with message
//  *  - Handle revision requests
//  *  - In-order messaging
//  */


// import { useState, useEffect, useRef, useCallback } from "react";
// // import { useTenantLang } from "@/app/tenant-site/contexts/TenantLangContext";
// // import { useTenantTheme } from "@/app/tenant-site/contexts/TenantThemeContext";

// // import resolveTranslated from "@/app/tenant-site/[domain]/utils/resolveTranslated";
// import { useApp } from "@/contexts/AppContext";
// import { useParams } from 'next/navigation';
// import {
//   fetchProviderOrders,
//   fetchOrderDetail,
//   acceptOrder,
//   declineOrder,
//   startWork,
//   deliverOrder,
//   uploadOrderFile,
//   sendOrderMessage,
//   getStatusConfig,
// } from "./orderApi";

// function translate(key, lang) {
//     const obj = T[key];
//     if (!obj) return key;
//     return obj[lang] || obj.en;
//     }


// // =============================================================================
// // TRANSLATIONS
// // =============================================================================
// const T = {
//   title: { en: "My Assignments", ar: "مهامي", ur: "میری اسائنمنٹس" },
//   all: { en: "All", ar: "الكل", ur: "سب" },
//   newOrders: { en: "New", ar: "جديد", ur: "نئے" },
//   active: { en: "Active", ar: "نشط", ur: "فعال" },
//   delivered: { en: "Delivered", ar: "تم التسليم", ur: "ڈیلیور" },
//   completed: { en: "Completed", ar: "مكتمل", ur: "مکمل" },
//   revisions: { en: "Revisions", ar: "المراجعات", ur: "ریویژنز" },
//   noOrders: { en: "No orders found", ar: "لا توجد طلبات", ur: "کوئی آرڈر نہیں ملا" },
//   customer: { en: "Customer", ar: "العميل", ur: "کسٹمر" },
//   ordered: { en: "Ordered", ar: "تاريخ الطلب", ur: "آرڈر کی تاریخ" },
//   dueDate: { en: "Due Date", ar: "تاريخ الاستحقاق", ur: "آخری تاریخ" },
//   revisionsUsed: { en: "Revisions Used", ar: "المراجعات المستخدمة", ur: "استعمال شدہ ریویژنز" },
//   earnings: { en: "Your Earnings", ar: "أرباحك", ur: "آپ کی کمائی" },
//   totalOrder: { en: "Order Total", ar: "إجمالي الطلب", ur: "آرڈر ٹوٹل" },
//   platformFee: { en: "Platform Fee", ar: "رسوم المنصة", ur: "پلیٹ فارم فیس" },
//   youEarn: { en: "You Earn", ar: "تكسب", ur: "آپ کمائیں گے" },
//   acceptOrder: { en: "Accept Order", ar: "قبول الطلب", ur: "آرڈر قبول کریں" },
//   declineOrder: { en: "Decline", ar: "رفض", ur: "مسترد کریں" },
//   startWork: { en: "Start Working", ar: "بدء العمل", ur: "کام شروع کریں" },
//   deliver: { en: "Submit Delivery", ar: "تسليم العمل", ur: "ڈیلیوری جمع کریں" },
//   deliveryMsg: { en: "Delivery message (describe what's included)...", ar: "رسالة التسليم...", ur: "ڈیلیوری پیغام..." },
//   uploadFiles: { en: "Upload Files", ar: "رفع الملفات", ur: "فائلز اپلوڈ کریں" },
//   dragDrop: { en: "Drag & drop files here, or click to browse", ar: "اسحب وأفلت الملفات هنا", ur: "فائلز یہاں ڈریگ کریں یا براؤز کریں" },
//   workFiles: { en: "Work Files", ar: "ملفات العمل", ur: "ورک فائلز" },
//   deliveryFiles: { en: "Delivery Files", ar: "ملفات التسليم", ur: "ڈیلیوری فائلز" },
//   messages: { en: "Messages", ar: "الرسائل", ur: "پیغامات" },
//   noMessages: { en: "No messages yet", ar: "لا توجد رسائل بعد", ur: "ابھی تک کوئی پیغام نہیں" },
//   sendMsg: { en: "Type a message...", ar: "اكتب رسالة...", ur: "پیغام لکھیں..." },
//   send: { en: "Send", ar: "إرسال", ur: "بھیجیں" },
//   overdue: { en: "Overdue", ar: "متأخر", ur: "تاخیر" },
//   back: { en: "← Back to Orders", ar: "← العودة للطلبات", ur: "← آرڈرز پر واپس" },
//   requirements: { en: "Customer Requirements", ar: "متطلبات العميل", ur: "کسٹمر کی ضروریات" },
//   package: { en: "Package", ar: "الباقة", ur: "پیکج" },
//   declineConfirm: { en: "Decline this order? It will be unassigned.", ar: "رفض هذا الطلب؟", ur: "یہ آرڈر مسترد کریں؟" },
//   revisionRequested: { en: "Revision requested — please review customer feedback and resubmit.", ar: "طُلبت مراجعة — يرجى مراجعة ملاحظات العميل وإعادة التسليم.", ur: "ریویژن کی درخواست — کسٹمر فیڈبیک دیکھیں اور دوبارہ جمع کریں۔" },
//   uploading: { en: "Uploading...", ar: "جاري الرفع...", ur: "اپلوڈ ہو رہا ہے..." },
//   fileCategory: { en: "File Type", ar: "نوع الملف", ur: "فائل کی قسم" },
//   work: { en: "Work (internal)", ar: "عمل (داخلي)", ur: "ورک (اندرونی)" },
//   delivery: { en: "Delivery (to customer)", ar: "تسليم (للعميل)", ur: "ڈیلیوری (کسٹمر کو)" },
//   review: { en: "Customer Review", ar: "تقييم العميل", ur: "کسٹمر ریویو" },
// };


// // =============================================================================
// // MAIN COMPONENT
// // =============================================================================
// export default function ProviderOrdersDashboard({ orderId = null }) {

//   const {language, activeTenant, tenants, isRTL } = useApp();

//   const tenant = tenants?.find(t => t.id === activeTenant);
//   const theme = tenant?.settings?.branding || {};

//   const lang = language;



//   if (orderId) {
//     return (
//       <ProviderOrderDetail
//         tenantId={activeTenant}
//         orderId={orderId}
//         theme={theme}
//         lang={lang}
//         isRTL={isRTL}
//         />
//     );
//   }

//   return (
//     <ProviderOrderList
//     tenantId={activeTenant}
//     theme={theme}
//     lang={lang}
//     isRTL={isRTL}
//     />
//   );
// }

// // =============================================================================
// // PROVIDER ORDER LIST
// // =============================================================================
// function ProviderOrderList({ tenantId, theme, lang, isRTL }){
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState("all");
//   const [actionLoading, setActionLoading] = useState(null);

//   useEffect(() => {
//     loadOrders();
//   }, [filter]);

//   async function loadOrders() {
//   setLoading(true);

//   try {
//     const params = {};

//     if (filter === "new") params.status = "paid";
//     else if (filter === "active") params.status = "in_progress";
//     else if (filter === "delivered") params.status = "delivered";
//     else if (filter === "completed") params.status = "completed";
//     else if (filter === "revisions") params.status = "revision_requested";

//     const data = await fetchProviderOrders(tenantId, params);

//     setOrders(data.results || data || []);
//   } catch (e) {
//     console.error("Orders fetch failed:", e);
//   } finally {
//     setLoading(false);
//   }
// }

//   async function handleQuickAccept(e, orderId) {
//     e.preventDefault();
//     e.stopPropagation();
//     setActionLoading(orderId);
//     try {
//       await acceptOrder(tenantId, orderId);
//       await loadOrders();
//     } catch (e) {
//       alert(e.message);
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   async function handleQuickDecline(e, orderId) {
//     e.preventDefault();
//     e.stopPropagation();
//     if (!confirm(translate("declineConfirm", lang))) return;
//     setActionLoading(orderId);
//     try {
//       await declineOrder(tenantId, orderId);
//       await loadOrders();
//     } catch (e) {
//       alert(e.message);
//     } finally {
//       setActionLoading(null);
//     }
//   }

//   const filters = [
//     { key: "all", label: T.all },
//     { key: "new", label: T.newOrders },
//     { key: "active", label: T.active },
//     { key: "delivered", label: T.delivered },
//     { key: "revisions", label: T.revisions },
//     { key: "completed", label: T.completed },
//   ];

//   // Count badges for key filters
//   const newCount = orders.filter((o) => o.status === "paid").length;
//   const revisionCount = orders.filter((o) => o.status === "revision_requested").length;

//   return (
//     <div className={`max-w-4xl mx-auto p-6 ${isRTL ? "rtl" : ""}`}>
//       <h1 className="text-2xl font-bold text-gray-900 mb-6">{translate("title", lang)}</h1>

//       {/* Filters */}
//       <div className={`flex gap-2 mb-6 overflow-x-auto pb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
//         {filters.map((f) => {
//           const isActive = filter === f.key;
//           const badge =
//             f.key === "new" && filter === "all" && newCount > 0
//               ? newCount
//               : f.key === "revisions" && filter === "all" && revisionCount > 0
//               ? revisionCount
//               : null;

//           return (
//             <button
//               key={f.key}
//               onClick={() => setFilter(f.key)}
//               className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors relative ${
//                 isActive ? "text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//               }`}
//               style={{ backgroundColor: isActive ? theme.primary_color || "#3B82F6" : undefined }}
//             >
//               {f.label[lang] || f.label.en}
//               {badge && (
//                 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
//                   {badge}
//                 </span>
//               )}
//             </button>
//           );
//         })}
//       </div>

//       {/* Orders */}
//       {loading ? (
//         <div className="space-y-4">
//           {[1, 2, 3].map((i) => (
//             <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
//           ))}
//         </div>
//       ) : orders.length === 0 ? (
//         <div className="text-center py-16">
//           <div className="text-5xl mb-4">📋</div>
//           <p className="text-gray-500">{translate("noOrders", lang)}</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {orders.map((order) => (
//             <ProviderOrderCard
//               key={order.id}
//               order={order}
//               theme={theme}
//               lang={lang}
//               isRTL={isRTL}
//               actionLoading={actionLoading === order.id}
//               onAccept={handleQuickAccept}
//               onDecline={handleQuickDecline}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function ProviderOrderCard({ order, theme, lang, isRTL, actionLoading, onAccept, onDecline }) {
//   const status = getStatusConfig(order.status);
//   const isPaid = order.status === "paid";
//   const isRevision = order.status === "revision_requested";

//   return (
//     <a
//       href={`/provider/orders/${order.id}`}
//       className={`block bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
//         isPaid
//           ? "border-blue-300 bg-blue-50/30"
//           : isRevision
//           ? "border-orange-300 bg-orange-50/30"
//           : "border-gray-200"
//       }`}
//     >
//       <div className={`flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2 mb-1 flex-wrap">
//             <span className="font-bold text-gray-900">{order.order_number}</span>
//             {/* Unread badge */}
//             {order.unread_count > 0 && (
//               <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold">
//                 {order.unread_count > 9 ? '9+' : order.unread_count}
//               </span>
//             )}
            
//             <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
//               {status.icon} {status.label}
//             </span>
//             {order.is_overdue && (
//               <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
//                 ⏰ {translate("overdue", lang)}
//               </span>
//             )}
//           </div>
//           <p className="text-gray-600 text-sm">{order.service_name}</p>
//           {order.customer_name && (
//             <p className="text-gray-400 text-xs mt-1">
//               {translate("customer", lang)}: {order.customer_name}
//             </p>
//           )}
//           {order.due_date && (
//             <p className="text-gray-400 text-xs mt-0.5">
//               {translate("dueDate", lang)}: {new Date(order.due_date).toLocaleDateString()}
//             </p>
//           )}
//         </div>

//         <div className="text-right flex-shrink-0 ml-4">
//           <p className="text-lg font-bold" style={{ color: theme.primary_color || "#3B82F6" }}>
//             ${Number(order.provider_earning || order.total_amount).toFixed(2)}
//           </p>
//           <p className="text-xs text-gray-400">
//             {new Date(order.created_at).toLocaleDateString()}
//           </p>
//         </div>
//       </div>

//       {/* Quick Actions for new orders */}
//       {isPaid && (
//         <div className="flex gap-2 mt-4 pt-3 border-t border-blue-200">
//           <button
//             onClick={(e) => onAccept(e, order.id)}
//             disabled={actionLoading}
//             className="flex-1 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
//             style={{ backgroundColor: "#10B981" }}
//           >
//             {actionLoading ? "..." : `✓ ${translate("acceptOrder", lang)}`}
//           </button>
//           <button
//             onClick={(e) => onDecline(e, order.id)}
//             disabled={actionLoading}
//             className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
//           >
//             {translate("declineOrder", lang)}
//           </button>
//         </div>
//       )}

//       {/* Revision notice */}
//       {isRevision && (
//         <div className="mt-3 pt-3 border-t border-orange-200">
//           <p className="text-sm text-orange-700">⚠️ {translate("revisionRequested", lang)}</p>
//         </div>
//       )}
//     </a>
//   );
// }

// // =============================================================================
// // PROVIDER ORDER DETAIL
// // =============================================================================
// function ProviderOrderDetail({ tenantId, orderId, theme, lang, isRTL }) {
//   const [order, setOrder] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [deliveryMessage, setDeliveryMessage] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [successMsg, setSuccessMsg] = useState(null);
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     loadOrder();
//   }, [orderId]);

//   async function loadOrder() {
//     setLoading(true);
//     try {
//       const data = await fetchOrderDetail(tenantId, orderId);
//       setOrder(data);
//       setMessages(data.messages || []);
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   function showSuccess(msg) {
//     setSuccessMsg(msg);
//     setTimeout(() => setSuccessMsg(null), 4000);
//   }

//   async function handleAccept() {
//     setActionLoading(true);
//     setError(null);
//     try {
//       await acceptOrder(tenantId, orderId);
//       showSuccess("Order accepted!");
//       await loadOrder();
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setActionLoading(false);
//     }
//   }

//   async function handleDecline() {
//     if (!confirm(translate("declineConfirm", lang))) return;
//     setActionLoading(true);
//     setError(null);
//     try {
//       await declineOrder(tenantId, orderId);
//       showSuccess("Order declined.");
//       await loadOrder();
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setActionLoading(false);
//     }
//   }

//   async function handleStartWork() {
//     setActionLoading(true);
//     setError(null);
//     try {
//       await startWork(tenantId, orderId);
//       showSuccess("Work started! Due date has been set.");
//       await loadOrder();
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setActionLoading(false);
//     }
//   }

//   async function handleDeliver() {
//     if (!deliveryMessage.trim()) {
//       setError("Please add a delivery message describing what's included.");
//       return;
//     }
//     setActionLoading(true);
//     setError(null);
//     try {
//       await deliverOrder(tenantId, orderId, deliveryMessage);
//       setDeliveryMessage("");
//       showSuccess("Delivery submitted!");
//       await loadOrder();
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setActionLoading(false);
//     }
//   }

//   async function handleSendMessage() {
//     if (!newMessage.trim()) return;
//     try {
//       const msg = await sendOrderMessage(tenantId, orderId, newMessage);
//       setMessages((prev) => [...prev, msg]);
//       setNewMessage("");
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     } catch (e) {
//       setError(e.message);
//     }
//   }

//   if (loading) {
//     return (
//       <div className="max-w-3xl mx-auto p-6 space-y-6">
//         {[1, 2, 3, 4].map((i) => (
//           <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
//         ))}
//       </div>
//     );
//   }

//   if (!order) {
//     return (
//       <div className="max-w-3xl mx-auto p-6 text-center">
//         <p className="text-gray-500">{error || "Order not found"}</p>
//       </div>
//     );
//   }

//   const status = getStatusConfig(order.status);
//   const canDeliver = ["in_progress", "revision_requested"].includes(order.status);

//   return (
//     <div className={`max-w-3xl mx-auto p-6 space-y-6 ${isRTL ? "rtl" : ""}`}>
//       {/* Back link */}
//       <a href="/provider/orders" className="text-sm text-gray-500 hover:text-gray-700">
//         {translate("back", lang)}
//       </a>

//       {/* Header */}
//       <div className={`flex justify-between items-start ${isRTL ? "flex-row-reverse" : ""}`}>
//         <div>
//           <div className="flex items-center gap-3 mb-1 flex-wrap">
//             <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
//             <span className={`px-3 py-1 text-sm font-medium rounded-full ${status.color}`}>
//               {status.icon} {status.label}
//             </span>
//             {order.is_overdue && (
//               <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
//                 ⏰ {translate("overdue", lang)}
//               </span>
//             )}
//           </div>
//           <p className="text-gray-600">{order.service_name}</p>
//           {order.package_name && (
//             <p className="text-gray-400 text-sm mt-1">
//               {translate("package", lang)}: {order.package_name}
//             </p>
//           )}
//         </div>
//       </div>

//       {/* Alerts */}
//       {error && (
//         <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
//           {error}
//           <button onClick={() => setError(null)} className="float-right font-bold">×</button>
//         </div>
//       )}
//       {successMsg && (
//         <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
//           ✓ {successMsg}
//         </div>
//       )}

//       {/* Revision Alert */}
//       {order.status === "revision_requested" && (
//         <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-sm">
//           ⚠️ {translate("revisionRequested", lang)}
//         </div>
//       )}

//       {/* Earnings Breakdown */}
//       <div className="bg-gray-50 rounded-xl p-5 space-y-3">
//         <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
//           {translate("earnings", lang)}
//         </h3>
//         <Row label={translate("totalOrder", lang)} value={`$${Number(order.total_amount).toFixed(2)}`} isRTL={isRTL} />
//         {order.platform_fee && (
//           <Row
//             label={translate("platformFee", lang)}
//             value={`-$${Number(order.platform_fee).toFixed(2)}`}
//             isRTL={isRTL}
//             valueClass="text-red-500"
//           />
//         )}
//         <div className="border-t border-gray-200 pt-2">
//           <Row
//             label={translate("youEarn", lang)}
//             value={`$${Number(order.provider_earning || order.total_amount).toFixed(2)}`}
//             isRTL={isRTL}
//             labelClass="font-bold"
//             valueClass="font-bold text-green-600"
//           />
//         </div>
//       </div>

//       {/* Order Info */}
//       <div className="bg-gray-50 rounded-xl p-5 space-y-3">
//         <Row label={translate("customer", lang)} value={order.customer_name || "—"} isRTL={isRTL} />
//         <Row label={translate("ordered", lang)} value={new Date(order.created_at).toLocaleDateString()} isRTL={isRTL} />
//         {order.due_date && (
//           <Row label={translate("dueDate", lang)} value={new Date(order.due_date).toLocaleDateString()} isRTL={isRTL} />
//         )}
//         <Row
//           label={translate("revisionsUsed", lang)}
//           value={`${order.revisions_used || 0} / ${order.revisions_allowed || 0}`}
//           isRTL={isRTL}
//         />
//       </div>

//       {/* Customer Requirements */}
//       {order.requirements && Object.keys(order.requirements).length > 0 && (
//         <div className="bg-blue-50 rounded-xl p-5 space-y-3">
//           <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
//             {translate("requirements", lang)}
//           </h3>
//           {Object.entries(order.requirements).map(([key, value]) => (
//             <div key={key} className="text-sm">
//               <span className="font-medium text-gray-700 capitalize">
//                 {key.replace(/_/g, " ")}:
//               </span>{" "}
//               <span className="text-gray-600">{String(value)}</span>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* === ACTION PANELS === */}

//       {/* New Order — Accept / Decline */}
//       {order.status === "paid" && (
//         <div className="bg-blue-50 rounded-xl p-5 space-y-4">
//           <h3 className="font-bold text-blue-800">
//             🔔 New order assigned to you
//           </h3>
//           <p className="text-sm text-blue-700">
//             Review the requirements above and accept or decline this order.
//           </p>
//           <div className="flex gap-3">
//             <button
//               onClick={handleAccept}
//               disabled={actionLoading}
//               className="flex-1 py-3 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
//               style={{ backgroundColor: "#10B981" }}
//             >
//               {actionLoading ? "..." : `✓ ${translate("acceptOrder", lang)}`}
//             </button>
//             <button
//               onClick={handleDecline}
//               disabled={actionLoading}
//               className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50"
//             >
//               {translate("declineOrder", lang)}
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Accepted — Start Work */}
//       {order.status === "accepted" && (
//         <div className="bg-indigo-50 rounded-xl p-5 space-y-4">
//           <h3 className="font-bold text-indigo-800">
//             ✅ Order accepted — ready to begin
//           </h3>
//           <p className="text-sm text-indigo-700">
//             Click "Start Working" when you begin. This sets the due date based on delivery days.
//           </p>
//           <button
//             onClick={handleStartWork}
//             disabled={actionLoading}
//             className="w-full py-3 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
//             style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
//           >
//             {actionLoading ? "..." : `🚀 ${translate("startWork", lang)}`}
//           </button>
//         </div>
//       )}

//       {/* In Progress / Revision — File Upload + Deliver */}
//       {canDeliver && (
//         <div className="space-y-4">
//           {/* File Upload */}
//           <FileUploadZone
//             tenantId={tenantId}
//             orderId={orderId}
//             theme={theme}
//             lang={lang}
//             isRTL={isRTL}
//             onUploadComplete={loadOrder}
//           />

//           {/* Delivery Submission */}
//           <div className="bg-green-50 rounded-xl p-5 space-y-4">
//             <h3 className="font-bold text-green-800">
//               📦 {translate("deliver", lang)}
//             </h3>
//             <textarea
//               value={deliveryMessage}
//               onChange={(e) => setDeliveryMessage(e.target.value)}
//               placeholder={translate("deliveryMsg", lang)}
//               rows={3}
//               className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-200 focus:border-transparent"
//             />
//             <button
//               onClick={handleDeliver}
//               disabled={actionLoading || !deliveryMessage.trim()}
//               className="w-full py-3 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50"
//               style={{ backgroundColor: "#10B981" }}
//             >
//               {actionLoading ? "..." : `📦 ${translate("deliver", lang)}`}
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Existing Files */}
//       <OrderFilesDisplay files={order.files} lang={lang} isRTL={isRTL} />

//       {/* Customer Review */}
//       {order.review && (
//         <div className="bg-yellow-50 rounded-xl p-5">
//           <h3 className="font-bold text-gray-900 mb-2">{translate("review", lang)}</h3>
//           <div className="flex gap-1 mb-2">
//             {[1, 2, 3, 4, 5].map((s) => (
//               <span key={s} className={s <= order.review.rating ? "text-yellow-400" : "text-gray-300"}>
//                 ★
//               </span>
//             ))}
//           </div>
//           {order.review.comment && (
//             <p className="text-sm text-gray-600">{order.review.comment}</p>
//           )}
//         </div>
//       )}

//       {/* Messages */}
//       <div className="space-y-4">
//         <h3 className="font-bold text-gray-900">{translate("messages", lang)}</h3>

//         <div className="space-y-3 max-h-80 overflow-y-auto">
//           {messages.length === 0 ? (
//             <p className="text-gray-400 text-center py-6 text-sm">{translate("noMessages", lang)}</p>
//           ) : (
//             messages.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={`p-3 rounded-lg ${
//                   msg.is_system
//                     ? "bg-blue-50 text-blue-800 text-sm italic"
//                     : msg.sender_type === "provider"
//                     ? "bg-gray-100 ml-8"
//                     : "bg-white border mr-8"
//                 }`}
//               >
//                 <p className="text-sm">{msg.content}</p>
//                 <p className="text-xs text-gray-400 mt-1">
//                   {msg.sender_name} · {new Date(msg.created_at).toLocaleString()}
//                 </p>
//               </div>
//             ))
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Send Message */}
//         {!["completed", "cancelled", "refunded"].includes(order.status) && (
//           <div className="flex gap-2">
//             <input
//               value={newMessage}
//               onChange={(e) => setNewMessage(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
//               placeholder={translate("sendMsg", lang)}
//               className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-transparent"
//             />
//             <button
//               onClick={handleSendMessage}
//               className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90"
//               style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
//             >
//               {translate("send", lang)}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // =============================================================================
// // FILE UPLOAD ZONE (Drag & Drop + Click)
// // =============================================================================
// function FileUploadZone({ tenantId, orderId, theme, lang, isRTL, onUploadComplete }) {
//   const [dragActive, setDragActive] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState([]);
//   const [category, setCategory] = useState("delivery");
//   const fileInputRef = useRef(null);

//   const handleDrag = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   }, []);

//   const processFiles = useCallback(
//     async (files) => {
//       if (!files || files.length === 0) return;
//       setUploading(true);

//       const fileArr = Array.from(files);
//       const progress = fileArr.map((f) => ({
//         name: f.name,
//         status: "uploading",
//         error: null,
//       }));
//       setUploadProgress([...progress]);

//       for (let i = 0; i < fileArr.length; i++) {
//         try {
//           await uploadOrderFile(tenantId, orderId, fileArr[i], category);
//           progress[i].status = "done";
//         } catch (e) {
//           progress[i].status = "error";
//           progress[i].error = e.message;
//         }
//         setUploadProgress([...progress]);
//       }

//       setUploading(false);

//       // Clear progress after delay if all succeeded
//       const allDone = progress.every((p) => p.status === "done");
//       if (allDone) {
//         setTimeout(() => setUploadProgress([]), 2000);
//       }

//       onUploadComplete?.();
//     },
//     [tenantId, orderId, category, onUploadComplete]
//   );

//   const handleDrop = useCallback(
//     (e) => {
//       e.preventDefault();
//       e.stopPropagation();
//       setDragActive(false);
//       processFiles(e.dataTransfer.files);
//     },
//     [processFiles]
//   );

//   const handleFileInput = useCallback(
//     (e) => {
//       processFiles(e.target.files);
//       e.target.value = "";
//     },
//     [processFiles]
//   );

//   return (
//     <div className="space-y-3">
//       <div className="flex items-center justify-between">
//         <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
//           {translate("uploadFiles", lang)}
//         </h3>

//         {/* Category selector */}
//         <div className="flex items-center gap-2">
//           <span className="text-xs text-gray-500">{translate("fileCategory", lang)}:</span>
//           <select
//             value={category}
//             onChange={(e) => setCategory(e.target.value)}
//             className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white"
//           >
//             <option value="delivery">{translate("delivery", lang)}</option>
//             <option value="work">{translate("work", lang)}</option>
//           </select>
//         </div>
//       </div>

//       {/* Drop Zone */}
//       <div
//         onDragEnter={handleDrag}
//         onDragLeave={handleDrag}
//         onDragOver={handleDrag}
//         onDrop={handleDrop}
//         onClick={() => fileInputRef.current?.click()}
//         className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
//           dragActive
//             ? "border-blue-400 bg-blue-50"
//             : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
//         }`}
//       >
//         <input
//           ref={fileInputRef}
//           type="file"
//           multiple
//           onChange={handleFileInput}
//           className="hidden"
//         />
//         <div className="text-4xl mb-2">{dragActive ? "📥" : "📎"}</div>
//         <p className="text-sm text-gray-600">{translate("dragDrop", lang)}</p>
//         <p className="text-xs text-gray-400 mt-1">
//           {category === "delivery" ? "📦" : "📁"}{" "}
//           {category === "delivery" ? translate("delivery", lang) : translate("work", lang)}
//         </p>
//       </div>

//       {/* Upload Progress */}
//       {uploadProgress.length > 0 && (
//         <div className="space-y-2">
//           {uploadProgress.map((item, idx) => (
//             <div
//               key={idx}
//               className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
//                 item.status === "uploading"
//                   ? "bg-blue-50 text-blue-700"
//                   : item.status === "done"
//                   ? "bg-green-50 text-green-700"
//                   : "bg-red-50 text-red-700"
//               }`}
//             >
//               <span className="text-lg">
//                 {item.status === "uploading" ? "⏳" : item.status === "done" ? "✅" : "❌"}
//               </span>
//               <span className="flex-1 truncate">{item.name}</span>
//               {item.status === "uploading" && (
//                 <span className="text-xs">{translate("uploading", lang)}</span>
//               )}
//               {item.error && <span className="text-xs">{item.error}</span>}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// // =============================================================================
// // ORDER FILES DISPLAY
// // =============================================================================
// function OrderFilesDisplay({ files, lang, isRTL }) {
//   if (!files || files.length === 0) return null;

//   const workFiles = files.filter((f) => f.category === "work");
//   const deliveryFiles = files.filter((f) => f.category === "delivery");
//   const requirementFiles = files.filter((f) => f.category === "requirement");

//   function renderFileList(fileList, title) {
//     if (fileList.length === 0) return null;
//     return (
//       <div className="space-y-2">
//         <h4 className="text-sm font-medium text-gray-700">{title}</h4>
//         {fileList.map((file) => (
//           <a
//             key={file.id}
//             href={file.file_url || file.file}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="flex items-center gap-3 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             <span className="text-xl">📄</span>
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-medium text-gray-900 truncate">
//                 {file.original_filename || file.file_name}
//               </p>
//               <p className="text-xs text-gray-500">
//                 {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ""}
//                 {file.uploaded_at ? ` · ${new Date(file.uploaded_at).toLocaleDateString()}` : ""}
//               </p>
//             </div>
//           </a>
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {renderFileList(deliveryFiles, `📦 ${translate("deliveryFiles", lang)}`)}
//       {renderFileList(workFiles, `📁 ${translate("workFiles", lang)}`)}
//       {renderFileList(requirementFiles, `📋 ${translate("requirements", lang)}`)}
//     </div>
//   );
// }

// // =============================================================================
// // UTILITIES
// // =============================================================================
// function Row({ label, value, isRTL, labelClass = "", valueClass = "" }) {
//   return (
//     <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
//       <span className={`text-gray-500 text-sm ${labelClass}`}>{label}</span>
//       <span className={`font-medium text-gray-900 text-sm ${valueClass}`}>{value}</span>
//     </div>
//   );
// }