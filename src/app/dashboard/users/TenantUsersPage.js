'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'


import UsersHeader from '@/components/dashboard/users/UsersHeader'
import UsersTable from '@/components/dashboard/users/UsersTable'
import InviteMemberModal from '@/components/dashboard/users/InviteMemberModal'
import EditMemberModal from '@/components/dashboard/users/EditMemberModal'
import DeleteConfirmModal from '@/components/dashboard/users/DeleteConfirmModal'
import { useTenantPermission } from "@/lib/useTenantPermission";
import { apiFetch as authFetch } from "@/lib/apiClient";


export default function TenantUsersPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant } = useApp()
  const router = useRouter()


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



  // ── Fetch members ──
  const fetchMembers = useCallback(async () => {
    if (!activeTenant) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        status: statusFilter,
      })
      if (roleFilter) params.set('role', roleFilter)
      if (searchQuery) params.set('search', searchQuery)

     const data = await authFetch(
        `/api/v1/tenant/members/?${params}`,
        activeTenant
      )

      setMembers(data.results || [])
      setTotalCount(data.count || 0)
      setRoleCounts(data.role_counts || {})
    } catch (err) {
      console.error('Failed to fetch members:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTenant, page, pageSize, roleFilter, statusFilter, searchQuery])

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

  const handleDelete = async (memberId) => {
    if (!canManage) return;
    if (!deleteMember) return
    try {
      await authFetch(
        `/api/v1/tenant/members/${memberId}/delete/`,
        activeTenant,
        {
          method: "DELETE",
        }
      )
      setDeleteMember(null)
      fetchMembers()
    } catch (err) {
      console.error('Failed to deactivate member:', err)
    }
  }

  const handleReactivate = async (memberId) => {
    if (!canManage) return;
    try {
      await authFetch(
        `/api/v1/tenant/members/${memberId}/reactivate/`,
        activeTenant,
        {
          method: "POST",
        }
      )
      fetchMembers()
    } catch (err) {
      console.error('Failed to reactivate member:', err)
    }
  }

  const handleResendInvite = async (memberId) => {
    if (!canManage) return;
    try {
      const res = await authFetch(
        `/api/v1/tenant/members/${memberId}/resend-invite/`,
        activeTenant,
        {
          method: "POST",
        }
      )

    alert("Invitation resent successfully!")
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
        />
      )}

      {/* Edit Modal */}
      {editMember && (
      <EditMemberModal
        member={editMember}
        onClose={() => setEditMember(null)}
        onSuccess={handleEditSuccess}
      />
      )}

      {/* Delete Confirm */}
      {deleteMember && (
        <DeleteConfirmModal
          member={deleteMember}
          onClose={() => setDeleteMember(null)}
          onConfirm={() => handleDelete(deleteMember.id)}
        />
      )}
    </div>
  )
}