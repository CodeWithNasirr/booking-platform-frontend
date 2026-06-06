// src/contexts/TenantRBACContext.js
"use client";

/**
 * TenantRBACContext
 *
 * Tenant-level equivalent of SuperAdminContext.
 * Provides role, permissions, and permission-check helpers
 * for the currently active tenant membership.
 *
 * Loaded ONCE on dashboard mount via GET /api/v1/tenant/rbac/me/
 *
 * Usage:
 *   const { role, hasPermission, hasAnyPermission, sidebarMap } = useTenantRBAC();
 *
 *   if (hasPermission("bookings.view")) { ... }
 *
 *   // Sidebar gating:
 *   if (sidebarMap["tenant-bookings"]) { ... }
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Cookies from "js-cookie";
import { useApp } from "./AppContext";
import { apiFetch } from "@/lib/apiClient";
const TenantRBACContext = createContext(undefined);

export function useTenantRBAC() {
  const ctx = useContext(TenantRBACContext);
  if (!ctx) {
    throw new Error("useTenantRBAC must be used inside TenantRBACProvider");
  }
  return ctx;
}

export function TenantRBACProvider({ children }) {
  const { user, activeTenant, loadingUser } = useApp();

  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || "";

  // ── Fetch RBAC data on mount / tenant change ─────────────────
  useEffect(() => {
  if (loadingUser) {
    return;
  }

  if (!user || !activeTenant) {
    setMembership(null);
    setLoading(false);
    return;
  }

    let cancelled = false;

async function fetchRBAC() {
    setLoading(true);

    try {
      const data = await apiFetch(
        "/api/v1/tenants/rbac/me/",
        activeTenant
      );

      console.log("TenantRBAC data:", data);

      if (!cancelled) {
        setMembership(data);
      }

    } catch (err) {
      console.error(
        "TenantRBAC fetch failed:",
        err
      );

      if (!cancelled) {
        setMembership(null);
      }

    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

    fetchRBAC();
    return () => {
      cancelled = true;
    };
  }, [user, activeTenant, loadingUser, API]);

  // ── Permission helpers (same API as SuperAdminContext) ────────

  const role = membership?.role || null;
  const permissions = membership?.permissions || [];
  const sidebarMap = membership?.sidebar_map || {};
 
  /**
   * Check a single permission.
   * Owner always returns true.
   */
  const hasPermission = useCallback(
    (code) => {
      if (!membership) return false;
      if (membership.is_owner) return true;
      return permissions.includes(code);
    },
    [membership, permissions]
  );

  /**
   * Check if user has ANY of the given permissions.
   */
  const hasAnyPermission = useCallback(
    (codes = []) => codes.some((c) => hasPermission(c)),
    [hasPermission]
  );

  /**
   * Check if user has ALL of the given permissions.
   */
  const hasAllPermissions = useCallback(
    (codes = []) => codes.every((c) => hasPermission(c)),
    [hasPermission]
  );

  /**
   * Check if a sidebar menu item should be visible.
   * Falls back to permission check if sidebar_map not loaded.
   */
  const canSeeSidebarItem = useCallback(
    (menuKey) => {
      if (!membership) return false;
      if (membership.is_owner) return true;

      // Use pre-computed sidebar map from backend
      if (sidebarMap && menuKey in sidebarMap) {
        return sidebarMap[menuKey];
      }

      // Fallback: always show if no mapping defined
      return true;
    },
    [membership, sidebarMap]
  );

  // ── Value ────────────────────────────────────────────────────

  return (
    <TenantRBACContext.Provider
      value={{
        // State
        membership,
        loading,

        // Role info
        role,
        roleLevel: membership?.role_level || 0,
        isOwner: membership?.is_owner || false,
        isAdmin: membership?.is_admin || false,
        isMember: membership?.is_member || false,

        // Permissions
        permissions,
        extraPermissions: membership?.extra_permissions || [],

        // Helpers
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,

        // Sidebar
        sidebarMap,
        canSeeSidebarItem,

        // Convenience flags from backend
        canManageMembers: membership?.can_manage_members || false,
        canManageSettings: membership?.can_manage_settings || false,
        canManageBilling: membership?.can_manage_billing || false,
      }}
    >
      {children}
    </TenantRBACContext.Provider>
  );
}