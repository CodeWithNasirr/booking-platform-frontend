// src/app/dashboard/bookings/components/BookingStats.js
'use client';

import { useApp } from '@/contexts/AppContext';
import {
  Calendar,
  CalendarClock,
  CheckCircle,
  XCircle,
  Wallet,
} from 'lucide-react';

/**
 * Compact KPI row: Total, Upcoming, Completed, Cancelled (+ Revenue).
 * Subtle cards — small icon chip using semantic tokens, no oversized
 * dashboard tiles, no hard-coded colours.
 */
export default function BookingStats({ stats }) {
  const { t, isRTL, tenants } = useApp();
  const currency = tenants?.[0]?.default_currency || 'SAR';

  const formatCurrency = (amount) =>
    new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const upcoming =
    (stats.pending || 0) + (stats.confirmed || 0) + (stats.inProgress || 0);

  const items = [
    {
      key: 'total',
      label: t('bookings.stats.total'),
      value: stats.total ?? 0,
      icon: Calendar,
      chip: 'bg-accent text-accent-foreground',
    },
    {
      key: 'upcoming',
      label: t('bookings.stats.upcoming'),
      value: upcoming,
      icon: CalendarClock,
      chip: 'bg-info-soft text-info-soft-foreground',
    },
    {
      key: 'completed',
      label: t('bookings.stats.completed'),
      value: stats.completed ?? 0,
      icon: CheckCircle,
      chip: 'bg-success-soft text-success-soft-foreground',
    },
    {
      key: 'cancelled',
      label: t('bookings.stats.cancelled'),
      value: stats.cancelled ?? 0,
      icon: XCircle,
      chip: 'bg-danger-soft text-danger-soft-foreground',
    },
    {
      key: 'revenue',
      label: t('bookings.stats.revenue'),
      value: formatCurrency(stats.revenue || 0),
      icon: Wallet,
      chip: 'bg-muted text-muted-foreground',
      wide: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            className="rounded-xl border border-border bg-card p-3.5 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.chip}`}>
              <Icon className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              <p
                className="text-lg font-bold text-foreground tabular-nums truncate"
                dir={item.wide && isRTL ? 'ltr' : undefined}
              >
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
