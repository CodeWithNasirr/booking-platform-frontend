// src/lib/billingApi.js
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

/** Full billing dashboard — single call for My Plan page */
export async function fetchBillingDashboard(tenantId) {
  const res = await fetch(`${API}/api/v1/billing/dashboard/`, {
    headers: headers(tenantId),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load billing dashboard");
  return res.json();
}

/** Paginated invoice list */
export async function fetchInvoices(tenantId, { page = 1, pageSize = 20, status } = {}) {
  const params = new URLSearchParams({ page, page_size: pageSize });
  if (status) params.set("status", status);
  const res = await fetch(`${API}/api/v1/billing/invoices/?${params}`, {
    headers: headers(tenantId),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load invoices");
  return res.json();
}

/** Subscription change history */
export async function fetchSubscriptionHistory(tenantId) {
  const res = await fetch(`${API}/api/v1/billing/subscription-history/`, {
    headers: headers(tenantId),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

/** Public plans */
export async function fetchPlans() {
  const res = await fetch(`${API}/api/v1/billing/plans/`);
  if (!res.ok) throw new Error("Failed to load plans");
  return res.json();
}

/** Create Stripe checkout session */
export async function createCheckout(tenantId, planTier, billingInterval = "month") {
  const res = await fetch(`${API}/api/v1/billing/checkout/`, {
    method: "POST",
    headers: headers(tenantId),
    credentials: "include",
    body: JSON.stringify({ plan_tier: planTier, billing_interval: billingInterval }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Checkout failed");
  return data;
}

/** Enterprise — fetch the tenant's latest Contact-Sales request (or null) */
export async function fetchEnterpriseRequest(tenantId) {
  const res = await fetch(`${API}/api/v1/billing/enterprise/request/`, {
    headers: headers(tenantId),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load enterprise request");
  return res.json();
}

/** Enterprise — submit / re-submit a Contact-Sales request (idempotent on open) */
export async function submitEnterpriseRequest(tenantId, payload) {
  const res = await fetch(`${API}/api/v1/billing/enterprise/request/`, {
    method: "POST",
    headers: headers(tenantId),
    credentials: "include",
    body: JSON.stringify(payload || {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to submit request");
  return data;
}

/** Enterprise — withdraw an open Contact-Sales request */
export async function cancelEnterpriseRequest(tenantId) {
  const res = await fetch(`${API}/api/v1/billing/enterprise/request/cancel/`, {
    method: "POST",
    headers: headers(tenantId),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to cancel request");
  return data;
}

/** Open Stripe billing portal */
export async function openBillingPortal(tenantId) {
  const res = await fetch(`${API}/api/v1/billing/portal/`, {
    method: "POST",
    headers: headers(tenantId),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to open billing portal");
  return res.json();
}

/** Upload business document */
export async function uploadBusinessDocument(tenantId, file) {
  const token = Cookies.get("access_token");
  const formData = new FormData();
  formData.append("document", file);
  const res = await fetch(`${API}/api/v1/tenant/documents/upload/`, {
    method: "POST",
    headers: { Authorization: token ? `Bearer ${token}` : "", "X-Tenant": tenantId },
    credentials: "include",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Upload failed");
  return data;
}

/** Check document verification status */
export async function fetchDocumentStatus(tenantId) {
  const res = await fetch(`${API}/api/v1/tenant/documents/status/`, {
    headers: headers(tenantId),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to check document status");
  return res.json();
}

/** Create HyperPay checkout session */
export async function createHyperPayCheckout(tenantId, { paymentFor, referenceId, amount, currency, cardBrand, planTier, billingInterval }) {
  const res = await fetch(`${API}/api/v1/payments/hyperpay/checkout/`, {
    method: "POST",
    headers: headers(tenantId),
    credentials: "include",
    body: JSON.stringify({
      payment_for: paymentFor,
      reference_id: referenceId,
      amount,
      currency,
      card_brand: cardBrand,
      plan_tier: planTier,
      billing_interval: billingInterval,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "HyperPay checkout failed");
  return data;
}

/** Get HyperPay widget config */
export async function fetchHyperPayConfig(tenantId) {
  const res = await fetch(`${API}/api/v1/payments/hyperpay/config/`, {
    headers: headers(tenantId),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to get HyperPay config");
  return res.json();
}