"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Briefcase, 
  Package, 
  Calendar, 
  Clock, 
  DollarSign, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut, 
  X 
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const {logout } = useApp();
  

  const go = (href) => {
    router.push(href);
    setSidebarOpen(false);
  };

  const navItems = [
    { key: "/provider", label: "Home", icon: Home },
    { key: "/provider/services", label: "My Services", icon: Briefcase },
    { key: "/provider/orders", label: "Orders", icon: Package, badge: "2" },
    { key: "/provider/bookings", label: "Bookings", icon: Calendar, badge: "3" },
    { key: "/provider/availability", label: "Availability", icon: Clock },
    { key: "/provider/earnings", label: "Earnings", icon: DollarSign },
    { key: "/provider/chat", label: "Chat", icon: MessageSquare },
    { key: "/provider/profile", label: "Profile", icon: User },
    { key: "/provider/settings", label: "Settings", icon: Settings },
  ];

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
              <p className="font-semibold text-[16px] text-[#101828]">Provider Panel</p>
              <p className="text-[12px] text-[#4a5565]">Service Professional</p>
            </div>
          </div>
          
          {/* Mobile Close Button */}
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
            const isActive = item.key === "/provider" 
              ? pathname === "/provider"
              : pathname?.startsWith(item.key);

            return (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-200 h-[48px]
                  ${isActive
                    ? "bg-[#800020] text-white shadow-[0px_4px_6px_0px_rgba(128,0,32,0.1)]"
                    : "text-[#364153] hover:bg-gray-50"
                  }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-white" : "text-[#364153]"}`}
                  strokeWidth={1.66667}
                />
                <span className="font-medium text-[16px] leading-[24px]">{item.label}</span>
                {item.badge && (
                  <div className={`h-[20px] px-[8px] rounded-full ml-auto flex items-center justify-center ${
                    isActive ? 'bg-white/20' : 'bg-[#800020]'
                  }`}>
                    <span className="text-[12px] text-white font-medium leading-[16px]">{item.badge}</span>
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
            <span className="font-medium text-[16px]">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}