// src/app/dashboard/campaigns/[id]/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { getCampaign, startCampaign, suspendCampaign, deleteCampaign } from '../lib/campaignApi'
import {
  ArrowLeft, Loader2, Play, Pause, Trash2, Edit, Users,
  Send, Check, X, AlertTriangle, Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'

const STATUS_COLORS = {
  draft: 'text-gray-700', pending: 'text-amber-700', active: 'text-green-700',
  finished: 'text-blue-700', failed: 'text-red-700', suspended: 'text-purple-700'
}

export default function CampaignDetailPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant, t } = useApp()
  const router = useRouter()
  const params = useParams()
  const campaignId = params.id

  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useBlockBackNavigation(!!user)

  useEffect(() => {
    if (!loadingUser && !user) router.replace('/')
  }, [loadingUser, user, router])

  useEffect(() => {
    if (!activeTenant || !campaignId) return
    setLoading(true)
    getCampaign(activeTenant, campaignId)
      .then(setCampaign)
      .catch(() => router.push('/dashboard/campaigns'))
      .finally(() => setLoading(false))
  }, [activeTenant, campaignId, router])

  const handleStart = async () => {
    setActionLoading(true)
    try {
      const data = await startCampaign(activeTenant, campaignId)
      setCampaign(data)
    } catch (err) { alert(err.message) }
    finally { setActionLoading(false) }
  }

  const handleSuspend = async () => {
    setActionLoading(true)
    try {
      const data = await suspendCampaign(activeTenant, campaignId)
      setCampaign(data)
    } catch (err) { alert(err.message) }
    finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirm(t('campaigns.confirmDelete'))) return
    try {
      await deleteCampaign(activeTenant, campaignId)
      router.push('/dashboard/campaigns')
    } catch (err) { alert(err.message) }
  }

  if (requiresOnboarding || loadingUser || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
      </div>
    )
  }

  if (!campaign) return null

  const isDraft = campaign.status === 'draft' || campaign.status === 'pending'
  const isActive = campaign.status === 'active'
  const sentPercent = campaign.total_recipients
    ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('campaigns.detail.breadcrumb', { name: campaign.name })}</p>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <button onClick={() => router.push(`/dashboard/campaigns/create?edit=${campaignId}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm">
                <Edit className="w-4 h-4" /> {t('campaigns.actions.edit')}
              </button>
              <button onClick={handleStart} disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white bg-green-600 hover:bg-green-700 font-medium text-sm disabled:opacity-50">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {t('campaigns.detail.startSending')}
              </button>
              <button onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 text-sm">
                <Trash2 className="w-4 h-4" /> {t('campaigns.actions.delete')}
              </button>
            </>
          )}
          {isActive && (
            <button onClick={handleSuspend} disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:bg-amber-600 text-sm disabled:opacity-50">
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
              {t('campaigns.actions.suspend')}
            </button>
          )}
          <button onClick={() => router.push('/dashboard/campaigns')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm">
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label={t('campaigns.detail.status')} value={campaign.status} color={STATUS_COLORS[campaign.status]} />
        <StatCard label={t('campaigns.detail.totalRecipients')} value={campaign.total_recipients.toLocaleString()} icon={Users} />
        <StatCard label={t('campaigns.detail.sent')} value={campaign.sent_count.toLocaleString()} sub={`${sentPercent}%`} />
        <StatCard label={t('campaigns.detail.delivered')} value={campaign.delivered_count.toLocaleString()} />
        <StatCard label={t('campaigns.detail.failed')} value={campaign.failed_count.toLocaleString()} color={campaign.failed_count > 0 ? 'text-red-600' : undefined} />
      </div>

      {/* Progress bar */}
      {campaign.total_recipients > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t('campaigns.detail.deliveryProgress')}</span>
            <span className="text-sm text-gray-500">{sentPercent}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#8B1E3F] to-[#E85D75] rounded-full transition-all" style={{ width: `${sentPercent}%` }} />
          </div>
        </div>
      )}

      {/* Campaign Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">{t('campaigns.detail.detailsTitle')}</h3>
          <dl className="space-y-3">
            <Row label={t('campaigns.detail.audience')} value={campaign.audience_display} />
            <Row label={t('campaigns.detail.scheduled')} value={campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : t('campaigns.detail.immediate')} />
            <Row label={t('campaigns.detail.started')} value={campaign.started_at ? new Date(campaign.started_at).toLocaleString() : '-'} />
            <Row label={t('campaigns.detail.finished')} value={campaign.finished_at ? new Date(campaign.finished_at).toLocaleString() : '-'} />
            <Row label={t('campaigns.detail.createdBy')} value={campaign.created_by || '-'} />
            <Row label={t('campaigns.detail.created')} value={new Date(campaign.created_at).toLocaleString()} />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">{t('campaigns.detail.messageTitle')}</h3>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{campaign.content}</p>
          </div>
          {campaign.attachment && (
            <a href={campaign.attachment} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm text-[#8B1E3F] hover:underline">
              📎 {t('campaigns.detail.viewAttachment')}
            </a>
          )}
        </div>
      </div>

      {/* Recipients Table */}
      {campaign.recipients?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              {t('campaigns.detail.recipientsTitle', { count: campaign.recipients.length })}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">{t('campaigns.detail.phone')}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">{t('campaigns.detail.name')}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">{t('campaigns.detail.status')}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">{t('campaigns.detail.sentAt')}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">{t('campaigns.detail.error')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaign.recipients.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-sm font-mono text-gray-900">{r.phone}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{r.name || '-'}</td>
                    <td className="px-6 py-3">
                      <RecipientStatus status={r.status} t={t} />
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {r.sent_at ? new Date(r.sent_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-3 text-xs text-red-600 max-w-xs truncate">{r.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      </div>
      <p className={`text-2xl font-bold mt-1 capitalize ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}

function RecipientStatus({ status, t }) {
  const cfg = {
    pending:   { icon: Clock, labelKey: 'campaigns.recipientStatus.pending', cls: 'text-gray-500 bg-gray-50' },
    sent:      { icon: Check, labelKey: 'campaigns.recipientStatus.sent', cls: 'text-blue-700 bg-blue-50' },
    delivered: { icon: CheckCircle2, labelKey: 'campaigns.recipientStatus.delivered', cls: 'text-green-700 bg-green-50' },
    read:      { icon: CheckCircle2, labelKey: 'campaigns.recipientStatus.read', cls: 'text-green-800 bg-green-100' },
    failed:    { icon: XCircle, labelKey: 'campaigns.recipientStatus.failed', cls: 'text-red-700 bg-red-50' },
  }[status] || { icon: Clock, labelKey: status, cls: 'text-gray-500 bg-gray-50' }

  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {t(cfg.labelKey)}
    </span>
  )
}