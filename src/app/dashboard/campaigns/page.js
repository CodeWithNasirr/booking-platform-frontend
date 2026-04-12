// src/app/dashboard/campaigns/page.js
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import {
  fetchCampaigns, deleteCampaign, startCampaign, suspendCampaign,
} from './lib/campaignApi'
import {
  Plus, Search, Loader2, Trash2, Play, Pause, Eye,
  ChevronLeft, ChevronRight, MoreHorizontal, FileText,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'

const STATUS_TABS = [
  { key: 'all', label: 'All', color: 'bg-gray-800' },
  { key: 'draft', label: 'Draft', color: 'bg-red-400' },
  { key: 'pending', label: 'Pending', color: 'bg-amber-400' },
  { key: 'active', label: 'Active', color: 'bg-green-500' },
  { key: 'suspended', label: 'Suspended', color: 'bg-purple-500' },
  { key: 'finished', label: 'Finished', color: 'bg-green-600' },
  { key: 'failed', label: 'Failed', color: 'bg-red-500' },
]

export default function CampaignsPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [campaigns, setCampaigns] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(10)
  const [actionLoading, setActionLoading] = useState(null)

  useBlockBackNavigation(!!user)

  useEffect(() => {
    if (!loadingUser && !user) router.replace('/')
  }, [loadingUser, user, router])

  useEffect(() => {
    if (requiresOnboarding) router.replace('/auth/onboarding?step=1')
  }, [requiresOnboarding, router])

  const loadCampaigns = useCallback(async () => {
    if (!activeTenant) return
    try {
      setLoading(true)
      const data = await fetchCampaigns(activeTenant, {
        status: activeStatus,
        search,
        page,
        page_size: pageSize,
      })
      setCampaigns(data.results || [])
      setTotal(data.total || 0)
      setCounts(data.counts || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [activeTenant, activeStatus, search, page, pageSize])

  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign?')) return
    setActionLoading(id)
    try {
      await deleteCampaign(activeTenant, id)
      loadCampaigns()
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  const handleStart = async (id) => {
    setActionLoading(id)
    try {
      await startCampaign(activeTenant, id)
      loadCampaigns()
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  const handleSuspend = async (id) => {
    setActionLoading(id)
    try {
      await suspendCampaign(activeTenant, id)
      loadCampaigns()
    } catch (err) { alert(err.message) }
    finally { setActionLoading(null) }
  }

  if (requiresOnboarding || loadingUser) return null

  const totalPages = Math.ceil(total / pageSize)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Home → Campaigns</p>
        </div>
        <button onClick={() => router.push('/dashboard/campaigns/create')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium text-sm">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveStatus(tab.key); setPage(1) }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
              activeStatus === tab.key
                ? 'bg-white border-gray-900 text-gray-900 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
            }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${tab.color}`} />
            {tab.label}
            {counts[tab.key] !== undefined && (
              <span className="text-xs text-gray-400">({counts[tab.key]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm" />
        </div>
        <button onClick={handleSearch}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors">
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign Name</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Targeted Audience</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F] mx-auto" />
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 text-sm">
                    No data available
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      {c.total_recipients > 0 && (
                        <p className="text-xs text-gray-500">{c.sent_count}/{c.total_recipients} sent</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.audience_display}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <CampaignStatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {c.status === 'draft' && (
                          <button onClick={() => handleStart(c.id)}
                            disabled={actionLoading === c.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50" title="Start">
                            {actionLoading === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          </button>
                        )}
                        {c.status === 'active' && (
                          <button onClick={() => handleSuspend(c.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50" title="Suspend">
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        {(c.status === 'draft' || c.status === 'pending') && (
                          <button onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Show
            <select className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white" value={pageSize} disabled>
              <option value={10}>10</option>
            </select>
            entries
          </div>
          <div className="text-sm text-gray-600">
            Showing {from} to {to} of {total} entries
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40">First</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CampaignStatusBadge({ status }) {
  const cfg = {
    draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    active:    { label: 'Active',    cls: 'bg-green-50 text-green-700 border-green-200' },
    suspended: { label: 'Suspended', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    finished:  { label: 'Finished',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    failed:    { label: 'Failed',    cls: 'bg-red-50 text-red-700 border-red-200' },
  }[status] || { label: status, cls: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}