// src/components/dashboard/settings/DomainSettingsTab.js
'use client'

import { useState } from 'react'
import {
  Globe, Edit2, Copy, Check, Link2, ExternalLink, Star,
  Shield, ShieldCheck, ShieldAlert, Trash2, Loader2,
  ChevronDown, X, AlertCircle, HelpCircle, RefreshCw,
  Palette, CheckCircle2, XCircle, Clock, Eye,
} from 'lucide-react'
import {
  linkCustomDomain, verifyDomain, setPrimaryDomain,
  removeDomain, updateWebsiteSlug, checkDnsStatus,
} from '@/lib/settingsApi'

// ─── FAQ ────────────────────────────────────────────────────────

const FAQ = [
  {
    q: 'What is a Domain?',
    a: 'A domain is your website address (e.g., mybusiness.com). It\'s how customers find your booking site on the internet.',
  },
  {
    q: 'Does it cost anything to switch to a custom Domain?',
    a: 'Connecting your own domain to BookingPro is free on all paid plans. You only pay the domain registrar\'s renewal fee.',
  },
  {
    q: 'How much time does it take for my custom Domain to work after finishing the setup?',
    a: 'DNS changes typically propagate within 15 minutes to 48 hours. Most domains start working within 1-2 hours.',
  },
  {
    q: 'Can I change or remove the linked Domain?',
    a: 'Yes. You can unlink a custom domain at any time and revert to your free BookingPro subdomain.',
  },
]

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'text-amber-700 bg-amber-50',  icon: Clock },
  verified: { label: 'Verified', color: 'text-green-700 bg-green-50',  icon: CheckCircle2 },
  failed:   { label: 'Failed',   color: 'text-red-700 bg-red-50',      icon: XCircle },
  expired:  { label: 'Expired',  color: 'text-gray-700 bg-gray-50',    icon: Clock },
}

// ─── Main Component ─────────────────────────────────────────────

export default function DomainSettingsTab({
  domains, websiteUrl, tenantSlug, branding, activeTenant,
  onDomainsChange, onBrandingChange, onSaveBranding, saving,
}) {
  const [editingSlug, setEditingSlug] = useState(false)
  const [slugValue, setSlugValue] = useState(tenantSlug || '')
  const [slugSaving, setSlugSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [dnsModal, setDnsModal] = useState(null) // domain object for DNS status

  const subdomain = domains?.find((d) => d.is_subdomain)
  const customDomains = domains?.filter((d) => d.is_custom) || []
  
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(websiteUrl || subdomain?.domain || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveSlug = async () => {
    if (!slugValue.trim()) return
    setSlugSaving(true)
    try {
      await updateWebsiteSlug(activeTenant, slugValue.trim())
      setEditingSlug(false)
      onDomainsChange?.()
    } catch (err) {
      alert(err.message)
    } finally {
      setSlugSaving(false)
    }
  }

  const handleVerify = async (domainId) => {
    setActionLoading(`verify-${domainId}`)
    try {
      const result = await verifyDomain(activeTenant, domainId)
      if (result.warning) alert(result.warning)
      onDomainsChange?.()
    } catch (err) {
      if (err.status === 429) {
        alert(`Rate limited. ${err.data?.detail || 'Please wait before retrying.'}`)
      } else if (err.status === 422) {
        alert(err.data?.help || err.message)
      } else {
        alert(err.message)
      }
      onDomainsChange?.()
    } finally {
      setActionLoading(null)
    }
  }

  const handleSetPrimary = async (domainId) => {
    setActionLoading(`primary-${domainId}`)
    try {
      await setPrimaryDomain(activeTenant, domainId)
      onDomainsChange?.()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (domainId) => {
    if (!confirm('Remove this domain? This action cannot be undone.')) return
    setActionLoading(`remove-${domainId}`)
    try {
      await removeDomain(activeTenant, domainId)
      onDomainsChange?.()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckDns = async (domain) => {
    setDnsModal({ ...domain, loading: true, result: null })
    try {
      const result = await checkDnsStatus(activeTenant, domain.id)
      setDnsModal({ ...domain, loading: false, result })
    } catch (err) {
      setDnsModal({ ...domain, loading: false, error: err.message })
    }
  }

  return (
    <div className="space-y-8">
      {/* ═══ WEBSITE LINK ═══ */}
      <Section icon={Edit2} iconBg="bg-amber-100" iconColor="text-amber-600" title="Website Link">
        {editingSlug ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center border border-gray-300 rounded-xl overflow-hidden">
              <span className="px-4 py-3 bg-gray-50 text-sm text-gray-500 border-r border-gray-200 whitespace-nowrap">https://</span>
              <input
                type="text" value={slugValue} autoFocus
                onChange={(e) => setSlugValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 px-4 py-3 text-sm outline-none"
              />
              <span className="px-4 py-3 bg-gray-50 text-sm text-gray-500 border-l border-gray-200 whitespace-nowrap">.bookingpro.app</span>
            </div>
            <button onClick={handleSaveSlug} disabled={slugSaving}
              className="px-4 py-3 rounded-xl bg-[#8B1E3F] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {slugSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
            <button onClick={() => { setEditingSlug(false); setSlugValue(tenantSlug) }}
              className="px-4 py-3 rounded-xl border border-gray-300 text-gray-600 text-sm hover:bg-gray-50">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => setEditingSlug(true)}
              className="flex items-center gap-2 text-sm font-medium text-[#8B1E3F] hover:text-[#6B1630]">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <a href={websiteUrl || '#'} target="_blank" rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline font-mono flex-1 truncate">
              {websiteUrl || subdomain?.domain || 'Not configured'}
            </a>
            <button onClick={handleCopyUrl} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </Section>

      {/* ═══ DOMAIN MANAGEMENT ═══ */}
      <Section icon={Globe} iconBg="bg-blue-100" iconColor="text-blue-600" title="Domain Management">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => setShowLinkModal(true)}
            className="flex items-start gap-4 p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all text-left group">
            <div className="w-12 h-12 rounded-xl bg-[#8B1E3F]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#8B1E3F]/20">
              <Link2 className="w-6 h-6 text-[#8B1E3F]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Link Existing Domain</p>
              <p className="text-sm text-gray-500">You own a domain? You can link it here</p>
            </div>
          </button>
          <a href={websiteUrl || '#'} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-4 p-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200">
              <ExternalLink className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1">Visit Website</p>
              <p className="text-sm text-gray-500">Preview your live booking site</p>
            </div>
          </a>
        </div>
      </Section>

      {/* ═══ CONNECTED DOMAINS TABLE ═══ */}
      {domains?.length > 0 && (
        <Section icon={Shield} iconBg="bg-green-100" iconColor="text-green-600" title="Connected Domains"
          badge={`${domains.length} domain${domains.length !== 1 ? 's' : ''}`}>
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/60">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Domain</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">CNAME</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {domains.map((d) => {
                  const vs = d.verification_status || (d.is_verified ? 'verified' : 'pending')
                  const statusCfg = STATUS_CONFIG[vs] || STATUS_CONFIG.pending
                  const StatusIcon = statusCfg.icon

                  return (
                    <tr key={d.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 font-mono">{d.domain}</span>
                          {d.is_primary && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">PRIMARY</span>
                          )}
                        </div>
                        {d.verification_error && vs === 'failed' && (
                          <p className="text-xs text-red-500 mt-1 truncate max-w-xs">{d.verification_error}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${d.is_subdomain ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {d.is_subdomain ? 'Subdomain' : 'Custom'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${statusCfg.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusCfg.label}
                        </span>
                        {d.verification_attempts > 0 && vs !== 'verified' && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {d.verification_attempts} attempt{d.verification_attempts > 1 ? 's' : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {d.is_subdomain ? (
                          <span className="text-xs text-green-600 font-medium">Auto</span>
                        ) : d.cname_verified ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> OK
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <AlertCircle className="w-3 h-3" /> Not set
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {d.is_custom && (
                            <button onClick={() => handleCheckDns(d)} title="Check DNS"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {d.is_custom && !d.is_verified && (
                            <button onClick={() => handleVerify(d.id)}
                              disabled={actionLoading === `verify-${d.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50">
                              {actionLoading === `verify-${d.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              Verify
                            </button>
                          )}
                          {d.is_verified && !d.is_primary && (
                            <button onClick={() => handleSetPrimary(d.id)}
                              disabled={actionLoading === `primary-${d.id}`}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                              <Star className="w-3 h-3" /> Primary
                            </button>
                          )}
                          {d.is_custom && (
                            <button onClick={() => handleRemove(d.id)}
                              disabled={actionLoading === `remove-${d.id}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ═══ BRAND COLORS ═══ */}
      <Section icon={Palette} iconBg="bg-pink-100" iconColor="text-pink-600" title="Brand Colors">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorPicker label="Primary Color" value={branding?.primary_color || '#8B1E3F'}
            onChange={(v) => onBrandingChange({ ...branding, primary_color: v })} />
          <ColorPicker label="Secondary Color" value={branding?.secondary_color || '#10B981'}
            onChange={(v) => onBrandingChange({ ...branding, secondary_color: v })} />
        </div>
        <div className="flex justify-end mt-6">
          <button onClick={onSaveBranding} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md disabled:opacity-50 font-medium text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Colors
          </button>
        </div>
      </Section>

      {/* ═══ FAQ ═══ */}
      <Section icon={HelpCircle} iconBg="bg-gray-100" iconColor="text-gray-600" title="Common Questions">
        <div className="-mx-6 divide-y divide-gray-100">
          {FAQ.map((item, i) => (
            <div key={i}>
              <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 text-left">
                <span className="text-sm font-medium text-gray-900">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ml-4 flex-shrink-0 ${expandedFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {expandedFaq === i && (
                <div className="px-6 pb-4"><p className="text-sm text-gray-600 leading-relaxed">{item.a}</p></div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ MODALS ═══ */}
      {showLinkModal && (
        <LinkDomainModal activeTenant={activeTenant}
          onClose={() => setShowLinkModal(false)}
          onSuccess={() => { setShowLinkModal(false); onDomainsChange?.() }} />
      )}
      {dnsModal && (
        <DnsStatusModal domain={dnsModal} onClose={() => setDnsModal(null)} />
      )}
    </div>
  )
}

// ─── Section Wrapper ────────────────────────────────────────────

function Section({ icon: Icon, iconBg, iconColor, title, badge, children }) {
  return (
    <div className="rounded-xl border border-[#8B1E3F]/10 overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
        {badge && <span className="text-xs font-bold text-gray-500 px-2.5 py-1 bg-gray-200 rounded-full">{badge}</span>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ─── DNS Status Modal ───────────────────────────────────────────

function DnsStatusModal({ domain, onClose }) {
  const result = domain.result
  const dnsCheck = result?.dns_check

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">DNS Status</h2>
            <p className="text-sm text-gray-500 font-mono">{domain.domain}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {domain.loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
              <span className="ml-3 text-sm text-gray-500">Checking DNS records...</span>
            </div>
          ) : domain.error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{domain.error}</div>
          ) : dnsCheck ? (
            <>
              {/* TXT Status */}
              <StatusRow label="TXT Verification" ok={dnsCheck.txt_found}
                detail={dnsCheck.txt_found ? 'Ownership token found' : 'Token not found in TXT records'} />
              {/* CNAME Status */}
              <StatusRow label="CNAME Record" ok={dnsCheck.cname_correct}
                detail={dnsCheck.cname_found
                  ? `Points to: ${dnsCheck.details?.cname?.target || 'unknown'}`
                  : 'No CNAME record found'} />
              {/* Warnings */}
              {dnsCheck.warnings?.map((w, i) => (
                <div key={i} className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{w}</p>
                </div>
              ))}
              {/* Errors */}
              {dnsCheck.errors?.map((e, i) => (
                <div key={i} className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{e}</p>
                </div>
              ))}
              {/* Expected Records */}
              {result.expected_records?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Required DNS Records</p>
                  {result.expected_records.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-200 mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-700">{r.type}</span>
                        <span className="text-xs text-gray-500">{r.purpose}</span>
                      </div>
                      <code className="text-xs font-mono text-gray-700 block truncate">{r.host} → {r.value}</code>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm">Close</button>
        </div>
      </div>
    </div>
  )
}

function StatusRow({ label, ok, detail }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      {ok ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
      <div>
        <p className={`text-sm font-medium ${ok ? 'text-green-900' : 'text-red-900'}`}>{label}</p>
        <p className={`text-xs ${ok ? 'text-green-700' : 'text-red-700'}`}>{detail}</p>
      </div>
    </div>
  )
}

// ─── Link Domain Modal ──────────────────────────────────────────

function LinkDomainModal({ activeTenant, onClose, onSuccess }) {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleLink = async () => {
    if (!domain.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await linkCustomDomain(activeTenant, domain.trim())
      setResult(data)
    } catch (err) {
      setError(err.data?.errors || [err.message])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Link Custom Domain</h2>
              <p className="text-sm text-gray-500">Connect your own domain</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              {(Array.isArray(error) ? error : [error]).map((e, i) => (
                <p key={i} className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {e}
                </p>
              ))}
            </div>
          )}
          {!result ? (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Domain Name</label>
                <input type="text" value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                  placeholder="mybusiness.com" autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none text-sm font-mono" />
                <p className="text-xs text-gray-500 mt-1.5">Enter without http:// or www</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">Before you start</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      You'll need to add DNS records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <p className="text-sm font-bold text-emerald-900">Domain Added!</p>
                </div>
                <p className="text-xs text-emerald-700">Configure these DNS records, then click Verify.</p>
              </div>
              {result.is_root_domain && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700">
                    <strong>Root domain detected.</strong> Some DNS providers don't support CNAME on root domains.
                    Use ALIAS/ANAME record instead, or use www.{result.domain}.
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {result.dns_records?.map((record, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-700">{record.type}</span>
                      <span className="text-xs text-gray-500">{record.purpose}</span>
                      {record.status === 'required' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Required</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-12">Host:</span>
                        <code className="text-xs font-mono bg-white px-2 py-1 rounded border flex-1 truncate">{record.host}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-12">Value:</span>
                        <code className="text-xs font-mono bg-white px-2 py-1 rounded border flex-1 truncate">{record.value}</code>
                      </div>
                    </div>
                    {record.note && <p className="text-[10px] text-gray-400 mt-2">{record.note}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          {!result ? (
            <>
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm">Cancel</button>
              <button onClick={handleLink} disabled={loading || !domain.trim()}
                className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md font-medium text-sm flex items-center gap-2 disabled:opacity-50">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />} Link Domain
              </button>
            </>
          ) : (
            <button onClick={onSuccess} className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 shadow-md font-medium text-sm">Done</button>
          )}
        </div>
      </div>
    </div>
  )
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono" />
      </div>
    </div>
  )
}