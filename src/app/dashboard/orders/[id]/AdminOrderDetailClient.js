// src/app/dashboard/orders/[id]/AdminOrderDetailClient.js
"use client";

/**
 * AdminOrderDetailClient — Dashboard Order Detail (premium SaaS workspace).
 *
 * Business logic is unchanged. API endpoints used (Step 10 backend):
 *   GET  /api/v1/orders/{id}/                  ← order detail
 *   POST /api/v1/orders/{id}/start_work/       ← start / resume work
 *   POST /api/v1/orders/{id}/deliver/          ← mark delivered
 *   POST /api/v1/orders/{id}/complete/         ← complete order
 *   POST /api/v1/orders/{id}/assign_provider/  ← assign provider
 *   POST /api/v1/orders/{id}/cancel/           ← cancel
 *   PATCH /api/v1/orders/{id}/update_details/  ← edit details
 *   messages / upload_file                     ← via OrderConversation
 */

import { apiFetch as authFetch } from '@/lib/apiClient';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useTenantPermission } from "@/lib/useTenantPermission";
import { useRealtime } from "@/lib/realtime";
import { applyOrderEnvelope } from "@/lib/realtimePatches";
import { uploadWithProgress } from "@/lib/uploadWithProgress";
import Cookies from "js-cookie";

import { BrandRoot } from "@/components/ui/brand";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import StatusPill from "@/components/ui/StatusPill";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Modal, { ModalFooter } from "@/components/ui/Modal";
import Drawer from "@/components/ui/Drawer";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Field from "@/components/ui/Field";
import { Skeleton } from "@/components/ui";

import ProviderPicker from "@/components/dashboard/providers/ProviderPicker";
import {
  OrderStatusBadge, OrderStatusTimeline, OrderProgressCard, OrderConversation,
} from "@/components/orders";
import { CallDock } from "@/components/collaboration";

import OrderOverviewCard from "./components/OrderOverviewCard";
import OrderSidebar from "./components/OrderSidebar";
import OrderActivity from "./components/OrderActivity";
import OrderFilesCard from "./components/OrderFilesCard";
import OrderActionButtons from "./components/OrderActionButtons";
import OrderMoreMenu from "./components/OrderMoreMenu";
import { getPaymentState, getInitials } from "../components/orderPresentation";

import { ArrowLeft, MoreVertical, LayoutPanelLeft, MessageSquare, History } from "lucide-react";

const _API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Admin actions per status → backend endpoint/flow (unchanged).
const ADMIN_ACTIONS = {
  pending_assignment: [{ action: "assign_provider", label: "Assign Provider", style: "primary" }],
  pending_payment: [],
  paid: [],
  accepted: [
    { endpoint: "start_work", label: "Start Work", style: "primary" },
    { action: "cancel", label: "Cancel", style: "danger" },
  ],
  in_progress: [
    { action: "deliver", label: "Mark Delivered", style: "primary" },
    { action: "cancel", label: "Cancel", style: "danger" },
  ],
  delivered: [{ action: "complete", label: "Complete Order", style: "success" }],
  revision_requested: [
    { endpoint: "start_work", label: "Resume Work", style: "primary" },
    { action: "cancel", label: "Cancel", style: "danger" },
  ],
  completed: [],
  cancelled: [],
  refunded: [],
};

export default function AdminOrderDetailClient({ orderId }) {
  const router = useRouter();
  const { activeTenant, user, t, isRTL } = useApp();
  const { markTargetRead } = useNotifications();

  // Clear this order's unread message notifications on open.
  useEffect(() => {
    if (orderId) markTargetRead("order", orderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const { allowed: canManage } = useTenantPermission("orders.manage");
  const isAgency = activeTenant?.has_providers === true;
  const tenantId = activeTenant?.id || activeTenant;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const [tab, setTab] = useState("chat"); // mobile: overview | chat | activity
  const [showActionSheet, setShowActionSheet] = useState(false);

  // Modals
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  const openEditModal = () => {
    setEditForm({
      service_name: order?.service_name || "",
      service_description: order?.service_description || "",
      delivery_days: order?.delivery_days ?? "",
      revisions_allowed: order?.revisions_allowed ?? "",
      total_amount: order?.total_amount ?? "",
      currency: order?.currency || "SAR",
      customer_name: order?.customer_name || "",
      customer_email: order?.customer_email || "",
      customer_phone: order?.customer_phone || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      setActionLoading("edit");
      await authFetch(`/api/v1/orders/${orderId}/update_details/`, tenantId, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setShowEditModal(false);
      await fetchOrder();
    } catch (err) {
      alert(err.data?.error || err.message || "Failed to save changes.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Fetch order detail ───
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!tenantId) { router.push("/auth/login"); return; }
      const data = await authFetch(`/api/v1/orders/${orderId}/`, tenantId);
      setOrder(data);
    } catch (err) {
      if (err.status === 401) { router.push("/auth/login"); return; }
      if (err.status === 404) { setError("Order not found."); return; }
      setError(err.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId, tenantId, router]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // ─── Realtime — patch order in place from order:<id> topic ───
  useRealtime({
    topics: orderId ? [`order:${orderId}`] : [],
    auth: { jwt: Cookies.get("access_token") || null },
    onEvent: (envelope) => { setOrder((prev) => applyOrderEnvelope(prev, envelope)); },
    onReconnect: () => { fetchOrder(); },
  });

  const fetchProviders = async () => {
    setProvidersLoading(true);
    try {
      const path = order.service_id ? `/api/v1/services/${order.service_id}/providers/` : `/api/v1/providers/`;
      const data = await authFetch(path, tenantId);
      setProviders(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      console.error(err);
      setProviders([]);
    } finally {
      setProvidersLoading(false);
    }
  };

  const callAction = async (endpoint) => {
    try {
      setActionLoading(endpoint);
      await authFetch(`/api/v1/orders/${orderId}/${endpoint}/`, tenantId, { method: "POST" });
      await fetchOrder();
    } catch (err) {
      alert(err.message || `Failed: ${endpoint}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliver = async () => {
    try {
      setActionLoading("deliver");
      await authFetch(`/api/v1/orders/${orderId}/deliver/`, tenantId, {
        method: "POST", body: JSON.stringify({ message: deliveryMessage }),
      });
      setShowDeliverModal(false);
      setDeliveryMessage("");
      await fetchOrder();
    } catch (err) {
      console.error(err);
      alert(err.data?.error || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading("cancel");
      await authFetch(`/api/v1/orders/${orderId}/cancel/`, tenantId, {
        method: "POST", body: JSON.stringify({ reason: cancelReason }),
      });
      setShowCancelModal(false);
      setCancelReason("");
      await fetchOrder();
    } catch (err) {
      alert(err.message || "Failed to cancel.");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmAssignProvider = async () => {
    if (!selectedProvider) return;
    try {
      setActionLoading("assign_provider");
      await authFetch(`/api/v1/orders/${orderId}/assign_provider/`, tenantId, {
        method: "POST", body: JSON.stringify({ provider_id: selectedProvider }),
      });
      setShowAssignModal(false);
      setSelectedProvider(null);
      await fetchOrder();
    } catch (err) {
      alert(err.message || "Failed to assign provider");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading("complete");
      await authFetch(`/api/v1/orders/${orderId}/complete/`, tenantId, { method: "POST" });
      await fetchOrder();
    } catch (err) {
      alert(err.message || "Failed to complete.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Action dispatcher (unchanged behaviour) ───
  const handleAction = (actionDef) => {
    if (!canManage) return;
    if (actionDef.kind === "edit") { openEditModal(); return; }
    if (actionDef.action === "cancel") setShowCancelModal(true);
    else if (actionDef.action === "assign_provider") { setShowAssignModal(true); fetchProviders(); }
    else if (actionDef.action === "complete") handleComplete();
    else if (actionDef.action === "deliver") setShowDeliverModal(true);
    else if (actionDef.endpoint) callAction(actionDef.endpoint);
  };

  const onSelectAction = (item) => { setShowActionSheet(false); handleAction(item); };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
        <Skeleton className="h-6 w-40 mb-5" />
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
          <div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-[60vh]" /></div>
          <div className="space-y-4 mt-4 lg:mt-0"><Skeleton className="h-40" /><Skeleton className="h-56" /></div>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center py-20">
        <p className="text-danger text-lg mb-4">{error || "Order not found."}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={fetchOrder}>{t("common.tryAgain")}</Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard/orders")}>{t("orderDetail.backToOrders")}</Button>
        </div>
      </div>
    );
  }

  const status = order.status;
  const isTerminal = ["completed", "cancelled", "refunded"].includes(status);
  const payMeta = getPaymentState(order, t);
  const customerName = order.customer_name_display || order.customer_name || "—";

  // Build actions (agency filtering preserved).
  let actions = ADMIN_ACTIONS[status] || [];
  if (!isAgency && status !== "pending_assignment") {
    actions = actions.filter((a) => a.action !== "assign_provider");
  }
  const primary = actions.find((a) => a.style === "primary" || a.style === "success") || null;
  const editItem = canManage && !isTerminal ? { kind: "edit", label: t("orderDetail.editDetails"), style: "secondary" } : null;
  const restItems = [...actions.filter((a) => a !== primary), editItem].filter(Boolean); // header "more" + sheet
  const sidebarItems = canManage ? [...actions, editItem].filter(Boolean) : [];
  const showActions = canManage && (primary || restItems.length > 0);

  const callDock = (
    <CallDock
      subjectType="order"
      subjectId={orderId}
      tenantId={tenantId}
      authMode="jwt"
      jwt={Cookies.get("access_token") || null}
      selfUserId={user?.id}
      selfName={user?.full_name || user?.name || "You"}
      canStart={
        !!(order.provider || order.provider_id) &&
        ["accepted", "in_progress", "delivered", "revision_requested"].includes(status)
      }
    />
  );

  const conversation = (
    <OrderConversation
      order={order}
      viewer="admin"
      fill
      locked={isTerminal}
      lockedMessage="This order is closed."
      showComposer={!isTerminal}
      onSendMessage={async (content) => {
        await authFetch(`/api/v1/orders/${orderId}/messages/`, tenantId, {
          method: "POST", body: JSON.stringify({ content }),
        });
      }}
      onUploadFile={async (file, { onProgress, signal }) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("category", "delivery");
        const headers = { "X-Tenant": tenantId };
        const token = Cookies.get("access_token");
        if (token) headers.Authorization = `Bearer ${token}`;
        await uploadWithProgress(`${_API_BASE}/api/v1/orders/${orderId}/upload_file/`, fd, { headers, onProgress, signal });
      }}
    />
  );

  const tabItems = [
    { value: "overview", label: t("orderDetail.overview"), icon: LayoutPanelLeft },
    { value: "chat", label: t("orderDetail.chat"), icon: MessageSquare },
    { value: "activity", label: t("orderDetail.activity"), icon: History },
  ];

  const hide = (t0) => (tab !== t0 ? "max-lg:hidden" : "");

  return (
    <BrandRoot>
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
        {/* Back */}
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          {t("orderDetail.backToOrders")}
        </button>

        {/* Header */}
        <header className="rounded-xl border border-border bg-card p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground hidden sm:flex items-center justify-center text-sm font-semibold shrink-0">
              {getInitials(customerName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{order.service_name || "Order"}</h1>
                <span className="text-xs font-mono text-muted-foreground">#{order.order_number}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-muted-foreground truncate">{customerName}</span>
                <OrderStatusBadge status={status} size="sm" />
                <Badge variant={payMeta.tone}>{payMeta.label}</Badge>
              </div>
            </div>

            {/* Desktop actions */}
            {showActions && (
              <div className="hidden lg:flex items-center gap-2 shrink-0">
                {primary && (
                  <Button
                    variant={primary.style === "success" ? "success" : "primary"}
                    size="md"
                    loading={actionLoading === (primary.endpoint || primary.action)}
                    disabled={actionLoading != null}
                    onClick={() => handleAction(primary)}
                  >
                    {primary.label}
                  </Button>
                )}
                <OrderMoreMenu items={restItems} onSelect={handleAction} label={t("orderDetail.moreActions")} />
              </div>
            )}
          </div>
        </header>

        {/* Mobile segmented navigation */}
        <div className="lg:hidden mb-4">
          <Tabs value={tab} onChange={setTab} items={tabItems} variant="segment" className="w-full" />
        </div>

        {/* Workspace */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:items-start">
          {/* MAIN column */}
          <div className="space-y-4 min-w-0">
            {/* Overview + progress */}
            <div className={`space-y-4 ${hide("overview")}`}>
              <OrderOverviewCard order={order} />
              <div className="rounded-xl border border-border bg-card p-4">
                <OrderStatusTimeline status={status} />
              </div>
              <OrderProgressCard
                order={order}
                viewer="admin"
                providerName={order.provider_name}
                customerName={order.customer_name}
                onAction={status === "pending_assignment" && canManage ? () => { setShowAssignModal(true); fetchProviders(); } : undefined}
              />
            </div>

            {/* Conversation */}
            <div className={`${hide("chat")} rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[70vh] min-h-[440px]`}>
              <div className="hidden lg:flex items-center gap-2 px-4 h-12 border-b border-border shrink-0">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{t("orderDetail.chat")}</h2>
              </div>
              <div className="flex-1 min-h-0">{conversation}</div>
            </div>

            {/* Files + Activity */}
            <div className={`space-y-4 ${hide("activity")}`}>
              <OrderFilesCard order={order} />
              <OrderActivity order={order} />
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className={`${hide("overview")} mt-4 lg:mt-0 lg:sticky lg:top-4`}>
            <OrderSidebar
              order={order}
              callSlot={callDock}
              actionsSlot={sidebarItems.length > 0 ? (
                <OrderActionButtons items={sidebarItems} onSelect={handleAction} actionLoading={actionLoading} />
              ) : null}
            />
          </aside>
        </div>

        {/* Mobile sticky action bar (hidden on chat tab) */}
        {showActions && (
          <div
            className={`${tab === "chat" ? "hidden" : "flex"} lg:hidden fixed inset-x-0 bottom-0 z-30 items-center gap-2 border-t border-border bg-surface p-3`}
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            {primary && (
              <Button
                variant={primary.style === "success" ? "success" : "primary"}
                size="md"
                className="flex-1"
                loading={actionLoading === (primary.endpoint || primary.action)}
                disabled={actionLoading != null}
                onClick={() => handleAction(primary)}
              >
                {primary.label}
              </Button>
            )}
            {restItems.length > 0 && (
              <IconButton label={t("orderDetail.moreActions")} icon={MoreVertical} variant="outline" onClick={() => setShowActionSheet(true)} />
            )}
          </div>
        )}
        {/* spacer so content isn't hidden behind the fixed bar on mobile */}
        {showActions && tab !== "chat" && <div className="h-20 lg:hidden" aria-hidden="true" />}
      </div>

      {/* Mobile actions bottom sheet */}
      <Drawer open={showActionSheet} onClose={() => setShowActionSheet(false)} side="bottom" title={t("orderDetail.actions")}>
        <OrderActionButtons items={sidebarItems} onSelect={onSelectAction} actionLoading={actionLoading} />
      </Drawer>

      {/* Cancel modal */}
      <Modal open={showCancelModal} onClose={() => { setShowCancelModal(false); setCancelReason(""); }} title={t("orderDetail.cancelOrder")} description={t("orderDetail.cancelWarning")} size="md">
        <Textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder={t("orderDetail.cancelReason")} />
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setShowCancelModal(false); setCancelReason(""); }}>{t("orderDetail.keepOrder")}</Button>
          <Button variant="danger" loading={actionLoading === "cancel"} onClick={handleCancel}>{t("orderDetail.confirmCancel")}</Button>
        </ModalFooter>
      </Modal>

      {/* Deliver modal */}
      <Modal open={showDeliverModal} onClose={() => { setShowDeliverModal(false); setDeliveryMessage(""); }} title={t("orderDetail.deliverOrder")} description={t("orderDetail.deliverDescription")} size="md">
        <Textarea rows={4} value={deliveryMessage} onChange={(e) => setDeliveryMessage(e.target.value)} placeholder={t("orderDetail.deliveryMessage")} />
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setShowDeliverModal(false); setDeliveryMessage(""); }}>{t("orderDetail.keepOrder")}</Button>
          <Button variant="primary" loading={actionLoading === "deliver"} onClick={handleDeliver}>{t("orderDetail.confirmDelivery")}</Button>
        </ModalFooter>
      </Modal>

      {/* Assign provider modal */}
      <Modal open={showAssignModal} onClose={() => { setShowAssignModal(false); setSelectedProvider(null); }} title={t("orderDetail.assignProvider")} description={t("orderDetail.selectProvider")} size="lg">
        <ProviderPicker
          providers={providers}
          loading={providersLoading}
          value={selectedProvider}
          onChange={(id) => setSelectedProvider(id)}
          currentProviderId={order.provider}
        />
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setShowAssignModal(false); setSelectedProvider(null); }}>{t("orderDetail.keepOrder")}</Button>
          <Button variant="primary" loading={actionLoading === "assign_provider"} disabled={!selectedProvider || actionLoading != null} onClick={confirmAssignProvider}>{t("orderDetail.assign")}</Button>
        </ModalFooter>
      </Modal>

      {/* Edit details modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title={t("orderDetail.editDetails")} size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto pe-1">
          {[
            { key: "service_name", label: t("orderDetail.service"), type: "text", span: 2 },
            { key: "service_description", label: t("orderDetail.requirements"), type: "textarea", span: 2 },
            { key: "delivery_days", label: t("orderDetail.delivery"), type: "number" },
            { key: "revisions_allowed", label: t("orderDetail.revisions"), type: "number" },
            { key: "total_amount", label: t("orderDetail.amount"), type: "number", step: "0.01" },
            { key: "currency", label: "Currency", type: "text" },
            { key: "customer_name", label: t("orderDetail.customer"), type: "text" },
            { key: "customer_email", label: "Email", type: "email" },
            { key: "customer_phone", label: "Phone", type: "text", span: 2 },
          ].map((f) => (
            <Field key={f.key} label={f.label} htmlFor={`edit-${f.key}`} className={f.span === 2 ? "sm:col-span-2" : ""}>
              {f.type === "textarea" ? (
                <Textarea id={`edit-${f.key}`} rows={3} value={editForm[f.key] ?? ""} onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })} />
              ) : (
                <Input id={`edit-${f.key}`} type={f.type} step={f.step} value={editForm[f.key] ?? ""} onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })} />
              )}
            </Field>
          ))}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowEditModal(false)}>{t("orderDetail.keepOrder")}</Button>
          <Button variant="primary" loading={actionLoading === "edit"} onClick={handleEditSubmit}>{t("common.saveChanges") || "Save changes"}</Button>
        </ModalFooter>
      </Modal>
    </BrandRoot>
  );
}
