// src/app/dashboard/bookings/lib/api/providers.js
import { authFetch } from './index';

/**
 * Providers API Service
 */

/**
 * Get all providers
 */
export async function getProviders(tenantId, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/api/v1/providers/?${query}` : '/api/v1/providers/';
  return authFetch(url, tenantId);
}

/**
 * Get single provider by ID
 */
export async function getProvider(tenantId, id) {
  return authFetch(`/api/v1/providers/${id}/`, tenantId);
}

/**
 * Get current user's provider profile
 */
export async function getProviderMe(tenantId) {
  return authFetch('/api/v1/providers/me/', tenantId);
}

/**
 * Create new provider
 */
export async function createProvider(tenantId, data) {
  return authFetch('/api/v1/providers/', tenantId, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update provider
 */
export async function updateProvider(tenantId, id, data) {
  return authFetch(`/api/v1/providers/${id}/`, tenantId, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete provider
 */
export async function deleteProvider(tenantId, id) {
  return authFetch(`/api/v1/providers/${id}/`, tenantId, {
    method: 'DELETE',
  });
}

/**
 * Restore deleted provider
 */
export async function restoreProvider(tenantId, id) {
  return authFetch(`/api/v1/providers/${id}/restore/`, tenantId, {
    method: 'POST',
  });
}

/**
 * Get provider availability
 */
export async function getProviderAvailability(tenantId, providerId) {
  return authFetch(`/api/v1/providers/${providerId}/availability/`, tenantId);
}

/**
 * Set provider availability
 */
export async function setProviderAvailability(tenantId, providerId, data) {
  return authFetch(`/api/v1/providers/${providerId}/availability/`, tenantId, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get provider schedule
 */
export async function getProviderSchedule(tenantId, providerId, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query
    ? `/api/v1/providers/${providerId}/schedule/?${query}`
    : `/api/v1/providers/${providerId}/schedule/`;
  return authFetch(url, tenantId);
}

/**
 * Get provider services
 */
export async function getProviderServices(tenantId, providerId) {
  return authFetch(`/api/v1/providers/${providerId}/services/`, tenantId);
}

/**
 * Assign services to provider
 */
export async function assignProviderServices(tenantId, providerId, serviceIds) {
  return authFetch(`/api/v1/providers/${providerId}/services/`, tenantId, {
    method: 'POST',
    body: JSON.stringify({ service_ids: serviceIds }),
  });
}

/**
 * Get provider ratings/reviews
 */
export async function getProviderRatings(tenantId, providerId) {
  return authFetch(`/api/v1/providers/${providerId}/ratings/`, tenantId);
}

/**
 * Get providers by service
 */
export async function getProvidersByService(tenantId, serviceId) {
  return authFetch(`/api/v1/providers/?service=${serviceId}`, tenantId);
}

/**
 * Connect Stripe for provider
 */
export async function connectStripe(tenantId, providerId) {
  return authFetch(`/api/v1/providers/${providerId}/connect-stripe/`, tenantId, {
    method: 'POST',
  });
}

export default {
  getProviders,
  getProvider,
  getProviderMe,
  createProvider,
  updateProvider,
  deleteProvider,
  restoreProvider,
  getProviderAvailability,
  setProviderAvailability,
  getProviderSchedule,
  getProviderServices,
  assignProviderServices,
  getProviderRatings,
  getProvidersByService,
  connectStripe,
};