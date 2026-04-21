// src/lib/integrationStatusApi.js
/**
 * Integration Status API Client
 *
 * Calls the backend integration dependency endpoints.
 * Separated from the existing integrationsApi.js (which handles
 * connect/disconnect CRUD) because these serve a different purpose:
 * checking whether features can be used.
 *
 * All functions follow the same auth pattern as integrationsApi.js.
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

async function apiCall(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.detail || data.message || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

// ── GET /api/v1/tenant/integrations/status/ ─────────────────────
/**
 * Fetch connection status of all integrations.
 *
 * Returns:
 *   {
 *     statuses: { google_calendar: { connected, scope, resolution, ... }, ... },
 *     has_provider_profile: boolean
 *   }
 */
export async function fetchIntegrationStatuses(tenantId) {
  return apiCall(`${API}/api/v1/tenant/integrations/status/`, {
    headers: headers(tenantId),
  });
}

// ── GET /api/v1/tenant/integrations/warnings/ ───────────────────
/**
 * Fetch features with missing integrations, sorted by severity.
 *
 * Returns:
 *   {
 *     warnings: [{ feature, label, severity, blocking, cta, missing }],
 *     counts: { critical, warning, info },
 *     has_blocking: boolean
 *   }
 */
export async function fetchIntegrationWarnings(tenantId) {
  return apiCall(`${API}/api/v1/tenant/integrations/warnings/`, {
    headers: headers(tenantId),
  });
}

// ── GET /api/v1/tenant/integrations/check/<feature>/ ────────────
/**
 * Check a single feature's integration requirements.
 *
 * @param {string} tenantId
 * @param {string} featureKey  - e.g. "online_booking", "google_meet_links"
 * @param {string} [providerId] - optional, for provider-scoped checks
 *
 * Returns:
 *   {
 *     feature, label, satisfied, mode, blocking, severity,
 *     cta: { text, description },
 *     missing: [{ integration, label, resolution: { action, target, ... } }],
 *     connected: [string]
 *   }
 */
export async function checkFeature(tenantId, featureKey, providerId = null) {
  const qs = providerId ? `?provider_id=${providerId}` : "";
  return apiCall(
    `${API}/api/v1/tenant/integrations/check/${featureKey}/${qs}`,
    { headers: headers(tenantId) }
  );
}

// ── POST /api/v1/tenant/integrations/check-service/ ─────────────
/**
 * Pre-creation check: will this service config have integration issues?
 *
 * @param {string} tenantId
 * @param {object} params
 * @param {string} params.service_type - "online" | "digital"
 * @param {string} params.order_type   - "booking" | "order"
 * @param {string} [params.provider_id]
 *
 * Returns:
 *   {
 *     features_required: [string],
 *     checks: [{ feature, satisfied, blocking, severity, cta, missing }],
 *     can_proceed: boolean,
 *     has_warnings: boolean
 *   }
 */
export async function checkServiceIntegrations(tenantId, params) {
  return apiCall(`${API}/api/v1/tenant/integrations/check-service/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify(params),
  });
}

// ── ERROR PARSING ───────────────────────────────────────────────
/**
 * Parse an API error to check if it's an integration_required error.
 *
 * Usage:
 *   try {
 *     await confirmPayment(...)
 *   } catch (err) {
 *     const integrationError = parseIntegrationError(err);
 *     if (integrationError) {
 *       // Show integration modal using integrationError.missing_integrations
 *     }
 *   }
 *
 * @param {Error} error - Error thrown by apiCall or fetch
 * @returns {object|null} - Structured integration error or null
 */
export function parseIntegrationError(error) {
  const data = error?.data || error?.response?.data;
  if (!data) return null;

  // Direct match: backend ValidationError payload
  if (data.code === "integration_required") {
    return data;
  }

  // Nested in DRF array format: [{ code: "integration_required", ... }]
  if (Array.isArray(data) && data[0]?.code === "integration_required") {
    return data[0];
  }

  // Nested under a field key (DRF field-level errors)
  for (const val of Object.values(data)) {
    if (Array.isArray(val)) {
      const match = val.find(
        (v) => typeof v === "object" && v.code === "integration_required"
      );
      if (match) return match;
    }
    if (typeof val === "object" && val.code === "integration_required") {
      return val;
    }
  }

  return null;
}