'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import {
  Search,
  Filter,
  Send,
  Paperclip,
  MoreVertical,
  ArrowLeft,
  UserPlus,
  UserMinus,
  AlertCircle,
  CheckCircle,
  BellOff,
  Phone,
  Mail,
  Clock,
  X,
  ChevronDown
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";

const mockChatThreads = [
  {
    id: 'BKG-2401',
    customerId: 'C001',
    customerName: 'Sarah Ahmed',
    customerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    providerId: 'P001',
    providerName: 'Dr. John Smith',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    serviceName: 'Dental Consultation',
    lastMessage: 'Can we reschedule to next week?',
    timestamp: '2 min ago',
    unreadCount: 2,
    status: 'escalated',
    assignedTo: null,
    messages: [
      { id: 1, sender: 'customer', senderName: 'Sarah Ahmed', text: 'Hi, I need to discuss my appointment time.', timestamp: '10:30 AM', seen: true },
      { id: 2, sender: 'provider', senderName: 'Dr. John Smith', text: 'Hello Sarah, what would you like to change?', timestamp: '10:32 AM', seen: true },
      { id: 3, sender: 'customer', senderName: 'Sarah Ahmed', text: 'Can we reschedule to next week?', timestamp: '10:35 AM', seen: false },
      { id: 4, sender: 'customer', senderName: 'Sarah Ahmed', text: 'I have an emergency meeting.', timestamp: '10:36 AM', seen: false },
    ]
  },
  {
    id: 'BKG-2402',
    customerId: 'C002',
    customerName: 'Mohammed Ali',
    customerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed',
    providerId: 'P002',
    providerName: 'Lisa Chen',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    serviceName: 'Hair Styling',
    lastMessage: 'Thank you for the great service!',
    timestamp: '15 min ago',
    unreadCount: 0,
    status: 'active',
    assignedTo: null,
    messages: [
      { id: 1, sender: 'customer', senderName: 'Mohammed Ali', text: 'Hi, I\'m on my way to the appointment.', timestamp: '9:00 AM', seen: true },
      { id: 2, sender: 'provider', senderName: 'Lisa Chen', text: 'Great! See you soon.', timestamp: '9:02 AM', seen: true },
      { id: 3, sender: 'customer', senderName: 'Mohammed Ali', text: 'Thank you for the great service!', timestamp: '11:45 AM', seen: true },
    ]
  },
  {
    id: 'BKG-2403',
    customerId: 'C003',
    customerName: 'Fatima Hassan',
    customerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    providerId: 'P003',
    providerName: 'Ahmed Khan',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    serviceName: 'Legal Consultation',
    lastMessage: 'I need help with contract review',
    timestamp: '1 hour ago',
    unreadCount: 5,
    status: 'escalated',
    assignedTo: 'Sub-Admin: Tom Wilson',
    messages: [
      { id: 1, sender: 'customer', senderName: 'Fatima Hassan', text: 'I have some questions about the service.', timestamp: 'Yesterday 3:00 PM', seen: true },
      { id: 2, sender: 'provider', senderName: 'Ahmed Khan', text: 'Sure, what would you like to know?', timestamp: 'Yesterday 3:05 PM', seen: true },
      { id: 3, sender: 'customer', senderName: 'Fatima Hassan', text: 'I need help with contract review', timestamp: '1 hour ago', seen: false },
    ]
  },
  {
    id: 'BKG-2404',
    customerId: 'C004',
    customerName: 'David Brown',
    customerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    providerId: 'P004',
    providerName: 'Maria Garcia',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    serviceName: 'Fitness Training',
    lastMessage: 'Session completed successfully',
    timestamp: '2 hours ago',
    unreadCount: 0,
    status: 'resolved',
    assignedTo: null,
    messages: [
      { id: 1, sender: 'customer', senderName: 'David Brown', text: 'Looking forward to today\'s session!', timestamp: 'Today 8:00 AM', seen: true },
      { id: 2, sender: 'provider', senderName: 'Maria Garcia', text: 'Me too! See you at 9 AM.', timestamp: 'Today 8:05 AM', seen: true },
      { id: 3, sender: 'admin', senderName: 'Tenant Admin', text: 'Session completed successfully', timestamp: 'Today 10:30 AM', seen: true },
    ]
  },
  {
    id: 'BKG-2405',
    customerId: 'C005',
    customerName: 'Aisha Rahman',
    customerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha',
    providerId: 'P001',
    providerName: 'Dr. John Smith',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    serviceName: 'Medical Checkup',
    lastMessage: 'What documents do I need to bring?',
    timestamp: '3 hours ago',
    unreadCount: 1,
    status: 'active',
    assignedTo: null,
    messages: [
      { id: 1, sender: 'customer', senderName: 'Aisha Rahman', text: 'Hi, I have a booking for tomorrow.', timestamp: 'Today 9:00 AM', seen: true },
      { id: 2, sender: 'provider', senderName: 'Dr. John Smith', text: 'Yes, I can see your booking. How can I help?', timestamp: 'Today 9:15 AM', seen: true },
      { id: 3, sender: 'customer', senderName: 'Aisha Rahman', text: 'What documents do I need to bring?', timestamp: 'Today 9:20 AM', seen: false },
    ]
  },
]

const statusConfig = {
  active: { 
    label: 'Active', 
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
    bgHover: 'hover:bg-green-50'
  },
  escalated: { 
    label: 'Escalated', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: AlertCircle,
    bgHover: 'hover:bg-amber-50'
  },
  resolved: { 
    label: 'Resolved', 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: CheckCircle,
    bgHover: 'hover:bg-gray-50'
  }
}

function TenantChatPageInner() {
  const { user, loadingUser, requiresOnboarding } = useApp()
  const router = useRouter()
  const messagesEndRef = useRef(null)

  const [selectedThread, setSelectedThread] = useState(mockChatThreads[0])
  const [threads, setThreads] = useState(mockChatThreads)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [showMobileInbox, setShowMobileInbox] = useState(true)
  const [showActions, setShowActions] = useState(false)
  const [dropdownOpenId, setDropdownOpenId] = useState(null)

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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedThread?.messages])

  if (requiresOnboarding || loadingUser) {
    return null
  }

  const filteredThreads = threads.filter((thread) => {
    const matchesSearch =
      thread.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterStatus === 'all' || thread.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const handleJoinConversation = () => {
    setIsJoined(true)
    setShowActions(false)
  }

  const handleLeaveConversation = () => {
    setIsJoined(false)
    setShowActions(false)
  }

  const handleEscalate = () => {
    setThreads((prev) =>
      prev.map((t) => (t.id === selectedThread.id ? { ...t, status: 'escalated' } : t))
    )
    setSelectedThread((prev) => ({ ...prev, status: 'escalated' }))
    setShowActions(false)
  }

  const handleResolve = () => {
    setThreads((prev) =>
      prev.map((t) => (t.id === selectedThread.id ? { ...t, status: 'resolved' } : t))
    )
    setSelectedThread((prev) => ({ ...prev, status: 'resolved' }))
    setShowActions(false)
  }

  const handleSendMessage = () => {
    if (!messageInput.trim() || !isJoined) return

    const newMessage = {
      id: selectedThread.messages.length + 1,
      sender: 'admin',
      senderName: 'Tenant Admin',
      text: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      seen: false,
    }

    setThreads((prev) =>
      prev.map((t) =>
        t.id === selectedThread.id
          ? {
              ...t,
              messages: [...t.messages, newMessage],
              lastMessage: messageInput,
              timestamp: 'Just now',
            }
          : t
      )
    )

    setSelectedThread((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }))

    setMessageInput('')
  }

  const handleSelectThread = (thread) => {
    setSelectedThread(thread)
    setIsJoined(false)
    setShowMobileInbox(false)
    
    // Mark as read
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t))
    )
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex bg-[#FAF5F7]">
      {/* Inbox List - Left Column */}
      <div
        className={`${showMobileInbox ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-[420px] bg-white border-r border-[#8B1E3F]/10 shadow-sm`}
      >
        {/* Search & Filters Header */}
        <div className="p-5 border-b border-[#8B1E3F]/10 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <span className="px-2.5 py-1 bg-[#8B1E3F]/10 text-[#8B1E3F] text-xs font-semibold rounded-full">
              {threads.reduce((acc, t) => acc + t.unreadCount, 0)} New
            </span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all text-sm font-medium text-gray-700"
            >
              <Filter className="w-4 h-4 text-[#8B1E3F]" />
              <span>Filter: {filterStatus === 'all' ? 'All Status' : statusConfig[filterStatus].label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="absolute top-full mt-2 w-full bg-white border border-[#8B1E3F]/10 rounded-xl shadow-xl z-20 overflow-hidden">
                <button
                  onClick={() => {
                    setFilterStatus('all')
                    setShowFilters(false)
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-[#8B1E3F]/5 transition-colors text-sm ${
                    filterStatus === 'all' ? 'bg-[#8B1E3F]/10 text-[#8B1E3F] font-medium' : 'text-gray-700'
                  }`}
                >
                  All Status
                </button>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterStatus(key)
                      setShowFilters(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#8B1E3F]/5 transition-colors text-sm flex items-center gap-2 ${
                      filterStatus === key ? 'bg-[#8B1E3F]/10 text-[#8B1E3F] font-medium' : 'text-gray-700'
                    }`}
                  >
                    <config.icon className="w-4 h-4" />
                    {config.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 bg-[#8B1E3F]/10 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-[#8B1E3F]/60" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No Results Found' : 'No Conversations Yet'}
              </h3>
              <p className="text-gray-500 text-sm max-w-xs">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'All customer-provider chats will appear here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredThreads.map((thread) => {
                const StatusIcon = statusConfig[thread.status].icon
                return (
                  <button
                    key={thread.id}
                    onClick={() => handleSelectThread(thread)}
                    className={`w-full text-left p-4 hover:bg-[#8B1E3F]/5 transition-all duration-200 group ${
                      selectedThread?.id === thread.id
                        ? 'bg-[#8B1E3F]/5 border-l-4 border-[#8B1E3F]'
                        : 'border-l-4 border-transparent'
                    } ${thread.status === 'escalated' ? 'bg-amber-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatars Stack */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center text-white font-bold shadow-md">
                          {getInitials(thread.customerName)}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold absolute -bottom-1 -right-1 border-2 border-white shadow-sm">
                          {getInitials(thread.providerName)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-gray-900 truncate max-w-[120px] ${thread.unreadCount > 0 ? 'text-[#8B1E3F]' : ''}`}>
                              {thread.customerName}
                            </span>
                            <span className="text-gray-400 text-xs">→</span>
                            <span className="font-medium text-gray-600 text-sm truncate max-w-[100px]">
                              {thread.providerName}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {thread.timestamp}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-[#8B1E3F] bg-[#8B1E3F]/10 px-2 py-0.5 rounded-md">
                            {thread.serviceName}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 font-mono">{thread.id}</span>
                        </div>

                        <p
                          className={`text-sm truncate ${
                            thread.unreadCount > 0
                              ? 'font-semibold text-gray-900'
                              : 'text-gray-500'
                          }`}
                        >
                          {thread.lastMessage}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                statusConfig[thread.status].color
                              }`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[thread.status].label}
                            </span>
                            {thread.assignedTo && (
                              <span className="text-xs text-gray-500 truncate max-w-[100px]">
                                {thread.assignedTo}
                              </span>
                            )}
                          </div>
                          {thread.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-[#8B1E3F] text-white text-xs font-bold rounded-full shadow-sm">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Conversation View - Right Column */}
      <div
        className={`${!showMobileInbox ? 'flex' : 'hidden'} lg:flex flex-col flex-1 bg-[#FAF5F7]`}
      >
        {selectedThread ? (
          <>
            {/* Conversation Header */}
            <div className="bg-white border-b border-[#8B1E3F]/10 px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setShowMobileInbox(true)}
                    className="lg:hidden p-2 hover:bg-[#8B1E3F]/10 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-[#8B1E3F]" />
                  </button>

                  {/* Avatars */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {getInitials(selectedThread.customerName)}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold absolute -bottom-1 -right-1 border-2 border-white shadow-sm">
                      {getInitials(selectedThread.providerName)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 truncate">
                      {selectedThread.customerName}{' '}
                      <span className="text-gray-400 font-normal">→</span>{' '}
                      {selectedThread.providerName}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-0.5 flex-wrap">
                      <span className="font-medium text-[#8B1E3F]">
                        {selectedThread.serviceName}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {selectedThread.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
                          statusConfig[selectedThread.status].color
                        }`}
                      >
                        {(() => {
                          const StatusIcon = statusConfig[selectedThread.status].icon
                          return <StatusIcon className="w-3 h-3" />
                        })()}
                        {statusConfig[selectedThread.status].label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Desktop */}
                <div className="hidden lg:flex items-center gap-2">
                  {!isJoined ? (
                    <button
                      onClick={handleJoinConversation}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] text-white rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                      <UserPlus className="w-4 h-4" />
                      Join Chat
                    </button>
                  ) : (
                    <button
                      onClick={handleLeaveConversation}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
                    >
                      <UserMinus className="w-4 h-4" />
                      Leave
                    </button>
                  )}

                  {selectedThread.status !== 'escalated' && (
                    <button
                      onClick={handleEscalate}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-all font-medium"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Escalate
                    </button>
                  )}

                  {selectedThread.status !== 'resolved' && (
                    <button
                      onClick={handleResolve}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve
                    </button>
                  )}

                  <button className="p-2.5 hover:bg-[#8B1E3F]/10 rounded-xl transition-colors text-gray-600">
                    <BellOff className="w-5 h-5" />
                  </button>

                  {/* Settings Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowActions(!showActions)}
                      className="p-2.5 hover:bg-[#8B1E3F]/10 rounded-xl transition-colors text-gray-600"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Action Menu - Mobile */}
                <div className="lg:hidden relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2.5 hover:bg-[#8B1E3F]/10 rounded-xl transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-[#8B1E3F]" />
                  </button>

                  {showActions && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-[#8B1E3F]/10 rounded-xl shadow-xl z-20 overflow-hidden">
                      {!isJoined ? (
                        <button
                          onClick={handleJoinConversation}
                          className="w-full text-left px-4 py-3 hover:bg-[#8B1E3F]/5 flex items-center gap-2 text-[#8B1E3F] font-medium"
                        >
                          <UserPlus className="w-4 h-4" />
                          Join Chat
                        </button>
                      ) : (
                        <button
                          onClick={handleLeaveConversation}
                          className="w-full text-left px-4 py-3 hover:bg-[#8B1E3F]/5 flex items-center gap-2 text-gray-700"
                        >
                          <UserMinus className="w-4 h-4" />
                          Leave Conversation
                        </button>
                      )}
                      {selectedThread.status !== 'escalated' && (
                        <button
                          onClick={handleEscalate}
                          className="w-full text-left px-4 py-3 hover:bg-amber-50 flex items-center gap-2 text-amber-700"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Escalate
                        </button>
                      )}
                      {selectedThread.status !== 'resolved' && (
                        <button
                          onClick={handleResolve}
                          className="w-full text-left px-4 py-3 hover:bg-green-50 flex items-center gap-2 text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve
                        </button>
                      )}
                      <button className="w-full text-left px-4 py-3 hover:bg-[#8B1E3F]/5 flex items-center gap-2 text-gray-700">
                        <BellOff className="w-4 h-4" />
                        Mute Notifications
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Alerts */}
              {!isJoined && selectedThread.status !== 'escalated' && (
                <div className="mt-3 px-4 py-3 bg-[#8B1E3F]/10 border border-[#8B1E3F]/20 rounded-xl flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#8B1E3F] rounded-full animate-pulse" />
                  <p className="text-sm text-[#8B1E3F] font-medium">
                    Observer Mode - Join conversation to reply
                  </p>
                </div>
              )}

              {selectedThread.status === 'escalated' && (
                <div className="mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800 font-medium">
                    This conversation has been escalated
                    {selectedThread.assignedTo && ` • Assigned to ${selectedThread.assignedTo}`}
                  </p>
                </div>
              )}

              {isJoined && (
                <div className="mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    You are participating in this conversation
                  </p>
                </div>
              )}
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedThread.messages.map((message, index) => {
                const isCustomer = message.sender === 'customer'
                const isProvider = message.sender === 'provider'
                const isAdmin = message.sender === 'admin'
                const showAvatar = index === 0 || selectedThread.messages[index - 1].sender !== message.sender

                return (
                  <div
                    key={message.id}
                    className={`flex ${isProvider ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                  >
                    <div className={`flex gap-3 max-w-[75%] ${isAdmin ? 'max-w-[85%]' : ''}`}>
                      {/* Avatar - left side for customer/admin */}
                      {!isProvider && showAvatar && (
                        <div className="flex-shrink-0">
                          {isCustomer ? (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center text-white text-sm font-bold shadow-md">
                              {getInitials(message.senderName)}
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold shadow-md">
                              {getInitials(message.senderName)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`flex-1 ${isProvider ? 'items-end' : 'items-start'} flex flex-col`}>
                        {/* Sender Label */}
                        <div className={`flex items-center gap-2 mb-1.5 ${isProvider ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold text-gray-700">
                            {message.senderName}
                          </span>
                          {isAdmin && (
                            <span className="px-2 py-0.5 bg-[#8B1E3F] text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                              Admin
                            </span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {message.timestamp}
                          </span>
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`px-5 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                            isCustomer
                              ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                              : isProvider
                              ? 'bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] text-white rounded-tr-none'
                              : 'bg-[#8B1E3F]/10 text-[#8B1E3F] border border-[#8B1E3F]/20 rounded-tl-none'
                          }`}
                        >
                          <p>{message.text}</p>
                        </div>

                        {/* Status indicator for provider messages */}
                        {isProvider && (
                          <div className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                            {message.seen ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-blue-500" />
                                Seen
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Delivered
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Avatar - right side for provider */}
                      {isProvider && showAvatar && (
                        <div className="flex-shrink-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {getInitials(message.senderName)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="bg-white border-t border-[#8B1E3F]/10 px-6 py-4 shadow-lg">
              <div className={`flex items-end gap-3 ${!isJoined ? 'opacity-60' : ''}`}>
                <button
                  disabled={!isJoined}
                  className="p-3 hover:bg-[#8B1E3F]/10 rounded-xl transition-colors disabled:cursor-not-allowed text-[#8B1E3F]"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-[#8B1E3F] focus-within:ring-2 focus-within:ring-[#8B1E3F]/20 transition-all">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder={
                      isJoined
                        ? 'Type your message...'
                        : 'Observer Mode - Join to reply'
                    }
                    disabled={!isJoined}
                    rows={1}
                    className="w-full px-4 py-3 bg-transparent border-none focus:outline-none resize-none max-h-32 min-h-[48px] text-gray-800 placeholder:text-gray-400 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!isJoined || !messageInput.trim()}
                  className="p-3 bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] text-white rounded-xl hover:opacity-90 transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 ml-14">
                {isJoined ? 'Press Enter to send, Shift + Enter for new line' : 'Join this conversation to send messages'}
              </p>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex items-center justify-center h-full bg-white">
            <div className="text-center max-w-md px-6">
              <div className="w-24 h-24 bg-[#8B1E3F]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <MessageSquare className="w-12 h-12 text-[#8B1E3F]/60" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Select a conversation
              </h3>
              <p className="text-gray-500 mb-6">
                Choose a chat from the list to view messages and manage customer-provider communications
              </p>
              <button
                onClick={() => setShowMobileInbox(true)}
                className="lg:hidden px-6 py-3 bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
              >
                View Conversations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TenantChatPage(props) {
  return (
    <TenantPermissionGate permission="chat.view">
      <TenantChatPageInner {...props} />
    </TenantPermissionGate>
  );
}
