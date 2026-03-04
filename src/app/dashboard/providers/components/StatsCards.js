'use client'

import { Users, UserCheck, UserX, Calendar } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export default function StatsCards({ providers }) {
  const { t } = useApp()

  const stats = [
    {
      label: t("providers.stats.total"),
      value: providers.length,
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      label: t("providers.stats.active"),
      value: providers.filter(p => p.isActive).length,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: t("providers.stats.inactive"),
      value: providers.filter(p => !p.isActive).length,
      icon: UserX,
      gradient: 'from-slate-400 to-slate-500',
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-600',
    },
    {
      label: t("providers.stats.sessions"),
      value: providers.reduce(
        (acc, p) => acc + (p.completedBookings || 0),
        0
      ),
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stat.value.toLocaleString()}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
              >
                <Icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>

            <div
              className={`mt-3 h-1 w-full rounded-full bg-gradient-to-r ${stat.gradient} opacity-20`}
            />
          </div>
        )
      })}
    </div>
  )
}
