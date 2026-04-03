// src/app/dashboard/bookings/BookingRow.js
'use client';

import { useApp } from '@/contexts/AppContext';
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Calendar,
  Play,
} from 'lucide-react';
import Portal from '@/components/ui/Portal';


const getStatusConfig = (t) => ({
  draft: {
    label: t('bookings.status.draft') || 'Draft',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
  },

  pending_payment: {
    label: t('bookings.status.pendingPayment') || 'Pending Payment',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },

  paid: {
    label: t('bookings.status.paid') || 'Paid',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },

  scheduled: {
    label: t('bookings.status.scheduled') || 'Scheduled',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: Calendar,
  },

  completed: {
    label: t('bookings.status.completed') || 'Completed',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },

  cancelled: {
    label: t('bookings.status.cancelled') || 'Cancelled',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },

  refunded: {
    label: t('bookings.status.refunded') || 'Refunded',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: XCircle,
  },
});

// Status configuration
// const getStatusConfig = (t) => ({
//   draft: {
//     label: t('bookings.status.draft') || 'Draft',
//     color: 'bg-gray-100 text-gray-700 border-gray-200',
//     icon: Clock,
//   },
//   pending: {
//     label: t('bookings.status.pending') || 'Pending',
//     color: 'bg-amber-100 text-amber-700 border-amber-200',
//     icon: Clock,
//   },
//   pending_payment: {
//     label: t('bookings.status.pendingPayment') || 'Pending Payment',
//     color: 'bg-amber-100 text-amber-700 border-amber-200',
//     icon: Clock,
//   },
//   deposit_paid: {
//     label: t('bookings.status.depositPaid') || 'Deposit Paid',
//     color: 'bg-blue-100 text-blue-700 border-blue-200',
//     icon: CheckCircle,
//   },
//   paid: {
//     label: t('bookings.status.paid') || 'Paid',
//     color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
//     icon: CheckCircle,
//   },
//   confirmed: {
//     label: t('bookings.status.confirmed') || 'Confirmed',
//     color: 'bg-blue-100 text-blue-700 border-blue-200',
//     icon: CheckCircle,
//   },
//   scheduled: {
//     label: t('bookings.status.scheduled') || 'Scheduled',
//     color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
//     icon: Calendar,
//   },
//   in_progress: {
//     label: t('bookings.status.inProgress') || 'In Progress',
//     color: 'bg-purple-100 text-purple-700 border-purple-200',
//     icon: RefreshCw,
//   },
//   delivered: {
//     label: t('bookings.status.delivered') || 'Delivered',
//     color: 'bg-teal-100 text-teal-700 border-teal-200',
//     icon: CheckCircle,
//   },
//   revision_requested: {
//     label: t('bookings.status.revisionRequested') || 'Revision Requested',
//     color: 'bg-orange-100 text-orange-700 border-orange-200',
//     icon: RefreshCw,
//   },
//   completed: {
//     label: t('bookings.status.completed') || 'Completed',
//     color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
//     icon: CheckCircle,
//   },
//   cancelled: {
//     label: t('bookings.status.cancelled') || 'Cancelled',
//     color: 'bg-red-100 text-red-700 border-red-200',
//     icon: XCircle,
//   },
//   refunded: {
//     label: t('bookings.status.refunded') || 'Refunded',
//     color: 'bg-gray-100 text-gray-700 border-gray-200',
//     icon: XCircle,
//   },
//   disputed: {
//     label: t('bookings.status.disputed') || 'Disputed',
//     color: 'bg-red-100 text-red-700 border-red-200',
//     icon: XCircle,
//   },
// });

// Payment status configuration
const getPaymentConfig = (t) => ({
  unpaid: { label: t('bookings.payment.unpaid') || 'Unpaid', color: 'bg-red-100 text-red-700' },
  paid: { label: t('bookings.payment.paid') || 'Paid', color: 'bg-emerald-100 text-emerald-700' },
  partial: { label: t('bookings.payment.partial') || 'Partial', color: 'bg-amber-100 text-amber-700' },
  refunded: { label: t('bookings.payment.refunded') || 'Refunded', color: 'bg-gray-100 text-gray-700' },
  pending: { label: t('bookings.payment.pending') || 'Pending', color: 'bg-amber-100 text-amber-700' },
});

export default function BookingRow({
  hasAnyAction,
  booking,
  menuOpenId,
  setMenuOpenId,
  onView,
  onEdit,
  onStatusChange,
  onCancel,
  onDelete,
}) {
  const { t, isRTL, activeTenant } = useApp();
  
  const statusConfig = getStatusConfig(t);
  const paymentConfig = getPaymentConfig(t);
  
  const status = booking.status || 'pending';
  const statusCfg = statusConfig[status] || statusConfig.draft;
  const StatusIcon = statusCfg.icon;

  // Check if booking can be edited
  const isEditable = !['completed', 'cancelled', 'refunded'].includes(status);

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
    const currency = booking.currency || 'USD';
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Format time
  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    // Handle both "HH:mm:ss" and "HH:mm" formats
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

  // Get customer name
  const getCustomerName = () => {
    return booking.customer_name || booking.customer?.full_name || '-';
  };

  // Get provider name
  const getProviderName = () => {
    return booking.provider_name || booking.provider?.name || '-';
  };

  // Available status transitions - MUST MATCH BACKEND STATUS_TRANSITIONS
  const getAvailableTransitions = () => {
    // Backend STATUS_TRANSITIONS from Booking model:
    // 'draft': ['pending_payment', 'cancelled'],
    // 'pending_payment': ['deposit_paid', 'paid', 'cancelled'],
    // 'deposit_paid': ['paid', 'confirmed', 'cancelled'],
    // 'paid': ['confirmed', 'refunded'],
    // 'confirmed': ['scheduled', 'in_progress', 'cancelled'],
    // 'scheduled': ['in_progress', 'cancelled'],
    // 'in_progress': ['delivered', 'cancelled'],
    // 'delivered': ['revision_requested', 'completed', 'disputed'],
    // 'revision_requested': ['in_progress', 'disputed'],
    // 'completed': [],
    // 'cancelled': ['refunded'],
    // 'refunded': [],
    // 'disputed': ['completed', 'refunded'],
    
    // const transitions = {
    //   draft: ['pending_payment'],
    //   pending_payment: ['deposit_paid', 'paid'],
    //   deposit_paid: ['paid', 'confirmed'],
    //   paid: ['confirmed'],
    //   confirmed: ['scheduled', 'in_progress'],
    //   scheduled: ['in_progress'],
    //   in_progress: ['delivered'],
    //   delivered: ['revision_requested', 'completed'],
    //   revision_requested: ['in_progress'],
    //   completed: [],
    //   cancelled: [],
    //   refunded: [],
    //   disputed: ['completed'],
    // };

     const transitions = {
      draft: ['pending_payment'],
      pending_payment: ['paid'],
      paid: ['scheduled', 'refunded'],
      scheduled: ['completed'],
      completed: [],
      cancelled: ['refunded'],
      refunded: [],
    };

    return transitions[status] || [];
  };

  const availableTransitions = getAvailableTransitions();

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Booking Number */}
      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : ''}`}>
        <div className="font-medium text-gray-900">{booking.booking_number}</div>
        <div className="text-sm text-gray-500">{formatDate(booking.created_at)}</div>
      </td>

      {/* Customer */}
      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B1E3F] to-[#8B1E3F]/80 flex items-center justify-center text-white text-sm font-semibold">
            {getInitials(getCustomerName())}
          </div>
          <div>
            <div className="font-medium text-gray-900">{getCustomerName()}</div>
            <div className="text-sm text-gray-500">
              {booking.customer_email || booking.customer?.email || '-'}
            </div>
          </div>
        </div>
      </td>

      {/* Service */}
      <td className={`px-6 py-4 ${isRTL ? 'text-right' : ''}`}>
        <div className="font-medium text-gray-900">{getServiceName()}</div>
        <div className="text-sm text-gray-500">
          {booking.duration_minutes ? `${booking.duration_minutes} ${t('bookings.time.minutes') || 'min'}` : ''} 
          {booking.duration_minutes && ' • '}
          {formatCurrency(booking.total_amount)}
        </div>
      </td>

      {/* Provider */}
      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : ''}`}>
        <div className="font-medium text-gray-900">{getProviderName()}</div>
      </td>

      {/* Date & Time */}
      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : ''}`}>
        <div className="font-medium text-gray-900">
          {formatDate(booking.scheduled_date)}
        </div>
        <div className="text-sm text-gray-500">
          {formatTime(booking.scheduled_time)}
        </div>
      </td>

      {/* Status */}
      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : ''}`}>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.color} ${
            isRTL ? 'flex-row-reverse' : ''
          }`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusCfg.label}
        </span>
      </td>

      {/* Payment */}
      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-right' : ''}`}>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${paymentCfg.color}`}
        >
          {paymentCfg.label}
        </span>
      </td>

      {/* Actions */}
      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? 'text-left' : 'text-right'}`}>
        <div className="relative inline-block">
          {hasAnyAction && (
            <button
              onClick={() => setMenuOpenId(menuOpenId === booking.id ? null : booking.id)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <MoreVertical className="w-4 h-4" />
          </button>
          )}

          {menuOpenId === booking.id && (
            <>
            <Portal>
              {/* Overlay to close menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpenId(null)}
              />
              
              {/* Menu */}
              <div
              className={`fixed z-50 w-48 bg-white border border-gray-200 rounded-xl shadow-xl
                  ${isRTL ? 'left-4' : 'right-4'}
                  top-1/2 -translate-y-1/2
                `}
              >
                {/* View */}
                <button
                  onClick={() => {
                    onView(booking);
                    setMenuOpenId(null);
                  }}
                  className={`w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition ${
                    isRTL ? 'flex-row-reverse text-right' : ''
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {t('bookings.actions.view') || 'View'}
                </button>

                {/* Edit */}
                <button
                  onClick={() => {
                    if (onEdit && isEditable) {
                      onEdit(booking);
                    }
                    setMenuOpenId(null);
                  }}
                  disabled={!isEditable}
                  className={`w-full px-4 py-2 flex items-center gap-2 text-sm transition ${
                    isRTL ? 'flex-row-reverse text-right' : ''
                  } ${
                    isEditable
                      ? 'text-gray-700 hover:bg-gray-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  {t('bookings.actions.edit') || 'Edit'}
                </button>

                {/* Confirm */}
                {/* {availableTransitions.includes('confirmed') && (
                  <button
                    onClick={() => {
                      onStatusChange(booking.id, 'confirmed');
                      setMenuOpenId(null);
                    }}
                    className={`w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition ${
                      isRTL ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('bookings.actions.confirm') || 'Confirm'}
                  </button>
                )} */}

                {/* Schedule */}
                {availableTransitions.includes('scheduled') && (
                  <button
                    onClick={() => {
                      onStatusChange(booking.id, 'scheduled');
                      setMenuOpenId(null);
                    }}
                    className={`w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition ${
                      isRTL ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    {t('bookings.actions.schedule') || 'Schedule'}
                  </button>
                )}

                {/* Start */}
                {/* {availableTransitions.includes('in_progress') && (
                  <button
                    onClick={() => {
                      onStatusChange(booking.id, 'in_progress');
                      setMenuOpenId(null);
                    }}
                    className={`w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition ${
                      isRTL ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {t('bookings.actions.start') || 'Start'}
                  </button>
                )} */}

                {/* Delivered */}
                {/* {availableTransitions.includes('delivered') && (
                  <button
                    onClick={() => {
                      onStatusChange(booking.id, 'delivered');
                      setMenuOpenId(null);
                    }}
                    className={`w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition ${
                      isRTL ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('bookings.actions.delivered') || 'Mark Delivered'}
                  </button>
                )} */}

                {/* Complete */}
                {availableTransitions.includes('completed') && (
                  <button
                    onClick={() => {
                      onStatusChange(booking.id, 'completed');
                      setMenuOpenId(null);
                    }}
                    className={`w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition ${
                      isRTL ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('bookings.actions.complete') || 'Complete'}
                  </button>
                )}

                {/* Cancel */}
                {!['completed', 'cancelled', 'refunded'].includes(status) && (
                  <button
                    onClick={() => {
                      onCancel(booking);
                      setMenuOpenId(null);
                    }}
                    className={`w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition ${
                      isRTL ? 'flex-row-reverse text-right' : ''
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    {t('bookings.actions.cancel') || 'Cancel'}
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => {
                    onDelete(booking.id);
                    setMenuOpenId(null);
                  }}
                  className={`w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition ${
                    isRTL ? 'flex-row-reverse text-right' : ''
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  {t('bookings.actions.delete') || 'Delete'}
                </button>
              </div>
              </Portal>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}