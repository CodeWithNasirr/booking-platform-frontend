// src/components/shared/IntegrationWarningBanner.js
"use client";

/**
 * IntegrationWarningBanner
 *
 * Renders below the topbar when features have missing integrations.
 * Consumes useIntegrationStatus hook (passed as props to avoid
 * double-fetching — the parent Topbar owns the hook instance).
 *
 * Behavior:
 *   - Shows the highest-severity warning as a colored banner
 *   - If multiple warnings, shows count + expandable list
 *   - "Connect" action depends on `panel` prop:
 *       tenant   → navigates to /dashboard/integrations
 *       provider → calls onProviderConnect(resolution) so parent
 *                  can trigger OAuth or open a modal
 *   - Dismissible per session (sessionStorage, reappears on reload)
 *
 * Props:
 *   warnings       - Array from useIntegrationStatus().warnings
 *   loading        - Boolean from useIntegrationStatus().loading
 *   panel          - "tenant" | "provider"
 *   onProviderConnect - (resolution) => void  (provider panel only)
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Calendar,
  Video,
  MessageCircle,
  BarChart3,
  Globe,
  Smartphone,
} from "lucide-react";

const INTEGRATION_ICONS = {
  google_calendar: Calendar,
  zoom: Video,
  whatsapp_web: MessageCircle,
  meta_pixel: Globe,
  google_analytics: BarChart3,
  google_tag_manager: Globe,
  tiktok_pixel: Smartphone,
};

const SEVERITY_STYLES = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    subtext: "text-red-600",
    icon: "text-red-500",
    button: "bg-red-600 hover:bg-red-700 text-white",
    dismiss: "text-red-400 hover:text-red-600 hover:bg-red-100",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    subtext: "text-amber-600",
    icon: "text-amber-500",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
    dismiss: "text-amber-400 hover:text-amber-600 hover:bg-amber-100",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    subtext: "text-blue-600",
    icon: "text-blue-500",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    dismiss: "text-blue-400 hover:text-blue-600 hover:bg-blue-100",
  },
};

const DISMISS_KEY = "integration_warning_dismissed";

export default function IntegrationWarningBanner({
  warnings = [],
  loading = false,
  panel = "tenant",
  onProviderConnect,
}) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Restore dismiss state from session
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(DISMISS_KEY);
      if (stored === "true") setDismissed(true);
    } catch {}
  }, []);

  if (loading || dismissed || warnings.length === 0) return null;

  // Pick highest-severity warning for the banner
  const primary = warnings[0]; // Already sorted by severity from backend
  const severity = primary.severity || "warning";
  const styles = SEVERITY_STYLES[severity] || SEVERITY_STYLES.warning;
  const remaining = warnings.length - 1;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {}
  };

  const handleConnect = (warning) => {
    const firstMissing = warning.missing?.[0];
    if (!firstMissing) return;

    const resolution = firstMissing.resolution || {};

    if (panel === "provider" && onProviderConnect) {
      onProviderConnect({
        integration: firstMissing.integration,
        label: firstMissing.label,
        action: resolution.action || "redirect",
        target: resolution.provider_target || resolution.target,
        instructions: resolution.instructions || "",
      });
      return;
    }

    // Tenant panel: navigate to integrations page
    const target = resolution.target || "/dashboard/integrations";
    router.push(target);
  };

  const SeverityIcon = severity === "info" ? Info : AlertTriangle;

  return (
    <div className={`${styles.bg} border-b ${styles.border}`}>
      {/* ── Primary Warning ── */}
      <div className="px-4 lg:px-6 py-2.5 flex items-center gap-3">
        <SeverityIcon className={`w-4 h-4 flex-shrink-0 ${styles.icon}`} />

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.text} truncate`}>
            {primary.label}
            {remaining > 0 && (
              <span className={`font-normal ${styles.subtext} ml-1`}>
                and {remaining} more
              </span>
            )}
          </p>
          {primary.cta?.description && !expanded && (
            <p
              className={`text-xs ${styles.subtext} mt-0.5 truncate hidden sm:block`}
            >
              {primary.cta.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Connect button */}
          <button
            onClick={() => handleConnect(primary)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${styles.button}`}
          >
            <Zap className="w-3 h-3" />
            {primary.cta?.text || "Connect"}
          </button>

          {/* Expand toggle (if multiple) */}
          {remaining > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-1.5 rounded-lg transition-colors ${styles.dismiss}`}
              title={expanded ? "Show less" : "Show all"}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Dismiss (only for non-blocking) */}
          {!primary.blocking && (
            <button
              onClick={handleDismiss}
              className={`p-1.5 rounded-lg transition-colors ${styles.dismiss}`}
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded List ── */}
      {expanded && remaining > 0 && (
        <div className="px-4 lg:px-6 pb-3 space-y-1.5">
          {warnings.slice(1).map((warning) => {
            const wSev = warning.severity || "info";
            const wStyles = SEVERITY_STYLES[wSev] || SEVERITY_STYLES.info;
            const firstMissing = warning.missing?.[0];
            const IntIcon =
              INTEGRATION_ICONS[firstMissing?.integration] || Globe;

            return (
              <div
                key={warning.feature}
                className="flex items-center gap-3 py-1.5"
              >
                <IntIcon
                  className={`w-4 h-4 flex-shrink-0 ${wStyles.icon}`}
                />

                <span
                  className={`text-xs font-medium ${wStyles.text} flex-1 truncate`}
                >
                  {warning.label}
                </span>

                <button
                  onClick={() => handleConnect(warning)}
                  className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${wStyles.subtext} hover:underline`}
                >
                  {warning.cta?.text || "Connect"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}