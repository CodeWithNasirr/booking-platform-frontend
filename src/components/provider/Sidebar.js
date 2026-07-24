// // src/components/provider/Sidebar.js

// src/components/provider/Sidebar.js
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Briefcase,
  Package,
  Calendar,
  Clock,
  User,
  LogOut,
  X,
  AlertCircle,
  Wrench,
  MessageSquare,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useProviderStatus } from "./useProviderStatus";
import { useIntegrationStatus } from "@/app/dashboard/integrations/hooks/useIntegrationStatus";
import SidebarIntegrationDot from "@/components/shared/SidebarIntegrationDot";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, t } = useApp();
  const { isActive, isApproved } = useProviderStatus();
  const {
    getWarningsForFeature,
    loading: integrationLoading,
  } = useIntegrationStatus();
  // console.log("[AUTH-TRACE] Sidebar(provider) render", {
  //   pathname,
  //   isActive,
  //   isApproved,
  //   integrationLoading,
  // });

  const isDeactivated = !isActive;
  const isPending = !isApproved && isActive;

  const go = (href) => {
    if (isDeactivated) return;
    router.push(href);
    setSidebarOpen(false);
  };

  const navItems = [
    {
      key: "/provider",
      label: t("sidebar_home"),
      icon: Home,
      disabled: isDeactivated,
    },
    {
      key: "/provider/services",
      label: t("sidebar_my_services"),
      icon: Briefcase,
      disabled: isDeactivated,
    },
    {
      key: "/provider/orders",
      label: t("sidebar_orders"),
      icon: Package,
      badge: "2",
      disabled: isDeactivated,
    },
    {
      key: "/provider/bookings",
      label: t("sidebar_bookings"),
      icon: Calendar,
      badge: "3",
      disabled: isDeactivated,
      integrationFeature: "online_booking",
    },
    {
      key: "/provider/custom-requests",
      label: t("sidebar_custom_requests") || "Custom Requests",
      icon: MessageSquare,
      disabled: isDeactivated,
    },
    {
      key: "/provider/availability",
      label: t("sidebar_availability"),
      icon: Clock,
      disabled: isDeactivated,
    },
    {
      key: "/provider/work",
      label: t("sidebar_work"),
      icon: Wrench,
      disabled: false,
      integrationFeature: "online_booking",
    },
    {
      key: "/provider/profile",
      label: t("sidebar_profile"),
      icon: User,
      disabled: false,
    },
  ];

  // ── Resolve integration dot ──
  const getIntegrationDot = (item) => {
    if (!item.integrationFeature || integrationLoading) return null;

    const warning = getWarningsForFeature(item.integrationFeature);
    if (!warning) return null;

    const missingNames = warning.missing
      ?.map((m) => m.label)
      .join(", ");

    return (
      <SidebarIntegrationDot
        severity={warning.severity}
        tooltip={missingNames ? `${t("sidebar_connect")}: ${missingNames}` : warning.label}
      />
    );
  };

  return (
    <div
      className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0 fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0
      z-50 w-[255.2px] bg-white border-gray-200 border-r
      transition-transform duration-300 ease-in-out shrink-0`}
    >
      <div className="flex flex-col h-full">
        {/* Header / Logo */}
        <div className="h-[88.8px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-6">
          <div className="flex gap-[8px] items-center">
            <div className="bg-gradient-to-b from-[#800020] to-[#600018] rounded-[16px] size-[40px] flex items-center justify-center">
              <Package className="text-white" size={20} strokeWidth={1.66667} />
            </div>
            <div>
              <p className="font-semibold text-[16px] text-[#101828]">
                {t("sidebar_provider_panel")}
              </p>
              <p className="text-[12px] text-[#4a5565]">
                {t("sidebar_service_professional")}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-[#364153]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive =
              item.key === "/provider"
                ? pathname === "/provider"
                : pathname?.startsWith(item.key);
            const isDisabled = item.disabled;
            const dot = !isDisabled ? getIntegrationDot(item) : null;

            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-200 h-[48px]
                  ${
                    isDisabled
                      ? "opacity-40 cursor-not-allowed bg-gray-50"
                      : isItemActive
                      ? "bg-[#800020] text-white shadow-[0px_4px_6px_0px_rgba(128,0,32,0.1)]"
                      : "text-[#364153] hover:bg-gray-50"
                  }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isItemActive && !isDisabled ? "text-white" : "text-[#364153]"
                  }`}
                  strokeWidth={1.66667}
                />
                <span className="font-medium text-[16px] leading-[24px]">
                  {item.label}
                </span>

                {/* Integration dot (pushed right, before badge) */}
                {dot}

                {/* Badge */}
                {item.badge && !isDisabled && (
                  <div
                    className={`h-[20px] px-[8px] rounded-full ml-auto flex items-center justify-center ${
                      isItemActive ? "bg-white/20" : "bg-[#800020]"
                    }`}
                  >
                    <span className="text-[12px] text-white font-medium leading-[16px]">
                      {item.badge}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#e5e7eb]">
          <button
            onClick={() => {
              logout();
              router.replace("/");
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] h-[48px]
              text-[#364153] hover:bg-gray-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-[#364153]" strokeWidth={1.66667} />
            <span className="font-medium text-[16px]">{t("sidebar_logout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { usePathname, useRouter } from "next/navigation";
// import {
//   Home,
//   Briefcase,
//   Package,
//   Calendar,
//   Clock,
//   User,
//   LogOut,
//   X,
//   AlertCircle,
//   Wrench,
// } from "lucide-react";
// import { useApp } from "@/contexts/AppContext";
// import { useProviderStatus } from "./useProviderStatus";
// import { useIntegrationStatus } from "@/app/dashboard/integrations/hooks/useIntegrationStatus";
// import SidebarIntegrationDot from "@/components/shared/SidebarIntegrationDot";

// export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
//   const pathname = usePathname();
//   const router = useRouter();
//   const { logout } = useApp();
//   const { isActive, isApproved } = useProviderStatus();
//   const {
//     getWarningsForFeature,
//     loading: integrationLoading,
//   } = useIntegrationStatus();

//   const isDeactivated = !isActive;
//   const isPending = !isApproved && isActive;

//   const go = (href) => {
//     if (isDeactivated) return;
//     router.push(href);
//     setSidebarOpen(false);
//   };

//   const navItems = [
//     {
//       key: "/provider",
//       label: "Home",
//       icon: Home,
//       disabled: isDeactivated,
//     },
//     {
//       key: "/provider/services",
//       label: "My Services",
//       icon: Briefcase,
//       disabled: isDeactivated,
//     },
//     {
//       key: "/provider/orders",
//       label: "Orders",
//       icon: Package,
//       badge: "2",
//       disabled: isDeactivated,
//     },
//     {
//       key: "/provider/bookings",
//       label: "Bookings",
//       icon: Calendar,
//       badge: "3",
//       disabled: isDeactivated,
//       // Online bookings need calendar — show dot if provider hasn't connected
//       integrationFeature: "online_booking",
//     },
//     {
//       key: "/provider/availability",
//       label: "Availability",
//       icon: Clock,
//       disabled: isDeactivated,
//     },
//     {
//       key: "/provider/work",
//       label: "Work",
//       icon: Wrench,
//       disabled: false,
//       integrationFeature: "online_booking",
//     },
//     {
//       key: "/provider/profile",
//       label: "Profile",
//       icon: User,
//       disabled: false,
//     },
//   ];

//   // ── Resolve integration dot ──
//   const getIntegrationDot = (item) => {
//     if (!item.integrationFeature || integrationLoading) return null;

//     const warning = getWarningsForFeature(item.integrationFeature);
//     if (!warning) return null;

//     const missingNames = warning.missing
//       ?.map((m) => m.label)
//       .join(", ");

//     return (
//       <SidebarIntegrationDot
//         severity={warning.severity}
//         tooltip={missingNames ? `Connect: ${missingNames}` : warning.label}
//       />
//     );
//   };

//   return (
//     <div
//       className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
//       lg:translate-x-0 fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0
//       z-50 w-[255.2px] bg-white border-gray-200 border-r
//       transition-transform duration-300 ease-in-out shrink-0`}
//     >
//       <div className="flex flex-col h-full">
//         {/* Header / Logo */}
//         <div className="h-[88.8px] shrink-0 border-b border-[#e5e7eb] flex items-center justify-between px-6">
//           <div className="flex gap-[8px] items-center">
//             <div className="bg-gradient-to-b from-[#800020] to-[#600018] rounded-[16px] size-[40px] flex items-center justify-center">
//               <Package className="text-white" size={20} strokeWidth={1.66667} />
//             </div>
//             <div>
//               <p className="font-semibold text-[16px] text-[#101828]">
//                 Provider Panel
//               </p>
//               <p className="text-[12px] text-[#4a5565]">
//                 Service Professional
//               </p>
//             </div>
//           </div>

//           <button
//             onClick={() => setSidebarOpen(false)}
//             className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X size={20} className="text-[#364153]" />
//           </button>
//         </div>

//         {/* Deactivation Warning */}
//         {/* {isDeactivated && (
//           <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
//             <div className="flex items-start gap-2">
//               <AlertCircle className="text-red-600 shrink-0" size={16} />
//               <div>
//                 <p className="text-red-800 text-xs font-semibold">
//                   Account Deactivated
//                 </p>
//                 <p className="text-red-600 text-[10px] mt-0.5">
//                   Contact support for assistance
//                 </p>
//               </div>
//             </div>
//           </div>
//         )} */}

//         {/* Pending Approval Warning */}
//         {/* {isPending && (
//           <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
//             <div className="flex items-start gap-2">
//               <AlertCircle className="text-amber-600 shrink-0" size={16} />
//               <div>
//                 <p className="text-amber-800 text-xs font-semibold">
//                   Pending Approval
//                 </p>
//                 <p className="text-amber-600 text-[10px] mt-0.5">
//                   Waiting for admin approval
//                 </p>
//               </div>
//             </div>
//           </div>
//         )} */}

//         {/* Navigation */}
//         <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//           {navItems.map((item) => {
//             const Icon = item.icon;
//             const isItemActive =
//               item.key === "/provider"
//                 ? pathname === "/provider"
//                 : pathname?.startsWith(item.key);
//             const isDisabled = item.disabled;
//             const dot = !isDisabled ? getIntegrationDot(item) : null;

//             return (
//               <button
//                 key={item.key}
//                 onClick={() => go(item.key)}
//                 disabled={isDisabled}
//                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-200 h-[48px]
//                   ${
//                     isDisabled
//                       ? "opacity-40 cursor-not-allowed bg-gray-50"
//                       : isItemActive
//                       ? "bg-[#800020] text-white shadow-[0px_4px_6px_0px_rgba(128,0,32,0.1)]"
//                       : "text-[#364153] hover:bg-gray-50"
//                   }`}
//               >
//                 <Icon
//                   className={`w-5 h-5 ${
//                     isItemActive && !isDisabled ? "text-white" : "text-[#364153]"
//                   }`}
//                   strokeWidth={1.66667}
//                 />
//                 <span className="font-medium text-[16px] leading-[24px]">
//                   {item.label}
//                 </span>

//                 {/* Integration dot (pushed right, before badge) */}
//                 {dot}

//                 {/* Badge */}
//                 {item.badge && !isDisabled && (
//                   <div
//                     className={`h-[20px] px-[8px] rounded-full ml-auto flex items-center justify-center ${
//                       isItemActive ? "bg-white/20" : "bg-[#800020]"
//                     }`}
//                   >
//                     <span className="text-[12px] text-white font-medium leading-[16px]">
//                       {item.badge}
//                     </span>
//                   </div>
//                 )}
//               </button>
//             );
//           })}
//         </nav>

//         {/* Logout */}
//         <div className="p-4 border-t border-[#e5e7eb]">
//           <button
//             onClick={() => {
//               logout();
//               router.replace("/");
//             }}
//             className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] h-[48px]
//               text-[#364153] hover:bg-gray-50 transition-all duration-200"
//           >
//             <LogOut className="w-5 h-5 text-[#364153]" strokeWidth={1.66667} />
//             <span className="font-medium text-[16px]">Logout</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }