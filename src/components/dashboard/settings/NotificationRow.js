// src/components/dashboard/settings/NotificationRow.js
'use client'

import { useApp } from '@/contexts/AppContext'

export default function NotificationRow({ rule, onToggle, onCustomize }) {
  const { t } = useApp()

  return (
    <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/40 transition-colors">
      {/* Left: Description */}
      <p className={`text-sm flex-1 pr-4 ${
        rule.enabled ? 'text-gray-800' : 'text-gray-400'
      }`}>
        {rule.event_label}
        <span className="text-gray-400"> {t('settings.notifications.for')} {rule.receiver}</span>
      </p>

      {/* Center: Toggle — RTL aware */}
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mx-6 ${
          rule.enabled ? 'bg-[#8B1E3F]' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={rule.enabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
            ${rule.enabled 
              ? 'ltr:translate-x-6 rtl:-translate-x-6' 
              : 'ltr:translate-x-1 rtl:translate-x-1'
            }`}
        />
      </button>

      {/* Right: Customize */}
      <button
        onClick={onCustomize}
        className="text-sm font-medium text-[#8B1E3F] hover:text-[#6B1630] transition-colors flex-shrink-0 ml-4"
      >
        {t('settings.notifications.customize')}
      </button>
    </div>
  )
}