// src/components/bookings/BookingStats.js
'use client';

import { useApp } from '@/contexts/AppContext';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function BookingStats({ stats }) {
  const { t, isRTL,tenants } = useApp();

  const currency = tenants[0]?.default_currency || 'SAR';
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsConfig = [
    {
      key: 'total',
      label: t('bookings.stats.total'),
      value: stats.total,
      icon: Calendar,
      bgColor: 'bg-[#8B1E3F]/10',
      textColor: 'text-[#8B1E3F]',
      iconBg: 'bg-[#8B1E3F]/20',
    },
    {
      key: 'pending',
      label: t('bookings.stats.pending'),
      value: stats.pending,
      icon: Clock,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      key: 'confirmed',
      label: t('bookings.stats.confirmed'),
      value: stats.confirmed,
      icon: CheckCircle,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      key: 'completed',
      label: t('bookings.stats.completed'),
      value: stats.completed,
      icon: TrendingUp,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      key: 'revenue',
      label: t('bookings.stats.revenue'),
      value: formatCurrency(stats.revenue || 0),
      icon: DollarSign,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      isRevenue: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {statsConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.key}
            className={`bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow ${
              isRTL ? 'text-right' : 'text-left'
            }`}
          >
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className={`text-2xl font-bold text-gray-900 mt-1 ${
                  stat.isRevenue && isRTL ? 'direction-ltr' : ''
                }`}>
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}
              >
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}