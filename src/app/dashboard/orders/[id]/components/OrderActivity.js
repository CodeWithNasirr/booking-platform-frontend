'use client';

import { useApp } from '@/contexts/AppContext';
import { History, Activity as ActivityIcon, Star } from 'lucide-react';
import StatusPill from '@/components/ui/StatusPill';
import EmptyState from '@/components/ui/EmptyState';
import { OrderTimelineFeed } from '@/components/orders';
import { Section } from './ui';
import { ORDER_STATUS_TONE, ORDER_STATUS_LABEL } from '../../components/orderPresentation';

/** Activity — status history + live timeline feed + customer review. */
export default function OrderActivity({ order }) {
  const { t, isRTL } = useApp();
  const history = Array.isArray(order.status_history) ? order.status_history : [];
  const events = Array.isArray(order.timeline_events) ? order.timeline_events : [];

  const when = (s) => {
    if (!s) return '';
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? ''
      : new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
  };

  const nothing = history.length === 0 && events.length === 0 && !order.review;

  return (
    <div className="space-y-4">
      {nothing && (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState icon={ActivityIcon} title={t('orderDetail.activity')} />
        </div>
      )}

      {history.length > 0 && (
        <Section icon={History} title={t('orderDetail.timeline')}>
          <ol className="relative">
            {history.map((entry, i) => {
              const tone = ORDER_STATUS_TONE[entry.to_status] || 'gray';
              const label = ORDER_STATUS_LABEL[entry.to_status] || entry.to_status;
              const last = i === history.length - 1;
              return (
                <li key={i} className="flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className={`mt-1 w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-border'}`} />
                    {!last && <span className="flex-1 w-px bg-border mt-1" />}
                  </div>
                  <div className="min-w-0 pb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusPill tone={tone} size="sm" label={label} />
                      <span className="text-xs text-muted-foreground">{when(entry.created_at || entry.changed_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{entry.changed_by_name || t('orderDetail.system')}</p>
                    {entry.notes && <p className="text-sm text-foreground mt-1">{entry.notes}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      {events.length > 0 && (
        <Section icon={ActivityIcon} title={t('orderDetail.activity')}>
          <OrderTimelineFeed events={events} />
        </Section>
      )}

      {order.review && (
        <Section icon={Star} title={t('orderDetail.customerReview')}>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-4 h-4 ${s <= order.review.rating ? 'text-warning fill-warning' : 'text-border'}`} />
            ))}
            <span className="text-sm text-muted-foreground ms-1">{order.review.rating}/5</span>
          </div>
          {order.review.comment && <p className="text-sm text-foreground leading-relaxed">{order.review.comment}</p>}
        </Section>
      )}
    </div>
  );
}
