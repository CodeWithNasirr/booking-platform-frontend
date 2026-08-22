"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import AuthGate from "@/components/auth/AuthGate";
// import useRenderTrace from "@/lib/useRenderTrace";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

/**
 * Provider dashboard chrome.
 *
 * Mirror of the tenant DashboardLayout: auth + onboarding via <AuthGate>,
 * and a single role redirect — a non-provider who lands here is sent to
 * /dashboard. Spinner while deciding, never a blank `null`.
 */
export default function DashboardLayout({ children, pageName = "Dashboard" }) {
  const router = useRouter();
  const { user, role, authReady } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // useRenderTrace("DashboardLayout(provider)", { role, authReady, pageName });

  useBlockBackNavigation(!!user);

  // Single role redirect: non-providers belong in the staff dashboard.
  const wrongArea = role !== null && role !== "provider";
  useEffect(() => {
    if (!authReady || !user) return;
    if (wrongArea) router.replace("/dashboard");
  }, [authReady, user, wrongArea, router]);

  return (
    <AuthGate>
      {wrongArea ? (
        <div className="flex h-screen w-full items-center justify-center bg-[#f9fafb]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]" />
        </div>
      ) : (
        // Same context stack as the tenant dashboard so the provider panel gets
        // the plan-feature source of truth (PlanProvider) and the shared
        // notification feed (NotificationsProvider → topbar bell + sidebar
        // badges). The feed is the tenant's, RBAC-scoped to what this provider
        // user can access (bookings/orders/custom_requests).
        <PlanProvider>
          <NotificationsProvider>
            <div className="bg-[#f9fafb] flex min-h-screen w-full">
              <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

              {sidebarOpen && (
                <div
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                  onClick={() => setSidebarOpen(false)}
                />
              )}

              <div className="flex-1 flex flex-col min-h-screen overflow-hidden w-full">
                <TopBar setSidebarOpen={setSidebarOpen} pageName={pageName} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:pt-[24px] lg:px-[24px] lg:pb-8">
                  {children}
                </main>
              </div>
            </div>
          </NotificationsProvider>
        </PlanProvider>
      )}
    </AuthGate>
  );
}
