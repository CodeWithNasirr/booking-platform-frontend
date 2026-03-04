import React, { useState } from 'react';
import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
import {
  Key,
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
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

interface IntegrationsPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function IntegrationsPage({ onNavigate }: IntegrationsPageProps) {
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFieldChange = (integrationId: string, fieldKey: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [`${integrationId}-${fieldKey}`]: value }));
  };

  const getFieldValue = (integrationId: string, fieldKey: string, defaultValue: string) => {
    const key = `${integrationId}-${fieldKey}`;
    return fieldValues[key] !== undefined ? fieldValues[key] : defaultValue;
  };

  const maskKey = (key: string, show: boolean) => {
    if (show) return key;
    return '•'.repeat(32);
  };

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
  };

  const breadcrumbs = [{ label: 'Integrations' }];

  const renderIntegrationCard = (integration: any) => {
    const Icon = integration.icon;
    const isActive = integration.status === 'active';

    return (
      <Card key={integration.id} className="p-6 border-gray-200 rounded-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg text-gray-900">{integration.name}</h3>
              <p className="text-sm text-gray-600">{integration.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={`${
                isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              } border-0`}
            >
              {isActive ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Inactive
                </>
              )}
            </Badge>
            <Switch checked={isActive} />
          </div>
        </div>

        <div className="space-y-4">
          {integration.fields.map((field: any) => (
            <div key={field.key}>
              <Label htmlFor={field.key} className="text-sm text-gray-700 mb-2 block">
                {field.label}
              </Label>
              <div className="relative">
                <Input
                  id={field.key}
                  type={showKeys[`${integration.id}-${field.key}`] ? 'text' : 'password'}
                  value={getFieldValue(integration.id, field.key, field.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="pr-10 rounded-lg"
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
          <Button variant="outline" className="flex-1 rounded-xl">
            Test Connection
          </Button>
          <Button className="flex-1 bg-[#3A7BFF] hover:bg-[#2D63D9] rounded-xl">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <SuperAdminLayout
      currentPage="super-admin-integrations"
      onNavigate={onNavigate}
      title="Global Integrations"
      description="Manage API keys and third-party integrations"
      breadcrumbs={breadcrumbs}
    >
      {/* Warning Banner */}
      <Card className="p-4 mb-6 border-orange-200 bg-orange-50 rounded-xl">
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
      </Card>

      <Tabs defaultValue="payment" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl">
          <TabsTrigger value="payment" className="rounded-lg">Payment Gateways</TabsTrigger>
          <TabsTrigger value="maps" className="rounded-lg">Maps & Location</TabsTrigger>
          <TabsTrigger value="email" className="rounded-lg">Email Services</TabsTrigger>
          <TabsTrigger value="sms" className="rounded-lg">SMS & Messaging</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="payment" className="space-y-6">
          <div>
            <h3 className="text-xl text-gray-900 mb-2">Payment Gateways</h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure payment processing for all tenants
            </p>
          </div>
          {integrations.payment.map(renderIntegrationCard)}
        </TabsContent>

        <TabsContent value="maps" className="space-y-6">
          <div>
            <h3 className="text-xl text-gray-900 mb-2">Maps & Location Services</h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure mapping and geolocation services
            </p>
          </div>
          {integrations.maps.map(renderIntegrationCard)}
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <div>
            <h3 className="text-xl text-gray-900 mb-2">Email Services</h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure transactional email providers
            </p>
          </div>
          {integrations.email.map(renderIntegrationCard)}
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          <div>
            <h3 className="text-xl text-gray-900 mb-2">SMS & Messaging</h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure SMS and messaging services
            </p>
          </div>
          {integrations.sms.map(renderIntegrationCard)}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div>
            <h3 className="text-xl text-gray-900 mb-2">Security Services</h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure security and anti-spam services
            </p>
          </div>
          {integrations.security.map(renderIntegrationCard)}
        </TabsContent>
      </Tabs>

      {/* Documentation Link */}
      <Card className="p-6 border-gray-200 rounded-xl mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg text-gray-900 mb-1">Need help?</h3>
            <p className="text-sm text-gray-600">
              Check out our integration documentation for setup guides
            </p>
          </div>
          <Button variant="outline" className="rounded-xl">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Documentation
          </Button>
        </div>
      </Card>
    </SuperAdminLayout>
  );
}