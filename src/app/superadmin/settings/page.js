// app/superadmin/settings/page.jsx

// src/app/superadmin/settings/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import {
  Settings, Shield, Users, Bell, CreditCard, Globe, Save,
  Loader2, Check, AlertCircle, Eye, EyeOff, Zap, RefreshCcw,
  CheckCircle, XCircle, MessageSquare, Mail, X, ToggleLeft,
  ToggleRight, Info,
} from "lucide-react";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
  testIntegrationConnection,
} from "@/lib/platformApi";

const MAROON = "#800020";

const TABS = [
  { key: "general", label: "General", icon: Globe },
  { key: "integrations", label: "Integrations", icon: Zap },
  { key: "security", label: "Security", icon: Shield },
  { key: "tenant_rules", label: "Tenant Rules", icon: Users },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [toast, setToast] = useState(null);
  const [showKeys, setShowKeys] = useState({});
  const [testingIntegration, setTestingIntegration] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlatformSettings();
      setSettings(data);
    } catch (err) {
      showToast(err.message || "Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async (section, data) => {
    setSaving(true);
    try {
      const result = await updatePlatformSettings({ [section]: data });
      setSettings(result);
      showToast("Settings saved successfully.");
    } catch (err) {
      showToast(err.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestIntegration = async (name) => {
    setTestingIntegration(name);
    try {
      const result = await testIntegrationConnection(name);
      showToast(result.detail || (result.success ? "Connection verified!" : "Connection failed."), result.success ? "success" : "error");
    } catch (err) {
      showToast(err.message || "Test failed", "error");
    } finally {
      setTestingIntegration(null);
    }
  };

  const toggleKeyVisibility = (key) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <SuperAdminLayout title="Settings" breadcrumbs={[{ label: "Settings" }]}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Platform Settings"
      description="Configure platform-wide settings and integrations"
      breadcrumbs={[{ label: "Settings" }]}
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
          toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
        }`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 overflow-x-auto">
          <div className="flex items-center gap-1 -mb-px min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-[#800020] text-[#800020]"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "general" && (
            <GeneralTab
              data={settings?.general || {}}
              onSave={(data) => handleSave("general", data)}
              saving={saving}
            />
          )}
          {activeTab === "integrations" && (
            <IntegrationsTab
              data={settings?.integrations || {}}
              onSave={(data) => handleSave("integrations", data)}
              onTest={handleTestIntegration}
              testingIntegration={testingIntegration}
              saving={saving}
              showKeys={showKeys}
              toggleKeyVisibility={toggleKeyVisibility}
            />
          )}
          {activeTab === "security" && (
            <SecurityTab
              data={settings?.security || {}}
              onSave={(data) => handleSave("security", data)}
              saving={saving}
            />
          )}
          {activeTab === "tenant_rules" && (
            <TenantRulesTab
              data={settings?.tenant_rules || {}}
              onSave={(data) => handleSave("tenant_rules", data)}
              saving={saving}
            />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              data={settings?.notifications || {}}
              onSave={(data) => handleSave("notifications", data)}
              saving={saving}
            />
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// GENERAL TAB
// ═══════════════════════════════════════════════════════════════

function GeneralTab({ data, onSave, saving }) {
  const [form, setForm] = useState(data);

  useEffect(() => { setForm(data); }, [data]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">General Settings</h3>
        <p className="text-sm text-gray-500">Basic platform configuration</p>
      </div>

      <FieldInput label="Platform Name" value={form.platform_name} onChange={v => update("platform_name", v)} />
      <FieldInput label="Platform URL" value={form.platform_url} onChange={v => update("platform_url", v)} type="url" />
      <FieldInput label="Support Email" value={form.support_email} onChange={v => update("support_email", v)} type="email" />
      <FieldInput label="Support Phone" value={form.support_phone} onChange={v => update("support_phone", v)} />

      <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div>
          <p className="text-sm font-semibold text-amber-900">Maintenance Mode</p>
          <p className="text-xs text-amber-700 mt-0.5">When enabled, tenants see a maintenance message</p>
        </div>
        <Toggle checked={form.maintenance_mode} onChange={v => update("maintenance_mode", v)} />
      </div>

      {form.maintenance_mode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Maintenance Message</label>
          <textarea
            value={form.maintenance_message || ""}
            onChange={e => update("maintenance_message", e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 resize-none"
            placeholder="We're currently performing scheduled maintenance..."
          />
        </div>
      )}

      <SaveButton onClick={() => onSave(form)} saving={saving} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INTEGRATIONS TAB
// ═══════════════════════════════════════════════════════════════

const INTEGRATION_CONFIGS = [
  {
    key: "stripe",
    name: "Stripe",
    icon: CreditCard,
    color: "from-purple-500 to-indigo-500",
    description: "Platform billing payment processing",
    fields: [
      { key: "publishable_key", label: "Publishable Key", sensitive: false },
      { key: "secret_key", label: "Secret Key", sensitive: true },
      { key: "webhook_secret", label: "Webhook Secret", sensitive: true },
    ],
  },
  {
    key: "hyperpay",
    name: "HyperPay",
    icon: CreditCard,
    color: "from-green-500 to-emerald-500",
    description: "MADA & card payments for Saudi Arabia",
    fields: [
      { key: "entity_id", label: "Entity ID", sensitive: false },
      { key: "access_token", label: "Access Token", sensitive: true },
      { key: "mada_entity_id", label: "MADA Entity ID", sensitive: false },
      { key: "base_url", label: "API Base URL", sensitive: false },
    ],
    extras: [{ key: "test_mode", label: "Test Mode", type: "toggle" }],
  },
  {
    key: "whatsapp",
    name: "WhatsApp API",
    icon: MessageSquare,
    color: "from-green-500 to-green-600",
    description: "WhatsApp Business notifications",
    fields: [
      { key: "api_url", label: "API URL", sensitive: false },
      { key: "api_token", label: "API Token", sensitive: true },
      { key: "phone_number_id", label: "Phone Number ID", sensitive: false },
    ],
  },
  {
    key: "sendgrid",
    name: "SendGrid",
    icon: Mail,
    color: "from-blue-500 to-blue-600",
    description: "Transactional email service",
    fields: [
      { key: "api_key", label: "API Key", sensitive: true },
      { key: "from_email", label: "From Email", sensitive: false },
      { key: "from_name", label: "From Name", sensitive: false },
    ],
  },
];

function IntegrationsTab({ data, onSave, onTest, testingIntegration, saving, showKeys, toggleKeyVisibility }) {
  const [form, setForm] = useState(data);

  useEffect(() => { setForm(data); }, [data]);

  const updateField = (integration, field, value) => {
    setForm(prev => ({
      ...prev,
      [integration]: { ...prev[integration], [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Platform Integrations</h3>
        <p className="text-sm text-gray-500">Configure API keys and third-party services</p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          These are platform-level credentials shared across all tenants. Changes affect the entire platform.
        </p>
      </div>

      <div className="space-y-6">
        {INTEGRATION_CONFIGS.map(config => {
          const Icon = config.icon;
          const integrationData = form[config.key] || {};
          const isEnabled = integrationData.enabled !== false;

          return (
            <div key={config.key} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{config.name}</h4>
                    <p className="text-sm text-gray-500">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    isEnabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {isEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <Toggle
                    checked={isEnabled}
                    onChange={v => updateField(config.key, "enabled", v)}
                  />
                </div>
              </div>

              {isEnabled && (
                <div className="space-y-4">
                  {config.fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                      <div className="relative">
                        <input
                          type={field.sensitive && !showKeys[`${config.key}-${field.key}`] ? "password" : "text"}
                          value={integrationData[field.key] || ""}
                          onChange={e => updateField(config.key, field.key, e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="w-full px-4 py-2.5 pr-12 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 font-mono"
                        />
                        {field.sensitive && (
                          <button
                            type="button"
                            onClick={() => toggleKeyVisibility(`${config.key}-${field.key}`)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showKeys[`${config.key}-${field.key}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {config.extras?.map(extra => (
                    <div key={extra.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">{extra.label}</span>
                      <Toggle
                        checked={integrationData[extra.key] !== false}
                        onChange={v => updateField(config.key, extra.key, v)}
                      />
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onTest(config.key)}
                      disabled={testingIntegration === config.key}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {testingIntegration === config.key
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCcw className="w-4 h-4" />
                      }
                      Test Connection
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <SaveButton onClick={() => onSave(form)} saving={saving} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECURITY TAB
// ═══════════════════════════════════════════════════════════════

function SecurityTab({ data, onSave, saving }) {
  const [form, setForm] = useState(data);
  useEffect(() => { setForm(data); }, [data]);
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Security Settings</h3>
        <p className="text-sm text-gray-500">Configure authentication and access security</p>
      </div>

      <FieldInput label="Max Login Attempts" value={form.max_login_attempts} onChange={v => update("max_login_attempts", parseInt(v) || 0)} type="number" />
      <FieldInput label="Lockout Duration (minutes)" value={form.lockout_duration_minutes} onChange={v => update("lockout_duration_minutes", parseInt(v) || 0)} type="number" />
      <FieldInput label="Session Timeout (minutes)" value={form.session_timeout_minutes} onChange={v => update("session_timeout_minutes", parseInt(v) || 0)} type="number" />
      <FieldInput label="Minimum Password Length" value={form.password_min_length} onChange={v => update("password_min_length", parseInt(v) || 0)} type="number" />

      <ToggleRow label="Require 2FA for Admins" description="Force two-factor authentication for platform admins" checked={form.require_2fa_for_admins} onChange={v => update("require_2fa_for_admins", v)} />

      <SaveButton onClick={() => onSave(form)} saving={saving} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TENANT RULES TAB
// ═══════════════════════════════════════════════════════════════

function TenantRulesTab({ data, onSave, saving }) {
  const [form, setForm] = useState(data);
  useEffect(() => { setForm(data); }, [data]);
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Tenant Management Rules</h3>
        <p className="text-sm text-gray-500">Default rules applied to new and existing tenants</p>
      </div>

      <ToggleRow label="Auto-Approve New Tenants" description="Automatically activate tenants after signup" checked={form.auto_approve_tenants} onChange={v => update("auto_approve_tenants", v)} />
      <ToggleRow label="Require Business Document" description="Tenants must upload a business document for verification" checked={form.require_business_document} onChange={v => update("require_business_document", v)} />
      <ToggleRow label="Allow Custom Domains" description="Tenants can connect custom domains to their sites" checked={form.allow_custom_domains} onChange={v => update("allow_custom_domains", v)} />

      <FieldInput label="Default Trial Period (days)" value={form.default_trial_days} onChange={v => update("default_trial_days", parseInt(v) || 0)} type="number" />
      <FieldInput label="Max Providers on Free Plan" value={form.max_providers_free} onChange={v => update("max_providers_free", parseInt(v) || 0)} type="number" />
      <FieldInput label="Default Platform Fee (%)" value={form.default_platform_fee_percent} onChange={v => update("default_platform_fee_percent", parseFloat(v) || 0)} type="number" step="0.1" />

      <SaveButton onClick={() => onSave(form)} saving={saving} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS TAB
// ═══════════════════════════════════════════════════════════════

function NotificationsTab({ data, onSave, saving }) {
  const [form, setForm] = useState(data);
  useEffect(() => { setForm(data); }, [data]);
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Notification Settings</h3>
        <p className="text-sm text-gray-500">Configure how platform notifications are sent</p>
      </div>

      <ToggleRow label="Email Notifications" description="Send email alerts for platform events" checked={form.email_enabled} onChange={v => update("email_enabled", v)} />
      <ToggleRow label="WhatsApp Notifications" description="Send WhatsApp alerts (requires WhatsApp integration)" checked={form.whatsapp_enabled} onChange={v => update("whatsapp_enabled", v)} />

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Event Triggers</p>
      </div>

      <ToggleRow label="New Tenant Signup" description="Notify when a new tenant registers" checked={form.notify_on_new_tenant} onChange={v => update("notify_on_new_tenant", v)} />
      <ToggleRow label="Payment Failure" description="Alert when a tenant's payment fails" checked={form.notify_on_payment_failure} onChange={v => update("notify_on_payment_failure", v)} />
      <ToggleRow label="Tenant Suspension" description="Notify when a tenant is suspended" checked={form.notify_on_suspension} onChange={v => update("notify_on_suspension", v)} />

      <SaveButton onClick={() => onSave(form)} saving={saving} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

function FieldInput({ label, value, onChange, type = "text", step }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        step={step}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30"
      />
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-[#800020]" : "bg-gray-300"
      }`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        checked ? "left-[22px]" : "left-0.5"
      }`} />
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function SaveButton({ onClick, saving }) {
  return (
    <div className="flex justify-end pt-4 border-t border-gray-100">
      <button
        onClick={onClick}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: MAROON }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </div>
  );
}








// import ComingSoon from "@/components/ui/ComingSoon";

// export default function SettingsPage() {
//   return <ComingSoon title="Settings Page" />;
// }