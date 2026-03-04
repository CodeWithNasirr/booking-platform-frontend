import React, { useState } from 'react';
import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

interface AuditLogsProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function AuditLogs({ onNavigate }: AuditLogsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Total Events', value: '12,450', icon: Activity },
    { label: 'Today', value: '234', icon: Calendar },
    { label: 'Security Events', value: '18', icon: Shield },
    { label: 'Failed Logins', value: '12', icon: AlertTriangle },
  ];

  const activityLogs = [
    {
      id: 'LOG-1001',
      timestamp: '2024-06-22 14:30:25',
      event: 'User Login',
      user: 'admin@bookingpro.com',
      tenant: 'Platform Admin',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome 125.0.0.0',
      status: 'success',
      severity: 'info',
      details: 'Successful login from new device',
    },
    {
      id: 'LOG-1002',
      timestamp: '2024-06-22 14:15:10',
      event: 'Tenant Created',
      user: 'system@bookingpro.com',
      tenant: 'Elegant Spa',
      ipAddress: '192.168.1.50',
      userAgent: 'API',
      status: 'success',
      severity: 'info',
      details: 'New tenant created: T-1001',
    },
    {
      id: 'LOG-1003',
      timestamp: '2024-06-22 14:00:45',
      event: 'Plan Updated',
      user: 'admin@bookingpro.com',
      tenant: 'Home Services Pro',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome 125.0.0.0',
      status: 'success',
      severity: 'warning',
      details: 'Plan changed from Starter to Professional',
    },
    {
      id: 'LOG-1004',
      timestamp: '2024-06-22 13:45:30',
      event: 'Failed Login Attempt',
      user: 'unknown@example.com',
      tenant: 'Platform Admin',
      ipAddress: '45.67.89.12',
      userAgent: 'Unknown',
      status: 'failed',
      severity: 'warning',
      details: 'Invalid credentials',
    },
    {
      id: 'LOG-1005',
      timestamp: '2024-06-22 13:30:15',
      event: 'Integration Updated',
      user: 'admin@bookingpro.com',
      tenant: 'Platform Admin',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome 125.0.0.0',
      status: 'success',
      severity: 'info',
      details: 'Stripe API keys updated',
    },
    {
      id: 'LOG-1006',
      timestamp: '2024-06-22 13:15:00',
      event: 'Tenant Suspended',
      user: 'admin@bookingpro.com',
      tenant: 'Pet Grooming Plus',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome 125.0.0.0',
      status: 'success',
      severity: 'critical',
      details: 'Suspended due to payment failure',
    },
    {
      id: 'LOG-1007',
      timestamp: '2024-06-22 13:00:45',
      event: 'Template Published',
      user: 'admin@bookingpro.com',
      tenant: 'Platform Admin',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome 125.0.0.0',
      status: 'success',
      severity: 'info',
      details: 'New template: Modern Spa v2.0',
    },
  ];

  const securityEvents = [
    {
      id: 'SEC-1001',
      timestamp: '2024-06-22 14:00:00',
      event: 'Multiple Failed Login Attempts',
      source: '45.67.89.12',
      target: 'admin@bookingpro.com',
      severity: 'high',
      status: 'blocked',
      action: 'IP temporarily blocked',
    },
    {
      id: 'SEC-1002',
      timestamp: '2024-06-22 12:30:00',
      event: 'Suspicious API Activity',
      source: '123.45.67.89',
      target: 'API Endpoint',
      severity: 'medium',
      status: 'monitoring',
      action: 'Rate limit applied',
    },
    {
      id: 'SEC-1003',
      timestamp: '2024-06-22 10:15:00',
      event: 'Unusual Access Pattern',
      source: '98.76.54.32',
      target: 'T-1001',
      severity: 'low',
      status: 'resolved',
      action: 'Verified as legitimate',
    },
  ];

  const tenantAudits = [
    {
      id: 'AUD-1001',
      timestamp: '2024-06-22 14:30:00',
      tenant: 'Elegant Spa',
      tenantId: 'T-1001',
      action: 'Service Created',
      user: 'sarah@elegantspa.com',
      details: 'Created new service: Deep Tissue Massage',
    },
    {
      id: 'AUD-1002',
      timestamp: '2024-06-22 14:00:00',
      tenant: 'Home Services Pro',
      tenantId: 'T-1002',
      action: 'Booking Cancelled',
      user: 'mike@homeservices.com',
      details: 'Cancelled booking #BK-4567',
    },
    {
      id: 'AUD-1003',
      timestamp: '2024-06-22 13:30:00',
      tenant: 'Wellness Studio',
      tenantId: 'T-1003',
      action: 'Provider Added',
      user: 'emma@wellnessstudio.com',
      details: 'Added provider: John Doe',
    },
  ];

  const getSeverityBadge = (severity: string) => {
    const styles = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      warning: 'bg-yellow-100 text-yellow-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-blue-100 text-blue-700',
      info: 'bg-blue-100 text-blue-700',
    };
    return styles[severity as keyof typeof styles] || styles.info;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      blocked: 'bg-red-100 text-red-700',
      monitoring: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
    };
    return styles[status as keyof typeof styles] || styles.success;
  };

  const breadcrumbs = [{ label: 'Logs & Audit' }];

  return (
    <SuperAdminLayout
      currentPage="super-admin-logs"
      onNavigate={onNavigate}
      title="Logs & Audit"
      description="Monitor system activity and security events"
      breadcrumbs={breadcrumbs}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 border-gray-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl">
            <TabsTrigger value="activity" className="rounded-lg">Activity Logs</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg">Security Events</TabsTrigger>
            <TabsTrigger value="tenant" className="rounded-lg">Tenant Audit</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
            <Button variant="outline" className="rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="space-y-6">
          {/* Filters */}
          <Card className="p-6 border-gray-200 rounded-xl">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search logs by event, user, or tenant..."
                  className="pl-10 h-11 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select defaultValue="all">
                <SelectTrigger className="w-full lg:w-48 h-11 rounded-xl">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all">
                <SelectTrigger className="w-full lg:w-48 h-11 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Logs Table */}
          <Card className="border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Timestamp</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Event</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">User</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Tenant</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Severity</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Status</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{log.timestamp}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{log.event}</div>
                          <div className="text-xs text-gray-500">{log.details}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.user}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.tenant}</td>
                      <td className="px-6 py-4">
                        <Badge className={`${getSeverityBadge(log.severity)} border-0 capitalize`}>
                          {log.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getStatusBadge(log.status)} border-0 capitalize`}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-4 border-red-200 bg-red-50 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-900 mb-1">
                  Security monitoring is active. All suspicious activities are logged and alerted.
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Timestamp</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Event</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Source</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Target</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Severity</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Status</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Action Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {securityEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{event.timestamp}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{event.event}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{event.source}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{event.target}</td>
                      <td className="px-6 py-4">
                        <Badge className={`${getSeverityBadge(event.severity)} border-0 capitalize`}>
                          {event.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getStatusBadge(event.status)} border-0 capitalize`}>
                          {event.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{event.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tenant Audit Tab */}
        <TabsContent value="tenant" className="space-y-6">
          <Card className="p-6 border-gray-200 rounded-xl">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by tenant or action..."
                  className="pl-10 h-11 rounded-xl"
                />
              </div>

              <Select defaultValue="all">
                <SelectTrigger className="w-full lg:w-56 h-11 rounded-xl">
                  <SelectValue placeholder="Select Tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  <SelectItem value="t-1001">Elegant Spa</SelectItem>
                  <SelectItem value="t-1002">Home Services Pro</SelectItem>
                  <SelectItem value="t-1003">Wellness Studio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Timestamp</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Tenant</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Action</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">User</th>
                    <th className="px-6 py-3 text-start text-sm text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tenantAudits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">{audit.timestamp}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">{audit.tenant}</div>
                          <div className="text-xs text-gray-500">{audit.tenantId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{audit.action}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{audit.user}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{audit.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing 1-10 of 1,245 logs</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="rounded-lg">
            Previous
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg">
            Next
          </Button>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
