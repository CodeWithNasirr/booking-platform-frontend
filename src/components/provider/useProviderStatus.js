"use client";

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { authFetch } from '@/app/provider/services/hooks/useProviderServices';

/**
 * Hook to check provider status (is_active, is_approved)
 * Returns provider info or null if not a provider
 */
export function useProviderStatus() {
  const { activeTenant,tenants } = useApp();
  const tenantId = activeTenant?.id || activeTenant;
  
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const fetchProviderStatus = async () => {
      try {
        setLoading(true);
        // This endpoint should return the current user's provider info
        const data = await authFetch('/api/v1/providers/me/', tenantId);
        setProvider(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProviderStatus();
  }, [tenantId]);

  return {
    provider,
    loading,
    error,
    // Convenience flags
    isActive: provider?.is_active === true,
    isApproved: provider?.is_approved === true,
    canAccess: provider?.is_active === true && provider?.is_approved === true,
  };
}
