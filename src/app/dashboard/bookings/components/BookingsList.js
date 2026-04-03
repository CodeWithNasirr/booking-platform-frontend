// src/components/bookings/BookingsList.js
'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import BookingRow from './BookingRow';
import {
  Calendar,
  Loader2,
} from 'lucide-react';

export default function BookingsList({
  hasAnyAction,
  bookings,
  loading,
  onView,
  onEdit,      
  onStatusChange,
  onCancel,
  onDelete,
}) {
  const { t, isRTL } = useApp();
  const [menuOpenId, setMenuOpenId] = useState(null);
  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B1E3F] mb-4" />
        <p className="text-gray-600">{t('bookings.loading')}</p>
      </div>
    );
  }

  // Empty state
  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#8B1E3F]/10 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-[#8B1E3F]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('bookings.empty.title')}
        </h3>
        <p className="text-gray-600">
          {t('bookings.empty.description')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                {t('bookings.table.booking')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                {t('bookings.table.customer')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                {t('bookings.table.service')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                {t('bookings.table.provider')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                {t('bookings.table.dateTime')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                {t('bookings.table.status')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
              >
                {t('bookings.table.payment')}
              </th>
              <th
                className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isRTL ? 'text-left' : 'text-right'
                }`}
              >
                {t('bookings.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <BookingRow
                hasAnyAction={hasAnyAction} 
                key={booking.id}
                booking={booking}
                menuOpenId={menuOpenId}
                setMenuOpenId={setMenuOpenId}
                onEdit={onEdit}          // ✅ PASS IT
                onView={onView}
                onStatusChange={onStatusChange}
                onCancel={onCancel}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}