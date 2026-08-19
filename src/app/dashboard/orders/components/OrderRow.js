'use client';

import { useApp } from '@/contexts/AppContext';
import { MessageSquare } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { OrderStatusBadge } from '@/components/orders';
import {
  getPaymentState, getInitials, getUnreadCount, makeFormatters, lastActivity,
} from './orderPresentation';

/**
 * Desktop table row for an order. Primary info strong, secondary muted,
 * semantic status + payment badges, unread indicator, subtle hover.
 */
export default function OrderRow({ order, onOpen, clickable }) {
  const { t, isRTL } = useApp();
  const { money, date } = makeFormatters(isRTL, order.currency || 'USD');
  const pay = getPaymentState(order, t);
  const unread = getUnreadCount(order);

  return (
    <tr
      onClick={clickable ? () => onOpen(order.id) : undefined}
      className={`transition-colors ${clickable ? 'cursor-pointer hover:bg-muted/40' : ''}`}
    >
      {/* Order (service + number) */}
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground truncate max-w-[220px]">
            {order.service_name || t('common.notAvailable')}
          </span>
          {unread > 0 && (
            <span
              className="inline-flex items-center gap-0.5 text-primary shrink-0"
              title={String(unread)}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">#{order.order_number}</div>
      </td>

      {/* Customer */}
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold shrink-0">
            {getInitials(order.customer_name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate max-w-[180px]">
              {order.customer_name || '—'}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
              {order.customer_email || ''}
            </div>
          </div>
        </div>
      </td>

      {/* Provider */}
      <td className="px-4 py-3 align-middle whitespace-nowrap hidden lg:table-cell">
        <span className="text-sm text-foreground">
          {order.provider_name || t('orders.unassigned')}
        </span>
      </td>

      {/* Amount */}
      <td className="px-4 py-3 align-middle whitespace-nowrap text-end">
        <span className="text-sm font-semibold text-foreground tabular-nums">{money(order.total_amount)}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 align-middle whitespace-nowrap">
        <OrderStatusBadge status={order.status} size="sm" />
      </td>

      {/* Payment */}
      <td className="px-4 py-3 align-middle whitespace-nowrap hidden xl:table-cell">
        <Badge variant={pay.tone}>{pay.label}</Badge>
      </td>

      {/* Last activity */}
      <td className="px-4 py-3 align-middle whitespace-nowrap hidden xl:table-cell">
        <span className="text-sm text-muted-foreground">{lastActivity(order, isRTL)}</span>
      </td>

      {/* Date */}
      <td className="px-4 py-3 align-middle whitespace-nowrap hidden lg:table-cell">
        <span className="text-sm text-muted-foreground">{date(order.created_at)}</span>
      </td>
    </tr>
  );
}
