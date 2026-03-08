// src/app/tenant-site/api/orderApi.js
/**
 * Order API Client
 *
 * Endpoints match the Step 2 backend (OrderViewSet):
 *   GET    /api/v1/orders/my-orders/              → customer's orders
 *   GET    /api/v1/orders/{id}/                   → order detail
 *   POST   /api/v1/orders/initiate-payment/       → create order + Stripe PI
 *   POST   /api/v1/orders/{id}/add-message/       → send message
 *   POST   /api/v1/orders/{id}/add-file/          → upload file
 *   POST   /api/v1/orders/{id}/complete/          → accept delivery
 *   POST   /api/v1/orders/{id}/cancel/            → cancel order
 *   POST   /api/v1/orders/{id}/review/            → submit review
 *
 * Step 6 Fix: Verified all paths match backend url_path values.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";


// ─── Helper: build headers with auth + tenant ───
function buildHeaders(domain, token) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (domain) {
    headers["X-Tenant"] = domain;
  }

  return headers;
}

// ─── Helper: handle response ───
async function handleResponse(res) {
  if (!res.ok) {
    const err = new Error(`API error: ${res.status}`);
    err.status = res.status;
    try {
      err.data = await res.json();
    } catch {
      // response may not be JSON
    }
    throw err;
  }
  return res.json();
}

// =========================================================================
// ORDER LIST & DETAIL
// =========================================================================

/**
 * Get customer's orders for this tenant.
 * Backend: GET /api/v1/orders/my-orders/
 */
export async function getMyOrders(domain, token) {
  const res = await fetch(`${API_BASE}/api/v1/orders/my-orders/`, {
    method: "GET",
    headers: buildHeaders(domain, token),
  });
  return handleResponse(res);
}

/**
 * Get a single order's full detail.
 * Backend: GET /api/v1/orders/{id}/
 */
export async function getOrderDetail(domain, orderId, token) {
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/`, {
    method: "GET",
    headers: buildHeaders(domain, token),
  });
  return handleResponse(res);
}

// =========================================================================
// ORDER CREATION (PAYMENT)
// =========================================================================

/**
 * Create an order and get Stripe PaymentIntent client_secret.
 * Backend: POST /api/v1/orders/initiate-payment/
 *
 * Accepts both service_id and service_slug (Step 2 fix).
 *
 * @param {string} domain - tenant domain
 * @param {Object} payload - { service_id?, service_slug?, package_id?, requirements? }
 * @param {string} token - JWT token
 * @returns {{ order, client_secret, payment_intent_id }}
 */
export async function initiateOrderPayment(domain, payload, token) {
  const res = await fetch(`${API_BASE}/api/v1/orders/initiate-payment/`, {
    method: "POST",
    headers: buildHeaders(domain, token),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/**
 * Confirm payment was successful (called after Stripe.js confirms).
 * Note: In the MVP, the Stripe webhook (Step 3) handles confirmation
 * server-side. This is an optional client-side confirmation.
 */
export async function confirmOrderPayment(domain, orderId, paymentIntentId) {
  const res = await fetch(
    `${API_BASE}/api/v1/orders/confirm-payment/`,
    {
      method: "POST",
      headers: buildHeaders(domain),
      body: JSON.stringify({
        order_id: orderId,
        payment_intent_id: paymentIntentId,
      }),
    }
  );

  return handleResponse(res);
}

// =========================================================================
// MESSAGING
// =========================================================================

/**
 * Send a message in the order conversation.
 * Backend: POST /api/v1/orders/{id}/add-message/
 */
export async function sendOrderMessage(domain, orderId, content, token) {
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/add-message/`, {
    method: "POST",
    headers: buildHeaders(domain, token),
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

// =========================================================================
// FILE UPLOAD
// =========================================================================

/**
 * Add a file to the order.
 * Backend: POST /api/v1/orders/{id}/add-file/
 */
export async function uploadOrderFile(domain, orderId, fileData, token) {
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/add-file/`, {
    method: "POST",
    headers: buildHeaders(domain, token),
    body: JSON.stringify(fileData),
  });
  return handleResponse(res);
}

// =========================================================================
// ORDER ACTIONS
// =========================================================================

/**
 * Accept delivery (customer marks order as completed).
 * Backend: POST /api/v1/orders/{id}/complete/
 */
export async function completeOrder(domain, orderId, token) {
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/complete/`, {
    method: "POST",
    headers: buildHeaders(domain, token),
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

/**
 * Cancel an order.
 * Backend: POST /api/v1/orders/{id}/cancel/
 */
export async function cancelOrder(domain, orderId, reason, token) {
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/cancel/`, {
    method: "POST",
    headers: buildHeaders(domain, token),
    body: JSON.stringify({ reason }),
  });
  return handleResponse(res);
}

/**
 * Submit a review for a completed order.
 * Backend: POST /api/v1/orders/{id}/review/
 */
export async function submitOrderReview(domain, orderId, rating, comment, token) {
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/review/`, {
    method: "POST",
    headers: buildHeaders(domain, token),
    body: JSON.stringify({ rating, comment }),
  });
  return handleResponse(res);
}

/**
 * Update order status (used by providers/admins, not typically customers).
 * Backend: POST /api/v1/orders/{id}/update-status/
 */
export async function updateOrderStatus(domain, orderId, status, note, token) {
  const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/update-status/`, {
    method: "POST",
    headers: buildHeaders(domain, token),
    body: JSON.stringify({ status, note }),
  });
  return handleResponse(res);
}