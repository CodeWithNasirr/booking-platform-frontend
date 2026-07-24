"use client";

import { useSuperAdmin } from "@/contexts/Superadmincontext";
import { Shield } from "lucide-react";

/**
 * PermissionGate
 *
 * Conditionally renders children if the current user has the required permission(s).
 *
 * Usage:
 *   <PermissionGate permission="tenants.view">
 *     <TenantsList />
 *   </PermissionGate>
 *
 *   <PermissionGate permissions={["billing.view", "plans.view"]} mode="any">
 *     <BillingPage />
 *   </PermissionGate>
 *
 * Props:
 *   permission   – single permission code
 *   permissions  – array of permission codes
 *   mode         – "any" (default) or "all"
 *   fallback     – custom fallback UI (default: access-denied message)
 *   silent       – if true, renders nothing instead of fallback
 */
export default function PermissionGate({
  permission,
  permissions,
  mode = "any",
  fallback,
  silent = false,
  children,
}) {
  const { hasAnyPermission, hasAllPermissions, loading } = useSuperAdmin();

  if (loading) return null;

  // Determine required codes
  const codes = permissions || (permission ? [permission] : []);

  // If no codes specified, render children (no restriction)
  if (codes.length === 0) return <>{children}</>;

  // Check permissions
  const allowed =
    mode === "all" ? hasAllPermissions(codes) : hasAnyPermission(codes);

  if (allowed) return <>{children}</>;

  // Not allowed
  if (silent) return null;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Shield className="w-12 h-12 mb-3 text-gray-300" />
      <p className="text-sm font-medium">Access Denied</p>
      <p className="text-xs text-gray-400 mt-1">
        You don&apos;t have permission to view this content.
      </p>
    </div>
  );
}