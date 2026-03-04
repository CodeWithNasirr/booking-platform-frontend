// src/components/bookings/CancelBookingModal.js
'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export default function CancelBookingModal({ booking, onConfirm, onClose }) {
  const { t, isRTL } = useApp();
  
  const [reason, setReason] = useState('');
  const [requestRefund, setRequestRefund] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    
    setSubmitting(true);
    
    try {
      await onConfirm(booking.id, reason, requestRefund);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const hasPayment = booking.amount_paid > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl ${
          isRTL ? 'rtl' : 'ltr'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('bookings.modal.cancel.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Warning */}
          <div className={`p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 ${
            isRTL ? 'flex-row-reverse' : ''
          }`}>
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className={`text-sm text-amber-700 ${isRTL ? 'text-right' : ''}`}>
              {t('bookings.modal.cancel.warning')}
            </p>
          </div>

          {/* Booking Info */}
          <div className={`p-4 bg-gray-50 rounded-xl ${isRTL ? 'text-right' : ''}`}>
            <p className="text-sm text-gray-600">Booking</p>
            <p className="font-medium text-gray-900">{booking.booking_number}</p>
            <p className="text-sm text-gray-600 mt-1">
              {booking.service_name || booking.service?.name?.en}
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label
              className={`block text-sm font-medium text-gray-700 mb-2 ${
                isRTL ? 'text-right' : ''
              }`}
            >
              {t('bookings.modal.cancel.reason')} *
            </label>
            <textarea
              placeholder={t('bookings.modal.cancel.reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent resize-none ${
                isRTL ? 'text-right' : ''
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Refund Option */}
          {hasPayment && (
            <label
              className={`flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={requestRefund}
                onChange={(e) => setRequestRefund(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
              />
              <div className={isRTL ? 'text-right' : ''}>
                <p className="font-medium text-gray-900">
                  {t('bookings.modal.cancel.requestRefund')}
                </p>
                <p className="text-sm text-gray-600">
                  Refund amount: ${booking.amount_paid}
                </p>
              </div>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 ${
          isRTL ? 'flex-row-reverse' : ''
        }`}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            {t('bookings.modal.create.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || submitting}
            className="px-5 py-2.5 rounded-xl text-white bg-red-600 hover:bg-red-700 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              t('bookings.modal.cancel.confirm')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}