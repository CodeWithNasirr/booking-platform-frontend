// src/app/dashboard/bookings/NewBookingModal.js
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
  CheckCircle,
} from 'lucide-react';

export default function NewBookingModal({ onSave, onClose }) {
  const { t, isRTL, activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  // Form state
  const [activeTab, setActiveTab] = useState('customer');
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service: '',
    provider: '',
    scheduled_date: '',
    scheduled_time: '',
    customer_notes: '',
  });
  
  // Data state
  const [services, setServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Slots
  const { slots, loading: loadingSlots } = useBookingSlots(
    form.service,
    form.scheduled_date,
    form.provider || null
  );

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
    { key: 'customer', label: t('bookings.modal.create.tabs.customer') || 'Customer', icon: User },
    { key: 'service', label: t('bookings.modal.create.tabs.service') || 'Service', icon: Briefcase },
    { key: 'details', label: t('bookings.modal.create.tabs.details') || 'Details', icon: Calendar },
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
    
    if (!form.customer_name.trim()) {
      newErrors.customer_name = t('bookings.validation.customerNameRequired') || 'Customer name is required';
    }
    if (!form.customer_email.trim()) {
      newErrors.customer_email = t('bookings.validation.emailRequired') || 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
      newErrors.customer_email = t('bookings.validation.emailInvalid') || 'Invalid email format';
    }
    if (!form.customer_phone.trim()) {
      newErrors.customer_phone = t('bookings.validation.phoneRequired') || 'Phone is required';
    }
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

  // Handle submit - format data for backend PublicBookingCreateSerializer
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Format data to match backend PublicBookingCreateSerializer
      const bookingData = {
        service: form.service,
        provider: form.provider || null,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        customer_notes: form.customer_notes || '',
      };
      
      await onSave(bookingData);
    } catch (err) {
      console.error('Failed to create booking:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Get selected service
  const selectedService = services.find((s) => s.id === form.service);

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  // Get available slots for display
  const availableSlots = slots.filter((slot) => slot.available);

  // Filter providers by selected service
  const filteredProviders = form.service
    ? providers.filter((provider) => {
        // Check if provider offers this service
        const providerServices = provider.services || [];
        return providerServices.some((s) => s.id === form.service) || providerServices.length === 0;
      })
    : providers;

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
            {t('bookings.modal.create.title') || 'Create New Booking'}
          </h2>
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
              {/* Customer Tab */}
              {activeTab === 'customer' && (
                <div className="space-y-4">
                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${
                        isRTL ? 'text-right' : ''
                      }`}
                    >
                      {t('bookings.modal.create.customerName') || 'Customer Name'} *
                    </label>
                    <input
                      type="text"
                      placeholder={t('bookings.modal.create.customerNamePlaceholder') || 'Enter customer name'}
                      value={form.customer_name}
                      onChange={(e) => updateField('customer_name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent ${
                        errors.customer_name ? 'border-red-500' : 'border-gray-300'
                      } ${isRTL ? 'text-right' : ''}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {errors.customer_name && (
                      <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${
                        isRTL ? 'text-right' : ''
                      }`}
                    >
                      {t('bookings.modal.create.email') || 'Email'} *
                    </label>
                    <input
                      type="email"
                      placeholder={t('bookings.modal.create.emailPlaceholder') || 'customer@example.com'}
                      value={form.customer_email}
                      onChange={(e) => updateField('customer_email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent ${
                        errors.customer_email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      dir="ltr"
                    />
                    {errors.customer_email && (
                      <p className="mt-1 text-sm text-red-500">{errors.customer_email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${
                        isRTL ? 'text-right' : ''
                      }`}
                    >
                      {t('bookings.modal.create.phone') || 'Phone'} *
                    </label>
                    <input
                      type="tel"
                      placeholder={t('bookings.modal.create.phonePlaceholder') || '+1 234 567 8900'}
                      value={form.customer_phone}
                      onChange={(e) => updateField('customer_phone', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent ${
                        errors.customer_phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      dir="ltr"
                    />
                    {errors.customer_phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.customer_phone}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Service Tab */}
              {activeTab === 'service' && (
                <div className="space-y-4">
                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${
                        isRTL ? 'text-right' : ''
                      }`}
                    >
                      {t('bookings.modal.create.selectService') || 'Select Service'} *
                    </label>
                    <select
                      value={form.service}
                      onChange={(e) => updateField('service', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent bg-white ${
                        errors.service ? 'border-red-500' : 'border-gray-300'
                      } ${isRTL ? 'text-right' : ''}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <option value="">{t('bookings.modal.create.chooseService') || 'Choose a service'}</option>
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
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${
                        isRTL ? 'text-right' : ''
                      }`}
                    >
                      {t('bookings.modal.create.selectProvider') || 'Select Provider'}
                    </label>
                    <select
                      value={form.provider}
                      onChange={(e) => updateField('provider', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent bg-white ${
                        isRTL ? 'text-right' : ''
                      }`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <option value="">{t('bookings.modal.create.anyProvider') || 'Any Available Provider'}</option>
                      {filteredProviders.map((provider) => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
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
                      <div className={`flex items-center gap-4 text-sm text-gray-600 ${
                        isRTL ? 'flex-row-reverse' : ''
                      }`}>
                        <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Clock className="w-4 h-4" />
                          {selectedService.duration_minutes} {t('bookings.time.minutes') || 'min'}
                        </span>
                        <span>
                          ${selectedService.base_price}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${
                        isRTL ? 'text-right' : ''
                      }`}
                    >
                      {t('bookings.modal.create.date') || 'Date'} *
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
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${
                        isRTL ? 'text-right' : ''
                      }`}
                    >
                      {t('bookings.modal.create.time') || 'Time'} *
                    </label>
                    
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-[#8B1E3F]" />
                      </div>
                    ) : form.scheduled_date && availableSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">
                        {t('bookings.modal.create.noSlots') || 'No available slots for this date'}
                      </p>
                    ) : form.scheduled_date ? (
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => updateField('scheduled_time', slot.time)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                              form.scheduled_time === slot.time
                                ? 'bg-[#8B1E3F] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {t('bookings.modal.create.selectDateFirst') || 'Please select a date first'}
                      </p>
                    )}
                    
                    {errors.scheduled_time && (
                      <p className="mt-1 text-sm text-red-500">{errors.scheduled_time}</p>
                    )}
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium text-gray-700 mb-2 ${
                        isRTL ? 'text-right' : ''
                      }`}
                    >
                      {t('bookings.modal.create.notes') || 'Notes'}
                    </label>
                    <textarea
                      placeholder={t('bookings.modal.create.notesPlaceholder') || 'Any special requests or notes...'}
                      value={form.customer_notes}
                      onChange={(e) => updateField('customer_notes', e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent resize-none ${
                        isRTL ? 'text-right' : ''
                      }`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              )}
            </>
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
            {t('bookings.modal.create.cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#8B1E3F]/80 hover:opacity-90 transition font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('bookings.loading') || 'Processing...'}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {t('bookings.modal.create.submit') || 'Create Booking'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}