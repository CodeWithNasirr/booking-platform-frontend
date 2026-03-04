"use client";

import { useSuperAdmin } from "@/contexts/Superadmincontext";

/**
 * useHasPermission – shorthand hook for checking platform permissions.
 *
 * Usage:
 *   const canViewTenants = useHasPermission("tenants.view");
 *   const canManage = useHasPermission(["employees.create", "employees.edit"], "any");
 */
export function useHasPermission(permissionOrArray, mode = "any") {
  const { hasPermission, hasAnyPermission } = useSuperAdmin();

  if (typeof permissionOrArray === "string") {
    return hasPermission(permissionOrArray);
  }

  if (Array.isArray(permissionOrArray)) {
    if (mode === "all") {
      return permissionOrArray.every((p) => hasPermission(p));
    }
    return hasAnyPermission(permissionOrArray);
  }

  return false;
}