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

// Quote creation is intentionally absent from the provider API —
// V3.E business rule: only the tenant issues quotes. The
// provider participates in the conversation and can flag the
// quote shape internally but the customer-facing pricing
// decision is the tenant's.

export async function postProviderMessage(tenantId, id, body, kind = "message") {
  return apiFetch(`/api/v1/custom-requests/${id}/messages/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ body, kind }),
  });
}
