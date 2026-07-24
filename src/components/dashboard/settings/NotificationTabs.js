// src/components/dashboard/settings/NotificationTabs.js
'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { fetchNotificationDefaults, fetchNotificationRegistry } from '@/lib/notificationApi'
import NotificationRow from './NotificationRow'
import TemplateModal from './TemplateModal'
import { Loader2, MessageCircle, Mail } from 'lucide-react'

// Static fallback while the registry loads (or if the endpoint is
// unreachable). The authoritative list comes from
// GET /notifications/registry/?scope=tenant so a new backend
// category shows up here without a frontend deploy.
const FALLBACK_CATEGORIES = [
  { key: 'reservations', labelKey: 'settings.notifications.categories.reservations' },
  { key: 'orders', labelKey: 'settings.notifications.categories.orders' },
  { key: 'requests', labelKey: 'settings.notifications.categories.requests' },
  { key: 'platform', labelKey: 'settings.notifications.categories.platform' },
]

const RECEIVER_CONFIG = {
  admin: { labelKey: 'settings.notifications.receivers.admin' },
  customer: { labelKey: 'settings.notifications.receivers.customer' },
  provider: { labelKey: 'settings.notifications.receivers.provider' },
}

/**
 * Phase 4 (notifications architecture review): the preferences
 * MATRIX. rules is a flat list of {event, receiver, channel,
 * enabled, template} rows — one per (event, receiver, channel).
 * We render one visual row per (event, receiver) with an
 * independent toggle per channel.
 */
export default function NotificationTabs({ rules, onChange }) {
  const { activeTenant, t } = useApp()
  const [activeCategory, setActiveCategory] = useState('reservations')
  const [editingRule, setEditingRule] = useState(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)
  const [registryEvents, setRegistryEvents] = useState([])

  // Category tabs come from the backend registry so the settings
  // screen never drifts from notification_registry.py again.
  useEffect(() => {
    if (!activeTenant) return
    let cancelled = false
    fetchNotificationRegistry(activeTenant, 'tenant')
    .then((data) => {
      if (cancelled) return

      setRegistryEvents(data.events || [])

      if (Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(
          data.categories.map((key) => ({
            key,
            labelKey: `settings.notifications.categories.${key}`,
          })),
        )
      }
    })
      .catch(() => { /* fallback list stays */ })
    return () => { cancelled = true }
  }, [activeTenant])

  // Seed defaults when the tenant has no rules (or pre-registry
  // underscore-format rules).
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

  // Matrix upgrade for rules loaded before the backend synced them:
  // synthesize the missing email rows client-side, inheriting each
  // event's WhatsApp toggle (mirrors backend sync_notification_rules
  // so behaviour doesn't change).
  useEffect(() => {
    if (!rules || rules.length === 0) return
    if (rules.some((r) => r.channel === 'email')) return
    const emailRows = rules
      .filter((r) => r.channel === 'whatsapp')
      .map((r) => ({
        ...r,
        id: `${r.event}:${r.receiver}:email`,
        channel: 'email',
        template: '',
      }))
    if (emailRows.length > 0) onChange([...rules, ...emailRows])
  }, [rules]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Group into matrix rows: one per (event, receiver) ──
  const categoryRules = (rules || []).filter((r) => r.category === activeCategory)

  const pairKey = (r) => `${r.event}:${r.receiver}`
  const pairs = new Map()
  for (const r of categoryRules) {
    if (!pairs.has(pairKey(r))) {
      pairs.set(pairKey(r), { event: r.event, receiver: r.receiver, wa: null, email: null })
    }
    const pair = pairs.get(pairKey(r))
    if (r.channel === 'whatsapp') pair.wa = r
    if (r.channel === 'email') pair.email = r
  }

  const grouped = {}
  for (const receiver of ['admin', 'customer', 'provider']) {
    const receiverPairs = [...pairs.values()].filter((p) => p.receiver === receiver)
    if (receiverPairs.length > 0) grouped[receiver] = receiverPairs
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

  // Phase 6: delivery mode per (event, receiver). The channel with
  // `fallback: true` sits in standby and only fires when the other
  // channel's delivery terminally fails.
  const handleModeChange = (pair, mode) => {
    const patch = {}
    if (mode === 'wa_first') {
      if (pair.wa) patch[pair.wa.id] = { enabled: true, fallback: false }
      if (pair.email) patch[pair.email.id] = { enabled: true, fallback: true }
    } else if (mode === 'email_first') {
      if (pair.email) patch[pair.email.id] = { enabled: true, fallback: false }
      if (pair.wa) patch[pair.wa.id] = { enabled: true, fallback: true }
    } else {
      if (pair.wa) patch[pair.wa.id] = { fallback: false }
      if (pair.email) patch[pair.email.id] = { fallback: false }
    }
    const updated = (rules || []).map((r) =>
      patch[r.id] ? { ...r, ...patch[r.id] } : r
    )
    onChange(updated)
  }

  // Enable/disable every channel row for a receiver section.
  const handleToggleAll = (receiver, enable) => {
    const ids = new Set(
      (grouped[receiver] || []).flatMap((p) => [p.wa?.id, p.email?.id]).filter(Boolean)
    )
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
          {categories.map((cat) => {
            const count = new Set(
              (rules || [])
                .filter((r) => r.category === cat.key)
                .map((r) => `${r.event}:${r.receiver}`)
            ).size

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
          {Object.entries(grouped).map(([receiver, receiverPairs]) => {
            const config = RECEIVER_CONFIG[receiver]
            if (!config) return null

            const allRules = receiverPairs.flatMap((p) => [p.wa, p.email]).filter(Boolean)
            const allEnabled = allRules.every((r) => r.enabled)

            return (
              <div key={receiver} className="mb-6">
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-5 py-3.5 rounded-t-lg">
                  <h3 className="text-sm font-bold text-gray-900">
                    {t(config.labelKey)}
                  </h3>
                  <div className="flex items-center gap-4">
                    {/* Channel column legend */}
                    <span className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {t('settings.notifications.channels.whatsapp')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#8B1E3F]" />
                        {t('settings.notifications.channels.email')}
                      </span>
                    </span>
                    <button
                      onClick={() => handleToggleAll(receiver, !allEnabled)}
                      className="text-xs font-medium text-[#8B1E3F] hover:text-[#6B1630]"
                    >
                      {allEnabled ? t('settings.notifications.disableAll') : t('settings.notifications.enableAll')}
                    </button>
                  </div>
                </div>

                <div className="border border-t-0 border-gray-200 rounded-b-lg bg-white divide-y divide-dashed divide-gray-200">
                  {receiverPairs.map((pair) => (
                    <NotificationRow
                      key={`${pair.event}:${pair.receiver}`}
                      waRule={pair.wa}
                      emailRule={pair.email}
                      onToggleWa={() => pair.wa && handleToggle(pair.wa.id)}
                      onToggleEmail={() => pair.email && handleToggle(pair.email.id)}
                      onModeChange={(mode) => handleModeChange(pair, mode)}
                      onCustomize={() => pair.wa && setEditingRule(pair.wa)}
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
          registryEvent={
              registryEvents.find(
                  e => e.event === editingRule.event
              )
          }
          onClose={() => setEditingRule(null)}
          onSave={handleSaveTemplate}
          activeTenant={activeTenant}
      />
      )}
    </div>
  )
}
