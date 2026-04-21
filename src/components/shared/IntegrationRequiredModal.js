// src/components/shared/IntegrationRequiredModal.js
"use client";

/**
 * IntegrationRequiredModal
 *
 * Reusable modal shown when an action requires integrations that
 * aren't connected. Renders missing integrations with resolution
 * steps and action buttons.
 *
 * Used by:
 *   - Service creation (tenant panel) — when selecting online+booking
 *   - Provider panel — when enabling services that need integrations
 *   - Any future flow that needs integration gating
 *
 * Props:
 *   checkResult   - Result from useFeatureCheck.check() or checkService()
 *   onConnect      - Called with resolution object when user clicks "Connect"
 *   onSkip         - Called when user clicks "I'll do this later" (optional)
 *   onClose        - Called to close the modal
 *   panel          - "tenant" | "provider" — determines resolution target
 *   allowSkip      - Whether to show "I'll do this later" (default: true)
 */

import { useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  X,
  Zap,
  Calendar,
  Video,
  MessageCircle,
  BarChart3,
  Smartphone,
  Globe,
  ChevronRight,
  Shield,
  CheckCircle2,
} from "lucide-react";

// Icon map matching the integration catalog
const INTEGRATION_ICONS = {
  google_calendar: Calendar,
  zoom: Video,
  whatsapp_web: MessageCircle,
  meta_pixel: Globe,
  google_analytics: BarChart3,
  google_tag_manager: Globe,
  tiktok_pixel: Smartphone,
};

// Color map for integration cards
const INTEGRATION_COLORS = {
  google_calendar: "from-red-500 to-red-600",
  zoom: "from-blue-500 to-blue-600",
  whatsapp_web: "from-green-500 to-green-600",
  meta_pixel: "from-blue-600 to-blue-700",
  google_analytics: "from-orange-500 to-orange-600",
  google_tag_manager: "from-blue-500 to-blue-600",
  tiktok_pixel: "from-gray-800 to-black",
};

const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    textColor: "text-red-700",
    label: "Required",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    textColor: "text-amber-700",
    label: "Recommended",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    textColor: "text-blue-700",
    label: "Optional",
  },
};

export default function IntegrationRequiredModal({
  checkResult,
  onConnect,
  onSkip,
  onClose,
  panel = "tenant",
  allowSkip = true,
}) {
  if (!checkResult || checkResult.satisfied) return null;

  const severity = checkResult.severity || "critical";
  const sevConfig = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.critical;
  const cta = checkResult.cta || {};
  const isBlocking = checkResult.blocking;

  // For service-level checks (checkService result), flatten the checks
  const missingItems = checkResult.missing || [];
  const connectedItems = checkResult.connected || [];
  const mode = checkResult.mode || "all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* ── Header ── */}
        <div className="relative px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-2xl ${sevConfig.bg} ${sevConfig.border} border flex items-center justify-center mb-4`}
          >
            {isBlocking ? (
              <AlertTriangle className={`w-7 h-7 ${sevConfig.iconColor}`} />
            ) : (
              <Shield className={`w-7 h-7 ${sevConfig.iconColor}`} />
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900">
            {isBlocking ? "Integration Required" : "Integration Recommended"}
          </h2>

          {/* Description from CTA */}
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            {cta.description || checkResult.label}
          </p>

          {/* OR mode hint */}
          {mode === "any" && missingItems.length > 1 && (
            <p className="text-xs text-gray-500 mt-2 italic">
              Connect at least one of the following:
            </p>
          )}
        </div>

        {/* ── Missing Integrations List ── */}
        <div className="px-6 pb-2 space-y-2">
          {missingItems.map((item) => {
            const Icon =
              INTEGRATION_ICONS[item.integration] || Globe;
            const gradient =
              INTEGRATION_COLORS[item.integration] || "from-gray-500 to-gray-600";
            const resolution = item.resolution || {};

            return (
              <div
                key={item.integration}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 transition-colors group"
              >
                {/* Integration icon */}
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {resolution.instructions || "Not connected"}
                  </p>
                </div>

                {/* Connect button */}
                <button
                  onClick={() =>
                    onConnect?.({
                      integration: item.integration,
                      label: item.label,
                      action: resolution.action || "redirect",
                      target:
                        panel === "provider" && resolution.provider_target
                          ? resolution.provider_target
                          : resolution.target || "/dashboard/integrations",
                      instructions: resolution.instructions || "",
                    })
                  }
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#8B1E3F] bg-[#8B1E3F]/5 hover:bg-[#8B1E3F]/10 transition-colors flex-shrink-0"
                >
                  Connect
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Show connected items for OR mode */}
          {mode === "any" && connectedItems.length > 0 && (
            <div className="pt-1">
              {connectedItems.map((key) => {
                const Icon = INTEGRATION_ICONS[key] || Globe;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-50/60 border border-green-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Blocking notice ── */}
        {isBlocking && (
          <div className="mx-6 mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Without this integration, customers will
              not be able to complete bookings for this service type.
            </p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="px-6 py-5 mt-2 border-t border-gray-100 flex flex-col gap-2">
          {/* Primary: Connect (uses first missing integration) */}
          {missingItems.length > 0 && (
            <button
              onClick={() => {
                const first = missingItems[0];
                const resolution = first.resolution || {};
                onConnect?.({
                  integration: first.integration,
                  label: first.label,
                  action: resolution.action || "redirect",
                  target:
                    panel === "provider" && resolution.provider_target
                      ? resolution.provider_target
                      : resolution.target || "/dashboard/integrations",
                  instructions: resolution.instructions || "",
                });
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 font-medium text-sm shadow-sm transition-all"
            >
              <Zap className="w-4 h-4" />
              {cta.text || "Connect Now"}
            </button>
          )}

          {/* Secondary: Skip */}
          {allowSkip && (
            <button
              onClick={() => onSkip?.()}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              I'll do this later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}