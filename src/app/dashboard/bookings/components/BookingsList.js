// src/app/dashboard/bookings/components/BookingsList.js
'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { CalendarX, SearchX } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import BookingRow from './BookingRow';
import BookingCard from './BookingCard';

const COLUMNS = [
  'booking', 'customer', 'service', 'provider', 'dateTime', 'status', 'payment',
];

function TableSkeleton({ rows = 6 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-border">
          {/* Booking */}
          <td className="px-4 py-3.5">
            <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-16 rounded bg-muted animate-pulse mt-2" />
          </td>
          {/* Customer */}
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div>
                <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-muted animate-pulse mt-2" />
              </div>
            </div>
          </td>
          {/* Service */}
          <td className="px-4 py-3.5">
            <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-20 rounded bg-muted animate-pulse mt-2" />
          </td>
          {/* Provider */}
          <td className="px-4 py-3.5">
            <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
          </td>
          {/* Date */}
          <td className="px-4 py-3.5">
            <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
            <div className="h-2.5 w-14 rounded bg-muted animate-pulse mt-2" />
          </td>
          {/* Status */}
          <td className="px-4 py-3.5">
            <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
          </td>
          {/* Payment */}
          <td className="px-4 py-3.5">
            <div className="h-5 w-16 rounded-md bg-muted animate-pulse" />
          </td>
          {/* Actions */}
          <td className="px-4 py-3.5">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse ms-auto" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
      </div>
      <div className="mt-3 h-px bg-border" />
      <div className="mt-3 flex items-center justify-between">
        <div className="h-5 w-16 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-12 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export default function BookingsList({
  hasAnyAction,
  bookings,
  loading,
  hasActiveFilters = false,
  onClearFilters,
  onView,
  onEdit,
  onStatusChange,
  onCancel,
  onDelete,
}) {
  const { t } = useApp();
  const [menuOpenId, setMenuOpenId] = useState(null);

  const Head = (
    <thead>
      <tr className="border-b border-border bg-muted/40">
        {COLUMNS.map((col) => (
          <th
            key={col}
            className="px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
          >
            {t(`bookings.table.${col}`)}
          </th>
        ))}
        <th className="px-4 py-3 text-end text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t('bookings.table.actions')}
        </th>
      </tr>
    </thead>
  );

  // Loading — skeletons matching the final structure
  if (loading) {
    return (
      <>
        <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {Head}
              <TableSkeleton />
            </table>
          </div>
        </div>
        <div className="md:hidden space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </>
    );
  }

  // Empty — differentiate "no results for filters" vs "no bookings yet"
  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        {hasActiveFilters ? (
          <EmptyState
            icon={SearchX}
            title={t('bookings.empty.filtered')}
            hint={t('bookings.empty.description')}
            action={
              onClearFilters ? (
                <Button variant="secondary" size="sm" onClick={onClearFilters}>
                  {t('bookings.empty.clearFilters')}
                </Button>
              ) : null
            }
          />
        ) : (
          <EmptyState
            icon={CalendarX}
            title={t('bookings.empty.title')}
            hint={t('bookings.empty.description')}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {Head}
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  hasAnyAction={hasAnyAction}
                  booking={booking}
                  menuOpenId={menuOpenId}
                  setMenuOpenId={setMenuOpenId}
                  onView={onView}
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
                  onCancel={onCancel}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            hasAnyAction={hasAnyAction}
            booking={booking}
            menuOpenId={menuOpenId}
            setMenuOpenId={setMenuOpenId}
            onView={onView}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
            onCancel={onCancel}
            onDelete={onDelete}
          />
        ))}
      </div>
    </>
  );
}
