// src/components/dashboard/TenantPermissionGate.js
"use client";

/**
 * TenantPermissionGate
 *
 * Tenant-level equivalent of superadmin PermissionGate.
 * Conditionally renders children based on tenant permissions.
 *
 * Usage:
 *
 *   // Single permission
 *   <TenantPermissionGate permission="bookings.view">
 *     <BookingsTable />
 *   </TenantPermissionGate>
 *
 *   // Multiple (any match)
 *   <TenantPermissionGate permissions={["finance.view", "finance.manage"]} mode="any">
 *     <FinanceDashboard />
 *   </TenantPermissionGate>
 *
 *   // Silent (render nothing if denied)
 *   <TenantPermissionGate permission="analytics.view" silent>
 *     <AnalyticsWidget />
 *   </TenantPermissionGate>
 *
 *   // Custom fallback
 *   <TenantPermissionGate permission="finance.manage" fallback={<UpgradeBanner />}>
 *     <RefundButton />
 *   </TenantPermissionGate>
 */

import { useTenantRBAC } from "@/contexts/TenantRBACContext";
import { Shield } from "lucide-react";

export default function TenantPermissionGate({
  permission,
  permissions,
  mode = "any",
  fallback,
  silent = false,
  children,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } =
    useTenantRBAC();

  // Don't render anything while loading
  if (loading) return null;

  // Determine required codes
  const codes = permissions || (permission ? [permission] : []);

  // No restriction specified → render children
  if (codes.length === 0) return <>{children}</>;

  // Check permissions
  let allowed = false;
  if (mode === "all") {
    allowed = hasAllPermissions(codes);
  } else {
    allowed = hasAnyPermission(codes);
  }

  if (allowed) return <>{children}</>;

  // Not allowed
  if (silent) return null;

  if (fallback) return <>{fallback}</>;

  // Default access-denied UI
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Shield className="w-12 h-12 mb-3 text-gray-300" />
      <p className="text-sm font-medium">Access Denied</p>
      <p className="text-xs text-gray-400 mt-1">
        You don't have permission to view this content.
      </p>
    </div>
  );
}