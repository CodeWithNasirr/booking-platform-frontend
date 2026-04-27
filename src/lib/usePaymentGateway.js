// src/hooks/usePaymentGateway.js
"use client";

/**
 * usePaymentGateway
 *
 * Main hook for payment gateway awareness across the dashboard.
 *
 * Usage 1 — Integrations page (load gateway status):
 *   const { status, loading, refresh } = usePaymentGateway();
 *   // status.gateways.stripe_connect.connected → true/false
 *
 * Usage 2 — Service/Booking creation (intercept gate errors):
 *   const { handleGatewayError, GatewayGateModal } = usePaymentGateway();
 *
 *   try {
 *     await createService(data);
 *   } catch (err) {
 *     if (handleGatewayError(err)) return; // shows modal
 *     // handle other errors...
 *   }
 *
 *   // Render the modal
 *   {GatewayGateModal}
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import { fetchGatewayStatus } from "@/lib/gatewayApi";
import {
  CreditCard, X, ArrowRight, Shield, AlertTriangle,
} from "lucide-react";

export function usePaymentGateway({ autoLoad = true } = {}) {
  const { activeTenant } = useApp();
  const router = useRouter();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gateInfo, setGateInfo] = useState(null);

  // ── Load gateway status ────────────────────────────────────
  const load = useCallback(async () => {
    if (!activeTenant) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await fetchGatewayStatus(activeTenant);
      setStatus(data);
    } catch (err) {
      console.error("Failed to load gateway status:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTenant]);

  useEffect(() => {
    if (autoLoad) load();
  }, [load, autoLoad]);

  // ── Derived state ──────────────────────────────────────────
  const isConnected = status?.connected || false;
  const activeGateway = status?.active_gateway || null;
  const stripeConnected = status?.gateways?.stripe_connect?.connected || false;
  const hyperpayConnected = status?.gateways?.hyperpay?.connected || false;

  // ── Error interceptor ──────────────────────────────────────
  const handleGatewayError = useCallback((error) => {
    const data = error?.data || error;
    if (data?.gateway_gate || data?.code === "payment_gateway_required") {
      setGateInfo({
        message: data.detail || "Connect a payment gateway to proceed.",
        cta: data.cta,
      });
      return true; // consumed
    }
    return false; // not a gateway error
  }, []);

  const dismissGate = useCallback(() => setGateInfo(null), []);

  const navigateToSetup = useCallback(() => {
    setGateInfo(null);
    router.push("/dashboard/integrations");
  }, [router]);

  // ── Gate Modal Component ───────────────────────────────────
  const GatewayGateModal = gateInfo ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismissGate}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-amber-600" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
          Payment Gateway Required
        </h3>

        {/* Message */}
        <p className="text-sm text-gray-600 text-center mb-4">
          {gateInfo.message}
        </p>

        {/* Gateway options */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Stripe Connect</p>
              <p className="text-xs text-gray-500">
                Accept Visa, Mastercard globally
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">HyperPay</p>
              <p className="text-xs text-gray-500">
                MADA, Visa, Mastercard, Apple Pay (Saudi Arabia)
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={dismissGate}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Later
          </button>
          <button
            onClick={navigateToSetup}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B1E3F] to-[#6B1630] text-white font-medium hover:opacity-90 flex items-center justify-center gap-2"
          >
            Connect Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return {
    // State
    status,
    loading,
    isConnected,
    activeGateway,
    stripeConnected,
    hyperpayConnected,

    // Error handling
    handleGatewayError,
    gateInfo,
    dismissGate,
    GatewayGateModal,

    // Actions
    refresh: load,
  };
}