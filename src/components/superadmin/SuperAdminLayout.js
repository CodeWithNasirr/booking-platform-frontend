"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  Bell,
  User,
  ChevronRight,
  ShieldCheck,
  ScrollText,
  AlertTriangle,
  Activity,
  RotateCcw,
  Megaphone,
  AlertCircle,
  Crown,
  Inbox,
  Lock,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import { useNotifications } from "@/contexts/NotificationsContext";
import NotificationBell from "@/components/dashboard/NotificationBell";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "@/lib/t";
import {
  matchAccessRule,
  canAccessRule,
  canAccessPath,
} from "@/lib/superadminAccess";

const SuperAdminLayout = ({ children, title, description, breadcrumbs = [] }) => {
  const { user, platform, loading, hasPermission, logout } = useSuperAdmin();
  const { t, isRTL } = useTranslation();
  const { byCategory, markCategoryRead } = useNotifications();

  // Superadmin menu route → platform notification category (for the dots).
  const NOTIF_CATEGORY = {
    "/superadmin/tenants": "platform",
    "/superadmin/support": "support",
    "/superadmin/billing": "billing",
    "/superadmin/integrations": "integrations",
  };

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

  // ── Menu items ───────────────────────────────────────────────
  // Visibility is derived from the SAME access map the route guard uses
  // (src/lib/superadminAccess.js), so a hidden menu item and a blocked route
  // can never disagree. Add a permission rule there, not here.
  const menuDefs = [
    { key: "/superadmin/dashboard", label: t("superadmin.nav.dashboard"), icon: LayoutDashboard },
    { key: "/superadmin/tenants", label: t("superadmin.nav.tenants"), icon: Users },
    { key: "/superadmin/documents", label: t("superadmin.nav.documents"), icon: FileText },
    { key: "/superadmin/billing", label: t("superadmin.nav.billing"), icon: CreditCard },
    { key: "/superadmin/enterprise", label: t("superadmin.nav.enterprise"), icon: Crown },
    { key: "/superadmin/sales-inquiries", label: t("superadmin.nav.salesInquiries"), icon: Inbox },
    { key: "/superadmin/notifications", label: t("superadmin.nav.notifications"), icon: Megaphone },
    { key: "/superadmin/announcements", label: t("superadmin.nav.announcements"), icon: Megaphone },
    { key: "/superadmin/templates", label: t("superadmin.nav.templates"), icon: FileText },
    { key: "/superadmin/integrations", label: t("superadmin.nav.integrations"), icon: Settings },
    { key: "/superadmin/support", label: t("superadmin.nav.support"), icon: LifeBuoy },
    { key: "/superadmin/sub-admins", label: t("superadmin.nav.subadmins"), icon: ShieldCheck },
    { key: "/superadmin/logs", label: t("superadmin.nav.logs"), icon: ScrollText },
    { key: "/superadmin/refunds", label: t("superadmin.nav.refunds"), icon: RotateCcw },
    { key: "/superadmin/health", label: t("superadmin.nav.health"), icon: Activity },
    { key: "/superadmin/dunning", label: t("superadmin.nav.dunning"), icon: AlertTriangle },
    { key: "/superadmin/settings", label: t("superadmin.nav.settings"), icon: Settings },
  ];
  const menuItems = menuDefs.map((item) => ({
    ...item,
    visible: canAccessPath(item.key, hasPermission),
  }));

  const isActive = (key) => pathname === key || pathname.startsWith(key + "/");

  // ── Route guard: does this employee hold the permission for the
  // page currently being rendered? Evaluated only after permissions
  // have loaded, so it never flashes a denial during hydration.
  const routeAllowed = canAccessRule(matchAccessRule(pathname), hasPermission);

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
          <span className="text-sm text-gray-500">
            {t("superadmin.layout.loading_platform")}
          </span>
        </div>
      </div>
    );
  }

  const displayName = user?.full_name || user?.email || t("superadmin.layout.admin_fallback");
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = platform?.role_display || platform?.role || t("superadmin.layout.employee_fallback");

  return (
    <div className="flex h-screen bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <div
        className={`
          ${sidebarOpen
            ? "translate-x-0"
            : isRTL
            ? "translate-x-full"
            : "-translate-x-full"
          }
          lg:translate-x-0
          fixed lg:static inset-y-0
          ${isRTL ? "right-0 lg:left-0 lg:right-auto" : "left-0"}
          z-50 w-64 bg-white border-r border-gray-200
          transition-transform duration-300
          shadow-lg lg:shadow-none
        `}
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
                <div className="font-semibold text-gray-900">
                  {t("superadmin.layout.super_admin")}
                </div>
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
                const category = NOTIF_CATEGORY[item.key];
                const unread = category ? byCategory?.[category] || 0 : 0;

                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      // Opening a section clears only that section's dot.
                      if (category && unread > 0) markCategoryRead(category);
                      handleNavigation(item.key);
                    }}
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
                    {unread > 0 && (
                      <span
                        className={`flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-semibold flex items-center justify-center ${
                          isRTL ? "mr-auto" : "ml-auto"
                        }`}
                        style={{ backgroundColor: colors.primary }}
                        title={`${unread} new`}
                      >
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all text-sm"
            >
              <LogOut className="w-5 h-5" />
              <span>{t("superadmin.layout.logout")}</span>
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
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
                  <input
                    type="text"
                    placeholder={t("superadmin.topbar.search_placeholder")}
                    className={`w-full h-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 px-4 text-sm ${isRTL ? "pr-10" : "pl-10"}`}
                    style={{ "--tw-ring-color": colors.primaryLight }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-6">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Notifications */}
              <NotificationBell isRTL={isRTL} />

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
                  <div className={`absolute top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 ${isRTL ? "left-0" : "right-0"}`}>
                    <div className="px-4 py-3 border-b border-gray-100">
                      {t("superadmin.layout.my_account")}
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
                {t("superadmin.nav.dashboard")}
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className={`w-4 h-4 mx-2 text-gray-400 ${isRTL ? "rotate-180" : ""}`} />
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

        {/* Page Content — gated by the centralized route guard so that
            typing a URL for a module you lack permission for shows an
            access-denied panel instead of the page. */}
        <main className="flex-1 overflow-y-auto p-6">
          {routeAllowed ? (
            children
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                  <Lock className="h-7 w-7 text-red-500" />
                </div>
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  {t("superadmin.access.denied_title")}
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  {t("superadmin.access.denied_body")}
                </p>
                <button
                  onClick={() => handleNavigation("/superadmin/dashboard")}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  {t("superadmin.access.back_to_dashboard")}
                </button>
              </div>
            </div>
          )}
        </main>
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



// "use client";

// import React, { useState } from "react";
// import {
//   LayoutDashboard,
//   Users,
//   CreditCard,
//   FileText,
//   Globe,
//   Settings,
//   LifeBuoy,
//   LogOut,
//   Menu,
//   Search,
//   Bell,
//   User,
//   Home,
//   HelpCircle,
//   ChevronRight,
//   ShieldCheck,
//   ScrollText,
//   AlertTriangle,
//   Activity,
//   RotateCcw,
//   Megaphone

// } from "lucide-react";


// import { usePathname, useRouter } from "next/navigation";
// import Link from "next/link";
// import { useSuperAdmin } from "@/contexts/Superadmincontext";
// import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

// import { useTranslation } from "@/lib/t";

// const SuperAdminLayout = ({ children, title, description, breadcrumbs = [] }) => {
//   const { user, platform, loading, hasPermission, hasAnyPermission, logout } =  useSuperAdmin();
  
//   const { t, isRTL } = useTranslation();

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [userMenuOpen, setUserMenuOpen] = useState(false);
//   const pathname = usePathname();
//   const router = useRouter();

//   const colors = {
//     primary: "#8B1E3F",
//     primaryLight: "#A63A5C",
//     primaryDark: "#6B1631",
//     primaryBg: "#FDF2F4",
//     primaryHover: "#FCE8EC",
//   };

//   // ── Menu items with permission gating ────────────────────────
//   const menuItems = [
//     {
//       key: "/superadmin/dashboard",
//       label: t("superadmin.nav.dashboard"),

//       icon: LayoutDashboard,
//       visible: true, // everyone sees dashboard
//     },
//     {
//       key: "/superadmin/tenants",
//       label: t("superadmin.nav.tenants"),
//       icon: Users,
//       visible: hasPermission("tenants.view"),
//     },

//     {
//       key: "/superadmin/documents",
//       label: t("superadmin.nav.documents"),
//       icon: FileText,
//       visible: hasPermission("tenants.view"),
//     },
//     {
//       key: "/superadmin/billing",
//       label: t("superadmin.nav.billing"),
//       icon: CreditCard,
//       visible: hasAnyPermission(["billing.view", "plans.view"]),
//     },
//      {
//       key: "/superadmin/notifications",
//       label: "Notifications",
//       icon: Megaphone,
//       visible: hasPermission("system.manage_settings"),
//       },
//        {
//       key: "/superadmin/announcements",
//       label: "Announcements",
//       icon: Megaphone,
//       visible: hasPermission("system.manage_settings"),
//       },
//     {
//       key: "/superadmin/templates",
//       label: t("superadmin.nav.templates"),
//       icon: FileText,
//       visible: hasPermission("templates.view"),
//     },
//     {
//       key: "/superadmin/integrations",
//       label: t("superadmin.nav.integrations"),
//       icon: Settings,
//       visible: hasPermission("system.manage_integrations"),
//     },
//     {
//       key: "/superadmin/support",
//       label: t("superadmin.nav.support"),
//       icon: LifeBuoy,
//       visible: hasPermission("tickets.view"),
//     },
//     {
//       key: "/superadmin/sub-admins",
//       label: t("superadmin.nav.subadmins"),
//       icon: ShieldCheck,
//       visible: hasPermission("employees.view"),
//     },
   
//     {
//       key: "/superadmin/logs",
//       label: t("superadmin.nav.logs"),
//       icon: ScrollText,
//       visible: hasPermission("system.view_logs"),
//     },

//      {
//        key: "/superadmin/refunds",
//        label: "Refunds",
//        icon: RotateCcw,
//        visible: hasPermission("billing.view"),
//      },
//      {
//        key: "/superadmin/health",
//        label: "System Health",
//        icon: Activity,
//        visible: hasPermission("system.view_logs"),
//      },
//      {
//        key: "/superadmin/dunning",
//        label: "Failed Payments",
//        icon: AlertTriangle,
//        visible: hasPermission("billing.view"),
//      },
//     {
//       key: "/superadmin/settings",
//       label: t("superadmin.nav.settings"),
//       icon: Settings,
//       visible: hasAnyPermission(["system.view_settings", "system.manage_settings"]),
//     },

//   ];

//   const isActive = (key) => pathname === key || pathname.startsWith(key + "/");

//   const handleNavigation = (path) => {
//     router.push(path);
//     setSidebarOpen(false);
//   };

//   // ── Loading state ────────────────────────────────────────────
//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center bg-gray-50">
//         <div className="flex flex-col items-center gap-3">
//           <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#8B1E3F]" />
//           <span className="text-sm text-gray-500">{t("superadmin.layout.loading_platform")}
//           </span>

//         </div>
//       </div>
//     );
//   }

//   const displayName = user?.full_name || user?.email || "Admin";
//   const initials = displayName
//     .split(" ")
//     .map((w) => w[0])
//     .join("")
//     .slice(0, 2)
//     .toUpperCase();
//   const roleLabel = platform?.role_display || platform?.role || "Employee";

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* ── Sidebar ──────────────────────────────────────────── */}
//       <div
//           className={`
//             ${
//               sidebarOpen
//                 ? "translate-x-0"
//                 : isRTL
//                 ? "translate-x-full"
//                 : "-translate-x-full"
//             }
//             lg:translate-x-0
//             fixed lg:static inset-y-0
//             ${isRTL ? "right-0 lg:left-0 lg:right-auto" : "left-0"}
//             z-50 w-64 bg-white border-r border-gray-200
//             transition-transform duration-300
//             shadow-lg lg:shadow-none
//           `}
//         >
//         <div className="flex flex-col h-full">
//           {/* Logo */}
//           <div className="p-6 border-b border-gray-200">
//             <Link
//               href="/superadmin/dashboard"
//               className="flex items-center gap-2 hover:opacity-80 transition-opacity"
//             >
//               <div
//                 className="w-10 h-10 rounded-xl flex items-center justify-center"
//                 style={{
//                   background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`,
//                 }}
//               >
//                 <LayoutDashboard className="w-5 h-5 text-white" />
//               </div>
//               <div>
//                <div className="font-semibold text-gray-900">Super Admin</div>
//                 <div className="text-xs text-gray-600">
//                   {t("superadmin.layout.platform_control")}
//                 </div>

//               </div>
//             </Link>
//           </div>

//           {/* Menu – only show items user has permission for */}
//           <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//             {menuItems
//               .filter((item) => item.visible)
//               .map((item) => {
//                 const Icon = item.icon;
//                 const active = isActive(item.key);

//                 return (
//                   <button
//                     key={item.key}
//                     onClick={() => handleNavigation(item.key)}
//                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${
//                       active ? "font-medium" : "text-gray-700 hover:bg-gray-50"
//                     }`}
//                     style={
//                       active
//                         ? { backgroundColor: colors.primaryBg, color: colors.primary }
//                         : {}
//                     }
//                   >
//                     <Icon className="w-5 h-5 flex-shrink-0" />
//                     <span>{item.label}</span>
//                   </button>
//                 );
//               })}
//           </nav>

//           {/* Footer */}
//           <div className="p-4 border-t border-gray-200 space-y-2">
//             {/* <button
//               onClick={() => handleNavigation("/")}
//               className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all text-sm"
//             >
//               <Home className="w-5 h-5" />
//               <span>Back to Home</span>
//             </button> */}
//             <button
//               onClick={logout}
//               className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all text-sm"
//             >
//               <LogOut className="w-5 h-5" />
//               <span>Logout</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* ── Main Content ─────────────────────────────────────── */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Top Bar */}
//         <div className="bg-white border-b border-gray-200 px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4 flex-1">
//               <button
//                 onClick={() => setSidebarOpen(!sidebarOpen)}
//                 className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
//               >
//                 <Menu className="w-5 h-5" />
//               </button>
//               <div className="flex-1 max-w-xl">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder={t("superadmin.topbar.search_placeholder")}

//                     className="w-full pl-10 h-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 px-4 text-sm"
//                     style={{ "--tw-ring-color": colors.primaryLight }}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 ml-6">
//               {/* Language Switcher */}
//               <LanguageSwitcher />
              
//               {/* Notifications */}
//               <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
//                 <Bell className="w-5 h-5 text-gray-600" />
//                 <span
//                   className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs text-white rounded-full"
//                   style={{ backgroundColor: colors.primary }}
//                 >
//                   3
//                 </span>
//               </button>

//               {/* User Menu */}
//               <div className="relative">
//                 <button
//                   onClick={() => setUserMenuOpen(!userMenuOpen)}
//                   className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
//                 >
//                   <div
//                     className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
//                     style={{
//                       background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`,
//                     }}
//                   >
//                     {initials}
//                   </div>
//                   <div className="hidden md:block text-left">
//                     <div className="text-sm text-gray-900">{displayName}</div>
//                     <div className="text-xs text-gray-600">{roleLabel}</div>
//                   </div>
//                 </button>

//                 {userMenuOpen && (
//                   <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
//                     <div className="px-4 py-3 border-b border-gray-100">{t("superadmin.layout.my_account")}
//                       <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
//                     </div>
//                     <div className="py-1">
//                       <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
//                         <User className="w-4 h-4" />
//                         {t("superadmin.layout.profile")}

//                       </button>
//                       <button
//                         onClick={() => {
//                           setUserMenuOpen(false);
//                           handleNavigation("/superadmin/settings");
//                         }}
//                         className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
//                       >
//                         <Settings className="w-4 h-4" />
//                         {t("superadmin.layout.settings")}

//                       </button>
//                     </div>
//                     <div className="border-t border-gray-100 py-1">
//                       <button
//                         onClick={() => {
//                           setUserMenuOpen(false);
//                           logout();
//                         }}
//                         className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
//                       >
//                         <LogOut className="w-4 h-4" />
//                        {t("superadmin.layout.logout")}

//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Breadcrumbs */}
//         {breadcrumbs.length > 0 && (
//           <div className="bg-white border-b border-gray-200 px-6 py-3">
//             <nav className="flex items-center text-sm">
//               <Link
//                 href="/superadmin/dashboard"
//                 className="text-gray-500 hover:text-gray-700 transition-colors"
//               >
//                 Dashboard
//               </Link>
//               {breadcrumbs.map((crumb, index) => (
//                 <React.Fragment key={index}>
//                   <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
//                   {crumb.href ? (
//                     <Link
//                       href={crumb.href}
//                       className="text-gray-500 hover:text-gray-700 transition-colors"
//                     >
//                       {crumb.label}
//                     </Link>
//                   ) : (
//                     <span className="text-gray-900 font-medium">{crumb.label}</span>
//                   )}
//                 </React.Fragment>
//               ))}
//             </nav>
//           </div>
//         )}

//         {/* Page Header */}
//         {(title || description) && (
//           <div className="bg-white border-b border-gray-200 px-6 py-6">
//             {title && <h1 className="text-3xl text-gray-900 mb-2">{title}</h1>}
//             {description && <p className="text-gray-600">{description}</p>}
//           </div>
//         )}

//         {/* Page Content */}
//         <main className="flex-1 overflow-y-auto p-6">{children}</main>
//       </div>

//       {/* Mobile Overlay */}
//       {sidebarOpen && (
//         <div
//           className="lg:hidden fixed inset-0 bg-black/50 z-40"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}
//     </div>
//   );
// };

// export default SuperAdminLayout;