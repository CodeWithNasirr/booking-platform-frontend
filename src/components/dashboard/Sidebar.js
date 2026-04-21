// src/components/dashboard/Sidebar.js
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { usePlan } from "@/contexts/PlanContext";
import { useTenantRBAC } from "@/contexts/TenantRBACContext";
import {
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  UsersRound,
  DollarSign,
  Globe,
  BarChart3,
  Settings,
  Zap,
  LogOut,
  ShoppingBag,
  MessageCircle,
  Send,
} from "lucide-react";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, logout, isRTL, tenants, activeTenant, hasProviders } = useApp();
  const { hasFeature, loading: planLoading } = usePlan();
  const { canSeeSidebarItem, loading: rbacLoading } = useTenantRBAC();

  const go = (page) => {
    if (page === "tenant-dashboard") {
      router.push("/dashboard");
      return;
    }

    if (page === "tenant-website") {
      const tenant = tenants.find((t) => t.id === activeTenant) || tenants[0];
      if (!tenant?.primary_domain?.domain) return;
      const domain = tenant.primary_domain.domain;
      document.cookie = `active_tenant_domain=${domain}; path=/`;
      router.push(`/tenant-site/editor?domain=${domain}`);
      return;
    }

    router.push(`/dashboard/${page.replace("tenant-", "")}`);
  };

  const menuItems = [
    { key: "tenant-dashboard", label: t("dashboard.title"), icon: LayoutDashboard },
    { key: "tenant-services", label: t("tenant.services"), icon: Package },
    {
      key: "tenant-providers",
      label: t("tenant.providers"),
      icon: Users,
      requiresProviders: true, // ← Only show for business tenants
    },
    { key: "tenant-bookings", label: t("tenant.bookings"), icon: Calendar },
    { key: "tenant-orders", label: "Orders", icon: ShoppingBag },
    {
      key: "tenant-users",
      label: "Team Members",
      icon: UsersRound,
      requiresProviders: true, // ← Only show for business tenants
    },
    { key: "tenant-calendar", label: t("tenant.calendar"), icon: Calendar },
    {
      key: "tenant-schedule",
      label: t("tenant.mySchedule") || "My Schedule",
      icon: Calendar,
      requiresIndividual: true, // ← Only show for individual owners
    },
    { key: "tenant-customers", label: t("tenant.customers"), icon: UsersRound },
    { key: "tenant-finance", label: t("tenant.finance"), icon: DollarSign },
    { key: "tenant-website", label: t("tenant.website"), icon: Globe },
    {
      key: "tenant-analytics",
      label: t("tenant.analytics"),
      icon: BarChart3,
      featureCode: "analytics",
    },
    { key: "tenant-integrations", label: t("tenant.integrations"), icon: Zap },
    { key: "tenant-whatsapp", label: "Manage WhatsApp", icon: MessageCircle },
    { key: "tenant-campaigns", label: "Campaigns", icon: Send },
    { key: "tenant-settings", label: t("tenant.settings"), icon: Settings },
  ];

  // ── Three-layer gating: tenant type + plan features + RBAC ──
  const visibleItems = menuItems.filter((item) => {
    // 0. Tenant type gate (individual vs business)
    if (item.requiresProviders && !hasProviders) return false;
    if (item.requiresIndividual && hasProviders) return false;

    // 1. Plan feature gate
    if (item.featureCode) {
      if (planLoading) return true;
      if (!hasFeature(item.featureCode)) return false;
    }

    // 2. RBAC permission gate
    if (rbacLoading) return true;
    if (!canSeeSidebarItem(item.key)) return false;

    return true;
  });

  return (
    <div
      className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0 fixed lg:static inset-y-0 ${isRTL ? "right-0" : "left-0"}
      z-50 w-64 bg-white border-gray-200 ${isRTL ? "border-l" : "border-r"}
      transition-transform duration-300`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#A8325A] flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {hasProviders ? "Business Admin" : "Dashboard"}
              </div>
              <div className="text-xs text-gray-600">
                {hasProviders ? "Business Manager" : "Manage your business"}
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const route =
              item.key === "tenant-dashboard"
                ? "/dashboard"
                : `/dashboard/${item.key.replace("tenant-", "")}`;

            const isActive =
              item.key === "tenant-dashboard"
                ? pathname === "/dashboard"
                : pathname === route || pathname.startsWith(route + "/");

            return (
              <button
                key={item.key}
                onClick={() => {
                  go(item.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${
                    isActive
                      ? "bg-rose-50 text-[#8B1E3F]"
                      : "text-gray-700 hover:bg-rose-50/60 hover:text-[#8B1E3F]"
                  }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-[#8B1E3F]" : "text-gray-500"
                  }`}
                />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
              text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}