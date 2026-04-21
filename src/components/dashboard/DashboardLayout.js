// src/components/dashboard/DashboardLayout.js  (UPDATED with RBAC)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import { PlanProvider } from "@/contexts/PlanContext";
import { TenantRBACProvider } from "@/contexts/TenantRBACContext";
import Sidebar from "./Sidebar";
import { Toaster } from "react-hot-toast";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, loadingUser, requiresOnboarding, tenants, activeTenant } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false); 

  useBlockBackNavigation(!!user);

  useEffect(() => {
  if (loadingUser || !user || !tenants?.length) return;

  const active = tenants.find(t => t.id === activeTenant) || tenants[0];

  if (active?.role !== "owner" && active?.role !== "admin") {
    router.replace("/provider");
  } else {
    setRoleChecked(true);
  }

  }, [loadingUser, user, tenants, activeTenant, router]);


  

  // Onboarding guard
  useEffect(() => {
    if (!requiresOnboarding || !tenants?.length) return;
    const active = tenants.find((t) => t.id === activeTenant) || tenants[0];
    router.replace(`/auth/onboarding?step=${active?.onboarding_step || 1}`);
  }, [requiresOnboarding, tenants, activeTenant, router]);


  // 🚨 BLOCK UI RENDER
  if (loadingUser || !roleChecked) {
    return null; // ❌ NO UI FLASH
  }

  if (loadingUser || requiresOnboarding) return null;

  return (
    <PlanProvider>
      {/* ── TenantRBACProvider wraps everything inside PlanProvider ── */}
      <TenantRBACProvider>
        <div className="flex h-screen bg-background">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <div className="flex-1 flex flex-col overflow-hidden">
            <Topbar setSidebarOpen={setSidebarOpen} />
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
              {children}
              <Toaster position="top-right" />
            </main>
          </div>

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </div>
      </TenantRBACProvider>
    </PlanProvider>
  );
}