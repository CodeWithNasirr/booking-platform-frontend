'use client';

import { useApp } from '@/contexts/AppContext';
import {
  User, Briefcase, Package, Truck, Receipt, Info, FileText, Mail, Phone, Video,
} from 'lucide-react';
import { Section, Row } from './ui';
import { getInitials, makeFormatters } from '../../components/orderPresentation';

export default function OrderSidebar({ order, callSlot, actionsSlot }) {
  const { t, isRTL } = useApp();
  const { money } = makeFormatters(isRTL, order.currency || 'USD');
  const locale = isRTL ? 'ar-SA' : 'en-US';
  const dt = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null
      : new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
  };

  const customer = order.customer_name_display || order.customer_name || '—';
  const provider = order.provider_name || t('orderDetail.waitingAssignment');
  const requirements = order.requirements && Object.keys(order.requirements).length > 0 ? order.requirements : null;

  return (
    <div className="space-y-4">
      {/* Call controls */}
      {callSlot && (
        <Section icon={Video} title={t('orderDetail.callControls')}>
          {callSlot}
        </Section>
      )}

      {/* Contextual actions */}
      {actionsSlot && (
        <Section icon={Info} title={t('orderDetail.actions')}>
          {actionsSlot}
        </Section>
      )}

      {/* Customer */}
      <Section icon={User} title={t('orderDetail.customer')}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(customer)}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-foreground truncate">{customer}</p>
            {order.customer_email && (
              <a href={`mailto:${order.customer_email}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{order.customer_email}</span>
              </a>
            )}
            {order.customer_phone && (
              <a href={`tel:${order.customer_phone}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 shrink-0" />{order.customer_phone}
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* Provider */}
      <Section icon={Briefcase} title={t('orderDetail.provider')}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(order.provider_name)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{provider}</p>
            {order.provider_email && <p className="text-xs text-muted-foreground truncate">{order.provider_email}</p>}
          </div>
        </div>
      </Section>

      {/* Service */}
      <Section icon={Package} title={t('orderDetail.service')}>
        <p className="font-medium text-foreground">{order.service_name || '—'}</p>
        {order.service_description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{order.service_description}</p>
        )}
      </Section>

      {/* Delivery information */}
      <Section icon={Truck} title={t('orderDetail.deliveryInfo')}>
        <Row label={t('orderDetail.delivery')}>{order.delivery_days ? `${order.delivery_days} ${t('orderDetail.days')}` : '—'}</Row>
        <Row label={t('orderDetail.revisions')}>{`${order.revisions_used || 0}/${order.revisions_allowed || 0}`}</Row>
        {dt(order.delivered_at) && <Row label={t('orderDetail.delivered')}>{dt(order.delivered_at)}</Row>}
        {dt(order.completed_at) && <Row label={t('orderDetail.completed')}>{dt(order.completed_at)}</Row>}
      </Section>

      {/* Pricing / payment */}
      <Section icon={Receipt} title={t('orderDetail.pricing')}>
        <Row label={t('orderDetail.subtotal')}>{money(order.subtotal || order.total_amount)}</Row>
        <Row label={t('orderDetail.platformFee')}>{money(order.platform_fee)}</Row>
        <Row label={t('orderDetail.providerEarning')} tone="success">{money(order.provider_earning)}</Row>
        <div className="flex items-baseline justify-between gap-3 py-2 mt-1 border-t border-border">
          <span className="font-semibold text-foreground">{t('orderDetail.total')}</span>
          <span className="font-bold text-foreground tabular-nums">{money(order.total_amount)}</span>
        </div>
      </Section>

      {/* Requirements */}
      {requirements && (
        <Section icon={FileText} title={t('orderDetail.requirements')}>
          <div className="space-y-1.5">
            {Object.entries(requirements).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                <span className="text-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Metadata */}
      <Section icon={Info} title={t('orderDetail.metadata')}>
        <Row label={t('orderDetail.created')}>{dt(order.created_at) || '—'}</Row>
        {dt(order.cancelled_at) && <Row label={t('orderDetail.cancelled')} tone="danger">{dt(order.cancelled_at)}</Row>}
        {order.cancellation_reason && <Row label={t('orderDetail.reason')}>{order.cancellation_reason}</Row>}
        {order.stripe_payment_intent_id && (
          <div className="flex items-baseline justify-between gap-3 py-1">
            <span className="text-sm text-muted-foreground shrink-0">Stripe PI</span>
            <span className="text-xs font-mono text-muted-foreground truncate">{order.stripe_payment_intent_id}</span>
          </div>
        )}
      </Section>
    </div>
  );
}
