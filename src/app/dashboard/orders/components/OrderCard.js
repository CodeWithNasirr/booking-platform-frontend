'use client';

import { useApp } from '@/contexts/AppContext';
import { MessageSquare, ChevronRight, Clock } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { OrderStatusBadge } from '@/components/orders';
import {
  getPaymentState, getInitials, getUnreadCount, makeFormatters, lastActivity,
} from './orderPresentation';

/**
 * Mobile order card. Whole card is one large tap target opening the
 * order. Shows order number, service, customer, amount, status, latest
 * activity and an unread indicator.
 */
export default function OrderCard({ order, onOpen, clickable }) {
  const { t, isRTL } = useApp();
  const { money } = makeFormatters(isRTL, order.currency || 'USD');
  const pay = getPaymentState(order, t);
  const unread = getUnreadCount(order);

  const open = () => { if (clickable) onOpen(order.id); };

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={open}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } } : undefined}
      className={`rounded-xl border border-border bg-card p-4 ${clickable ? 'cursor-pointer active:bg-muted/40 transition-colors' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">
              {order.service_name || t('common.notAvailable')}
            </span>
            {unread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">#{order.order_number}</div>
        </div>
        <OrderStatusBadge status={order.status} size="sm" className="shrink-0" />
      </div>

      {/* Customer */}
      <div className="mt-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold shrink-0">
          {getInitials(order.customer_name)}
        </div>
        <div className="text-sm font-medium text-foreground truncate">{order.customer_name || '—'}</div>
      </div>

      {/* Activity */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{lastActivity(order, isRTL)}</span>
      </div>

      {/* Footer: payment + amount + open affordance */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant={pay.tone}>{pay.label}</Badge>
          <span className="text-sm font-semibold text-foreground tabular-nums">{money(order.total_amount)}</span>
        </div>
        {clickable && <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 ${isRTL ? 'rotate-180' : ''}`} />}
      </div>
    </div>
  );
}
