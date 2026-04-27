// src/components/dashboard/Topbar.js
"use client";

import { Menu, Bell } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import IntegrationWarningBanner from "@/components/shared/IntegrationWarningBanner";
import { useIntegrationStatus } from "@/app/dashboard/integrations/hooks/useIntegrationStatus";
import { useTenantRBAC } from "@/contexts/TenantRBACContext";

export default function Topbar({ setSidebarOpen }) {
  const { tenants } = useApp();
  const { warnings, loading } = useIntegrationStatus();
  const { hasPermission } = useTenantRBAC();

  const canManageIntegrations = hasPermission("integrations.manage");

  return (
    <div className="bg-background border-b border-border">
      {/* ── Main topbar row ── */}
      <div className="px-6 py-4 flex justify-between items-center">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
          <Menu />
        </button>

        <div className="text-sm text-muted-foreground">
          Today: {new Date().toLocaleDateString()}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Bell className="w-5 h-5 text-muted-foreground" />

          <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2">
            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center">
              {tenants[0]?.name?.charAt(0)}
            </div>
            <span className="hidden md:block text-sm font-medium">
              {tenants[0]?.name}
            </span>
          </div>
        </div>
      </div>

      {/* ── Integration warning banner ── */}
     {canManageIntegrations && (
      <IntegrationWarningBanner
        warnings={warnings}
        loading={loading}
        panel="tenant"
      />
    )}
    </div>
  );
}