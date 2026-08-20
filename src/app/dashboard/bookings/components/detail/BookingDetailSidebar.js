'use client';

import { useApp } from '@/contexts/AppContext';
import {
  User, Briefcase, CalendarClock, MapPin, Receipt, Mail, Phone,
  Clock, ExternalLink, Video, Hash,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import {
  getStatusMeta, getPaymentMeta, getInitials, getServiceName,
} from '../bookingPresentation';

const STATUS_BADGE = {
  success: 'soft-success',
  warning: 'soft-warning',
  danger: 'soft-danger',
  info: 'soft-info',
  brand: 'soft-brand',
  neutral: 'neutral',
};

function Section({ icon: Icon, title, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children, strong = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-end ${strong ? 'font-semibold text-foreground' : 'text-foreground'} tabular-nums`}>
        {children}
      </span>
    </div>
  );
}

export default function BookingDetailSidebar({ booking, callSlot, actionsSlot }) {
  const { t, isRTL } = useApp();
  const currency = booking.currency || 'USD';
  const locale = isRTL ? 'ar-SA' : 'en-US';

  const fmtMoney = (a) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(a || 0);
  const fmtDate = (s) => {
    if (!s) return '-';
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? '-'
      : new Intl.DateTimeFormat(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(d);
  };
  const fmtTime = (s) => {
    if (!s) return '-';
    const [h, m] = String(s).split(':');
    const d = new Date(); d.setHours(parseInt(h, 10), parseInt(m || '0', 10));
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
  };

  const statusMeta = getStatusMeta(booking.status || 'pending', t);
  const payMeta = getPaymentMeta(booking, t);

  const customer = {
    name: booking.customer_name || booking.customer?.full_name || '-',
    email: booking.customer_email || '',
    phone: booking.customer_phone || '',
  };
  const providerName = booking.provider_name || booking.provider?.name || '-';

  return (
    <div className="space-y-4">
      {/* Call controls + status/actions */}
      {(callSlot || actionsSlot) && (
        <Section icon={Video} title={t('bookings.detail.callControls')}>
          {callSlot}
          {actionsSlot && <div className="mt-3">{actionsSlot}</div>}
        </Section>
      )}

      {/* Summary */}
      <Section icon={Hash} title={t('bookings.detail.summary')}>
        <Row label={t('bookings.modal.view.bookingNumber')} strong>
          {booking.booking_number}
        </Row>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant={STATUS_BADGE[statusMeta.tone] || 'neutral'} className="gap-1">
            <statusMeta.Icon className="w-3 h-3" />{statusMeta.label}
          </Badge>
          <Badge variant={payMeta.tone}>{payMeta.label}</Badge>
        </div>
      </Section>

      {/* Customer */}
      <Section icon={User} title={t('bookings.modal.view.customer')}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(customer.name)}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-foreground truncate">{customer.name}</p>
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{customer.email}</span>
              </a>
            )}
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 shrink-0" />{customer.phone}
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* Provider */}
      <Section icon={Briefcase} title={t('bookings.modal.view.serviceProvider')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(providerName)}
          </div>
          <p className="font-medium text-foreground truncate">{providerName}</p>
        </div>
      </Section>

      {/* Service + Date/time */}
      <Section icon={CalendarClock} title={t('bookings.modal.view.serviceDetails')}>
        <p className="font-medium text-foreground">{getServiceName(booking)}</p>
        <div className="mt-2 space-y-1">
          {booking.duration_minutes ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />{booking.duration_minutes} {t('bookings.time.minutes')}
            </div>
          ) : null}
          <Row label={t('bookings.modal.view.date')}>{fmtDate(booking.scheduled_date)}</Row>
          <Row label={t('bookings.modal.view.time')}>{fmtTime(booking.scheduled_time)}</Row>
        </div>
      </Section>

      {/* Location / meeting */}
      <Section icon={MapPin} title={t('bookings.detail.location')}>
        {booking.meeting_url ? (
          <a
            href={booking.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            {booking.meeting_provider || t('bookings.detail.join')}
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">{t('bookings.detail.online')}</p>
        )}
      </Section>

      {/* Payment summary */}
      <Section icon={Receipt} title={t('bookings.modal.view.payments')}>
        <Row label="Subtotal">{fmtMoney(booking.subtotal)}</Row>
        {booking.addons_total > 0 && <Row label="Add-ons">{fmtMoney(booking.addons_total)}</Row>}
        {booking.discount_amount > 0 && (
          <div className="flex items-baseline justify-between gap-3 py-1">
            <span className="text-sm text-muted-foreground">Discount</span>
            <span className="text-sm text-success tabular-nums">-{fmtMoney(booking.discount_amount)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3 py-2 mt-1 border-t border-border">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold text-foreground tabular-nums">{fmtMoney(booking.total_amount)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-1">
          <span className="text-sm text-muted-foreground">Amount Paid</span>
          <span className="text-sm text-success tabular-nums">{fmtMoney(booking.amount_paid)}</span>
        </div>
        {booking.amount_remaining > 0 && (
          <div className="flex items-baseline justify-between gap-3 py-1">
            <span className="text-sm text-muted-foreground">Amount Remaining</span>
            <span className="text-sm text-danger tabular-nums">{fmtMoney(booking.amount_remaining)}</span>
          </div>
        )}
      </Section>

      {/* Notes */}
      {booking.customer_notes && (
        <Section icon={User} title={t('bookings.modal.view.notes')}>
          <p className="text-sm text-foreground whitespace-pre-wrap">{booking.customer_notes}</p>
        </Section>
      )}
    </div>
  );
}
