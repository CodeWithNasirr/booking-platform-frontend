// src/components/dashboard/DashboardLayout.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import { PlanProvider } from "@/contexts/PlanContext";
import { UpgradeProvider } from "@/contexts/UpgradeContext";
import { TenantRBACProvider } from "@/contexts/TenantRBACContext";
import AuthGate from "@/components/auth/AuthGate";
// import useRenderTrace from "@/lib/useRenderTrace";
import Sidebar from "./Sidebar";
import { Toaster } from "react-hot-toast";
import Topbar from "./Topbar";
import { ImpersonationBanner } from "@/components/superadmin/ImpersonateButton";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";

/**
 * Tenant (staff) dashboard chrome.
 *
 * Auth + onboarding are handled once by <AuthGate>. The only role concern
 * left here is a single redirect: a `provider` who lands in the staff area
 * is sent to /provider. Everything renders a spinner while deciding — never
 * a blank `null` — so there is no hang and no redirect race.
 */
export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, role, authReady, isRTL } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // useRenderTrace("DashboardLayout(tenant)", { role, authReady });

  useBlockBackNavigation(!!user);

  // Single role redirect: providers don't belong in the staff dashboard.
  const isProvider = role === "provider";
  useEffect(() => {
    if (!authReady || !user) return;
    if (isProvider) router.replace("/provider");
  }, [authReady, user, isProvider, router]);

  return (
    <AuthGate>
      <PlanProvider>
        <TenantRBACProvider>
          <UpgradeProvider>
            {isProvider ? (
              // Redirecting to /provider — show a spinner, not the chrome.
              <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[color:var(--brand-primary,#800020)]" />
              </div>
            ) : (
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
            )}
          </UpgradeProvider>
        </TenantRBACProvider>
      </PlanProvider>
    </AuthGate>
  );
}
