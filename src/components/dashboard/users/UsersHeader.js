'use client'

import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  UserCheck,
} from 'lucide-react'

const ROLE_CARDS = [
  { key: 'owner', label: 'Owner', icon: Shield, color: 'from-[#8B1E3F] to-[#6B1630]' },
  { key: 'admin', label: 'Admin', icon: UserCheck, color: 'from-blue-500 to-blue-600' },
  { key: 'provider', label: 'Providers', icon: Briefcase, color: 'from-emerald-500 to-emerald-600' },
  { key: 'staff', label: 'Staff', icon: Users, color: 'from-amber-500 to-amber-600' },
]

export default function UsersHeader({ totalCount, roleCounts, onInvite }) {
  return (
    <>
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage your team's access and roles
          </p>
        </div>
        <button
          onClick={onInvite}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <div className="p-5 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          <div className="text-sm text-gray-600 font-medium">Total Members</div>
        </div>

        {/* Per-role cards */}
        {ROLE_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.key}
              className="p-5 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {roleCounts[card.key] || 0}
              </div>
              <div className="text-sm text-gray-600 font-medium">{card.label}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}