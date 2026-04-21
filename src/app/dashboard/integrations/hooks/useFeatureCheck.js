// src/hooks/useFeatureCheck.js
/**
 * useFeatureCheck
 *
 * Lightweight hook for checking a SINGLE feature's integration status.
 * Designed for forms and modals that need to gate on a specific feature.
 *
 * Unlike useIntegrationStatus (which loads everything at dashboard level),
 * this hook calls the /check/<feature>/ endpoint on demand.
 *
 * ─── Usage: Service creation form ────────────────────────────
 *
 *   const { check, result, loading } = useFeatureCheck();
 *
 *   // When user selects "online" service type:
 *   const onServiceTypeChange = async (type) => {
 *     if (type === "online") {
 *       const r = await check("online_booking");
 *       if (!r.satisfied) {
 *         setShowIntegrationModal(true);
 *       }
 *     }
 *   };
 *
 * ─── Usage: Pre-check before action ─────────────────────────
 *
 *   const { check } = useFeatureCheck();
 *
 *   const handleEnableFeature = async () => {
 *     const r = await check("google_meet_links", providerId);
 *     if (!r.satisfied) {
 *       // r.missing[0].resolution.action → "oauth"
 *       // r.missing[0].resolution.provider_target → "google_calendar_modal"
 *       openModal(r);
 *       return;
 *     }
 *     // proceed...
 *   };
 *
 * ─── Usage: Service config pre-check ────────────────────────
 *
 *   const { checkService, serviceResult } = useFeatureCheck();
 *
 *   useEffect(() => {
 *     if (form.serviceType === "online" && form.orderType === "booking") {
 *       checkService({ service_type: "online", order_type: "booking" });
 *     }
 *   }, [form.serviceType, form.orderType]);
 *
 *   // serviceResult.can_proceed === false → show warning
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  checkFeature,
  checkServiceIntegrations,
} from "../lib/integrationStatusApi";

/**
 * @returns {{
 *   check:          (featureKey: string, providerId?: string) => Promise<FeatureCheckResult>,
 *   checkService:   (params: { service_type: string, order_type: string, provider_id?: string }) => Promise<ServiceCheckResult>,
 *   result:         FeatureCheckResult | null,
 *   serviceResult:  ServiceCheckResult | null,
 *   loading:        boolean,
 *   error:          string | null,
 *   reset:          () => void,
 * }}
 *
 * FeatureCheckResult: {
 *   feature, label, satisfied, mode, blocking, severity,
 *   cta: { text, description },
 *   missing: [{ integration, label, resolution }],
 *   connected: [string]
 * }
 *
 * ServiceCheckResult: {
 *   features_required: [string],
 *   checks: [FeatureCheckResult],
 *   can_proceed: boolean,
 *   has_warnings: boolean
 * }
 */
export function useFeatureCheck() {
  const { activeTenant } = useApp();

  const [result, setResult] = useState(null);
  const [serviceResult, setServiceResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dedup concurrent calls for the same feature
  const pendingRef = useRef(null);

  // ── Check single feature ──────────────────────────────────
  const check = useCallback(
    async (featureKey, providerId = null) => {
      if (!activeTenant || !featureKey) return null;

      // Dedup: if same check is already in flight, return that promise
      const cacheKey = `${featureKey}:${providerId || ""}`;
      if (pendingRef.current?.key === cacheKey) {
        return pendingRef.current.promise;
      }

      const promise = (async () => {
        try {
          setLoading(true);
          setError(null);

          const data = await checkFeature(activeTenant, featureKey, providerId);
          setResult(data);
          return data;
        } catch (err) {
          const msg = err.message || "Feature check failed";
          setError(msg);
          console.error(`useFeatureCheck(${featureKey}):`, err);
          return null;
        } finally {
          setLoading(false);
          pendingRef.current = null;
        }
      })();

      pendingRef.current = { key: cacheKey, promise };
      return promise;
    },
    [activeTenant]
  );

  // ── Check service config (pre-creation) ───────────────────
  const checkService = useCallback(
    async (params) => {
      if (!activeTenant) return null;

      try {
        setLoading(true);
        setError(null);

        const data = await checkServiceIntegrations(activeTenant, params);
        setServiceResult(data);
        return data;
      } catch (err) {
        const msg = err.message || "Service check failed";
        setError(msg);
        console.error("useFeatureCheck.checkService:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [activeTenant]
  );

  // ── Reset state ───────────────────────────────────────────
  const reset = useCallback(() => {
    setResult(null);
    setServiceResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    check,
    checkService,
    result,
    serviceResult,
    loading,
    error,
    reset,
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: Extract the first resolution for quick UI rendering
// ═══════════════════════════════════════════════════════════════

/**
 * Given a feature check result, return the most relevant resolution
 * for the current panel context.
 *
 * @param {FeatureCheckResult} result
 * @param {"tenant"|"provider"} panel - which panel the user is on
 * @returns {{ integration, label, action, target, instructions } | null}
 */
export function getPrimaryResolution(result, panel = "tenant") {
  if (!result || result.satisfied || !result.missing?.length) return null;

  const first = result.missing[0];
  const res = first.resolution || {};

  return {
    integration: first.integration,
    label: first.label,
    action: res.action || "redirect",
    target:
      panel === "provider" && res.provider_target
        ? res.provider_target
        : res.target || "/dashboard/integrations",
    instructions: res.instructions || "",
  };
}