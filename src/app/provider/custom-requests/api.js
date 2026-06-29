import { apiFetch } from "@/lib/apiClient";

export async function fetchProviderRequests(tenantId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString() ? `?${params}` : "";
  const data = await apiFetch(`/api/v1/custom-requests/${qs}`, tenantId);
  return data.results || data;
}

export async function fetchProviderRequest(tenantId, id) {
  return apiFetch(`/api/v1/custom-requests/${id}/`, tenantId);
}

export async function submitQuote(tenantId, id, payload) {
  return apiFetch(`/api/v1/custom-requests/${id}/submit_quote/`, tenantId, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function postProviderMessage(tenantId, id, body, kind = "message") {
  return apiFetch(`/api/v1/custom-requests/${id}/messages/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ body, kind }),
  });
}
