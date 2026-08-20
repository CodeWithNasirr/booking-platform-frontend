// src/app/dashboard/bookings/BookingsPage.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';

import useBookings from './hooks/useBookings';
import BookingStats from './components/BookingStats';
import BookingFilters from './components/BookingFilters';
import BookingsList from './components/BookingsList';

import NewBookingModal from './NewBookingModal';
import { useTenantPermission } from '@/lib/useTenantPermission';

import ViewBookingModal from './ViewBookingModal';
import CancelBookingModal from './CancelBookingModal';
import EditBookingModal from './EditBookingModal';

import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

import {
  Plus,
  Calendar as CalendarIcon,
  AlertCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function BookingsPage() {
  const { user, loadingUser, requiresOnboarding, t } = useApp();
  const router = useRouter();

  // Booking state management
  const {
    bookings,
    stats,
    loading,
    error,
    filters,
    updateFilter,
    clearFilters,
    fetchBookings,
    createBooking,
    updateStatus,
    updateBooking,
    cancelBooking,
    deleteBooking,
  } = useBookings();

  // Modal states
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);

  const { allowed: canCreate } = useTenantPermission('bookings.create');
  const { allowed: canViewCalendar } = useTenantPermission('calendar.view');
  const { allowed: canEdit } = useTenantPermission('bookings.edit');
  const { allowed: canDelete } = useTenantPermission('bookings.delete');
  const { allowed: canView } = useTenantPermission('bookings.view');

  const hasAnyAction = canEdit || canDelete || canCreate;

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== 'all' ||
    filters.paymentStatus !== 'all';

  // Auth guard
  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace('/');
    }
  }, [loadingUser, user, router]);

  // Onboarding redirect
  useEffect(() => {
    if (requiresOnboarding) {
      router.replace('/auth/onboarding?step=1');
    }
  }, [requiresOnboarding, router]);

  // Handlers (unchanged behaviour)
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateStatus(bookingId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleCancel = async (bookingId, reason, refundRequested) => {
    if (!canEdit) return;
    try {
      await cancelBooking(bookingId, reason, refundRequested);
      setCancellingBooking(null);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  const handleDelete = async (bookingId) => {
    if (!canDelete) return;
    if (!confirm(t('bookings.confirm.delete'))) return;
    try {
      await deleteBooking(bookingId);
    } catch (err) {
      console.error('Failed to delete booking:', err);
    }
  };

  const handleCreate = async (bookingData) => {
    try {
      await createBooking(bookingData);
      setShowNewBooking(false);
    } catch (err) {
      console.error('Failed to create booking:', err);
    }
  };

  const handleEditSave = async (updateData) => {
    if (!editingBooking) return;
    try {
      await updateBooking(editingBooking.id, updateData);
      setEditingBooking(null);
    } catch (err) {
      console.error('Failed to update booking:', err);
    }
  };

  const handleEditOpen = (booking) => {
    if (!canEdit) return;
    setEditingBooking(booking);
  };

  // Loading state (auth/onboarding)
  if (loadingUser || requiresOnboarding) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <p className="text-base font-semibold text-foreground">
          {t('bookings.noPermission') || "You don't have permission to view bookings"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {t('bookings.title')}
            </h1>
            <span className="inline-flex items-center px-2 h-6 rounded-full bg-muted text-muted-foreground text-xs font-semibold tabular-nums">
              {stats.total ?? 0}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t('bookings.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canViewCalendar && (
            <Button
              variant="secondary"
              size="md"
              leftIcon={<CalendarIcon className="w-4 h-4" />}
              onClick={() => router.push('/dashboard/calendar')}
            >
              {t('bookings.calendarView')}
            </Button>
          )}
          {canCreate && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowNewBooking(true)}
            >
              {t('bookings.newBooking')}
            </Button>
          )}
        </div>
      </header>

      {/* KPI row */}
      <BookingStats stats={stats} />

      {/* Toolbar */}
      <BookingFilters
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        onRefresh={fetchBookings}
      />

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-danger shrink-0" />
            <p className="text-sm text-danger-soft-foreground">{error}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchBookings}
          >
            {t('bookings.error.retry')}
          </Button>
        </div>
      )}

      {/* List */}
      <BookingsList
        hasAnyAction={hasAnyAction}
        bookings={bookings}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        onView={setViewingBooking}
        onEdit={handleEditOpen}
        onStatusChange={handleStatusChange}
        onCancel={setCancellingBooking}
        onDelete={handleDelete}
      />

      {/* New Booking Modal */}
      {canCreate && showNewBooking && (
        <NewBookingModal
          onSave={handleCreate}
          onClose={() => setShowNewBooking(false)}
        />
      )}

      {/* View Booking Modal */}
      {viewingBooking && (
        <ViewBookingModal
          booking={viewingBooking}
          onClose={() => setViewingBooking(null)}
          onStatusChange={handleStatusChange}
          onCancel={() => {
            setCancellingBooking(viewingBooking);
            setViewingBooking(null);
          }}
        />
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onSave={handleEditSave}
          onClose={() => setEditingBooking(null)}
        />
      )}

      {/* Cancel Booking Modal */}
      {cancellingBooking && (
        <CancelBookingModal
          booking={cancellingBooking}
          onConfirm={handleCancel}
          onClose={() => setCancellingBooking(null)}
        />
      )}
    </div>
  );
}
