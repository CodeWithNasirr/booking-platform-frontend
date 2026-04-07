// src/app/dashboard/orders/lib/api/index.js
import Cookies from 'js-cookie';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const authFetch = async (path, tenantId, options = {}) => {
  if (!tenantId) throw new Error('Tenant not ready');

  const token = Cookies.get('access_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    Authorization: token ? `Bearer ${token}` : '',
    'X-Tenant': tenantId,
    ...(options.headers || {}),

  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",

  });

  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
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
    throw error; // ✅ ONLY THROW
  }

  return res.status === 204 ? null : data;
};
