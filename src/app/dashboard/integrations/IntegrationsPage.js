// src/app/dashboard/integrations/IntegrationsPage.js  (FULL REPLACEMENT)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import {
  fetchIntegrations,
  connectIntegration,
  disconnectIntegration,
  getGoogleCalendarOAuthUrl,
  startWhatsAppSession,
  getWhatsAppStatus,
  getWhatsAppQR,
  disconnectWhatsApp,
} from './lib/integrationsApi'
import {
  Calendar, Video, MessageCircle, BarChart3, MousePointer,
  Smartphone, Zap, Globe, Check, X, Settings, Loader2,
  ExternalLink, AlertCircle, RefreshCw, Save, QrCode,
  Phone, Unplug, ChevronDown, ChevronRight, Copy, Info,
  Shield, Clock, Wifi, WifiOff, ArrowRight, CheckCircle2,
  Circle, Link2,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
import { useTenantPermission } from "@/lib/useTenantPermission"
import PaymentGatewaySection from './PaymentGatewaySection'


// ── Icon map ────────────────────────────────────────────────────
const ICON_MAP = {
  Calendar, Video, MessageCircle, BarChart3, MousePointer,
  Smartphone, Facebook: Globe, Globe,
}

const CATEGORIES = [
  { key: 'all', label: 'All Integrations', icon: Globe },
  { key: 'calendar', label: 'Calendar & Meetings', icon: Calendar },
  { key: 'communication', label: 'Communication', icon: MessageCircle },
  { key: 'marketing', label: 'Marketing & Analytics', icon: BarChart3 },
]

export default function IntegrationsPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [activeModal, setActiveModal] = useState(null)

  const { allowed: canView } = useTenantPermission("integrations.view")
  const { allowed: canManage } = useTenantPermission("integrations.manage")

  useBlockBackNavigation(!!user)

  useEffect(() => {
    if (!loadingUser && !user) router.replace('/')
  }, [loadingUser, user, router])

  useEffect(() => {
    if (requiresOnboarding) router.replace('/auth/onboarding?step=1')
  }, [requiresOnboarding, router])

  useEffect(() => {
    if (searchParams.get('google') === 'connected') loadIntegrations()
  }, [searchParams])

  const loadIntegrations = useCallback(async () => {
    if (!activeTenant) return
    try {
      setLoading(true)
      const data = await fetchIntegrations(activeTenant)
      setIntegrations(data)
    } catch (err) {
      console.error('Failed to load integrations:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTenant])

  useEffect(() => { loadIntegrations() }, [loadIntegrations])

  if (requiresOnboarding || loadingUser) return null

  const filtered = category === 'all'
    ? integrations
    : integrations.filter((i) => i.category === category)

  const connectedCount = integrations.filter((i) => i.status === 'connected').length
  const totalCount = integrations.length

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">Connect your tools and automate your business</p>
        </div>
      </div>

      {/* ═══ PAYMENT GATEWAYS (top priority) ═══ */}
      <PaymentGatewaySection activeTenant={activeTenant} />

      {/* ═══ STATUS BAR ═══ */}
      <div className="bg-white rounded-2xl border border-[#8B1E3F]/10 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-700">Connection Status</span>
          <span className="text-sm text-gray-500">{connectedCount} of {totalCount} connected</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8B1E3F] to-[#E85D75] rounded-full transition-all duration-500"
            style={{ width: totalCount ? `${(connectedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">{connectedCount} Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-600">{totalCount - connectedCount} Available</span>
          </div>
        </div>
      </div>

      {/* ═══ CATEGORY TABS ═══ */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const count = cat.key === 'all'
            ? integrations.length
            : integrations.filter((i) => i.category === cat.key).length
          return (
            <button key={cat.key} onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border ${
                category === cat.key
                  ? 'bg-[#8B1E3F] text-white border-[#8B1E3F] shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5'
              }`}>
              <Icon className="w-4 h-4" />
              {cat.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                category === cat.key ? 'bg-white/20' : 'bg-gray-100'
              }`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ═══ INTEGRATION CARDS ═══ */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onAction={(type) => setActiveModal({ type, integration })}
            />
          ))}
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      {activeModal?.type === 'google_calendar' && (
        <GoogleCalendarModal activeTenant={activeTenant} onClose={() => setActiveModal(null)} onRefresh={loadIntegrations} />
      )}
      {activeModal?.type === 'whatsapp_web' && (
        <WhatsAppModal activeTenant={activeTenant} onClose={() => setActiveModal(null)} onRefresh={loadIntegrations} />
      )}
      {activeModal?.type === 'pixel_config' && (
        <PixelConfigModal activeTenant={activeTenant} integration={activeModal.integration} onClose={() => setActiveModal(null)} onRefresh={loadIntegrations} />
      )}
      {activeModal?.type === 'disconnect' && (
        <DisconnectModal activeTenant={activeTenant} integration={activeModal.integration} onClose={() => setActiveModal(null)} onRefresh={loadIntegrations} />
      )}
      {activeModal?.type === 'setup_guide' && (
        <SetupGuideModal integration={activeModal.integration} onClose={() => setActiveModal(null)} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Integration Card
// ═══════════════════════════════════════════════════════════════

function IntegrationCard({ integration, onAction }) {
  const Icon = ICON_MAP[integration.icon] || Globe
  const isConnected = integration.status === 'connected'
  const isPending = integration.status === 'pending' || integration.status === 'qr_ready'

  const { allowed: canView } = useTenantPermission("integrations.view")
  const { allowed: canManage } = useTenantPermission("integrations.manage")

  const handleConnect = () => {
    if (integration.connect_type === 'oauth') onAction(integration.id)
    else if (integration.connect_type === 'qr_code') onAction(integration.id)
    else if (integration.connect_type === 'pixel_id') onAction('pixel_config')
    else if (integration.connect_type === 'api_key') onAction('pixel_config')
  }

  return (
    <div className={`rounded-2xl bg-white border transition-all hover:shadow-lg group ${
      isConnected ? 'border-green-200' : 'border-gray-200 hover:border-[#8B1E3F]/30'
    }`}>
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold text-gray-900">{integration.name}</h3>
              <StatusDot status={integration.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{integration.description}</p>
          </div>
        </div>
      </div>

      {/* Connected info */}
      {isConnected && (
        <div className="mx-5 mt-3 px-3 py-2 rounded-lg bg-green-50/80 border border-green-100">
          {integration.config?.phone && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Phone className="w-3.5 h-3.5" /> {integration.config.phone}
            </div>
          )}
          {integration.config?.connected_providers?.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {integration.config.connected_providers.length} provider{integration.config.connected_providers.length > 1 ? 's' : ''} synced
            </div>
          )}
          {integration.config?.pixel_id && (
            <div className="flex items-center gap-2 text-sm text-green-700 font-mono text-xs">
              <Shield className="w-3.5 h-3.5" /> {integration.config.pixel_id}
            </div>
          )}
          {integration.config?.measurement_id && (
            <div className="flex items-center gap-2 text-sm text-green-700 font-mono text-xs">
              <Shield className="w-3.5 h-3.5" /> {integration.config.measurement_id}
            </div>
          )}
          {integration.config?.container_id && (
            <div className="flex items-center gap-2 text-sm text-green-700 font-mono text-xs">
              <Shield className="w-3.5 h-3.5" /> {integration.config.container_id}
            </div>
          )}
          {integration.connected_at && (
            <p className="text-[10px] text-green-600 mt-1">
              Connected {new Date(integration.connected_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Features */}
      <div className="px-5 pt-3 pb-2">
        <div className="flex flex-wrap gap-1.5">
          {integration.features?.slice(0, 3).map((f, i) => (
            <span key={i} className="px-2 py-0.5 text-[11px] font-medium text-gray-600 bg-gray-50 rounded-md border border-gray-100">
              {f}
            </span>
          ))}
          {integration.features?.length > 3 && (
            <span className="px-2 py-0.5 text-[11px] font-medium text-gray-400 bg-gray-50 rounded-md">
              +{integration.features.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {canManage && (
      <div className="p-5 pt-3">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <button onClick={() => onAction(integration.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all text-sm">
                <Settings className="w-4 h-4" /> Manage
              </button>
              <button onClick={() => onAction('disconnect')}
                className="px-3 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all">
                <Unplug className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={handleConnect}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-sm font-medium text-sm">
                <Zap className="w-4 h-4" /> Connect
              </button>
              <button onClick={() => onAction('setup_guide')}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
                title="Setup Guide">
                <Info className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
        )}
    </div>
  )
}

function StatusDot({ status }) {
  const cfg = {
    connected:    { color: 'bg-green-500',  ring: 'ring-green-200',  label: 'Connected' },
    pending:      { color: 'bg-amber-400',  ring: 'ring-amber-200',  label: 'Pending' },
    qr_ready:     { color: 'bg-blue-400',   ring: 'ring-blue-200',   label: 'Awaiting Scan' },
    error:        { color: 'bg-red-500',     ring: 'ring-red-200',    label: 'Error' },
    disconnected: { color: 'bg-gray-300',    ring: 'ring-gray-100',   label: 'Not Connected' },
  }[status] || { color: 'bg-gray-300', ring: 'ring-gray-100', label: status }

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0" title={cfg.label}>
      <div className={`w-2 h-2 rounded-full ${cfg.color} ring-2 ${cfg.ring}`} />
      <span className="text-[11px] font-medium text-gray-500">{cfg.label}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// Setup Guide Modal
// ═══════════════════════════════════════════════════════════════

const SETUP_GUIDES = {
  google_calendar: {
    title: 'Google Calendar Setup',
    steps: [
      { title: 'Select a Provider', desc: 'Choose which team member to connect their Google Calendar.' },
      { title: 'Authorize with Google', desc: 'You\'ll be redirected to Google to grant calendar access.' },
      { title: 'Auto Sync', desc: 'New bookings will automatically create Google Calendar events with Meet links.' },
    ],
    requirements: ['Google account', 'At least one provider in your team'],
    docs: 'https://support.google.com/calendar',
  },
  zoom: {
    title: 'Zoom Setup',
    steps: [
      { title: 'Get API Credentials', desc: 'Go to marketplace.zoom.us → Build App → Server-to-Server OAuth.' },
      { title: 'Enter Account ID', desc: 'Copy your Account ID, Client ID, and Client Secret.' },
      { title: 'Enable for Services', desc: 'Mark services as "online" to auto-create Zoom meetings on booking.' },
    ],
    requirements: ['Zoom Pro or higher account', 'Zoom Marketplace developer access'],
    docs: 'https://marketplace.zoom.us',
  },
  whatsapp_web: {
    title: 'WhatsApp Web Setup',
    steps: [
      { title: 'Click Connect', desc: 'We\'ll generate a QR code for you to scan.' },
      { title: 'Open WhatsApp', desc: 'On your phone: Settings → Linked Devices → Link a Device.' },
      { title: 'Scan the QR', desc: 'Point your phone camera at the QR code. Connection takes 5-10 seconds.' },
      { title: 'Done!', desc: 'Booking confirmations and reminders will be sent via your WhatsApp number.' },
    ],
    requirements: ['WhatsApp installed on your phone', 'Active internet on phone'],
    docs: 'https://faq.whatsapp.com/web',
  },
  meta_pixel: {
    title: 'Meta Pixel Setup',
    steps: [
      { title: 'Get Pixel ID', desc: 'Go to Meta Events Manager → Data Sources → Select your Pixel.' },
      { title: 'Copy the Pixel ID', desc: 'It\'s a numeric ID like 123456789012345.' },
      { title: 'Paste & Connect', desc: 'Enter your Pixel ID here. We\'ll inject the tracking code on your tenant site.' },
    ],
    requirements: ['Meta Business account', 'Facebook Pixel created'],
    docs: 'https://business.facebook.com/events_manager',
    tracked_events: ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'],
  },
  google_analytics: {
    title: 'Google Analytics Setup',
    steps: [
      { title: 'Get Measurement ID', desc: 'Go to analytics.google.com → Admin → Data Streams → Web.' },
      { title: 'Copy Measurement ID', desc: 'It looks like G-XXXXXXXXXX.' },
      { title: 'Paste & Connect', desc: 'We\'ll add the GA4 tracking script to your tenant site automatically.' },
    ],
    requirements: ['Google Analytics 4 account'],
    docs: 'https://analytics.google.com',
    tracked_events: ['page_view', 'purchase', 'begin_checkout', 'view_item'],
  },
  google_tag_manager: {
    title: 'Google Tag Manager Setup',
    steps: [
      { title: 'Get Container ID', desc: 'Go to tagmanager.google.com → select your container.' },
      { title: 'Copy Container ID', desc: 'It looks like GTM-XXXXXXX (top of page).' },
      { title: 'Paste & Connect', desc: 'GTM will load on your tenant site. Manage all tags from GTM dashboard.' },
    ],
    requirements: ['Google Tag Manager account'],
    docs: 'https://tagmanager.google.com',
  },
  tiktok_pixel: {
    title: 'TikTok Pixel Setup',
    steps: [
      { title: 'Get Pixel ID', desc: 'Go to TikTok Ads Manager → Assets → Events → Manage (Web Events).' },
      { title: 'Copy Pixel ID', desc: 'Select your pixel and copy the Pixel ID.' },
      { title: 'Paste & Connect', desc: 'TikTok tracking code will be injected on your tenant site.' },
    ],
    requirements: ['TikTok Ads Manager account', 'TikTok Pixel created'],
    docs: 'https://ads.tiktok.com',
    tracked_events: ['ViewContent', 'AddToCart', 'CompletePayment'],
  },
}

function SetupGuideModal({ integration, onClose }) {
  const guide = SETUP_GUIDES[integration.id]
  if (!guide) {
    return (
      <Modal title="Setup Guide" onClose={onClose}>
        <p className="text-sm text-gray-600 py-8 text-center">No setup guide available for this integration yet.</p>
      </Modal>
    )
  }

  return (
    <Modal title={guide.title} subtitle="Follow these steps to connect" onClose={onClose}>
      <div className="space-y-5">
        {/* Steps */}
        <div className="space-y-0">
          {guide.steps.map((step, i) => (
            <div key={i} className="flex gap-4 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#8B1E3F] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                {i < guide.steps.length - 1 && <div className="w-0.5 flex-1 bg-[#8B1E3F]/20 mt-1" />}
              </div>
              <div className="pb-2">
                <p className="text-sm font-bold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Requirements */}
        {guide.requirements?.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Requirements</p>
            <ul className="space-y-1">
              {guide.requirements.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-amber-700">
                  <Circle className="w-1.5 h-1.5 fill-current flex-shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tracked Events */}
        {guide.tracked_events?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Auto-Tracked Events</p>
            <div className="flex flex-wrap gap-1.5">
              {guide.tracked_events.map((e, i) => (
                <span key={i} className="px-2.5 py-1 text-xs font-medium bg-[#8B1E3F]/5 text-[#8B1E3F] rounded-lg border border-[#8B1E3F]/10">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Docs link */}
        {guide.docs && (
          <a href={guide.docs} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#8B1E3F] hover:text-[#6B1630] font-medium pt-2">
            <ExternalLink className="w-4 h-4" /> View Official Documentation
          </a>
        )}
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════
// Google Calendar Modal
// ═══════════════════════════════════════════════════════════════

function GoogleCalendarModal({ activeTenant, onClose, onRefresh }) {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getGoogleCalendarOAuthUrl(activeTenant)
        setProviders(data.providers || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [activeTenant])

  const handleConnect = async (providerId) => {
    try {
      const data = await getGoogleCalendarOAuthUrl(activeTenant, providerId, 'tenant')
      if (data.oauth_url) window.location.href = data.oauth_url
    } catch (err) { alert(err.message) }
  }

  const handleDisconnect = async (providerId) => {
    try {
      await disconnectIntegration(activeTenant, 'google_calendar', { provider_id: providerId })
      onRefresh()
      const data = await getGoogleCalendarOAuthUrl(activeTenant)
      setProviders(data.providers || [])
    } catch (err) { alert(err.message) }
  }

  return (
    <Modal title="Google Calendar" subtitle="Connect providers to sync calendars & auto-create Meet links" onClose={onClose}>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" /></div>
      ) : providers.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-1 font-medium">No providers found</p>
          <p className="text-xs text-gray-500">Add team members as providers first, then connect their calendars.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">Each provider connects their own Google account. Bookings assigned to them will sync automatically.</p>
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                  {p.name?.[0] || 'P'}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{p.name || 'Provider'}</p>
                  <p className="text-xs text-gray-500">{p.email}</p>
                </div>
              </div>
              {p.google_connected ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    <Check className="w-3 h-3" /> Synced
                  </span>
                  <button onClick={() => handleDisconnect(p.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Unplug className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => handleConnect(p.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-sm text-sm font-medium">
                  <Link2 className="w-3.5 h-3.5" /> Connect
                </button>
              )}
            </div>
          ))}

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 mt-4">
            <p className="text-xs text-blue-700">
              <strong>How it works:</strong> When a customer books a service assigned to a connected provider, we auto-create a Google Calendar event with a Google Meet link attached.
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════
// WhatsApp QR Modal
// ═══════════════════════════════════════════════════════════════

function WhatsAppModal({ activeTenant, onClose, onRefresh }) {
  const [phase, setPhase] = useState('loading')
  const [qrCode, setQrCode] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState(null)

  const startSession = async () => {
    setPhase('loading')
    setError(null)
    try {
      const data = await startWhatsAppSession(activeTenant)
      if (data.status === 'already_connected') {
        setPhase('authenticated')
        setPhone(data.phone)
      } else {
        setPhase('qr')
        setQrCode(data.qr_code)
      }
    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  useEffect(() => {
    if (phase !== 'qr') return
    const interval = setInterval(async () => {
      try {
        const data = await getWhatsAppStatus(activeTenant)
        if (data.status === 'authenticated') {
          setPhase('authenticated')
          setPhone(data.phone)
          clearInterval(interval)
          onRefresh()
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [phase, activeTenant, onRefresh])

  useEffect(() => {
    if (phase !== 'qr') return
    const interval = setInterval(async () => {
      try {
        const data = await getWhatsAppQR(activeTenant)
        if (data.qr_code) setQrCode(data.qr_code)
      } catch { /* ignore */ }
    }, 15000)
    return () => clearInterval(interval)
  }, [phase, activeTenant])

  useEffect(() => { startSession() }, [])

  const handleDisconnect = async () => {
    try {
      await disconnectWhatsApp(activeTenant)
      setPhase('disconnected')
      onRefresh()
      onClose()
    } catch (err) { alert(err.message) }
  }

  return (
    <Modal title="WhatsApp Web" subtitle="Send booking notifications via WhatsApp" onClose={onClose}>
      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-3" />
          <p className="text-sm text-gray-600">Starting session...</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button onClick={startSession} className="px-4 py-2 rounded-xl bg-[#8B1E3F] text-white text-sm font-medium hover:opacity-90">Retry</button>
        </div>
      )}

      {phase === 'qr' && (
        <div className="text-center py-2">
          <div className="inline-block p-1 bg-white border-2 border-green-200 rounded-2xl shadow-lg mb-4">
            {qrCode ? (
              <img src={`data:image/png;base64,${qrCode}`} alt="QR" className="w-56 h-56 rounded-xl" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center bg-gray-50 rounded-xl">
                <QrCode className="w-12 h-12 text-gray-300" />
              </div>
            )}
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Scan with WhatsApp</p>
          <p className="text-xs text-gray-500 mb-3">Open WhatsApp → Linked Devices → Link a Device</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
            <RefreshCw className="w-3 h-3 animate-spin text-green-600" />
            <span className="text-xs text-green-700 font-medium">Waiting for scan...</span>
          </div>
        </div>
      )}

      {phase === 'authenticated' && (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">Connected!</p>
          {phone && <p className="text-sm text-gray-600 mb-4 font-mono">{phone}</p>}
          <p className="text-xs text-gray-500 mb-6">Booking confirmations and reminders will be sent via WhatsApp.</p>
          <button onClick={handleDisconnect}
            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
            Disconnect WhatsApp
          </button>
        </div>
      )}
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════
// Pixel / API Key Config Modal
// ═══════════════════════════════════════════════════════════════

function PixelConfigModal({ activeTenant, integration, onClose, onRefresh }) {
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const initial = {}
    integration.config_fields?.forEach((f) => {
      initial[f.key] = integration.config?.[f.key] || ''
    })
    setValues(initial)
  }, [integration])

  const guide = SETUP_GUIDES[integration.id]

  const handleSave = async () => {
    setSaving(true)
    try {
      await connectIntegration(activeTenant, integration.id, values)
      onRefresh()
      onClose()
    } catch (err) { alert(err.message) }
    finally { setSaving(false) }
  }

  const allFilled = integration.config_fields?.every((f) => values[f.key]?.trim())

  return (
    <Modal title={integration.name} subtitle="Enter your credentials to connect" onClose={onClose}>
      <div className="space-y-5">
        {integration.config_fields?.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
            <input type="text" value={values[field.key] || ''}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm font-mono" />
          </div>
        ))}

        {guide && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Where to find this</p>
            <p className="text-sm text-gray-600">{guide.steps[0]?.desc}</p>
            {guide.docs && (
              <a href={guide.docs} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#8B1E3F] font-medium mt-2 hover:text-[#6B1630]">
                <ExternalLink className="w-3 h-3" /> Open {integration.name}
              </a>
            )}
          </div>
        )}

        {guide?.tracked_events && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Events we'll track</p>
            <div className="flex flex-wrap gap-1.5">
              {guide.tracked_events.map((e, i) => (
                <span key={i} className="px-2 py-0.5 text-xs font-medium bg-[#8B1E3F]/5 text-[#8B1E3F] rounded-md">{e}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving || !allFilled}
            className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md font-medium text-sm flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Connect
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════
// Disconnect Modal
// ═══════════════════════════════════════════════════════════════

function DisconnectModal({ activeTenant, integration, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false)

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      await disconnectIntegration(activeTenant, integration.id)
      onRefresh()
      onClose()
    } catch (err) { alert(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal title="Disconnect Integration" onClose={onClose}>
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Unplug className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-gray-900 font-bold mb-1">Disconnect {integration.name}?</p>
        <p className="text-sm text-gray-600 mb-6">Data sync will stop. You can reconnect anytime.</p>
        <div className="flex justify-center gap-3">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm">Cancel</button>
          <button onClick={handleDisconnect} disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 text-sm flex items-center gap-2 disabled:opacity-50">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Disconnect
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════════
// Modal Shell
// ═══════════════════════════════════════════════════════════════

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}