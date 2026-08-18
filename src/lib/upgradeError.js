// src/lib/upgradeError.js
// P0 frontend enforcement: detect the backend's standard "upgrade required"
// response in ONE place, so every feature gate reuses the same client
// handling. Matches apps/billing/enforcement.PlanUpgradeRequired (402).

/**
 * Parse an error thrown by our fetch wrappers into upgrade info, or null
 * if it isn't a plan-gate error.
 *
 * Accepts either the { data } shape (err.data = parsed body) used by most
 * dashboard api helpers, or a raw body object.
 *
 * @returns {null | {
 *   reason: "feature_not_available" | "plan_limit_exceeded" | "upgrade_required",
 *   featureCode: string|null,
 *   limit: number|null,
 *   current: number|null,
 *   plan: string|null,
 *   message: string,
 * }}
 */
export function parseUpgradeError(err) {
  if (!err) return null;
  const body = err.data ?? err.body ?? err;
  const is402 = err.status === 402 || err.statusCode === 402;
  if (!body?.upgrade_required && !is402) return null;

  return {
    reason: body.code || "upgrade_required",
    featureCode: body.feature_code ?? null,
    limit: body.limit ?? null,
    current: body.current ?? null,
    plan: body.current_plan ?? null,
    message: body.detail || "This action requires a plan upgrade.",
  };
}

/** Convenience boolean. */
export function isUpgradeError(err) {
  return parseUpgradeError(err) !== null;
}
