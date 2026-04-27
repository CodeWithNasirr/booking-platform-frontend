// src/hooks/useBillingGate.js
/**
 * useBillingGate — Frontend billing access check
 *
 * Intercepts API responses with `billing_gate: true` and
 * provides state for showing upgrade modals or warning banners.
 *
 * Usage:
 *   const { isBlocked, gateInfo, dismissGate, BillingGateModal } = useBillingGate();
 *
 *   // In your create handler:
 *   try {
 *     await createService(data);
 *   } catch (err) {
 *     if (err.billing_gate) {
 *       // Hook automatically shows the modal
 *       return;
 *     }
 *   }
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CreditCard, FileText, X, ArrowRight } from "lucide-react";

export function useBillingGate() {
  const router = useRouter();
  const [gateInfo, setGateInfo] = useState(null);

  const isBlocked = !!gateInfo;

  /**
   * Call this when an API error has `billing_gate: true`.
   * Automatically parses the error and shows the gate modal.
   */
  const handleBillingError = useCallback((error) => {
    if (error?.billing_gate || error?.data?.billing_gate) {
      const data = error?.data || error;
      setGateInfo({
        code: data.code,
        message: data.detail || data.message,
        cta: data.cta,
        gracePeriod: data.grace_period || false,
        documentStatus: data.document_status,
      });
      return true; // consumed
    }
    return false; // not a billing error
  }, []);

  const dismissGate = useCallback(() => setGateInfo(null), []);

  const navigateToCta = useCallback(() => {
    if (gateInfo?.cta?.url) {
      router.push(gateInfo.cta.url);
    }
    setGateInfo(null);
  }, [gateInfo, router]);

  // ── Gate Modal Component ──
  const BillingGateModal = gateInfo ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismissGate} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            gateInfo.code === "billing_document_required"
              ? "bg-amber-100"
              : gateInfo.code === "billing_past_due"
              ? "bg-orange-100"
              : "bg-red-100"
          }`}>
            {gateInfo.code === "billing_document_required" ? (
              <FileText className={`w-7 h-7 text-amber-600`} />
            ) : (
              <CreditCard className={`w-7 h-7 ${
                gateInfo.code === "billing_past_due" ? "text-orange-600" : "text-red-600"
              }`} />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
          {gateInfo.code === "billing_no_subscription" && "Subscription Required"}
          {gateInfo.code === "billing_subscription_expired" && "Subscription Expired"}
          {gateInfo.code === "billing_subscription_cancelled" && "Subscription Cancelled"}
          {gateInfo.code === "billing_past_due" && "Payment Failed"}
          {gateInfo.code === "billing_document_required" && "Verification Required"}
          {gateInfo.code === "billing_incomplete" && "Complete Your Setup"}
          {!gateInfo.code?.startsWith("billing_") && "Access Restricted"}
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 text-center mb-6">
          {gateInfo.message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={dismissGate}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            Close
          </button>
          {gateInfo.cta && (
            <button
              onClick={navigateToCta}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B1E3F] to-[#6B1630] text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {gateInfo.cta.label || "View Plans"}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return {
    isBlocked,
    gateInfo,
    handleBillingError,
    dismissGate,
    navigateToCta,
    BillingGateModal,
  };
}

/**
 * parseBillingError — Utility to detect billing gate errors from API responses.
 *
 * Usage in API functions:
 *   const res = await fetch(...);
 *   if (!res.ok) {
 *     const error = await res.json();
 *     if (error.billing_gate) {
 *       throw Object.assign(new Error(error.detail), { billing_gate: true, data: error });
 *     }
 *   }
 */
export function parseBillingError(errorData) {
  if (errorData?.billing_gate) {
    const err = new Error(errorData.detail || "Subscription required");
    err.billing_gate = true;
    err.data = errorData;
    return err;
  }
  return null;
}