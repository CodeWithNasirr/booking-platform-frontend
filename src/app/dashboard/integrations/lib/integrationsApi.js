// src/lib/integrationsApi.js

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
    error.data = data;
    throw error;
  }
  return data;
}

// ── Integration CRUD ────────────────────────────────────────────

export async function fetchIntegrations(tenantId) {
  return apiCall(`${API}/api/v1/tenant/integrations/`, {
    headers: headers(tenantId),
  });
}

export async function connectIntegration(tenantId, integrationType, config = {}) {
  return apiCall(`${API}/api/v1/tenant/integrations/connect/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify({ integration_type: integrationType, config }),
  });
}

export async function disconnectIntegration(tenantId, integrationType, extra = {}) {
  return apiCall(`${API}/api/v1/tenant/integrations/disconnect/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify({ integration_type: integrationType, ...extra }),
  });
}

// ── Google Calendar ─────────────────────────────────────────────

export async function getGoogleCalendarOAuthUrl(tenantId, providerId) {
  const qs = providerId ? `?provider_id=${providerId}` : "";
  return apiCall(`${API}/api/v1/tenant/integrations/google-calendar/url/${qs}`, {
    headers: headers(tenantId),
  });
}

// ── WhatsApp Web ────────────────────────────────────────────────

export async function startWhatsAppSession(tenantId) {
  return apiCall(`${API}/api/v1/whatsapp/start/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

export async function getWhatsAppStatus(tenantId) {
  return apiCall(`${API}/api/v1/whatsapp/status/`, {
    headers: headers(tenantId),
  });
}

export async function getWhatsAppQR(tenantId) {
  return apiCall(`${API}/api/v1/whatsapp/qr/`, {
    headers: headers(tenantId),
  });
}

export async function disconnectWhatsApp(tenantId) {
  return apiCall(`${API}/api/v1/whatsapp/disconnect/`, {
    method: "POST",
    headers: headers(tenantId),
  });
}

export async function sendWhatsAppMessage(tenantId, to, message) {
  return apiCall(`${API}/api/v1/whatsapp/send/`, {
    method: "POST",
    headers: headers(tenantId),
    body: JSON.stringify({ to, message }),
  });
}