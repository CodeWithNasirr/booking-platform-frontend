// app/superadmin/email/page.js
"use client";

/**
 * Superadmin → Integrations → Email
 * =================================
 * API-driven control panel for the platform's transactional email
 * providers (Brevo — production — plus SendGrid / SMTP). Backed by the
 * generic /platform/integrations/ endpoints:
 *   - list      GET  /platform/integrations/?type=email
 *   - configure POST …/<code>/configure/
 *   - toggle    POST …/<code>/toggle/
 *   - test      POST …/<code>/test/
 *   - test mail POST …/<code>/test-email/
 *
 * The API key is stored encrypted server-side and returned only masked —
 * the raw value never reaches this page.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Mail, Loader2, Check, X, Eye, EyeOff, Zap, Send,
  AlertCircle, CheckCircle2, Star,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import {
  fetchEmailIntegrations,
  seedIntegrations,
  configureIntegration,
  toggleIntegration,
  testIntegrationConnection,
  sendIntegrationTestEmail,
} from "@/lib/platformApi";

const MAROON = "#8B1E3F";

export default function EmailIntegrationsPage() {
  const { hasPermission } = useSuperAdmin();
  const canManage = hasPermission ? hasPermission("settings.manage") : true;

  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      let list = await fetchEmailIntegrations();
      // First run: seed default rows then reload.
      if (!Array.isArray(list) || list.length === 0) {
        await seedIntegrations();
        list = await fetchEmailIntegrations();
      }
      // Brevo (production) first, then the rest.
      const order = { brevo: 0, sendgrid: 1, smtp: 2 };
      list.sort((a, b) => (order[a.provider_code] ?? 9) - (order[b.provider_code] ?? 9));
      setProviders(list);
    } catch (e) {
      setLoadError(e.message || "Failed to load email integrations");
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

  const activeCount = (providers || []).filter((p) => p.is_enabled).length;
  const breadcrumbs = [{ label: "Integrations" }, { label: "Email" }];

  return (
    <SuperAdminLayout
      title="Email Integrations"
      description="Configure the platform's transactional email provider (real, persisted configuration)"
      breadcrumbs={breadcrumbs}
    >
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <strong>Brevo</strong> is the production email transport. When it&apos;s enabled and has an
          API key, all platform email (OTP, password reset, provider invites, bookings, orders,
          invoices, notifications) is sent through it. If no provider is enabled, email falls back to
          the server&apos;s SMTP settings. Only one provider needs to be active — Brevo is preferred.
        </div>
      </div>

      {providers && (
        <div className="text-sm text-gray-500 mb-4">
          {activeCount > 0
            ? <>Active provider: <span className="font-semibold text-gray-900 capitalize">
                {providers.find((p) => p.is_enabled)?.provider_name}</span></>
            : "No email provider is active — using server SMTP fallback."}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: MAROON }} />
        </div>
      )}

      {!loading && loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <X className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 font-medium">{loadError}</p>
          <button onClick={load} className="mt-3 text-sm text-red-600 underline">Try again</button>
        </div>
      )}

      {!loading && !loadError && providers && (
        <div className="space-y-4">
          {providers.map((p) => (
            <EmailProviderCard
              key={p.provider_code}
              provider={p}
              canManage={canManage}
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

function EmailProviderCard({ provider, canManage, onToast, onChanged }) {
  const isBrevo = provider.provider_code === "brevo";
  const isSmtp = provider.provider_code === "smtp";
  const masked = provider.credentials_masked || {};
  const cfg = provider.config || {};

  const [form, setForm] = useState({
    api_key: "",
    // SMTP fields
    host: "", port: "", username: "", password: "",
  });
  const [config, setConfig] = useState({
    from_email: cfg.from_email || "",
    from_name: cfg.from_name || "",
  });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [error, setError] = useState(null);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const buildCredentials = () => {
    const c = {};
    if (isSmtp) {
      if (form.host.trim()) c.host = form.host.trim();
      if (form.port.trim()) c.port = form.port.trim();
      if (form.username.trim()) c.username = form.username.trim();
      if (form.password.trim()) c.password = form.password.trim();
    } else if (form.api_key.trim()) {
      c.api_key = form.api_key.trim();
    }
    return c;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const credentials = buildCredentials();
      const configPayload = {};
      if (config.from_email.trim()) configPayload.from_email = config.from_email.trim();
      if (config.from_name.trim()) configPayload.from_name = config.from_name.trim();
      await configureIntegration(provider.provider_code, {
        credentials: Object.keys(credentials).length ? credentials : undefined,
        config: Object.keys(configPayload).length ? configPayload : undefined,
      });
      onToast("Configuration saved");
      update({ api_key: "", host: "", port: "", username: "", password: "" });
      onChanged();
    } catch (e) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    try {
      await toggleIntegration(provider.provider_code, !provider.is_enabled);
      onToast(`${provider.provider_name} ${!provider.is_enabled ? "enabled" : "disabled"}`);
      onChanged();
    } catch (e) {
      onToast(e.message || "Failed to toggle", "error");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await testIntegrationConnection(provider.provider_code);
      if (res.success) onToast(res.message || "Connection succeeded");
      else setError(res.message || "Connection failed");
    } catch (e) {
      setError(e.message || "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSendTest = async () => {
    if (!testTo.trim()) { setError("Enter a recipient email for the test."); return; }
    setSendingTest(true);
    setError(null);
    try {
      const res = await sendIntegrationTestEmail(provider.provider_code, testTo.trim());
      if (res.success) onToast(res.message || "Test email sent");
      else setError(res.message || "Test email failed");
    } catch (e) {
      setError(e.message || "Test email failed");
    } finally {
      setSendingTest(false);
    }
  };

  const configured = !!(masked.api_key || masked.host || masked.password);

  return (
    <div className={`rounded-2xl border p-5 ${provider.is_enabled ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50/60"}`}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow"
             style={{ background: `linear-gradient(135deg, ${MAROON}, #6B1630)` }}>
          <Mail className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900">{provider.provider_name}</h3>
            {isBrevo && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                <Star className="w-3 h-3" /> Production
              </span>
            )}
            {configured
              ? <span className="inline-flex items-center gap-1 text-[11px] text-green-700"><CheckCircle2 className="w-3.5 h-3.5" /> Configured</span>
              : <span className="inline-flex items-center gap-1 text-[11px] text-gray-400"><X className="w-3.5 h-3.5" /> Not configured</span>}
          </div>
          {provider.description && <p className="text-xs text-gray-500 mt-1">{provider.description}</p>}
          {provider.last_test_at && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Last test: {provider.last_test_success ? "✓" : "✗"} {provider.last_test_message}
            </p>
          )}
        </div>

        <button
          onClick={handleToggle}
          disabled={!canManage}
          title={provider.is_enabled ? "Disable" : "Enable"}
          className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-40 ${provider.is_enabled ? "" : "bg-gray-300"}`}
          style={provider.is_enabled ? { backgroundColor: MAROON } : {}}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${provider.is_enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>

      {canManage && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isSmtp ? (
              <Field label="API Key">
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={form.api_key}
                    onChange={(e) => update({ api_key: e.target.value })}
                    placeholder={masked.api_key || (isBrevo ? "xkeysib-…" : "API key")}
                    className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 text-sm font-mono focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
                  />
                  <button type="button" onClick={() => setShow(!show)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            ) : (
              <>
                <Field label="Host"><SmtpInput value={form.host} placeholder={masked.host || "smtp.example.com"} onChange={(v) => update({ host: v })} /></Field>
                <Field label="Port"><SmtpInput value={form.port} placeholder="587" onChange={(v) => update({ port: v })} /></Field>
                <Field label="Username"><SmtpInput value={form.username} placeholder={masked.username || "user"} onChange={(v) => update({ username: v })} /></Field>
                <Field label="Password">
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => update({ password: e.target.value })}
                      placeholder={masked.password || "••••••"}
                      className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-300 text-sm font-mono focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
                    />
                    <button type="button" onClick={() => setShow(!show)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
              </>
            )}
            <Field label="Sender email">
              <input
                type="email"
                value={config.from_email}
                onChange={(e) => setConfig((c) => ({ ...c, from_email: e.target.value }))}
                placeholder="noreply@yourdomain.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
              />
            </Field>
            <Field label="Sender name">
              <input
                type="text"
                value={config.from_name}
                onChange={(e) => setConfig((c) => ({ ...c, from_name: e.target.value }))}
                placeholder="Your Brand"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
              />
            </Field>
          </div>

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
          </div>

          {/* Send test email */}
          <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-gray-100 mt-2">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Send a test email to</label>
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
              />
            </div>
            <button
              onClick={handleSendTest}
              disabled={sendingTest}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
            >
              {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SmtpInput({ value, placeholder, onChange }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
    />
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
