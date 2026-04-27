// // app/superadmin/integrations/page.js
// src/app/superadmin/integrations/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard, Mail, MessageSquare, Shield, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, ExternalLink, Loader2, RefreshCcw,
  Zap, X, Check, Settings,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
  testIntegrationConnection,
} from "@/lib/platformApi";

const MAROON = "#800020";

const INTEGRATIONS = [
  {
    key: "stripe",
    name: "Stripe",
    icon: CreditCard,
    color: "from-purple-500 to-indigo-500",
    description: "Platform billing — accept payments from tenants",
    category: "payment",
    fields: [
      { key: "publishable_key", label: "Publishable Key", placeholder: "pk_live_51...", sensitive: false },
      { key: "secret_key", label: "Secret Key", placeholder: "sk_live_51...", sensitive: true },
      { key: "webhook_secret", label: "Webhook Secret", placeholder: "whsec_...", sensitive: true },
    ],
  },
  {
    key: "hyperpay",
    name: "HyperPay",
    icon: CreditCard,
    color: "from-green-500 to-emerald-500",
    description: "MADA, Visa, Mastercard payments for Saudi Arabia",
    category: "payment",
    fields: [
      { key: "entity_id", label: "Entity ID", placeholder: "8ac7a4ca...", sensitive: false },
      { key: "access_token", label: "Access Token", placeholder: "OGFj...", sensitive: true },
      { key: "mada_entity_id", label: "MADA Entity ID (optional)", placeholder: "8ac7a4ca...", sensitive: false },
      { key: "base_url", label: "API Base URL", placeholder: "https://eu-test.oppwa.com", sensitive: false },
    ],
    extras: [{ key: "test_mode", label: "Test Mode (Sandbox)", type: "toggle" }],
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business API",
    icon: MessageSquare,
    color: "from-green-500 to-green-600",
    description: "Send notifications via WhatsApp Business",
    category: "communication",
    fields: [
      { key: "api_url", label: "API Server URL", placeholder: "https://api.whatsapp.com", sensitive: false },
      { key: "api_token", label: "API Token", placeholder: "Bearer token...", sensitive: true },
      { key: "phone_number_id", label: "Phone Number ID", placeholder: "1234567890", sensitive: false },
    ],
  },
  {
    key: "sendgrid",
    name: "SendGrid",
    icon: Mail,
    color: "from-blue-500 to-blue-600",
    description: "Transactional email delivery service",
    category: "email",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "SG.abc...", sensitive: true },
      { key: "from_email", label: "From Email", placeholder: "noreply@platform.com", sensitive: false },
      { key: "from_name", label: "From Name", placeholder: "BookingPro", sensitive: false },
    ],
  },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "payment", label: "Payment Gateways" },
  { key: "communication", label: "Communication" },
  { key: "email", label: "Email Services" },
];

export default function IntegrationsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [showKeys, setShowKeys] = useState({});
  const [testing, setTesting] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [toast, setToast] = useState(null);

  // Local form state per integration
  const [formData, setFormData] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlatformSettings();
      setSettings(data);
      setFormData(data.integrations || {});
    } catch (err) {
      showToast(err.message || "Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const updateField = (integration, field, value) => {
    setFormData(prev => ({
      ...prev,
      [integration]: { ...prev[integration], [field]: value },
    }));
  };

  const handleSave = async (integrationKey) => {
    setSaving(integrationKey);
    try {
      const result = await updatePlatformSettings({
        integrations: { [integrationKey]: formData[integrationKey] },
      });
      setSettings(result);
      setFormData(result.integrations || {});
      showToast(`${integrationKey} settings saved.`);
    } catch (err) {
      showToast(err.message || "Save failed", "error");
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (integrationKey) => {
    setTesting(integrationKey);
    try {
      const result = await testIntegrationConnection(integrationKey);
      showToast(
        result.detail || (result.success ? "Connection verified!" : "Connection failed."),
        result.success ? "success" : "error"
      );
    } catch (err) {
      showToast(err.message || "Test failed", "error");
    } finally {
      setTesting(null);
    }
  };

  const toggleKey = (key) => setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = activeCategory === "all"
    ? INTEGRATIONS
    : INTEGRATIONS.filter(i => i.category === activeCategory);

  if (loading) {
    return (
      <SuperAdminLayout title="Integrations" breadcrumbs={[{ label: "Integrations" }]}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title="Global Integrations"
      description="Manage API keys and third-party integrations"
      breadcrumbs={[{ label: "Integrations" }]}
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

      {/* Warning */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-orange-900 font-medium">Platform-level credentials</p>
            <p className="text-xs text-orange-700 mt-0.5">
              Changes here affect all tenants. Test connections before saving.
            </p>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white border border-gray-200 p-1 rounded-xl inline-flex flex-wrap gap-1 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Integration cards */}
      <div className="space-y-6">
        {filtered.map(config => {
          const Icon = config.icon;
          const data = formData[config.key] || {};
          const isEnabled = data.enabled !== false;
          const isSaving = saving === config.key;
          const isTesting = testing === config.key;

          return (
            <div key={config.key} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    isEnabled
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}>
                    {isEnabled ? <><CheckCircle className="w-3 h-3" /> Active</> : <><AlertCircle className="w-3 h-3" /> Inactive</>}
                  </span>
                  <button
                    onClick={() => updateField(config.key, "enabled", !isEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isEnabled ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>
              </div>

              {/* Fields */}
              {isEnabled && (
                <div className="space-y-4">
                  {config.fields.map(field => (
                    <div key={field.key}>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">{field.label}</label>
                      <div className="relative">
                        <input
                          type={field.sensitive && !showKeys[`${config.key}-${field.key}`] ? "password" : "text"}
                          value={data[field.key] || ""}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] pr-10 font-mono"
                          onChange={e => updateField(config.key, field.key, e.target.value)}
                        />
                        {field.sensitive && (
                          <button
                            type="button"
                            onClick={() => toggleKey(`${config.key}-${field.key}`)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showKeys[`${config.key}-${field.key}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Extras (toggles) */}
                  {config.extras?.map(extra => (
                    <div key={extra.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{extra.label}</span>
                      <button
                        onClick={() => updateField(config.key, extra.key, !(data[extra.key] !== false))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          data[extra.key] !== false ? "bg-amber-400" : "bg-[#800020]"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          data[extra.key] !== false ? "translate-x-1" : "translate-x-6"
                        }`} />
                      </button>
                    </div>
                  ))}

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => handleTest(config.key)}
                      disabled={isTesting}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                      Test Connection
                    </button>
                    <button
                      onClick={() => handleSave(config.key)}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: MAROON }}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Documentation */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Need help?</h3>
            <p className="text-sm text-gray-600">Check integration documentation for setup guides</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <ExternalLink className="w-4 h-4" />
            View Documentation
          </button>
        </div>
      </div>
    </SuperAdminLayout>
  );
}