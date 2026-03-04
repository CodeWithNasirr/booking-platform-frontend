// src/lib/api/customers.js
/**
 * Customers API Service
 * 
 * Handles all customer-related API calls
 * Uses authFetch which requires (path, tenantId, options)
 */

import { authFetch } from './index'
import { apiFetch } from '@/lib/apiClient'
const customersApi = {
  /**
   * Get paginated list of customers
   */
  async list(params = {}, activeTenant) {
    const queryParams = new URLSearchParams()
    
    if (params.search) queryParams.append('search', params.search)
    if (params.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params.tag) queryParams.append('tag', params.tag)
    if (params.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params.page) queryParams.append('page', params.page)
    if (params.page_size) queryParams.append('page_size', params.page_size)
    if (params.has_bookings) queryParams.append('has_bookings', params.has_bookings)
    
    const queryString = queryParams.toString()
    const path = queryString ? `/api/v1/customers/?${queryString}` : '/api/v1/customers/'
    
    return apiFetch(path, activeTenant, { method: 'GET' })
  },

  /**
   * Get single customer details
   */
  async get(id, activeTenant) {
    return apiFetch(`/api/v1/customers/${id}/`, activeTenant, { method: 'GET' })
  },

  /**
   * Create a new customer
   */
  async create(data, activeTenant) {
    return apiFetch('/api/v1/customers/', activeTenant, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update a customer
   */
  async update(id, data, activeTenant) {
    return apiFetch(`/api/v1/customers/${id}/`, activeTenant, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete (soft) a customer
   */
  async delete(id, activeTenant) {
    return apiFetch(`/api/v1/customers/${id}/`, activeTenant, { method: 'DELETE' })
  },

  /**
   * Update customer status
   */
  async updateStatus(id, status, activeTenant) {
    return apiFetch(`/api/v1/customers/${id}/update_status/`, activeTenant, {
      method: 'POST',
      body: JSON.stringify({ status }),
    })
  },

  /**
   * Update customer tags
   */
  async updateTags(id, tags, action = 'set', activeTenant) {
    return apiFetch(`/api/v1/customers/${id}/update_tags/`, activeTenant, {
      method: 'POST',
      body: JSON.stringify({ tags, action }),
    })
  },

  /**
   * Get customer notes
   */
  async getNotes(id, activeTenant) {
    return apiFetch(`/api/v1/customers/${id}/notes/`, activeTenant, { method: 'GET' })
  },

  /**
   * Add note to customer
   */
  async addNote(id, noteData, activeTenant) {
    return apiFetch(`/api/v1/customers/${id}/notes/`, activeTenant, {
      method: 'POST',
      body: JSON.stringify(noteData),
    })
  },

  /**
   * Get customer booking history
   */
  async getBookings(id, activeTenant, params = {}) {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page)
    if (params.page_size) queryParams.append('page_size', params.page_size)
    
    const queryString = queryParams.toString()
    const path = queryString 
      ? `/api/v1/customers/${id}/bookings/?${queryString}` 
      : `/api/v1/customers/${id}/bookings/`
    
    return apiFetch(path, activeTenant, { method: 'GET' })
  },

  /**
   * Get customer statistics
   */
  async getStats(activeTenant) {
    return apiFetch('/api/v1/customers/stats/', activeTenant, { method: 'GET' })
  },

  /**
   * Get all available tags
   */
  async getTagsList(activeTenant) {
    return apiFetch('/api/v1/customers/tags_list/', activeTenant, { method: 'GET' })
  },

  /**
   * Quick search customers (for autocomplete)
   */
  async search(query, limit = 10, activeTenant) {
    return apiFetch(
      `/api/v1/customers/search/?q=${encodeURIComponent(query)}&limit=${limit}`,
      activeTenant,
      { method: 'GET' }
    )
  },

  /**
   * Find customer by email
   */
  async findByEmail(email, activeTenant) {
    return apiFetch(
      `/api/v1/customers/by-email/?email=${encodeURIComponent(email)}`,
      activeTenant,
      { method: 'GET' }
    )
  },

  /**
   * Bulk import customers
   */
  async bulkImport(customers, activeTenant) {
    return apiFetch('/api/v1/customers/bulk_import/', activeTenant, {
      method: 'POST',
      body: JSON.stringify({ customers }),
    })
  },

  /**
   * Export customers
   */
  async export(params = {}, activeTenant) {
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.append('status', params.status)
    if (params.tag) queryParams.append('tag', params.tag)
    
    const queryString = queryParams.toString()
    const path = queryString 
      ? `/api/v1/customers/export/?${queryString}` 
      : '/api/v1/customers/export/'
    
    return apiFetch(path, activeTenant, { method: 'GET' })
  },

  /**
   * Refresh customer statistics from bookings
   */
  async refreshStats(id, activeTenant) {
    return apiFetch(`/api/v1/customers/${id}/refresh_stats/`, activeTenant, {
      method: 'POST',
    })
  },

  /**
   * Bulk refresh all customer stats
   */
  async bulkRefreshStats(activeTenant) {
    return apiFetch('/api/v1/customers/bulk_refresh_stats/', activeTenant, {
      method: 'POST',
    })
  },

  // ==================
  // Tags Management
  // ==================

  async listTags(activeTenant) {
    return apiFetch('/api/v1/customers/tags/', activeTenant, { method: 'GET' })
  },

  async createTag(data, activeTenant) {
    return apiFetch('/api/v1/customers/tags/', activeTenant, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateTag(id, data, activeTenant) {
    return apiFetch(`/api/v1/customers/tags/${id}/`, activeTenant, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteTag(id, activeTenant) {
    return apiFetch(`/api/v1/customers/tags/${id}/`, activeTenant, { method: 'DELETE' })
  },

  // ==================
  // Notes Management
  // ==================

  async completeNote(noteId, activeTenant) {
    return apiFetch(`/api/v1/customers/notes/${noteId}/complete/`, activeTenant, {
      method: 'POST',
    })
  },

  async deleteNote(noteId, activeTenant) {
    return apiFetch(`/api/v1/customers/notes/${noteId}/`, activeTenant, { method: 'DELETE' })
  },
}

export default customersApi