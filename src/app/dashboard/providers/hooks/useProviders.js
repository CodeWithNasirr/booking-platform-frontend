'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApp } from "@/contexts/AppContext";

import { fetchProviders,createProvider ,updateProvider,updateAvailability,toggleProviderStatus,deleteProvider } from '../lib/api'

export const useProviders = () => {
  const [providers, setProviders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { activeTenant,t,isRTL } = useApp();


  const loadProviders = useCallback(async () => {
    if (!activeTenant) return;

    try {
      setIsLoading(true)
      const data = await fetchProviders(activeTenant)
    
      setProviders(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [activeTenant])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  const addProvider = async (formData) => {
    const newProvider = await createProvider(activeTenant,formData)
    setProviders(prev => [...prev, newProvider])
    return newProvider
  }

  const editProvider = async (id, formData) => {
    const updated = await updateProvider(activeTenant,id, formData)
    // ✅ single source of truth = backend
    // await loadProviders()
    return updated
  }

  const saveAvailability = async (id, availability) => {
    const updated = await updateAvailability(activeTenant,id, availability)
    setProviders(prev =>
      prev.map(p => p.id === id ? updated : p)
    )
    return updated
  }

  const toggleStatus = async (id) => {
    const provider = providers.find(p => p.id === id)
    const newStatus = !provider.isActive
    await toggleProviderStatus(activeTenant,id, newStatus)
    setProviders(prev => prev.map(p => p.id === id ? { ...p, isActive: newStatus } : p))
  }

  const removeProvider = async (id) => {
    await deleteProvider(activeTenant,id)
    setProviders(prev => prev.filter(p => p.id !== id))
  }

  return {
    providers,
    isLoading,
    error,
    refresh: loadProviders,
    addProvider,
    editProvider,
    saveAvailability,
    toggleStatus,
    removeProvider,
  }
}