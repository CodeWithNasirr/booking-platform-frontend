// app/provider/layout.js - Keep this simple or remove if using DashboardLayout
export const metadata = {
  title: 'Provider Dashboard',
  description: 'Service Provider Panel',
};

import ProviderStatusGuard from '@/components/provider/ProviderStatusGuard';

export default function ProviderLayout({ children }) {
  return (
    <ProviderStatusGuard>
      {children}
    </ProviderStatusGuard>
  );
}