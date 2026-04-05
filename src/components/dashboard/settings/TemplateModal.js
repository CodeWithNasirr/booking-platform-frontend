// src/components/dashboard/settings/TemplateModal.js
'use client'

import { useState, useRef } from 'react'
import { X, Eye, Code, Copy, Check } from 'lucide-react'
import { renderTemplate, PREVIEW_DATA } from '@/lib/settingsApi'

const VARIABLES = [
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'booking_number', label: 'Booking #' },
  { key: 'order_number', label: 'Order #' },
  { key: 'service_name', label: 'Service Name' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'provider_name', label: 'Provider Name' },
  { key: 'tenant_name', label: 'Business Name' },
  { key: 'amount', label: 'Amount' },
]

export default function TemplateModal({ rule, onClose, onSave }) {
  const [template, setTemplate] = useState(rule.template || '')
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef(null)

  const preview = renderTemplate(template, PREVIEW_DATA)

  const insertVariable = (varKey) => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const text = `{{${varKey}}}`
    const newVal = template.slice(0, start) + text + template.slice(end)
    setTemplate(newVal)

    // Restore cursor position after React re-render
    setTimeout(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + text.length
    }, 0)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const channelLabel = rule.channel === 'email' ? 'Email' : rule.channel === 'sms' ? 'SMS' : 'WhatsApp'
  const receiverLabel = rule.receiver.charAt(0).toUpperCase() + rule.receiver.slice(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Customize Template</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {rule.event_label} → {receiverLabel} → {channelLabel}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Code className="w-4 h-4" />
                  Template Editor
                </label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#8B1E3F] transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <textarea
                ref={textareaRef}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all text-sm font-mono resize-none"
                placeholder="Enter your notification template..."
              />

              {/* Variable buttons */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Insert Variable
                </p>
                <div className="flex flex-wrap gap-2">
                  {VARIABLES.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => insertVariable(v.key)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#8B1E3F]/20 text-[#8B1E3F] bg-[#8B1E3F]/5 hover:bg-[#8B1E3F]/10 transition-colors"
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Live Preview */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Eye className="w-4 h-4" />
                Live Preview
              </label>

              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Simulated email header */}
                {rule.channel === 'email' && (
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">To:</span>
                      {rule.receiver === 'customer'
                        ? 'ahmed@example.com'
                        : rule.receiver === 'provider'
                        ? 'sara@studio.com'
                        : 'admin@creativehub.com'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">Subject:</span>
                      {rule.event_label}
                    </div>
                  </div>
                )}

                {/* Message body */}
                <div className="p-4 bg-white min-h-[200px]">
                  {rule.channel === 'sms' || rule.channel === 'whatsapp' ? (
                    <div className="max-w-xs">
                      <div className="bg-[#8B1E3F]/5 border border-[#8B1E3F]/10 rounded-2xl rounded-tl-none px-4 py-3">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {preview || 'Your message preview will appear here...'}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 ml-1">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {preview || 'Your message preview will appear here...'}
                    </p>
                  )}
                </div>
              </div>

              {/* Character count for SMS */}
              {(rule.channel === 'sms' || rule.channel === 'whatsapp') && (
                <p className="text-xs text-gray-500">
                  {template.length} characters
                  {rule.channel === 'sms' && template.length > 160 && (
                    <span className="text-amber-600 ml-2">
                      ({Math.ceil(template.length / 160)} SMS segments)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(template)}
            className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  )
}