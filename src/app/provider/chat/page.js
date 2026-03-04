'use client';

import { useState } from 'react';
import { 
  Search, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Smile, 
  MoreVertical,
  Check,
  CheckCheck
} from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState('Sarah Johnson');
  const [messageInput, setMessageInput] = useState('');

  const conversations = [
    { name: 'Sarah Johnson', initials: 'SJ', message: 'Thank you! Looking forward to my appointment tomorrow.', time: '10 min ago', unread: 2, online: true },
    { name: 'Michael Brown', initials: 'MB', message: 'Can we reschedule to 2 PM instead?', time: '1 hour ago', unread: 0, online: false },
    { name: 'Emma Wilson', initials: 'EW', message: 'What products do you recommend for my hair type?', time: '2 hours ago', unread: 1, online: true },
    { name: 'David Chen', initials: 'DC', message: 'Perfect, see you next week!', time: 'Yesterday', unread: 0, online: false },
    { name: 'Lisa Anderson', initials: 'LA', message: 'Do you offer gift certificates?', time: '2 days ago', unread: 0, online: false },
  ];

  const messages = [
    { sender: 'client', text: 'Hi! I have a question about my upcoming appointment.', time: '10:30 AM', read: true },
    { sender: 'provider', text: 'Hello! Of course, how can I help you?', time: '10:32 AM', read: true },
    { sender: 'client', text: 'I was wondering if you could add a deep conditioning treatment?', time: '10:33 AM', read: true },
    { sender: 'provider', text: 'Absolutely! I can add that to your service. It will add an extra 20 minutes and $30 to your total.', time: '10:35 AM', read: true },
    { sender: 'client', text: 'Perfect! That sounds great. Thank you!', time: '10:36 AM', read: true },
    { sender: 'provider', text: 'You\'re welcome! Looking forward to seeing you tomorrow at 2 PM.', time: '10:37 AM', read: false },
  ];

  const selectedConv = conversations.find(c => c.name === selectedConversation);

  return (
    <DashboardLayout pageName="Chat">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] bg-white border border-[#e5e7eb] rounded-[16px] overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-full lg:w-[320px] bg-white border-b lg:border-b-0 lg:border-r border-[#e5e7eb] flex flex-col shrink-0">
          {/* Search */}
          <div className="h-[70px] border-b border-[#e5e7eb] p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#99A1AF]" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full h-[38px] pl-10 pr-4 py-2 rounded-[12px] border border-[#e5e7eb] text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv, index) => (
              <button
                key={index}
                onClick={() => setSelectedConversation(conv.name)}
                className={`w-full h-[81px] border-b border-[#f3f4f6] px-4 py-4 flex items-center gap-3 transition-colors ${
                  selectedConversation === conv.name ? 'bg-[#eff6ff]' : 'bg-white hover:bg-[#f9fafb]'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="bg-gradient-to-br from-[#800020] to-[#600018] rounded-full size-12 flex items-center justify-center">
                    <span className="text-[16px] text-white font-medium">{conv.initials}</span>
                  </div>
                  {conv.online && (
                    <div className="absolute bg-[#00c950] border-2 border-white rounded-full size-3 right-0 bottom-0" />
                  )}
                </div>
                <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
                  <div className="w-full flex items-center justify-between">
                    <h3 className="text-[15px] text-[#101828] font-medium truncate">{conv.name}</h3>
                    <span className="text-[12px] text-[#6a7282] shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-[14px] text-[#4a5565] truncate w-full text-left">{conv.message}</p>
                </div>
                {conv.unread > 0 && (
                  <div className="bg-[#800020] h-6 px-2.5 rounded-[10px] flex items-center justify-center shrink-0">
                    <span className="text-[12px] text-white font-medium">{conv.unread}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f9fafb]">
          {/* Chat Header */}
          <div className="bg-white h-[80px] border-b border-[#e5e7eb] px-4 md:px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="bg-gradient-to-br from-[#800020] to-[#600018] rounded-full size-12 flex items-center justify-center">
                  <span className="text-[16px] text-white font-medium">{selectedConv?.initials}</span>
                </div>
                {selectedConv?.online && (
                  <div className="absolute bg-[#00c950] border-2 border-white rounded-full size-3 right-0 bottom-0" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-[17px] md:text-[18px] text-[#101828] font-semibold truncate">{selectedConv?.name}</h2>
                <p className="text-[13px] md:text-[14px] text-[#4a5565]">{selectedConv?.online ? 'Active now' : 'Offline'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-white border border-[rgba(0,0,0,0.08)] h-9 md:h-[36px] px-3 md:px-4 rounded-[10px] flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Phone size={16} className="text-[#1a1a1a]" />
                <span className="text-[13px] md:text-[14px] text-[#1a1a1a] font-medium hidden sm:block">Voice Call</span>
              </button>
              <button className="bg-[#800020] h-9 md:h-[36px] px-3 md:px-4 rounded-[10px] flex items-center gap-2 hover:bg-[#600018] transition-colors">
                <Video size={16} className="text-white" />
                <span className="text-[13px] md:text-[14px] text-white font-medium hidden sm:block">Video Call</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
                <MoreVertical size={20} className="text-[#4a5565]" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex flex-col gap-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'provider' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[60%] ${
                    msg.sender === 'provider' 
                      ? 'bg-[#800020]' 
                      : 'bg-white border border-[#e5e7eb]'
                  } rounded-[12px] p-4 shadow-sm`}>
                    <p className={`text-[14px] leading-[20px] mb-2 ${msg.sender === 'provider' ? 'text-white' : 'text-[#101828]'}`}>
                      {msg.text}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-[11px] ${msg.sender === 'provider' ? 'text-white/80' : 'text-[#6a7282]'}`}>
                        {msg.time}
                      </span>
                      {msg.sender === 'provider' && (
                        msg.read ? (
                          <CheckCheck size={14} className="text-white/80" />
                        ) : (
                          <Check size={14} className="text-white/60" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-[#e5e7eb] px-4 md:px-6 py-4">
            <div className="flex items-center gap-2 md:gap-3">
              <button className="bg-[#f3f4f6] rounded-[10px] size-9 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0">
                <Paperclip size={18} className="text-[#4a5565]" />
              </button>
              <button className="bg-[#f3f4f6] rounded-[10px] size-9 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0">
                <ImageIcon size={18} className="text-[#4a5565]" />
              </button>
              <button className="bg-[#f3f4f6] rounded-[10px] size-9 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0">
                <Smile size={18} className="text-[#4a5565]" />
              </button>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 h-10 md:h-12 px-4 rounded-[12px] border border-[#e5e7eb] text-[14px] text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && messageInput.trim()) {
                    // Handle send
                    setMessageInput('');
                  }
                }}
              />
              <button 
                className="bg-[#800020] rounded-[10px] size-10 md:size-12 flex items-center justify-center hover:bg-[#600018] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!messageInput.trim()}
                onClick={() => {
                  if (messageInput.trim()) {
                    setMessageInput('');
                  }
                }}
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}