'use client';

import { useApp } from '@/contexts/AppContext';
import { Package, Wallet, Clock, Loader2, CheckCircle } from 'lucide-react';
import { ACTIVE_STATUSES, REVENUE_STATUSES, makeFormatters } from './orderPresentation';

/**
 * OrdersStats — compact KPI row: Total Orders, Pending Payment, Active,
 * Completed, Revenue. Subtle token-based cards (no oversized tiles).
 * Counts are derived from the loaded order set (search-scoped).
 */
export default function OrdersStats({ orders, currency }) {
  const { t, isRTL } = useApp();
  const { money } = makeFormatters(isRTL, currency);

  const count = (pred) => orders.reduce((n, o) => (pred(o) ? n + 1 : n), 0);
  const revenue = orders.reduce(
    (s, o) => (REVENUE_STATUSES.includes(o.status) ? s + parseFloat(o.total_amount || 0) : s),
    0,
  );

  const items = [
    { key: 'total', label: t('orders.kpi.total'), value: orders.length, icon: Package, chip: 'bg-accent text-accent-foreground' },
    { key: 'pending', label: t('orders.kpi.pendingPayment'), value: count((o) => o.status === 'pending_payment'), icon: Clock, chip: 'bg-warning-soft text-warning-soft-foreground' },
    { key: 'active', label: t('orders.kpi.active'), value: count((o) => ACTIVE_STATUSES.includes(o.status)), icon: Loader2, chip: 'bg-info-soft text-info-soft-foreground' },
    { key: 'completed', label: t('orders.kpi.completed'), value: count((o) => o.status === 'completed'), icon: CheckCircle, chip: 'bg-success-soft text-success-soft-foreground' },
    { key: 'revenue', label: t('orders.kpi.revenue'), value: money(revenue), icon: Wallet, chip: 'bg-muted text-muted-foreground', wide: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.chip}`}>
              <Icon className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              <p className="text-lg font-bold text-foreground tabular-nums truncate" dir={item.wide && isRTL ? 'ltr' : undefined}>
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
