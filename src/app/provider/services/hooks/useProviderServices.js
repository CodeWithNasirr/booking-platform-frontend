"use client";

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Request helper (same pattern as orderApi.js) ───

export const authFetch = async (path, tenantId, options = {}) => {
  if (!tenantId) throw new Error("Tenant not ready");

  const token = Cookies.get("access_token");
  const isFormData = options.body instanceof FormData;

  const headers = {
    "X-Tenant": tenantId,
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
    
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",

  });

  let data = null;
  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.non_field_errors?.[0] ||
      Object.values(data || {})?.[0]?.[0] ||
      `HTTP ${res.status}`;

    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return res.status === 204 ? null : data;
};

// =========================================================================
// PROVIDER SERVICES API (matching backend endpoints)
// =========================================================================

/**
 * Fetch all active services for current provider.
 * Backend: GET /api/v1/provider-services/my-services/
 */
export async function fetchMyServices(tenantId) {
  return authFetch(`/api/v1/providers/provider-services/my-services/`, tenantId);
}

/**
 * Fetch available services that provider can enable.
 * Backend: GET /api/v1/provider-services/available/
 */
export async function fetchAvailableServices(tenantId) {
  return authFetch(`/api/v1/providers/provider-services/available/`, tenantId);
}

/**
 * Enable a service for the provider.
 * Backend: POST /api/v1/provider-services/enable/
 */
export async function enableService(tenantId, serviceId) {
  return authFetch(`/api/v1/providers/provider-services/enable/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ service_id: serviceId }),
  });
}

/**
 * Disable a service for the provider.
 * Backend: POST /api/v1/provider-services/disable/
 */
export async function disableService(tenantId, serviceId) {
  return authFetch(`/api/v1/providers/provider-services/disable/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ service_id: serviceId }),
  });
}

/**
 * Request access to a new service.
 * Backend: POST /api/v1/provider-services/request-service/
 */
export async function requestService(tenantId, serviceId, message = "") {
  return authFetch(`/api/v1/providers/provider-services/request-service/`, tenantId, {
    method: "POST",
    body: JSON.stringify({ service_id: serviceId, message }),
  });
}

/**
 * Fetch all service requests made by provider.
 * Backend: GET /api/v1/provider-services/requests/
 */
export async function fetchServiceRequests(tenantId) {
  return authFetch(`/api/v1/providers/provider-services/requests/`, tenantId);
}

// =========================================================================
// REACT HOOKS (using useApp pattern like ProviderOrderDetailClient)
// =========================================================================

/**
 * Hook for managing provider's active services
 * Usage: const { services, loading, error, disableService } = useMyServices();
 */
export function useMyServices() {
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyServices(tenantId);
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDisable = useCallback(async (serviceId) => {
    if (!tenantId) return false;
    
    try {
      await disableService(tenantId, serviceId);
      await fetchServices(); // Refresh list
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [tenantId, fetchServices]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
    disableService: handleDisable,
  };
}

/**
 * Hook for available services to enable
 * Usage: const { services, loading, error, enableService } = useAvailableServices();
 */
export function useAvailableServices() {
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAvailable = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAvailableServices(tenantId);
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAvailable();
  }, [fetchAvailable]);

  const handleEnable = useCallback(async (serviceId) => {
    if (!tenantId) return false;
    
    try {
      await enableService(tenantId, serviceId);
      await fetchAvailable(); // Refresh list
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [tenantId, fetchAvailable]);

  return {
    services,
    loading,
    error,
    refetch: fetchAvailable,
    enableService: handleEnable,
  };
}

/**
 * Hook for service requests
 * Usage: const { requests, loading, error, submitRequest } = useServiceRequests();
 */
export function useServiceRequests() {
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchServiceRequests(tenantId);
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = useCallback(async (serviceId, message) => {
    if (!tenantId) return false;
    
    try {
      await requestService(tenantId, serviceId, message);
      await fetchRequests(); // Refresh list
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [tenantId, fetchRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    submitRequest: handleSubmit,
  };
}

/**
 * Combined hook for the ServicesPage (includes all three)
 * Usage: const { myServices, available, requests, isLoading } = useProviderServices();
 */
export function useProviderServices() {
  const myServices = useMyServices();
  const available = useAvailableServices();
  const requests = useServiceRequests();

  // 🔥 GLOBAL REFRESH
  const refreshAll = async () => {
    await Promise.all([
      myServices.refetch(),
      available.refetch(),
    ]);
  };

  // 🔥 ENABLE
  const enable = async (serviceId) => {
    const ok = await available.enableService(serviceId);
    if (ok) await refreshAll();
    return ok;
  };

  // 🔥 DISABLE
  const disable = async (serviceId) => {
    const ok = await myServices.disableService(serviceId);
    if (ok) await refreshAll();
    return ok;
  };

  return {
    myServices: myServices.services,
    availableServices: available.services,
    requests: requests.requests,

    myServicesLoading: myServices.loading,
    availableLoading: available.loading,
    requestsLoading: requests.loading,

    myServicesError: myServices.error,
    availableError: available.error,
    requestsError: requests.error,

    enableService: enable,
    disableService: disable,
  };
}
