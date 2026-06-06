// src/hooks/usePlatformFlags.js
"use client";

/**
 * usePlatformFlags
 * ─────────────────────────────────────────────────────────────────
 * Fetches PlatformSettings once per session and caches the result.
 * Returns feature flags + gateway config for conditional UI rendering.
 *
 * Usage:
 *   const { flags, gateway, loading } = usePlatformFlags();
 *
 *   if (!flags.whatsapp_enabled)    → hide WhatsApp integration card
 *   if (!flags.stripe_enabled)      → hide Stripe payment option
 *   if (!flags.allow_registrations) → show "registrations closed" on signup
 *
 * The flags auto-refresh every 5 minutes (matches backend Redis cache TTL).
 * On error, flags fall back to "everything enabled" so the UI never breaks.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const CACHE_KEY    = "platform_flags_cache";
const CACHE_TTL_MS = 5 * 60 * 1000;   // 5 minutes — matches backend Redis

// Defaults: everything on. If fetch fails, UI still works.
const DEFAULT_FLAGS = {
  maintenance_mode:            false,
  registration_open:           true,
  allow_tenant_api_access:     true,
  // require_email_verification:  true,
  whatsapp_enabled:            true,
  google_calendar_enabled:     true,
  stripe_enabled:              true,
  hyperpay_enabled:            true,
};

const DEFAULT_GATEWAY = {
  default_provider:              "stripe",
  allow_tenant_gateway_override: true,
};

// ── Session-level cache ──
function getCached() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch { return null; }
}

function setCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded — no-op */ }
}

export function clearPlatformFlagsCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* no-op */ }
}

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export default function usePlatformFlags() {
  const [flags,   setFlags]   = useState(DEFAULT_FLAGS);
  const [gateway, setGateway] = useState(DEFAULT_GATEWAY);
  const [limits,  setLimits]  = useState({});
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    // 1. Try session cache first
    // const cached = getCached();
    // if (cached) {
    //   setFlags(f => ({ ...DEFAULT_FLAGS, ...(cached.feature_flags || {}) }));
    //   setGateway(g => ({ ...DEFAULT_GATEWAY, ...(cached.gateway_config || {}) }));
    //   setLimits(cached.limits || {});
    //   setLoading(false);
    //   return;
    // }

    // 2. Fetch from backend
    try {
      const isAdminHost =
        typeof window !== "undefined" &&
        window.location.hostname.startsWith("admin.");

      const token = isAdminHost
        ? Cookies.get("platform_access_token")
        : Cookies.get("access_token");

      const endpoint = isAdminHost
        ? "/api/v1/platform/settings/"
        : token
          ? "/api/v1/platform/settings/"
          : "/api/v1/platform/public-settings/";
        
      const res = await fetch(`${API}${endpoint}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        // console.log("PLATFORM SETTINGS:", data);
        setFlags(f => ({ ...DEFAULT_FLAGS, ...(data.feature_flags || {}) }));
        setGateway(g => ({ ...DEFAULT_GATEWAY, ...(data.gateway_config || {}) }));
        setLimits(data.limits || {});
        // setCache(data);
      }
      if (res.status === 503 && isAdminHost) {
        console.warn("Ignoring maintenance mode in admin panel");
        setLoading(false);
        return;
      }
      // If not ok (e.g. 403 for non-admin), keep defaults — UI stays functional
    } catch {
      // Network error — keep defaults
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 5 minutes
    return () => {};
    // intervalRef.current = setInterval(load, CACHE_TTL_MS);
    // return () => clearInterval(intervalRef.current);
  }, [load]);

  return {
    flags,
    gateway,
    limits,
    loading,
    refresh: () => { clearPlatformFlagsCache(); load(); },
  };
}