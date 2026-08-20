'use client';

import { useApp } from '@/contexts/AppContext';
import { makeFormatters } from '../../components/orderPresentation';

function Stat({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{value}</p>
    </div>
  );
}

/** Order overview — quick stats strip (service title lives in the header). */
export default function OrderOverviewCard({ order }) {
  const { t, isRTL } = useApp();
  const { money } = makeFormatters(isRTL, order.currency || 'USD');
  const created = order.created_at
    ? new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(order.created_at))
    : '—';

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      {order.service_name && (
        <p className="text-base font-semibold text-foreground mb-3">{order.service_name}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label={t('orderDetail.amount')} value={money(order.total_amount)} />
        <Stat label={t('orderDetail.delivery')} value={order.delivery_days ? `${order.delivery_days} ${t('orderDetail.days')}` : '—'} />
        <Stat label={t('orderDetail.revisions')} value={`${order.revisions_used || 0}/${order.revisions_allowed || 0}`} />
        <Stat label={t('orderDetail.created')} value={created} />
      </div>
    </section>
  );
}
