// src/app/provider/orders/orderApi.js
/**
 * Provider Order API
 *
 * Maps ProviderOrdersDashboard function calls to existing backend endpoints.
 * Backend already enforces provider isolation (tenant + provider profile filter)
 * and transition restrictions (paid→in_progress, in_progress→delivered only).
 *
 * No new endpoints. No backend changes.
 */
import { apiFetch as authFetch } from '@/lib/apiClient';


// =========================================================================
// QUERIES
// =========================================================================

/**
 * Fetch all orders assigned to the current provider.
 * Backend filters by tenant + provider profile automatically via get_queryset.
 *
 * @param {Object} [filters] - Optional filters
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.search] - Search by order number, service, customer
 */
export async function fetchProviderOrders(tenantId, filters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);

  const qs = params.toString() ? `?${params}` : "";

  const data = await authFetch(`/api/v1/orders/${qs}`, tenantId);

  return data.results || data;
}

/**
 * Fetch single order detail.
 * Backend returns 404 if provider doesn't own this order.
 *
 * @param {string} orderId
 */
export async function fetchOrderDetail(tenantId,orderId) {
  return authFetch(`/api/v1/orders/${orderId}/`,tenantId);
}

// =========================================================================
// STATUS TRANSITIONS (mapped to update-status endpoint)
// =========================================================================

/**
 * Start work on a paid order.
 * Maps to: POST /api/v1/orders/{id}/update-status/ { status: "in_progress" }
 *
 * @param {string} orderId
 * @param {string} [note]
 */
export async function startWork(tenantId, orderId, note = "") {
  return authFetch(`/api/v1/orders/${orderId}/update-status/`, tenantId, {
    method: "POST",
    body: JSON.stringify({
      status: "in_progress",
      note
    }),
  });
}

/**
 * Mark order as delivered.
 * Maps to: POST /api/v1/orders/{id}/update-status/ { status: "delivered" }
 *
 * @param {string} orderId
 * @param {string} [note]
 */
export async function deliverOrder(tenantId, orderId, note = "") {
  return authFetch(`/api/v1/orders/${orderId}/update-status/`, tenantId, {
    method: "POST",
    body: JSON.stringify({
      status: "delivered",
      note
    }),
  });
}

// =========================================================================
// MESSAGING
// =========================================================================

/**
 * Send a message on an order.
 * Maps to: POST /api/v1/orders/{id}/add-message/
 *
 * @param {string} orderId
 * @param {string} content
 */
export async function sendOrderMessage(tenantId, orderId, content) {
  return authFetch(`/api/v1/orders/${orderId}/add-message/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// =========================================================================
// FILE UPLOAD
// =========================================================================

/**
 * Upload a file to an order.
 * Maps to: POST /api/v1/orders/{id}/add-file/
 *
 * Uses FormData (not JSON) because we're sending a binary file.
 *
 * @param {string} orderId
 * @param {File} file
 * @param {string} [description]
 */
export async function uploadOrderFile(tenantId, orderId, file, description = "") {

  const formData = new FormData();
  formData.append("file", file);

  if (description) {
    formData.append("description", description);
  }

  return authFetch(`/api/v1/orders/${orderId}/add-file/`, tenantId, {
    method: "POST",
    body: formData,
  });
}

// =========================================================================
// STATUS CONFIG (pure frontend — no API call)
// =========================================================================

const STATUS_MAP = {
  pending_payment: { label: "Pending Payment", color: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-400" },
  paid:            { label: "Paid",            color: "bg-blue-100 text-blue-800",     dot: "bg-blue-400" },
  in_progress:     { label: "In Progress",     color: "bg-purple-100 text-purple-800", dot: "bg-purple-400" },
  delivered:       { label: "Delivered",        color: "bg-teal-100 text-teal-800",     dot: "bg-teal-400" },
  completed:       { label: "Completed",        color: "bg-green-100 text-green-800",   dot: "bg-green-400" },
  cancelled:       { label: "Cancelled",        color: "bg-red-100 text-red-800",       dot: "bg-red-400" },
  refunded:        { label: "Refunded",         color: "bg-gray-100 text-gray-800",     dot: "bg-gray-400" },
};

/**
 * Get display config for a status value.
 *
 * @param {string} status
 * @returns {{ label: string, color: string, dot: string }}
 */
export function getStatusConfig(status) {
  return STATUS_MAP[status] || { label: status, color: "bg-gray-100 text-gray-800", dot: "bg-gray-400" };
}

// =========================================================================
// UNSUPPORTED ACTIONS (explicit errors — not silent no-ops)
// =========================================================================

/**
 * @deprecated Backend does not support accept/decline.
 * Orders are assigned to providers automatically.
 */
export function acceptOrder() {
  throw new Error(
    "acceptOrder is not supported. Orders are auto-assigned to providers. Use startWork() to begin."
  );
}

/** @deprecated Backend does not support accept/decline. */
export function declineOrder() {
  throw new Error(
    "declineOrder is not supported. Contact the tenant admin to reassign this order."
  );
}