// src/app/tenant-site/modules/order-checkout/hooks/useCheckoutState.js
"use client";

/**
 * useCheckoutState — Persists checkout wizard state across page refreshes
 *
 * Stores in localStorage keyed by domain + service slug.
 * Generates a checkout_session_id (UUID) on first visit — sent to backend
 * as idempotency key to prevent duplicate order creation.
 *
 * Auto-expires after EXPIRY_MINUTES to avoid stale carts.
 */

import { useState, useEffect, useCallback, useRef } from "react";

const EXPIRY_MINUTES = 30;
const VERSION = 1; // bump to invalidate old cached states

function storageKey(domain, serviceSlug) {
  return `order_checkout:${domain}:${serviceSlug}`;
}

function generateSessionId() {
  // Crypto-safe UUID v4
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Shape of persisted state
const EMPTY_STATE = {
  version: VERSION,
  checkoutSessionId: null,
  step: 0,
  selectedPackageId: null,
  requirements: {},
  customerData: { name: "", email: "", phone: "" },
  // Payment state (set after initiateOrderPayment)
  clientSecret: null,
  orderId: null,
  orderNumber: null,
  totalAmount: null,
  currency: null,
  // Completion
  completed: false,
  timestamp: null,
  // Gateway-agnostic fields
  gateway: null,              // "stripe" | "hyperpay"
  checkoutId: null,           // HyperPay checkout ID
  widgetUrl: null,            // HyperPay widget JS URL
  brands: null,               // ["VISA", "MASTER", "MADA"]
  callbackUrl: null,          // HyperPay callback URL
};

export default function useCheckoutState(domain, serviceSlug) {
  const [state, setState] = useState(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const key = storageKey(domain, serviceSlug);
  const saveTimeoutRef = useRef(null);

  // ─── Load from localStorage on mount ───
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);

        // Version check
        if (parsed.version !== VERSION) {
          localStorage.removeItem(key);
          initFresh();
          return;
        }

        // Expiry check
        const age = Date.now() - (parsed.timestamp || 0);
        if (age > EXPIRY_MINUTES * 60 * 1000) {
          localStorage.removeItem(key);
          initFresh();
          return;
        }

        setState(parsed);
      } else {
        initFresh();
      }
    } catch {
      initFresh();
    }
    setHydrated(true);
  }, [key]);

  function initFresh() {
    const fresh = {
      ...EMPTY_STATE,
      checkoutSessionId: generateSessionId(),
      timestamp: Date.now(),
    };
    setState(fresh);
    try {
      localStorage.setItem(key, JSON.stringify(fresh));
    } catch {}
  }

  // ─── Debounced save to localStorage ───
  const persist = useCallback(
    (newState) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            key,
            JSON.stringify({ ...newState, timestamp: Date.now() })
          );
        } catch {}
      }, 100);
    },
    [key]
  );

  // ─── Update helpers (each persists automatically) ───

  const update = useCallback(
    (patch) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setStep = useCallback((step) => update({ step }), [update]);

  const setSelectedPackageId = useCallback(
    (id) => update({ selectedPackageId: id }),
    [update]
  );

  const setRequirements = useCallback(
    (requirements) => update({ requirements }),
    [update]
  );

  const setCustomerData = useCallback(
    (customerData) => update({ customerData }),
    [update]
  );

  // Called after initiateOrderPayment succeeds
  const setPaymentReady = useCallback(
      ({ clientSecret, orderId, orderNumber, totalAmount, currency, gateway, checkoutId, widgetUrl, brands, callbackUrl }) =>
        update({
          clientSecret,
          orderId,
          orderNumber,
          totalAmount,
          currency,
          gateway: gateway || (clientSecret ? "stripe" : "hyperpay"),
          checkoutId: checkoutId || null,
          widgetUrl: widgetUrl || null,
          brands: brands || null,
          callbackUrl: callbackUrl || null,
          step: 2,
        }),
      [update]
    );

  // Called after payment confirmation succeeds
  const setCompleted = useCallback(
    (confirmData) =>
      update({
        completed: true,
        step: 3,
        // Merge any extra data from confirm response
        ...(confirmData?.order_number && {
          orderNumber: confirmData.order_number,
        }),
        ...(confirmData?.total_amount && {
          totalAmount: confirmData.total_amount,
        }),
      }),
    [update]
  );

  // Clear everything (after completion or manual reset)
  const reset = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {}
    initFresh();
  }, [key]);

  // Check if we have an existing order (for resume after refresh)
  const hasExistingOrder = Boolean(
    state.orderId && (state.clientSecret || state.checkoutId)
  );

  return {
    // State
    ...state,
    hydrated,
    hasExistingOrder,

    // Setters
    setStep,
    setSelectedPackageId,
    setRequirements,
    setCustomerData,
    setPaymentReady,
    setCompleted,
    reset,
    update,
  };
}