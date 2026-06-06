// src/lib/paymentGateway.js
/**
 * Payment Gateway Utilities
 * ==========================
 *
 * Shared helpers used by BookingModule and OrderCheckout
 * to branch between Stripe and HyperPay payment flows.
 *
 * The backend's initiate_payment / initiateOrderPayment now returns:
 *   { gateway: "stripe",   client_secret: "pi_..." }
 *   { gateway: "hyperpay", checkout_id: "...", widget_url: "...", brands: [...] }
 *
 * This module centralises the detection so individual components
 * never hardcode gateway names.
 */

export const GATEWAY = Object.freeze({
  STRIPE: "stripe",
  HYPERPAY: "hyperpay",
});

/**
 * Detect which gateway the backend chose for this payment.
 *
 * @param {Object} paymentResponse — JSON from initiate_payment / initiateOrderPayment
 * @returns {"stripe"|"hyperpay"|null}
 */
export function detectGateway(paymentResponse) {
  if (!paymentResponse) return null;

  // Explicit field (new backend)
  if (paymentResponse.gateway) return paymentResponse.gateway;

  // Fallback heuristics (backward-compat with old backend)
  if (paymentResponse.client_secret && paymentResponse.client_secret.startsWith("pi_")) {
    return GATEWAY.STRIPE;
  }
  if (paymentResponse.checkout_id) {
    return GATEWAY.HYPERPAY;
  }

  return null;
}

/**
 * Check whether a gateway response requires redirect-based payment
 * (HyperPay widget) vs inline payment (Stripe Elements).
 */
export function isRedirectGateway(gateway) {
  return gateway === GATEWAY.HYPERPAY;
}

/**
 * Build HyperPay callback URL for the current page context.
 *
 * @param {"booking"|"order"|"subscription"} type
 * @param {string} referenceId — booking ID or order ID
 */
export function buildHyperPayCallbackUrl(type, referenceId) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/payment/hyperpay/callback?type=${type}&ref=${referenceId}`;
}