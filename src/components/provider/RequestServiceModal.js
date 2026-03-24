'use client';

import { useState } from 'react';
import { X, Send, Loader2, AlertCircle, Check } from 'lucide-react';

import { useServiceRequests } from '@/app/provider/services/hooks/useProviderServices';

export default function RequestServiceModal({ availableServices, onClose }) {
  const [selectedService, setSelectedService] = useState('');
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Use hook that internally manages tenant from useApp
  const { submitRequest, loading: submitting } = useServiceRequests();

  // FIX: Ensure availableServices is always an array before filtering
  const safeAvailableServices = availableServices || [];
  
  // Filter out services that already have pending requests
  const requestableServices = safeAvailableServices.filter(s => 
    s && (s.service_type === 'digital' || s.order_type === 'order')
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) return;

    setSubmitError(null);

    try {
      const success = await submitRequest(selectedService, message);
      if (success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[20px] w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-[20px] font-bold text-[#101828]">Request New Service</h2>
            <p className="text-[14px] text-[#4a5565] mt-1">
              Request access to deliver a new service
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-[#364153]" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {submitSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-[#101828]">Request Submitted!</h3>
              <p className="text-[14px] text-[#4a5565] text-center mt-2">
                Your request has been sent for approval
              </p>
            </div>
          ) : (
            <>
              {/* Service Selection */}
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-[#101828]">
                  Select Service <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  required
                  className="w-full h-[44px] px-4 rounded-[12px] border border-[#e5e7eb] bg-white text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all"
                >
                  <option value="">Choose a service...</option>
                  {requestableServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {(service.name?.en || service.name || 'Unnamed')} - ${service.base_price || 0}
                    </option>
                  ))}
                </select>
                {requestableServices.length === 0 && (
                  <p className="text-[12px] text-amber-600">
                    No services available for request. All services are either enabled or already requested.
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-[#101828]">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain why you want to deliver this service..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-[12px] border border-[#e5e7eb] bg-white text-[14px] text-[#101828] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all resize-none"
                />
              </div>

              {/* Error Display */}
              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[10px] text-red-600 text-[14px]">
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-[44px] rounded-[12px] border border-[#e5e7eb] text-[#4a5565] text-[14px] font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedService || submitting || requestableServices.length === 0}
                  className="flex-1 h-[44px] rounded-[12px] bg-gradient-to-b from-[#800020] to-[#600018] text-white text-[14px] font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}