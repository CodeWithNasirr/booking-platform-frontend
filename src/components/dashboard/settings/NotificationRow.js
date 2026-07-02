// src/components/dashboard/settings/NotificationRow.js
'use client'

import { useApp } from '@/contexts/AppContext'
import { MessageCircle, Mail } from 'lucide-react'

function ChannelToggle({ enabled, onToggle, icon: Icon, label, activeColor }) {
  return (
    <button
      onClick={onToggle}
      className="flex flex-col items-center gap-1 w-14 flex-shrink-0"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      title={label}
    >
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          enabled ? activeColor : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm
            ${enabled
              ? 'ltr:translate-x-[18px] rtl:-translate-x-[18px]'
              : 'ltr:translate-x-[3px] rtl:-translate-x-[3px]'
            }`}
        />
      </span>
      <Icon className={`w-3.5 h-3.5 ${enabled ? 'text-gray-600' : 'text-gray-300'}`} />
    </button>
  )
}

/**
 * One (event, receiver) row of the preferences matrix: label on the
 * left, an independent toggle per channel (WhatsApp + Email), and
 * the WhatsApp-template customize action.
 */
export default function NotificationRow({ waRule, emailRule, onToggleWa, onToggleEmail, onCustomize }) {
  const { t } = useApp()

  const anyEnabled = waRule?.enabled || emailRule?.enabled
  const label = waRule?.event_label || emailRule?.event_label
  const receiver = waRule?.receiver || emailRule?.receiver

  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/40 transition-colors">
      {/* Left: Description */}
      <p className={`text-sm flex-1 pr-4 ${anyEnabled ? 'text-gray-800' : 'text-gray-400'}`}>
        {label}
        <span className="text-gray-400"> {t('settings.notifications.for')} {receiver}</span>
      </p>

      {/* Center: one toggle per channel */}
      <div className="flex items-start gap-2 mx-4 flex-shrink-0">
        {waRule && (
          <ChannelToggle
            enabled={waRule.enabled}
            onToggle={onToggleWa}
            icon={MessageCircle}
            label={t('settings.notifications.channels.whatsapp')}
            activeColor="bg-emerald-500"
          />
        )}
        {emailRule && (
          <ChannelToggle
            enabled={emailRule.enabled}
            onToggle={onToggleEmail}
            icon={Mail}
            label={t('settings.notifications.channels.email')}
            activeColor="bg-[#8B1E3F]"
          />
        )}
      </div>

      {/* Right: Customize (WhatsApp text template) */}
      <button
        onClick={onCustomize}
        disabled={!waRule}
        className="text-sm font-medium text-[#8B1E3F] hover:text-[#6B1630] transition-colors flex-shrink-0 ml-2 disabled:opacity-40"
      >
        {t('settings.notifications.customize')}
      </button>
    </div>
  )
}
