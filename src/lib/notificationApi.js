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

/**
 * Tenant-owned templates (Phase 5 ownership split).
 * GET returns { event, channel, languages: {en|ar|ur: {subject,
 * body_html, source, ...}}, variables } — source tells whether the
 * value is the tenant's own row or the platform/registry fallback
 * shown as prefill.
 */
export async function fetchMyTemplate(tenantId, event, channel = "email") {
  const qs = `?event=${encodeURIComponent(event)}&channel=${encodeURIComponent(channel)}`;
  return apiCall(`${API}/api/v1/notifications/my-templates/${qs}`, {
    headers: headers(tenantId),
  });
}

export async function saveMyTemplate(tenantId, payload) {
  // payload: { event, channel, language, subject, body_html, body_text? }
  return apiCall(`${API}/api/v1/notifications/my-templates/`, {
    method: "PUT",
    headers: headers(tenantId),
    body: JSON.stringify(payload),
  });
}

export async function deleteMyTemplate(tenantId, event, channel, language) {
  const qs =
    `?event=${encodeURIComponent(event)}` +
    `&channel=${encodeURIComponent(channel)}` +
    `&language=${encodeURIComponent(language)}`;
  return apiCall(`${API}/api/v1/notifications/my-templates/${qs}`, {
    method: "DELETE",
    headers: headers(tenantId),
  });
}