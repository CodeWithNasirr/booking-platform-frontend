/**
 * bookingPersistence.js
 *
 * Auto-save / restore booking wizard state via localStorage.
 *
 * State is keyed per-tenant so users working across multiple tenant
 * sites don't collide.
 *
 * Data stored:
 *   { step, serviceId, staffId, date, time, customerData, timestamp }
 *
 * Automatically expires after EXPIRY_HOURS to prevent stale restorations.
 */

const PREFIX = "bp_state_"; // booking persistence
const EXPIRY_HOURS = 24;

// ─── Key builder ────────────────────────────────────────────────────────────

function storageKey(domain) {
  return `${PREFIX}${domain || "default"}`;
}

// ─── Guard ──────────────────────────────────────────────────────────────────

function hasLocalStorage() {
  try {
    const t = "__ls_test__";
    localStorage.setItem(t, "1");
    localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Persist current booking wizard state.
 *
 * Call this on every step change / form interaction.
 */
export function saveBookingState(domain, state) {
  if (!hasLocalStorage()) return;

  try {
    const payload = {
      ...state,
      timestamp: Date.now(),
    };
    localStorage.setItem(storageKey(domain), JSON.stringify(payload));
  } catch (e) {
    console.warn("[bookingPersistence] save failed:", e);
  }
}

/**
 * Load previously saved booking state.
 *
 * Returns `null` when nothing is saved or when the data has expired.
 */
export function loadBookingState(domain) {
  if (!hasLocalStorage()) return null;

  try {
    const raw = localStorage.getItem(storageKey(domain));
    if (!raw) return null;

    const state = JSON.parse(raw);

    // Expire old states
    const age = Date.now() - (state.timestamp || 0);
    if (age > EXPIRY_HOURS * 60 * 60 * 1000) {
      clearBookingState(domain);
      return null;
    }

    return state;
  } catch (e) {
    console.warn("[bookingPersistence] load failed:", e);
    clearBookingState(domain);
    return null;
  }
}

/**
 * Remove saved state (call after successful booking).
 */
export function clearBookingState(domain) {
  if (!hasLocalStorage()) return;

  try {
    localStorage.removeItem(storageKey(domain));
  } catch {
    // silent
  }
}