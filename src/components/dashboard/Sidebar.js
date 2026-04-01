"use client";

import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { usePlan } from "@/contexts/PlanContext";
import {
  LayoutDashboard,
  Package,
  Users,
  Calendar,
  CalendarDays,
  CalendarCheck,
  LogOut,
  Clock,
  ShoppingBag,
  UsersRound,
  DollarSign,
  Globe,
  BarChart3,
  Settings,
  MessageSquare,
  Zap,
  ExternalLink,
} from "lucide-react";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, logout, isRTL, tenants, activeTenant } = useApp();
  const { hasFeature, loading: planLoading } = usePlan();

  const tenant = tenants.find(t => t.id === activeTenant);
  
  const go = (page) => {

    // Dashboard should go to /dashboard (not /dashboard/dashboard)
    if (page === "tenant-dashboard") {
      router.push("/dashboard");
      return;
    }


    if (page === "tenant-website") {
      const tenant = tenants.find(t => t.id === activeTenant) || tenants[0];
      if (!tenant?.primary_domain?.domain) return;

      const domain = tenant.primary_domain.domain;
      document.cookie = `active_tenant_domain=${domain}; path=/`;
      router.push(`/tenant-site/editor?domain=${domain}`);
      return;
    }

    // router.push("/dashboard/" + page.replace("tenant-", ""));
    // All other tenant pages
    router.push(`/dashboard/${page.replace("tenant-", "")}`);
  };

  const menuItems = [

    { key: "tenant-dashboard", label: t("dashboard.title"), icon: LayoutDashboard },
    { key: "tenant-services", label: t("tenant.services"), icon: Package },
 

    ...(tenant?.has_providers
      ? [{ key: "tenant-providers", label: t("tenant.providers"), icon: Users }]
      : [{ key: "tenant-schedule", label: t("tenant.mySchedule") || "My Schedule", icon: Clock  }]
    ),

    // { key: "tenant-providers", label: t("tenant.providers"), icon: Users },


    { key: "tenant-bookings", label: t("tenant.bookings"), icon: CalendarCheck  },
    { key: "tenant-orders", label: "Orders", icon: ShoppingBag },
    { key: "tenant-calendar", label: t("tenant.calendar"), icon: CalendarDays  },
    { key: "tenant-customers", label: t("tenant.customers"), icon: UsersRound },
    { key: "tenant-finance", label: t("tenant.finance"), icon: DollarSign },
    { key: "tenant-website", label: t("tenant.website"), icon: Globe },
    // ── Feature-gated items ──
    {
      key: "tenant-analytics",
      label: t("tenant.analytics"),
      icon: BarChart3,
      featureCode: "analytics",  // <-- gated
    },
    // { key: "tenant-analytics", label: t("tenant.analytics"), icon: BarChart3 },
    { key: "tenant-chat", label: t("tenant.chat"), icon: MessageSquare },
    { key: "tenant-integrations", label: t("tenant.integrations"), icon: Zap },
    { key: "tenant-marketing-integrations", label: t("tenant.marketing"), icon: ExternalLink },
    { key: "tenant-settings", label: t("tenant.settings"), icon: Settings },

  ];
  
  // Filter items based on plan features
  const visibleItems = menuItems.filter((item) => {
    if (!item.featureCode) return true; // no gate = always visible
    if (planLoading) return true;        // show while loading
    return hasFeature(item.featureCode);
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
              <div className="font-semibold text-gray-900">Tenant Admin</div>
              <div className="text-xs text-gray-600">Business Manager</div>
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
