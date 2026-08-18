'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import {
  BarChart3,
  TrendingUp,
  Users,
  MousePointer,
  Save,
  RefreshCw,
  Check,
  ExternalLink,
  AlertCircle,
  Facebook,
  Instagram,
  Smartphone,
  Globe,
  Zap,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";

const integrationsData = [
  {
    id: 'meta-pixel',
    name: 'Meta Pixel (Facebook)',
    description: 'Track conversions, optimize ads, and build targeted audiences',
    icon: Facebook,
    color: 'from-blue-600 to-blue-700',
    connected: false,
    status: 'Not Connected',
    stats: { events: 0, conversions: 0, reach: 0 },
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Understand your customers and optimize your marketing',
    icon: BarChart3,
    color: 'from-orange-500 to-orange-600',
    connected: false,
    status: 'Not Connected',
    stats: { visitors: 0, sessions: 0, bounceRate: '0%' },
  },
  {
    id: 'google-tag-manager',
    name: 'Google Tag Manager',
    description: 'Manage all your website tags without editing code',
    icon: MousePointer,
    color: 'from-blue-500 to-blue-600',
    connected: false,
    status: 'Not Connected',
    stats: { tags: 0, triggers: 0, variables: 0 },
  },
  {
    id: 'tiktok-pixel',
    name: 'TikTok Pixel',
    description: 'Measure and optimize your TikTok ad campaigns',
    icon: Smartphone,
    color: 'from-black to-gray-800',
    connected: false,
    status: 'Not Connected',
    stats: { events: 0, conversions: 0 },
  },
  {
    id: 'instagram-insights',
    name: 'Instagram Insights',
    description: 'Track your Instagram business profile performance',
    icon: Instagram,
    color: 'from-pink-500 to-purple-600',
    connected: false,
    status: 'Not Connected',
    stats: { followers: 0, reach: 0, engagement: '0%' },
  },
]

function MarketingIntegrationsPageInner() {
  const { user, loadingUser, requiresOnboarding } = useApp()
  const router = useRouter()

  const [metaPixelId, setMetaPixelId] = useState('')
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('')
  const [googleTagManagerId, setGoogleTagManagerId] = useState('')
  const [tiktokPixelId, setTiktokPixelId] = useState('')
  const [integrations, setIntegrations] = useState(integrationsData)
  const [savingId, setSavingId] = useState(null)

  // Block back navigation
  useBlockBackNavigation(!!user)

  // Auth guard
  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace('/')
    }
  }, [loadingUser, user, router])

  // Onboarding redirect
  useEffect(() => {
    if (requiresOnboarding) {
      router.replace('/auth/onboarding?step=1')
    }
  }, [requiresOnboarding, router])

  if (requiresOnboarding || loadingUser) {
    return null
  }

  const handleConnect = (id) => {
    setSavingId(id)
    // Simulate API call
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === id ? { ...int, connected: true, status: 'Connected' } : int
        )
      )
      setSavingId(null)
    }, 1000)
  }

  const connectedCount = integrations.filter((i) => i.connected).length

  const getInputValue = (id) => {
    switch (id) {
      case 'meta-pixel':
        return metaPixelId
      case 'google-analytics':
        return googleAnalyticsId
      case 'google-tag-manager':
        return googleTagManagerId
      case 'tiktok-pixel':
        return tiktokPixelId
      default:
        return ''
    }
  }

  const setInputValue = (id, value) => {
    switch (id) {
      case 'meta-pixel':
        setMetaPixelId(value)
        break
      case 'google-analytics':
        setGoogleAnalyticsId(value)
        break
      case 'google-tag-manager':
        setGoogleTagManagerId(value)
        break
      case 'tiktok-pixel':
        setTiktokPixelId(value)
        break
      default:
        break
    }
  }

  return (
    <div className="space-y-6 p-6 bg-[#FAF5F7] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Integrations</h1>
          <p className="text-gray-600 mt-1">
            Connect marketing tools to track performance and optimize campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-[#8B1E3F]/10 border border-[#8B1E3F]/20">
            <span className="text-sm font-bold text-[#8B1E3F]">
              {connectedCount} Connected
            </span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
          <div className="text-sm text-gray-600 font-medium">Total Visitors</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <span>Connect analytics to track</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <MousePointer className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
          <div className="text-sm text-gray-600 font-medium">Conversions</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <span>Connect pixels to track</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
          <div className="text-sm text-gray-600 font-medium">Active Campaigns</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <span>Start tracking today</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{connectedCount}</div>
          <div className="text-sm text-gray-600 font-medium">Connected</div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
            <span>{integrations.length - connectedCount} available</span>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta Pixel */}
        <div className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md">
              <Facebook className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Meta Pixel (Facebook)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Track conversions, optimize ads, and build targeted audiences
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    integrations.find((i) => i.id === 'meta-pixel')?.connected
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {integrations.find((i) => i.id === 'meta-pixel')?.connected
                    ? 'Connected'
                    : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pixel ID
              </label>
              <input
                type="text"
                value={metaPixelId}
                onChange={(e) => setMetaPixelId(e.target.value)}
                placeholder="Enter your Meta Pixel ID"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Find your Pixel ID in Meta Events Manager
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleConnect('meta-pixel')}
                disabled={!metaPixelId || savingId === 'meta-pixel'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {savingId === 'meta-pixel' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Connect Pixel
              </button>
              <button className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Tracked Events</h4>
              <div className="grid grid-cols-2 gap-2">
                {['PageView', 'ViewContent', 'AddToCart', 'Purchase'].map((event) => (
                  <div key={event} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B1E3F]" />
                    <span>{event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Google Analytics */}
        <div className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Google Analytics</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Understand your customers and optimize your marketing
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    integrations.find((i) => i.id === 'google-analytics')?.connected
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {integrations.find((i) => i.id === 'google-analytics')?.connected
                    ? 'Connected'
                    : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Measurement ID
              </label>
              <input
                type="text"
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Find your Measurement ID in Google Analytics Admin
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleConnect('google-analytics')}
                disabled={!googleAnalyticsId || savingId === 'google-analytics'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {savingId === 'google-analytics' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Connect Analytics
              </button>
              <button className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Features</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Real-time analytics', 'Audience insights', 'Conversion tracking', 'Custom reports'].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B1E3F]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Google Tag Manager */}
        <div className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <MousePointer className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Google Tag Manager</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage all your website tags without editing code
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    integrations.find((i) => i.id === 'google-tag-manager')?.connected
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {integrations.find((i) => i.id === 'google-tag-manager')?.connected
                    ? 'Connected'
                    : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Container ID
              </label>
              <input
                type="text"
                value={googleTagManagerId}
                onChange={(e) => setGoogleTagManagerId(e.target.value)}
                placeholder="GTM-XXXXXXX"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Find your Container ID in Google Tag Manager
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleConnect('google-tag-manager')}
                disabled={!googleTagManagerId || savingId === 'google-tag-manager'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {savingId === 'google-tag-manager' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Connect GTM
              </button>
              <button className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-900 mb-1">Pro Tip</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Use GTM to manage all your marketing tags in one place, including Meta Pixel and Google Analytics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TikTok Pixel */}
        <div className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-black to-gray-800 flex items-center justify-center flex-shrink-0 shadow-md">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">TikTok Pixel</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Measure and optimize your TikTok ad campaigns
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    integrations.find((i) => i.id === 'tiktok-pixel')?.connected
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {integrations.find((i) => i.id === 'tiktok-pixel')?.connected
                    ? 'Connected'
                    : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pixel ID
              </label>
              <input
                type="text"
                value={tiktokPixelId}
                onChange={(e) => setTiktokPixelId(e.target.value)}
                placeholder="Enter your TikTok Pixel ID"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Find your Pixel ID in TikTok Ads Manager
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleConnect('tiktok-pixel')}
                disabled={!tiktokPixelId || savingId === 'tiktok-pixel'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {savingId === 'tiktok-pixel' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Connect Pixel
              </button>
              <button className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Tracked Events</h4>
              <div className="grid grid-cols-2 gap-2">
                {['ViewContent', 'AddToCart', 'CompletePayment'].map((event) => (
                  <div key={event} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B1E3F]" />
                    <span>{event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-[#8B1E3F]/5 to-white border border-[#8B1E3F]/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center flex-shrink-0 shadow-md">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Need Help Setting Up?</h3>
            <p className="text-gray-600 mb-4">
              Check our detailed integration guides or contact our support team for assistance
            </p>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-white hover:border-[#8B1E3F]/30 transition-all">
                View Documentation
              </button>
              <button className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketingIntegrationsPage(props) {
  return (
    <TenantPermissionGate permission="integrations.view">
      <MarketingIntegrationsPageInner {...props} />
    </TenantPermissionGate>
  );
}
