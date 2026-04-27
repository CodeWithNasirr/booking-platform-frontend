// src/components/shared/SidebarIntegrationDot.js
"use client";

/**
 * Small colored dot indicator for sidebar items.
 *
 * Shows next to menu label when the feature behind that page
 * has a missing integration. Does NOT block navigation.
 *
 * Severity colors:
 *   critical → red pulse dot (blocking feature)
 *   warning  → amber dot
 *   info     → blue dot (hidden by default, pass showInfo=true)
 *
 * Usage:
 *   <SidebarIntegrationDot severity="critical" tooltip="Google Calendar not connected" />
 */

const STYLES = {
  critical: "bg-red-500",
  warning: "bg-amber-400",
  info: "bg-blue-400",
};

export default function SidebarIntegrationDot({
  severity = "warning",
  tooltip = "",
  showInfo = false,
}) {
  // Don't render info-level dots unless explicitly asked
  if (severity === "info" && !showInfo) return null;

  const color = STYLES[severity] || STYLES.warning;
  const pulse = severity === "critical";

  return (
    <span className="relative flex-shrink-0 ml-auto" title={tooltip}>
      {pulse && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-40 animate-ping`}
        />
      )}
      <span
        className={`relative inline-flex h-2 w-2 rounded-full ${color}`}
      />
    </span>
  );
}