// src/app/dashboard/bookings/hooks/useBookings.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  getBookings,
  getBooking,
  createBooking as createBookingApi,
  updateBooking as updateBookingApi,
  updateBookingStatus,
  cancelBooking as cancelBookingApi,
  deleteBooking as deleteBookingApi,
  getBookingSlots,
} from '../lib/api/bookings';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for managing bookings state and operations
 */
export default function useBookings(initialFilters = {}) {
  const { t, activeTenant } = useApp();
  // Handle both object and string tenant ID
  const tenantId = activeTenant?.id || activeTenant;

  // State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    serviceId: '',
    providerId: '',
    dateFrom: '',
    dateTo: '',
    ...initialFilters,
  });

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pagination.page,
      };

      // Add active filters
      if (filters.search) params.search = filters.search;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.serviceId) params.service = filters.serviceId;

      const data = await getBookings(tenantId, params);

      // Handle both paginated and non-paginated responses
      if (data.results) {
        console.log(data,"ADADADA")
        setBookings(data.results);
        setPagination({
          page: pagination.page,
          totalPages: Math.ceil(data.count / 10),
          totalCount: data.count,
        });
      } else if (Array.isArray(data)) {
        setBookings(data);
        setPagination({
          page: 1,
          totalPages: 1,
          totalCount: data.length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError(t('bookings.error.load') || 'Failed to load bookings');
      toast.error(t('bookings.error.load') || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters, pagination.page, t]);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Create booking
  const createBooking = useCallback(
    async (bookingData) => {
      if (!tenantId) throw new Error('Tenant not ready');

      try {
        const newBooking = await createBookingApi(tenantId, bookingData);
        setBookings((prev) => [newBooking, ...prev]);
        toast.success(t('bookings.notification.created') || 'Booking created');
        return newBooking;
      } catch (err) {
        console.error('Failed to create booking:', err);
        toast.error(err.message || t('bookings.modal.create.error') || 'Failed to create booking');
        throw err;
      }
    },
    [tenantId, t]
  );

  // Update booking
  const updateBooking = useCallback(
    async (id, data) => {
      if (!tenantId) throw new Error('Tenant not ready');
   
      try {
        const updated = await updateBookingApi(tenantId, id, data);
        setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
        toast.success(t('bookings.notification.updated') || 'Booking updated');
        return updated;
      } catch (err) {
        console.error('Failed to update booking:', err);
        toast.error(toast.error(err.message) || t('bookings.error.update') || 'Failed to update booking');
        throw err;
      }
    },
    [tenantId, t]
  );

  // Update status
  const updateStatus = useCallback(
    async (id, status, notes = '') => {
      if (!tenantId) throw new Error('Tenant not ready');

      try {
        const updated = await updateBookingStatus(tenantId, id, status, notes);
        setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));

        // Show appropriate notification
        if (status === 'confirmed') {
          toast.success(t('bookings.notification.confirmed') || 'Booking confirmed');
        } else if (status === 'completed') {
          toast.success(t('bookings.notification.completed') || 'Booking completed');
        } else {
          toast.success(t('bookings.notification.updated') || 'Status updated');
        }

        return updated;
      } catch (err) {
        console.error('Failed to update status:', err);
        toast.error(err.message || t('bookings.error.update') || 'Failed to update status');
        throw err;
      }
    },
    [tenantId, t]
  );

  // Cancel booking
  const cancelBooking = useCallback(
    async (id, reason, refundRequested = false) => {
      if (!tenantId) throw new Error('Tenant not ready');

      try {
        const updated = await cancelBookingApi(tenantId, id, reason, refundRequested);
        setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
        toast.success(t('bookings.notification.cancelled') || 'Booking cancelled');
        return updated;
      } catch (err) {
        console.error('Failed to cancel booking:', err);
        toast.error(err.message || t('bookings.error.update') || 'Failed to cancel booking');
        throw err;
      }
    },
    [tenantId, t]
  );

  // Delete booking
  const deleteBooking = useCallback(
    async (id) => {
      if (!tenantId) throw new Error('Tenant not ready');

      try {
        await deleteBookingApi(tenantId, id);
        setBookings((prev) => prev.filter((b) => b.id !== id));
        toast.success(t('bookings.notification.deleted') || 'Booking deleted');
      } catch (err) {
        console.error('Failed to delete booking:', err);
        toast.error(t('bookings.error.delete') || 'Failed to delete booking');
        throw err;
      }
    },
    [tenantId, t]
  );

  // Compute stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(
      (b) => b.status === 'pending' || b.status === 'pending_payment'
    ).length;
    const confirmed = bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'scheduled'
    ).length;
    const inProgress = bookings.filter((b) => b.status === 'in_progress').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

    const revenue = bookings
      .filter((b) => b.status === 'completed' || b.status === 'paid')
      .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

    return {
      total,
      pending,
      confirmed,
      inProgress,
      completed,
      cancelled,
      revenue,
    };
  }, [bookings]);

  // Filter bookings locally
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          booking.booking_number?.toLowerCase().includes(searchLower) ||
          booking.customer?.full_name?.toLowerCase().includes(searchLower) ||
          booking.customer_name?.toLowerCase().includes(searchLower) ||
          booking.service_name?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && booking.status !== filters.status) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus !== 'all') {
        const isPaid = booking.is_fully_paid;
        const isPartial = booking.is_deposit_paid && !booking.is_fully_paid;

        if (filters.paymentStatus === 'paid' && !isPaid) return false;
        if (filters.paymentStatus === 'unpaid' && (isPaid || isPartial)) return false;
        if (filters.paymentStatus === 'partial' && !isPartial) return false;
      }

      return true;
    });
  }, [bookings, filters]);

  return {
    // Data
    bookings: filteredBookings,
    allBookings: bookings,
    stats,
    loading,
    error,
    pagination,

    // Filters
    filters,
    setFilters,
    updateFilter: (key, value) => setFilters((prev) => ({ ...prev, [key]: value })),
    clearFilters: () =>
      setFilters({
        search: '',
        status: 'all',
        paymentStatus: 'all',
        serviceId: '',
        providerId: '',
        dateFrom: '',
        dateTo: '',
      }),

    // Actions
    fetchBookings,
    createBooking,
    updateBooking,
    updateStatus,
    cancelBooking,
    deleteBooking,

    // Pagination
    setPage: (page) => setPagination((prev) => ({ ...prev, page })),
  };
}

/**
 * Hook for fetching available booking slots
 */
export function useBookingSlots(serviceId, date, providerId = null) {
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId || !serviceId || !date) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getBookingSlots(tenantId, serviceId, date, providerId);
        setSlots(data.slots || []);
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        setError(err.message);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [tenantId, serviceId, date, providerId]);

  return { slots, loading, error };
}

/**
 * Hook for single booking details
 */
export function useBookingDetails(bookingId) {
  const { t, activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tenantId || !bookingId) {
      setBooking(null);
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getBooking(tenantId, bookingId);
        setBooking(data);
      } catch (err) {
        console.error('Failed to fetch booking:', err);
        setError(t('bookings.error.load') || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [tenantId, bookingId, t]);

  const refresh = useCallback(async () => {
    if (!tenantId || !bookingId) return;

    try {
      const data = await getBooking(tenantId, bookingId);
      setBooking(data);
    } catch (err) {
      console.error('Failed to refresh booking:', err);
    }
  }, [tenantId, bookingId]);

  return { booking, loading, error, refresh };
}