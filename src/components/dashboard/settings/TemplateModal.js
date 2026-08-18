// src/components/dashboard/settings/TemplateModal.js
'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X, CheckCheck, Send, Loader2, AlertCircle,
  MessageCircle, Mail, RotateCcw,
} from 'lucide-react'
import {
  sendTestNotification, fetchMyTemplate, saveMyTemplate, deleteMyTemplate,
} from '@/lib/notificationApi'

const EMAIL_LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'ar', label: 'العربية' },
  { key: 'ur', label: 'اردو' },
]

const SOURCE_BADGES = {
  tenant: { label: 'Customized', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  platform: { label: 'Platform default', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  db: { label: 'Platform default', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  registry_default: { label: 'System default', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
}

// ─── Variables available in templates ────────────────────────
// const VARIABLE_GROUPS = {
//   reservations: [
//     { key: 'customer_name', label: 'Customer Name' },
//     { key: 'booking_number', label: 'Booking #' },
//     { key: 'service_name', label: 'Service' },
//     { key: 'date', label: 'Date' },
//     { key: 'time', label: 'Time' },
//     { key: 'duration', label: 'Duration' },
//     { key: 'amount', label: 'Amount' },
//     { key: 'currency', label: 'Currency' },
//     { key: 'meeting_url', label: 'Meeting URL' },
//     { key: 'provider_name', label: 'Provider' },
//     { key: 'business_name', label: 'Business Name' },
//     { key: 'reason', label: 'Reason' },
//   ],
//   orders: [
//     { key: 'customer_name', label: 'Customer Name' },
//     { key: 'order_number', label: 'Order #' },
//     { key: 'service_name', label: 'Service' },
//     { key: 'amount', label: 'Amount' },
//     { key: 'currency', label: 'Currency' },
//     { key: 'delivery_days', label: 'Delivery Days' },
//     { key: 'provider_name', label: 'Provider' },
//     { key: 'business_name', label: 'Business Name' },
//     { key: 'revisions_used', label: 'Revisions Used' },
//     { key: 'revisions_allowed', label: 'Revisions Allowed' },
//     { key: 'reason', label: 'Reason' },
//     { key: 'refund_amount', label: 'Refund Amount' },
//   ],
//   subscriptions: [
//     { key: 'admin_name', label: 'Admin Name' },
//     { key: 'plan_name', label: 'Plan Name' },
//     { key: 'business_name', label: 'Business Name' },
//     { key: 'days_remaining', label: 'Days Remaining' },
//     { key: 'next_billing_date', label: 'Next Billing' },
//   ],
//   platform: [
//     { key: 'date', label: 'Date' },
//     { key: 'new_bookings', label: 'New Bookings' },
//     { key: 'new_orders', label: 'New Orders' },
//     { key: 'revenue', label: 'Revenue' },
//     { key: 'currency', label: 'Currency' },
//     { key: 'new_customers', label: 'New Customers' },
//     { key: 'today_bookings', label: "Today's Bookings" },
//     { key: 'business_name', label: 'Business Name' },
//     { key: 'customer_name', label: 'Customer Name' },
//     { key: 'customer_email', label: 'Customer Email' },
//   ],
// }

// ─── Sample data for preview ────────────────────────────────
const SAMPLE_DATA = {
  customer_name: 'Ahmed Al-Rashid',
  booking_number: 'BKG-260412-A1B2C3',
  order_number: 'ORD-260412-X9Y8Z7',
  service_name: 'Logo Design',
  date: 'April 15, 2026',
  time: '02:30 PM',
  duration: '60',
  amount: '150.00',
  currency: 'USD',
  meeting_url: 'https://meet.google.com/abc-def-ghi',
  booking_url:
  'https://booking.example.com/my-booking/BKG-260412-A1B2C3',
  provider_name: 'Sara Ahmed',
  business_name: 'Creative Studio',
  delivery_days: '5',
  revisions_used: '1',
  revisions_allowed: '3',
  reason: 'Schedule conflict',
  refund_amount: '150.00',
  admin_name: 'Admin User',
  plan_name: 'Professional',
  days_remaining: '3',
  next_billing_date: 'May 12, 2026',
  new_bookings: '12',
  new_orders: '8',
  revenue: '2,450.00',
  new_customers: '5',
  today_bookings: '4',
  customer_email: 'ahmed@example.com',
  sender_name: 'Ahmed',
  message_preview: 'Hi, I have a question...',
}

export default function TemplateModal({ rule,registryEvent, onClose, onSave, activeTenant }) {

  const [activeChannel, setActiveChannel] = useState('whatsapp')
  const [template, setTemplate] = useState(rule.template || '')
  const [testPhone, setTestPhone] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const textareaRef = useRef(null)

  // ── Email templates (Phase 5: tenant-owned NotificationTemplate
  //    rows, per language, fetched/saved via my-templates API) ──
  const [emailLang, setEmailLang] = useState('en')
  const [emailDrafts, setEmailDrafts] = useState(null) // {en:{subject,body_html,source}, ...}
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState(null)
  const emailBodyRef = useRef(null)

  useEffect(() => {
    if (activeChannel !== 'email' || emailDrafts || !activeTenant) return
    setEmailLoading(true)
    fetchMyTemplate(activeTenant, rule.event, 'email')
      .then((data) => setEmailDrafts(data.languages || {}))
      .catch((err) => setEmailMsg({ success: false, message: err.message }))
      .finally(() => setEmailLoading(false))
  }, [activeChannel, activeTenant, rule.event]) // eslint-disable-line react-hooks/exhaustive-deps

  const draft = emailDrafts?.[emailLang] || null

  const setDraftField = (field, value) => {
    setEmailDrafts((prev) => ({
      ...prev,
      [emailLang]: { ...(prev?.[emailLang] || {}), [field]: value, dirty: true },
    }))
  }

  const handleEmailSave = async () => {
    if (!draft) return
    setEmailSaving(true)
    setEmailMsg(null)
    try {
      const saved = await saveMyTemplate(activeTenant, {
        event: rule.event,
        channel: 'email',
        language: emailLang,
        subject: draft.subject || '',
        body_html: draft.body_html || '',
      })
      setEmailDrafts((prev) => ({ ...prev, [emailLang]: { ...saved, source: 'tenant' } }))
      setEmailMsg({ success: true, message: 'Email template saved.' })
    } catch (err) {
      setEmailMsg({ success: false, message: err.message })
    } finally {
      setEmailSaving(false)
    }
  }

  const handleEmailReset = async () => {
    setEmailSaving(true)
    setEmailMsg(null)
    try {
      await deleteMyTemplate(activeTenant, rule.event, 'email', emailLang)
      const data = await fetchMyTemplate(activeTenant, rule.event, 'email')
      setEmailDrafts(data.languages || {})
      setEmailMsg({ success: true, message: 'Reverted to default.' })
    } catch (err) {
      setEmailMsg({ success: false, message: err.message })
    } finally {
      setEmailSaving(false)
    }
  }

  const insertEmailVariable = (key) => {
    const el = emailBodyRef.current
    const tag = `{{${key}}}`
    if (!el) {
      setDraftField('body_html', (draft?.body_html || '') + tag)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const body = draft?.body_html || ''
    setDraftField('body_html', body.slice(0, start) + tag + body.slice(end))
    setTimeout(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + tag.length
    }, 0)
  }

  // const variables = VARIABLE_GROUPS[rule.category] || VARIABLE_GROUPS.reservations

  const variables = registryEvent?.variables || []

  // ── Preview rendering ──
  const renderPreview = (text) => {
    let result = text || ''

    // Handle {% if var %}...{% endif %}
    result = result.replace(
      /\{%\s*if\s+(\w+)\s*%\}(.*?)\{%\s*endif\s*%\}/gs,
      (_, varName, content) => {
        if (SAMPLE_DATA[varName]) {
          let rendered = content
          for (const [k, v] of Object.entries(SAMPLE_DATA)) {
            rendered = rendered.replaceAll(`{{${k}}}`, v)
          }
          return rendered
        }
        return ''
      }
    )

    // Replace {{variables}}
    for (const [k, v] of Object.entries(SAMPLE_DATA)) {
      result = result.replaceAll(`{{${k}}}`, v)
    }

    // Clean unreplaced
    result = result.replace(/\{\{[^}]+\}\}/g, '')
    result = result.replace(/\n{3,}/g, '\n\n').trim()

    return result
  }

  // ── Insert variable at cursor ──
  const insertVariable = (key) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const tag = `{{${key}}}`
    const newVal = template.slice(0, start) + tag + template.slice(end)
    setTemplate(newVal)
    setTimeout(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + tag.length
    }, 0)
  }

  // ── Send test notification ──
  const handleTest = async () => {
    if (!testPhone.trim()) return
    setTesting(true)
    setTestResult(null)
    try {
      const data = await sendTestNotification(activeTenant, rule.event, testPhone.trim())
      setTestResult({ success: true, message: 'Test sent!' })
    } catch (err) {
      setTestResult({ success: false, message: err.message })
    } finally {
      setTesting(false)
    }
  }

  const preview = renderPreview(template)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* ═══ HEADER ═══ */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Customize Notification</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {rule.event_label} → {rule.receiver}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          {/* Channel tabs */}
          <div className="flex items-center gap-0 mt-3">
            {[
              { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
              { key: 'email', label: 'Email', icon: Mail },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveChannel(key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeChannel === key
                    ? 'border-[#8B1E3F] text-[#8B1E3F]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeChannel === 'email' ? (
            emailLoading || !emailDrafts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-[#8B1E3F]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: Email editor */}
                <div className="space-y-4">
                  {/* Language pills */}
                  <div className="flex items-center gap-2">
                    {EMAIL_LANGUAGES.map((l) => (
                      <button
                        key={l.key}
                        onClick={() => setEmailLang(l.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          emailLang === l.key
                            ? 'bg-[#8B1E3F] text-white border-[#8B1E3F]'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                    {draft?.source && SOURCE_BADGES[draft.source] && (
                      <span className={`ml-auto px-2 py-0.5 rounded-md border text-[11px] font-medium ${SOURCE_BADGES[draft.source].cls}`}>
                        {SOURCE_BADGES[draft.source].label}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1.5">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={draft?.subject || ''}
                      onChange={(e) => setDraftField('subject', e.target.value)}
                      dir={emailLang === 'en' ? 'ltr' : 'rtl'}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm"
                      placeholder="Email subject…"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 block mb-1.5">
                      Body
                    </label>
                    <textarea
                      ref={emailBodyRef}
                      value={draft?.body_html || ''}
                      onChange={(e) => setDraftField('body_html', e.target.value)}
                      rows={12}
                      dir={emailLang === 'en' ? 'ltr' : 'rtl'}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm font-mono resize-none"
                      placeholder="Plain text or HTML — it's wrapped in your branded email layout automatically."
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Insert Variable
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {variables.map((v) => (
                        <button
                          key={v.key}
                          onClick={() => insertEmailVariable(v.key)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 bg-gray-50 hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 hover:text-[#8B1E3F] transition-colors"
                        >
                          {`{{${v.key}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Email preview */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700">
                    Email Preview
                  </label>
                  <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider">Subject</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {renderPreview(draft?.subject || '') || '—'}
                      </p>
                    </div>
                    <div
                      className="bg-white px-4 py-4 min-h-[240px] text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                      dir={emailLang === 'en' ? 'ltr' : 'rtl'}
                    >
                      {renderPreview((draft?.body_html || '').replace(/<[^>]+>/g, '')) || (
                        <span className="text-gray-400 text-xs">Type a template to see preview</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700 leading-relaxed">
                      <span className="font-bold">Tip:</span> The final email is wrapped
                      in your branded layout (logo colour, RTL for Arabic/Urdu, action
                      button) automatically — write just the message content here.
                    </div>
                  </div>
                  {emailMsg && (
                    <p className={`text-xs ${emailMsg.success ? 'text-green-600' : 'text-red-600'}`}>
                      {emailMsg.message}
                    </p>
                  )}
                </div>
              </div>
            )
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT: Template Editor */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700">
                Message Template
              </label>

              <textarea
                ref={textareaRef}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm font-mono resize-none"
                placeholder="Enter your WhatsApp notification template..."
              />

              <div className="text-xs text-gray-400 text-right">
                {template.length} characters
              </div>

              {/* Variable buttons */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Insert Variable
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {variables.map((v) => (
                    <button
                      key={v.key}
                      onClick={() => insertVariable(v.key)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 bg-gray-50 hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 hover:text-[#8B1E3F] transition-colors"
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test send */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Send Test Message
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Phone with country code (e.g. 917873445018)"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-[#8B1E3F] focus:ring-1 focus:ring-[#8B1E3F]/20 outline-none"
                  />
                  <button
                    onClick={handleTest}
                    disabled={testing || !testPhone.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B1E3F] text-white text-sm font-medium hover:bg-[#6B1630] disabled:opacity-50 transition-colors"
                  >
                    {testing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Test
                  </button>
                </div>
                {testResult && (
                  <p className={`text-xs mt-1.5 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.message}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: WhatsApp Preview */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">
                WhatsApp Preview
              </label>

              {/* Phone frame */}
              <div className="bg-[#0b141a] rounded-2xl overflow-hidden shadow-xl">
                {/* WA header */}
                <div className="bg-[#1f2c34] px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#8B1E3F] flex items-center justify-center text-white text-xs font-bold">
                    B
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Business</p>
                    <p className="text-gray-400 text-[10px]">online</p>
                  </div>
                </div>

                {/* Chat */}
                <div className="min-h-[280px] max-h-[360px] overflow-y-auto p-3 flex flex-col justify-end">
                  {preview ? (
                    <div className="max-w-[90%] ml-auto">
                      <div className="bg-[#005c4b] rounded-xl rounded-tr-sm px-3 py-2">
                        <p className="text-white text-[13px] whitespace-pre-wrap break-words leading-relaxed">
                          {preview}
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-green-300/70">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center text-xs py-16">
                      Type a template to see preview
                    </p>
                  )}
                </div>

                {/* Input bar */}
                <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
                  <div className="flex-1 h-8 rounded-full bg-[#2a3942] px-3 flex items-center">
                    <span className="text-gray-500 text-xs">Type a message</span>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 leading-relaxed">
                  <span className="font-bold">Tip:</span> Use <code className="bg-blue-100 px-1 rounded">{'{{variable}}'}</code> to
                  insert dynamic data. Use <code className="bg-blue-100 px-1 rounded">{'{% if var %}...{% endif %}'}</code> for
                  conditional content (e.g., show meeting link only when it exists).
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          {activeChannel === 'email' ? (
            <>
              <button
                onClick={handleEmailReset}
                disabled={emailSaving || draft?.source !== 'tenant'}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to Default
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm"
                >
                  Close
                </button>
                <button
                  onClick={handleEmailSave}
                  disabled={emailSaving || !draft}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md font-medium text-sm disabled:opacity-50"
                >
                  {emailSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Email Template
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setTemplate(rule.template || '')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Reset to Default
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSave(template)}
                  className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md font-medium text-sm"
                >
                  Save Template
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}