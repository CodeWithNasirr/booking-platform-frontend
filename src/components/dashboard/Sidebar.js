// src/components/dashboard/Sidebar.js
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { usePlan } from "@/contexts/PlanContext";
import { useTenantRBAC } from "@/contexts/TenantRBACContext";
import { useIntegrationStatus } from "@/app/dashboard/integrations/hooks/useIntegrationStatus";
import { useNotifications } from "@/contexts/NotificationsContext";
import SidebarIntegrationDot from "../shared/SidebarIntegrationDot";
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
  CreditCard,
  LifeBuoy,
  RotateCcw,
  FileText,
  RefreshCw,
} from "lucide-react";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, logout, isRTL, tenants, activeTenant, hasProviders } = useApp();
  const { hasFeature, loading: planLoading } = usePlan();
  const { canSeeSidebarItem, hasPermission, loading: rbacLoading } = useTenantRBAC();
  const canManageIntegrations = hasPermission("integrations.manage");

  const {
    getWarningsForFeature,
    loading: integrationLoading,
  } = useIntegrationStatus();

  // In-app unread counts (per sidebar category). Separate concept from the
  // integration warning dots above — both can show on the same menu item.
  const { byCategory, markCategoryRead } = useNotifications();

  // Sidebar menu key → notification category.
  const NOTIF_CATEGORY = {
    "tenant-bookings": "bookings",
    "tenant-orders": "orders",
    "tenant-custom-requests": "custom_requests",
    "tenant-support": "support",
  };

  const go = (page) => {
    // Deliberately opening a section clears ONLY that section's unread dot
    // (backend mark-read). A plain dashboard load never clears anything.
    const category = NOTIF_CATEGORY[page];
    if (category && (byCategory?.[category] || 0) > 0) {
      markCategoryRead(category);
    }

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
  {
    key: "tenant-dashboard",
    label: t("dashboard.title"),
    icon: LayoutDashboard,
  },
  {
    key: "tenant-services",
    label: t("tenant.services"),
    icon: Package,
  },
  {
    key: "tenant-providers",
    label: t("tenant.providers"),
    icon: Users,
    requiresProviders: true,
  },
  {
    key: "tenant-bookings",
    label: t("tenant.bookings"),
    icon: Calendar,
    integrationFeature: "online_booking",
  },
  {
    key: "tenant-orders",
    label: t("tenant.orders"),
    icon: ShoppingBag,
  },
  {
    key: "tenant-custom-requests",
    label: t("tenant.customRequests") || "Custom Requests",
    icon: FileText,
  },
  {
    key: "tenant-subscriptions",
    label: t("tenant.subscriptions") || "Subscriptions",
    icon: RefreshCw,
  },
  {
    key: "tenant-users",
    label: t("tenant.users"),
    icon: UsersRound,
    requiresProviders: true,
  },
  {
    key: "tenant-calendar",
    label: t("tenant.calendar"),
    icon: Calendar,
  },
  {
    key: "tenant-schedule",
    label: t("tenant.schedule"),
    icon: Calendar,
    requiresIndividual: true,
  },
  {
    key: "tenant-customers",
    label: t("tenant.customers"),
    icon: UsersRound,
  },
  {
    key: "tenant-finance",
    label: t("tenant.finance"),
    icon: DollarSign,
  },
  {
    key: "tenant-billing",
    label: t("tenant.billing"),
    icon: CreditCard,
  },
  {
    key: "tenant-website",
    label: t("tenant.website"),
    icon: Globe,
  },
  {
    key: "tenant-logs",
    label: t("tenant.logs"),
    icon: Globe,
  },
  {
    key: "tenant-refunds",
    label: t("tenant.refunds"),
    icon: RotateCcw,
  },
  {
    key: "tenant-analytics",
    label: t("tenant.analytics"),
    icon: BarChart3,
    featureCode: "analytics",
  },
  {
    key: "tenant-integrations",
    label: t("tenant.integrations"),
    icon: Zap,
  },
  {
    key: "tenant-support",
    label: t("tenant.support"),
    icon: LifeBuoy,
  },
  {
    key: "tenant-whatsapp",
    label: t("tenant.whatsapp"),
    icon: MessageCircle,
    integrationFeature: "whatsapp_notifications",
  },
  {
    key: "tenant-campaigns",
    label: t("tenant.campaigns"),
    icon: Send,
    integrationFeature: "whatsapp_notifications",
  },
  {
    key: "tenant-settings",
    label: t("tenant.settings"),
    icon: Settings,
  },
];

  // ── Four-layer gating: tenant type → plan → RBAC → (integration is visual only) ──
  // NOTE: RBAC is authoritative. While permissions are still loading we do
  // NOT fall back to "show everything" — that would leak unauthorized items
  // for a frame. The component renders a skeleton instead (see below).
  const visibleItems = menuItems.filter((item) => {
    if (item.requiresProviders && !hasProviders) return false;
    if (item.requiresIndividual && hasProviders) return false;

    if (item.featureCode) {
      if (planLoading) return true;
      if (!hasFeature(item.featureCode)) return false;
    }

    return canSeeSidebarItem(item.key);
  });

  // ── Resolve integration dot for a menu item ──
  const getIntegrationDot = (item) => {
    if (!item.integrationFeature || integrationLoading) return null;
     // 🚨 ADD THIS LINE
    if (!canManageIntegrations) return null;

    const warning = getWarningsForFeature(item.integrationFeature);
    if (!warning) return null;

    const missingNames = warning.missing
      ?.map((m) => m.label)
      .join(", ");

    return (
      <SidebarIntegrationDot
        severity={warning.severity}
        tooltip={missingNames ? `Requires: ${missingNames}` : warning.label}
      />
    );
  };

  // ── Resolve unread notification badge for a menu item ──
  // Distinct from the integration dot: this reflects new/unread items
  // (bookings, orders, custom requests, support) from the backend feed.
  const getNotificationBadge = (item) => {
    const category = NOTIF_CATEGORY[item.key];
    if (!category) return null;
    const count = byCategory?.[category] || 0;
    if (count <= 0) return null;
    return (
      <span
        className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#8B1E3F] text-white text-[10px] font-semibold flex items-center justify-center"
        title={`${count} new`}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const closedTransform = isRTL
  ? "translate-x-full"
  : "-translate-x-full";

  // While permissions are loading, render a neutral skeleton — never the
  // real menu. This is what prevents unauthorized items flashing for a
  // frame before RBAC resolves.
  if (rbacLoading) {
    return (
      <div
        className={`
          ${sidebarOpen ? "translate-x-0" : closedTransform}
          lg:translate-x-0
          fixed lg:relative inset-y-0
          ${isRTL ? "right-0 border-l" : "left-0 border-r"}
          z-50 w-64 bg-white shrink-0
          transition-transform duration-300
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-2 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </nav>
        </div>
      </div>
    );
  }

  return (
   <div
      className={`
        ${sidebarOpen ? "translate-x-0" : closedTransform}
        lg:translate-x-0
        fixed lg:relative inset-y-0
        ${isRTL ? "right-0 border-l" : "left-0 border-r"}
        z-50 w-64 bg-white shrink-0
        transition-transform duration-300
      `}
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

            const dot = getIntegrationDot(item);
            const badge = getNotificationBadge(item);

            return (
              <button
                key={item.key}
                onClick={() => {
                  go(item.key);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 ${isRTL ? "flex-row-reverse text-right" : "" } px-4 py-3 rounded-xl transition-all
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
                <span className="flex-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                  {item.label}
                </span>
                {(badge || dot) && (
                  <span className={`flex items-center gap-1.5 ${isRTL ? "mr-auto" : "ml-auto"}`}>
                    {badge}
                    {dot}
                  </span>
                )}
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
            className={`w-full flex items-center gap-3 ${isRTL ? "flex-row-reverse text-right" : ""} px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all`}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}