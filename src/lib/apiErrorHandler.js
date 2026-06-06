// src/lib/apiErrorHandler.js
/**
 * Central API Error Handler
 * ─────────────────────────────────────────────────────────────────
 * Intercepts structured error responses from the backend and routes
 * them to the correct UI behavior.
 *
 * Backend sends:  { "code": "maintenance", "detail": "..." }
 * This module:    reads `code`, fires the right callback
 *
 * Integration:
 *   Replace raw `throw err` in your API wrappers with:
 *     import { handleApiError } from "@/lib/apiErrorHandler";
 *     if (!res.ok) return handleApiError(res, data);
 *
 *   Or wrap existing call() functions (see INTEGRATION_GUIDE).
 */

// ═══════════════════════════════════════════════════════════════
// ERROR CODE → BEHAVIOR MAP
// ═══════════════════════════════════════════════════════════════

const PLATFORM_ERRORS = {
  // Full-screen blocking errors (user cannot proceed)
  maintenance:          { level: "block",  title: "Under Maintenance" },
  api_disabled:         { level: "block",  title: "Service Unavailable" },
  capacity_reached:     { level: "block",  title: "Platform at Capacity" },
  payments_disabled: {
  level: "block",
  title: "Payments Unavailable",
},

  // Modal/toast errors (user sees a message, can dismiss)
  registration_closed:  { level: "toast",  title: "Registration Closed" },
  gateway_disabled:     { level: "modal",  title: "Payment Unavailable" },
  booking_rate_exceeded:{ level: "toast",  title: "Too Many Requests" },
  file_too_large:       { level: "field",  title: "File Too Large" },
  provider_limit_reached:{ level: "toast", title: "Limit Reached" },
  service_limit_reached:{ level: "toast",  title: "Limit Reached" },
  daily_booking_limit:  { level: "toast",  title: "Daily Limit Reached" },
  integration_required: { level: "modal",  title: "Integration Required" },
};

// ═══════════════════════════════════════════════════════════════
// GLOBAL LISTENERS
// ═══════════════════════════════════════════════════════════════
//
// Components subscribe to platform errors via these listeners.
// PlatformGate listens for "block" level errors.
// Toast system listens for "toast" level errors.

let _listeners = [];

export function onPlatformError(callback) {
  _listeners.push(callback);
  return () => {
    _listeners = _listeners.filter(cb => cb !== callback);
  };
}

function _broadcast(errorPayload) {
  _listeners.forEach(cb => {
    try { cb(errorPayload); } catch { /* listener crash shouldn't break API flow */ }
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

/**
 * handleApiError — call this instead of throwing raw errors.
 *
 * For platform-level errors (maintenance, gateway_disabled, etc.),
 * it broadcasts to subscribed UI components before throwing.
 *
 * For regular API errors (validation, 404, etc.), it just throws
 * with enriched data so catch blocks can read error.code.
 *
 * @param {Response} res   — the fetch Response object
 * @param {object}   data  — parsed JSON body
 * @throws always — callers still get the error in their catch
 */
export function handleApiError(res, data) {
  const code   = data?.code || "";
  const detail = data?.detail || data?.message || `Request failed (${res.status})`;
  const config = PLATFORM_ERRORS[code];

  const err    = new Error(detail);
  err.status   = res.status;
  err.code     = code;
  err.data     = data;

  // If this is a known platform error, broadcast to UI subscribers
  if (config) {
    _broadcast({
      code,
      detail,
      level: config.level,
      title: config.title,
      status: res.status,
      data,
    });
  }

  throw err;
}

/**
 * isPlatformError — check if a caught error is a specific platform code.
 *
 * Usage in catch blocks:
 *   catch (err) {
 *     if (isPlatformError(err, "file_too_large")) {
 *       setFieldError("File exceeds platform limit");
 *     }
 *   }
 */
export function isPlatformError(err, code) {
  return err?.code === code;
}

/**
 * getPlatformErrorLevel — returns "block" | "toast" | "modal" | "field" | null
 *
 * Usage:
 *   const level = getPlatformErrorLevel(err);
 *   if (level === "block") { /* show full-screen overlay */ 
 
export function getPlatformErrorLevel(err) {
  return PLATFORM_ERRORS[err?.code]?.level || null;
}

// ═══════════════════════════════════════════════════════════════
// WRAPPER FOR EXISTING call() FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * wrapApiCall — wraps your existing fetch-based call() pattern.
 *
 * Your existing pattern:
 *   async function call(url, opts) {
 *     const res = await fetch(url, opts);
 *     const data = await res.json();
 *     if (!res.ok) { const err = new Error(data.detail); throw err; }
 *     return data;
 *   }
 *
 * Replacement:
 *   import { wrapApiCall } from "@/lib/apiErrorHandler";
 *
 *   async function call(url, opts) {
 *     return wrapApiCall(url, opts);
 *   }
 */
export async function wrapApiCall(url, opts = {}) {
  const res  = await fetch(url, { credentials: "include", ...opts });
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return handleApiError(res, data);
  }

  return data;
}