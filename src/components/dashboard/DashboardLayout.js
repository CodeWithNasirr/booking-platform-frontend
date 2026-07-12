// src/components/dashboard/DashboardLayout.js  (UPDATED with RBAC)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import { PlanProvider } from "@/contexts/PlanContext";
import { UpgradeProvider } from "@/contexts/UpgradeContext";
import { TenantRBACProvider } from "@/contexts/TenantRBACContext";
import Sidebar from "./Sidebar";
import { Toaster } from "react-hot-toast";
import Topbar from "./Topbar";
import { ImpersonationBanner } from "@/components/superadmin/ImpersonateButton";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
export default function DashboardLayout({ children }) {
  console.log("DashboardLayout mounted");
  const router = useRouter();
  const { user, loadingUser, requiresOnboarding, tenants, activeTenant,isRTL } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false); 

  useBlockBackNavigation(!!user);

  useEffect(() => {

  // still loading auth
  if (loadingUser) return;

  // no user → stop blocking
  if (!user) {
    setRoleChecked(true);
    return;
  }

  // no tenants yet → stop blocking
  if (!tenants?.length) {
    setRoleChecked(true);
    return;
  }

  const active =
    tenants.find(t => t.id === activeTenant)
    || tenants[0];

  console.log("TENANTS:", tenants);
  console.log("ACTIVE TENANT:", activeTenant);
  console.log("ACTIVE:", active);

  const roleRedirectMap = {
    owner: "/dashboard",
    admin: "/dashboard",
    sub_admin: "/dashboard",
    provider: "/provider",
    staff: "/dashboard",
  };

  const targetRoute =
    roleRedirectMap[active?.role];

  if (!targetRoute) {
    setRoleChecked(true);
    return;
  }

  if (targetRoute !== "/dashboard") {
    router.replace(targetRoute);
    return;
  }

  setRoleChecked(true);

}, [
  loadingUser,
  user,
  tenants,
  activeTenant,
  router
]);




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
       <UpgradeProvider>
        <div
          className={`flex h-screen bg-background ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <div className="flex-1 flex flex-col overflow-hidden">
            <ImpersonationBanner />
            <AnnouncementBanner />
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
       </UpgradeProvider>
      </TenantRBACProvider>
    </PlanProvider>
  );
}