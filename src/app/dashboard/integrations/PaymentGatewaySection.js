// src/components/dashboard/integrations/PaymentGatewaySection.js
"use client";

/**
 * PaymentGatewaySection
 *
 * Rendered at the top of the Integrations page.
 * Shows Stripe Connect and HyperPay as primary gateway cards
 * with connect/configure/disconnect actions.
 *
 * Usage in IntegrationsPage.js:
 *   import PaymentGatewaySection from '@/components/dashboard/integrations/PaymentGatewaySection'
 *
 *   <PaymentGatewaySection activeTenant={activeTenant} />
 */

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard, Shield, Check, X, Loader2, ExternalLink,
  Unplug, ArrowRight, AlertTriangle, Eye, EyeOff, ChevronDown,
  ChevronUp, Zap, Globe, CheckCircle2, Copy, RefreshCw, ShieldCheck,
} from "lucide-react";
import {
  fetchGatewayStatus,
  startStripeConnect,
  syncStripeConnect,
  disconnectStripeConnect,
  configureHyperPay,
  disconnectHyperPay,
  configureMoyasar,
  testMoyasar,
  disconnectMoyasar,
  setPreferredGateway,
  rotateMoyasarWebhook,
} from "@/lib/gatewayApi";
import { useSearchParams } from "next/navigation";

export default function PaymentGatewaySection({ activeTenant }) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showHyperPayForm, setShowHyperPayForm] = useState(false);
  const [showMoyasarForm, setShowMoyasarForm] = useState(false);
  const [toast, setToast] = useState(null);

  const loadStatus = useCallback(async () => {
    if (!activeTenant) return;
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
    loadStatus();
  }, [loadStatus]);

  // ── Handle return from Stripe onboarding ──
  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam === "connected" && activeTenant) {
      syncStripeConnect(activeTenant)
        .then(() => {
          showToast("Stripe Connect verified!", "success");
          loadStatus();
        })
        .catch(() => showToast("Could not verify Stripe status", "error"));
    }
  }, [searchParams, activeTenant, loadStatus]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Stripe Connect handlers ──
  const handleStripeConnect = async () => {
    setActionLoading("stripe");
    try {
      const result = await startStripeConnect(activeTenant);
      if (result.onboarding_url) {
        window.location.href = result.onboarding_url;
      }
    } catch (err) {
      showToast(err.message || "Failed to start Stripe setup", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStripeDisconnect = async () => {
    if (!confirm("Disconnect Stripe Connect? You won't be able to accept payments until you reconnect."))
      return;
    setActionLoading("stripe_disconnect");
    try {
      await disconnectStripeConnect(activeTenant);
      showToast("Stripe Connect disconnected");
      loadStatus();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── HyperPay handlers ──
  const handleHyperPayDisconnect = async () => {
    if (!confirm("Disconnect HyperPay? MADA and card payments will stop."))
      return;
    setActionLoading("hyperpay_disconnect");
    try {
      await disconnectHyperPay(activeTenant);
      showToast("HyperPay disconnected");
      loadStatus();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Moyasar handlers ──
  const handleMoyasarDisconnect = async () => {
    if (!confirm("Disconnect Moyasar? Mada and card payments through Moyasar will stop."))
      return;
    setActionLoading("moyasar_disconnect");
    try {
      await disconnectMoyasar(activeTenant);
      showToast("Moyasar disconnected");
      loadStatus();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetPreferred = async (provider) => {
    setActionLoading(`prefer_${provider}`);
    try {
      await setPreferredGateway(activeTenant, provider);
      showToast(`${provider} set as preferred gateway`);
      loadStatus();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#8B1E3F]" />
        </div>
      </div>
    );
  }

  const stripe = status?.gateways?.stripe_connect || {};
  const hyperpay = status?.gateways?.hyperpay || {};
  const moyasar = status?.gateways?.moyasar || {};
  const anyConnected = status?.connected || false;
  const activeGateway = status?.active_gateway || null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#8B1E3F]" />
            Payment Gateways
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Connect at least one gateway to accept payments from customers.
          </p>
        </div>
        {anyConnected && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Active
          </span>
        )}
      </div>

      {/* Warning if none connected */}
      {!anyConnected && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">No payment gateway connected</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You cannot create paid services or accept bookings until you connect Stripe or HyperPay.
            </p>
          </div>
        </div>
      )}

      {/* Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ═══ STRIPE CONNECT ═══ */}
        <div
          className={`rounded-2xl border p-5 transition-all ${
            stripe.connected
              ? "border-green-200 bg-green-50/30"
              : "border-gray-200 bg-white hover:border-[#8B1E3F]/30"
          }`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Stripe Connect</h3>
                <GatewayDot connected={stripe.connected} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Accept Visa, Mastercard, Apple Pay globally
              </p>
            </div>
          </div>

          {/* Connected details */}
          {stripe.connected && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100 space-y-1">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Charges enabled</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payouts enabled</span>
              </div>
              {stripe.account_id && (
                <p className="text-[10px] text-green-600 font-mono">
                  {stripe.account_id}
                </p>
              )}
            </div>
          )}

          {/* Pending state */}
          {stripe.account_id &&  !stripe.connected && ["pending", "pending_verification"].includes(stripe.status) && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-sm text-amber-700 font-medium">
                Onboarding incomplete
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Complete the Stripe onboarding to activate payments.
              </p>
            </div>
          )}

          {/* Features */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {["Visa/MC", "Apple Pay", "Refunds", "Global"].map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 text-[11px] font-medium text-gray-600 bg-gray-50 rounded-md border border-gray-100"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {stripe.connected ? (
              <>
                <button
                  onClick={handleStripeConnect}
                  disabled={actionLoading === "stripe"}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={handleStripeDisconnect}
                  disabled={actionLoading === "stripe_disconnect"}
                  className="px-3 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
                >
                  {actionLoading === "stripe_disconnect" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unplug className="w-4 h-4" />
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleStripeConnect}
                disabled={actionLoading === "stripe"}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-sm font-medium text-sm"
              >
                {actionLoading === "stripe" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {stripe.status === "pending" ? "Continue Setup" : "Connect Stripe"}
              </button>
            )}
          </div>
        </div>

        {/* ═══ HYPERPAY ═══ */}
        <div
          className={`rounded-2xl border p-5 transition-all ${
            hyperpay.connected
              ? "border-green-200 bg-green-50/30"
              : "border-gray-200 bg-white hover:border-[#8B1E3F]/30"
          }`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-md">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">HyperPay</h3>
                <GatewayDot connected={hyperpay.connected} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                MADA, Visa, Mastercard, Apple Pay (Saudi Arabia)
              </p>
            </div>
          </div>

          {/* Connected details */}
          {hyperpay.connected && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100 space-y-1">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payments active</span>
              </div>
              {hyperpay.has_mada && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>MADA cards enabled</span>
                </div>
              )}
            </div>
          )}

          {/* Features */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {["MADA", "Visa/MC", "Apple Pay", "STC Pay", "Saudi"].map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 text-[11px] font-medium text-gray-600 bg-gray-50 rounded-md border border-gray-100"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {hyperpay.connected ? (
              <>
                <button
                  onClick={() => setShowHyperPayForm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  Update Config
                </button>
                <button
                  onClick={handleHyperPayDisconnect}
                  disabled={actionLoading === "hyperpay_disconnect"}
                  className="px-3 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
                >
                  {actionLoading === "hyperpay_disconnect" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unplug className="w-4 h-4" />
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowHyperPayForm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-sm font-medium text-sm"
              >
                <Zap className="w-4 h-4" />
                Configure HyperPay
              </button>
            )}
          </div>
        </div>

        {/* ═══ MOYASAR ═══ */}
        <div
          className={`rounded-2xl border p-5 transition-all ${
            moyasar.connected
              ? "border-green-200 bg-green-50/30"
              : "border-gray-200 bg-white hover:border-[#8B1E3F]/30"
          }`}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-600 flex items-center justify-center shadow-md">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Moyasar</h3>
                <GatewayDot connected={moyasar.connected} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Mada, Visa, Mastercard, Apple Pay, STC Pay (Saudi Arabia)
              </p>
            </div>
          </div>

          {/* Connected details */}
          {moyasar.connected && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100 space-y-1">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payments active</span>
              </div>
              {moyasar.test_mode !== null && (
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold ${
                      moyasar.test_mode
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {moyasar.test_mode ? "TEST MODE" : "LIVE"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Supported methods — only what the integration supports */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(moyasar.connected
              ? (moyasar.supported_methods || [])
              : ["mada", "visa", "mastercard", "applepay", "stcpay"]
            ).map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 text-[11px] font-medium text-gray-600 bg-gray-50 rounded-md border border-gray-100 capitalize"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Preferred badge / action */}
          {moyasar.connected && (
            <div className="mb-3">
              {activeGateway === "moyasar" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8B1E3F]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Preferred gateway
                </span>
              ) : (
                <button
                  onClick={() => handleSetPreferred("moyasar")}
                  disabled={actionLoading === "prefer_moyasar"}
                  className="text-[11px] font-medium text-gray-500 hover:text-[#8B1E3F] underline"
                >
                  {actionLoading === "prefer_moyasar" ? "Setting…" : "Set as preferred"}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {moyasar.connected ? (
              <>
                <button
                  onClick={() => setShowMoyasarForm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 text-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  Configure
                </button>
                <button
                  onClick={handleMoyasarDisconnect}
                  disabled={actionLoading === "moyasar_disconnect"}
                  className="px-3 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
                >
                  {actionLoading === "moyasar_disconnect" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unplug className="w-4 h-4" />
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowMoyasarForm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-sm font-medium text-sm"
              >
                <Zap className="w-4 h-4" />
                Connect Moyasar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MOYASAR CONFIG MODAL ═══ */}
      {showMoyasarForm && (
        <MoyasarConfigModal
          activeTenant={activeTenant}
          existing={moyasar}
          onClose={() => setShowMoyasarForm(false)}
          onSaved={() => {
            // Reload status but keep the modal open to show the webhook secret.
            showToast("Moyasar configured successfully!");
            loadStatus();
          }}
          onToast={showToast}
        />
      )}

      {/* ═══ HYPERPAY CONFIG MODAL ═══ */}
      {showHyperPayForm && (
        <HyperPayConfigModal
          activeTenant={activeTenant}
          existing={hyperpay}
          onClose={() => setShowHyperPayForm(false)}
          onSuccess={() => {
            setShowHyperPayForm(false);
            showToast("HyperPay configured successfully!");
            loadStatus();
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`px-6 py-3 rounded-xl shadow-lg text-white font-medium ${
              toast.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gateway status dot ─────────────────────────────────────────

function GatewayDot({ connected }) {
  return (
    <div
      className="flex items-center gap-1.5"
      title={connected ? "Connected" : "Not connected"}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-green-500 ring-2 ring-green-200" : "bg-gray-300 ring-2 ring-gray-100"
        }`}
      />
      <span className="text-[11px] font-medium text-gray-500">
        {connected ? "Connected" : "Not connected"}
      </span>
    </div>
  );
}

// ── Moyasar Config Modal ───────────────────────────────────────

function MoyasarConfigModal({ activeTenant, existing, onClose, onSaved, onToast }) {
  const [form, setForm] = useState({
    secret_key: "",
    publishable_key: existing?.publishable_key || "",
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState(null);
  const [showSecretInput, setShowSecretInput] = useState(false);
  // After a successful save, the backend returns the tenant webhook URL +
  // the freshly-generated webhook secret (shown ONCE). This drives step 2.
  const [webhook, setWebhook] = useState(null); // { url, secret }
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const env = form.secret_key.startsWith("sk_live_")
    ? "live"
    : form.secret_key.startsWith("sk_test_")
    ? "test"
    : null;

  const copy = (val, label) => {
    if (val) {
      navigator.clipboard?.writeText(val);
      onToast?.(`${label} copied`);
    }
  };

  const handleTest = async () => {
    if (!form.secret_key.trim()) {
      setError("Enter a secret key to test.");
      return;
    }
    setTesting(true);
    setError(null);
    try {
      const res = await testMoyasar(activeTenant, { secret_key: form.secret_key.trim() });
      onToast?.(`Connection succeeded (${res.test_mode ? "test" : "live"} mode).`, "success");
    } catch (err) {
      setError(err.message || "Connection test failed.");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!form.secret_key.trim()) {
      setError("Secret key is required.");
      return;
    }
    if (!form.secret_key.startsWith("sk_test_") && !form.secret_key.startsWith("sk_live_")) {
      setError("Secret key must start with sk_test_ or sk_live_.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Note: the tenant does NOT enter a webhook secret — the backend
      // generates it and returns it once here.
      const res = await configureMoyasar(activeTenant, {
        secret_key: form.secret_key.trim(),
        publishable_key: form.publishable_key.trim(),
      });
      setWebhook({ url: res.webhook_url, secret: res.webhook_secret });
      onSaved?.();
    } catch (err) {
      setError(err.message || "Configuration failed. Check your credentials.");
    } finally {
      setSaving(false);
    }
  };

  const handleRotate = async () => {
    if (!confirm("Generate a new webhook secret? You must update it in your Moyasar dashboard afterwards."))
      return;
    setRotating(true);
    try {
      const res = await rotateMoyasarWebhook(activeTenant);
      setWebhook({ url: res.webhook_url, secret: res.webhook_secret });
      setShowWebhookSecret(true);
      onToast?.("Webhook secret regenerated — update it in Moyasar.");
    } catch (err) {
      onToast?.(err.message || "Could not regenerate secret", "error");
    } finally {
      setRotating(false);
    }
  };

  // ── STEP 2: webhook configuration (URL + generated secret) ──
  if (webhook) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" /> Moyasar Webhook Configuration
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Copy these into your Moyasar dashboard → Settings → Webhooks
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              The webhook secret is shown <strong>once</strong>. Copy it now — later it is masked.
              You can regenerate it if lost.
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Webhook URL</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <code className="text-xs text-gray-700 truncate flex-1">
                  {webhook.url || "Set BACKEND_URL on the server to generate this."}
                </code>
                <button onClick={() => copy(webhook.url, "Webhook URL")} className="text-gray-400 hover:text-gray-700">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Webhook Secret</label>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <code className="text-xs text-gray-700 truncate flex-1 font-mono">
                  {showWebhookSecret ? webhook.secret : "•".repeat(28)}
                </code>
                <button onClick={() => setShowWebhookSecret((v) => !v)} className="text-gray-400 hover:text-gray-700">
                  {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => copy(webhook.secret, "Webhook secret")} className="text-gray-400 hover:text-gray-700">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={handleRotate}
              disabled={rotating}
              className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-[#8B1E3F] disabled:opacity-50"
            >
              {rotating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Regenerate webhook secret
            </button>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md font-medium text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 1: enter API keys ──
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Configure Moyasar</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter your Moyasar API keys — we generate the webhook secret for you
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {env && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
                env === "live"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-amber-50 border border-amber-200 text-amber-700"
              }`}
            >
              <Globe className="w-4 h-4" />
              {env === "live"
                ? "LIVE keys — real charges will be made."
                : "TEST keys — sandbox mode, no real charges."}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Secret Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showSecretInput ? "text" : "password"}
                value={form.secret_key}
                onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
                placeholder="sk_test_… or sk_live_…"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecretInput(!showSecretInput)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecretInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Stored securely on the server. Never shown again after saving.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Publishable Key <span className="text-gray-400 font-normal">(recommended)</span>
            </label>
            <input
              type="text"
              value={form.publishable_key}
              onChange={(e) => setForm({ ...form, publishable_key: e.target.value })}
              placeholder="pk_test_… or pk_live_…"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm font-mono"
            />
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
              Where to find these
            </p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Log in to your Moyasar Dashboard</li>
              <li>Open Settings → API Keys</li>
              <li>Copy the Publishable and Secret keys</li>
              <li>After you save, we&apos;ll give you the Webhook URL + Secret to paste into Moyasar</li>
            </ol>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !form.secret_key.trim()}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Test Connection
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.secret_key.trim()}
              className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Validating..." : "Save & Verify"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HyperPay Config Modal ──────────────────────────────────────

function HyperPayConfigModal({ activeTenant, existing, onClose, onSuccess }) {
  const [form, setForm] = useState({
    entity_id: existing?.entity_id || "",
    access_token: "",
    mada_entity_id: "",
    test_mode: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showToken, setShowToken] = useState(false);

  const handleSave = async () => {
    if (!form.entity_id.trim() || !form.access_token.trim()) {
      setError("Entity ID and Access Token are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await configureHyperPay(activeTenant, form);
      onSuccess();
    } catch (err) {
      setError(err.message || "Configuration failed. Check your credentials.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Configure HyperPay</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Enter your HyperPay credentials from the HyperPay Dashboard
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Entity ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.entity_id}
              onChange={(e) => setForm({ ...form, entity_id: e.target.value })}
              placeholder="8ac7a4ca7..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Access Token <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={form.access_token}
                onChange={(e) => setForm({ ...form, access_token: e.target.value })}
                placeholder="OGFjN2E0..."
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              MADA Entity ID <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.mada_entity_id}
              onChange={(e) => setForm({ ...form, mada_entity_id: e.target.value })}
              placeholder="8ac7a4ca7... (separate entity for MADA cards)"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Saudi merchants: MADA requires a separate entity ID from HyperPay.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-700">Test Mode</p>
              <p className="text-xs text-gray-500">
                Use sandbox for testing before going live
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, test_mode: !form.test_mode })}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                form.test_mode ? "bg-amber-400" : "bg-[#8B1E3F]"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  form.test_mode ? "left-1" : "left-6"
                }`}
              />
            </button>
          </div>

          {/* Where to find credentials */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
              Where to find these
            </p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Log in to your HyperPay Dashboard</li>
              <li>Go to Administration → Account Data</li>
              <li>Copy Entity ID and Access Token</li>
              <li>For MADA: create a separate channel for MADA cards</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.entity_id.trim() || !form.access_token.trim()}
            className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md font-medium text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? "Validating..." : "Save & Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}