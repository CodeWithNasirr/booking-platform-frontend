// app/superadmin/integrations/page.js
'use client'

import { useState } from 'react'
import {
  CreditCard,
  Mail,
  MessageSquare,
  Map,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout"

export default function IntegrationsPage() {
  const [showKeys, setShowKeys] = useState({})
  const [fieldValues, setFieldValues] = useState({})
  const [activeTab, setActiveTab] = useState('payment')

  const toggleKeyVisibility = (key) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleFieldChange = (integrationId, fieldKey, value) => {
    setFieldValues((prev) => ({ ...prev, [`${integrationId}-${fieldKey}`]: value }))
  }

  const getFieldValue = (integrationId, fieldKey, defaultValue) => {
    const key = `${integrationId}-${fieldKey}`
    return fieldValues[key] !== undefined ? fieldValues[key] : defaultValue
  }

  const integrations = {
    payment: [
      {
        id: 'stripe',
        name: 'Stripe',
        icon: CreditCard,
        color: 'from-purple-500 to-indigo-500',
        status: 'active',
        description: 'Accept payments with Stripe',
        fields: [
          { key: 'publishable_key', label: 'Publishable Key', value: 'pk_live_51JxK...' },
          { key: 'secret_key', label: 'Secret Key', value: 'sk_live_51JxK...' },
          { key: 'webhook_secret', label: 'Webhook Secret', value: 'whsec_...' },
        ],
      },
      {
        id: 'hyperpay',
        name: 'HyperPay',
        icon: CreditCard,
        color: 'from-green-500 to-emerald-500',
        status: 'active',
        description: 'MADA, Visa, Mastercard, Apple Pay (Saudi Arabia)',
        fields: [
          { key: 'entity_id', label: 'Entity ID', value: '' },
          { key: 'access_token', label: 'Access Token', value: '' },
          { key: 'mada_entity_id', label: 'MADA Entity ID', value: '' },
        ],
      },
      {
        id: 'moyasar',
        name: 'Moyasar',
        icon: CreditCard,
        color: 'from-sky-500 to-cyan-500',
        status: 'active',
        description: 'Mada, Visa, Mastercard, Apple Pay, STC Pay (Saudi Arabia)',
        fields: [
          { key: 'publishable_key', label: 'Publishable Key', value: 'pk_live_...' },
          { key: 'secret_key', label: 'Secret Key', value: 'sk_live_...' },
          { key: 'webhook_secret', label: 'Webhook Secret (secret_token)', value: '' },
        ],
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: CreditCard,
        color: 'from-blue-500 to-blue-600',
        status: 'inactive',
        description: 'Accept payments with PayPal',
        fields: [
          { key: 'client_id', label: 'Client ID', value: '' },
          { key: 'client_secret', label: 'Client Secret', value: '' },
        ],
      },
    ],
    maps: [
      {
        id: 'google-maps',
        name: 'Google Maps',
        icon: Map,
        color: 'from-red-500 to-orange-500',
        status: 'active',
        description: 'Location and mapping services',
        fields: [
          { key: 'api_key', label: 'API Key', value: 'AIzaSyB...' },
        ],
      },
      {
        id: 'mapbox',
        name: 'Mapbox',
        icon: Map,
        color: 'from-blue-500 to-cyan-500',
        status: 'inactive',
        description: 'Alternative mapping service',
        fields: [
          { key: 'access_token', label: 'Access Token', value: '' },
        ],
      },
    ],
    email: [
      {
        id: 'sendgrid',
        name: 'SendGrid',
        icon: Mail,
        color: 'from-blue-500 to-blue-600',
        status: 'active',
        description: 'Transactional email service',
        fields: [
          { key: 'api_key', label: 'API Key', value: 'SG.abc...' },
          { key: 'from_email', label: 'From Email', value: 'noreply@bookingpro.com' },
          { key: 'from_name', label: 'From Name', value: 'BookingPro' },
        ],
      },
      {
        id: 'mailgun',
        name: 'Mailgun',
        icon: Mail,
        color: 'from-red-500 to-pink-500',
        status: 'inactive',
        description: 'Email delivery service',
        fields: [
          { key: 'api_key', label: 'API Key', value: '' },
          { key: 'domain', label: 'Domain', value: '' },
        ],
      },
    ],
    sms: [
      {
        id: 'twilio',
        name: 'Twilio',
        icon: MessageSquare,
        color: 'from-red-500 to-red-600',
        status: 'active',
        description: 'SMS and messaging service',
        fields: [
          { key: 'account_sid', label: 'Account SID', value: 'AC...' },
          { key: 'auth_token', label: 'Auth Token', value: '...' },
          { key: 'phone_number', label: 'Phone Number', value: '+1234567890' },
        ],
      },
    ],
    security: [
      {
        id: 'recaptcha',
        name: 'Google reCAPTCHA',
        icon: Shield,
        color: 'from-green-500 to-emerald-500',
        status: 'active',
        description: 'Protect against spam and abuse',
        fields: [
          { key: 'site_key', label: 'Site Key', value: '6Lc...' },
          { key: 'secret_key', label: 'Secret Key', value: '6Lc...' },
        ],
      },
    ],
  }

  const breadcrumbs = [{ label: 'Integrations' }]

  const tabs = [
    { id: 'payment', label: 'Payment Gateways' },
    // { id: 'maps', label: 'Maps & Location' },
    { id: 'email', label: 'Email Services' },
    { id: 'sms', label: 'SMS & Messaging' },
    { id: 'security', label: 'Security' },
  ]

  const renderIntegrationCard = (integration) => {
    const Icon = integration.icon
    const isActive = integration.status === 'active'

    return (
      <div key={integration.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
              <p className="text-sm text-gray-600">{integration.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isActive
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {isActive ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Inactive
                </>
              )}
            </span>
            {/* Toggle Switch */}
            <button
              onClick={() => {}}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {integration.fields.map((field) => (
            <div key={field.key}>
              <label htmlFor={field.key} className="text-sm font-medium text-gray-700 mb-2 block">
                {field.label}
              </label>
              <div className="relative">
                <input
                  id={field.key}
                  type={showKeys[`${integration.id}-${field.key}`] ? 'text' : 'password'}
                  value={getFieldValue(integration.id, field.key, field.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  onChange={(e) => handleFieldChange(integration.id, field.key, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility(`${integration.id}-${field.key}`)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys[`${integration.id}-${field.key}`] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex gap-2">
          <button className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Test Connection
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <SuperAdminLayout
      title="Global Integrations"
      description="Manage API keys and third-party integrations"
      breadcrumbs={breadcrumbs}
    >
      {/* Warning Banner */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-orange-900 mb-1">
              These integrations are shared across all tenants. Changes here will affect the entire platform.
            </p>
            <p className="text-xs text-orange-700">
              Make sure to test thoroughly before saving any changes.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 p-1 rounded-xl inline-flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Gateways</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure payment processing for all tenants
              </p>
            </div>
            <div className="space-y-4">
              {integrations.payment.map(renderIntegrationCard)}
            </div>
          </div>
        )}

        {/* {activeTab === 'maps' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Maps & Location Services</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure mapping and geolocation services
              </p>
            </div>
            <div className="space-y-4">
              {integrations.maps.map(renderIntegrationCard)}
            </div>
          </div>
        )} */}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Services</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure transactional email providers
              </p>
            </div>
            <div className="space-y-4">
              {integrations.email.map(renderIntegrationCard)}
            </div>
          </div>
        )}

        {activeTab === 'sms' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">SMS & Messaging</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure SMS and messaging services
              </p>
            </div>
            <div className="space-y-4">
              {integrations.sms.map(renderIntegrationCard)}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Security Services</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure security and anti-spam services
              </p>
            </div>
            <div className="space-y-4">
              {integrations.security.map(renderIntegrationCard)}
            </div>
          </div>
        )}
      </div>

      {/* Documentation Link */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Need help?</h3>
            <p className="text-sm text-gray-600">
              Check out our integration documentation for setup guides
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <ExternalLink className="w-4 h-4" />
            View Documentation
          </button>
        </div>
      </div>
    </SuperAdminLayout>
  )
}