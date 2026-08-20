// Shared presentation helpers for the Orders list (desktop table +
// mobile cards). Reuses the canonical order status config so tones/labels
// stay consistent with the rest of the order surfaces; adds a derived
// payment state, formatters and a localized "last activity" helper.
'use client';

import { ORDER_STATUS_TONE, ORDER_STATUS_LABEL } from '@/components/orders/statusConfig';

export { ORDER_STATUS_TONE, ORDER_STATUS_LABEL };

// Statuses considered "active" work-in-flight for the KPI row.
export const ACTIVE_STATUSES = ['paid', 'accepted', 'pending_assignment', 'in_progress', 'delivered'];
// Statuses that count toward revenue (unchanged from the previous page).
export const REVENUE_STATUSES = ['paid', 'in_progress', 'delivered', 'completed'];

/** Derive a payment state from amount_paid / status (no new API field). */
export function getPaymentState(order, t) {
  const L = (k, fb) => t?.(`orders.payment.${k}`) || fb;
  if (order.status === 'refunded') return { tone: 'neutral', label: L('refunded', 'Refunded') };

  const total = parseFloat(order.total_amount || 0);
  const paid = order.amount_paid != null ? parseFloat(order.amount_paid) : null;
  if (paid != null && !Number.isNaN(paid)) {
    if (total > 0 && paid >= total) return { tone: 'soft-success', label: L('paid', 'Paid') };
    if (paid > 0) return { tone: 'soft-warning', label: L('partial', 'Partial') };
    return { tone: 'soft-danger', label: L('unpaid', 'Unpaid') };
  }
  // Fallback by status when amount_paid isn't present on the row.
  if (['paid', 'accepted', 'in_progress', 'delivered', 'completed'].includes(order.status)) {
    return { tone: 'soft-success', label: L('paid', 'Paid') };
  }
  if (order.status === 'pending_payment') return { tone: 'soft-danger', label: L('unpaid', 'Unpaid') };
  return { tone: 'neutral', label: '—' };
}

export function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getUnreadCount(order) {
  return order.unread_count ?? 0;
}

export function makeFormatters(isRTL, currency = 'USD') {
  const locale = isRTL ? 'ar-SA' : 'en-US';
  return {
    money: (amount) =>
      new Intl.NumberFormat(locale, { style: 'currency', currency }).format(parseFloat(amount || 0)),
    date: (s) => {
      if (!s) return '-';
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? '-'
        : new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
    },
  };
}

// Localized relative "last activity" — uses updated_at, falls back to
// created_at. Intl.RelativeTimeFormat keeps it locale-aware (incl. RTL).
export function lastActivity(order, isRTL) {
  const s = order.updated_at || order.created_at;
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = d.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(isRTL ? 'ar' : 'en', { numeric: 'auto' });
  const abs = Math.abs(diffMs);
  const min = 60 * 1000, hour = 60 * min, day = 24 * hour;
  if (abs < hour) return rtf.format(Math.round(diffMs / min), 'minute');
  if (abs < day) return rtf.format(Math.round(diffMs / hour), 'hour');
  if (abs < 30 * day) return rtf.format(Math.round(diffMs / day), 'day');
  return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }).format(d);
}
