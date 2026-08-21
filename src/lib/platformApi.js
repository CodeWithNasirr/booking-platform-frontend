/**
 * SuperAdmin API Client
 *
 * All fetch calls to /api/v1/platform/* endpoints.
 * Handles JWT auth, token refresh, and error normalisation.
 */

import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Token helpers ──────────────────────────────────────────────

function authHeaders() {
  const token = Cookies.get(
    "platform_access_token"
  );

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

  async function refreshAccessToken() {
    const refresh = Cookies.get(
      "platform_refresh_token"
    );

    if (!refresh) return null;

    const res = await fetch(
      `${API}/api/v1/auth/token/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refresh }),
      }
    );

    if (!res.ok) {
      Cookies.remove("platform_access_token");
      Cookies.remove("platform_refresh_token");

      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }

      return null;
    }

    const data = await res.json();

    Cookies.set(
      "platform_access_token",
      data.access
    );

    return data.access;
  }



// ─── Core fetch wrapper ─────────────────────────────────────────

export async function platformFetch(endpoint, options = {}) {
  const url = `${API}${endpoint}`;

  const makeReq = (token) =>
    fetch(url, {
      ...options,
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

  // let token = Cookies.get("access_token");
  const token = Cookies.get(
    "platform_access_token"
  );
  let res = await makeReq(token);

  // Auto-refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await makeReq(newToken);
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const err = new Error(data?.detail || data?.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}



// ═══════════════════════════════════════════════════════════════
// WEBSITE BUILDER TEMPLATES
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all website templates
 */
export async function fetchWebsiteTemplates(params = "") {
  return platformFetch(
    `/api/v1/platform/templates/${params ? `?${params}` : ""}`
  );
}

/**
 * Delete template
 */
export async function deleteWebsiteTemplate(id) {
  return platformFetch(
    `/api/v1/platform/templates/${id}/`,
    {
      method: "DELETE",
    }
  );
}


// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

export async function fetchEmailTemplates() {
  return platformFetch("/api/v1/platform/notifications/templates/");
}

export async function fetchEmailTemplate(code) {
  return platformFetch(
    `/api/v1/platform/notifications/templates/${code}/`
  );
}

export async function updateEmailTemplate(code, data) {
  return platformFetch(
    `/api/v1/platform/notifications/templates/${code}/`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export async function previewEmailTemplate(code) {
  return platformFetch(
    "/api/v1/platform/notifications/templates/preview/",
    {
      method: "POST",
      body: JSON.stringify({
        event_code: code,
      }),
    }
  );
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION LOGS
// ═══════════════════════════════════════════════════════════════

export async function fetchNotificationLogs(params = {}) {
  const query = new URLSearchParams(params).toString();

  return platformFetch(
    `/api/v1/platform/notifications/logs/${query ? `?${query}` : ""}`
  );
}



// ═══════════════════════════════════════════════════════════════
// PLATFORM SETTINGS
// ═══════════════════════════════════════════════════════════════

export async function fetchPlatformSettings() {
  return platformFetch("/api/v1/platform/settings/");
}

export async function updatePlatformSettings(data) {
  return platformFetch("/api/v1/platform/settings/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function updatePlatformSettingsSection(section, data) {
  return platformFetch(`/api/v1/platform/settings/${section}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT INTEGRATIONS (real, API-driven — Moyasar/Stripe/HyperPay)
// ═══════════════════════════════════════════════════════════════

/** Real state of all platform gateways (enabled, configured, masked creds…). */
export async function fetchPaymentIntegrations() {
  return platformFetch("/api/v1/platform/payment-integrations/");
}

/**
 * Save one gateway's credentials/config/enabled.
 * payload = { provider, credentials?:{secret_key,publishable_key,webhook_secret},
 *             base_url?, enabled?, set_default? }
 */
export async function savePaymentIntegration(payload) {
  return platformFetch("/api/v1/platform/payment-integrations/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** Live credential test. Pass credentials to validate BEFORE saving, or omit to test stored. */
export async function testPaymentIntegration(provider, credentials = null) {
  return platformFetch("/api/v1/platform/payment-integrations/test/", {
    method: "POST",
    body: JSON.stringify(credentials ? { provider, credentials } : { provider }),
  });
}

/** Live health of all gateways. */
export async function checkPaymentIntegrationsHealth() {
  return platformFetch("/api/v1/platform/payment-integrations/health/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

/** Webhook configuration status + URL to paste into the provider dashboard. */
export async function testPaymentWebhook(provider) {
  return platformFetch("/api/v1/platform/payment-integrations/webhook/test/", {
    method: "POST",
    body: JSON.stringify({ provider }),
  });
}



// ═══════════════════════════════════════════════════════════════
// SUPPORT TICKETS (Platform Admin — all tenants)
// ═══════════════════════════════════════════════════════════════
 
export async function fetchAllTickets(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformFetch(`/api/v1/platform/support/tickets/${qs ? `?${qs}` : ""}`);
}
 
export async function fetchTicketStats() {
  return platformFetch("/api/v1/platform/support/tickets/stats/");
}
 
export async function fetchTicketById(ticketId) {
  return platformFetch(`/api/v1/platform/support/tickets/${ticketId}/`);
}
 
export async function fetchTicketThread(ticketId, includeInternal = true) {
  return platformFetch(
    `/api/v1/platform/support/tickets/${ticketId}/messages/?include_internal=${includeInternal}`
  );
}
 
export async function adminReplyToTicket(ticketId, content, isInternal = false) {
  return platformFetch(`/api/v1/platform/support/tickets/${ticketId}/reply/`, {
    method: "POST",
    body: JSON.stringify({ content, is_internal: isInternal }),
  });
}
 
export async function changeTicketStatus(ticketId, status, resolutionNote = "") {
  return platformFetch(`/api/v1/platform/support/tickets/${ticketId}/status/`, {
    method: "POST",
    body: JSON.stringify({ status, resolution_note: resolutionNote }),
  });
}
 
export async function assignTicketTo(ticketId, agentId) {
  return platformFetch(`/api/v1/platform/support/tickets/${ticketId}/assign/`, {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId }),
  });
}
 
export async function changeTicketPriority(ticketId, priority) {
  return platformFetch(`/api/v1/platform/support/tickets/${ticketId}/priority/`, {
    method: "POST",
    body: JSON.stringify({ priority }),
  });
}
 
export async function escalateTicketById(ticketId, reason = "") {
  return platformFetch(`/api/v1/platform/support/tickets/${ticketId}/escalate/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}




// ═══════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════

export async function fetchAnnouncements() {
  return platformFetch("/api/v1/platform/announcements/");
}

export async function createAnnouncement(data) {
  return platformFetch("/api/v1/platform/announcements/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAnnouncement(id, data) {
  return platformFetch(`/api/v1/platform/announcements/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAnnouncement(id) {
  return platformFetch(`/api/v1/platform/announcements/${id}/`, {
    method: "DELETE",
  });
}

// ═══════════════════════════════════════════════════════════════
// REFUNDS
// ═══════════════════════════════════════════════════════════════

export async function fetchRefunds(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformFetch(`/api/v1/platform/refunds/${qs ? `?${qs}` : ""}`);
}

export async function processRefund(transactionId, amount, reason) {
  return platformFetch("/api/v1/platform/refunds/create/", {
    method: "POST",
    body: JSON.stringify({
      transaction_id: transactionId,
      amount: amount || null,
      reason,
    }),
  });
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM HEALTH
// ═══════════════════════════════════════════════════════════════

export async function fetchSystemHealth() {
  return platformFetch("/api/v1/platform/health/");
}

export async function fetchHealthSection(section) {
  return platformFetch(`/api/v1/platform/health/${section}/`);
}

// ═══════════════════════════════════════════════════════════════
// DUNNING / FAILED PAYMENT RECOVERY
// ═══════════════════════════════════════════════════════════════

export async function fetchDunningStatus() {
  return platformFetch("/api/v1/platform/dunning/");
}

export async function retryDunning(subscriptionId) {
  return platformFetch(`/api/v1/platform/dunning/${subscriptionId}/retry/`, {
    method: "POST",
  });
}

export async function runDunningBatch() {
  return platformFetch("/api/v1/platform/dunning/run/", {
    method: "POST",
  });
}

// ═══════════════════════════════════════════════════════════════
// IMPERSONATION
// ═══════════════════════════════════════════════════════════════

export async function startImpersonation(tenantId) {
  // Route must match the DRF ViewSet registered as `impersonation` with a
  // detail `start` action: POST /platform/impersonation/<tenant_id>/start/.
  return platformFetch(`/api/v1/platform/impersonation/${tenantId}/start/`, {
    method: "POST",
  });
}

export async function stopImpersonation(token) {
  return platformFetch("/api/v1/platform/impersonation/stop/", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

// ═══════════════════════════════════════════════════════════════
// VERIFICATION
// ═══════════════════════════════════════════════════════════════

export async function fetchVerificationPending() {
  return platformFetch("/api/v1/platform/verification/pending/");
}

export async function fetchVerificationStatus(tenantId) {
  return platformFetch(`/api/v1/platform/verification/${tenantId}/`);
}

export async function approveVerification(tenantId, notes = "") {
  return platformFetch(`/api/v1/platform/verification/${tenantId}/approve/`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function rejectVerification(tenantId, reason) {
  return platformFetch(`/api/v1/platform/verification/${tenantId}/reject/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// ═══════════════════════════════════════════════════════════════
// TIER SYNC
// ═══════════════════════════════════════════════════════════════

export async function runTierSync() {
  return platformFetch("/api/v1/platform/tier-sync/", {
    method: "POST",
  });
}


// ───────────────────────────────────────────────────────────────────
// DOCUMENT VERIFICATION
// ───────────────────────────────────────────────────────────────────
 
export async function fetchDocuments(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  const qsStr = qs.toString();
  return platformFetch(`/api/v1/platform/documents/${qsStr ? '?' + qsStr : ''}`, {
    headers: authHeaders(),
  });
}
 
export async function fetchDocumentDetail(docId) {
  return platformFetch(`/api/v1/platform/documents/${docId}/`, {
    headers: authHeaders(),
  });
}
 
export async function fetchDocumentStats() {
  return platformFetch(`/api/v1/platform/documents/stats/`, {
    headers: authHeaders(),
  });
}
 
export async function approveDocument(docId, notes = '') {
  return platformFetch(`/api/v1/platform/documents/${docId}/approve/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ notes }),
  });
}
 
export async function rejectDocument(docId, reason, notes = '') {
  return platformFetch(`/api/v1/platform/documents/${docId}/reject/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason, notes }),
  });
}
 
export async function resetDocument(docId, reason = '') {
  return platformFetch(`/api/v1/platform/documents/${docId}/reset/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
}
 
export async function fetchTenantVerification(tenantId) {
  return platformFetch(`/api/v1/platform/tenants/${tenantId}/verification/`, {
    headers: authHeaders(),
  });
}
 
export async function overrideTenantVerification(tenantId, action, reason, days = 7) {
  return platformFetch(`/api/v1/platform/tenants/${tenantId}/verification/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action, reason, days }),
  });
}

// ─── Auth ───────────────────────────────────────────────────────

export async function platformLogin(email, password) {
  const res = await fetch(`${API}/api/v1/platform/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",

    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.detail || "Login failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function platformMe() {
  return platformFetch("/api/v1/platform/auth/me/");
}

export async function platformLogout() {
  const refresh = Cookies.get("refresh_token");
  try {
    await platformFetch("/api/v1/platform/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    });
  } catch {
    /* best-effort */
  }
  Cookies.remove("platform_access_token");
  Cookies.remove("platform_refresh_token");
}

// ─── Dashboard ──────────────────────────────────────────────────

export async function fetchPlatformDashboard() {
  return platformFetch("/api/v1/platform/dashboard/");
}

// ─── Employees (Sub-admins) ─────────────────────────────────────

export async function fetchEmployees(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformFetch(`/api/v1/platform/employees/${qs ? `?${qs}` : ""}`);
}

export async function fetchEmployee(id) {
  return platformFetch(`/api/v1/platform/employees/${id}/`);
}

export async function createEmployee(payload) {
  return platformFetch("/api/v1/platform/employees/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEmployee(id, payload) {
  return platformFetch(`/api/v1/platform/employees/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateEmployee(id) {
  return platformFetch(`/api/v1/platform/employees/${id}/`, {
    method: "DELETE",
  });
}

export async function activateEmployee(id) {
  return platformFetch(`/api/v1/platform/employees/${id}/activate/`, {
    method: "POST",
  });
}

export async function changeEmployeeRole(id, roleId) {
  return platformFetch(`/api/v1/platform/employees/${id}/change-role/`, {
    method: "POST",
    body: JSON.stringify({ role_id: roleId }),
  });
}

export async function addEmployeePermission(id, permission) {
  return platformFetch(`/api/v1/platform/employees/${id}/add-permission/`, {
    method: "POST",
    body: JSON.stringify({ permission }),
  });
}

export async function removeEmployeePermission(id, permission) {
  return platformFetch(`/api/v1/platform/employees/${id}/remove-permission/`, {
    method: "POST",
    body: JSON.stringify({ permission }),
  });
}

export async function resetEmployeePermissions(id) {
  return platformFetch(`/api/v1/platform/employees/${id}/reset-permissions/`, {
    method: "POST",
  });
}

// ─── Roles ──────────────────────────────────────────────────────

export async function fetchRoles() {
  const data = await platformFetch("/api/v1/platform/roles/");
  return data.results || [];
}


export async function fetchRole(id) {
  return platformFetch(`/api/v1/platform/roles/${id}/`);
}

// ─── Permissions ────────────────────────────────────────────────

export async function fetchPermissions(grouped = true, category = "") {
  const qs = new URLSearchParams();
  if (grouped) qs.set("grouped", "true");
  if (category) qs.set("category", category);
  return platformFetch(`/api/v1/platform/permissions/?${qs}`);
}

export async function fetchPermissionCategories() {
  return platformFetch("/api/v1/platform/permissions/categories/");
}

export async function fetchMyPermissions() {
  return platformFetch("/api/v1/platform/my-permissions/");
}

// ─── Audit Logs ─────────────────────────────────────────────────

export async function fetchAuditLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformFetch(`/api/v1/platform/audit-logs/${qs ? `?${qs}` : ""}`);
}

// ═══════════════════════════════════════════════════════════════
// TENANTS (NEW)
// ═══════════════════════════════════════════════════════════════

// ─── Tenant CRUD ────────────────────────────────────────
export async function fetchTenants(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformFetch(`/api/v1/platform/tenants/${qs ? `?${qs}` : ""}`);
}

export async function fetchTenant(id) {
  return platformFetch(`/api/v1/platform/tenants/${id}/`);
}

export async function updateTenant(id, payload) {
  return platformFetch(`/api/v1/platform/tenants/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}


export async function fetchTenantMembers(id, params = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformFetch(`/api/v1/platform/tenants/${id}/members/${qs ? `?${qs}` : ""}`);
}


// ─── Tenant Actions ─────────────────────────────────────

export async function suspendTenant(id, reason = "") {
  return platformFetch(`/api/v1/platform/tenants/${id}/suspend/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function activateTenant(id) {
  return platformFetch(`/api/v1/platform/tenants/${id}/activate/`, {
    method: "POST",
  });
}



export async function verifyTenantDocument(id, action, reason = "") {
  return platformFetch(`/api/v1/platform/tenants/${id}/verify-document/`, {
    method: "POST",
    body: JSON.stringify({ action, reason }),
  });
}

// ─── Billing Actions ────────────────────────────────────

export function changeTenantPlan(id, planTier, billingInterval = "month") {
  return platformFetch(`/api/v1/platform/tenants/${id}/change-plan/`, {
    method: "POST",
    body: JSON.stringify({
      plan_tier: planTier,
      billing_interval: billingInterval,
    }),
  });
}

export function cancelTenantSubscription(id, { immediately = false } = {}) {
  return platformFetch(`/api/v1/platform/tenants/${id}/cancel-subscription/`, {
    method: "POST",
    body: JSON.stringify({ immediately }),
  });
}

export function resumeTenantSubscription(id) {
  return platformFetch(`/api/v1/platform/tenants/${id}/resume-subscription/`, {
    method: "POST",
  });
}


// ─── Stats ──────────────────────────────────────────────
export async function fetchTenantStats() {
  return platformFetch("/api/v1/platform/tenants/stats/");
}


// ═══════════════════════════════════════════════════════════════
// BILLING & PLANS (NEW)
// ═══════════════════════════════════════════════════════════════


export async function fetchBillingStats() {
  return platformFetch("/api/v1/platform/billing/stats/");
}

export async function fetchPlans(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformFetch(`/api/v1/platform/billing/plans/${qs ? `?${qs}` : ""}`);
}

export async function fetchPlan(id) {
  return platformFetch(`/api/v1/platform/billing/plans/${id}/`);
}

export async function createPlan(payload) {
  return platformFetch("/api/v1/platform/billing/plans/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePlan(id, payload) {
  return platformFetch(`/api/v1/platform/billing/plans/${id}/`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePlan(id) {
  return platformFetch(`/api/v1/platform/billing/plans/${id}/`, {
    method: "DELETE",
  });
}

export async function togglePlanStatus(id) {
  return platformFetch(`/api/v1/platform/billing/plans/${id}/toggle-status/`, {
    method: "POST",
  });
}

export async function fetchPlanSubscribers(id) {
  return platformFetch(`/api/v1/platform/billing/plans/${id}/subscribers/`);
}

export async function fetchPlanFeatures(planId) {
  return platformFetch(`/api/v1/platform/billing/plans/${planId}/features/`);
}

export async function addPlanFeature(planId, payload) {
  return platformFetch(`/api/v1/platform/billing/plans/${planId}/features/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deletePlanFeature(planId, featureId) {
  return platformFetch(`/api/v1/platform/billing/plans/${planId}/features/${featureId}/`, {
    method: "DELETE",
  });
}

export async function fetchPlanChanges(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return platformFetch(`/api/v1/platform/billing/plan-changes/${qs ? `?${qs}` : ""}`);
}

export async function reviewPlanChange(id, action, notes = "") {
  return platformFetch(`/api/v1/platform/billing/plan-changes/${id}/review/`, {
    method: "POST",
    body: JSON.stringify({ action, notes }),
  });
}

export async function fetchFeatureRegistry(){
  return platformFetch("/api/v1/platform/billing/feature-registry/");
}

// ═══════════════════════════════════════════════════════════════════
// BILLING ANALYTICS
// ════════════════════════

export async function fetchAnalyticsOverview() {
  return platformFetch("/api/v1/platform/billing/analytics/overview/");
}

export async function fetchMrrHistory(months = 12) {
  return platformFetch(`/api/v1/platform/billing/analytics/mrr-history/?months=${months}`);
}

export async function fetchChurnData(months = 6) {
  return platformFetch(`/api/v1/platform/billing/analytics/churn/?months=${months}`);
}

export async function fetchCohortData(months = 6) {
  return platformFetch(`/api/v1/platform/billing/analytics/cohorts/?months=${months}`);
}

export async function fetchGrowthData(months = 12) {
  return platformFetch(`/api/v1/platform/billing/analytics/growth/?months=${months}`);
}

export async function fetchPlanMix() {
  return platformFetch("/api/v1/platform/billing/analytics/plan-mix/");

}




