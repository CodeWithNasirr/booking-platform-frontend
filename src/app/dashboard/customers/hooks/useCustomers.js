// src/hooks/useCustomers.js
/**
 * useCustomers Hook
 * 
 * Manages customer data fetching and state
 * Passes activeTenant to all API calls
 */

import { useState, useEffect, useCallback } from 'react'
import customersApi from '../lib/api/customers'
import { useApp } from '@/contexts/AppContext'

export function useCustomers(initialFilters = {}) {
  const { activeTenant } = useApp()
  
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState(null)
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    tag: '',
    sort_by: '-created_at',
    ...initialFilters
  })

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    if (!activeTenant) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await customersApi.list(filters, activeTenant)
      // Handle paginated or array response
      const customersList = Array.isArray(data) ? data : data.results || []
      // Ensure each customer has a name field
      const customersWithNames = customersList.map(customer => ({
        ...customer,
        name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown'
      }))
      setCustomers(customersWithNames)
    } catch (err) {
      console.error('Failed to fetch customers:', err)
      setError(err.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [activeTenant, filters])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!activeTenant) return
    
    try {
      const data = await customersApi.getStats(activeTenant)
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }, [activeTenant])

  // Fetch tags
  const fetchTags = useCallback(async () => {
    if (!activeTenant) return
    
    try {
      const data = await customersApi.getTagsList(activeTenant)
      setTags(data.tags || [])
    } catch (err) {
      console.error('Failed to fetch tags:', err)
    }
  }, [activeTenant])

  // Initial load
  useEffect(() => {
    fetchCustomers()
    fetchStats()
    fetchTags()
  }, [fetchCustomers, fetchStats, fetchTags])

  // Refetch when filters change
  useEffect(() => {
    fetchCustomers()
  }, [filters, fetchCustomers])

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Create customer
  const createCustomer = useCallback(async (customerData) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const newCustomer = await customersApi.create(customerData, activeTenant)
      // Construct the full name if not returned by API
      const customerWithName = {
        ...newCustomer,
        name: newCustomer.name || `${newCustomer.first_name || ''} ${newCustomer.last_name || ''}`.trim() || 'Unknown'
      }
      setCustomers(prev => [customerWithName, ...prev])
      fetchStats() // Refresh stats
       // Refresh the list to get computed fields from backend
      fetchCustomers()
      return { success: true, data: customerWithName }
    } catch (err) {
      console.error('Failed to create customer:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant, fetchStats])

  // Update customer
  const updateCustomer = useCallback(async (id, customerData) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const updated = await customersApi.update(id, customerData, activeTenant)
      // Construct the full name if not returned by API
      const customerWithName = {
        ...updated,
        name: updated.name || `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || 'Unknown'
      }
      setCustomers(prev => prev.map(c => c.id === id ? customerWithName : c))
      // Refresh the list to get computed fields from backend
      fetchCustomers()
      return { success: true, data: customerWithName }
    } catch (err) {
      console.error('Failed to update customer:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant, fetchCustomers])

  // Delete customer
  const deleteCustomer = useCallback(async (id) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      await customersApi.delete(id, activeTenant)
      setCustomers(prev => prev.filter(c => c.id !== id))
      fetchStats() // Refresh stats
      return { success: true }
    } catch (err) {
      console.error('Failed to delete customer:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant, fetchStats])

  // Update customer status
  const updateStatus = useCallback(async (id, status) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const updated = await customersApi.updateStatus(id, status, activeTenant)
      // Ensure customer has a name field
      const customerWithName = {
        ...updated,
        name: updated.name || `${updated.first_name || ''} ${updated.last_name || ''}`.trim() || 'Unknown'
      }
      setCustomers(prev => prev.map(c => c.id === id ? customerWithName : c))
      fetchStats() // Refresh stats
      return { success: true, data: customerWithName }
    } catch (err) {
      console.error('Failed to update status:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant, fetchStats])

  // Update customer tags
  const updateTags = useCallback(async (id, tagsList, action = 'set') => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const updated = await customersApi.updateTags(id, tagsList, action, activeTenant)
      setCustomers(prev => prev.map(c => c.id === id ? updated : c))
      return { success: true, data: updated }
    } catch (err) {
      console.error('Failed to update tags:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant])

  // Get single customer
  const getCustomer = useCallback(async (id) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const customer = await customersApi.get(id, activeTenant)
      // Ensure customer has a name field
      const customerWithName = {
        ...customer,
        name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown'
      }
      return { success: true, data: customerWithName }
    } catch (err) {
      console.error('Failed to get customer:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant])

  // Add note to customer
  const addNote = useCallback(async (customerId, noteData) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const note = await customersApi.addNote(customerId, noteData, activeTenant)
      return { success: true, data: note }
    } catch (err) {
      console.error('Failed to add note:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant])

  // Get customer notes
  const getNotes = useCallback(async (customerId) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const notes = await customersApi.getNotes(customerId, activeTenant)
      return { success: true, data: notes }
    } catch (err) {
      console.error('Failed to get notes:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant])

  // Get customer bookings
  const getBookings = useCallback(async (customerId, params = {}) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const bookings = await customersApi.getBookings(customerId, activeTenant, params)
      return { success: true, data: bookings }
    } catch (err) {
      console.error('Failed to get bookings:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant])

  // Search customers (for autocomplete)
  const searchCustomers = useCallback(async (query, limit = 10) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const results = await customersApi.search(query, limit, activeTenant)
      return { success: true, data: results }
    } catch (err) {
      console.error('Failed to search customers:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant])

  // Find customer by email
  const findByEmail = useCallback(async (email) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const result = await customersApi.findByEmail(email, activeTenant)
      return { success: true, data: result }
    } catch (err) {
      console.error('Failed to find customer:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant])

  // Refresh single customer stats
  const refreshCustomerStats = useCallback(async (customerId) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const updated = await customersApi.refreshStats(customerId, activeTenant)
      setCustomers(prev => prev.map(c => c.id === customerId ? updated : c))
      return { success: true, data: updated }
    } catch (err) {
      console.error('Failed to refresh stats:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant])

  // Bulk import customers
  const bulkImport = useCallback(async (customersData) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const result = await customersApi.bulkImport(customersData, activeTenant)
      fetchCustomers() // Refresh list
      fetchStats() // Refresh stats
      return { success: true, data: result }
    } catch (err) {
      console.error('Failed to import customers:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant, fetchCustomers, fetchStats])

  // Export customers
  const exportCustomers = useCallback(async (params = {}) => {
    if (!activeTenant) return { success: false, error: 'Tenant not ready' }
    
    try {
      const data = await customersApi.export(params, activeTenant)
      return { success: true, data }
    } catch (err) {
      console.error('Failed to export customers:', err)
      return { success: false, error: err.data || err.message }
    }
  }, [activeTenant])

  return {
    // State
    customers,
    stats,
    tags,
    loading,
    error,
    filters,
    
    // Actions
    updateFilters,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateStatus,
    updateTags,
    getCustomer,
    addNote,
    getNotes,
    getBookings,
    searchCustomers,
    findByEmail,
    refreshCustomerStats,
    bulkImport,
    exportCustomers,
    
    // Refresh
    refresh: fetchCustomers,
    refreshStats: fetchStats,
    refreshTags: fetchTags,
  }
}

export default useCustomers