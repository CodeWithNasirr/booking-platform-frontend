// src/app/superadmin/settings/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save, Loader2, DollarSign, Shield, Zap, Settings,
  ToggleLeft, ToggleRight, AlertCircle, CheckCircle2,
  Mail, Phone, Globe, Wrench,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import { useTranslation } from "@/lib/t";
import {
  fetchPlatformSettings,
  updatePlatformSettings,
} from "@/lib/platformApi";

const MAROON = "#8B1E3F";

export default function SettingsPage() {
  const { hasPermission } = useSuperAdmin();
  const { t } = useTranslation();
  const canEdit = hasPermission("system.manage_settings");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("fees");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPlatformSettings();
      setData(res);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      await updatePlatformSettings(data);
      showToast(t("settings_save_success"));
    } catch (e) {
      showToast(e.message || t("settings_save_failed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section, key, value) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const updateTopLevel = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: "fees", label: t("settings_tab_fees"), icon: DollarSign },
    { id: "limits", label: t("settings_tab_limits"), icon: Shield },
    { id: "features", label: t("settings_tab_features"), icon: Zap },
    { id: "gateway", label: t("settings_tab_gateway"), icon: Settings },
    { id: "general", label: t("settings_tab_general"), icon: Globe },
  ];

  if (loading || !data) {
    return (
      <SuperAdminLayout title={t("settings_title")} breadcrumbs={[{ label: t("settings_breadcrumb") }]}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title={t("settings_title")}
      description={t("settings_description")}
      breadcrumbs={[{ label: t("settings_breadcrumb") }]}
    >
      {/* Tabs */}
      <div className="bg-white border border-gray-200 p-1 rounded-xl inline-flex flex-wrap gap-1 mb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ FEES ═══ */}
      {activeTab === "fees" && (
        <Section title={t("settings_section_fees")} desc={t("settings_section_fees_desc")}>
          <FieldRow label={t("settings_default_fee")} hint={t("settings_default_fee_hint")}>
            <NumberInput
              value={data.fees?.default_platform_fee_percent}
              onChange={v => updateField("fees", "default_platform_fee_percent", v)}
              min={0} max={50} step={0.5} suffix="%"
              disabled={!canEdit}
            />
          </FieldRow>
          <FieldRow label={t("settings_min_fee")} hint={t("settings_min_fee_hint")}>
            <NumberInput
              value={data.fees?.min_platform_fee_percent}
              onChange={v => updateField("fees", "min_platform_fee_percent", v)}
              min={0} max={50} step={0.5} suffix="%"
              disabled={!canEdit}
            />
          </FieldRow>
          <FieldRow label={t("settings_max_fee")} hint={t("settings_max_fee_hint")}>
            <NumberInput
              value={data.fees?.max_platform_fee_percent}
              onChange={v => updateField("fees", "max_platform_fee_percent", v)}
              min={0} max={100} step={0.5} suffix="%"
              disabled={!canEdit}
            />
          </FieldRow>
        </Section>
      )}

      {/* ═══ LIMITS ═══ */}
      {activeTab === "limits" && (
        <Section title={t("settings_section_limits")} desc={t("settings_section_limits_desc")}>
          {Object.entries(data.limits || {}).map(([key, val]) => (
            <FieldRow key={key} label={formatLabel(key, t)} hint={t("settings_current_value", { val: val === 0 ? t("unlimited") : val })}>
              <NumberInput
                value={val}
                onChange={v => updateField("limits", key, v)}
                min={0} max={99999} step={1}
                disabled={!canEdit}
              />
            </FieldRow>
          ))}
        </Section>
      )}

      {/* ═══ FEATURES ═══ */}
      {activeTab === "features" && (
        <Section title={t("settings_section_features")} desc={t("settings_section_features_desc")}>
          {Object.entries(data.feature_flags || {}).map(([key, val]) => (
            <FieldRow key={key} label={formatLabel(key, t)}>
              <ToggleSwitch
                value={val}
                onChange={v => updateField("feature_flags", key, v)}
                disabled={!canEdit}
              />
            </FieldRow>
          ))}
        </Section>
      )}

      {/* ═══ GATEWAY ═══ */}
      {activeTab === "gateway" && (
        <Section title={t("settings_section_gateway")} desc={t("settings_section_gateway_desc")}>
          <FieldRow label={t("settings_default_provider")} hint={t("settings_default_provider_hint")}>
            <select
              value={data.gateway_config?.default_provider || "stripe"}
              onChange={e => updateField("gateway_config", "default_provider", e.target.value)}
              disabled={!canEdit}
              className="px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F] text-sm"
            >
              <option value="stripe">{t("provider_stripe")}</option>
              <option value="hyperpay">{t("provider_hyperpay")}</option>
            </select>
          </FieldRow>
          <FieldRow label={t("settings_hyperpay_sandbox")}>
            <ToggleSwitch
              value={data.gateway_config?.hyperpay_sandbox}
              onChange={v => updateField("gateway_config", "hyperpay_sandbox", v)}
              disabled={!canEdit}
            />
          </FieldRow>
          <FieldRow label={t("settings_stripe_webhook")}>
            <NumberInput
              value={data.gateway_config?.stripe_webhook_tolerance}
              onChange={v => updateField("gateway_config", "stripe_webhook_tolerance", v)}
              min={60} max={900} step={30}
              disabled={!canEdit}
            />
          </FieldRow>
        </Section>
      )}

      {/* ═══ GENERAL ═══ */}
      {activeTab === "general" && (
        <Section title={t("settings_section_general")} desc={t("settings_section_general_desc")}>
          <FieldRow label={t("settings_maintenance_mode")}>
            <ToggleSwitch
              value={data.feature_flags?.maintenance_mode}
              onChange={v => updateField("feature_flags", "maintenance_mode", v)}
              disabled={!canEdit}
              danger
            />
          </FieldRow>
          {data.feature_flags?.maintenance_mode && (
            <FieldRow label={t("settings_maintenance_message")}>
              <textarea
                value={data.maintenance_message || ""}
                onChange={e => updateTopLevel("maintenance_message", e.target.value)}
                rows={3}
                disabled={!canEdit}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#8B1E3F]/20 text-sm"
              />
            </FieldRow>
          )}
          <FieldRow label={t("settings_support_email")} icon={Mail}>
            <input
              type="email"
              value={data.support_email || ""}
              onChange={e => updateTopLevel("support_email", e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#8B1E3F]/20 text-sm"
            />
          </FieldRow>
          <FieldRow label={t("settings_support_phone")} icon={Phone}>
            <input
              type="tel"
              value={data.support_phone || ""}
              onChange={e => updateTopLevel("support_phone", e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#8B1E3F]/20 text-sm"
            />
          </FieldRow>
        </Section>
      )}

      {/* ═══ SAVE BAR ═══ */}
      {canEdit && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 -mx-6 mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
            style={{ backgroundColor: MAROON }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t("settings_saving") : t("settings_save")}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white font-medium ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════

function Section({ title, desc, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {desc && <p className="text-sm text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function FieldRow({ label, hint, icon, children }) {
  const Icon = icon;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="sm:w-64 flex-shrink-0">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, step, suffix, disabled }) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value ?? ""}
        onChange={e => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F] text-sm disabled:bg-gray-50 disabled:text-gray-400"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>
      )}
    </div>
  );
}

function ToggleSwitch({ value, onChange, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
        value
          ? danger ? "bg-red-500" : "bg-green-500"
          : "bg-gray-300"
      }`}
    >
      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        value ? "left-6" : "left-1"
      }`} />
    </button>
  );
}

function formatLabel(key, t) {
  // Try to get translation first, fallback to title-case
  const transKey = `settings_label_${key}`;
  const translated = t(transKey);
  if (translated !== transKey) return translated;
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}