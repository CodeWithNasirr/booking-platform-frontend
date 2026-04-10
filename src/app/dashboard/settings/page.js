// src/app/dashboard/settings/page.js  (PHASE 2 — FULL REPLACEMENT)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { fetchTenantSettings, updateTenantSettings } from '@/lib/settingsApi'
import NotificationTabs from '@/components/dashboard/settings/NotificationTabs'
import AppStoreTab from '@/components/dashboard/settings/AppStoreTab'
import DomainSettingsTab from '@/components/dashboard/settings/DomainSettingsTab'
import TenantPermissionGate from '@/components/dashboard/TenantPermissionGate'

import {
  Building2, Bell, Zap, Globe, Languages, Save, Upload,
  Mail, Phone, MapPin, Loader2, Check, AlertCircle,
  CreditCard,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
import BillingSettings from '@/components/dashboard/billing/BillingSettings'

// ─── Tab config ─────────────────────────────────────────────────

const TABS = [
  { key: 'business', label: 'Business Info', icon: Building2 },
  { key: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'appstore', label: 'App Store', icon: Zap },
  { key: 'domain', label: 'Domain & Branding', icon: Globe },
  { key: 'language', label: 'Language & Region', icon: Languages },
]

function getTenantWebsiteUrl(domains) {
  if (!domains || domains.length === 0) return null;

  // ✅ find primary domain
  const primary = domains.find(d => d.is_primary);

  if (!primary) return null;

  // 🌍 Custom domain
  if (primary.is_custom) {
    return `https://www.${primary.domain}`;
  }

  // 🧪 Development
  if (process.env.NODE_ENV === "development") {
    return `http://${primary.domain}.lvh.me:3000`;
  }

  // 🚀 Production subdomain
  return `${process.env.NEXT_PUBLIC_FRONTEND_PROTOCOL}://${primary.domain}.${process.env.NEXT_PUBLIC_FRONTEND_DOMAIN}`;
}

// ─── Main Page ──────────────────────────────────────────────────

export default function TenantSettingsPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant, language, setLanguage } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab = searchParams.get('tab') || 'business'

  // ── Core state ──
  const [activeTab, setActiveTab] = useState(initialTab)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [error, setError] = useState(null)

  // ── Form state (derived from API) ──
  const [businessInfo, setBusinessInfo] = useState({})
  const [notificationRules, setNotificationRules] = useState([])
  const [integrations, setIntegrations] = useState({})
  const [branding, setBranding] = useState({ primary_color: '#8B1E3F', secondary_color: '#10B981' })
  const [domains, setDomains] = useState([])
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [tenantData, setTenantData] = useState({})

  useBlockBackNavigation(!!user)

  // Auth guards
  useEffect(() => {
    if (!loadingUser && !user) router.replace('/')
  }, [loadingUser, user, router])

  useEffect(() => {
    if (requiresOnboarding) router.replace('/auth/onboarding?step=1')
  }, [requiresOnboarding, router])

  // Sync tab → URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', activeTab)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [activeTab])

  // ── Load settings from API ──
  const loadSettings = useCallback(async () => {
    if (!activeTenant) return
    try {
      setLoading(true)
      const data = await fetchTenantSettings(activeTenant)
      setSettings(data)
      setBusinessInfo(data.business_info || {})
      setNotificationRules(data.notification_rules || [])
      setIntegrations(data.integrations || {})
      setBranding(data.branding || { primary_color: '#8B1E3F', secondary_color: '#10B981' })
      setDomains(data.domains || [])
      const domainsData = data.domains || [];
      setDomains(domainsData);
      // ✅ compute correct URL
      const computedUrl = getTenantWebsiteUrl(domainsData);

      setWebsiteUrl(computedUrl || '');
      setTenantData(data.tenant || {})
    } catch (err) {
      console.error('Failed to load settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [activeTenant])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // ── Save handler ──
  const handleSave = async (section, data) => {
    setSaving(true)
    setSaveStatus(null)
    try {
      const payload = { [section]: data }
      const updated = await updateTenantSettings(activeTenant, payload)
      setSettings((prev) => ({ ...prev, ...updated }))
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      console.error('Save failed:', err)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationRulesChange = (rules) => setNotificationRules(rules)
  const handleSaveNotifications = () => handleSave('notification_rules', notificationRules)

  const handleIntegrationsUpdate = (partial) => {
    const merged = { ...integrations, ...partial }
    setIntegrations(merged)
    handleSave('integrations', merged)
  }

  if (requiresOnboarding || loadingUser) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
      </div>
    )
  }

  return (
    <TenantPermissionGate permission="settings.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your business settings and preferences</p>
          </div>

          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
              <Check className="w-4 h-4" />
              Saved
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Save failed
            </div>
          )}
        </div>

        {/* Tabs + content */}
        <div className="bg-white rounded-2xl border border-[#8B1E3F]/10 shadow-sm overflow-hidden">
          {/* Tab headers */}
          <div className="border-b border-[#8B1E3F]/10 px-6 overflow-x-auto">
            <div className="flex items-center gap-1 -mb-px min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-[#8B1E3F] text-[#8B1E3F]'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-[#8B1E3F]/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {/* ═══ BUSINESS INFO ═══ */}
            {activeTab === 'business' && (
              <BusinessInfoTab
                data={businessInfo}
                onChange={setBusinessInfo}
                onSave={() => handleSave('business_info', businessInfo)}
                saving={saving}
              />
            )}

            {/* ═══ BILLING ═══ */}
            {activeTab === 'billing' && <BillingSettings />}

            {/* ═══ NOTIFICATIONS ═══ */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <NotificationTabs
                  rules={notificationRules}
                  onChange={handleNotificationRulesChange}
                />
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Notifications
                  </button>
                </div>
              </div>
            )}

            {/* ═══ APP STORE ═══ */}
            {activeTab === 'appstore' && (
              <AppStoreTab
                integrations={integrations}
                onUpdate={handleIntegrationsUpdate}
              />
            )}

            {/* ═══ DOMAIN & BRANDING ═══ */}
            {activeTab === 'domain' && (
              <DomainSettingsTab
                domains={domains}
                websiteUrl={websiteUrl}
                tenantSlug={tenantData.slug}
                branding={branding}
                activeTenant={activeTenant}
                onDomainsChange={loadSettings}
                onBrandingChange={setBranding}
                onSaveBranding={() => handleSave('branding', branding)}
                saving={saving}
              />
            )}

            {/* ═══ LANGUAGE ═══ */}
            {activeTab === 'language' && (
              <LanguageTab language={language} setLanguage={setLanguage} />
            )}
          </div>
        </div>
      </div>
    </TenantPermissionGate>
  )
}

// ═══════════════════════════════════════════════════════════════
// SUB-TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════

function BusinessInfoTab({ data, onChange, onSave, saving }) {
  const update = (field, value) => onChange({ ...data, [field]: value })

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex items-center gap-4 pb-6 border-b border-[#8B1E3F]/10">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">Business Logo</h3>
          <p className="text-sm text-gray-600">Upload your business logo (recommended: 512x512px)</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 transition-all shadow-sm">
          <Upload className="w-4 h-4" />
          Upload Logo
        </button>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Business Name *" value={data.business_name} onChange={(v) => update('business_name', v)} />
        <InputField label="Email Address *" value={data.email} onChange={(v) => update('email', v)} type="email" icon={Mail} />
        <InputField label="Phone Number *" value={data.phone} onChange={(v) => update('phone', v)} type="tel" icon={Phone} />
        <InputField label="Website" value={data.website} onChange={(v) => update('website', v)} icon={Globe} />
        <InputField label="Street Address *" value={data.address} onChange={(v) => update('address', v)} icon={MapPin} className="md:col-span-2" />
        <InputField label="City *" value={data.city} onChange={(v) => update('city', v)} />
        <InputField label="State / Province" value={data.state} onChange={(v) => update('state', v)} />
        <InputField label="ZIP Code" value={data.zip_code} onChange={(v) => update('zip_code', v)} />
        <InputField label="Country" value={data.country} onChange={(v) => update('country', v)} />
        <InputField label="Tax ID" value={data.tax_id} onChange={(v) => update('tax_id', v)} />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">Business Description</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-[#8B1E3F]/10">
        <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all">
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  )
}


function LanguageTab({ language, setLanguage }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Language Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Default Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white"
            >
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
              <option value="ur">اردو (Urdu)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Timezone</label>
            <select className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white">
              <option>Eastern Time (ET) - UTC-5</option>
              <option>Central Time (CT) - UTC-6</option>
              <option>Pacific Time (PT) - UTC-8</option>
              <option>Asia/Riyadh - UTC+3</option>
              <option>Asia/Kolkata - UTC+5:30</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── Shared ─────────────────────────────────────────────────────

function InputField({ label, value, onChange, type = 'text', icon: Icon, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all`}
        />
      </div>
    </div>
  )
}