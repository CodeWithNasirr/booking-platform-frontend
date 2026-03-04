"use client";

import { Menu, Bell, Calendar } from "lucide-react";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useApp } from "@/contexts/AppContext";

export default function TopBar({ setSidebarOpen, pageName }) {
  const { user } = useApp();

  return (
    <div className="bg-white border-b border-[#e5e7eb] px-4 lg:px-6 py-4 sticky top-0 z-30">
      <div className="flex justify-between items-center">
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-[#364153]" />
        </button>

        {/* Page Title - Desktop shows breadcrumb style, Mobile shows simple */}
        <div className="hidden lg:flex flex-col">
          <p className="text-[14px] text-[#4a5565] leading-[20px]">Saturday, January 3, 2026</p>
        </div>
        
        <div className="lg:hidden">
          <p className="text-[16px] font-semibold text-[#101828]">{pageName}</p>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-[#4A5565]" />
            <div className="absolute bg-[#fb2c36] right-1.5 top-1.5 rounded-full w-2 h-2" />
          </button>
          
          <div className="flex items-center gap-2 border border-[#e5e7eb] rounded-xl px-2 lg:px-3 py-2 bg-white">
            <div className="bg-gradient-to-b from-[#800020] to-[#600018] text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm font-medium">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <span className="hidden md:block text-sm font-medium text-[#101828] max-w-[120px] truncate">
              {user?.name || 'Service Provider'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}