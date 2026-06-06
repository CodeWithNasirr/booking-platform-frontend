// providers/lib/api.js
import Cookies from 'js-cookie'
import { apiFetch } from '@/lib/apiClient'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'


// API Helper with cookie-based auth
export const authFetch = async (url,tenantId, options = {}) => {
  const token = Cookies.get('access_token')
  if (!tenantId) throw new Error('Tenant not ready')

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Tenant': tenantId,
      ...(options.headers || {}),
    },
    credentials: "include",

  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))

    const err = new Error(
      error.detail || error.message || `HTTP ${res.status}`
    )

    err.status = res.status
    err.data = error

    throw err
  }


  return res
}

// Transform backend availability to frontend format
export const transformAvailabilityFromBackend = (slots = []) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const result = {}
  
  days.forEach(day => {
    result[day] = { enabled: false, start: '', end: '' }
  })
  
  slots.forEach(slot => {
    const dayName = days[slot.day_of_week]
    if (dayName) {
      result[dayName] = {
        enabled: true,
        start: slot.start_time?.substring(0, 5) || '09:00',
        end: slot.end_time?.substring(0, 5) || '17:00'
      }
    }
  })
  
  return result
}

// Transform frontend availability to backend format
export const transformAvailabilityToBackend = (frontendAvailability) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  return days
    .map((day, index) => ({
      day_of_week: index,
      start_time: frontendAvailability[day]?.start || '09:00',
      end_time: frontendAvailability[day]?.end || '17:00',
    }))
    .filter(slot => {
      const dayData = frontendAvailability[days[slot.day_of_week]]
      return dayData?.enabled
    })
}

// Transform backend provider to frontend format
export const transformProviderFromBackend = (data) => ({
  id: data.id,
  name: data.name,
  email: data.email,
  phone: data.phone || '',
  bio: data.bio || '',
  isActive: data.is_active,
  // Map services to assignedServices for the form
  assignedServices: data.services?.map(s => s.id) || [],
  services: data.services?.map(s => s.name?.en || s.name) || [], // For display
  availability: transformAvailabilityFromBackend(data.availability),
  meetingProvider: data.meeting_provider || 'google_meet',
  completedBookings: data.completed_bookings || data.bookings_count || 0,
})



// API Functions
export const fetchProviders = async (tenantId) => {
  const data = await apiFetch(
    `/api/v1/providers/`,
    tenantId
  )
  // console.log(data,"data")
  return data.map(transformProviderFromBackend)
}


export const createProvider = async (tenantId,formData) => {
  const data = await apiFetch(
    `/api/v1/providers/`,
    tenantId,
    {
    method: 'POST',
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio || '',
      assign_all_services: formData.assignAllServices || false,
      service_ids: formData.assignedServices || [], // Send selected service IDs
    })
    }
  )

  return transformProviderFromBackend(data)
}

export const updateProvider = async (tenantId, id, formData) => {
  const payload = {
    name: formData.name,
    phone: formData.phone,
    bio: formData.bio || '',
    is_active: formData.isActive,
    service_ids: formData.assignedServices || [],
  }

  if (formData.email !== formData.originalEmail) {
    payload.email = formData.email
  }
const data = await apiFetch(
  `/api/v1/providers/${id}/`,
    tenantId,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  )

  return transformProviderFromBackend(data)
}


export const updateAvailability = async (tenantId, id, availability) => {
  const data = await apiFetch(
    `/api/v1/providers/${id}/availability/`,
    tenantId,
    {
      method: 'POST',
      body: JSON.stringify({
        provider_id: id,
        availability_slots: transformAvailabilityToBackend(availability)
      })
    }
  )
  return transformProviderFromBackend(data)
}

export const toggleProviderStatus = async (tenantId,id, isActive) => {
  const data = await apiFetch(
    `/api/v1/providers/${id}/`,
    tenantId,
    {
    method: 'PATCH',
    body: JSON.stringify({ is_active: isActive })
  })
  return transformProviderFromBackend(data)
}

export const deleteProvider = async (tenantId,id) => {
  await apiFetch(
  `/api/v1/providers/${id}/`,
  tenantId,
  {
    method: 'DELETE'
  })
  return true
}