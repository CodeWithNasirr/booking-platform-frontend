"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children, pageName = "Dashboard" }) {
  const router = useRouter();
  const { user, loadingUser, requiresOnboarding, tenants, activeTenant } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false); 

  useBlockBackNavigation(!!user);

  useEffect(() => {
    if (loadingUser || !user || !tenants?.length) return;

    const active = tenants.find(t => t.id === activeTenant) || tenants[0];

    // 🚨 BLOCK NON-PROVIDER
    if (active?.role !== "provider") {
      router.replace("/dashboard"); // ✅ better redirect
    } else {
      setRoleChecked(true); // ✅ allow render
    }

  }, [loadingUser, user, tenants, activeTenant, router]);



  // Onboarding guard
  useEffect(() => {
    if (!requiresOnboarding || !tenants?.length) return;
    const active = tenants.find(t => t.id === activeTenant) || tenants[0];
    router.replace(`/auth/onboarding?step=${active?.onboarding_step || 1}`);
  }, [requiresOnboarding, tenants, activeTenant, router]);


  // 🚨 BLOCK UI RENDER
  if (loadingUser || !roleChecked) {
    return null; // ❌ NO UI FLASH
  }

  if (loadingUser || requiresOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f9fafb]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]" />
      </div>
    );
  }

  return (
    <div className="bg-[#f9fafb] flex min-h-screen w-full">
      {/* Sidebar with Animation */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden w-full">
        <TopBar setSidebarOpen={setSidebarOpen} pageName={pageName} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:pt-[24px] lg:px-[24px] lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}