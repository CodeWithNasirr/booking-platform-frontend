'use client'

import { Globe } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export default function CoverageTab() {
  const { t } = useApp()

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <Globe className="w-8 h-8 text-indigo-500" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t("coverage.title")}
      </h3>

      <p className="text-sm text-gray-500 max-w-sm">
        {t("coverage.description")}
      </p>
    </div>
  )
}
