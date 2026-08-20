// src/app/dashboard/bookings/components/BookingFilters.js
'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Download, RefreshCw, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import Drawer from '@/components/ui/Drawer';

/** Token-styled native select (accessible, RTL-aware). */
function Select({ value, onChange, options, ariaLabel, className = '' }) {
  const { isRTL } = useApp();
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={isRTL ? 'rtl' : 'ltr'}
        className="w-full h-11 sm:h-10 appearance-none bg-input-background text-foreground border border-border rounded-xl ps-3 pe-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export default function BookingFilters({
  filters,
  onFilterChange,
  onClearFilters,
  onRefresh,
}) {
  const { t } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const statusOptions = [
    { value: 'all', label: t('bookings.filters.allStatus') },
    { value: 'pending', label: t('bookings.status.pending') },
    { value: 'pending_payment', label: t('bookings.status.pendingPayment') },
    { value: 'confirmed', label: t('bookings.status.confirmed') },
    { value: 'scheduled', label: t('bookings.status.scheduled') },
    { value: 'in_progress', label: t('bookings.status.inProgress') },
    { value: 'completed', label: t('bookings.status.completed') },
    { value: 'cancelled', label: t('bookings.status.cancelled') },
  ];

  const paymentOptions = [
    { value: 'all', label: t('bookings.filters.allPayments') },
    { value: 'paid', label: t('bookings.payment.paid') },
    { value: 'unpaid', label: t('bookings.payment.unpaid') },
    { value: 'partial', label: t('bookings.payment.partial') },
    { value: 'refunded', label: t('bookings.payment.refunded') },
  ];

  const activeCount =
    (filters.search ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.paymentStatus !== 'all' ? 1 : 0);
  const hasActiveFilters = activeCount > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        {/* Search — always visible */}
        <SearchInput
          value={filters.search}
          onChange={(v) => onFilterChange('search', v)}
          placeholder={t('bookings.filters.search')}
          ariaLabel={t('bookings.filters.search')}
          className="flex-1 min-w-0"
        />

        {/* Desktop inline filters */}
        <div className="hidden md:flex items-center gap-2">
          <Select
            value={filters.status}
            onChange={(v) => onFilterChange('status', v)}
            options={statusOptions}
            ariaLabel={t('bookings.filters.allStatus')}
            className="w-44"
          />
          <Select
            value={filters.paymentStatus}
            onChange={(v) => onFilterChange('paymentStatus', v)}
            options={paymentOptions}
            ariaLabel={t('bookings.filters.allPayments')}
            className="w-40"
          />
          {hasActiveFilters && (
            <IconButton
              label={t('bookings.empty.clearFilters')}
              icon={X}
              variant="outline"
              onClick={onClearFilters}
            />
          )}
          <IconButton
            label={t('bookings.error.retry')}
            icon={RefreshCw}
            variant="outline"
            onClick={onRefresh}
          />
          <IconButton
            label={t('bookings.filters.export')}
            icon={Download}
            variant="outline"
          />
        </div>

        {/* Mobile: refresh + filters trigger */}
        <div className="flex md:hidden items-center gap-2">
          <IconButton
            label={t('bookings.error.retry')}
            icon={RefreshCw}
            variant="outline"
            onClick={onRefresh}
          />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative inline-flex items-center gap-1.5 h-11 px-3 rounded-xl border border-border bg-surface text-foreground text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile filter drawer / bottom sheet */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="bottom"
        title={t('bookings.table.status') + ' · ' + t('bookings.table.payment')}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t('bookings.table.status')}
            </label>
            <Select
              value={filters.status}
              onChange={(v) => onFilterChange('status', v)}
              options={statusOptions}
              ariaLabel={t('bookings.filters.allStatus')}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t('bookings.table.payment')}
            </label>
            <Select
              value={filters.paymentStatus}
              onChange={(v) => onFilterChange('paymentStatus', v)}
              options={paymentOptions}
              ariaLabel={t('bookings.filters.allPayments')}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            {hasActiveFilters && (
              <Button variant="secondary" size="md" className="flex-1" onClick={onClearFilters}>
                {t('bookings.empty.clearFilters')}
              </Button>
            )}
            <Button variant="primary" size="md" className="flex-1" onClick={() => setDrawerOpen(false)}>
              {t('common.done') || 'Done'}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
