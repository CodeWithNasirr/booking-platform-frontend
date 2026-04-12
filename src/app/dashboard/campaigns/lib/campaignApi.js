// src/lib/campaignApi.js
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(tenantId) {
  const token = Cookies.get("access_token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Tenant": tenantId,
  };
}

function jsonHeaders(tenantId) {
  return {
    ...authHeaders(tenantId),
    "Content-Type": "application/json",
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

// ── WhatsApp check (before creating campaign) ───────────────────

export async function checkWhatsAppForCampaign(tenantId) {
  return apiCall(`${API}/api/v1/whatsapp/status/`, {
    headers: jsonHeaders(tenantId),
  });
}

// ── Campaigns CRUD ──────────────────────────────────────────────

export async function fetchCampaigns(tenantId, { status, search, page, page_size } = {}) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (search) params.set("search", search);
  if (page) params.set("page", page);
  if (page_size) params.set("page_size", page_size);

  return apiCall(`${API}/api/v1/whatsapp/campaigns/?${params}`, {
    headers: jsonHeaders(tenantId),
  });
}

export async function createCampaign(tenantId, formData) {
  // FormData — do NOT set Content-Type (browser sets multipart boundary)
  return apiCall(`${API}/api/v1/whatsapp/campaigns/`, {
    method: "POST",
    headers: authHeaders(tenantId),
    body: formData,
  });
}

export async function getCampaign(tenantId, campaignId) {
  return apiCall(`${API}/api/v1/whatsapp/campaigns/${campaignId}/`, {
    headers: jsonHeaders(tenantId),
  });
}

export async function updateCampaign(tenantId, campaignId, formData) {
  return apiCall(`${API}/api/v1/whatsapp/campaigns/${campaignId}/`, {
    method: "PATCH",
    headers: authHeaders(tenantId),
    body: formData,
  });
}

export async function deleteCampaign(tenantId, campaignId) {
  return apiCall(`${API}/api/v1/whatsapp/campaigns/${campaignId}/`, {
    method: "DELETE",
    headers: jsonHeaders(tenantId),
  });
}

export async function startCampaign(tenantId, campaignId) {
  return apiCall(`${API}/api/v1/whatsapp/campaigns/${campaignId}/start/`, {
    method: "POST",
    headers: jsonHeaders(tenantId),
  });
}

export async function suspendCampaign(tenantId, campaignId) {
  return apiCall(`${API}/api/v1/whatsapp/campaigns/${campaignId}/suspend/`, {
    method: "POST",
    headers: jsonHeaders(tenantId),
  });
}

export async function getAudienceCount(tenantId, audienceType) {
  return apiCall(
    `${API}/api/v1/whatsapp/campaigns/audience-count/?audience_type=${audienceType}`,
    { headers: jsonHeaders(tenantId) }
  );
}