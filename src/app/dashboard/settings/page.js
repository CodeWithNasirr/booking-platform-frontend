// // src/app/dashboard/settings/page.js  (PHASE 2 — FULL REPLACEMENT)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { fetchTenantSettings, updateTenantSettings,fetchLocaleSettings, fetchLocaleOptions, updateLocaleSettings } from '@/lib/settingsApi'
import NotificationTabs from '@/components/dashboard/settings/NotificationTabs'
import DomainSettingsTab from '@/components/dashboard/settings/DomainSettingsTab'
import TenantPermissionGate from '@/components/dashboard/TenantPermissionGate'
import DocumentUploadSection from '@/components/dashboard/settings/DocumentUploadSection'
import BrandingPanel from '@/components/dashboard/settings/BrandingPanel'

import { useRef } from "react";
import {
  Building2, Bell, Zap, Globe, Languages, Save, Upload,
  Mail, Phone, MapPin, Loader2, Check, AlertCircle,
  CreditCard, Palette,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
import BillingSettings from '@/components/dashboard/billing/BillingSettings'

function getTenantWebsiteUrl(domains) {
  if (!domains || domains.length === 0) return null;
  const primary = domains.find(d => d.is_primary);
  if (!primary) return null;
  if (primary.is_custom) {
    return `https://${primary.domain}`;
  }
  if (process.env.NODE_ENV === "development") {
    return `http://${primary.domain}.lvh.me:3000`;
  }
  return `${process.env.NEXT_PUBLIC_FRONTEND_PROTOCOL}://${primary.domain}.${process.env.NEXT_PUBLIC_FRONTEND_DOMAIN}`;
}

export default function TenantSettingsPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant, language, setLanguage, t } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialTab = searchParams.get('tab') || 'business'

  const [localeSettings, setLocaleSettings] = useState({
    default_language: 'en',
    timezone: 'UTC',
    default_currency: 'SAR',
    supported_languages: [],
  })
  const [localeOptions, setLocaleOptions] = useState({
    languages: [],
    timezones: [],
    currencies: [],
  })
  const [localeLoading, setLocaleLoading] = useState(false)
  const [localeSaving, setLocaleSaving] = useState(false)
  const [localeSaveStatus, setLocaleSaveStatus] = useState(null)
  const [localeErrors, setLocaleErrors] = useState({})

  const [activeTab, setActiveTab] = useState(initialTab)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [error, setError] = useState(null)

  const [businessInfo, setBusinessInfo] = useState({})
  const [notificationRules, setNotificationRules] = useState([])
  const [integrations, setIntegrations] = useState({})
  const [branding, setBranding] = useState({ primary_color: '#8B1E3F', secondary_color: '#10B981' })
  const [domains, setDomains] = useState([])
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [tenantData, setTenantData] = useState({})

  const TABS = [
    { key: 'business', labelKey: 'settings.tabs.business', icon: Building2 },
    { key: 'branding', labelKey: 'settings.tabs.branding', icon: Palette },
    { key: 'billing', labelKey: 'settings.tabs.billing', icon: CreditCard },
    { key: 'notifications', labelKey: 'settings.tabs.notifications', icon: Bell },
    { key: 'domain', labelKey: 'settings.tabs.domain', icon: Globe },
    { key: 'language', labelKey: 'settings.tabs.language', icon: Languages },
  ]

  useBlockBackNavigation(!!user)

  useEffect(() => {
    if (!loadingUser && !user) router.replace('/')
  }, [loadingUser, user, router])

  useEffect(() => {
    if (requiresOnboarding) router.replace('/auth/onboarding?step=1')
  }, [requiresOnboarding, router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', activeTab)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [activeTab])

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

      const domainsData = data.domains || []
      setDomains(domainsData)
      setWebsiteUrl(getTenantWebsiteUrl(domainsData) || '')
      setTenantData(data.tenant || {})

      if (data.tenant) {
        setLocaleSettings(prev => ({
          ...prev,
          default_language:    data.tenant.default_language || 'en',
          timezone:            data.tenant.timezone         || 'UTC',
          default_currency:    data.tenant.default_currency || 'USD',
          supported_languages: data.tenant.supported_languages || [],
        }))
      }
    } catch (err) {
      setError(t('settings.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [activeTenant, t])

  useEffect(() => { loadSettings() }, [loadSettings])

  useEffect(() => {
    if (activeTab !== 'language' || !activeTenant) return
    if (localeOptions.languages.length > 0) return

    setLocaleLoading(true)
    Promise.all([
      fetchLocaleSettings(activeTenant),
      fetchLocaleOptions(activeTenant),
    ])
      .then(([locale, options]) => {
        setLocaleSettings(locale)
        setLocaleOptions(options)
      })
      .catch(console.error)
      .finally(() => setLocaleLoading(false))
  }, [activeTab, activeTenant])

  const handleSaveLocale = async () => {
    setLocaleSaving(true)
    setLocaleSaveStatus(null)
    setLocaleErrors({})
    try {
      const updated = await updateLocaleSettings(activeTenant, localeSettings)
      setLocaleSettings(updated)
      setLocaleSaveStatus('success')
      if (updated.default_language !== language) {
        setLanguage(updated.default_language)
      }
      setTimeout(() => setLocaleSaveStatus(null), 2500)
    } catch (err) {
      if (err && typeof err === 'object') {
        setLocaleErrors(err)
      }
      setLocaleSaveStatus('error')
    } finally {
      setLocaleSaving(false)
    }
  }

  const handleSave = async (section, data) => {
    setSaving(true)
    setSaveStatus(null)
    try {
      const payload = { [section]: data }
      const updated = await updateTenantSettings(activeTenant, payload)
      setSettings((prev) => ({ ...prev, ...updated }))
      if (updated.business_info) {
        setBusinessInfo(updated.business_info)
      }
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
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
            <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
            <p className="text-gray-600 mt-1">{t('settings.subtitle')}</p>
          </div>

          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
              <Check className="w-4 h-4" />
              {t('common.saved')}
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              {t('common.saveFailed')}
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
                    {t(tab.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="p-6">
            {activeTab === 'business' && (
              <BusinessInfoTab
                data={businessInfo}
                onChange={setBusinessInfo}
                onSave={() => handleSave('business_info', businessInfo)}
                saving={saving}
                activeTenant={activeTenant}
              />
            )}

            {activeTab === 'branding' && <BrandingPanel />}

            {activeTab === 'billing' && <BillingSettings />}

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
                    {t('settings.notifications.save')}
                  </button>
                </div>
              </div>
            )}

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

            {activeTab === 'language' && (
              <LanguageTab
                settings={localeSettings}
                options={localeOptions}
                onChange={setLocaleSettings}
                onSave={handleSaveLocale}
                saving={localeSaving}
                saveStatus={localeSaveStatus}
                errors={localeErrors}
                loading={localeLoading}
                disabled={localeLoading || localeOptions.languages.length === 0}
              />
            )}
          </div>
        </div>
      </div>
    </TenantPermissionGate>
  )
}

function BusinessInfoTab({ data, onChange, onSave, saving, activeTenant }) {
  const { t } = useApp()
  const update = (field, value) => onChange({ ...data, [field]: value })
  const initialDataRef = useRef(null);

  useEffect(() => {
    if (!initialDataRef.current && data && Object.keys(data).length > 0) {
      initialDataRef.current = data;
    }
  }, [data]);

  const isDirty =
    initialDataRef.current &&
    Object.keys(data).some(
      key => data[key] !== initialDataRef.current[key]
    );

  const handleSaveClick = async () => {
    await onSave();
    initialDataRef.current = data;
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex items-center gap-4 pb-6 border-b border-[#8B1E3F]/10">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{t('settings.business.logo')}</h3>
          <p className="text-sm text-gray-600">{t('settings.business.logoHint')}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 transition-all shadow-sm">
          <Upload className="w-4 h-4" />
          {t('settings.business.uploadLogo')}
        </button>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label={t('settings.business.name')} value={data.business_name} onChange={(v) => update('business_name', v)} required />
        <InputField label={t('settings.business.email')} value={data.email} onChange={(v) => update('email', v)} type="email" icon={Mail} required />
        <InputField label={t('settings.business.phone')} value={data.phone} onChange={(v) => update('phone', v)} type="tel" icon={Phone} required />
        <InputField label={t('settings.business.website')} value={data.website} onChange={(v) => update('website', v)} icon={Globe} />
        <InputField label={t('settings.business.address')} value={data.address} onChange={(v) => update('address', v)} icon={MapPin} className="md:col-span-2" required />
        <InputField label={t('settings.business.city')} value={data.city} onChange={(v) => update('city', v)} required />
        <InputField label={t('settings.business.state')} value={data.state} onChange={(v) => update('state', v)} />
        <InputField label={t('settings.business.zipCode')} value={data.zip_code} onChange={(v) => update('zip_code', v)} />
        <InputField label={t('settings.business.country')} value={data.country} onChange={(v) => update('country', v)} />
        <InputField label={t('settings.business.taxId')} value={data.tax_id} onChange={(v) => update('tax_id', v)} />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{t('settings.business.description')}</label>
        <textarea
          value={data.description || ''}
          onChange={(e) => update('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all resize-none"
        />
      </div>

      <div className="pt-6 border-t border-[#8B1E3F]/10">
        <DocumentUploadSection activeTenant={activeTenant} />
      </div>

      {isDirty && (
        <div className="flex justify-end gap-3 pt-6 border-t border-[#8B1E3F]/10">
          <button
            onClick={() => {
              if (initialDataRef.current) {
                onChange(initialDataRef.current);
              }
            }}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            {t('common.cancel')}
          </button>

          <button
            onClick={handleSaveClick}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('common.saveChanges')}
          </button>
        </div>
      )}
    </div>
  )
}

function LanguageTab({ settings, options, onChange, onSave, saving, saveStatus, errors, loading, disabled }) {
  const { t } = useApp()
  const update = (field, value) => onChange(prev => ({ ...prev, [field]: value }))

  const toggleSupportedLang = (code) => {
    const current = settings.supported_languages || []
    const next = current.includes(code)
      ? current.filter(c => c !== code)
      : [...current, code]
    if (!next.includes(settings.default_language)) {
      next.push(settings.default_language)
    }
    update('supported_languages', next)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
      </div>
    )
  }

  const { languages = [], timezones = [], currencies = [] } = options
  const currentTz = timezones.find(t => t.value === settings.timezone)
  const currentCurrency = currencies.find(c => c.code === settings.default_currency)

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">{t('settings.language.language')}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('settings.language.languageDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('settings.language.defaultLanguage')}
            </label>
            <select
              value={settings.default_language}
              onChange={e => {
                const code = e.target.value
                onChange(prev => {
                  const supported = prev.supported_languages || []
                  return {
                    ...prev,
                    default_language: code,
                    supported_languages: supported.includes(code)
                      ? supported
                      : [...supported, code]
                  }
                })
              }}
              className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all
                focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F]
                ${errors.default_language ? 'border-red-400' : 'border-gray-300'}`}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} — {lang.label}
                </option>
              ))}
            </select>
            {errors.default_language && (
              <p className="mt-1 text-xs text-red-500">{errors.default_language}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('settings.language.additionalLanguages')}
              <span className="font-normal text-gray-500 ml-1">{t('settings.language.additionalLanguagesHint')}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {languages.map(lang => {
                const isDefault = lang.code === settings.default_language
                const isActive = (settings.supported_languages || []).includes(lang.code)

                return (
                  <button
                    key={lang.code}
                    type="button"
                    disabled={isDefault}
                    onClick={() => !isDefault && toggleSupportedLang(lang.code)}
                    title={isDefault ? t('settings.language.defaultAlwaysIncluded') : undefined}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                      ${isDefault
                        ? 'bg-[#8B1E3F]/10 border-[#8B1E3F]/30 text-[#8B1E3F] cursor-default'
                        : isActive
                        ? 'bg-[#8B1E3F] border-[#8B1E3F] text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-[#8B1E3F]/40'
                      }`}
                  >
                    {lang.native}
                    {isDefault && (
                      <span className="ml-1 text-[10px] opacity-70">{t('settings.language.defaultBadge')}</span>
                    )}
                  </button>
                )
              })}
            </div>
            {errors.supported_languages && (
              <p className="mt-1 text-xs text-red-500">{errors.supported_languages}</p>
            )}
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <section>
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">{t('settings.language.timezone')}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('settings.language.timezoneDesc')}
            <span className="text-amber-600 font-medium ml-1">
              {t('settings.language.timezoneWarning')}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('settings.language.tenantTimezone')}
            </label>
            <select
              value={settings.timezone}
              onChange={e => update('timezone', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all
                focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F]
                ${errors.timezone ? 'border-red-400' : 'border-gray-300'}`}
            >
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="mt-1 text-xs text-red-500">{errors.timezone}</p>
            )}
          </div>

          {currentTz && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 self-end">
              <div className="w-9 h-9 rounded-full bg-[#8B1E3F]/10 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-[#8B1E3F]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {currentTz.value.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-gray-500">{currentTz.offset}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="border-t border-gray-100" />

      <section>
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">{t('settings.language.currency')}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('settings.language.currencyDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('settings.language.defaultCurrency')}
            </label>
            <select
              value={settings.default_currency}
              onChange={e => update('default_currency', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all
                focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F]
                ${errors.default_currency ? 'border-red-400' : 'border-gray-300'}`}
            >
              {currencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.label}
                </option>
              ))}
            </select>
            {errors.default_currency && (
              <p className="mt-1 text-xs text-red-500">{errors.default_currency}</p>
            )}
          </div>

          {currentCurrency && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 self-end">
              <div className="w-9 h-9 rounded-full bg-[#8B1E3F]/10 flex items-center justify-center flex-shrink-0 text-[#8B1E3F] font-bold text-sm">
                {currentCurrency.symbol}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{currentCurrency.label}</p>
                <p className="text-xs text-gray-500">{currentCurrency.code}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="flex items-center justify-between pt-6 border-t border-[#8B1E3F]/10">
        <div>
          {saveStatus === 'success' && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <Check className="w-4 h-4" /> {t('common.savedSuccess')}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
              <AlertCircle className="w-4 h-4" /> {t('common.saveFailedCheck')}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange(prev => ({ ...prev }))}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || disabled}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white
              bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90
              transition-all shadow-md disabled:opacity-50 font-medium"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {t('common.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', icon: Icon, className = '', required = false }) {
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
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











// 'use client'

// import { useState, useEffect, useCallback } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { useApp } from '@/contexts/AppContext'
// import { fetchTenantSettings, updateTenantSettings,fetchLocaleSettings, fetchLocaleOptions, updateLocaleSettings } from '@/lib/settingsApi'
// import NotificationTabs from '@/components/dashboard/settings/NotificationTabs'
// // import AppStoreTab from '@/components/dashboard/settings/AppStoreTab'
// import DomainSettingsTab from '@/components/dashboard/settings/DomainSettingsTab'
// import TenantPermissionGate from '@/components/dashboard/TenantPermissionGate'
// import DocumentUploadSection from '@/components/dashboard/settings/DocumentUploadSection'

// import { useRef } from "react";
// import {
//   Building2, Bell, Zap, Globe, Languages, Save, Upload,
//   Mail, Phone, MapPin, Loader2, Check, AlertCircle,
//   CreditCard,
// } from 'lucide-react'
// import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
// import BillingSettings from '@/components/dashboard/billing/BillingSettings'

// // ─── Tab config ─────────────────────────────────────────────────

// const TABS = [
//   { key: 'business', label: 'Business Info', icon: Building2 },
//   { key: 'billing', label: 'Billing & Plan', icon: CreditCard },
//   { key: 'notifications', label: 'Notifications', icon: Bell },
//   // { key: 'appstore', label: 'App Store', icon: Zap },
//   { key: 'domain', label: 'Domain & Branding', icon: Globe },
//   { key: 'language', label: 'Language & Region', icon: Languages },
// ]

// function getTenantWebsiteUrl(domains) {
//   if (!domains || domains.length === 0) return null;

//   // ✅ find primary domain
//   const primary = domains.find(d => d.is_primary);

//   if (!primary) return null;

//   // 🌍 Custom domain
//   if (primary.is_custom) {
//     return `https://${primary.domain}`;
//   }

//   // 🧪 Development
//   if (process.env.NODE_ENV === "development") {
//     return `http://${primary.domain}.lvh.me:3000`;
//   }

//   // 🚀 Production subdomain
//   return `${process.env.NEXT_PUBLIC_FRONTEND_PROTOCOL}://${primary.domain}.${process.env.NEXT_PUBLIC_FRONTEND_DOMAIN}`;
// }

// // ─── Main Page ──────────────────────────────────────────────────

// export default function TenantSettingsPage() {
//   const { user, loadingUser, requiresOnboarding, activeTenant, language, setLanguage } = useApp()
//   const router = useRouter()
//   const searchParams = useSearchParams()

//   const initialTab = searchParams.get('tab') || 'business'

//   // Inside TenantSettingsPage — add alongside existing state
//   const [localeSettings, setLocaleSettings] = useState({
//     default_language: 'en',
//     timezone: 'UTC',
//     default_currency: 'SAR',
//     supported_languages: [],
//   })
//   const [localeOptions, setLocaleOptions] = useState({
//     languages: [],
//     timezones: [],
//     currencies: [],
//   })
//   const [localeLoading, setLocaleLoading] = useState(false)
//   const [localeSaving, setLocaleSaving] = useState(false)
//   const [localeSaveStatus, setLocaleSaveStatus] = useState(null) // 'success' | 'error' | null
//   const [localeErrors, setLocaleErrors] = useState({})

//   // ── Core state ──
//   const [activeTab, setActiveTab] = useState(initialTab)
//   const [settings, setSettings] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [saveStatus, setSaveStatus] = useState(null)
//   const [error, setError] = useState(null)

//   // ── Form state (derived from API) ──
//   const [businessInfo, setBusinessInfo] = useState({})
//   const [notificationRules, setNotificationRules] = useState([])
//   const [integrations, setIntegrations] = useState({})
//   const [branding, setBranding] = useState({ primary_color: '#8B1E3F', secondary_color: '#10B981' })
//   const [domains, setDomains] = useState([])
//   const [websiteUrl, setWebsiteUrl] = useState('')
//   const [tenantData, setTenantData] = useState({})

//   useBlockBackNavigation(!!user)

//   // Auth guards
//   useEffect(() => {
//     if (!loadingUser && !user) router.replace('/')
//   }, [loadingUser, user, router])

//   useEffect(() => {
//     if (requiresOnboarding) router.replace('/auth/onboarding?step=1')
//   }, [requiresOnboarding, router])

//   // Sync tab → URL
//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search)
//     params.set('tab', activeTab)
//     window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
//   }, [activeTab])

//   // ── Load settings from API — seed locale from main settings response ──
//   const loadSettings = useCallback(async () => {
//     if (!activeTenant) return
//     try {
//       setLoading(true)
//       const data = await fetchTenantSettings(activeTenant)
//       console.log("Fetched tenant settings:", data)
//       setSettings(data)
//       setBusinessInfo(data.business_info || {})
//       setNotificationRules(data.notification_rules || [])
//       setIntegrations(data.integrations || {})
//       setBranding(data.branding || { primary_color: '#8B1E3F', secondary_color: '#10B981' })

//       const domainsData = data.domains || []
//       setDomains(domainsData)
//       setWebsiteUrl(getTenantWebsiteUrl(domainsData) || '')
//       setTenantData(data.tenant || {})

//       // ── Seed locale from tenant data in the main response ──
//       // This prevents sending stale defaults if user switches to language tab quickly
//       if (data.tenant) {
//         setLocaleSettings(prev => ({
//           ...prev,
//           default_language:    data.tenant.default_language || 'en',
//           timezone:            data.tenant.timezone         || 'UTC',
//           default_currency:    data.tenant.default_currency || 'USD',
//           supported_languages: data.tenant.supported_languages || [],
//         }))
//       }
//     } catch (err) {
//       console.error('Failed to load settings:', err)
//       setError('Failed to load settings')
//     } finally {
//       setLoading(false)
//     }
//   }, [activeTenant])

//   useEffect(() => {
//     loadSettings()
//   }, [loadSettings])


//   // ── Load locale options + fresh locale values when tab opens ──
//   useEffect(() => {
//     if (activeTab !== 'language' || !activeTenant) return
//     if (localeOptions.languages.length > 0) return // already loaded

//     setLocaleLoading(true)
//     Promise.all([
//       fetchLocaleSettings(activeTenant),   // fresh values from DB
//       fetchLocaleOptions(activeTenant),    // dropdown options
//     ])
//       .then(([locale, options]) => {
//         setLocaleSettings(locale)          // overwrite with real DB values
//         setLocaleOptions(options)
//       })
//       .catch(console.error)
//       .finally(() => setLocaleLoading(false))
//   }, [activeTab, activeTenant])


//   // Add save handler
//   const handleSaveLocale = async () => {
//     setLocaleSaving(true)
//     setLocaleSaveStatus(null)
//     setLocaleErrors({})
//     try {
//       const updated = await updateLocaleSettings(activeTenant, localeSettings)
//       setLocaleSettings(updated)
//       setLocaleSaveStatus('success')
//       // Also update AppContext language so UI reflects immediately
//       if (updated.default_language !== language) {
//         setLanguage(updated.default_language)
//       }
//       setTimeout(() => setLocaleSaveStatus(null), 2500)
//     } catch (err) {
//       if (err && typeof err === 'object') {
//         setLocaleErrors(err) // field-level errors from DRF
//       }
//       setLocaleSaveStatus('error')
//     } finally {
//       setLocaleSaving(false)
//     }
//   }



//   // ── Save handler ──
//   const handleSave = async (section, data) => {
//     setSaving(true)
//     setSaveStatus(null)
//     try {
//       const payload = { [section]: data }
//       const updated = await updateTenantSettings(activeTenant, payload)
//       setSettings((prev) => ({ ...prev, ...updated }))
//       if (updated.business_info) {
//         setBusinessInfo(updated.business_info)
//       }
//       setSaveStatus('success')
//       setTimeout(() => setSaveStatus(null), 2000)
//     } catch (err) {
//       console.error('Save failed:', err)
//       setSaveStatus('error')
//     } finally {
//       setSaving(false)
//     }
//   }

//   const handleNotificationRulesChange = (rules) => setNotificationRules(rules)
//   const handleSaveNotifications = () => handleSave('notification_rules', notificationRules)

//   const handleIntegrationsUpdate = (partial) => {
//     const merged = { ...integrations, ...partial }
//     setIntegrations(merged)
//     handleSave('integrations', merged)
//   }

//   if (requiresOnboarding || loadingUser) return null

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-32">
//         <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
//       </div>
//     )
//   }

//   return (
//     <TenantPermissionGate permission="settings.view">
//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
//             <p className="text-gray-600 mt-1">Manage your business settings and preferences</p>
//           </div>

//           {saveStatus === 'success' && (
//             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
//               <Check className="w-4 h-4" />
//               Saved
//             </div>
//           )}
//           {saveStatus === 'error' && (
//             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
//               <AlertCircle className="w-4 h-4" />
//               Save failed
//             </div>
//           )}
//         </div>

//         {/* Tabs + content */}
//         <div className="bg-white rounded-2xl border border-[#8B1E3F]/10 shadow-sm overflow-hidden">
//           {/* Tab headers */}
//           <div className="border-b border-[#8B1E3F]/10 px-6 overflow-x-auto">
//             <div className="flex items-center gap-1 -mb-px min-w-max">
//               {TABS.map((tab) => {
//                 const Icon = tab.icon
//                 return (
//                   <button
//                     key={tab.key}
//                     onClick={() => setActiveTab(tab.key)}
//                     className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
//                       activeTab === tab.key
//                         ? 'border-[#8B1E3F] text-[#8B1E3F]'
//                         : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-[#8B1E3F]/30'
//                     }`}
//                   >
//                     <Icon className="w-4 h-4" />
//                     {tab.label}
//                   </button>
//                 )
//               })}
//             </div>
//           </div>

//           {/* Tab content */}
//           <div className="p-6">
//             {/* ═══ BUSINESS INFO ═══ */}
//             {activeTab === 'business' && (
//               <BusinessInfoTab
//                 data={businessInfo}
//                 onChange={setBusinessInfo}
//                 onSave={() => handleSave('business_info', businessInfo)}
//                 saving={saving}
//                 activeTenant={activeTenant}
//               />
//             )}

//             {/* ═══ BILLING ═══ */}
//             {activeTab === 'billing' && <BillingSettings />}

//             {/* ═══ NOTIFICATIONS ═══ */}
//             {activeTab === 'notifications' && (
//               <div className="space-y-6">
//                 <NotificationTabs
//                   rules={notificationRules}
//                   onChange={handleNotificationRulesChange}
//                 />
//                 <div className="flex justify-end pt-4 border-t border-gray-100">
//                   <button
//                     onClick={handleSaveNotifications}
//                     disabled={saving}
//                     className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium disabled:opacity-50"
//                   >
//                     {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
//                     Save Notifications
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* ═══ APP STORE ═══ */}
//             {activeTab === 'appstore' && (
//               <AppStoreTab
//                 integrations={integrations}
//                 onUpdate={handleIntegrationsUpdate}
//               />
//             )}

//             {/* ═══ DOMAIN & BRANDING ═══ */}
//             {activeTab === 'domain' && (
//               <DomainSettingsTab
//                 domains={domains}
//                 websiteUrl={websiteUrl}
//                 tenantSlug={tenantData.slug}
//                 branding={branding}
//                 activeTenant={activeTenant}
//                 onDomainsChange={loadSettings}
//                 onBrandingChange={setBranding}
//                 onSaveBranding={() => handleSave('branding', branding)}
//                 saving={saving}
//               />
//             )}

//             {/* ═══ LANGUAGE ═══ */}
          
//             {activeTab === 'language' && (
//               <LanguageTab
//                 settings={localeSettings}
//                 options={localeOptions}
//                 onChange={setLocaleSettings}
//                 onSave={handleSaveLocale}
//                 saving={localeSaving}
//                 saveStatus={localeSaveStatus}
//                 errors={localeErrors}
//                 loading={localeLoading}
//                 disabled={localeLoading || localeOptions.languages.length === 0}
//               />
//             )}
//           </div>
//         </div>
//       </div>
//     </TenantPermissionGate>
//   )
// }

// // ═══════════════════════════════════════════════════════════════
// // SUB-TAB COMPONENTS
// // ═══════════════════════════════════════════════════════════════

// function BusinessInfoTab({ data, onChange, onSave, saving, activeTenant }) {
//   const update = (field, value) => onChange({ ...data, [field]: value })
//   const initialDataRef = useRef(null);

//   useEffect(() => {
//     if (!initialDataRef.current && data && Object.keys(data).length > 0) {
//       initialDataRef.current = data;
//     }
//   }, [data]);

//   const isDirty =
//     initialDataRef.current &&
//     Object.keys(data).some(
//       key => data[key] !== initialDataRef.current[key]
//     );

//   const handleSaveClick = async () => {
//     await onSave();
//     initialDataRef.current = data;
//   };
//   return (
//     <div className="space-y-6">
//       {/* Logo */}
//       <div className="flex items-center gap-4 pb-6 border-b border-[#8B1E3F]/10">
//         <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
//           <Building2 className="w-10 h-10 text-white" />
//         </div>
//         <div className="flex-1">
//           <h3 className="text-lg font-bold text-gray-900">Business Logo</h3>
//           <p className="text-sm text-gray-600">Upload your business logo (recommended: 512x512px)</p>
//         </div>
//         <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 transition-all shadow-sm">
//           <Upload className="w-4 h-4" />
//           Upload Logo
//         </button>
//       </div>

//       {/* Fields */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <InputField label="Business Name *" value={data.business_name} onChange={(v) => update('business_name', v)} />
//         <InputField label="Email Address *" value={data.email} onChange={(v) => update('email', v)} type="email" icon={Mail} />
//         <InputField label="Phone Number *" value={data.phone} onChange={(v) => update('phone', v)} type="tel" icon={Phone} />
//         <InputField label="Website" value={data.website} onChange={(v) => update('website', v)} icon={Globe} />
//         <InputField label="Street Address *" value={data.address} onChange={(v) => update('address', v)} icon={MapPin} className="md:col-span-2" />
//         <InputField label="City *" value={data.city} onChange={(v) => update('city', v)} />
//         <InputField label="State / Province" value={data.state} onChange={(v) => update('state', v)} />
//         <InputField label="ZIP Code" value={data.zip_code} onChange={(v) => update('zip_code', v)} />
//         <InputField label="Country" value={data.country} onChange={(v) => update('country', v)} />
//         <InputField label="Tax ID" value={data.tax_id} onChange={(v) => update('tax_id', v)} />
//       </div>

//       <div>
//         <label className="block text-sm font-bold text-gray-700 mb-2">Business Description</label>
//         <textarea
//           value={data.description || ''}
//           onChange={(e) => update('description', e.target.value)}
//           rows={4}
//           className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all resize-none"
//         />
//       </div>

//       {/* ═══ BUSINESS DOCUMENT ═══ */}
//       <div className="pt-6 border-t border-[#8B1E3F]/10">
//         <DocumentUploadSection activeTenant={activeTenant} />
//       </div>

//       {/* ═══ ACTION BUTTONS ═══ */}
//       {isDirty && (
//       <div className="flex justify-end gap-3 pt-6 border-t border-[#8B1E3F]/10">
//         <button
//           onClick={() => {
//             if (initialDataRef.current) {
//               onChange(initialDataRef.current);
//             }
//           }}
//           className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
//         >
//           Cancel
//         </button>

//         <button
//           onClick={handleSaveClick}
//           disabled={saving}
//           className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 font-medium"
//         >
//           {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
//           Save Changes
//         </button>
//       </div>
//     )}
//     </div>
//   )
// }


// // src/app/dashboard/settings/page.js — LanguageTab component

// function LanguageTab({ settings, options, onChange, onSave, saving, saveStatus, errors, loading, disabled }) {
//   const update = (field, value) => onChange(prev => ({ ...prev, [field]: value }))

//   const toggleSupportedLang = (code) => {
//     const current = settings.supported_languages || []
//     const next = current.includes(code)
//       ? current.filter(c => c !== code)
//       : [...current, code]
//     // Always ensure default_language is in supported list
//     if (!next.includes(settings.default_language)) {
//       next.push(settings.default_language)
//     }
//     update('supported_languages', next)
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-20">
//         <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
//       </div>
//     )
//   }

//   const { languages = [], timezones = [], currencies = [] } = options

//   // Find current timezone label for display
//   const currentTz = timezones.find(t => t.value === settings.timezone)
//   const currentCurrency = currencies.find(c => c.code === settings.default_currency)

//   return (
//     <div className="space-y-8">

//       {/* ── Section: Language ─────────────────────────────────────────── */}
//       <section>
//         <div className="mb-5">
//           <h3 className="text-base font-bold text-gray-900">Language</h3>
//           <p className="text-sm text-gray-500 mt-0.5">
//             Controls the default language for your tenant site and dashboard.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Default language */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-2">
//               Default Language
//             </label>
//             <select
//               value={settings.default_language}
//               onChange={e => {
//                 const code = e.target.value

//                 onChange(prev => {
//                   const supported = prev.supported_languages || []

//                   return {
//                     ...prev,
//                     default_language: code,
//                     supported_languages: supported.includes(code)
//                       ? supported
//                       : [...supported, code]
//                   }
//                 })
//               }}
//               className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all
//                 focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F]
//                 ${errors.default_language ? 'border-red-400' : 'border-gray-300'}`}
//             >
//               {languages.map(lang => (
//                 <option key={lang.code} value={lang.code}>
//                   {lang.native} — {lang.label}
//                 </option>
//               ))}
//             </select>
//             {errors.default_language && (
//               <p className="mt-1 text-xs text-red-500">{errors.default_language}</p>
//             )}
//           </div>

//           {/* Supported languages */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-2">
//               Additional Languages
//               <span className="font-normal text-gray-500 ml-1">(shown on your site)</span>
//             </label>
//             <div className="flex flex-wrap gap-2">
//               {languages.map(lang => {
//                 const isDefault = lang.code === settings.default_language
//                 const isActive = (settings.supported_languages || []).includes(lang.code)

//                 return (
//                   <button
//                     key={lang.code}
//                     type="button"
//                     disabled={isDefault}
//                     onClick={() => !isDefault && toggleSupportedLang(lang.code)}
//                     title={isDefault ? 'Default language is always included' : undefined}
//                     className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
//                       ${isDefault
//                         ? 'bg-[#8B1E3F]/10 border-[#8B1E3F]/30 text-[#8B1E3F] cursor-default'
//                         : isActive
//                         ? 'bg-[#8B1E3F] border-[#8B1E3F] text-white'
//                         : 'bg-white border-gray-300 text-gray-600 hover:border-[#8B1E3F]/40'
//                       }`}
//                   >
//                     {lang.native}
//                     {isDefault && (
//                       <span className="ml-1 text-[10px] opacity-70">default</span>
//                     )}
//                   </button>
//                 )
//               })}
//             </div>
//             {errors.supported_languages && (
//               <p className="mt-1 text-xs text-red-500">{errors.supported_languages}</p>
//             )}
//           </div>
//         </div>
//       </section>

//       <div className="border-t border-gray-100" />

//       {/* ── Section: Timezone ─────────────────────────────────────────── */}
//       <section>
//         <div className="mb-5">
//           <h3 className="text-base font-bold text-gray-900">Timezone</h3>
//           <p className="text-sm text-gray-500 mt-0.5">
//             Used for booking slots, scheduling, and all time displays across your platform.
//             <span className="text-amber-600 font-medium ml-1">
//               Changing this affects all future booking calculations.
//             </span>
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-2">
//               Tenant Timezone
//             </label>
//             <select
//               value={settings.timezone}
//               onChange={e => update('timezone', e.target.value)}
//               className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all
//                 focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F]
//                 ${errors.timezone ? 'border-red-400' : 'border-gray-300'}`}
//             >
//               {timezones.map(tz => (
//                 <option key={tz.value} value={tz.value}>
//                   {tz.label}
//                 </option>
//               ))}
//             </select>
//             {errors.timezone && (
//               <p className="mt-1 text-xs text-red-500">{errors.timezone}</p>
//             )}
//           </div>

//           {/* Current offset preview */}
//           {currentTz && (
//             <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 self-end">
//               <div className="w-9 h-9 rounded-full bg-[#8B1E3F]/10 flex items-center justify-center flex-shrink-0">
//                 <Globe className="w-4 h-4 text-[#8B1E3F]" />
//               </div>
//               <div>
//                 <p className="text-sm font-semibold text-gray-900">
//                   {currentTz.value.replace(/_/g, ' ')}
//                 </p>
//                 <p className="text-xs text-gray-500">{currentTz.offset}</p>
//               </div>
//             </div>
//           )}
//         </div>
//       </section>

//       <div className="border-t border-gray-100" />

//       {/* ── Section: Currency ─────────────────────────────────────────── */}
//       <section>
//         <div className="mb-5">
//           <h3 className="text-base font-bold text-gray-900">Currency</h3>
//           <p className="text-sm text-gray-500 mt-0.5">
//             Default currency for pricing, invoices, and payment processing.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label className="block text-sm font-bold text-gray-700 mb-2">
//               Default Currency
//             </label>
//             <select
//               value={settings.default_currency}
//               onChange={e => update('default_currency', e.target.value)}
//               className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all
//                 focus:ring-2 focus:ring-[#8B1E3F]/20 focus:border-[#8B1E3F]
//                 ${errors.default_currency ? 'border-red-400' : 'border-gray-300'}`}
//             >
//               {currencies.map(c => (
//                 <option key={c.code} value={c.code}>
//                   {c.symbol} {c.code} — {c.label}
//                 </option>
//               ))}
//             </select>
//             {errors.default_currency && (
//               <p className="mt-1 text-xs text-red-500">{errors.default_currency}</p>
//             )}
//           </div>

//           {/* Currency preview */}
//           {currentCurrency && (
//             <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 self-end">
//               <div className="w-9 h-9 rounded-full bg-[#8B1E3F]/10 flex items-center justify-center flex-shrink-0 text-[#8B1E3F] font-bold text-sm">
//                 {currentCurrency.symbol}
//               </div>
//               <div>
//                 <p className="text-sm font-semibold text-gray-900">{currentCurrency.label}</p>
//                 <p className="text-xs text-gray-500">{currentCurrency.code}</p>
//               </div>
//             </div>
//           )}
//         </div>
//       </section>

//       {/* ── Save bar ──────────────────────────────────────────────────── */}
//       <div className="flex items-center justify-between pt-6 border-t border-[#8B1E3F]/10">
//         <div>
//           {saveStatus === 'success' && (
//             <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
//               <Check className="w-4 h-4" /> Saved successfully
//             </span>
//           )}
//           {saveStatus === 'error' && (
//             <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
//               <AlertCircle className="w-4 h-4" /> Save failed — check errors above
//             </span>
//           )}
//         </div>

//         <div className="flex gap-3">
//           <button
//             type="button"
//             onClick={() => onChange(prev => ({ ...prev }))} // no-op cancel (could reset)
//             className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
//           >
//             Cancel
//           </button>
//           <button
//           type="button"
//           onClick={onSave}
//           disabled={saving || disabled}   // ← add disabled here
//           className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white
//             bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90
//             transition-all shadow-md disabled:opacity-50 font-medium"
//         >
//           {saving
//             ? <Loader2 className="w-4 h-4 animate-spin" />
//             : <Save className="w-4 h-4" />
//           }
//           Save Changes
//         </button>
//         </div>
//       </div>
//     </div>
//   )
// }


// // ─── Shared ─────────────────────────────────────────────────────

// function InputField({ label, value, onChange, type = 'text', icon: Icon, className = '' }) {
//   return (
//     <div className={className}>
//       <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
//       <div className="relative">
//         {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />}
//         <input
//           type={type}
//           value={value || ''}
//           onChange={(e) => onChange(e.target.value)}
//           className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all`}
//         />
//       </div>
//     </div>
//   )
// }