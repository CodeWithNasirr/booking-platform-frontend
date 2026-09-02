// src/lib/brandingApi.js
//
// Custom Branding API client. One place for every branding call so no raw fetch
// is scattered across components. Uploads go through apiFetch with FormData, so
// auth + X-Tenant are attached and the browser sets the multipart boundary.

import { apiFetch } from "@/lib/apiClient";

export async function getBranding(tenantId) {
  return apiFetch("/api/v1/website/branding/", tenantId);
}

export async function updateBranding(tenantId, payload) {
  return apiFetch("/api/v1/website/branding/", tenantId, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function uploadBrandingLogo(tenantId, file) {
  const fd = new FormData();
  fd.append("logo", file);
  return apiFetch("/api/v1/website/branding/logo/", tenantId, {
    method: "POST",
    body: fd,
  });
}

export async function deleteBrandingLogo(tenantId) {
  return apiFetch("/api/v1/website/branding/logo/", tenantId, { method: "DELETE" });
}

export async function uploadBrandingFavicon(tenantId, file) {
  const fd = new FormData();
  fd.append("favicon", file);
  return apiFetch("/api/v1/website/branding/favicon/", tenantId, {
    method: "POST",
    body: fd,
  });
}

export async function deleteBrandingFavicon(tenantId) {
  return apiFetch("/api/v1/website/branding/favicon/", tenantId, { method: "DELETE" });
}
