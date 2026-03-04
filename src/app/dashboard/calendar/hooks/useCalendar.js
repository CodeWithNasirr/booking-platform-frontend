// src/app/dashboard/calendar/hooks/useCalendar.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  getCalendarBookings,
  getCalendarProviders,
  getCalendarStats,
  getTodaySchedule,
  getDateRangeForView,
  getWeekDates,
  getMonthDates,
  formatDateForAPI,
} from '../lib/api/calendar';

/**
 * Custom hook for calendar state management and data fetching
 */
export function useCalendar() {
  const { activeTenant } = useApp();
  const tenantId = activeTenant;

  // View state
  const [viewMode, setViewMode] = useState('week'); // 'day' | 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProvider, setSelectedProvider] = useState('all');

  // Data state
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [stats, setStats] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);

  // Loading states
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingToday, setLoadingToday] = useState(false);

  // Error states
  const [error, setError] = useState(null);

  // Computed date range based on view mode
  const dateRange = useMemo(() => {
    return getDateRangeForView(selectedDate, viewMode);
  }, [selectedDate, viewMode]);

  // Computed week dates for week view
  const weekDates = useMemo(() => {
    return getWeekDates(selectedDate);
  }, [selectedDate]);

  // Computed month dates for month view
  const monthDates = useMemo(() => {
    return getMonthDates(selectedDate);
  }, [selectedDate]);

  // Group bookings by date for easier rendering
  const bookingsByDate = useMemo(() => {
    const grouped = {};
    bookings.forEach((booking) => {
      if (booking.date) {
        if (!grouped[booking.date]) {
          grouped[booking.date] = [];
        }
        grouped[booking.date].push(booking);
      }
    });
    return grouped;
  }, [bookings]);

  // Group bookings by hour for day view
  const bookingsByHour = useMemo(() => {
    const grouped = {};
    const todayStr = formatDateForAPI(selectedDate);
    const todayBookings = bookingsByDate[todayStr] || [];
    
    todayBookings.forEach((booking) => {
      if (booking.start_time) {
        const hour = parseInt(booking.start_time.split(':')[0], 10);
        if (!grouped[hour]) {
          grouped[hour] = [];
        }
        grouped[hour].push(booking);
      }
    });
    return grouped;
  }, [bookingsByDate, selectedDate]);

  // Fetch calendar bookings
  const fetchBookings = useCallback(async () => {
    if (!tenantId) return;

    setLoadingBookings(true);
    setError(null);

    try {
      const response = await getCalendarBookings(tenantId, {
        start: dateRange.start,
        end: dateRange.end,
        provider: selectedProvider,
        view: viewMode,
      });
      setBookings(response.bookings || []);
    } catch (err) {
      console.error('Failed to fetch calendar bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [tenantId, dateRange.start, dateRange.end, selectedProvider, viewMode]);

  // Fetch providers for filter
  const fetchProviders = useCallback(async () => {
    if (!tenantId) return;

    setLoadingProviders(true);

    try {
      const response = await getCalendarProviders(tenantId);
      setProviders(response || []);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setProviders([{ id: 'all', name: 'All Providers' }]);
    } finally {
      setLoadingProviders(false);
    }
  }, [tenantId]);

  // Fetch calendar stats
  const fetchStats = useCallback(async () => {
    if (!tenantId) return;

    setLoadingStats(true);

    try {
      const response = await getCalendarStats(tenantId);
      setStats(response);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [tenantId]);

  // Fetch today's schedule
  const fetchTodaySchedule = useCallback(async () => {
    if (!tenantId) return;

    setLoadingToday(true);

    try {
      const response = await getTodaySchedule(tenantId, selectedProvider);
      setTodaySchedule(response);
    } catch (err) {
      console.error('Failed to fetch today schedule:', err);
      setTodaySchedule(null);
    } finally {
      setLoadingToday(false);
    }
  }, [tenantId, selectedProvider]);

  // Navigation functions
  const navigateDate = useCallback(
    (direction) => {
      const newDate = new Date(selectedDate);

      if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
      } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      } else {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      }

      setSelectedDate(newDate);
    },
    [selectedDate, viewMode]
  );

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const goToDate = useCallback((date) => {
    setSelectedDate(new Date(date));
  }, []);

  // Refresh all data
  const refreshAll = useCallback(() => {
    fetchBookings();
    fetchStats();
    fetchTodaySchedule();
  }, [fetchBookings, fetchStats, fetchTodaySchedule]);

  // Initial data fetch
  useEffect(() => {
    if (tenantId) {
      fetchProviders();
    }
  }, [tenantId, fetchProviders]);

  // Fetch bookings when filters change
  useEffect(() => {
    if (tenantId) {
      fetchBookings();
    }
  }, [tenantId, dateRange.start, dateRange.end, selectedProvider, fetchBookings]);

  // Fetch stats and today schedule on mount and provider change
  useEffect(() => {
    if (tenantId) {
      fetchStats();
      fetchTodaySchedule();
    }
  }, [tenantId, selectedProvider, fetchStats, fetchTodaySchedule]);

  // Format display date based on view mode
  const formatDisplayDate = useCallback(() => {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };

    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('en-US', options);
    } else if (viewMode === 'week') {
      const weekStart = weekDates[0]?.fullDate;
      const weekEnd = weekDates[6]?.fullDate;
      if (weekStart && weekEnd) {
        const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
        const year = weekEnd.getFullYear();
        return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${year}`;
      }
    } else {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return selectedDate.toLocaleDateString('en-US', options);
  }, [selectedDate, viewMode, weekDates]);

  // Get bookings for a specific date
  const getBookingsForDate = useCallback(
    (dateStr) => {
      return bookingsByDate[dateStr] || [];
    },
    [bookingsByDate]
  );

  // Get bookings for a specific hour on the selected date
  const getBookingsForHour = useCallback(
    (hour) => {
      return bookingsByHour[hour] || [];
    },
    [bookingsByHour]
  );

  return {
    // State
    viewMode,
    selectedDate,
    selectedProvider,
    bookings,
    providers,
    stats,
    todaySchedule,

    // Loading states
    loadingBookings,
    loadingProviders,
    loadingStats,
    loadingToday,
    isLoading: loadingBookings || loadingProviders || loadingStats,

    // Error state
    error,

    // Computed values
    dateRange,
    weekDates,
    monthDates,
    bookingsByDate,
    bookingsByHour,
    displayDate: formatDisplayDate(),

    // Actions
    setViewMode,
    setSelectedDate,
    setSelectedProvider,
    navigateDate,
    goToToday,
    goToDate,
    refreshAll,

    // Data getters
    getBookingsForDate,
    getBookingsForHour,

    // Refetch functions
    fetchBookings,
    fetchProviders,
    fetchStats,
    fetchTodaySchedule,
  };
}

export default useCalendar;