// src/components/dashboard/UpgradeBanner.js
"use client";

import { Zap } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";

/**
 * Shows an upgrade prompt when a feature is not available.
 *
 * Usage:
 *   <UpgradeBanner
 *     featureCode="analytics"
 *     title="Analytics not available"
 *     description="Upgrade to Professional to unlock analytics."
 *   />
 */
export default function UpgradeBanner({
  featureCode,
  title = "Feature not available",
  description = "Upgrade your plan to unlock this feature.",
}) {
  const { t } = useApp();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B1E3F] to-[#A8325A] flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-white" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h2>

      <p className="text-gray-600 text-center max-w-md mb-6">
        {description}
      </p>

      <Link
        href="/dashboard/settings?tab=billing"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#8B1E3F] to-[#A8325A] text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
      >
        <Zap className="w-4 h-4" />
        Upgrade Plan
      </Link>

      <p className="text-xs text-gray-400 mt-3">
        Feature: {featureCode}
      </p>
    </div>
  );
}