import React, { useState } from 'react';
import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Activity,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface LogsAuditProps {
  onNavigate: (page: string) => void;
}

export default function LogsAudit({ onNavigate }: LogsAuditProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('7days');

  const logTypes = [
    { id: 'all', name: 'All Logs', count: 2450, color: 'bg-gray-100 text-gray-700' },
    { id: 'authentication', name: 'Authentication', count: 580, color: 'bg-blue-100 text-blue-700' },
    { id: 'tenant_management', name: 'Tenant Management', count: 340, color: 'bg-purple-100 text-purple-700' },
    { id: 'billing', name: 'Billing', count: 220, color: 'bg-green-100 text-green-700' },
    { id: 'settings', name: 'Settings', count: 180, color: 'bg-orange-100 text-orange-700' },
    { id: 'security', name: 'Security', count: 95, color: 'bg-red-100 text-red-700' },
  ];

  const logs = [
    {
      id: 'LOG-001',
      timestamp: '2024-06-10 14:32:15',
      user: 'John Smith',
      userEmail: 'john@bookingpro.com',
      action: 'Tenant Created',
      type: 'tenant_management',
      details: 'Created new tenant: Elegant Spa (T-1045)',
      ipAddress: '192.168.1.100',
      severity: 'info',
      metadata: {
        tenantId: 'T-1045',
        tenantName: 'Elegant Spa',
      },
    },
    {
      id: 'LOG-002',
      timestamp: '2024-06-10 14:28:42',
      user: 'Sarah Johnson',
      userEmail: 'sarah@bookingpro.com',
      action: 'Login Success',
      type: 'authentication',
      details: 'Successful login from Chrome on Windows',
      ipAddress: '203.45.67.89',
      severity: 'success',
      metadata: {
        browser: 'Chrome 125',
        os: 'Windows 11',
      },
    },
    {
      id: 'LOG-003',
      timestamp: '2024-06-10 14:15:20',
      user: 'Mike Davis',
      userEmail: 'mike@bookingpro.com',
      action: 'Payment Processed',
      type: 'billing',
      details: 'Processed payment of $299 for tenant T-1033',
      ipAddress: '192.168.1.105',
      severity: 'success',
      metadata: {
        amount: 299,
        tenantId: 'T-1033',
        paymentMethod: 'Stripe',
      },
    },
    {
      id: 'LOG-004',
      timestamp: '2024-06-10 13:45:18',
      user: 'Emily Chen',
      userEmail: 'emily@bookingpro.com',
      action: 'Login Failed',
      type: 'authentication',
      details: 'Failed login attempt - Invalid password',
      ipAddress: '198.51.100.23',
      severity: 'warning',
      metadata: {
        attempts: 3,
        reason: 'Invalid password',
      },
    },
    {
      id: 'LOG-005',
      timestamp: '2024-06-10 13:30:55',
      user: 'John Smith',
      userEmail: 'john@bookingpro.com',
      action: 'Settings Updated',
      type: 'settings',
      details: 'Updated platform settings - Email notifications enabled',
      ipAddress: '192.168.1.100',
      severity: 'info',
      metadata: {
        setting: 'email_notifications',
        value: true,
      },
    },
    {
      id: 'LOG-006',
      timestamp: '2024-06-10 12:20:30',
      user: 'System',
      userEmail: 'system@bookingpro.com',
      action: 'Security Alert',
      type: 'security',
      details: 'Multiple failed login attempts detected from IP 198.51.100.23',
      ipAddress: '198.51.100.23',
      severity: 'error',
      metadata: {
        attempts: 5,
        blocked: true,
      },
    },
    {
      id: 'LOG-007',
      timestamp: '2024-06-10 11:45:12',
      user: 'Sarah Johnson',
      userEmail: 'sarah@bookingpro.com',
      action: 'Tenant Suspended',
      type: 'tenant_management',
      details: 'Suspended tenant: ABC Services (T-1020) - Payment overdue',
      ipAddress: '203.45.67.89',
      severity: 'warning',
      metadata: {
        tenantId: 'T-1020',
        reason: 'Payment overdue',
      },
    },
    {
      id: 'LOG-008',
      timestamp: '2024-06-10 11:15:45',
      user: 'Mike Davis',
      userEmail: 'mike@bookingpro.com',
      action: 'Refund Issued',
      type: 'billing',
      details: 'Issued refund of $149 to tenant T-1015',
      ipAddress: '192.168.1.105',
      severity: 'info',
      metadata: {
        amount: 149,
        tenantId: 'T-1015',
        reason: 'Duplicate payment',
      },
    },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles = {
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
      warning: 'bg-orange-100 text-orange-700',
      info: 'bg-blue-100 text-blue-700',
    };
    return styles[severity as keyof typeof styles] || styles.info;
  };

  return (
    <SuperAdminLayout currentPage="super-admin-logs" onNavigate={onNavigate}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Logs & Audit Trail</h1>
          <p className="text-gray-600">Track all system activities and changes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
          <Button className="bg-maroon hover:bg-maroon-hover rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6 border-gray-200 rounded-xl">
          <div className="w-12 h-12 rounded-xl gradient-maroon flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="text-3xl text-gray-900 mb-1">2,450</div>
          <div className="text-sm text-gray-600">Total Logs</div>
        </Card>

        <Card className="p-6 border-gray-200 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="text-3xl text-gray-900 mb-1">156</div>
          <div className="text-sm text-gray-600">Today's Activities</div>
        </Card>

        <Card className="p-6 border-gray-200 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="text-3xl text-gray-900 mb-1">12</div>
          <div className="text-sm text-gray-600">Warnings</div>
        </Card>

        <Card className="p-6 border-gray-200 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center mb-4">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div className="text-3xl text-gray-900 mb-1">3</div>
          <div className="text-sm text-gray-600">Errors</div>
        </Card>
      </div>

      {/* Log Types */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          {logTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 rounded-xl transition-all ${
                selectedType === type.id
                  ? 'bg-[#800020] text-white'
                  : 'bg-white border border-gray-200 hover:border-[#800020]'
              }`}
            >
              {type.name} ({type.count})
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
          />
        </div>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
        >
          <option value="all">All Users</option>
          <option value="john">John Smith</option>
          <option value="sarah">Sarah Johnson</option>
          <option value="mike">Mike Davis</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
        >
          <option value="today">Today</option>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
          <option value="custom">Custom range</option>
        </select>
        <Button variant="outline" className="rounded-xl">
          <Calendar className="w-4 h-4 mr-2" />
          Select Date Range
        </Button>
      </div>

      {/* Logs Table */}
      <Card className="border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Severity</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Timestamp</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">User</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Action</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Type</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">IP Address</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{getSeverityIcon(log.severity)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900">{log.user}</div>
                      <div className="text-xs text-gray-500">{log.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{log.action}</div>
                    <div className="text-xs text-gray-600">{log.details}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={`${
                        logTypes.find((t) => t.id === log.type)?.color
                      } border-0`}
                    >
                      {logTypes.find((t) => t.id === log.type)?.name}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.ipAddress}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="p-2 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </SuperAdminLayout>
  );
}
