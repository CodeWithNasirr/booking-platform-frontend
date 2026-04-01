// app/superadmin/templates/page.jsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import { useApp } from '@/contexts/AppContext'
import { resolveTranslated } from '@/app/tenant-site/templates/utils/lang'
import {
  Search,
  Grid,
  List,
  Plus,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Star,
  Layout,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Check,
  X,
  Layers,
} from 'lucide-react'
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

// Filter types
const TEMPLATE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'online_services', label: 'Online Services' },
  { value: 'digital_services', label: 'Digital Services' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Draft' },
]

// Helper to normalize i18n data
function normalizeI18n(value) {
  if (!value) return ""
  if (typeof value === "object") return value
  try {
    return JSON.parse(value.replace(/'/g, '"'))
  } catch {
    return value
  }
}

export default function SuperAdminTemplatesPage() {
  const { language, t } = useApp()
  const router = useRouter()
  
  // State
  const [templates, setTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [isDeleting, setIsDeleting] = useState(null)
  const [viewingLayouts, setViewingLayouts] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    premium: 0,
  })

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType) params.append('template_type', filterType)
      if (filterStatus) params.append('is_active', filterStatus)
      if (searchQuery) params.append('search', searchQuery)

      const res = await axios.get(`/api/v1/website/templates/?${params}`)
      const data = res.data.results || res.data || []
      
      setTemplates(data)
      
      setStats({
        total: data.length,
        active: data.filter(t => t.is_active).length,
        draft: data.filter(t => !t.is_active).length,
        premium: data.filter(t => t.is_premium).length,
      })
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filterType, filterStatus, searchQuery])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleDelete = async (id) => {
    if (!confirm(t('templates.confirmDelete') || 'Are you sure you want to delete this template?')) {
      return
    }
    
    setIsDeleting(id)
    try {
      await axios.delete(`/api/v1/website/templates/${id}/`)
      setTemplates(prev => prev.map(t => 
        t.id === id ? { ...t, is_active: false } : t
      ))
    } catch (err) {
      console.error('Delete failed:', err)
      alert(t('templates.deleteError') || 'Failed to delete template')
    } finally {
      setIsDeleting(null)
    }
  }

  const StatusBadge = ({ isActive }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isActive 
        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
        : 'bg-gray-100 text-gray-600 border border-gray-200'
    }`}>
      {isActive ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t('templates.active') || 'Active'}
        </>
      ) : (
        <>
          <XCircle className="w-3.5 h-3.5" />
          {t('templates.draft') || 'Draft'}
        </>
      )}
    </span>
  )

  const TypeBadge = ({ type }) => {
    const colors = {
      online_services: 'bg-blue-100 text-blue-700 border-blue-200',
      digital_services: 'bg-purple-100 text-purple-700 border-purple-200',
    }
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
        colors[type] || 'bg-gray-100 text-gray-700 border-gray-200'
      }`}>
        {type === 'online_services' ? 'Online' : 'Digital'}
      </span>
    )
  }

  // Layouts Viewer Component
  const LayoutsViewer = ({ template, onClose }) => {
    const [layouts, setLayouts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      axios.get(`/api/v1/website/templates/${template.slug}/`)
        .then(res => {
          setLayouts(res.data.layouts || [])
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to load layouts:', err)
          setLoading(false)
        })
    }, [template.slug])

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {resolveTranslated(template.name, language)} - Layouts
            </h3>
            <p className="text-sm text-gray-500">
              {layouts.length} layout{layouts.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {layouts.map((layout, idx) => {
            const nameI18n = normalizeI18n(layout.layout_name || layout.name)
            const descI18n = normalizeI18n(layout.description)

            return (
              <div
                key={layout.layout_id || idx}
                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {resolveTranslated(nameI18n, language) || `Layout ${idx + 1}`}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {resolveTranslated(descI18n, language) || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      window.open(
                        `/tenant-site/templates/${template.slug}/layouts/${layout.layout_id}`,
                        "_blank"
                      )
                    }
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    Preview
                  </button>
                  {/* <button
                    onClick={() => router.push(`/superadmin/templates/${template.slug}/layouts/${layout.layout_id}/edit`)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button> */}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Template Card Component - Step 5 Style with Actions
  const TemplateCard = ({ template }) => {
    const isSelected = selectedTemplateId === template.id
    
    return (
      <div 
        className={`group flex flex-col rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden
          ${isSelected 
            ? 'border-indigo-600 bg-indigo-50/50 shadow-md' 
            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
          }`}
      >
        {/* Preview Image */}
        <div className="relative h-32 rounded-xl bg-gray-100 mb-3 overflow-hidden m-3">
          {template.preview_url ? (
            <img 
              src={template.preview_url} 
              alt={resolveTranslated(template.name, language)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Layout className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          {/* Hover Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`/tenant-site/templates/${template.slug}`, '_blank')
                }}
                className="p-2 bg-white rounded-lg text-gray-700 hover:text-gray-900 shadow-lg"
                title="Preview Template"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setViewingLayouts(template)
                }}
                className="p-2 bg-white rounded-lg text-indigo-600 hover:text-indigo-700 shadow-lg"
                title="View Layouts"
              >
                <Layers className="w-4 h-4" />
              </button>
              {/* <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/superadmin/templates/${template.slug}/edit`)
                }}
                className="p-2 bg-white rounded-lg text-emerald-600 hover:text-emerald-700 shadow-lg"
                title="Edit Template"
              >
                <Edit2 className="w-4 h-4" />
              </button> */}
            </div>
          </div>

          {/* Premium Badge */}
          {template.is_premium && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                <Star className="w-3 h-3 fill-current" />
                Premium
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-3 pb-3 flex-1">
          <div className="flex items-start justify-between gap-2">
            {/* <h3 
              className="font-medium text-gray-900 line-clamp-1 cursor-pointer hover:text-indigo-600"
              onClick={() => router.push(`/superadmin/templates/${template.slug}/edit`)}
            >
              {resolveTranslated(template.name, language)}
            </h3> */}
          </div>
          
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 mb-2">
            {resolveTranslated(template.description, language)}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Grid className="w-3 h-3" />
              <span>{template.layouts_count} layouts</span>
            </div>
            <TypeBadge type={template.template_type} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <StatusBadge isActive={template.is_active} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">v{template.version || '1.0'}</span>
            {/* Dropdown Menu */}
            <div className="relative group/menu">
              <button 
                className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              <div className="absolute right-0 bottom-full mb-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                <button
                  onClick={() => window.open(`/tenant-site/templates/${template.slug}`, '_blank')}
                  className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 first:rounded-t-xl"
                >
                  <ExternalLink className="w-3 h-3" />
                  Preview
                </button>
                <button
                  onClick={() => setViewingLayouts(template)}
                  className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Layers className="w-3 h-3" />
                  View Layouts
                </button>
                {/* <button
                  onClick={() => router.push(`/superadmin/templates/${template.slug}/edit`)}
                  className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button> */}
                <div className="h-px bg-gray-100 mx-2" />
                <button
                  onClick={() => handleDelete(template.id)}
                  disabled={isDeleting === template.id}
                  className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 last:rounded-b-xl disabled:opacity-50"
                >
                  {isDeleting === template.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Template Row Component (List View)
  const TemplateRow = ({ template }) => (
    <div className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4">
        {/* Preview Thumbnail */}
        <div className="w-20 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {template.preview_url ? (
            <img 
              src={template.preview_url} 
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layout className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {resolveTranslated(template.name, language)}
            </h3>
            {template.is_premium && (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {resolveTranslated(template.description, language)}
          </p>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <TypeBadge type={template.template_type} />
          <StatusBadge isActive={template.is_active} />
        </div>

        {/* Layouts Count */}
        <button
          onClick={() => setViewingLayouts(template)}
          className="flex items-center gap-1.5 text-sm text-gray-500 flex-shrink-0 w-24 hover:text-indigo-600"
        >
          <Layers className="w-4 h-4" />
          <span className="font-medium text-gray-700">{template.layouts_count}</span>
          <span className="text-gray-400">layouts</span>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => window.open(`/tenant-site/templates/${template.slug}`, '_blank')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewingLayouts(template)}
            className="p-2 rounded-lg hover:bg-gray-100 text-indigo-600 hover:text-indigo-700"
            title="View Layouts"
          >
            <Layers className="w-4 h-4" />
          </button>
          {/* <button
            onClick={() => router.push(`/superadmin/templates/${template.slug}/edit`)}
            className="p-2 rounded-lg hover:bg-gray-100 text-emerald-600 hover:text-emerald-700"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button> */}
          <button
            onClick={() => handleDelete(template.id)}
            disabled={isDeleting === template.id}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 disabled:opacity-50"
            title="Delete"
          >
            {isDeleting === template.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <SuperAdminLayout
      title="Template Library"
      description="Manage website templates for tenants"
      breadcrumbs={[{ label: "Templates" }]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('templates.title') || 'Template Library'}
              </h1>
              <p className="text-gray-500 mt-1">
                {t('templates.subtitle') || 'Manage website templates for tenants'}
              </p>
            </div>
            {/* <button
              onClick={() => router.push('/superadmin/templates/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              {t('templates.add') || 'Add Template'}
            </button> */}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: t('templates.stats.total') || 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700' },
            { label: t('templates.stats.active') || 'Active', value: stats.active, color: 'bg-emerald-50 text-emerald-700' },
            { label: t('templates.stats.draft') || 'Draft', value: stats.draft, color: 'bg-gray-50 text-gray-700' },
            { label: t('templates.stats.premium') || 'Premium', value: stats.premium, color: 'bg-amber-50 text-amber-700' },
          ].map((stat, idx) => (
            <div key={idx} className={`p-4 rounded-xl ${stat.color} border border-current border-opacity-10`}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm font-medium opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('templates.search') || 'Search templates...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-w-[160px]"
            >
              {TEMPLATE_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-w-[140px]"
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed">
            <Layout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('templates.empty.title') || 'No templates found'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {t('templates.empty.subtitle') || 'Get started by creating your first template'}
            </p>
            {/* <button
              onClick={() => router.push('/superadmin/templates/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t('templates.add') || 'Add Template'}
            </button> */}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(template => (
              <TemplateRow key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>

      {/* Layouts Viewer Modal */}
      {viewingLayouts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setViewingLayouts(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 m-4">
            <LayoutsViewer 
              template={viewingLayouts} 
              onClose={() => setViewingLayouts(null)} 
            />
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}