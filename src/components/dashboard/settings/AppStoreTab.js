// src/components/dashboard/settings/AppStoreTab.js
'use client'

import { useState } from 'react'
import {
  X, Check, Zap, Settings, ExternalLink, QrCode,
  MessageSquare, Calendar, CreditCard, Video, Mail,
  Globe, Smartphone, AlertCircle, Loader2, Key,
} from 'lucide-react'

// ─── Integration definitions ────────────────────────────────────

const INTEGRATIONS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Send notifications and chat with customers via WhatsApp Business',
    icon: MessageSquare,
    color: 'from-green-500 to-green-600',
    category: 'communication',
    popular: true,
    features: ['Customer notifications', 'Booking reminders', 'Order updates', 'Two-way chat'],
    hasModal: true,
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync bookings and appointments with Google Calendar',
    icon: Calendar,
    color: 'from-red-500 to-red-600',
    category: 'calendar',
    popular: true,
    features: ['Two-way sync', 'Auto-create events', 'Provider calendars'],
  },
  {
    id: 'stripe',
    name: 'Payment Gateway',
    description: 'Accept online payments via Stripe Connect',
    icon: CreditCard,
    color: 'from-purple-500 to-purple-600',
    category: 'payment',
    popular: true,
    features: ['Credit cards', 'Digital wallets', 'Automatic payouts'],
  },
  {
    id: 'zoom',
    name: 'Zoom Meetings',
    description: 'Create virtual meetings for online bookings automatically',
    icon: Video,
    color: 'from-blue-500 to-blue-600',
    category: 'communication',
    features: ['Auto-create links', 'Meeting recordings', 'Waiting rooms'],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and customer segmentation',
    icon: Mail,
    color: 'from-amber-500 to-amber-600',
    category: 'marketing',
    features: ['Email campaigns', 'Automation', 'Audience sync'],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 5000+ apps and automate workflows',
    icon: Zap,
    color: 'from-orange-500 to-orange-600',
    category: 'automation',
    features: ['Custom triggers', 'Multi-step zaps', '5000+ apps'],
  },
]

// ─── Main Component ─────────────────────────────────────────────

export default function AppStoreTab({ integrations, onUpdate }) {
  const [whatsappModal, setWhatsappModal] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)

  const isConnected = (appId) => {
    return integrations?.[appId]?.connected === true
  }

  const handleConnect = (app) => {
    if (app.id === 'whatsapp') {
      setWhatsappModal(true)
      return
    }
    // For other integrations, toggle connected state (placeholder)
    onUpdate({
      [app.id]: {
        ...(integrations?.[app.id] || {}),
        connected: true,
      },
    })
  }

  const handleDisconnect = (appId) => {
    onUpdate({
      [appId]: {
        ...(integrations?.[appId] || {}),
        connected: false,
        config: {},
      },
    })
  }

  const connectedCount = INTEGRATIONS.filter((a) => isConnected(a.id)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">App Store</h3>
          <p className="text-sm text-gray-600">
            Connect tools to enhance your business workflow
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-[#8B1E3F]/10 border border-[#8B1E3F]/20">
          <span className="text-sm font-bold text-[#8B1E3F]">
            {connectedCount} Connected
          </span>
        </div>
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {INTEGRATIONS.map((app) => {
          const Icon = app.icon
          const connected = isConnected(app.id)

          return (
            <div
              key={app.id}
              className="relative p-5 rounded-xl bg-white border border-gray-200 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all group"
            >
              {app.popular && (
                <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  Popular
                </span>
              )}

              {/* Icon + name */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{app.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      connected
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {connected ? '● Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{app.description}</p>

              {/* Features */}
              <div className="space-y-1 mb-4">
                {app.features.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-1 h-1 rounded-full bg-[#8B1E3F]" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Action */}
              {connected ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedApp(app)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Manage
                  </button>
                  <button
                    onClick={() => handleDisconnect(app.id)}
                    className="px-3 py-2 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(app)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-sm text-xs font-medium"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Activate
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* WhatsApp connection modal */}
      {whatsappModal && (
        <WhatsAppModal
          current={integrations?.whatsapp || {}}
          onClose={() => setWhatsappModal(false)}
          onSave={(config) => {
            onUpdate({ whatsapp: config })
            setWhatsappModal(false)
          }}
        />
      )}
    </div>
  )
}

// ─── WhatsApp Connection Modal ──────────────────────────────────

function WhatsAppModal({ current, onClose, onSave }) {
  const [mode, setMode] = useState(current.type || null) // 'web' | 'api'
  const [apiForm, setApiForm] = useState({
    access_token: current.config?.access_token || '',
    phone_number_id: current.config?.phone_number_id || '',
    waba_id: current.config?.waba_id || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSaveApi = () => {
    if (!apiForm.access_token || !apiForm.phone_number_id || !apiForm.waba_id) return
    setSaving(true)
    setTimeout(() => {
      onSave({
        type: 'api',
        connected: true,
        config: { ...apiForm },
      })
      setSaving(false)
    }, 500)
  }

  const handleConnectWeb = () => {
    setSaving(true)
    setTimeout(() => {
      onSave({
        type: 'web',
        connected: true,
        config: {},
      })
      setSaving(false)
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connect WhatsApp</h2>
              <p className="text-sm text-gray-500">Choose a connection method</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Method selection */}
          {!mode && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('web')}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <QrCode className="w-6 h-6 text-green-600" />
                  <span className="font-bold text-gray-900">WhatsApp Web (QR Code)</span>
                </div>
                <p className="text-sm text-gray-500">
                  Scan QR code with your phone to connect. Simple and quick setup.
                </p>
              </button>

              <button
                onClick={() => setMode('api')}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Key className="w-6 h-6 text-green-600" />
                  <span className="font-bold text-gray-900">WhatsApp Business API</span>
                </div>
                <p className="text-sm text-gray-500">
                  Connect via official Cloud API. Requires a Meta Business account.
                </p>
              </button>
            </div>
          )}

          {/* QR Code mode */}
          {mode === 'web' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode(null)}
                className="text-sm text-gray-500 hover:text-[#8B1E3F] transition-colors"
              >
                ← Back to options
              </button>

              <div className="flex flex-col items-center py-8">
                {/* QR placeholder */}
                <div className="w-48 h-48 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
                  <div className="text-center">
                    <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">QR Code will appear here</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 text-center max-w-xs">
                  Open WhatsApp on your phone → Linked Devices → Link a Device → Scan this QR code
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    WhatsApp Web requires your phone to stay connected. For production use, the Business API is recommended.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* API mode */}
          {mode === 'api' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode(null)}
                className="text-sm text-gray-500 hover:text-[#8B1E3F] transition-colors"
              >
                ← Back to options
              </button>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Access Token *
                </label>
                <input
                  type="password"
                  value={apiForm.access_token}
                  onChange={(e) => setApiForm((p) => ({ ...p, access_token: e.target.value }))}
                  placeholder="EAAxxxxxxxx..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Phone Number ID *
                </label>
                <input
                  type="text"
                  value={apiForm.phone_number_id}
                  onChange={(e) => setApiForm((p) => ({ ...p, phone_number_id: e.target.value }))}
                  placeholder="1234567890"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  WABA ID *
                </label>
                <input
                  type="text"
                  value={apiForm.waba_id}
                  onChange={(e) => setApiForm((p) => ({ ...p, waba_id: e.target.value }))}
                  placeholder="1234567890"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find these in your Meta Business Suite → WhatsApp → API Setup
                </p>
              </div>

              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700">
                    The Cloud API supports automated messaging, templates, and is suitable for production.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          {mode === 'web' && (
            <button
              onClick={handleConnectWeb}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-green-500 to-green-600 hover:opacity-90 transition-all shadow-md font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Connect via QR
            </button>
          )}
          {mode === 'api' && (
            <button
              onClick={handleSaveApi}
              disabled={saving || !apiForm.access_token || !apiForm.phone_number_id || !apiForm.waba_id}
              className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Connect API
            </button>
          )}
        </div>
      </div>
    </div>
  )
}