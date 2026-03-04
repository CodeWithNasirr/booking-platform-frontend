'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import {
  X,
  Check,
  Settings,
  ExternalLink,
  Calendar,
  CreditCard,
  Mail,
  MessageSquare,
  BarChart3,
  Zap,
  Globe,
  Lock,
  Video,
  FileText,
  DollarSign,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'

const integrationsData = [
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'payment',
    description: 'Accept payments online with Stripe. Process credit cards, debit cards, and digital wallets.',
    icon: CreditCard,
    color: 'from-purple-500 to-purple-600',
    connected: true,
    popular: true,
    features: ['Payment processing', 'Subscription billing', 'Invoice management', 'Refunds'],
    settings: {
      apiKey: 'sk_test_*********************',
      webhookUrl: 'https://yourapp.com/webhooks/stripe',
    },
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'payment',
    description: 'Enable customers to pay with PayPal. Support for PayPal balance, credit/debit cards.',
    icon: DollarSign,
    color: 'from-blue-500 to-blue-600',
    connected: false,
    features: ['Payment processing', 'PayPal checkout', 'Refunds', 'Recurring payments'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'calendar',
    description: 'Sync bookings with Google Calendar. Automatic calendar updates for staff and customers.',
    icon: Calendar,
    color: 'from-red-500 to-red-600',
    connected: true,
    popular: true,
    features: ['Two-way sync', 'Automatic updates', 'Multiple calendars', 'Email notifications'],
    settings: {
      syncEnabled: true,
      calendarId: 'primary',
    },
  },
  {
    id: 'outlook-calendar',
    name: 'Outlook Calendar',
    category: 'calendar',
    description: 'Integrate with Microsoft Outlook Calendar. Keep your schedule synchronized.',
    icon: Calendar,
    color: 'from-blue-600 to-blue-700',
    connected: false,
    features: ['Calendar sync', 'Email integration', 'Team calendars', 'Notifications'],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'communication',
    description: 'Send SMS notifications and reminders. Reduce no-shows with automated messages.',
    icon: MessageSquare,
    color: 'from-red-500 to-red-600',
    connected: true,
    features: ['SMS notifications', 'Booking reminders', 'Two-way messaging', 'Phone verification'],
    settings: {
      accountSid: 'AC*********************',
      phoneNumber: '+1234567890',
    },
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    category: 'communication',
    description: 'Email marketing and transactional emails. Send beautiful emails to your customers.',
    icon: Mail,
    color: 'from-blue-500 to-blue-600',
    connected: false,
    popular: true,
    features: ['Email templates', 'Automated emails', 'Analytics', 'Contact management'],
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    category: 'communication',
    description: 'Email marketing platform. Build and grow your customer relationships.',
    icon: Mail,
    color: 'from-yellow-500 to-yellow-600',
    connected: false,
    features: ['Email campaigns', 'Automation', 'Customer segmentation', 'Analytics'],
  },
  {
    id: 'zoom',
    name: 'Zoom',
    category: 'communication',
    description: 'Virtual appointments via Zoom. Offer remote services to your customers.',
    icon: Video,
    color: 'from-blue-500 to-blue-600',
    connected: false,
    features: ['Video meetings', 'Screen sharing', 'Recording', 'Waiting room'],
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'analytics',
    description: 'Track website traffic and user behavior. Make data-driven decisions.',
    icon: BarChart3,
    color: 'from-orange-500 to-orange-600',
    connected: true,
    features: ['Traffic analytics', 'User behavior', 'Conversion tracking', 'Custom reports'],
    settings: {
      trackingId: 'UA-***********',
    },
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'productivity',
    description: 'Connect with 3000+ apps. Automate workflows and save time.',
    icon: Zap,
    color: 'from-orange-500 to-orange-600',
    connected: false,
    popular: true,
    features: ['Workflow automation', '3000+ integrations', 'Custom triggers', 'Multi-step zaps'],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'communication',
    description: 'Team communication and notifications. Get instant updates in Slack.',
    icon: MessageSquare,
    color: 'from-purple-500 to-purple-600',
    connected: false,
    features: ['Real-time notifications', 'Team collaboration', 'Custom alerts', 'File sharing'],
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'payment',
    description: 'Accounting and bookkeeping. Sync transactions and manage finances.',
    icon: FileText,
    color: 'from-green-500 to-green-600',
    connected: false,
    features: ['Invoice sync', 'Expense tracking', 'Financial reports', 'Tax preparation'],
  },
]

const categories = [
  { key: 'all', label: 'All Integrations', icon: Globe },
  { key: 'payment', label: 'Payment', icon: CreditCard },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'communication', label: 'Communication', icon: MessageSquare },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'productivity', label: 'Productivity', icon: Zap },
]

export default function TenantIntegrationsPage() {
  const { user, loadingUser, requiresOnboarding } = useApp()
  const router = useRouter()
  
  const [integrations, setIntegrations] = useState(integrationsData)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)

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

  const filteredIntegrations =
    selectedCategory === 'all'
      ? integrations
      : integrations.filter((int) => int.category === selectedCategory)

  const connectedCount = integrations.filter((int) => int.connected).length

  const handleToggleConnection = (integration) => {
    if (integration.connected) {
      // Disconnect
      setIntegrations(
        integrations.map((int) =>
          int.id === integration.id ? { ...int, connected: false } : int
        )
      )
    } else {
      // Connect
      setSelectedIntegration(integration)
      setShowSettingsModal(true)
    }
  }

  const handleConnect = () => {
    if (selectedIntegration) {
      setIntegrations(
        integrations.map((int) =>
          int.id === selectedIntegration.id ? { ...int, connected: true } : int
        )
      )
      setShowSettingsModal(false)
      setSelectedIntegration(null)
    }
  }

  const handleOpenSettings = (integration) => {
    setSelectedIntegration(integration)
    setShowSettingsModal(true)
  }

  return (
    <div className="space-y-6 p-6 bg-[#FAF5F7] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">
            Connect your favorite tools and automate your workflow
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

      {/* Category Tabs */}
      <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  selectedCategory === category.key
                    ? 'bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#8B1E3F]/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => {
          const Icon = integration.icon
          return (
            <div
              key={integration.id}
              className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all relative group"
            >
              {integration.popular && (
                <div className="absolute top-4 right-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                    Popular
                  </span>
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {integration.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      integration.connected
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {integration.connected ? (
                      <>
                        <Check className="w-3 h-3" />
                        Connected
                      </>
                    ) : (
                      'Not Connected'
                    )}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {integration.description}
              </p>

              {/* Features */}
              <div className="mb-4">
                <div className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  Key Features
                </div>
                <div className="space-y-2">
                  {integration.features.slice(0, 3).map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8B1E3F]" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {integration.connected ? (
                  <>
                    <button
                      onClick={() => handleOpenSettings(integration)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 transition-all text-sm"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => handleToggleConnection(integration)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-all text-sm"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleToggleConnection(integration)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md hover:shadow-lg font-medium text-sm"
                  >
                    <Zap className="w-4 h-4" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Settings Modal */}
      {showSettingsModal && selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#8B1E3F]/20 backdrop-blur-sm"
            onClick={() => {
              setShowSettingsModal(false)
              setSelectedIntegration(null)
            }}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#8B1E3F]/10 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedIntegration.color} flex items-center justify-center shadow-md`}
                >
                  {(() => {
                    const Icon = selectedIntegration.icon
                    return <Icon className="w-6 h-6 text-white" />
                  })()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedIntegration.connected ? 'Settings' : 'Connect'} -{' '}
                    {selectedIntegration.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {selectedIntegration.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSettingsModal(false)
                  setSelectedIntegration(null)
                }}
                className="p-2 hover:bg-[#8B1E3F]/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Features List */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedIntegration.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#8B1E3F]/5 border border-[#8B1E3F]/10"
                    >
                      <Check className="w-5 h-5 text-[#8B1E3F] flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Configuration */}
              {!selectedIntegration.connected && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Configuration
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your API key"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      You can find this in your {selectedIntegration.name} dashboard
                    </p>
                  </div>

                  {selectedIntegration.category === 'payment' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook URL
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value="https://yourapp.com/webhooks/integration"
                          readOnly
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 font-mono text-sm"
                        />
                        <button className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm">
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-[#8B1E3F]/5 border border-[#8B1E3F]/20">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#8B1E3F]/10 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-[#8B1E3F]" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-1">
                          Secure Connection
                        </div>
                        <div className="text-xs text-gray-600 leading-relaxed">
                          Your credentials are encrypted and stored securely. We never share your data with third parties.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedIntegration.connected && selectedIntegration.settings && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Current Settings
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(selectedIntegration.settings).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200"
                      >
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm text-gray-900 font-mono bg-white px-3 py-1 rounded-lg border border-gray-200">
                          {value?.toString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentation Link */}
              <div className="pt-4 border-t border-[#8B1E3F]/10">
                <a
                  href="#"
                  className="flex items-center gap-2 text-sm text-[#8B1E3F] hover:text-[#6B1630] font-medium transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Integration Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#8B1E3F]/10 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowSettingsModal(false)
                  setSelectedIntegration(null)
                }}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              {selectedIntegration.connected ? (
                <button
                  onClick={() => {
                    setShowSettingsModal(false)
                    setSelectedIntegration(null)
                  }}
                  className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium"
                >
                  Save Changes
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Connect Integration
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}