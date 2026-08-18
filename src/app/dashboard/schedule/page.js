// /dashboard/schedule/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import AvailabilityTab from '../providers/tabs/AvailabilityTab'
import { Save, Calendar } from 'lucide-react'
// Change your import to:
import { authFetch } from '../providers/lib/api'
import { updateAvailability } from '../providers/lib/api'
import TenantPermissionGate from "@/components/dashboard/TenantPermissionGate";

const defaultAvailability = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '', end: '' },
  sunday: { enabled: false, start: '', end: '' },
}

function SchedulePageInner() {
  const { activeTenant, t, user } = useApp()
  const router = useRouter()
  const [provider, setProvider] = useState(null)
  const [form, setForm] = useState({ availability: defaultAvailability })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)


  const transformMyAvailability = (data) => {
    const daysMap = {
        0: 'monday',
        1: 'tuesday',
        2: 'wednesday',
        3: 'thursday',
        4: 'friday',
        5: 'saturday',
        6: 'sunday',
    }

    const result = { ...defaultAvailability }

    data.forEach(day => {
        const key = daysMap[day.day_of_week]

        result[key] = {
        enabled: day.available,
        start: day.slots?.[0]?.start || '09:00',
        end: day.slots?.[0]?.end || '17:00',
        }
    })

    return result
    }

  // Fetch provider on mount
  useEffect(() => {
  const fetchProvider = async () => {
    try {
      // 1️⃣ Get provider
      const res = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/providers/me/`,
        activeTenant
      )
      const data = await res.json()
      setProvider(data)

      // 2️⃣ Get availability
      const availabilityRes = await authFetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/providers/my-availability/`,
        activeTenant
      )
      const availabilityData = await availabilityRes.json()


      // 3️⃣ Transform it
      const formatted = transformMyAvailability(availabilityData)

      setForm({ availability: formatted })

    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  if (activeTenant) fetchProvider()
}, [activeTenant])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSave = async () => {
    if (!provider) return
    
    setIsSaving(true)
    try {
      // Use your existing availability endpoint
     await updateAvailability(activeTenant, provider.id, form.availability)
     console.log('Updated availability:', form.availability) // ✅ Debug log
      showToast(t('schedule.saved') || 'Schedule saved successfully')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Calendar className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('schedule.title') || 'My Schedule'}
          </h1>
        </div>
        <p className="text-gray-500">
          {t('schedule.subtitle') || 'Manage your weekly availability for bookings'}
        </p>
      </div>

      {/* Availability Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <AvailabilityTab form={form} setForm={setForm} />
        
        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {t('common.saving') || 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('common.save') || 'Save Schedule'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`px-6 py-3 rounded-xl shadow-lg text-white font-medium ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SchedulePage(props) {
  return (
    <TenantPermissionGate permission="calendar.view">
      <SchedulePageInner {...props} />
    </TenantPermissionGate>
  );
}
