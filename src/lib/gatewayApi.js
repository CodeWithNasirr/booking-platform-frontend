// src/lib/gatewayApi.js
/**
 * Payment Gateway API Client
 *
 * Functions for managing Stripe Connect and HyperPay gateways.
 * Used by the integrations page and the gateway gate modal.
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

// ── HyperPay ─────────────────────────────────────────────────
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