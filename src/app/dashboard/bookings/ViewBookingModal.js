// src/components/bookings/ViewBookingModal.js
'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useApp } from '@/contexts/AppContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { CallDock } from '@/components/collaboration';
import BookingConversationPanel from '@/components/bookings/BookingConversationPanel';
import {
  X,
  Clock,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Edit,
  FileText,
  CreditCard,
  MessageSquare,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';

// Status configuration
const getStatusConfig = (t) => ({
  draft: {
    label: t('bookings.status.draft'),
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
  },
  pending: {
    label: t('bookings.status.pending'),
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  pending_payment: {
    label: t('bookings.status.pendingPayment'),
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  confirmed: {
    label: t('bookings.status.confirmed'),
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: CheckCircle,
  },
  scheduled: {
    label: t('bookings.status.scheduled'),
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: Calendar,
  },
  in_progress: {
    label: t('bookings.status.inProgress'),
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: RefreshCw,
  },
  completed: {
    label: t('bookings.status.completed'),
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: t('bookings.status.cancelled'),
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
  refunded: {
    label: t('bookings.status.refunded'),
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: XCircle,
  },
});

// Payment status configuration
const getPaymentConfig = (t) => ({
  unpaid: { label: t('bookings.payment.unpaid'), color: 'bg-red-100 text-red-700' },
  paid: { label: t('bookings.payment.paid'), color: 'bg-emerald-100 text-emerald-700' },
  partial: { label: t('bookings.payment.partial'), color: 'bg-amber-100 text-amber-700' },
  refunded: { label: t('bookings.payment.refunded'), color: 'bg-gray-100 text-gray-700' },
});

export default function ViewBookingModal({
  booking,
  onClose,
  onStatusChange,
  onCancel,
}) {
  const { t, isRTL, activeTenant, user } = useApp();
  const tenantId = activeTenant?.id || activeTenant;
  const { markTargetRead } = useNotifications();

  // Opening this booking's conversation clears its unread message
  // notifications (backend read state) and updates the bell + Bookings
  // sidebar dot without a full refresh.
  useEffect(() => {
    if (booking?.id) markTargetRead("booking", booking.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  const statusConfig = getStatusConfig(t);
  const paymentConfig = getPaymentConfig(t);
  
  const status = booking.status || 'pending';
  const statusCfg = statusConfig[status] || statusConfig.pending;
  const StatusIcon = statusCfg.icon;

  // Determine payment status
  const getPaymentStatus = () => {
    if (booking.is_fully_paid) return 'paid';
    if (booking.is_deposit_paid) return 'partial';
    if (booking.amount_paid > 0) return 'partial';
    return 'unpaid';
  };
  
  const paymentStatus = getPaymentStatus();
  const paymentCfg = paymentConfig[paymentStatus];

  // Format currency
  const formatCurrency = (amount) => {
    const currency = booking.currency  || 'USD';
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  // Get initials
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get service name
  const getServiceName = () => {
    if (booking.service_name) return booking.service_name;
    if (booking.service?.name) {
      return typeof booking.service.name === 'object'
        ? booking.service.name.en || Object.values(booking.service.name)[0]
        : booking.service.name;
    }
    return '-';
  };

  // Get customer info
  const customer = {
    name: booking.customer_name || booking.customer?.full_name || '-',
    email: booking.customer_email || '-',
    phone: booking.customer_phone || '-',
  };

  // Get provider info
  const provider = {
    name: booking.provider_name || booking.provider?.name || '-',
  };

  // Available transitions
  const getAvailableTransitions = () => {
    const transitions = {
      pending: ['confirmed'],
      pending_payment: ['paid'],
      confirmed: ['scheduled', 'in_progress'],
      scheduled: ['in_progress'],
      in_progress: ['completed'],
    };
    return transitions[status] || [];
  };

  const canCancel = !['completed', 'cancelled', 'refunded'].includes(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col ${
          isRTL ? 'rtl' : 'ltr'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('bookings.modal.view.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Live voice / video / screen-share call surface */}
          <CallDock
            subjectType="booking"
            subjectId={booking.id}
            tenantId={tenantId}
            authMode="jwt"
            jwt={Cookies.get('access_token') || null}
            selfUserId={user?.id}
            selfName={user?.full_name || user?.name || 'You'}
            canStart={['paid', 'scheduled'].includes(booking.status)}
          />

          {/* Conversation — chat + files + timeline */}
          <div className={`border border-gray-200 rounded-xl overflow-hidden ${isRTL ? 'text-right' : ''}`}>
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">Messages &amp; Files</h3>
            </div>
            <div className="p-3">
              <BookingConversationPanel
                bookingId={booking.id}
                domain={tenantId}
                auth={{ jwt: Cookies.get('access_token') || null }}
                viewer="admin"
                showComposer={!['cancelled', 'refunded'].includes(booking.status)}
              />
            </div>
          </div>

          {/* Booking Number & Status */}
          <div className={`flex items-center justify-between p-4 bg-gray-50 rounded-xl ${
            isRTL ? 'flex-row-reverse' : ''
          }`}>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-sm text-gray-600">
                {t('bookings.modal.view.bookingNumber')}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {booking.booking_number}
              </p>
            </div>
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.color} ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusCfg.label}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${paymentCfg.color}`}
              >
                {paymentCfg.label}
              </span>
            </div>
          </div>

          {/* Customer & Provider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-sm text-gray-600 mb-2">
                {t('bookings.modal.view.customer')}
              </p>
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#8B1E3F]/80 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {getInitials(customer.name)}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className={`text-sm text-gray-600 flex items-center gap-1 ${
                    isRTL ? 'flex-row-reverse' : ''
                  }`}>
                    <Mail className="w-3.5 h-3.5" />
                    {customer.email}
                  </p>
                  <p className={`text-sm text-gray-600 flex items-center gap-1 ${
                    isRTL ? 'flex-row-reverse' : ''
                  }`}>
                    <Phone className="w-3.5 h-3.5" />
                    {customer.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Provider */}
            <div className={isRTL ? 'text-right' : ''}>
              <p className="text-sm text-gray-600 mb-2">
                {t('bookings.modal.view.serviceProvider')}
              </p>
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(provider.name)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{provider.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="p-4 bg-[#8B1E3F]/5 rounded-xl border border-[#8B1E3F]/20">
            <p className={`text-sm text-gray-600 mb-2 ${isRTL ? 'text-right' : ''}`}>
              {t('bookings.modal.view.serviceDetails')}
            </p>
            <p className={`font-semibold text-gray-900 mb-2 ${isRTL ? 'text-right' : ''}`}>
              {getServiceName()}
            </p>
            <div className={`flex items-center gap-4 text-sm text-gray-600 ${
              isRTL ? 'flex-row-reverse' : ''
            }`}>
              {booking.duration_minutes && (
                <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="w-4 h-4" />
                  {booking.duration_minutes} {t('bookings.time.minutes')}
                </span>
              )}
              <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <DollarSign className="w-4 h-4" />
                {formatCurrency(booking.total_amount)}
              </span>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 bg-gray-50 rounded-xl ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm text-gray-600 mb-1">
                {t('bookings.modal.view.date')}
              </p>
              <p className="font-medium text-gray-900">
                {formatDate(booking.scheduled_date)}
              </p>
            </div>
            <div className={`p-4 bg-gray-50 rounded-xl ${isRTL ? 'text-right' : ''}`}>
              <p className="text-sm text-gray-600 mb-1">
                {t('bookings.modal.view.time')}
              </p>
              <p className="font-medium text-gray-900">
                {formatTime(booking.scheduled_time)}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className={`text-sm text-gray-600 mb-3 ${isRTL ? 'text-right' : ''}`}>
              {t('bookings.modal.view.payments')}
            </p>
            <div className="space-y-2">
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(booking.subtotal)}</span>
              </div>
              {booking.addons_total > 0 && (
                <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">Add-ons</span>
                  <span className="font-medium">{formatCurrency(booking.addons_total)}</span>
                </div>
              )}
              {booking.discount_amount > 0 && (
                <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-emerald-600">
                    -{formatCurrency(booking.discount_amount)}
                  </span>
                </div>
              )}
              <div className={`flex justify-between pt-2 border-t border-gray-200 ${
                isRTL ? 'flex-row-reverse' : ''
              }`}>
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">{formatCurrency(booking.total_amount)}</span>
              </div>
              <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(booking.amount_paid)}
                </span>
              </div>
              {booking.amount_remaining > 0 && (
                <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-gray-600">Amount Remaining</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(booking.amount_remaining)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Meeting URL */}
          {booking.meeting_url && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className={`text-sm text-blue-600 mb-2 ${isRTL ? 'text-right' : ''}`}>
                Meeting Link
              </p>
              <a
                href={booking.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 text-blue-700 hover:underline font-medium ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                {booking.meeting_provider || 'Join Meeting'}
              </a>
            </div>
          )}

          {/* Notes */}
          {booking.customer_notes && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className={`text-sm text-amber-600 mb-1 ${isRTL ? 'text-right' : ''}`}>
                {t('bookings.modal.view.notes')}
              </p>
              <p className={`text-gray-900 ${isRTL ? 'text-right' : ''}`}>
                {booking.customer_notes}
              </p>
            </div>
          )}

          {/* Status Timeline */}
          {booking.status_history && booking.status_history.length > 0 && (
            <div>
              <p className={`text-sm text-gray-600 mb-3 ${isRTL ? 'text-right' : ''}`}>
                {t('bookings.modal.view.timeline')}
              </p>
              <div className="space-y-3">
                {booking.status_history.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#8B1E3F] mt-2" />
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="font-medium text-gray-900">
                        {statusConfig[entry.to_status]?.label || entry.to_status}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(entry.created_at)}
                        {entry.changed_by_name && ` by ${entry.changed_by_name}`}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t border-gray-200 flex items-center justify-between ${
          isRTL ? 'flex-row-reverse' : ''
        }`}>
          <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {getAvailableTransitions().includes('confirmed') && (
              <button
                onClick={() => {
                  onStatusChange(booking.id, 'confirmed');
                  onClose();
                }}
                className={`px-4 py-2 rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition font-medium flex items-center gap-2 ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {t('bookings.actions.confirm')}
              </button>
            )}
            {getAvailableTransitions().includes('in_progress') && (
              <button
                onClick={() => {
                  onStatusChange(booking.id, 'in_progress');
                  onClose();
                }}
                className={`px-4 py-2 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition font-medium flex items-center gap-2 ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <Play className="w-4 h-4" />
                {t('bookings.actions.start')}
              </button>
            )}
            {getAvailableTransitions().includes('completed') && (
              <button
                onClick={() => {
                  onStatusChange(booking.id, 'completed');
                  onClose();
                }}
                className={`px-4 py-2 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition font-medium flex items-center gap-2 ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {t('bookings.actions.complete')}
              </button>
            )}
            {canCancel && (
              <button
                onClick={onCancel}
                className={`px-4 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition font-medium flex items-center gap-2 ${
                  isRTL ? 'flex-row-reverse' : ''
                }`}
              >
                <XCircle className="w-4 h-4" />
                {t('bookings.actions.cancel')}
              </button>
            )}
          </div>

          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              {t('bookings.modal.view.close')}
            </button>
            {/* <button
              className={`px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#8B1E3F]/80 hover:opacity-90 transition font-medium shadow-sm flex items-center gap-2 ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <Edit className="w-4 h-4" />
              {t('bookings.modal.view.edit')}
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}