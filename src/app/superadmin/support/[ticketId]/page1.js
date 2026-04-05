import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Flag,
  Tag,
  MessageSquare,
  Paperclip,
  Send,
  Eye,
  EyeOff,
  Download,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  MoreVertical,
  Plus,
  Building2,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';

export const SupportTicketDetail = ({ ticketId, onNavigate }) => {
  const { t, isRTL } = useApp();
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [activeTab, setActiveTab] = useState('conversation');

  // Mock Ticket Data
  const ticket = {
    id: ticketId || '1',
    ticketNumber: 'TKT-1045',
    subject: 'Payment gateway integration not working',
    tenantName: 'Elegant Spa & Wellness',
    tenantId: 'tenant-001',
    priority: 'urgent',
    status: 'open',
    category: 'technical',
    assignedAgent: 'Sarah Johnson',
    assignedAgentId: 'agent-001',
    createdAt: '2024-12-25 10:30',
    lastUpdate: '5 mins ago',
    customerName: 'John Smith',
    customerEmail: 'john@elegantspa.com',
    customerPhone: '+1 (555) 123-4567',
    tags: ['payment', 'stripe', 'integration'],
    description: 'We are experiencing issues with our Stripe payment gateway. Customers are unable to complete bookings because the payment process fails at checkout. This started happening after we updated our subscription plan.',
  };

  const [messages] = useState([
    {
      id: '1',
      type: 'customer',
      author: 'John Smith',
      authorEmail: 'john@elegantspa.com',
      content: 'We are experiencing issues with our Stripe payment gateway. Customers are unable to complete bookings because the payment process fails at checkout. This started happening after we updated our subscription plan.',
      timestamp: '2024-12-25 10:30',
      attachments: [
        { name: 'error-screenshot.png', size: '245 KB', url: '#' },
        { name: 'console-log.txt', size: '12 KB', url: '#' },
      ],
    },
    {
      id: '2',
      type: 'agent',
      author: 'Sarah Johnson',
      authorEmail: 'sarah@bookingpro.com',
      content: 'Hi John, thank you for reaching out. I\'ve reviewed your account and I can see the issue. It appears that your Stripe API keys need to be updated after the plan change. Could you please verify that you\'re using the correct Live API keys in your integration settings?',
      timestamp: '2024-12-25 10:45',
    },
    {
      id: '3',
      type: 'internal',
      author: 'Sarah Johnson',
      authorEmail: 'sarah@bookingpro.com',
      content: 'Checked the tenant account - they recently upgraded from Basic to Pro plan. The webhook endpoints weren\'t updated automatically. Need to guide them through the API key refresh process.',
      timestamp: '2024-12-25 10:47',
      isInternal: true,
    },
    {
      id: '4',
      type: 'customer',
      author: 'John Smith',
      authorEmail: 'john@elegantspa.com',
      content: 'Thanks for the quick response! I checked the API keys and they seem correct. I\'m using the same keys that were working before. Is there anything else I should check?',
      timestamp: '2024-12-25 11:00',
    },
    {
      id: '5',
      type: 'system',
      author: 'System',
      content: 'Ticket priority changed from High to Urgent',
      timestamp: '2024-12-25 11:05',
    },
    {
      id: '6',
      type: 'agent',
      author: 'Sarah Johnson',
      authorEmail: 'sarah@bookingpro.com',
      content: 'I see the issue now. When you upgraded plans, we created new webhook endpoints. Please go to Settings > Integrations > Stripe and click "Reconnect". This will refresh your webhook URLs. Let me know once you\'ve done this and we can test a payment together.',
      timestamp: '2024-12-25 11:15',
      attachments: [
        { name: 'stripe-setup-guide.pdf', size: '1.2 MB', url: '#' },
      ],
    },
  ]);

  const [activityLog] = useState([
    {
      id: '1',
      type: 'created',
      description: 'Ticket created',
      user: 'John Smith',
      timestamp: '2024-12-25 10:30',
    },
    {
      id: '2',
      type: 'assignment',
      description: 'Assigned to Sarah Johnson',
      user: 'System',
      timestamp: '2024-12-25 10:35',
    },
    {
      id: '3',
      type: 'priority_change',
      description: 'Priority changed from High to Urgent',
      user: 'Sarah Johnson',
      timestamp: '2024-12-25 11:05',
    },
    {
      id: '4',
      type: 'note',
      description: 'Internal note added',
      user: 'Sarah Johnson',
      timestamp: '2024-12-25 10:47',
    },
  ]);

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100',
    };
    return colors[priority] || colors.low;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'text-blue-600 bg-blue-100',
      in_progress: 'text-purple-600 bg-purple-100',
      waiting_customer: 'text-yellow-600 bg-yellow-100',
      resolved: 'text-green-600 bg-green-100',
      closed: 'text-gray-600 bg-gray-100',
    };
    return colors[status] || colors.open;
  };

  const handleSendReply = () => {
    if (replyMessage.trim()) {
      // In real app, send the reply
      console.log('Sending reply:', replyMessage);
      setReplyMessage('');
    }
  };

  const handleAddInternalNote = () => {
    if (internalNote.trim()) {
      // In real app, add internal note
      console.log('Adding internal note:', internalNote);
      setInternalNote('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => onNavigate('super-admin-support')}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tickets
      </Button>

      {/* Ticket Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left Side - Ticket Info */}
          <div className="flex-1">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-600">{ticket.ticketNumber}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{ticket.subject}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span className="font-medium">{ticket.tenantName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {ticket.customerName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {ticket.customerEmail}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created {ticket.createdAt}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Updated {ticket.lastUpdate}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              {ticket.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {tag}
                </span>
              ))}
              <button className="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200">
                <Plus className="w-3 h-3 inline mr-1" />
                Add Tag
              </button>
            </div>
          </div>

          {/* Right Side - Actions & Assignment */}
          <div className="lg:w-80 space-y-4">
            {/* Assigned Agent */}
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Assigned Agent</span>
                <Button variant="outline" size="sm">
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {ticket.assignedAgent.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{ticket.assignedAgent}</div>
                  <div className="text-xs text-gray-600">Support Agent</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <select className="px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none">
                <option>Change Status</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Waiting Customer</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none">
                <option>Change Priority</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
              <select className="px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none">
                <option>Change Category</option>
                <option>Technical</option>
                <option>Billing</option>
                <option>Feature Request</option>
                <option>Bug</option>
                <option>General</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-6">
          <div className="flex items-center gap-6 -mb-px">
            <button
              onClick={() => setActiveTab('conversation')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'conversation'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversation
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                  {messages.filter(m => !m.isInternal).length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Activity Log
              </div>
            </button>
            <button
              onClick={() => setShowInternalNotes(!showInternalNotes)}
              className={`ml-auto py-4 px-4 font-medium text-sm transition-colors rounded-lg ${
                showInternalNotes
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {showInternalNotes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                Internal Notes
                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">
                  {messages.filter(m => m.isInternal).length}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'conversation' && (
            <div className="space-y-6">
              {/* Messages Thread */}
              <div className="space-y-4">
                {messages.filter(m => !m.isInternal || showInternalNotes).map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-xl border ${
                      message.isInternal
                        ? 'bg-yellow-50 border-yellow-200'
                        : message.type === 'agent'
                        ? 'bg-blue-50 border-blue-200'
                        : message.type === 'system'
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.isInternal
                          ? 'bg-yellow-200 text-yellow-700'
                          : message.type === 'agent'
                          ? 'bg-blue-200 text-blue-700'
                          : message.type === 'system'
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {message.type === 'system' ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : message.isInternal ? (
                          <Shield className="w-5 h-5" />
                        ) : (
                          <span className="font-semibold text-sm">
                            {message.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">{message.author}</span>
                            {message.isInternal && (
                              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                                Internal Note
                              </span>
                            )}
                            {message.authorEmail && (
                              <span className="ml-2 text-sm text-gray-500">{message.authorEmail}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{message.timestamp}</span>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</div>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                              >
                                <Paperclip className="w-4 h-4 text-gray-400" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {attachment.name}
                                  </div>
                                  <div className="text-xs text-gray-500">{attachment.size}</div>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {message.type !== 'system' && (
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Reply to Customer</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attach File
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Shift + Enter for new line
                    </div>
                    <Button
                      onClick={handleSendReply}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!replyMessage.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>

              {/* Internal Note Box */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-gray-900">Add Internal Note</h3>
                    <span className="text-xs text-gray-500">(Not visible to customer)</span>
                  </div>
                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Add a private note for your team..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-yellow-300 bg-yellow-50 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddInternalNote}
                      variant="outline"
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                      disabled={!internalNote.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {activityLog.map((activity, index) => (
                <div key={activity.id} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'created' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'assignment' ? 'bg-purple-100 text-purple-600' :
                      activity.type === 'priority_change' ? 'bg-orange-100 text-orange-600' :
                      activity.type === 'status_change' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'created' ? <Plus className="w-4 h-4" /> :
                       activity.type === 'assignment' ? <User className="w-4 h-4" /> :
                       activity.type === 'priority_change' ? <Flag className="w-4 h-4" /> :
                       activity.type === 'status_change' ? <CheckCircle2 className="w-4 h-4" /> :
                       <MessageSquare className="w-4 h-4" />}
                    </div>
                    {index < activityLog.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 my-1" />
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{activity.description}</span>
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    </div>
                    <div className="text-sm text-gray-600">by {activity.user}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
