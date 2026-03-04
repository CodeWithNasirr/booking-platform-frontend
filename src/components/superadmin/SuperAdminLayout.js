"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Globe,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  Bell,
  User,
  Home,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  ScrollText,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useApp } from "@/contexts/AppContext";

const SuperAdminLayout = ({ children, title, description, breadcrumbs = [] }) => {
  const { user, platform, loading, hasPermission, hasAnyPermission, logout } =  useSuperAdmin();
  
  const { t } = useApp();




  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const colors = {
    primary: "#8B1E3F",
    primaryLight: "#A63A5C",
    primaryDark: "#6B1631",
    primaryBg: "#FDF2F4",
    primaryHover: "#FCE8EC",
  };

  // ── Menu items with permission gating ────────────────────────
  const menuItems = [
    {
      key: "/superadmin/dashboard",
      label: t("superadmin.nav.dashboard"),

      icon: LayoutDashboard,
      visible: true, // everyone sees dashboard
    },
    {
      key: "/superadmin/tenants",
      label: t("superadmin.nav.tenants"),
      icon: Users,
      visible: hasPermission("tenants.view"),
    },
    {
      key: "/superadmin/billing",
      label: t("superadmin.nav.billing"),
      icon: CreditCard,
      visible: hasAnyPermission(["billing.view", "plans.view"]),
    },
    {
      key: "/superadmin/templates",
      label: t("superadmin.nav.templates"),
      icon: FileText,
      visible: hasPermission("templates.view"),
    },
    {
      key: "/superadmin/integrations",
      label: t("superadmin.nav.integrations"),
      icon: Settings,
      visible: hasPermission("system.manage_integrations"),
    },
    {
      key: "/superadmin/support",
    label: t("superadmin.nav.support"),
      icon: LifeBuoy,
      visible: hasPermission("tickets.view"),
    },
    {
      key: "/superadmin/sub-admins",
      label: t("superadmin.nav.subadmins"),
      icon: ShieldCheck,
      visible: hasPermission("employees.view"),
    },
   
    {
      key: "/superadmin/logs",
      label: t("superadmin.nav.logs"),
      icon: ScrollText,
      visible: hasPermission("system.view_logs"),
    },
    {
      key: "/superadmin/settings",
      label: t("superadmin.nav.settings"),
      icon: Settings,
      visible: hasAnyPermission(["system.view_settings", "system.manage_settings"]),
    },
  ];

  const isActive = (key) => pathname === key || pathname.startsWith(key + "/");

  const handleNavigation = (path) => {
    router.push(path);
    setSidebarOpen(false);
  };

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#8B1E3F]" />
          <span className="text-sm text-gray-500">{t("superadmin.layout.loading_platform")}
          </span>

        </div>
      </div>
    );
  }

  const displayName = user?.full_name || user?.email || "Admin";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = platform?.role_display || platform?.role || "Employee";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 shadow-lg lg:shadow-none`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <Link
              href="/superadmin/dashboard"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`,
                }}
              >
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
               <div className="font-semibold text-gray-900">Super Admin</div>
                <div className="text-xs text-gray-600">
                  {t("superadmin.layout.platform_control")}
                </div>

              </div>
            </Link>
          </div>

          {/* Menu – only show items user has permission for */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.key);

                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavigation(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${
                      active ? "font-medium" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={
                      active
                        ? { backgroundColor: colors.primaryBg, color: colors.primary }
                        : {}
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {/* <button
              onClick={() => handleNavigation("/")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all text-sm"
            >
              <Home className="w-5 h-5" />
              <span>Back to Home</span>
            </button> */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("superadmin.topbar.search_placeholder")}

                    className="w-full pl-10 h-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 px-4 text-sm"
                    style={{ "--tw-ring-color": colors.primaryLight }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-6">
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs text-white rounded-full"
                  style={{ backgroundColor: colors.primary }}
                >
                  3
                </span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{
                      background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`,
                    }}
                  >
                    {initials}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm text-gray-900">{displayName}</div>
                    <div className="text-xs text-gray-600">{roleLabel}</div>
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">{t("superadmin.layout.my_account")}
                      <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="w-4 h-4" />
                        {t("superadmin.layout.profile")}

                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleNavigation("/superadmin/settings");
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        {t("superadmin.layout.settings")}

                      </button>
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                       {t("superadmin.layout.logout")}

                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <nav className="flex items-center text-sm">
              <Link
                href="/superadmin/dashboard"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Dashboard
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}

        {/* Page Header */}
        {(title || description) && (
          <div className="bg-white border-b border-gray-200 px-6 py-6">
            {title && <h1 className="text-3xl text-gray-900 mb-2">{title}</h1>}
            {description && <p className="text-gray-600">{description}</p>}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SuperAdminLayout;