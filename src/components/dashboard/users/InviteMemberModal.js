'use client'

import { useState, useEffect } from 'react'
import {
  X,
  UserPlus,
  Loader2,
  Shield,
  AlertCircle,
} from 'lucide-react'

import { apiFetch as authFetch } from '@/lib/apiClient'
import { useApp } from '@/contexts/AppContext'

const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to manage the business (except billing)',
  },
  {
    value: 'sub_admin',
    label: 'Sub Admin',
    description: 'Custom permissions — choose what they can access',
  },
  {
    value: 'provider',
    label: 'Provider',
    description: 'Service provider — can view assigned bookings & orders',
  },
  {
    value: 'staff',
    label: 'Staff',
    description: 'View-only access to relevant sections',
  },
]

export default function InviteMemberModal({ onClose, onSuccess }) {
  const { activeTenant } = useApp()
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'provider',
    permissions: [],
  })
  const [availablePermissions, setAvailablePermissions] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Fetch available permissions for sub_admin
  useEffect(() => {
    if (form.role === 'sub_admin') {
     authFetch(
      '/api/v1/tenant/members/permissions/',
      activeTenant
    )
      .then(setAvailablePermissions)
      .catch(console.error)
    }
  }, [form.role])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const togglePermission = (code) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter((p) => p !== code)
        : [...prev.permissions, code],
    }))
  }

const handleSubmit = async () => {
    if (!form.email.trim()) {
      setError('Email is required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await authFetch(
        '/api/v1/tenant/members/invite/',
        activeTenant,
        {
          method: 'POST',
          body: JSON.stringify(form),
        }
      )

      onSuccess()

    } catch (err) {
      setError(
        err?.message ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#8B1E3F]/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Invite Team Member</h2>
              <p className="text-sm text-gray-500">They'll receive an email to set up their account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
            />
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Smith"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
            />
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Role *
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.role === opt.value
                      ? 'border-[#8B1E3F] bg-[#8B1E3F]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={form.role === opt.value}
                    onChange={() => handleChange('role', opt.value)}
                    className="mt-0.5 accent-[#8B1E3F]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sub-admin permissions */}
          {form.role === 'sub_admin' && Object.keys(availablePermissions).length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3">
                {Object.entries(availablePermissions).map(([category, group]) => (
                  <div key={category}>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.code}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(perm.code)}
                            onChange={() => togglePermission(perm.code)}
                            className="accent-[#8B1E3F] rounded"
                          />
                          <span className="text-sm text-gray-700">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  )
}