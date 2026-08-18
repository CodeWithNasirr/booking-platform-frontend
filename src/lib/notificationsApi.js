// src/lib/notificationsApi.js
//
// Thin client for the in-app notification feed (Topbar bell + Sidebar
// dots). All calls go through the shared apiFetch, which attaches the JWT
// and the X-Tenant header; the backend scopes every response to
// (recipient=current user, tenant=active tenant), so these never leak
// another user's or tenant's notifications.

import { apiFetch } from "@/lib/apiClient";

const BASE = "/api/v1/notifications/feed";

/** Unread totals for the bell badge + per-category counts for sidebar dots. */
export async function fetchNotificationSummary(tenantId) {
  return apiFetch(`${BASE}/summary/`, tenantId, { method: "GET" });
}

/** Newest notifications for the bell dropdown. */
export async function fetchNotifications(tenantId, { limit = 20, category, unread } = {}) {
  const qs = new URLSearchParams();
  if (limit) qs.set("limit", String(limit));
  if (category) qs.set("category", category);
  if (unread) qs.set("unread", "1");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`${BASE}/${suffix}`, tenantId, { method: "GET" });
}

/** Mark a single notification read. */
export async function markNotificationRead(tenantId, id) {
  return apiFetch(`${BASE}/${id}/read/`, tenantId, { method: "POST" });
}

/**
 * Mark all read — optionally scoped to one category so opening a section
 * clears only that sidebar dot, not the whole bell.
 */
export async function markAllNotificationsRead(tenantId, category) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch(`${BASE}/read-all/${qs}`, tenantId, { method: "POST" });
}
