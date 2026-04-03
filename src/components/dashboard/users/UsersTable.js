'use client'

import {
  Search,
  Filter,
  Edit2,
  Trash2,
  RotateCcw,
  Send,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  UserCheck,
  Briefcase,
  Users as UsersIcon,
  User as UserIcon,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTenantPermission } from "@/lib/useTenantPermission";

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'sub_admin', label: 'Sub Admin' },
  { value: 'provider', label: 'Provider' },
  { value: 'staff', label: 'Staff' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'all', label: 'All' },
]

const ROLE_BADGE = {
  owner: { bg: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield },
  admin: { bg: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserCheck },
  sub_admin: { bg: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: UserCheck },
  provider: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Briefcase },
  staff: { bg: 'bg-amber-100 text-amber-700 border-amber-200', icon: UsersIcon },
  customer: { bg: 'bg-gray-100 text-gray-600 border-gray-200', icon: UserIcon },
}


function RoleBadge({ role }) {
  const config = ROLE_BADGE[role] || ROLE_BADGE.customer
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.bg}`}
    >
      <Icon className="w-3 h-3" />
      {role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </span>
  )
}

function StatusDot({ active }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}
      />
      <span className={`text-xs font-medium ${active ? 'text-emerald-700' : 'text-gray-500'}`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    </span>
  )
}

function Avatar({ name, email }) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() || '?'

  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-sm flex-shrink-0">
      <span className="text-white text-sm font-bold">{initials}</span>
    </div>
  )
}

// ── Action dropdown ──
function ActionMenu({ member, onEdit, onDelete, onReactivate, onResendInvite }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isOwner = member.role === 'owner'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-20 py-1">
          <button
            onClick={() => { onEdit(member); setOpen(false) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#8B1E3F]/5 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Member
          </button>

          {!member.is_user_active && (
            <button
              onClick={() => { onResendInvite(member.id); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#8B1E3F]/5 transition-colors"
            >
              <Send className="w-4 h-4" />
              Resend Invite
            </button>
          )}

          {!member.is_active && !isOwner && (
            <button
              onClick={() => { onReactivate(member.id); setOpen(false) }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reactivate
            </button>
          )}

          {!isOwner && member.is_active && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { onDelete(member); setOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Deactivate
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Table Component ──

export default function UsersTable({
  canManage,
  members,
  loading,
  roleFilter,
  statusFilter,
  searchQuery,
  onRoleFilterChange,
  onStatusFilterChange,
  onSearchChange,
  onEdit,
  onDelete,
  onReactivate,
  onResendInvite,
  page,
  totalPages,
  totalCount,
  onPageChange,
}) {
  
  return (
    <div className="bg-white rounded-2xl border border-[#8B1E3F]/10 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all text-sm"
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              {canManage && (
                <th className="text-right px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F] mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading members…</p>
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No members found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try adjusting your filters or invite a new member.
                  </p>
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr
                  key={m.id}
                  className="hover:bg-[#8B1E3F]/[0.02] transition-colors"
                >
                  {/* Member info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} email={m.email} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {m.name || 'Pending'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{m.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <RoleBadge role={m.role} />
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusDot active={m.is_active} />
                  </td>

                  {/* Last login */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {m.last_login
                      ? new Date(m.last_login).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(m.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {canManage && (
                      <ActionMenu
                        member={m}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReactivate={onReactivate}
                        onResendInvite={onResendInvite}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{(page - 1) * 20 + 1}</span> to{' '}
            <span className="font-medium">{Math.min(page * 20, totalCount)}</span> of{' '}
            <span className="font-medium">{totalCount}</span> members
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}