// app/provider/layout.js - Keep this simple or remove if using DashboardLayout
export const metadata = {
  title: 'Provider Dashboard',
  description: 'Service Provider Panel',
};

import ProviderStatusGuard from '@/components/provider/ProviderStatusGuard';
import { TenantRBACProvider } from "@/contexts/TenantRBACContext";
export default function ProviderLayout({ children }) {
  return (
    <TenantRBACProvider>
    <ProviderStatusGuard>
      {children}
    </ProviderStatusGuard>
    </TenantRBACProvider>
  );
}