'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
import Cookies from 'js-cookie'

import UsersHeader from '@/components/dashboard/users/UsersHeader'
import UsersTable from '@/components/dashboard/users/UsersTable'
import InviteMemberModal from '@/components/dashboard/users/InviteMemberModal'
import EditMemberModal from '@/components/dashboard/users/EditMemberModal'
import DeleteConfirmModal from '@/components/dashboard/users/DeleteConfirmModal'
import { useTenantPermission } from "@/lib/useTenantPermission";

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function TenantUsersPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant } = useApp()
  const router = useRouter()
  const token = Cookies.get('access_token')

  // ── Auth guards ──
  useBlockBackNavigation(!!user)
  useEffect(() => {
    if (!loadingUser && !user) router.replace('/')
  }, [loadingUser, user, router])
  useEffect(() => {
    if (requiresOnboarding) router.replace('/auth/onboarding?step=1')
  }, [requiresOnboarding, router])

  // ── State ──
  const [members, setMembers] = useState([])
  const [roleCounts, setRoleCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Filters
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [deleteMember, setDeleteMember] = useState(null)

  const { allowed: canManage } = useTenantPermission("members.manage");


  const headers = {
    Authorization: `Bearer ${token}`,
    'X-Tenant': activeTenant,
    'Content-Type': 'application/json',
  }

  // ── Fetch members ──
  const fetchMembers = useCallback(async () => {
    if (!activeTenant || !token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        status: statusFilter,
      })
      if (roleFilter) params.set('role', roleFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`${API}/api/v1/tenant/members/?${params}`, { headers })
      const data = await res.json()

      setMembers(data.results || [])
      setTotalCount(data.count || 0)
      setRoleCounts(data.role_counts || {})
    } catch (err) {
      console.error('Failed to fetch members:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTenant, token, page, pageSize, roleFilter, statusFilter, searchQuery])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [roleFilter, statusFilter, searchQuery])

  // ── Handlers ──
  const handleInviteSuccess = () => {
    setShowInviteModal(false)
    fetchMembers()
  }

  const handleEditSuccess = () => {
    setEditMember(null)
    fetchMembers()
  }

  const handleDelete = async () => {
    if (!canManage) return;
    if (!deleteMember) return
    try {
      await fetch(`${API}/api/v1/tenant/members/${deleteMember.id}/delete/`, {
        method: 'DELETE',
        headers,
      })
      setDeleteMember(null)
      fetchMembers()
    } catch (err) {
      console.error('Failed to deactivate member:', err)
    }
  }

  const handleReactivate = async (memberId) => {
    if (!canManage) return;
    try {
      await fetch(`${API}/api/v1/tenant/members/${memberId}/reactivate/`, {
        method: 'POST',
        headers,
      })
      fetchMembers()
    } catch (err) {
      console.error('Failed to reactivate member:', err)
    }
  }

  const handleResendInvite = async (memberId) => {
    if (!canManage) return;
    try {
      const res = await fetch(`${API}/api/v1/tenant/members/${memberId}/resend-invite/`, {
        method: 'POST',
        headers,
      })
      const data = await res.json()
      if (res.ok) {
        alert('Invitation resent successfully!')
      } else {
        alert(data.detail || 'Failed to resend invitation')
      }
    } catch (err) {
      console.error('Failed to resend invite:', err)
    }
  }

  if (requiresOnboarding || loadingUser) return null

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="space-y-6 p-6 bg-[#FAF5F7] min-h-screen">
      {canManage && (
      <UsersHeader
        totalCount={totalCount}
        roleCounts={roleCounts}
        onInvite={() => setShowInviteModal(true)}
      />
      )}

      <UsersTable
        canManage={canManage}
        members={members}
        loading={loading}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={setSearchQuery}
        onEdit={setEditMember}
        onDelete={setDeleteMember}
        onReactivate={handleReactivate}
        onResendInvite={handleResendInvite}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setPage}
      />

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
          headers={headers}
          apiUrl={API}
        />
      )}

      {/* Edit Modal */}
      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onSuccess={handleEditSuccess}
          headers={headers}
          apiUrl={API}
        />
      )}

      {/* Delete Confirm */}
      {deleteMember && (
        <DeleteConfirmModal
          member={deleteMember}
          onClose={() => setDeleteMember(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}