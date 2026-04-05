// src/contexts/PlanContext.js
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { useApp } from "./AppContext";

/**
 * PlanContext
 *
 * Provides plan feature access to the entire tenant dashboard.
 *
 * Usage:
 *   const { hasFeature, getLimit, usage, loading } = usePlan();
 *
 *   if (hasFeature("analytics")) { ... }
 *   const maxProviders = getLimit("max_providers"); // 10 or null (unlimited)
 */

const PlanContext = createContext(undefined);

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used inside PlanProvider");
  return ctx;
}

export function PlanProvider({ children }) {
  const { activeTenant } = useApp();
  const [features, setFeatures] = useState({});
  const [usage, setUsage] = useState({});
  const [planName, setPlanName] = useState(null);
  const [planTier, setPlanTier] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // ── Fetch plan features ─────────────────────────────────────
  const fetchFeatures = useCallback(async () => {
    if (!activeTenant) return;

    const token = Cookies.get("access_token");
    if (!token) return;

    try {
      setLoading(true);

      // Fetch features and usage in parallel
      const [featuresRes, usageRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/plan-features/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant": activeTenant,
          },
          credentials: "include", // 🔥 REQUIRED
        }),
        fetch(`${API_URL}/api/v1/plan-usage/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant": activeTenant,
          },
          credentials: "include", // 🔥 REQUIRED
        }).catch(() => null), // Usage endpoint is optional
      ]);

      if (featuresRes.ok) {
        const data = await featuresRes.json();
        setFeatures(data.features || {});
        console.log(data,"SSSS")
        setPlanName(data.plan_name);
        setPlanTier(data.plan_tier);
      }

      if (usageRes && usageRes.ok) {
        const data = await usageRes.json();
        setUsage(data.usage || {});
      }
    } catch (err) {
      console.error("Failed to load plan features:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTenant, API_URL]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // ── Public helpers ──────────────────────────────────────────

  /**
   * Check if a boolean feature is enabled.
   * @param {string} code - Feature code (e.g., "analytics")
   * @returns {boolean}
   */
  const hasFeature = useCallback(
    (code) => {
      const feature = features[code];
      if (!feature) return false;
      if (feature.type === "unlimited") return true;
      return feature.included === true;
    },
    [features]
  );

  /**
   * Get the numeric limit for a feature.
   * @param {string} code - Feature code (e.g., "max_providers")
   * @returns {number|null} - Number = limit, null = unlimited, 0 = not available
   */
  const getLimit = useCallback(
    (code) => {
      const feature = features[code];
      if (!feature || !feature.included) return 0;
      if (feature.type === "unlimited") return null;
      if (feature.type === "limit") return feature.limit_value || 0;
      return 0;
    },
    [features]
  );

  /**
   * Check if a limit has been reached.
   * @param {string} code - Feature code
   * @param {number} currentCount - Current item count
   * @returns {boolean} - true if limit reached
   */
  const isLimitReached = useCallback(
    (code, currentCount) => {
      const limit = getLimit(code);
      if (limit === null) return false; // unlimited
      return currentCount >= limit;
    },
    [getLimit]
  );

  /**
   * Get usage info for a feature (current count + limit).
   * @param {string} code
   * @returns {{ current: number, limit: number|null, unlimited: boolean } | null}
   */
  const getUsage = useCallback(
    (code) => usage[code] || null,
    [usage]
  );

  /**
   * Refresh features (call after plan upgrade).
   */
  const refresh = useCallback(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return (
    <PlanContext.Provider
      value={{
        // State
        features,
        planName,
        planTier,
        usage,
        loading,

        // Helpers
        hasFeature,
        getLimit,
        isLimitReached,
        getUsage,
        refresh,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}