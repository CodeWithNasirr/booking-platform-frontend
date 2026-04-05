import React, { useState } from 'react';
import SuperAdminLayout from '../../components/super-admin/SuperAdminLayout';
import {
  Search,
  Filter,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  MoreVertical,
  Eye,
  Mail,
  TrendingUp,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

interface SupportTicketsProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function SupportTickets({ onNavigate }: SupportTicketsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Open Tickets', value: '23', icon: MessageSquare, color: 'from-blue-500 to-blue-600', change: '+5' },
    { label: 'In Progress', value: '12', icon: Clock, color: 'from-yellow-500 to-orange-500', change: '+3' },
    { label: 'Resolved Today', value: '18', icon: CheckCircle, color: 'from-green-500 to-green-600', change: '+12' },
    { label: 'Avg Response Time', value: '2.4h', icon: TrendingUp, color: 'from-purple-500 to-purple-600', change: '-0.5h' },
  ];

  const tickets = [
    {
      id: 'TKT-1001',
      subject: 'Payment gateway not working',
      tenant: 'Elegant Spa',
      tenantId: 'T-1001',
      user: 'Sarah Johnson',
      userEmail: 'sarah@elegantspa.com',
      priority: 'high',
      status: 'open',
      category: 'Technical',
      created: '2024-06-22 10:30 AM',
      lastUpdate: '2 hours ago',
      assignedTo: null,
      messages: 3,
    },
    {
      id: 'TKT-1002',
      subject: 'How to customize email templates?',
      tenant: 'Home Services Pro',
      tenantId: 'T-1002',
      user: 'Mike Davis',
      userEmail: 'mike@homeservices.com',
      priority: 'low',
      status: 'in-progress',
      category: 'Question',
      created: '2024-06-22 09:15 AM',
      lastUpdate: '1 hour ago',
      assignedTo: 'Support Agent 1',
      messages: 5,
    },
    {
      id: 'TKT-1003',
      subject: 'Booking calendar sync issues',
      tenant: 'Wellness Studio',
      tenantId: 'T-1003',
      user: 'Emma Wilson',
      userEmail: 'emma@wellnessstudio.com',
      priority: 'medium',
      status: 'open',
      category: 'Bug',
      created: '2024-06-22 08:45 AM',
      lastUpdate: '3 hours ago',
      assignedTo: 'Support Agent 2',
      messages: 2,
    },
    {
      id: 'TKT-1004',
      subject: 'Request for plan upgrade',
      tenant: 'Auto Care Center',
      tenantId: 'T-1004',
      user: 'John Smith',
      userEmail: 'john@autocare.com',
      priority: 'medium',
      status: 'in-progress',
      category: 'Billing',
      created: '2024-06-21 04:30 PM',
      lastUpdate: '5 hours ago',
      assignedTo: 'Support Agent 1',
      messages: 4,
    },
    {
      id: 'TKT-1005',
      subject: 'Cannot export customer data',
      tenant: 'Beauty Salon',
      tenantId: 'T-1005',
      user: 'Lisa Chen',
      userEmail: 'lisa@beautysalon.com',
      priority: 'high',
      status: 'open',
      category: 'Feature Request',
      created: '2024-06-21 03:15 PM',
      lastUpdate: '6 hours ago',
      assignedTo: null,
      messages: 1,
    },
    {
      id: 'TKT-1006',
      subject: 'Mobile app crashing on Android',
      tenant: 'Fitness Hub',
      tenantId: 'T-1006',
      user: 'David Brown',
      userEmail: 'david@fitnesshub.com',
      priority: 'high',
      status: 'in-progress',
      category: 'Bug',
      created: '2024-06-21 02:00 PM',
      lastUpdate: '4 hours ago',
      assignedTo: 'Support Agent 3',
      messages: 7,
    },
    {
      id: 'TKT-1007',
      subject: 'Need help setting up SMS notifications',
      tenant: 'Pet Grooming Plus',
      tenantId: 'T-1007',
      user: 'Anna Lee',
      userEmail: 'anna@petgrooming.com',
      priority: 'low',
      status: 'resolved',
      category: 'Question',
      created: '2024-06-21 11:30 AM',
      lastUpdate: '1 day ago',
      assignedTo: 'Support Agent 2',
      messages: 6,
    },
  ];

  const getPriorityBadge = (priority: string) => {
    const styles = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700',
    };
    return styles[priority as keyof typeof styles] || styles.low;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return styles[status as keyof typeof styles] || styles.open;
  };

  const breadcrumbs = [{ label: 'Support Tickets' }];

  return (
    <SuperAdminLayout
      currentPage="super-admin-support"
      onNavigate={onNavigate}
      title="Support Tickets"
      description="Manage customer support tickets"
      breadcrumbs={breadcrumbs}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 border-gray-200 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-green-600">{stat.change}</span>
              </div>
              <div className="text-3xl text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Filters and Search */}
      <Card className="p-6 mb-6 border-gray-200 rounded-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tickets by ID, subject, or tenant..."
              className="pl-10 h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select defaultValue="all">
            <SelectTrigger className="w-full lg:w-48 h-11 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select defaultValue="all">
            <SelectTrigger className="w-full lg:w-48 h-11 rounded-xl">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select defaultValue="all">
            <SelectTrigger className="w-full lg:w-48 h-11 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="question">Question</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Ticket</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Tenant</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Priority</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Status</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Category</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Assigned To</th>
                <th className="px-6 py-3 text-start text-sm text-gray-600">Last Update</th>
                <th className="px-6 py-3 text-right text-sm text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onNavigate('super-admin-ticket-detail', { ticketId: ticket.id })}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900 mb-1">{ticket.subject}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{ticket.id}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {ticket.messages}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900">{ticket.tenant}</div>
                      <div className="text-xs text-gray-500">{ticket.user}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getPriorityBadge(ticket.priority)} border-0 capitalize`}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${getStatusBadge(ticket.status)} border-0`}>
                      {ticket.status.replace('-', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="rounded-lg">
                      {ticket.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {ticket.assignedTo || (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ticket.lastUpdate}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="rounded-lg">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('super-admin-ticket-detail', { ticketId: ticket.id });
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <User className="w-4 h-4 mr-2" />
                          Assign to Agent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('super-admin-tenant-detail', { tenantId: ticket.tenantId });
                          }}
                        >
                          <User className="w-4 h-4 mr-2" />
                          View Tenant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing 1-7 of {tickets.length} tickets</p>
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
