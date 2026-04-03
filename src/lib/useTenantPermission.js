// src/lib/useTenantPermission.js
"use client";

/**
 * useTenantPermission hook
 *
 * Convenience hook for checking tenant permissions in components.
 * Mirrors useFeatureGate but for RBAC instead of plan features.
 *
 * Usage:
 *   const bookings = useTenantPermission("bookings.view");
 *   if (!bookings.allowed) return <AccessDenied />;
 *
 *   const finance = useTenantPermission("finance.manage");
 *   <button disabled={!finance.allowed}>Process Refund</button>
 */

import { useTenantRBAC } from "@/contexts/TenantRBACContext";

export function useTenantPermission(code) {
  const { hasPermission, role, loading } = useTenantRBAC();

  const allowed = hasPermission(code);

  return {
    code,
    allowed,
    loading,
    role,
    message: !allowed
      ? `You need the "${code}" permission to access this feature.`
      : null,
  };
}

/**
 * Check multiple permissions at once.
 *
 * Usage:
 *   const { anyAllowed, allAllowed } = useTenantPermissions([
 *     "bookings.view",
 *     "bookings.edit",
 *   ]);
 */
export function useTenantPermissions(codes = []) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, role, loading } =
    useTenantRBAC();

  return {
    codes,
    anyAllowed: hasAnyPermission(codes),
    allAllowed: hasAllPermissions(codes),
    loading,
    role,
    results: codes.reduce((acc, code) => {
      acc[code] = hasPermission(code);
      return acc;
    }, {}),
  };
}



// ✅ 2. Your useTenantPermission hook (Logic Layer)

// 👉 This is for conditional logic

// const { allowed } = useTenantPermission("orders.manage");
// ✔ Use when:
// Enabling/disabling buttons
// Conditional API calls
// Conditional logic inside components
// 🔥 Example:
// const { allowed } = useTenantPermission("orders.manage");

// <button disabled={!allowed}>
//   Process Order
// </button>