// src/lib/settingsApi.js
/**
 * Tenant Settings API Client (Production — with DNS Status)
 *
 * Settings:
 *   GET   /api/v1/tenant/settings/
 *   PATCH /api/v1/tenant/settings/update/
 *
 * Domains:
 *   POST    /api/v1/tenant/settings/domain/link/
 *   POST    /api/v1/tenant/settings/domain/{id}/verify/
 *   GET     /api/v1/tenant/settings/domain/{id}/dns-status/
 *   POST    /api/v1/tenant/settings/domain/{id}/set-primary/
 *   DELETE  /api/v1/tenant/settings/domain/{id}/
 *   PATCH   /api/v1/tenant/settings/website-slug/
 */

import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "";

function headers(tenantId) {
  const token = Cookies.get("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Tenant": tenantId,

  };
}

// ── Helper ──────────────────────────────────────────────────────

async function apiCall(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: "include", // ✅ here
  });

  let data = null;
  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    data = await res.json();
  } else {
    const text = await res.text();
    console.error("❌ Non-JSON response:", text);
  }
  // console.log("API Response:", { url, options, status: res.status, data });

  if (!res.ok) {
    const error = new Error(
      data?.detail || data?.message || "Request failed"
    );
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ── Settings CRUD ───────────────────────────────────────────────

export async function fetchTenantSettings(tenantId) {
  return apiCall(`${API}/api/v1/tenant/settings/`, {
    headers: headers(tenantId),
    
  });
}

export async function updateTenantSettings(tenantId, data) {
  return apiCall(`${API}/api/v1/tenant/settings/update/`, {
    method: "PATCH",
    headers: headers(tenantId),
    body: JSON.stringify(data),
  });
}


export async function fetchLocaleSettings(tenantId) {
    return apiCall(`${API}/api/v1/tenant/settings/locale/`, {
    headers: headers(tenantId),
    
  });
}

export async function fetchLocaleOptions(tenantId) {
  return apiCall(`${API}/api/v1/tenant/settings/locale/options/`, {
    headers: headers(tenantId),
  });
  
}

export async function updateLocaleSettings(tenantId, payload) {
  return apiCall(`${API}/api/v1/tenant/settings/locale/update/`, {
    method: "PATCH",
    headers: headers(tenantId),
    body: JSON.stringify(payload),
  });
}


// ── Domain Management ───────────────────────────────────────────

export async function linkCustomDomain(tenantId, domainName) {
  return apiCall(`${API}/api/v1/tenant/settings/domain/link/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify({ domain: domainName }),
  });
}

export async function verifyDomain(tenantId, domainId) {
  return apiCall(`${API}/api/v1/tenant/settings/domain/${domainId}/verify/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

export async function checkDnsStatus(tenantId, domainId) {
  return apiCall(`${API}/api/v1/tenant/settings/domain/${domainId}/dns-status/`, {
    headers: headers(tenantId),
  });
}

export async function setPrimaryDomain(tenantId, domainId) {
  return apiCall(`${API}/api/v1/tenant/settings/domain/${domainId}/set-primary/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

export async function removeDomain(tenantId, domainId) {
  return apiCall(`${API}/api/v1/tenant/settings/domain/${domainId}/`, {
    method: "DELETE",
    headers: headers(tenantId),
  });
}

export async function updateWebsiteSlug(tenantId, slug) {
  return apiCall(`${API}/api/v1/tenant/settings/website-slug/`, {
    method: "PATCH",
    headers: headers(tenantId),
    body: JSON.stringify({ slug }),
  });
}

export async function checkSSLStatus(tenantId, domainId) {
  return apiCall(`${API}/api/v1/tenant/settings/domain/${domainId}/ssl-status/`, {
    headers: headers(tenantId),

  });
}
// ── Template Rendering ──────────────────────────────────────────

export function renderTemplate(template, data = {}) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => data[key.trim()] || `{{${key.trim()}}}`);
}

export const PREVIEW_DATA = {
  customer_name: "Ahmed Al-Rashid",
  booking_number: "BKG-240415-A7X3",
  service_name: "Logo Design Package",
  date: "April 20, 2026",
  time: "2:00 PM",
  provider_name: "Sara Design Studio",
  tenant_name: "Creative Hub",
  order_number: "ORD-240415-B2K9",
  amount: "$299.00",
};