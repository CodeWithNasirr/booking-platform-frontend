// src/components/dashboard/settings/NotificationRow.js
'use client'

import { Edit2, Mail, MessageSquare, Smartphone } from 'lucide-react'

const CHANNEL_ICONS = {
  email: Mail,
  sms: Smartphone,
  whatsapp: MessageSquare,
}

const CHANNEL_COLORS = {
  email: 'text-blue-600 bg-blue-50',
  sms: 'text-emerald-600 bg-emerald-50',
  whatsapp: 'text-green-600 bg-green-50',
}

export default function NotificationRow({ rule, onToggle, onCustomize }) {
  const ChannelIcon = CHANNEL_ICONS[rule.channel] || Mail
  const channelColor = CHANNEL_COLORS[rule.channel] || 'text-gray-600 bg-gray-50'

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors rounded-lg">
      {/* Left: toggle + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Toggle */}
        <button
          onClick={() => onToggle(rule.id)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
            rule.enabled ? 'bg-[#8B1E3F]' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              rule.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>

        {/* Channel badge */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${channelColor}`}>
          <ChannelIcon className="w-3.5 h-3.5" />
        </div>

        {/* Label */}
        <div className="min-w-0">
          <p className={`text-sm font-medium truncate ${rule.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
            {rule.event_label}
          </p>
          <p className="text-xs text-gray-400 capitalize">{rule.channel}</p>
        </div>
      </div>

      {/* Right: Customize button */}
      <button
        onClick={() => onCustomize(rule)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#8B1E3F] hover:bg-[#8B1E3F]/5 rounded-lg transition-colors flex-shrink-0"
      >
        <Edit2 className="w-3.5 h-3.5" />
        Customize
      </button>
    </div>
  )
}