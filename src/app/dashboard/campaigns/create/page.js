'use client'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import {
  createCampaign, updateCampaign, getCampaign,
  getAudienceCount, checkWhatsAppForCampaign,
  fetchCampaigns,
} from '../lib/campaignApi'


import {
  Save, Send, X, Loader2, Paperclip, FileText,
  Check, CheckCheck, AlertTriangle, MessageCircle,
  ArrowLeft, Image as ImageIcon, Film, Users,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";

const AUDIENCE_OPTIONS = [
  { value: 'all_customers', labelKey: 'campaigns.audience.allCustomers' },
  { value: 'active_customers', labelKey: 'campaigns.audience.activeCustomers' },
  { value: 'new_customers', labelKey: 'campaigns.audience.newCustomers' },
  { value: 'inactive_customers', labelKey: 'campaigns.audience.inactiveCustomers' },
]

const MESSAGE_TAGS = [
  { key: '{{first_name}}', labelKey: 'campaigns.tags.firstName' },
  { key: '{{last_name}}', labelKey: 'campaigns.tags.lastName' },
  { key: '{{whatsapp_name}}', labelKey: 'campaigns.tags.whatsappName' },
  { key: '{{imported_name}}', labelKey: 'campaigns.tags.importedName' },
]

const MAX_CONTENT_LENGTH = 4096

function CreateCampaignPageInner() {
  const { user, loadingUser, requiresOnboarding, activeTenant, tenants, t } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const contentRef = useRef(null)

  // Edit mode: /dashboard/campaigns/create?edit=campaign-uuid
  const editId = searchParams.get('edit')

  // ── State ──
  const [name, setName] = useState('')
  const [audience, setAudience] = useState('')
  const [content, setContent] = useState('')
  const [attachment, setAttachment] = useState(null)       // File object (new upload)
  const [existingAttachment, setExistingAttachment] = useState(null)  // URL string (edit mode)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [saving, setSaving] = useState(false)
  const [savingAs, setSavingAs] = useState(null) // 'draft' | 'send' | null
  const [errors, setErrors] = useState({})
  const [audienceCount, setAudienceCount] = useState(null)
  const [audienceLoading, setAudienceLoading] = useState(false)
  const [waStatus, setWaStatus] = useState(null) // { connected, phone, status }
  const [waLoading, setWaLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(!!editId)
  const tenantTimezone = tenants[0]?.timezone || 'UTC'
  const [scheduledAt, setScheduledAt] = useState(getDefaultDateTime(tenantTimezone))

  useBlockBackNavigation(!!user)

  // Auth guards
  useEffect(() => {
    if (!loadingUser && !user) router.replace('/')
  }, [loadingUser, user, router])

  useEffect(() => {
    if (requiresOnboarding) router.replace('/auth/onboarding?step=1')
  }, [requiresOnboarding, router])

  // ── Check WhatsApp connection on mount ──
  useEffect(() => {
    if (!activeTenant) return
    checkWhatsAppForCampaign(activeTenant)
      .then(setWaStatus)
      .catch(() => setWaStatus({ connected: false }))
      .finally(() => setWaLoading(false))
  }, [activeTenant])

  // ── Load existing campaign if edit mode ──
  useEffect(() => {
    if (!editId || !activeTenant) return
    setEditLoading(true)
    getCampaign(activeTenant, editId)
      .then((data) => {
        setName(data.name || '')
        setAudience(data.audience_type || '')
        setContent(data.content || '')
        if (data.scheduled_at) {
          setScheduledAt(
            toTenantLocalInput(data.scheduled_at, tenantTimezone)
          )
        }
        if (data.attachment) {
          setExistingAttachment(data.attachment)
        }
      })
      .catch((err) => {
        alert(t('campaigns.create.loadFailed') + err.message)
        router.push('/dashboard/campaigns')
      })
      .finally(() => setEditLoading(false))
  }, [editId, activeTenant, router, t, tenantTimezone])

  // ── Audience count (debounced) ──
  useEffect(() => {
    if (!activeTenant || !audience) {
      setAudienceCount(null)
      return
    }
    setAudienceLoading(true)
    const timer = setTimeout(() => {
      getAudienceCount(activeTenant, audience)
        .then((data) => setAudienceCount(data.count))
        .catch(() => setAudienceCount(null))
        .finally(() => setAudienceLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [activeTenant, audience])

  // ── Insert tag at cursor ──
  const insertTag = (tag) => {
    const el = contentRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newContent = content.substring(0, start) + tag + content.substring(end)
    setContent(newContent)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + tag.length, start + tag.length)
    }, 0)
  }

  function toTenantLocalInput(isoString, tenantTz) {
    if (!isoString) return ''
    return dayjs.utc(isoString).tz(tenantTz).format('YYYY-MM-DDTHH:mm')
  }
  
  function fromTenantLocalToUTC(localString, tenantTz) {
    if (!localString) return null
    return dayjs.tz(localString, tenantTz).utc().toISOString()
  }

  // ── Validate ──
  const validate = (asDraft) => {
    const e = {}
    if (!name.trim()) e.name = t('campaigns.create.nameRequired')
    if (!content.trim()) e.content = t('campaigns.create.contentRequired')
    if (!audience) e.audience = t('campaigns.create.audienceRequired')
    if (!asDraft && !termsAccepted) e.terms = t('campaigns.create.termsRequired')
    if (content.length > MAX_CONTENT_LENGTH) e.content = t('campaigns.create.contentTooLong', { current: content.length, max: MAX_CONTENT_LENGTH })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──
  const handleSubmit = async (asDraft) => {
    if (!validate(asDraft)) return

    // Check WA before send (not for draft)
    if (!asDraft && !waStatus?.connected) {
      setErrors({ terms: t('campaigns.create.waNotConnected') })
      return
    }

    setSaving(true)
    setSavingAs(asDraft ? 'draft' : 'send')
    setErrors({})

    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('content', content.trim())
      formData.append('audience_type', audience)
      if (scheduledAt) {
        const utcDate = fromTenantLocalToUTC(scheduledAt, tenantTimezone)
        formData.append('scheduled_at', utcDate)
      }

      formData.append('save_as_draft', asDraft ? 'true' : '')
      if (attachment) formData.append('attachment', attachment)

      if (editId) {
        await updateCampaign(activeTenant, editId, formData)
      } else {
        await createCampaign(activeTenant, formData)
      }

      router.push('/dashboard/campaigns')
    } catch (err) {
      if (err.data?.errors) {
        setErrors(err.data.errors)
      } else {
        setErrors({ _general: err.message })
      }
    } finally {
      setSaving(false)
      setSavingAs(null)
    }
  }

  // ── File handling ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, attachment: t('campaigns.create.fileTooLarge') }))
      return
    }

    setAttachment(file)
    setExistingAttachment(null)
    setErrors((prev) => {
      const { attachment: _, ...rest } = prev
      return rest
    })
  }

  const removeAttachment = () => {
    setAttachment(null)
    setExistingAttachment(null)
  }

  // ── Preview ──
  const previewText = content
    .replace(/\\{\\{first_name\\}\\}/g, 'Ahmed')
    .replace(/\\{\\{last_name\\}\\}/g, 'Al-Rashid')
    .replace(/\\{\\{whatsapp_name\\}\\}/g, 'Ahmed')
    .replace(/\\{\\{imported_name\\}\\}/g, 'Ahmed Al-Rashid')

  const attachmentName = attachment?.name || (existingAttachment ? existingAttachment.split('/').pop() : null)
  const attachmentIcon = attachment?.type?.startsWith('image/')
    ? ImageIcon
    : attachment?.type?.startsWith('video/')
    ? Film
    : FileText

  if (requiresOnboarding || loadingUser) return null

  if (editLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══ WA DISCONNECTED BANNER ═══ */}
      {!waLoading && !waStatus?.connected && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">{t('campaigns.create.waStopped')}</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {t('campaigns.create.waRelink')}{' '}
              <button onClick={() => router.push('/dashboard/whatsapp')} className="underline font-medium text-amber-800">
                {t('campaigns.create.here')}
              </button>{' '}
              {t('campaigns.create.toContinue')}
            </p>
            {waStatus?.phone && <p className="text-sm font-bold text-amber-900 mt-1">{waStatus.phone}</p>}
          </div>
        </div>
      )}

      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('campaigns.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('campaigns.create.breadcrumb', { action: editId ? t('campaigns.create.edit') : t('campaigns.create.create') })}
          </p>
        </div>
        <button onClick={() => router.push('/dashboard/campaigns')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm">
          <ArrowLeft className="w-4 h-4" /> {t('campaigns.create.backToCampaigns')}
        </button>
      </div>

      {/* ═══ GENERAL ERROR ═══ */}
      {errors._general && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errors._general}
        </div>
      )}

      {/* ═══ FORM ═══ */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {editId ? t('campaigns.create.editCampaign') : t('campaigns.create.newCampaign')}
          </h2>
          <p className="text-sm text-gray-600">
            {editId ? t('campaigns.create.editSubtitle') : t('campaigns.create.createSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ═══ LEFT: FORM FIELDS ═══ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name + Audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('campaigns.create.campaignName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((p) => { const { name: _, ...r } = p; return r })
                  }}
                  placeholder={t('campaigns.create.namePlaceholder')}
                  className={`w-full px-4 py-3 rounded-xl border outline-none text-sm transition-colors ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('campaigns.create.targetedAudience')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={audience}
                  onChange={(e) => {
                    setAudience(e.target.value)
                    if (errors.audience) setErrors((p) => { const { audience: _, ...r } = p; return r })
                  }}
                  className={`w-full px-4 py-3 rounded-xl border outline-none text-sm bg-white transition-colors ${
                    errors.audience
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20'
                  }`}
                >
                  <option value="">{t('campaigns.create.select')}</option>
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                  ))}
                </select>
                {errors.audience && <p className="text-xs text-red-600 mt-1">{errors.audience}</p>}
                {audience && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Users className="w-3 h-3 text-gray-400" />
                    {audienceLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    ) : audienceCount !== null ? (
                      <span className="text-xs text-gray-500">
                        {t('campaigns.create.recipientsMatched', { count: audienceCount.toLocaleString() })}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('campaigns.create.startAt')}</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm"
                />
                {scheduledAt && (
                  <button
                    onClick={() => setScheduledAt('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {t('campaigns.create.content')} <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${content.length > MAX_CONTENT_LENGTH ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                  {content.length}/{MAX_CONTENT_LENGTH}
                </span>
              </div>
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  if (errors.content) setErrors((p) => { const { content: _, ...r } = p; return r })
                }}
                rows={6}
                placeholder={t('campaigns.create.contentPlaceholder')}
                className={`w-full px-4 py-3 rounded-xl border outline-none text-sm resize-none transition-colors ${
                  errors.content
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20'
                }`}
              />
              {errors.content && <p className="text-xs text-red-600 mt-1">{errors.content}</p>}

              {/* Tags */}
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <span className="text-xs font-medium text-gray-500">{t('campaigns.create.tags')}</span>
                {MESSAGE_TAGS.map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => insertTag(tag.key)}
                    className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {t(tag.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('campaigns.create.attachment')}</label>
              <p className="text-xs text-green-600 mb-2">
                {t('campaigns.create.attachmentHint')}
              </p>

              {(attachment || existingAttachment) ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  {(() => { const Icon = attachmentIcon; return <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" /> })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{attachmentName}</p>
                    {attachment && (
                      <p className="text-xs text-gray-400">{(attachment.size / 1024).toFixed(0)} KB</p>
                    )}
                  </div>
                  <button type="button" onClick={removeAttachment} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                  <Paperclip className="w-4 h-4" />
                  {t('campaigns.create.chooseFile')}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,.pdf"
                    onChange={handleFileChange}
                  />
                </label>
              )}
              {errors.attachment && <p className="text-xs text-red-600 mt-1">{errors.attachment}</p>}
            </div>

            {/* Terms */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (errors.terms) setErrors((p) => { const { terms: _, ...r } = p; return r })
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-amber-300 text-[#8B1E3F] focus:ring-[#8B1E3F]"
                />
                <span className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold">⚠️</span>{' '}
                  {t('campaigns.create.termsText')}
                </span>
              </label>
              {errors.terms && <p className="text-xs text-red-600 mt-2 ml-7">{errors.terms}</p>}
            </div>
          </div>

          {/* ═══ RIGHT: WHATSAPP PREVIEW ═══ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('campaigns.create.preview')}</label>
            <div className="sticky top-6">
              {/* Phone frame */}
              <div className="bg-[#0b141a] rounded-2xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="bg-[#1f2c34] px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#8B1E3F] flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{t('campaigns.create.previewName')}</p>
                    <p className="text-gray-400 text-[10px]">{t('campaigns.create.previewOnline')}</p>
                  </div>
                </div>

                {/* Chat body */}
                <div className="min-h-[220px] p-3 flex flex-col justify-end"
                     style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'%3E%3Crect width=\'20\' height=\'20\' fill=\'%23111b21\'/%3E%3C/svg%3E")' }}>
                  {previewText ? (
                    <div className="max-w-[90%] ml-auto">
                      {/* Attachment preview */}
                      {(attachment || existingAttachment) && (
                        <div className="bg-[#005c4b] rounded-t-xl rounded-tr-sm px-2 pt-2 pb-1 mb-0">
                          <div className="w-full h-24 rounded-lg bg-[#004a3d] flex items-center justify-center">
                            {attachment?.type?.startsWith('image/') ? (
                              <ImageIcon className="w-8 h-8 text-green-300/50" />
                            ) : (
                              <FileText className="w-8 h-8 text-green-300/50" />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className={`bg-[#005c4b] px-3 py-2 ${
                        (attachment || existingAttachment) ? 'rounded-b-xl' : 'rounded-xl rounded-tr-sm'
                      }`}>
                        <p className="text-white text-[13px] whitespace-pre-wrap break-words leading-relaxed">
                          {previewText}
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
                    <p className="text-gray-600 text-center text-xs py-12">
                      {t('campaigns.create.typeToPreview')}
                    </p>
                  )}
                </div>

                {/* Input bar */}
                <div className="bg-[#1f2c34] px-3 py-2 flex items-center gap-2">
                  <div className="flex-1 h-8 rounded-full bg-[#2a3942] px-3 flex items-center">
                    <span className="text-gray-500 text-xs">{t('campaigns.create.typeMessage')}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* WA status indicator below preview */}
              {!waLoading && (
                <div className={`mt-3 flex items-center gap-2 p-2 rounded-lg text-xs font-medium ${
                  waStatus?.connected
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${waStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  {waStatus?.connected
                    ? t('campaigns.create.waConnected', { phone: waStatus.phone })
                    : t('campaigns.create.waDisconnected')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ACTIONS ═══ */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.push('/dashboard/campaigns')}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm disabled:opacity-50"
        >
          <X className="w-4 h-4" /> {t('common.cancel')}
        </button>

        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 text-sm disabled:opacity-50 transition-colors"
        >
          {savingAs === 'draft' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {t('campaigns.create.saveAsDraft')}
        </button>

        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={saving || !waStatus?.connected}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md font-medium text-sm disabled:opacity-50 transition-all"
          title={!waStatus?.connected ? t('campaigns.create.connectWaFirst') : ''}
        >
          {savingAs === 'send' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {editId ? t('campaigns.create.updateAndSend') : t('campaigns.create.saveAndSchedule')}
        </button>
      </div>
    </div>
  )
}

function getDefaultDateTime(tenantTz) {
  return dayjs().tz(tenantTz || 'UTC').format('YYYY-MM-DDTHH:mm')
}

export default function CreateCampaignPage(props) {
  return (
    <TenantPermissionGate permission="campaigns.manage">
      <CreateCampaignPageInner {...props} />
    </TenantPermissionGate>
  );
}
