// src/lib/gatewayApi.js
/**
 * Payment Gateway API Client
 *
 * Functions for managing Stripe Connect and HyperPay gateways.
 * Used by the integrations page and the gateway gate modal.
 *
 * ════════════════════════════════════════════════════════════════
 * UPDATED: Added fetchActiveGateway() and HyperPay checkout helpers
 * for the dual-gateway booking/order flows.
 * ════════════════════════════════════════════════════════════════
 */

import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const headers = (tenantId) => {
  const token = Cookies.get("access_token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "X-Tenant": tenantId,
    "Content-Type": "application/json",
  };
};

// Lightweight headers for public-facing pages (no auth token needed)
const publicHeaders = (domain) => ({
  "X-Tenant": domain,
  "Content-Type": "application/json",
});

async function apiCall(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ── Gateway status (both Stripe + HyperPay) ──────────────────
export async function fetchGatewayStatus(tenantId) {
  return apiCall(`${API}/api/v1/payments/gateway/status/`, {
    headers: headers(tenantId),
  });
}

// ══════════════════════════════════════════════════════════════
// NEW: Active gateway detection for booking/order flows
// ══════════════════════════════════════════════════════════════

/**
 * Fetch which gateway is active for the given tenant.
 * Used by booking/order checkout pages BEFORE showing payment UI.
 *
 * Returns: { connected: bool, active_gateway: "stripe"|"hyperpay"|null, ... }
 */
export async function fetchActiveGateway(domain) {
  return apiCall(`${API}/api/v1/payments/gateway/status/`, {
    headers: publicHeaders(domain),
  });
}

// ══════════════════════════════════════════════════════════════
// NEW: HyperPay checkout for booking/order flows
// ══════════════════════════════════════════════════════════════

/**
 * Create a HyperPay checkout session.
 * Called when initiate_payment returns gateway="hyperpay".
 *
 * @param {string} domain — tenant domain
 * @param {Object} payload — { payment_for, reference_id, amount?, currency?, card_brand? }
 * @returns {{ checkout_id, widget_url, brands, callback_url, amount, currency }}
 */
export async function createHyperPayCheckout(domain, payload) {
  return apiCall(`${API}/api/v1/payments/hyperpay/checkout/`, {
    method: "POST",
    headers: headers(domain),
    body: JSON.stringify(payload),
  });
}

/**
 * Poll HyperPay payment status (for non-redirect verification).
 *
 * @param {string} domain
 * @param {string} checkoutId
 * @returns {{ success, pending, result_code, result_description, payment_brand, card_last4 }}
 */
export async function checkHyperPayStatus(domain, checkoutId) {
  return apiCall(`${API}/api/v1/payments/hyperpay/status/${checkoutId}/`, {
    headers: headers(domain),
  });
}

/**
 * Get HyperPay widget configuration.
 * @param {string} domain
 * @returns {{ widget_url, brands, is_sandbox, supported_currencies }}
 */
export async function fetchHyperPayConfig(domain) {
  return apiCall(`${API}/api/v1/payments/hyperpay/config/`, {
    headers: headers(domain),
  });
}

// ── Stripe Connect ───────────────────────────────────────────
export async function startStripeConnect(tenantId) {
  return apiCall(`${API}/api/v1/payments/gateway/stripe/connect/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

export async function syncStripeConnect(tenantId) {
  return apiCall(`${API}/api/v1/payments/gateway/stripe/sync/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

export async function disconnectStripeConnect(tenantId) {
  return apiCall(`${API}/api/v1/payments/gateway/stripe/disconnect/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

// ── HyperPay Config ──────────────────────────────────────────
export async function configureHyperPay(tenantId, config) {
  return apiCall(`${API}/api/v1/payments/gateway/hyperpay/configure/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(config),
  });
}

export async function disconnectHyperPay(tenantId) {
  return apiCall(`${API}/api/v1/payments/gateway/hyperpay/disconnect/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

// ── Moyasar Config ───────────────────────────────────────────
export async function configureMoyasar(tenantId, config) {
  // config = { secret_key, publishable_key?, webhook_secret? }
  return apiCall(`${API}/api/v1/payments/gateway/moyasar/configure/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(config),
  });
}

export async function testMoyasar(tenantId, config = {}) {
  return apiCall(`${API}/api/v1/payments/gateway/moyasar/test/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(config),
  });
}

export async function disconnectMoyasar(tenantId) {
  return apiCall(`${API}/api/v1/payments/gateway/moyasar/disconnect/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

// Regenerate the tenant's Moyasar webhook secret (returns it once).
export async function rotateMoyasarWebhook(tenantId) {
  return apiCall(`${API}/api/v1/payments/gateway/moyasar/webhook/rotate/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

// ── Preferred gateway (provider-agnostic) ────────────────────
export async function setPreferredGateway(tenantId, provider) {
  // provider = "moyasar" | "stripe" | "hyperpay"
  return apiCall(`${API}/api/v1/payments/gateway/preferred/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify({ provider }),
  });
}

// ══════════════════════════════════════════════════════════════
// Moyasar hosted-invoice checkout (booking / order / subscription)
// ══════════════════════════════════════════════════════════════

/**
 * Create a Moyasar hosted-invoice checkout. Returns { url } — the caller
 * redirects the browser to that hosted payment page. Raw card data never
 * touches our frontend or backend.
 *
 * @param {string} domain
 * @param {Object} payload — { payment_for, reference_id, success_url?, cancel_url? }
 * @returns {{ provider, invoice_id, url, amount, currency, callback_url }}
 */
export async function createMoyasarCheckout(domain, payload) {
  return apiCall(`${API}/api/v1/payments/moyasar/checkout/`, {
    method: "POST",
    headers: headers(domain),
    body: JSON.stringify(payload),
  });
}

export async function checkMoyasarStatus(domain, paymentId) {
  return apiCall(`${API}/api/v1/payments/moyasar/status/${paymentId}/`, {
    headers: headers(domain),
  });
}

export async function fetchMoyasarConfig(domain) {
  return apiCall(`${API}/api/v1/payments/moyasar/config/`, {
    headers: headers(domain),
  });
}