"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, LogOut } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useProviderStatus } from './useProviderStatus';

/**
 * ProviderStatusGuard - Blocks access when provider is deactivated
 * Use this in layout.js or page.js to protect all provider routes
 */
export default function ProviderStatusGuard({ children }) {
  const router = useRouter();
  const { logout } = useApp();
  const { provider, loading, error } = useProviderStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020]" />
      </div>
    );
  }

  // 🔥 PROVIDER IS DEACTIVATED - Show blocked screen
  if (provider && !provider.is_active) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-600" size={40} />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Account Deactivated
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your provider account has been deactivated by the administrator. 
            You cannot access the provider panel or manage services.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> Any existing bookings will still be honored. 
              Please contact support if you believe this is an error.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#800020] text-white rounded-xl font-medium hover:bg-[#600018] transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
            
            <a 
              href="mailto:support@example.com"
              className="w-full py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 🔥 PROVIDER IS ACTIVE - Show normal content (with sidebar)
  return children;
}
