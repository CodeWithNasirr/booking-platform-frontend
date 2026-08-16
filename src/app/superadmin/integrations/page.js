// app/superadmin/integrations/page.js
"use client";

/**
 * Superadmin → Integrations → Payments
 * ====================================
 * A REAL, fully API-driven control panel for the platform's payment gateways
 * (Moyasar / Stripe / HyperPay). No hardcoded state, no mock data:
 *   - loads real state from GET  /platform/payment-integrations/
 *   - saves via                  PATCH /platform/payment-integrations/
 *   - validates via              POST  …/test/
 *   - health via                 POST  …/health/
 *   - webhook readiness via      POST  …/webhook/test/
 * Secrets are shown masked; the enabled toggle drives the backend feature flag.
 */

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard, Loader2, Check, X, Eye, EyeOff, Copy, Zap, Activity,
  AlertCircle, CheckCircle2, Globe, ShieldCheck, Star, RefreshCw,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import {
  fetchPaymentIntegrations,
  savePaymentIntegration,
  testPaymentIntegration,
  checkPaymentIntegrationsHealth,
  testPaymentWebhook,
} from "@/lib/platformApi";

const MAROON = "#8B1E3F";

export default function IntegrationsPage() {
  const { hasPermission } = useSuperAdmin();
  const canManage = hasPermission ? hasPermission("settings.manage") : true;

  const [state, setState] = useState(null); // {payments_enabled, default_provider, gateways:[]}
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setState(await fetchPaymentIntegrations());
    } catch (e) {
      setLoadError(e.message || "Failed to load payment integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const runHealth = async () => {
    setHealthLoading(true);
    try {
      const r = await checkPaymentIntegrationsHealth();
      setHealth(r.gateways || {});
    } catch (e) {
      showToast(e.message || "Health check failed", "error");
    } finally {
      setHealthLoading(false);
    }
  };

  const breadcrumbs = [{ label: "Integrations" }, { label: "Payments" }];

  return (
    <SuperAdminLayout
      title="Payment Integrations"
      description="Configure the platform's payment gateways (real, persisted configuration)"
      breadcrumbs={breadcrumbs}
    >
      {/* Platform-wide notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900">
          These are the <strong>platform&apos;s own</strong> gateway credentials (used for
          platform-account charges and as a fallback). Each tenant connects their
          <strong> own</strong> Moyasar account separately in their dashboard — those are not shown here.
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {state && (
            <>
              <span>Default gateway:</span>
              <span className="font-semibold text-gray-900 capitalize">{state.default_provider}</span>
              <span className="mx-2">·</span>
              <span>Payments {state.payments_enabled ? "enabled" : "disabled"} platform-wide</span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={runHealth}
            disabled={healthLoading || loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            {healthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Run health check
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: MAROON }} />
        </div>
      )}

      {/* Load error */}
      {!loading && loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <X className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 font-medium">{loadError}</p>
          <button onClick={load} className="mt-3 text-sm text-red-600 underline">Try again</button>
        </div>
      )}

      {/* Gateways */}
      {!loading && !loadError && state && (
        <div className="space-y-4">
          {state.gateways.map((gw) => (
            <GatewayCard
              key={gw.provider}
              gw={gw}
              isDefault={state.default_provider === gw.provider}
              canManage={canManage}
              health={health?.[gw.provider]}
              onToast={showToast}
              onChanged={load}
            />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-5 py-3 rounded-xl shadow-lg text-white font-medium ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}

// ─────────────────────────────────────────────────────────────────
// Gateway card — self-contained real form + actions
// ─────────────────────────────────────────────────────────────────

function GatewayCard({ gw, isDefault, canManage, health, onToast, onChanged }) {
  const [form, setForm] = useState({
    secret_key: "",
    publishable_key: "",
    webhook_secret: "",
    base_url: gw.base_url || "",
  });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);

  const isMoyasar = gw.provider === "moyasar";
  const masked = gw.credentials_masked || {};

  const env =
    form.secret_key.startsWith("sk_live_") ? "live" :
    form.secret_key.startsWith("sk_test_") ? "test" :
    gw.environment;

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const buildCredentials = () => {
    const c = {};
    if (form.secret_key.trim()) c.secret_key = form.secret_key.trim();
    if (form.publishable_key.trim()) c.publishable_key = form.publishable_key.trim();
    if (form.webhook_secret.trim()) c.webhook_secret = form.webhook_secret.trim();
    return c;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { provider: gw.provider };
      const creds = buildCredentials();
      if (Object.keys(creds).length) payload.credentials = creds;
      if (isMoyasar && form.base_url.trim()) payload.base_url = form.base_url.trim();
      await savePaymentIntegration(payload);
      onToast("Configuration saved");
      update({ secret_key: "", publishable_key: "", webhook_secret: "" });
      onChanged();
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    try {
      const creds = buildCredentials();
      // Validate typed-but-unsaved credentials if present, else test stored.
      const res = await testPaymentIntegration(
        gw.provider,
        creds.secret_key ? creds : null
      );
      if (res.success) onToast(res.message || "Connection succeeded");
      else setError(res.message || "Connection failed");
    } catch (e) {
      setError(e.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleToggle = async () => {
    try {
      await savePaymentIntegration({ provider: gw.provider, enabled: !gw.enabled });
      onToast(`${gw.name} ${!gw.enabled ? "enabled" : "disabled"}`);
      onChanged();
    } catch (e) {
      onToast(e.message || "Failed to toggle", "error");
    }
  };

  const handleSetDefault = async () => {
    try {
      await savePaymentIntegration({ provider: gw.provider, set_default: true });
      onToast(`${gw.name} set as default gateway`);
      onChanged();
    } catch (e) {
      onToast(e.message || "Failed", "error");
    }
  };

  const copyWebhook = () => {
    if (gw.webhook_url) {
      navigator.clipboard?.writeText(gw.webhook_url);
      onToast("Webhook URL copied");
    }
  };

  return (
    <div className={`rounded-2xl border p-5 ${gw.enabled ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50/60"}`}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow"
             style={{ background: `linear-gradient(135deg, ${MAROON}, #6B1630)` }}>
          <CreditCard className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{gw.name}</h3>
            {isDefault && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                <Star className="w-3 h-3" /> Default
              </span>
            )}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              gw.environment === "live" ? "bg-green-100 text-green-700"
              : gw.environment === "test" ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-500"}`}>
              {(gw.environment || "unknown").toUpperCase()}
            </span>
            {gw.configured
              ? <span className="inline-flex items-center gap-1 text-[11px] text-green-700"><CheckCircle2 className="w-3.5 h-3.5" /> Configured</span>
              : <span className="inline-flex items-center gap-1 text-[11px] text-gray-400"><X className="w-3.5 h-3.5" /> Not configured</span>}
          </div>
          {/* Live health */}
          {health && (
            <p className={`text-xs mt-1 ${health.healthy ? "text-green-600" : "text-red-600"}`}>
              {health.healthy ? "● Healthy" : "● Unhealthy"} — {health.detail}
            </p>
          )}
          {/* Last test */}
          {gw.last_test_at && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Last test: {gw.last_test_success ? "✓" : "✗"} {gw.last_test_message}
            </p>
          )}
        </div>

        {/* Enabled toggle */}
        <button
          onClick={handleToggle}
          disabled={!canManage}
          title={gw.enabled ? "Disable" : "Enable"}
          className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-40 ${gw.enabled ? "" : "bg-gray-300"}`}
          style={gw.enabled ? { backgroundColor: MAROON } : {}}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${gw.enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>

      {/* Masked current credentials */}
      {gw.configured && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <MaskedField label="Secret Key" value={masked.secret_key} />
          <MaskedField label="Publishable Key" value={masked.publishable_key} />
          <MaskedField label="Webhook Secret" value={masked.webhook_secret} />
        </div>
      )}

      {/* Edit form */}
      {canManage && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
          )}
          {env && form.secret_key && (
            <div className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
              env === "live" ? "bg-green-50 border border-green-200 text-green-700"
                             : "bg-amber-50 border border-amber-200 text-amber-700"}`}>
              <Globe className="w-3.5 h-3.5" />
              {env === "live" ? "LIVE keys — real charges." : "TEST keys — sandbox."}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={`Secret Key${isMoyasar ? " (sk_…)" : ""}`}>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={form.secret_key}
                  onChange={(e) => update({ secret_key: e.target.value })}
                  placeholder={masked.secret_key || "sk_test_…"}
                  className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 text-sm font-mono focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
                />
                <button type="button" onClick={() => setShow(!show)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label={`Publishable Key${isMoyasar ? " (pk_…)" : ""}`}>
              <input
                type="text"
                value={form.publishable_key}
                onChange={(e) => update({ publishable_key: e.target.value })}
                placeholder={masked.publishable_key || "pk_test_…"}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
              />
            </Field>
            <Field label="Webhook Secret">
              <input
                type="text"
                value={form.webhook_secret}
                onChange={(e) => update({ webhook_secret: e.target.value })}
                placeholder={masked.webhook_secret || "secret token"}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
              />
            </Field>
            {isMoyasar && (
              <Field label="API Base URL">
                <input
                  type="text"
                  value={form.base_url}
                  onChange={(e) => update({ base_url: e.target.value })}
                  placeholder="https://api.moyasar.com/v1"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
                />
              </Field>
            )}
          </div>

          {/* Webhook URL */}
          {gw.webhook_url ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <ShieldCheck className={`w-4 h-4 ${gw.webhook_configured ? "text-green-600" : "text-gray-400"}`} />
              <code className="text-xs text-gray-600 truncate flex-1">{gw.webhook_url}</code>
              <button onClick={copyWebhook} className="text-gray-400 hover:text-gray-700" title="Copy">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-gray-400">Set BACKEND_URL to generate a webhook URL.</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-sm disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${MAROON}, #6B1630)` }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Test connection
            </button>
            {!isDefault && (
              <button
                onClick={handleSetDefault}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                <Star className="w-4 h-4" />
                Set as default
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function MaskedField({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="font-mono text-gray-700 truncate">{value || "—"}</p>
    </div>
  );
}
