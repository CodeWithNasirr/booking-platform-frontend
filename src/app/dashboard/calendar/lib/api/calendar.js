// src/app/dashboard/calendar/lib/api/calendar.js
import { authFetch } from ".";
import { apiFetch } from "@/lib/apiClient";
/**
 * Calendar API Service
 * Connects to Django backend calendar endpoints
 */

// =====================
// CALENDAR BOOKINGS
// =====================

/**
 * Fetch bookings for calendar view
 * @param {string} tenantId - Tenant UUID
 * @param {Object} params - Query parameters
 * @param {string} params.start - Start date (YYYY-MM-DD)
 * @param {string} params.end - End date (YYYY-MM-DD)
 * @param {string} params.provider - Provider UUID or 'all'
 * @param {string} params.view - 'day' | 'week' | 'month'
 */
export async function getCalendarBookings(tenantId, params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.start) queryParams.append('start', params.start);
  if (params.end) queryParams.append('end', params.end);
  if (params.provider) queryParams.append('provider', params.provider);
  if (params.view) queryParams.append('view', params.view);
  
  const query = queryParams.toString();
  const url = query ? `/api/v1/calendar/bookings/?${query}` : '/api/v1/calendar/bookings/';
  
  return apiFetch(url, tenantId);
}

/**
 * Get providers for calendar filter
 */
export async function getCalendarProviders(tenantId) {
  return apiFetch('/api/v1/calendar/providers/', tenantId);
}

/**
 * Get calendar statistics
 */
export async function getCalendarStats(tenantId) {
  return apiFetch('/api/v1/calendar/stats/', tenantId);
}

/**
 * Get today's schedule
 * @param {string} tenantId - Tenant UUID
 * @param {string} providerId - Optional provider filter
 */
export async function getTodaySchedule(tenantId, providerId = null) {
  const url = providerId && providerId !== 'all' 
    ? `/api/v1/calendar/today/?provider=${providerId}`
    : '/api/v1/calendar/today/';
  
  return apiFetch(url, tenantId);
}

// =====================
// DATE UTILITIES
// =====================

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateForAPI(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date range for a view mode
 * @param {Date} date - Reference date
 * @param {string} viewMode - 'day' | 'week' | 'month'
 * @returns {{ start: string, end: string }}
 */
export function getDateRangeForView(date, viewMode) {
  const d = new Date(date);
  let start, end;
  
  switch (viewMode) {
    case 'day':
      start = new Date(d);
      end = new Date(d);
      break;
      
    case 'week':
      // Get Monday of the week
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      start = new Date(d.setDate(diff));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      break;
      
    case 'month':
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      break;
      
    default:
      start = new Date(d);
      end = new Date(d);
  }
  
  return {
    start: formatDateForAPI(start),
    end: formatDateForAPI(end)
  };
}

/**
 * Get week dates starting from Monday
 * @param {Date} date - Any date in the week
 * @returns {Array<{ date: number, day: string, fullDate: Date, isToday: boolean, dateStr: string }>}
 */
export function getWeekDates(date) {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const curr = new Date(date);
  const dayOfWeek = curr.getDay();
  const diff = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(curr);
    d.setDate(diff + i);
    return {
      date: d.getDate(),
      day: daysOfWeek[i],
      fullDate: new Date(d),
      isToday: d.toDateString() === new Date().toDateString(),
      dateStr: formatDateForAPI(d)
    };
  });
}

/**
 * Get month calendar grid (includes padding days from prev/next months)
 * @param {Date} date - Any date in the month
 * @returns {Array<{ date: number, isCurrentMonth: boolean, isToday: boolean, fullDate: Date, dateStr: string }>}
 */
export function getMonthDates(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();
  
  // First day of month
  const firstDay = new Date(year, month, 1);
  // Last day of month
  const lastDay = new Date(year, month + 1, 0);
  
  // Day of week for first day (0=Sun, 1=Mon, etc.)
  let firstDayOfWeek = firstDay.getDay();
  // Adjust for Monday start (0=Mon, 6=Sun)
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  const days = [];
  
  // Add padding days from previous month
  const prevMonth = new Date(year, month, 0);
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonth.getDate() - i);
    days.push({
      date: d.getDate(),
      isCurrentMonth: false,
      isToday: false,
      fullDate: d,
      dateStr: formatDateForAPI(d)
    });
  }
  
  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({
      date: i,
      isCurrentMonth: true,
      isToday: d.toDateString() === today.toDateString(),
      fullDate: d,
      dateStr: formatDateForAPI(d)
    });
  }
  
  // Add padding days from next month
  const remainingDays = 42 - days.length; // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      fullDate: d,
      dateStr: formatDateForAPI(d)
    });
  }
  
  return days;
}

/**
 * Parse time string to minutes from midnight
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {number} Minutes from midnight
 */
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calculate booking position and height for day/week view
 * @param {Object} booking - Booking object with start_time, end_time
 * @param {number} startHour - First hour displayed (e.g., 9 for 9 AM)
 * @param {number} hourHeight - Height in pixels per hour
 * @returns {{ top: number, height: number }}
 */
export function calculateBookingPosition(booking, startHour = 9, hourHeight = 80) {
  const startMinutes = parseTimeToMinutes(booking.start_time);
  const endMinutes = booking.end_time 
    ? parseTimeToMinutes(booking.end_time)
    : startMinutes + (booking.duration_minutes || 60);
  
  const startOffset = startMinutes - (startHour * 60);
  const duration = endMinutes - startMinutes;
  
  return {
    top: (startOffset / 60) * hourHeight,
    height: Math.max((duration / 60) * hourHeight, 30) // Minimum 30px height
  };
}

export default {
  getCalendarBookings,
  getCalendarProviders,
  getCalendarStats,
  getTodaySchedule,
  formatDateForAPI,
  getDateRangeForView,
  getWeekDates,
  getMonthDates,
  parseTimeToMinutes,
  calculateBookingPosition,
};