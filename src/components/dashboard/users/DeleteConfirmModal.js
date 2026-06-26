'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'

export default function DeleteConfirmModal({ member, onClose, onConfirm }) {
  const { t } = useApp()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#8B1E3F]/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900"> {t('users.deleteModal.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-gray-700">
          {t('users.deleteModal.confirm')}{" "}
          <span className="font-semibold text-gray-900">
            {member.name || member.email}
          </span>
          ?
        </p>

        <p className="text-sm text-gray-500 mt-2">
          {t('users.deleteModal.description')}
        </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-white bg-red-600 hover:bg-red-700 transition-all shadow-md font-medium"
          >
            {t('users.actions.deactivate')}
          </button>
        </div>
      </div>
    </div>
  )
}