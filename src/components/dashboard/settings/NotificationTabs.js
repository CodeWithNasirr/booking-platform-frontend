// src/components/dashboard/settings/NotificationTabs.js
'use client'

import { useState } from 'react'
import {
  Calendar, ShoppingBag, CreditCard, Bell,
  Shield, Users, Briefcase, ChevronDown, ChevronRight,
} from 'lucide-react'
import NotificationRow from './NotificationRow'
import TemplateModal from './TemplateModal'

const CATEGORIES = [
  { key: 'reservations', label: 'Reservations', icon: Calendar },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
]

const RECEIVER_CONFIG = {
  admin: { label: 'Admin Notifications', icon: Shield, color: 'border-purple-200 bg-purple-50/50' },
  customer: { label: 'Customer Notifications', icon: Users, color: 'border-blue-200 bg-blue-50/50' },
  provider: { label: 'Provider Notifications', icon: Briefcase, color: 'border-emerald-200 bg-emerald-50/50' },
}

export default function NotificationTabs({ rules, onChange }) {
  const [activeCategory, setActiveCategory] = useState('reservations')
  const [expandedSections, setExpandedSections] = useState({ admin: true, customer: true, provider: true })
  const [editingRule, setEditingRule] = useState(null)

  // Filter rules by active category
  const categoryRules = rules.filter((r) => r.category === activeCategory)

  // Group by receiver
  const grouped = {}
  for (const receiver of ['admin', 'customer', 'provider']) {
    grouped[receiver] = categoryRules.filter((r) => r.receiver === receiver)
  }

  // Toggle a single rule on/off
  const handleToggle = (ruleId) => {
    const updated = rules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    )
    onChange(updated)
  }

  // Save template from modal
  const handleSaveTemplate = (template) => {
    const updated = rules.map((r) =>
      r.id === editingRule.id ? { ...r, template } : r
    )
    onChange(updated)
    setEditingRule(null)
  }

  // Toggle all rules for a receiver in this category
  const handleToggleAll = (receiver, enable) => {
    const ids = grouped[receiver].map((r) => r.id)
    const updated = rules.map((r) =>
      ids.includes(r.id) ? { ...r, enabled: enable } : r
    )
    onChange(updated)
  }

  const toggleSection = (receiver) => {
    setExpandedSections((prev) => ({ ...prev, [receiver]: !prev[receiver] }))
  }

  return (
    <div className="space-y-6">
      {/* Category sub-tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const count = rules.filter((r) => r.category === cat.key && r.enabled).length
          const total = rules.filter((r) => r.category === cat.key).length

          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-white text-[#8B1E3F] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                {count}/{total}
              </span>
            </button>
          )
        })}
      </div>

      {/* Receiver sections */}
      {Object.entries(grouped).map(([receiver, receiverRules]) => {
        if (receiverRules.length === 0) return null

        const config = RECEIVER_CONFIG[receiver]
        const Icon = config.icon
        const expanded = expandedSections[receiver]
        const enabledCount = receiverRules.filter((r) => r.enabled).length
        const allEnabled = enabledCount === receiverRules.length

        // Group by event (collect all channels for same event)
        const byEvent = {}
        for (const rule of receiverRules) {
          if (!byEvent[rule.event]) byEvent[rule.event] = []
          byEvent[rule.event].push(rule)
        }

        return (
          <div key={receiver} className={`rounded-xl border overflow-hidden ${config.color}`}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(receiver)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <Icon className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-bold text-gray-900">{config.label}</span>
                <span className="text-xs text-gray-500">
                  {enabledCount} of {receiverRules.length} active
                </span>
              </div>

              {/* Enable/disable all */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleAll(receiver, !allEnabled)
                }}
                className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-[#8B1E3F] cursor-pointer"
              >
                {allEnabled ? 'Disable All' : 'Enable All'}
              </div>
            </button>

            {/* Rules */}
            {expanded && (
              <div className="bg-white border-t border-gray-100">
                {Object.entries(byEvent).map(([event, eventRules]) => (
                  <div key={event} className="border-b border-gray-50 last:border-0">
                    {eventRules.map((rule) => (
                      <NotificationRow
                        key={rule.id}
                        rule={rule}
                        onToggle={handleToggle}
                        onCustomize={setEditingRule}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Template editing modal */}
      {editingRule && (
        <TemplateModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  )
}