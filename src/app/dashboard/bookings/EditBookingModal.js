// src/app/dashboard/bookings/EditBookingModal.js
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useBookingSlots } from './hooks/useBookings';
import { getServices } from './lib/api/services';
import { getProviders } from './lib/api/providers';
import {
  X,
  Loader2,
  User,
  Briefcase,
  Calendar,
  Clock,
  Save,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function EditBookingModal({ booking, onSave, onClose }) {
  const { t, isRTL, activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  // Form state - only editable fields
  // Note: customer_name, customer_email, customer_phone are READ-ONLY from backend
  const [activeTab, setActiveTab] = useState('service');
  const [form, setForm] = useState({
    service: '',
    provider: '',
    scheduled_date: '',
    scheduled_time: '',
    customer_notes: '',
  });

  // Customer info (read-only display from BookingDetailSerializer)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  
  // Data state
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Track original values for comparison
  const [originalForm, setOriginalForm] = useState(null);

  // Slots
  const { slots, loading: loadingSlots } = useBookingSlots(
    form.service,
    form.scheduled_date,
    form.provider || null
  );

  // Initialize form with booking data
  useEffect(() => {
    if (booking) {
      // Editable fields only
      const initialForm = {
        service: booking.service?.id || booking.service || '',
        provider: booking.provider?.id || booking.provider || '',
        scheduled_date: booking.scheduled_date || '',
        scheduled_time: booking.scheduled_time?.slice(0, 5) || '', // Format HH:mm
        customer_notes: booking.customer_notes || '',
      };
      setForm(initialForm);
      setOriginalForm(initialForm);

      // Read-only customer info (from BookingDetailSerializer)
      setCustomerInfo({
        name: booking.customer_name || '',
        email: booking.customer_email || '',
        phone: booking.customer_phone || '',
      });
    }
  }, [booking]);

  // Check for changes
  useEffect(() => {
    if (originalForm) {
      const changed = Object.keys(form).some(
        (key) => form[key] !== originalForm[key]
      );
      setHasChanges(changed);
    }
  }, [form, originalForm]);

  // Fetch services and providers
  useEffect(() => {
    if (!tenantId) return;
    
    const fetchData = async () => {
      try {
        const [servicesData, providersData] = await Promise.all([
          getServices(tenantId),
          getProviders(tenantId),
        ]);
        setServices(servicesData.results || servicesData || []);
        setProviders(providersData.results || providersData || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [tenantId]);

  // Tabs configuration
  const tabs = [
    { key: 'customer', label: t('bookings.modal.edit.tabs.customer') || 'Customer', icon: User },
    { key: 'service', label: t('bookings.modal.edit.tabs.service') || 'Service', icon: Briefcase },
    { key: 'schedule', label: t('bookings.modal.edit.tabs.schedule') || 'Schedule', icon: Calendar },
  ];

  // Update form field
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
    
    // Reset time when date changes
    if (field === 'scheduled_date') {
      setForm((prev) => ({ ...prev, scheduled_time: '' }));
    }
    
    // Reset provider when service changes
    if (field === 'service') {
      setForm((prev) => ({ ...prev, provider: '', scheduled_time: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.service) {
      newErrors.service = t('bookings.validation.serviceRequired') || 'Service is required';
    }
    if (!form.scheduled_date) {
      newErrors.scheduled_date = t('bookings.validation.dateRequired') || 'Date is required';
    }
    if (!form.scheduled_time) {
      newErrors.scheduled_time = t('bookings.validation.timeRequired') || 'Time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit - only send changed fields that backend accepts
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Build update payload with only changed fields
      // Backend accepts: service, provider, scheduled_date, scheduled_time, customer_notes
      const updateData = {};
      
      if (form.service !== originalForm.service) {
        updateData.service = form.service;
      }
      if (form.provider !== originalForm.provider) {
        updateData.provider = form.provider || null;
      }
      if (form.scheduled_date !== originalForm.scheduled_date) {
        updateData.scheduled_date = form.scheduled_date;
      }
      if (form.scheduled_time !== originalForm.scheduled_time) {
        updateData.scheduled_time = form.scheduled_time;
      }
      if (form.customer_notes !== originalForm.customer_notes) {
        updateData.customer_notes = form.customer_notes;
      }
      
      await onSave(updateData);
    } catch (err) {
      console.error('Failed to update booking:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Get selected service
  const selectedService = services.find((s) => s.id === form.service);

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  // Get available slots for display - include current time slot
  const getDisplaySlots = () => {
    const available = slots.filter((slot) => slot.available);
    
    // Always include current scheduled time if editing same date
    if (originalForm?.scheduled_time && form.scheduled_date === originalForm.scheduled_date) {
      const currentTime = originalForm.scheduled_time.slice(0, 5);
      const currentTimeExists = available.some((slot) => slot.time === currentTime);
      if (!currentTimeExists) {
        available.unshift({
          time: currentTime,
          available: true,
          current: true,
        });
      }
    }
    
    return available;
  };

  const availableSlots = getDisplaySlots();

  // Filter providers by selected service
  const filteredProviders = form.service
    ? providers.filter((provider) => {
        const providerServices = provider.services || [];
        return providerServices.some((s) => s.id === form.service) || providerServices.length === 0;
      })
    : providers;

  // Check if booking can be edited (not completed/cancelled)
  const isEditable = !['completed', 'cancelled', 'refunded'].includes(booking?.status);

  if (!isEditable) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">
              {t('bookings.modal.edit.cannotEdit') || 'Cannot Edit Booking'}
            </h3>
          </div>
          <p className="text-gray-600 mb-6">
            {t('bookings.modal.edit.cannotEditDescription') || 
              'This booking cannot be edited because it has been completed, cancelled, or refunded.'}
          </p>
          <button
            onClick={onClose}
            className="w-full px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#8B1E3F]/80 hover:opacity-90 transition font-medium"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    );
  }

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
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('bookings.modal.edit.title') || 'Edit Booking'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {booking?.booking_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 px-1 font-medium transition-all flex items-center gap-2 ${
                    isRTL ? 'flex-row-reverse' : ''
                  } ${
                    activeTab === tab.key
                      ? 'text-[#8B1E3F] border-b-2 border-[#8B1E3F]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#8B1E3F]" />
            </div>
          ) : (
            <>
              {/* Customer Tab - READ ONLY */}
              {activeTab === 'customer' && (
                <div className="space-y-4">
                  {/* Read-only notice */}
                  <div className={`flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <span>{t('bookings.modal.edit.customerReadOnly') || 'Customer information cannot be changed after booking is created.'}</span>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                      {t('bookings.modal.edit.customerName') || 'Customer Name'}
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      disabled
                      className={`w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed ${isRTL ? 'text-right' : ''}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                      {t('bookings.modal.edit.email') || 'Email'}
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                      {t('bookings.modal.edit.phone') || 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* Service Tab */}
              {activeTab === 'service' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                      {t('bookings.modal.edit.selectService') || 'Service'} *
                    </label>
                    <select
                      value={form.service}
                      onChange={(e) => updateField('service', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent bg-white ${
                        errors.service ? 'border-red-500' : 'border-gray-300'
                      } ${isRTL ? 'text-right' : ''}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <option value="">{t('bookings.modal.edit.chooseService') || 'Choose a service'}</option>
                      {services.map((service) => {
                        const name = typeof service.name === 'object'
                          ? service.name.en || Object.values(service.name)[0]
                          : service.name;
                        const price = service.base_price || 0;
                        const duration = service.duration_minutes || 0;
                        return (
                          <option key={service.id} value={service.id}>
                            {name} - {duration}min - ${price}
                          </option>
                        );
                      })}
                    </select>
                    {errors.service && (
                      <p className="mt-1 text-sm text-red-500">{errors.service}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                      {t('bookings.modal.edit.selectProvider') || 'Provider'}
                    </label>
                    <select
                      value={form.provider}
                      onChange={(e) => updateField('provider', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent bg-white ${isRTL ? 'text-right' : ''}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <option value="">{t('bookings.modal.edit.anyProvider') || 'Any Available Provider'}</option>
                      {filteredProviders.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.user?.full_name || provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Service Summary */}
                  {selectedService && (
                    <div className="p-4 bg-[#8B1E3F]/5 rounded-xl border border-[#8B1E3F]/20">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {typeof selectedService.name === 'object'
                          ? selectedService.name.en
                          : selectedService.name}
                      </h4>
                      <div className={`flex items-center gap-4 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Clock className="w-4 h-4" />
                          {selectedService.duration_minutes} {t('bookings.time.minutes') || 'min'}
                        </span>
                        <span>${selectedService.base_price}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                      {t('bookings.modal.edit.notes') || 'Customer Notes'}
                    </label>
                    <textarea
                      placeholder={t('bookings.modal.edit.notesPlaceholder') || 'Any special requests or notes...'}
                      value={form.customer_notes}
                      onChange={(e) => updateField('customer_notes', e.target.value)}
                      rows={3}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent resize-none ${isRTL ? 'text-right' : ''}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                      {t('bookings.modal.edit.date') || 'Date'} *
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={form.scheduled_date}
                      onChange={(e) => updateField('scheduled_date', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent ${
                        errors.scheduled_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.scheduled_date && (
                      <p className="mt-1 text-sm text-red-500">{errors.scheduled_date}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : ''}`}>
                      {t('bookings.modal.edit.time') || 'Time'} *
                    </label>
                    
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-[#8B1E3F]" />
                      </div>
                    ) : form.scheduled_date && availableSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">
                        {t('bookings.modal.edit.noSlots') || 'No available slots for this date'}
                      </p>
                    ) : form.scheduled_date ? (
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => updateField('scheduled_time', slot.time)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition relative ${
                              form.scheduled_time === slot.time
                                ? 'bg-[#8B1E3F] text-white'
                                : slot.current
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-2 border-blue-300'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {slot.time}
                            {slot.current && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {t('bookings.modal.edit.selectDateFirst') || 'Please select a date first'}
                      </p>
                    )}
                    
                    {errors.scheduled_time && (
                      <p className="mt-1 text-sm text-red-500">{errors.scheduled_time}</p>
                    )}
                  </div>

                  {/* Current Schedule Info */}
                  {originalForm && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {t('bookings.modal.edit.currentSchedule') || 'Current Schedule'}
                      </h4>
                      <div className={`flex items-center gap-4 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Calendar className="w-4 h-4" />
                          {originalForm.scheduled_date}
                        </span>
                        <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Clock className="w-4 h-4" />
                          {originalForm.scheduled_time}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t border-gray-200 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Changes indicator */}
          <div className="text-sm text-gray-500">
            {hasChanges && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                {t('bookings.modal.edit.unsavedChanges') || 'Unsaved changes'}
              </span>
            )}
          </div>
          
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              {t('bookings.modal.edit.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !hasChanges}
              className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#8B1E3F]/80 hover:opacity-90 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('bookings.loading') || 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('bookings.modal.edit.submit') || 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}