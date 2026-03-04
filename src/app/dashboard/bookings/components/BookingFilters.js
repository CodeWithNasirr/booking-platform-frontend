// src/components/bookings/BookingFilters.js
'use client';

import { useApp } from '@/contexts/AppContext';
import {
  Search,
  Download,
  RefreshCw,
  X,
} from 'lucide-react';

export default function BookingFilters({
  filters,
  onFilterChange,
  onClearFilters,
  onRefresh,
}) {
  const { t, isRTL } = useApp();

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

  const hasActiveFilters =
    filters.search ||
    filters.status !== 'all' ||
    filters.paymentStatus !== 'all';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`flex flex-col md:flex-row gap-4 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${
              isRTL ? 'right-3' : 'left-3'
            }`}
          />
          <input
            type="text"
            placeholder={t('bookings.filters.search')}
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className={`w-full py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent ${
              isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className={`px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent bg-white min-w-[180px] ${
            isRTL ? 'text-right' : ''
          }`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Payment Filter */}
        <select
          value={filters.paymentStatus}
          onChange={(e) => onFilterChange('paymentStatus', e.target.value)}
          className={`px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent bg-white min-w-[180px] ${
            isRTL ? 'text-right' : ''
          }`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {paymentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Action Buttons */}
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="p-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition text-gray-600"
              title={t('bookings.empty.clearFilters')}
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="p-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition text-gray-600"
            title={t('bookings.error.retry')}
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Export */}
          <button
            className="p-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition text-gray-600"
            title={t('bookings.filters.export')}
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}