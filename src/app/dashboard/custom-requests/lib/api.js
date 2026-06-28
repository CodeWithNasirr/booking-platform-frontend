import { apiFetch } from "@/lib/apiClient";

export async function getCustomRequests(tenantId, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/v1/custom-requests/?${query}`, tenantId);
}

export async function getCustomRequest(tenantId, id) {
  return apiFetch(`/api/v1/custom-requests/${id}/`, tenantId);
}

export async function createCustomRequest(tenantId, data) {
  return apiFetch(`/api/v1/custom-requests/`, tenantId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function assignProvider(tenantId, id, providerId) {
  return apiFetch(`/api/v1/custom-requests/${id}/assign_provider/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ provider_id: providerId }),
  });
}

export async function submitQuote(tenantId, id, data) {
  return apiFetch(`/api/v1/custom-requests/${id}/submit_quote/`, tenantId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function acceptQuote(tenantId, id, quoteId) {
  return apiFetch(`/api/v1/custom-requests/${id}/accept_quote/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ quote_id: quoteId }),
  });
}

export async function rejectQuote(tenantId, id, quoteId) {
  return apiFetch(`/api/v1/custom-requests/${id}/reject_quote/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ quote_id: quoteId }),
  });
}

export async function rejectRequest(tenantId, id) {
  return apiFetch(`/api/v1/custom-requests/${id}/reject_request/`, tenantId, {
    method: "POST",
  });
}

export async function getSubscriptions(tenantId, params = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/api/v1/customer-subscriptions/?${query}`, tenantId);
}

export async function cancelSubscription(tenantId, id) {
  return apiFetch(`/api/v1/customer-subscriptions/${id}/cancel/`, tenantId, {
    method: "POST",
  });
}

export async function pauseSubscription(tenantId, id) {
  return apiFetch(`/api/v1/customer-subscriptions/${id}/pause/`, tenantId, {
    method: "POST",
  });
}
