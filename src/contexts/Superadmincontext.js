"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

import {  platformMe, platformLogout as apiLogout } from "@/lib/platformApi";

/**
 * SuperAdminContext
 *
 * Provides:
 *   user         – basic user object
 *   platform     – { role, permissions[], is_owner, is_admin, … }
 *   loading      – true while verifying session on mount
 *   hasPermission(code)  – permission check helper
 *   hasAnyPermission([codes]) – OR check
 *   logout()     – clears tokens + redirects
 */

const SuperAdminContext = createContext(undefined);

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error("useSuperAdmin must be used inside SuperAdminProvider");
  return ctx;
}

export function SuperAdminProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Load session on mount ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const access = Cookies.get("access_token");
      if (!access) {
        setLoading(false);
        router.replace("/auth/login");
        return;
      }

      try {
        const data = await platformMe();
        // console.log(data,"platformMe")
        
        if (cancelled) return;

        if (!data.platform?.is_platform_employee) {
          // User is authenticated but NOT a platform employee
          router.replace("/auth/login");
          return;
        }

        setUser(data.user);
        setPlatform(data.platform);
      } catch (err) {
        if (!cancelled) {
          console.error("Platform auth check failed:", err);
          router.replace("/auth/login");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    verify();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // console.log(platform,"platformMe")

  // ── Permission helpers ───────────────────────────────────────
  const hasPermission = useCallback(
    (code) => {
      if (!platform) return false;
      if (platform.is_owner) return true; // owner bypasses all
      return (platform.permissions || []).includes(code);
    },
    [platform]
  );

  const hasAnyPermission = useCallback(
    (codes = []) => codes.some((c) => hasPermission(c)),
    [hasPermission]
  );

  // ── Logout ───────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch { /* ignore */ }
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    Cookies.remove("active_tenant");
    setUser(null);
    setPlatform(null);
    router.replace("/auth/login");
  }, [router]);


  // ── Value ────────────────────────────────────────────────────
  return (
    <SuperAdminContext.Provider
      value={{
        user,
        platform,
        loading,
        hasPermission,
        hasAnyPermission,
        logout,
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}