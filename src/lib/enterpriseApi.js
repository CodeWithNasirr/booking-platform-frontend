// src/lib/enterpriseApi.js
// Super-admin Enterprise billing API client (Phase B6).
// Consumes the B3 (requests), B4 (contract) and B5 (features +
// overrides) endpoints via the shared platformFetch wrapper.

import { platformFetch } from "@/lib/platformApi";

const BASE = "/api/v1/platform/billing";

// ── Enterprise requests (B3) ─────────────────────────────────────

export function fetchEnterpriseRequests(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return platformFetch(`${BASE}/enterprise-requests/${qs}`);
}

export function fetchEnterpriseRequest(id) {
  return platformFetch(`${BASE}/enterprise-requests/${id}/`);
}

export function reviewEnterpriseRequest(id) {
  return platformFetch(`${BASE}/enterprise-requests/${id}/review/`, {
    method: "POST",
  });
}

export function approveEnterpriseRequest(id, payload) {
  return platformFetch(`${BASE}/enterprise-requests/${id}/approve/`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  });
}

export function rejectEnterpriseRequest(id, notes) {
  return platformFetch(`${BASE}/enterprise-requests/${id}/reject/`, {
    method: "POST",
    body: JSON.stringify({ notes: notes || "" }),
  });
}

// ── Contract (B4) ────────────────────────────────────────────────

export function fetchEnterpriseContract(tenantId) {
  return platformFetch(`${BASE}/tenants/${tenantId}/enterprise-contract/`);
}

export function saveEnterpriseContract(tenantId, payload) {
  return platformFetch(`${BASE}/tenants/${tenantId}/enterprise-contract/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── Sales inquiries (lead pipeline) ──────────────────────────────

export function fetchSalesInquiries(status) {
  const qs = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return platformFetch(`${BASE}/sales-inquiries/${qs}`);
}

export function fetchSalesInquiry(id) {
  return platformFetch(`${BASE}/sales-inquiries/${id}/`);
}

export function updateSalesInquiry(id, payload) {
  return platformFetch(`${BASE}/sales-inquiries/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload || {}),
  });
}

// ── Feature manager (B5) ─────────────────────────────────────────

export function fetchFeatures({ category, includeArchived } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (includeArchived) params.set("include_archived", "1");
  const qs = params.toString() ? `?${params.toString()}` : "";
  return platformFetch(`${BASE}/features/${qs}`);
}

export function createFeature(payload) {
  return platformFetch(`${BASE}/features/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateFeature(id, payload) {
  return platformFetch(`${BASE}/features/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function archiveFeature(id) {
  return platformFetch(`${BASE}/features/${id}/`, { method: "DELETE" });
}

// ── Per-tenant overrides + effective preview (B5) ────────────────

export function fetchTenantOverrides(tenantId) {
  return platformFetch(`${BASE}/tenants/${tenantId}/feature-overrides/`);
}

export function saveTenantOverride(tenantId, payload) {
  return platformFetch(`${BASE}/tenants/${tenantId}/feature-overrides/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTenantOverride(tenantId, featureId) {
  return platformFetch(
    `${BASE}/tenants/${tenantId}/feature-overrides/${featureId}/`,
    { method: "DELETE" }
  );
}

export function fetchEffectiveFeatures(tenantId) {
  return platformFetch(`${BASE}/tenants/${tenantId}/effective-features/`);
}
