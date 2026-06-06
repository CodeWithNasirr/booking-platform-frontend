// src/app/dashboard/bookings/lib/api/bookings.js
// import { apiFetch } from './index';
import { apiFetch } from "@/lib/apiClient";
/**
 * Booking API Service
 * Connects to Django backend booking endpoints
 */

// =====================
// BOOKING CRUD
// =====================

/**
 * Fetch all bookings with optional filters
 */
export async function getBookings(tenantId, params = {}) {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append('status', params.status);
  if (params.type) queryParams.append('type', params.type);
  if (params.service) queryParams.append('service', params.service);
  if (params.page) queryParams.append('page', params.page);
  if (params.search) queryParams.append('search', params.search);

  const query = queryParams.toString();
  const url = query ? `/api/v1/bookings/?${query}` : '/api/v1/bookings/';

  return apiFetch(url, tenantId);
}

/**
 * Get single booking by ID
 */
export async function getBooking(tenantId, id) {
  return apiFetch(`/api/v1/bookings/${id}/`, tenantId);
}

/**
 * Create new booking
 * Matches PublicBookingCreateSerializer on backend
 */
export async function createBooking(tenantId, data) {
  return apiFetch('/api/v1/bookings/', tenantId, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update booking
 */
export async function updateBooking(tenantId, id, data) {
  return apiFetch(`/api/v1/bookings/${id}/`, tenantId, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete booking (soft delete)
 */
export async function deleteBooking(tenantId, id) {
  return apiFetch(`/api/v1/bookings/${id}/`, tenantId, {
    method: 'DELETE',
  });
}

/**
 * Restore deleted booking
 */
export async function restoreBooking(tenantId, id) {
  return apiFetch(`/api/v1/bookings/${id}/restore/`, tenantId, {
    method: 'POST',
  });
}

// =====================
// STATUS MANAGEMENT
// =====================

/**
 * Update booking status
 */
export async function updateBookingStatus(tenantId, id, status, notes = '') {
  return apiFetch(`/api/v1/bookings/${id}/update_status/`, tenantId, {
    method: 'POST',
    body: JSON.stringify({ status, notes }),
  });
}

/**
 * Cancel booking
 */
export async function cancelBooking(tenantId, id, reason, refundRequested = false) {
  return apiFetch(`/api/v1/bookings/${id}/cancel/`, tenantId, {
    method: 'POST',
    body: JSON.stringify({
      reason,
      refund_requested: refundRequested,
    }),
  });
}

// =====================
// PAYMENT
// =====================

/**
 * Initiate payment for booking
 */
export async function initiatePayment(tenantId, id, isDeposit = false) {
  return apiFetch(`/api/v1/bookings/${id}/initiate_payment/`, tenantId, {
    method: 'POST',
    body: JSON.stringify({ is_deposit: isDeposit }),
  });
}

/**
 * Confirm payment
 */
export async function confirmPayment(tenantId, id, paymentIntentId) {
  return apiFetch(`/api/v1/bookings/${id}/confirm_payment/`, tenantId, {
    method: 'POST',
    body: JSON.stringify({ payment_intent_id: paymentIntentId }),
  });
}

// =====================
// FILES
// =====================

/**
 * Upload file to booking
 */
export async function uploadBookingFile(tenantId, id, file, category) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  return apiFetch(`/api/v1/bookings/${id}/upload_file/`, tenantId, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Get booking files
 */
export async function getBookingFiles(tenantId, id) {
  return apiFetch(`/api/v1/bookings/${id}/files/`, tenantId);
}

// =====================
// REVIEWS
// =====================

/**
 * Submit review for completed booking
 */
export async function submitReview(tenantId, id, reviewData) {
  return apiFetch(`/api/v1/bookings/${id}/submit_review/`, tenantId, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
}

// =====================
// SLOTS
// =====================

/**
 * Get available booking slots
 */
export async function getBookingSlots(tenantId, serviceId, date, providerId = null) {
  const params = new URLSearchParams({
    service: serviceId,
    date,
  });

  if (providerId) {
    params.append('provider', providerId);
  }

  return apiFetch(`/api/v1/booking/slots/?${params.toString()}`, tenantId);
}

// =====================
// DASHBOARD
// =====================

/**
 * Get dashboard overview stats
 */
export async function getDashboardOverview(tenantId) {
  return apiFetch('/api/v1/dashboard/overview/', tenantId);
}

/**
 * Get dashboard revenue data
 */
export async function getDashboardRevenue(tenantId) {
  return apiFetch('/api/v1/dashboard/revenue/', tenantId);
}

/**
 * Get recent bookings for dashboard
 */
export async function getRecentBookings(tenantId) {
  return apiFetch('/api/v1/dashboard/recent-bookings/', tenantId);
}

// =====================
// GUEST ACCESS
// =====================

/**
 * Send OTP for guest booking access
 */
export async function sendGuestOTP(tenantId, email) {
  return apiFetch('/api/v1/guest-bookings/otp/send/', tenantId, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Verify OTP for guest booking access
 */
export async function verifyGuestOTP(tenantId, email, otp) {
  return apiFetch('/api/v1/guest-bookings/otp/verify/', tenantId, {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

/**
 * Get bookings by email (guest access)
 */
export async function getGuestBookings(tenantId, token) {
  return apiFetch('/api/v1/guest-bookings/by-email/', tenantId, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",

  });
}

export default {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  restoreBooking,
  updateBookingStatus,
  cancelBooking,
  initiatePayment,
  confirmPayment,
  uploadBookingFile,
  getBookingFiles,
  submitReview,
  getBookingSlots,
  getDashboardOverview,
  getDashboardRevenue,
  getRecentBookings,
  sendGuestOTP,
  verifyGuestOTP,
  getGuestBookings,
};