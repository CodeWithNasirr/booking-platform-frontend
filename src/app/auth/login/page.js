// // app/login/page.js

"use client";

import { useState, useEffect } from 'react';
import { getDomainType } from '@/lib/domain';

// import TenantLogin from '@/components/auth/TenantLogin';
import TenantLogin from './TenantLogin';
import AdminLogin from './AdminLogin';

export default function LoginPage() {
  const [domainType, setDomainType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect domain type on mount (client-side only)
    setDomainType(getDomainType());
    setIsLoading(false);
  }, []);

  // Show loading state during hydration
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent via-background to-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render appropriate login UI
  return domainType === 'admin' ? <AdminLogin /> : <TenantLogin />;
}