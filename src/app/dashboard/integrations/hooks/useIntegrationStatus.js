// src/hooks/useIntegrationStatus.js
/**
 * useIntegrationStatus
 *
 * Main integration hook for dashboard-level awareness.
 * Fetches all statuses + warnings on mount, caches for the session,
 * and provides helper methods.
 *
 * Usage (Topbar warning banner):
 *   const { warnings, hasBlocking, refresh } = useIntegrationStatus();
 *
 * Usage (Sidebar feature gating):
 *   const { isConnected } = useIntegrationStatus();
 *   if (!isConnected("google_calendar")) { ... }
 *
 * Usage (after OAuth return):
 *   const { refresh } = useIntegrationStatus();
 *   useEffect(() => { if (searchParams.get("google") === "connected") refresh(); }, []);
 *
 * Auto-refreshes when:
 *   - activeTenant changes
 *   - refresh() is called explicitly
 *
 * Does NOT poll. Intentional — integration status changes are
 * user-initiated (connect/disconnect), so refresh() after those actions.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  fetchIntegrationStatuses,
  fetchIntegrationWarnings,
} from "../lib/integrationStatusApi";

/**
 * @returns {{
 *   statuses:      Record<string, { connected: boolean, scope: string, provider_connected?: boolean, resolution: object }>,
 *   warnings:      Array<{ feature: string, label: string, severity: string, blocking: boolean, cta: object, missing: Array }>,
 *   counts:        { critical: number, warning: number, info: number },
 *   hasBlocking:   boolean,
 *   hasProvider:   boolean,
 *   loading:       boolean,
 *   error:         string | null,
 *   isConnected:   (integrationKey: string) => boolean,
 *   isProviderConnected: (integrationKey: string) => boolean,
 *   getResolution: (integrationKey: string) => object | null,
 *   getWarningsForFeature: (featureKey: string) => object | null,
 *   refresh:       () => Promise<void>,
 * }}
 */
export function useIntegrationStatus() {
  const { activeTenant } = useApp();

  const [statuses, setStatuses] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [counts, setCounts] = useState({ critical: 0, warning: 0, info: 0 });
  const [hasBlocking, setHasBlocking] = useState(false);
  const [hasProvider, setHasProvider] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Prevent double-fetch on strict mode mount
  const fetchedRef = useRef(false);

  const load = useCallback(async () => {
    if (!activeTenant) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [statusData, warningData] = await Promise.all([
        fetchIntegrationStatuses(activeTenant),
        fetchIntegrationWarnings(activeTenant),
      ]);

      setStatuses(statusData.statuses || {});
      setHasProvider(statusData.has_provider_profile || false);

      setWarnings(warningData.warnings || []);
      setCounts(warningData.counts || { critical: 0, warning: 0, info: 0 });
      setHasBlocking(warningData.has_blocking || false);
    } catch (err) {
      console.error("Failed to load integration status:", err);
      setError(err.message || "Failed to load integration status");
    } finally {
      setLoading(false);
      fetchedRef.current = true;
    }
  }, [activeTenant]);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // ── Helper: check tenant-level connection ──────────────────
  const isConnected = useCallback(
    (integrationKey) => {
      return statuses[integrationKey]?.connected === true;
    },
    [statuses]
  );

  // ── Helper: check provider-level connection ────────────────
  const isProviderConnected = useCallback(
    (integrationKey) => {
      const entry = statuses[integrationKey];
      if (!entry) return false;

      // Provider-scoped: use provider_connected if available
      if (entry.scope === "provider" && "provider_connected" in entry) {
        return entry.provider_connected === true;
      }

      // Fallback to tenant-level for non-provider scopes
      return entry.connected === true;
    },
    [statuses]
  );

  // ── Helper: get resolution metadata ────────────────────────
  const getResolution = useCallback(
    (integrationKey) => {
      return statuses[integrationKey]?.resolution || null;
    },
    [statuses]
  );

  // ── Helper: get warnings for a specific feature ────────────
  const getWarningsForFeature = useCallback(
    (featureKey) => {
      return warnings.find((w) => w.feature === featureKey) || null;
    },
    [warnings]
  );

  return {
    // State
    statuses,
    warnings,
    counts,
    hasBlocking,
    hasProvider,
    loading,
    error,

    // Helpers
    isConnected,
    isProviderConnected,
    getResolution,
    getWarningsForFeature,

    // Actions
    refresh: load,
  };
}