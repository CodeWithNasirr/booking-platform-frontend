// src/components/provider/TopBar.js
"use client";

import { useState } from "react";
import { Menu, Bell, Loader2 } from "lucide-react";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import { useApp } from "@/contexts/AppContext";
import { useIntegrationStatus } from "@/app/dashboard/integrations/hooks/useIntegrationStatus";
import IntegrationWarningBanner from "@/components/shared/IntegrationWarningBanner";
import { getGoogleCalendarOAuthUrl } from "@/app/dashboard/integrations/lib/integrationsApi";

export default function TopBar({ setSidebarOpen, pageName }) {
  const { user, activeTenant } = useApp();
  const { warnings, loading: warningsLoading } = useIntegrationStatus();
  const [connecting, setConnecting] = useState(false);

  /**
   * Handle "Connect" from the warning banner in provider context.
   *
   * For Google Calendar: fetches OAuth URL and redirects.
   * For other integrations: shows a message to contact admin
   * (since providers can't access the tenant integrations page).
   */
  const handleProviderConnect = async (resolution) => {
    if (resolution.integration === "google_calendar") {
      try {
        setConnecting(true);

        // Step 1: Get current provider's ID
        const meRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/providers/me/`,
          {
            headers: {
              Authorization: `Bearer ${document.cookie.match(/access_token=([^;]+)/)?.[1] || ""}`,
              "X-Tenant": activeTenant || "",
            },
            credentials: "include",
          }
        );

        if (!meRes.ok) {
          alert("Could not load your provider profile. Please try again.");
          return;
        }

        const provider = await meRes.json();

        // Step 2: Get Google OAuth URL
        const oauthData = await getGoogleCalendarOAuthUrl(
          activeTenant,
          provider.id,
          "provider" // Return to provider panel after OAuth
        );

        // Step 3: Redirect to Google OAuth
        if (oauthData.oauth_url) {
          window.location.href = oauthData.oauth_url;
        }
      } catch (err) {
        console.error("Google OAuth initiation failed:", err);
        alert("Failed to start Google connection. Please try again.");
      } finally {
        setConnecting(false);
      }
    } else {
      // Non-Google integrations: provider can't connect these
      alert(
        `${resolution.label} can only be connected by an admin. ` +
          "Please contact your business administrator."
      );
    }
  };

  return (
    <div className="bg-white border-b border-[#e5e7eb] sticky top-0 z-30">
      {/* ── Main topbar row ── */}
      <div className="px-4 lg:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-[#364153]" />
          </button>

          {/* Page Title */}
          <div className="hidden lg:flex flex-col">
            <p className="text-[14px] text-[#4a5565] leading-[20px]">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="lg:hidden">
            <p className="text-[16px] font-semibold text-[#101828]">
              {pageName}
            </p>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Connecting indicator */}
            {connecting && (
              <div className="flex items-center gap-1.5 text-xs text-[#8B1E3F]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Connecting...</span>
              </div>
            )}

            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-[#4A5565]" />
              <div className="absolute bg-[#fb2c36] right-1.5 top-1.5 rounded-full w-2 h-2" />
            </button>

            <div className="flex items-center gap-2 border border-[#e5e7eb] rounded-xl px-2 lg:px-3 py-2 bg-white">
              <div className="bg-gradient-to-b from-[#800020] to-[#600018] text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm font-medium">
                {user?.name?.charAt(0) || "S"}
              </div>
              <span className="hidden md:block text-sm font-medium text-[#101828] max-w-[120px] truncate">
                {user?.name || "Service Provider"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Integration warning banner ── */}
      <IntegrationWarningBanner
        warnings={warnings}
        loading={warningsLoading}
        panel="provider"
        onProviderConnect={handleProviderConnect}
      />
    </div>
  );
}