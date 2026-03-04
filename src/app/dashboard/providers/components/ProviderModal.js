'use client'

import { X } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import BasicInfoTab from '../tabs/BasicInfoTab'
import AvailabilityTab from '../tabs/AvailabilityTab'
import CoverageTab from '../tabs/CoverageTab'

export default function ProviderModal({
  editing,
  form,
  setForm,
  activeTab,
  setActiveTab,
  onSave,
  onClose,
}) {
  const { t, isRTL } = useApp()

  const tabs = [
    { key: 'basic', label: t("provider.modal.profile") },
    { key: 'availability', label: t("provider.modal.schedule") },
    { key: 'areas', label: t("provider.modal.coverage") },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">
            {editing
              ? t("provider.modal.editTitle")
              : t("provider.modal.addTitle")}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 pt-4 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.key
                    ? 'text-indigo-600 border-indigo-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'basic' && (
            <BasicInfoTab form={form} setForm={setForm} editing={editing} />
          )}
          {activeTab === 'availability' && (
            <AvailabilityTab
              form={form}
              // updateAvailability={updateAvailability}
              setForm={setForm}
            />
          )}
          {activeTab === 'areas' && <CoverageTab />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border rounded-xl text-gray-700 font-medium"
          >
            {t("provider.modal.cancel")}
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-medium"
          >
            {editing
              ? t("provider.modal.save")
              : t("provider.modal.add")}
          </button>
        </div>
      </div>
    </div>
  )
}
