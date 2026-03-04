// src/app/dashboard/bookings/lib/api/services.js
import { authFetch } from './index';

/**
 * Services API
 */

/**
 * Get all services
 */
export async function getServices(tenantId, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/api/v1/services/?${query}` : '/api/v1/services/';
  return authFetch(url, tenantId);
}

/**
 * Get single service by slug
 */
export async function getService(tenantId, slug) {
  return authFetch(`/api/v1/services/${slug}/`, tenantId);
}

/**
 * Create new service
 */
export async function createService(tenantId, data) {
  return authFetch('/api/v1/services/', tenantId, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update service
 */
export async function updateService(tenantId, slug, data) {
  return authFetch(`/api/v1/services/${slug}/`, tenantId, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete service (soft delete)
 */
export async function deleteService(tenantId, slug) {
  return authFetch(`/api/v1/services/${slug}/`, tenantId, {
    method: 'DELETE',
  });
}

/**
 * Get service stats
 */
export async function getServiceStats(tenantId) {
  return authFetch('/api/v1/services/stats/', tenantId);
}

/**
 * Toggle service active status
 */
export async function toggleServiceActive(tenantId, slug) {
  return authFetch(`/api/v1/services/${slug}/toggle_active/`, tenantId, {
    method: 'POST',
  });
}

/**
 * Duplicate service
 */
export async function duplicateService(tenantId, slug) {
  return authFetch(`/api/v1/services/${slug}/duplicate/`, tenantId, {
    method: 'POST',
  });
}

/**
 * Get deleted services
 */
export async function getDeletedServices(tenantId) {
  return authFetch('/api/v1/services/deleted/', tenantId);
}

/**
 * Restore deleted service
 */
export async function restoreService(tenantId, slug) {
  return authFetch(`/api/v1/services/${slug}/restore/`, tenantId, {
    method: 'POST',
  });
}

/**
 * Permanently delete service
 */
export async function permanentDeleteService(tenantId, slug) {
  return authFetch(`/api/v1/services/${slug}/permanent_delete/`, tenantId, {
    method: 'DELETE',
  });
}

// ─────────────────────────────────────────────
// Service Categories
// ─────────────────────────────────────────────

/**
 * Get all categories
 */
export async function getCategories(tenantId) {
  return authFetch('/api/v1/service-categories/', tenantId);
}

/**
 * Create category
 */
export async function createCategory(tenantId, data) {
  return authFetch('/api/v1/service-categories/', tenantId, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update category
 */
export async function updateCategory(tenantId, slug, data) {
  return authFetch(`/api/v1/service-categories/${slug}/`, tenantId, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete category
 */
export async function deleteCategory(tenantId, slug) {
  return authFetch(`/api/v1/service-categories/${slug}/`, tenantId, {
    method: 'DELETE',
  });
}

export default {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getServiceStats,
  toggleServiceActive,
  duplicateService,
  getDeletedServices,
  restoreService,
  permanentDeleteService,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};