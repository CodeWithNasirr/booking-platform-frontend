// src/lib/tenantOrderAuth.js
//
// Shared token + fetch helpers for tenant-site order pages. Extracts
// the duplicated resolveToken / buildHeaders / apiFetch trio from
// MyOrderDetailClient + MyOrdersClient + CustomerOrdersDashboard so
// the call sites stay tiny.
//
// Token strategy:
//   1. customer_token (JWT)          → Authorization: Bearer <jwt>
//   2. customer_order_token_*        → X-Order-Token <signed>
//
// Always sends X-Tenant: <domain or tenant uuid> so the tenant
// middleware can resolve.

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function resolveTenantOrderToken() {
  if (typeof window === "undefined") return { token: null, type: null };

  const jwt = localStorage.getItem("customer_token");
  if (jwt) return { token: jwt, type: "jwt" };

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("customer_order_token_")) {
      const t = localStorage.getItem(key);
      if (t) return { token: t, type: "guest" };
    }
  }
  return { token: null, type: null };
}

export function buildTenantOrderHeaders(domain, token, tokenType, extras = {}) {
  const headers = { "Content-Type": "application/json", ...extras };
  if (domain) headers["X-Tenant"] = domain;
  if (token) {
    if (tokenType === "guest") headers["X-Order-Token"] = token;
    else headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function tenantOrderFetch(url, domain, options = {}) {
  const { token, type } = options.auth ?? resolveTenantOrderToken();
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...buildTenantOrderHeaders(domain, token, type, options.contentType === null
        ? {} // multipart: caller handles Content-Type
        : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = new Error(`${res.status}`);
    err.status = res.status;
    try { err.data = await res.json(); } catch {}
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}
