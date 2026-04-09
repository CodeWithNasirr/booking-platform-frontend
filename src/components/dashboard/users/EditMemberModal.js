'use client'

import { useState, useEffect } from 'react'
import { X, Save, Loader2, AlertCircle, User } from 'lucide-react'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'sub_admin', label: 'Sub Admin' },
  { value: 'provider', label: 'Provider' },
  { value: 'staff', label: 'Staff' },
]

export default function EditMemberModal({ member, onClose, onSuccess, headers, apiUrl }) {
  const [roleForm, setRoleForm] = useState({
    role: member.role,
    permissions: member.permissions || [],
    is_active: member.is_active,
    commission_percent: member.commission_percent || '',
    can_accept_bookings: member.can_accept_bookings ?? true,
  })

  const [profileForm, setProfileForm] = useState({
    first_name: member.user?.first_name || '',
    last_name: member.user?.last_name || '',
    phone: member.user?.phone || '',
  })

  const [availablePermissions, setAvailablePermissions] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('role')
  console.log(availablePermissions,"availablePermissions")
  const isOwner = member.role === 'owner'

  // Fetch permissions for sub_admin
  useEffect(() => {
    if (roleForm.role === 'sub_admin') {
      fetch(`${apiUrl}/api/v1/tenant/members/permissions/`, { headers,credentials: 'include' })
        .then((r) => r.json())
        .then(setAvailablePermissions)
        .catch(console.error)
    }
  }, [roleForm.role])

  const togglePermission = (code) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter((p) => p !== code)
        : [...prev.permissions, code],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // 1) Update role/permissions
      if (!isOwner) {
        const roleRes = await fetch(
          `${apiUrl}/api/v1/tenant/members/${member.id}/update/`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              role: roleForm.role,
              permissions: roleForm.role === 'sub_admin' ? roleForm.permissions : [],
              is_active: roleForm.is_active,
              ...(roleForm.role === 'provider' && {
                commission_percent: roleForm.commission_percent || null,
                can_accept_bookings: roleForm.can_accept_bookings,
              }),
            }),
          }
        )
        if (!roleRes.ok) {
          const data = await roleRes.json()
          throw new Error(data.detail || data.role?.[0] || 'Failed to update role')
        }
      }

      // 2) Update profile
      const profileRes = await fetch(
        `${apiUrl}/api/v1/tenant/members/${member.id}/profile/`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(profileForm),
        }
      )
      if (!profileRes.ok) {
        const data = await profileRes.json()
        throw new Error(data.detail || 'Failed to update profile')
      }

      onSuccess()
    } catch (err) {
      setError(err.message)
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
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Edit Member
              </h2>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100">
          <div className="flex gap-1">
            {['profile', 'role'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-[#8B1E3F] text-[#8B1E3F]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'role' ? 'Role & Permissions' : 'Profile'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {activeTab === 'profile' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, first_name: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, last_name: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                />
              </div>
            </>
          )}

          {activeTab === 'role' && (
            <>
              {isOwner ? (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <p className="text-sm text-purple-800 font-medium">
                    The owner role cannot be changed.
                  </p>
                </div>
              ) : (
                <>
                  {/* Role select */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                      Role
                    </label>
                    <select
                      value={roleForm.role}
                      onChange={(e) =>
                        setRoleForm((p) => ({ ...p, role: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub-admin permissions */}
                  {roleForm.role === 'sub_admin' &&
                    Object.keys(availablePermissions).length > 0 && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Permissions
                        </label>
                        <div className="space-y-3 max-h-52 overflow-y-auto border border-gray-200 rounded-xl p-3">
                          {Object.entries(availablePermissions).map(
                            ([category, group]) => (
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
                                        checked={roleForm.permissions.includes(
                                          perm.code
                                        )}
                                        onChange={() =>
                                          togglePermission(perm.code)
                                        }
                                        className="accent-[#8B1E3F] rounded"
                                      />
                                      <span className="text-sm text-gray-700">
                                        {perm.label}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Provider-specific fields */}
                  {roleForm.role === 'provider' && (
                    <div className="space-y-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        Provider Settings
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Commission %
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={roleForm.commission_percent}
                          onChange={(e) =>
                            setRoleForm((p) => ({
                              ...p,
                              commission_percent: e.target.value,
                            }))
                          }
                          placeholder="80"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.can_accept_bookings}
                          onChange={(e) =>
                            setRoleForm((p) => ({
                              ...p,
                              can_accept_bookings: e.target.checked,
                            }))
                          }
                          className="accent-[#8B1E3F] rounded"
                        />
                        <span className="text-sm text-gray-700">
                          Can accept bookings
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Active toggle */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Active Status</p>
                      <p className="text-xs text-gray-500">
                        Inactive members cannot access the dashboard
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setRoleForm((p) => ({ ...p, is_active: !p.is_active }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        roleForm.is_active ? 'bg-[#8B1E3F]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          roleForm.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}
            </>
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
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}