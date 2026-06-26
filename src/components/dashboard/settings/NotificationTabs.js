// // src/components/dashboard/settings/NotificationTabs.js
'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { fetchNotificationDefaults } from '@/lib/notificationApi'
import NotificationRow from './NotificationRow'
import TemplateModal from './TemplateModal'
import { Loader2 } from 'lucide-react'

const CATEGORIES = [
  { key: 'reservations', labelKey: 'settings.notifications.categories.reservations' },
  { key: 'orders', labelKey: 'settings.notifications.categories.orders' },
  // { key: 'subscriptions', labelKey: 'settings.notifications.categories.subscriptions' },
  { key: 'platform', labelKey: 'settings.notifications.categories.platform' },
]

const RECEIVER_CONFIG = {
  admin: { labelKey: 'settings.notifications.receivers.admin' },
  customer: { labelKey: 'settings.notifications.receivers.customer' },
  provider: { labelKey: 'settings.notifications.receivers.provider' },
}

export default function NotificationTabs({ rules, onChange }) {
  const { activeTenant, t } = useApp()
  const [activeCategory, setActiveCategory] = useState('reservations')
  const [editingRule, setEditingRule] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeTenant) return

    const needsSeed = !rules || rules.length === 0
    const needsMigration = rules && rules.length > 0 && rules[0]?.event && !rules[0].event.includes('.')

    if (!needsSeed && !needsMigration) return

    setLoading(true)
    fetchNotificationDefaults(activeTenant)
      .then((data) => {
        if (data.rules && data.rules.length > 0) {
          onChange(data.rules)
        }
      })
      .catch((err) => console.error('Failed to fetch notification defaults:', err))
      .finally(() => setLoading(false))
  }, [activeTenant]) // eslint-disable-line react-hooks/exhaustive-deps

  const categoryRules = (rules || []).filter(
    (r) => r.category === activeCategory && r.channel === 'whatsapp'
  )

  const grouped = {}
  for (const receiver of ['admin', 'customer', 'provider']) {
    const receiverRules = categoryRules.filter((r) => r.receiver === receiver)
    if (receiverRules.length > 0) {
      grouped[receiver] = receiverRules
    }
  }

  const handleToggle = (ruleId) => {
    const updated = (rules || []).map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    )
    onChange(updated)
  }

  const handleSaveTemplate = (template) => {
    const updated = (rules || []).map((r) =>
      r.id === editingRule.id ? { ...r, template } : r
    )
    onChange(updated)
    setEditingRule(null)
  }

  const handleToggleAll = (receiver, enable) => {
    const ids = new Set((grouped[receiver] || []).map((r) => r.id))
    const updated = (rules || []).map((r) =>
      ids.has(r.id) ? { ...r, enabled: enable } : r
    )
    onChange(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-[#8B1E3F]" />
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="border-b border-gray-200">
        <div className="flex items-center gap-0 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const count = (rules || []).filter(
              (r) => r.category === cat.key && r.channel === 'whatsapp'
            ).length

            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeCategory === cat.key
                    ? 'border-[#8B1E3F] text-[#8B1E3F]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t(cat.labelKey)}
                {count > 0 && (
                  <span className="ml-1.5 text-xs text-gray-400">({count})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          {t('settings.notifications.noNotifications')}
        </div>
      ) : (
        <div className="mt-4">
          {Object.entries(grouped).map(([receiver, receiverRules]) => {
            const config = RECEIVER_CONFIG[receiver]
            if (!config) return null

            const enabledCount = receiverRules.filter((r) => r.enabled).length
            const allEnabled = enabledCount === receiverRules.length

            return (
              <div key={receiver} className="mb-6">
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-5 py-3.5 rounded-t-lg">
                  <h3 className="text-sm font-bold text-gray-900">
                    {t(config.labelKey)}
                  </h3>
                  <button
                    onClick={() => handleToggleAll(receiver, !allEnabled)}
                    className="text-xs font-medium text-[#8B1E3F] hover:text-[#6B1630]"
                  >
                    {allEnabled ? t('settings.notifications.disableAll') : t('settings.notifications.enableAll')}
                  </button>
                </div>

                <div className="border border-t-0 border-gray-200 rounded-b-lg bg-white divide-y divide-dashed divide-gray-200">
                  {receiverRules.map((rule) => (
                    <NotificationRow
                      key={rule.id}
                      rule={rule}
                      onToggle={() => handleToggle(rule.id)}
                      onCustomize={() => setEditingRule(rule)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editingRule && (
        <TemplateModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={handleSaveTemplate}
          activeTenant={activeTenant}
        />
      )}
    </div>
  )
}




// 'use client'

// import { useState, useEffect } from 'react'
// import { useApp } from '@/contexts/AppContext'
// import { fetchNotificationDefaults } from '@/lib/notificationApi'
// import NotificationRow from './NotificationRow'
// import TemplateModal from './TemplateModal'
// import { Loader2 } from 'lucide-react'

// // ─── Categories MUST match notification_registry.py ──────────
// const CATEGORIES = [
//   { key: 'reservations', label: 'Reservations' },
//   { key: 'orders', label: 'Orders' },
//   { key: 'subscriptions', label: 'Subscriptions' },
//   { key: 'platform', label: 'Platform' },
// ]

// // ─── Receiver section headers (Rekaz-style yellow) ──────────
// const RECEIVER_CONFIG = {
//   admin: { label: 'Admin Notifications' },
//   customer: { label: 'Customers Notifications' },
//   provider: { label: 'Provider Notifications' },
// }

// export default function NotificationTabs({ rules, onChange }) {
//   const { activeTenant } = useApp()
//   const [activeCategory, setActiveCategory] = useState('reservations')
//   const [editingRule, setEditingRule] = useState(null)
//   const [loading, setLoading] = useState(false)

//   // ── Seed defaults if no rules or rules use old format ──
//   useEffect(() => {
//     if (!activeTenant) return

//     // Check if rules need migration
//     const needsSeed = !rules || rules.length === 0
//     const needsMigration = rules && rules.length > 0 && rules[0]?.event && !rules[0].event.includes('.')

//     if (!needsSeed && !needsMigration) return

//     setLoading(true)
//     fetchNotificationDefaults(activeTenant)
//       .then((data) => {
//         if (data.rules && data.rules.length > 0) {
//           onChange(data.rules)
//         }
//       })
//       .catch((err) => console.error('Failed to fetch notification defaults:', err))
//       .finally(() => setLoading(false))
//   }, [activeTenant]) // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Filter by category + WhatsApp channel ──
//   const categoryRules = (rules || []).filter(
//     (r) => r.category === activeCategory && r.channel === 'whatsapp'
//   )

//   // ── Group by receiver (admin → customer → provider) ──
//   const grouped = {}
//   for (const receiver of ['admin', 'customer', 'provider']) {
//     const receiverRules = categoryRules.filter((r) => r.receiver === receiver)
//     if (receiverRules.length > 0) {
//       grouped[receiver] = receiverRules
//     }
//   }

//   // ── Toggle on/off ──
//   const handleToggle = (ruleId) => {
//     const updated = (rules || []).map((r) =>
//       r.id === ruleId ? { ...r, enabled: !r.enabled } : r
//     )
//     onChange(updated)
//   }

//   // ── Save template from modal ──
//   const handleSaveTemplate = (template) => {
//     const updated = (rules || []).map((r) =>
//       r.id === editingRule.id ? { ...r, template } : r
//     )
//     onChange(updated)
//     setEditingRule(null)
//   }

//   // ── Enable/disable all for a receiver ──
//   const handleToggleAll = (receiver, enable) => {
//     const ids = new Set((grouped[receiver] || []).map((r) => r.id))
//     const updated = (rules || []).map((r) =>
//       ids.has(r.id) ? { ...r, enabled: enable } : r
//     )
//     onChange(updated)
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-16">
//         <Loader2 className="w-5 h-5 animate-spin text-[#8B1E3F]" />
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-0">
//       {/* ═══ CATEGORY TABS (Rekaz: flat underlined) ═══ */}
//       <div className="border-b border-gray-200">
//         <div className="flex items-center gap-0 overflow-x-auto">
//           {CATEGORIES.map((cat) => {
//             const count = (rules || []).filter(
//               (r) => r.category === cat.key && r.channel === 'whatsapp'
//             ).length

//             return (
//               <button
//                 key={cat.key}
//                 onClick={() => setActiveCategory(cat.key)}
//                 className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
//                   activeCategory === cat.key
//                     ? 'border-[#8B1E3F] text-[#8B1E3F]'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 {cat.label}
//                 {count > 0 && (
//                   <span className="ml-1.5 text-xs text-gray-400">({count})</span>
//                 )}
//               </button>
//             )
//           })}
//         </div>
//       </div>

//       {/* ═══ RECEIVER SECTIONS ═══ */}
//       {Object.keys(grouped).length === 0 ? (
//         <div className="py-12 text-center text-sm text-gray-500">
//           No WhatsApp notifications for this category.
//         </div>
//       ) : (
//         <div className="mt-4">
//           {Object.entries(grouped).map(([receiver, receiverRules]) => {
//             const config = RECEIVER_CONFIG[receiver]
//             if (!config) return null

//             const enabledCount = receiverRules.filter((r) => r.enabled).length
//             const allEnabled = enabledCount === receiverRules.length

//             return (
//               <div key={receiver} className="mb-6">
//                 {/* Section Header (Rekaz: yellow/cream bg) */}
//                 <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-5 py-3.5 rounded-t-lg">
//                   <h3 className="text-sm font-bold text-gray-900">
//                     {config.label}
//                   </h3>
//                   <button
//                     onClick={() => handleToggleAll(receiver, !allEnabled)}
//                     className="text-xs font-medium text-[#8B1E3F] hover:text-[#6B1630]"
//                   >
//                     {allEnabled ? 'Disable All' : 'Enable All'}
//                   </button>
//                 </div>

//                 {/* Rows */}
//                 <div className="border border-t-0 border-gray-200 rounded-b-lg bg-white divide-y divide-dashed divide-gray-200">
//                   {receiverRules.map((rule) => (
//                     <NotificationRow
//                       key={rule.id}
//                       rule={rule}
//                       onToggle={() => handleToggle(rule.id)}
//                       onCustomize={() => setEditingRule(rule)}
//                     />
//                   ))}
//                 </div>
//               </div>
//             )
//           })}
//         </div>
//       )}

//       {/* ═══ TEMPLATE MODAL ═══ */}
//       {editingRule && (
//         <TemplateModal
//           rule={editingRule}
//           onClose={() => setEditingRule(null)}
//           onSave={handleSaveTemplate}
//           activeTenant={activeTenant}
//         />
//       )}
//     </div>
//   )
// }