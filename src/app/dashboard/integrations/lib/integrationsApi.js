// src/lib/integrationsApi.js

import Cookies from "js-cookie";
import { apiFetch } from "@/lib/apiClient";
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
  return apiFetch(`/api/v1/tenant/integrations/`, tenantId);
}

export async function connectIntegration(tenantId, integrationType, config = {}) {
  return apiFetch(`/api/v1/tenant/integrations/connect/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ integration_type: integrationType, config }),
  });
}

export async function disconnectIntegration(tenantId, integrationType, extra = {}) {
  return apiFetch(`/api/v1/tenant/integrations/disconnect/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ integration_type: integrationType, ...extra }),
  });
}

// ── Google Calendar ─────────────────────────────────────────────

export async function getGoogleCalendarOAuthUrl(tenantId, providerId,sourcePanel = "tenant") {
  const qs = providerId ? `?provider_id=${providerId}` : "";
  const sr = sourcePanel === "provider" ? "provider" : "tenant";
  return apiFetch(`/api/v1/tenant/integrations/google-calendar/url/${qs}${qs ? "&" : "?"}source_panel=${sr}`, tenantId);
}


// ── WhatsApp Web ────────────────────────────────────────────────

export async function startWhatsAppSession(tenantId) {
  return apiFetch(`/api/v1/whatsapp/start/`, tenantId, {
    method: "POST",
  });
}

export async function getWhatsAppStatus(tenantId) {
  return apiFetch(`/api/v1/whatsapp/status/`, tenantId);
}

export async function getWhatsAppQR(tenantId) {
  return apiFetch(`/api/v1/whatsapp/qr/`, tenantId);
}
   

export async function disconnectWhatsApp(tenantId) {
  return apiFetch(`/api/v1/whatsapp/disconnect/`, tenantId, {
    method: "POST",
  });
}

export async function sendWhatsAppMessage(tenantId, to, message) {
  return apiFetch(`/api/v1/whatsapp/send/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ to, message }),
  });
}