// src/app/dashboard/bookings/components/BookingCard.js
'use client';

import { useApp } from '@/contexts/AppContext';
import { Clock, User, ChevronRight, MessageSquare } from 'lucide-react';
import StatusPill from '@/components/ui/StatusPill';
import Badge from '@/components/ui/Badge';
import BookingActionsMenu from './BookingActionsMenu';
import {
  getStatusMeta,
  getPaymentMeta,
  getInitials,
  getCustomerName,
  getProviderName,
  getServiceName,
  getUnreadCount,
  makeFormatters,
} from './bookingPresentation';

/**
 * Mobile booking card (shown below md). Replaces the cramped desktop
 * table on 360–414px screens with a scannable card: service + booking
 * number, customer, date/time, provider, status, payment/amount, an
 * unread indicator and a clear open action.
 */
export default function BookingCard({
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

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {/* Header: service + status + menu */}
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={() => onView(booking)} className="min-w-0 text-start">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">
              {getServiceName(booking)}
            </span>
            {unread > 0 && (
              <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {booking.booking_number}
          </div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <StatusPill
            tone={tone}
            size="sm"
            label={
              <span className="inline-flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {label}
              </span>
            }
          />
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
        </div>
      </div>

      {/* Customer */}
      <div className="mt-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold shrink-0">
          {getInitials(getCustomerName(booking))}
        </div>
        <div className="text-sm font-medium text-foreground truncate">
          {getCustomerName(booking)}
        </div>
      </div>

      {/* Meta grid: date/time, provider */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Clock className="w-4 h-4 shrink-0" />
          <span className="truncate text-foreground">
            {formatDate(booking.scheduled_date)}
            <span className="text-muted-foreground"> · {formatTime(booking.scheduled_time)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <User className="w-4 h-4 shrink-0" />
          <span className="truncate text-foreground">{getProviderName(booking)}</span>
        </div>
      </div>

      {/* Footer: payment + amount + open */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={payment.tone}>{payment.label}</Badge>
          <span className="text-sm font-semibold text-foreground tabular-nums">
            {formatCurrency(booking.total_amount)}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onView(booking)}
          className="inline-flex items-center gap-0.5 text-sm font-medium text-primary min-h-[44px] px-1"
        >
          {t('bookings.actions.view') || 'View'}
          <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}
