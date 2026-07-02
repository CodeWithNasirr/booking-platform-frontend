// src/lib/notificationApi.js
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

async function apiCall(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.detail || "Request failed");
    error.status = res.status;
    throw error;
  }
  return data;
}

/**
 * Get default notification rules (for new tenants with no rules yet).
 */
export async function fetchNotificationDefaults(tenantId) {
  return apiCall(`${API}/api/v1/notifications/defaults/`, {
    headers: headers(tenantId),
  });
}

/**
 * Get all available notification events.
 */
export async function fetchNotificationEvents(tenantId) {
  return apiCall(`${API}/api/v1/notifications/events/`, {
    headers: headers(tenantId),
  });
}

/**
 * Get the notification event catalog (single registry).
 * Returns { events, categories, variable_categories }.
 * scope: "tenant" for the settings screen, "platform" for superadmin.
 */
export async function fetchNotificationRegistry(tenantId, scope = "tenant") {
  const qs = scope ? `?scope=${encodeURIComponent(scope)}` : "";
  return apiCall(`${API}/api/v1/notifications/registry/${qs}`, {
    headers: headers(tenantId),
  });
}

/**
 * Send a test notification to a phone number.
 */
export async function sendTestNotification(tenantId, event, phone) {
  return apiCall(`${API}/api/v1/notifications/test/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify({ event, phone }),
  });
}