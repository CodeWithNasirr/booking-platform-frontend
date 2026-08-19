'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import FilterBar from '@/components/ui/FilterBar';
import Drawer from '@/components/ui/Drawer';
import { ORDER_STATUS_TONE, ORDER_STATUS_LABEL } from './orderPresentation';

const STATUS_ORDER = [
  'pending_payment', 'paid', 'accepted', 'in_progress',
  'delivered', 'revision_requested', 'completed', 'cancelled', 'refunded',
];

export default function OrdersToolbar({
  searchQuery, onSearch,
  statusFilter, onStatusChange,
  statusCounts, totalCount, onRefresh,
}) {
  const { t } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // "All" + statuses that have at least one order (or the active one).
  const options = [
    { value: 'all', label: t('common.all'), count: totalCount },
    ...STATUS_ORDER
      .filter((s) => statusCounts[s] || statusFilter === s)
      .map((s) => ({
        value: s,
        label: ORDER_STATUS_LABEL[s] || s,
        count: statusCounts[s] || 0,
        tone: ORDER_STATUS_TONE[s],
      })),
  ];

  const handlePick = (v) => { onStatusChange(v); setDrawerOpen(false); };

  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <SearchInput
          value={searchQuery}
          onChange={onSearch}
          placeholder={t('orders.searchPlaceholder')}
          ariaLabel={t('orders.searchPlaceholder')}
          className="flex-1 min-w-0"
        />
        <IconButton
          label={t('common.refresh')}
          icon={RefreshCw}
          variant="outline"
          onClick={onRefresh}
        />
        {/* Mobile: open filters in a bottom sheet */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="md:hidden relative inline-flex items-center gap-1.5 h-11 px-3 rounded-xl border border-border bg-surface text-foreground text-sm font-medium shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {statusFilter !== 'all' && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* Desktop: inline segmented status controls */}
      <div className="hidden md:block">
        <FilterBar value={statusFilter} onChange={onStatusChange} options={options} ariaLabel={t('orders.filters.title')} />
      </div>

      {/* Mobile: filters bottom sheet */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="bottom" title={t('orders.filters.title')}>
        <div className="flex flex-col gap-2">
          {options.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePick(opt.value)}
                aria-pressed={active}
                className={`flex items-center justify-between gap-3 h-11 px-3 rounded-xl border text-sm font-medium transition ${
                  active
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-surface text-foreground hover:bg-muted'
                }`}
              >
                <span className="flex items-center gap-2">
                  {opt.tone && <span className={`w-2 h-2 rounded-full ${DOT[opt.tone] || 'bg-muted-foreground'}`} />}
                  {opt.label}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{opt.count || 0}</span>
              </button>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}

const DOT = {
  yellow: 'bg-warning', blue: 'bg-info', indigo: 'bg-indigo-400', purple: 'bg-purple-400',
  emerald: 'bg-success', rose: 'bg-danger', gray: 'bg-muted-foreground',
};
