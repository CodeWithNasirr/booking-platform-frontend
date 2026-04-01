'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { resolveTranslated } from '../utils/lang'
import { ArrowLeft, Layout, ExternalLink, Eye, Grid } from 'lucide-react'

export default function TemplateDetailPage() {
  const params = useParams()
  const slug = params.slug
  
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await axios.get(`/api/v1/website/templates/${slug}/`)
        setTemplate(res.data)
      } catch (err) {
        console.error('[TemplateDetail] Fetch error:', err?.message)
        setError(err?.response?.data?.detail || 'Failed to load template')
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) fetchTemplate()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Not Found</h1>
          <Link href="/tenant-site/templates" className="text-blue-600 hover:underline">
            Browse all templates
          </Link>
        </div>
      </div>
    )
  }

  const layouts = template.layouts || []
  const name = resolveTranslated(template.name, 'en')
  const description = resolveTranslated(template.description, 'en')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/tenant-site/templates"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">All Templates</span>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
              <p className="text-gray-600 mt-2 max-w-2xl">{description}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {template.template_type === "online_services" ? "Online Services" : "Digital Services"}
              </span>
              {template.is_premium && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  Premium
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              <span>{layouts.length} layout{layouts.length !== 1 ? "s" : ""}</span>
            </div>
            <div>Version {template.version || "1.0"}</div>
          </div>
        </div>
      </div>

      {/* Layouts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose a Layout</h2>

        {layouts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No layouts available for this template</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {layouts.map((layout, idx) => {
              const layoutName = resolveTranslated(layout.layout_name || layout.name, "en") || `Layout ${idx + 1}`;
              const layoutDesc = resolveTranslated(layout.description, "en");

              return (
                <Link
                  key={layout.layout_id || idx}
                  href={`/tenant-site/templates/${slug}/layouts/${layout.layout_id}`}
                  className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all"
                >
                  {/* Preview */}
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {layout.preview_url || template.preview_url ? (
                      <img
                        src={layout.preview_url || template.preview_url}
                        alt={layoutName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Layout className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview Layout
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">{layoutName}</h3>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </div>
                    {layoutDesc && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">{layoutDesc}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}