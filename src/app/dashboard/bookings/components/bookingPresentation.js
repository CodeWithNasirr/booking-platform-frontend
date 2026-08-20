// Shared presentation helpers for the Booking List (desktop row +
// mobile card + actions menu). Centralises the status/payment → design
// token mapping, formatters and status-transition logic so there is a
// single source of truth and no duplicated colour systems.
'use client';

import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  RefreshCw,
} from 'lucide-react';

/**
 * Map a booking status onto a semantic StatusPill tone + icon.
 * Tones resolve to Phase-1 design tokens (no hard-coded colours).
 */
export function getStatusMeta(status, t) {
  const MAP = {
    draft:              { tone: 'neutral', icon: Clock,       key: 'bookings.status.draft',           fallback: 'Draft' },
    pending:            { tone: 'warning', icon: Clock,       key: 'bookings.status.pending',         fallback: 'Pending' },
    pending_payment:    { tone: 'warning', icon: Clock,       key: 'bookings.status.pendingPayment',  fallback: 'Pending Payment' },
    deposit_paid:       { tone: 'info',    icon: CheckCircle, key: 'bookings.status.depositPaid',     fallback: 'Deposit Paid' },
    paid:               { tone: 'success', icon: CheckCircle, key: 'bookings.status.paid',            fallback: 'Paid' },
    confirmed:          { tone: 'info',    icon: CheckCircle, key: 'bookings.status.confirmed',       fallback: 'Confirmed' },
    scheduled:          { tone: 'info',    icon: Calendar,    key: 'bookings.status.scheduled',       fallback: 'Scheduled' },
    in_progress:        { tone: 'brand',   icon: RefreshCw,   key: 'bookings.status.inProgress',      fallback: 'In Progress' },
    delivered:          { tone: 'success', icon: CheckCircle, key: 'bookings.status.delivered',       fallback: 'Delivered' },
    revision_requested: { tone: 'warning', icon: RefreshCw,   key: 'bookings.status.revisionRequested', fallback: 'Revision Requested' },
    completed:          { tone: 'success', icon: CheckCircle, key: 'bookings.status.completed',       fallback: 'Completed' },
    cancelled:          { tone: 'danger',  icon: XCircle,     key: 'bookings.status.cancelled',       fallback: 'Cancelled' },
    refunded:           { tone: 'neutral', icon: XCircle,     key: 'bookings.status.refunded',        fallback: 'Refunded' },
    disputed:           { tone: 'danger',  icon: XCircle,     key: 'bookings.status.disputed',        fallback: 'Disputed' },
    no_show:            { tone: 'neutral', icon: XCircle,     key: 'bookings.status.noShow',          fallback: 'No Show' },
  };
  const meta = MAP[status] || MAP.draft;
  return { tone: meta.tone, Icon: meta.icon, label: t(meta.key) || meta.fallback };
}

/**
 * Derive the payment status (identical logic to the previous row) and
 * map it to a Badge tone.
 */
export function getPaymentMeta(booking, t) {
  let key = 'unpaid';
  if (booking.is_fully_paid) key = 'paid';
  else if (booking.is_deposit_paid || booking.amount_paid > 0) key = 'partial';

  const MAP = {
    paid:     { tone: 'soft-success', label: t('bookings.payment.paid')     || 'Paid' },
    partial:  { tone: 'soft-warning', label: t('bookings.payment.partial')  || 'Partial' },
    unpaid:   { tone: 'soft-danger',  label: t('bookings.payment.unpaid')   || 'Unpaid' },
    refunded: { tone: 'neutral',      label: t('bookings.payment.refunded') || 'Refunded' },
    pending:  { tone: 'soft-warning', label: t('bookings.payment.pending')  || 'Pending' },
  };
  return MAP[key];
}

// Status transitions — unchanged from the previous BookingRow so the
// available actions (Schedule / Complete / Refund…) stay identical.
export function getAvailableTransitions(status) {
  const transitions = {
    draft: ['pending_payment'],
    pending_payment: ['paid'],
    paid: ['scheduled', 'refunded'],
    scheduled: ['completed'],
    completed: [],
    cancelled: ['refunded'],
    refunded: [],
  };
  return transitions[status] || [];
}

export function isBookingEditable(status) {
  return !['completed', 'cancelled', 'refunded'].includes(status);
}

export function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getCustomerName(b) {
  return b.customer_name || b.customer?.full_name || '-';
}
export function getCustomerEmail(b) {
  return b.customer_email || b.customer?.email || '';
}
export function getProviderName(b) {
  return b.provider_name || b.provider?.name || '-';
}
export function getServiceName(b) {
  if (b.service_name) return b.service_name;
  if (b.service?.name) {
    return typeof b.service.name === 'object'
      ? b.service.name.en || Object.values(b.service.name)[0]
      : b.service.name;
  }
  return '-';
}

// Unread messages indicator (only shows when the API supplies a count).
export function getUnreadCount(b) {
  return b.unread_count ?? b.unread_messages_count ?? (b.has_unread ? 1 : 0) ?? 0;
}

/** Locale-aware formatters bound to the current direction + currency. */
export function makeFormatters(isRTL, currency = 'USD') {
  const locale = isRTL ? 'ar-SA' : 'en-US';
  return {
    formatCurrency: (amount) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount || 0),
    formatDate: (dateStr) => {
      if (!dateStr) return '-';
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return '-';
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d);
    },
    formatTime: (timeStr) => {
      if (!timeStr) return '-';
      const [hours, minutes] = String(timeStr).split(':');
      const d = new Date();
      d.setHours(parseInt(hours, 10), parseInt(minutes || '0', 10));
      return new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    },
  };
}
