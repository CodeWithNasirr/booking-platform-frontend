// app/provider/layout.js - Keep this simple or remove if using DashboardLayout
export const metadata = {
  title: 'Provider Dashboard',
  description: 'Service Provider Panel',
};

import { AppProvider } from "@/contexts/AppContext";
import { TenantRBACProvider } from "@/contexts/TenantRBACContext";

export default function ProviderLayout({ children }) {
  return (
    <AppProvider>
      <TenantRBACProvider>
        {children}
      </TenantRBACProvider>
    </AppProvider>
  );
}