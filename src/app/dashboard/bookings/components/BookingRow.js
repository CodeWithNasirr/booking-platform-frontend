// src/app/dashboard/bookings/components/BookingRow.js
'use client';

import { useApp } from '@/contexts/AppContext';
import { MessageSquare } from 'lucide-react';
import StatusPill from '@/components/ui/StatusPill';
import Badge from '@/components/ui/Badge';
import BookingActionsMenu from './BookingActionsMenu';
import {
  getStatusMeta,
  getPaymentMeta,
  getInitials,
  getCustomerName,
  getCustomerEmail,
  getProviderName,
  getServiceName,
  getUnreadCount,
  makeFormatters,
} from './bookingPresentation';

/**
 * Desktop premium table row. Primary info is strong, secondary info is
 * muted; status/payment use semantic badges; row hover is subtle.
 */
export default function BookingRow({
  hasAnyAction,
  booking,
  menuOpenId,
  setMenuOpenId,
  onView,
  onEdit,
  onStatusChange,
  onCancel,
  onDelete,
}) {
  const { t, isRTL } = useApp();
  const status = booking.status || 'pending';
  const { tone, Icon, label } = getStatusMeta(status, t);
  const payment = getPaymentMeta(booking, t);
  const { formatCurrency, formatDate, formatTime } = makeFormatters(isRTL, booking.currency || 'USD');
  const unread = getUnreadCount(booking);

  const durationText = booking.duration_minutes
    ? `${booking.duration_minutes} ${t('bookings.time.minutes') || 'min'}`
    : '';

  return (
    <tr className="group hover:bg-muted/40 transition-colors">
      {/* Booking */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <button
          type="button"
          onClick={() => onView(booking)}
          className="flex items-center gap-2 text-start"
        >
          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {booking.booking_number}
          </span>
          {unread > 0 && (
            <span className="inline-flex items-center gap-1 text-primary" title={String(unread)}>
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </span>
          )}
        </button>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatDate(booking.created_at)}
        </div>
      </td>

      {/* Customer */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold shrink-0">
            {getInitials(getCustomerName(booking))}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate max-w-[180px]">
              {getCustomerName(booking)}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
              {getCustomerEmail(booking) || '-'}
            </div>
          </div>
        </div>
      </td>

      {/* Service */}
      <td className="px-4 py-3.5 align-middle">
        <div className="font-medium text-foreground truncate max-w-[200px]">
          {getServiceName(booking)}
        </div>
        <div className="text-xs text-muted-foreground">
          {durationText}
          {durationText && ' · '}
          <span className="tabular-nums">{formatCurrency(booking.total_amount)}</span>
        </div>
      </td>

      {/* Provider */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <div className="text-sm text-foreground truncate max-w-[160px]">
          {getProviderName(booking)}
        </div>
      </td>

      {/* Date & Time */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <div className="text-sm font-medium text-foreground">
          {formatDate(booking.scheduled_date)}
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTime(booking.scheduled_time)}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <StatusPill
          tone={tone}
          size="md"
          label={
            <span className="inline-flex items-center gap-1">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          }
        />
      </td>

      {/* Payment */}
      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
        <Badge variant={payment.tone}>{payment.label}</Badge>
      </td>

      {/* Actions */}
      <td className={`px-4 py-3.5 align-middle whitespace-nowrap ${isRTL ? 'text-start' : 'text-end'}`}>
        <BookingActionsMenu
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
      </td>
    </tr>
  );
}
