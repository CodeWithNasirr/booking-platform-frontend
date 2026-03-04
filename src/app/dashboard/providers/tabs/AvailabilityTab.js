'use client'

import { useApp } from '@/contexts/AppContext'

const daysOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export default function AvailabilityTab({ form, setForm  }) {
  const { t } = useApp()

  const handleChange = (day, field, value) => {
    setForm((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }))
  }

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          {t("availability.title")}
        </h3>
        <p className="text-sm text-gray-500">
          {t("availability.subtitle")}
        </p>
      </div>

      {daysOfWeek.map((day) => {
        const dayData = form.availability[day]

        return (
          <div
            key={day}
            className="p-4 bg-gray-50 rounded-xl border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={dayData.enabled}
                  onChange={(e) =>
                    handleChange(day, 'enabled', e.target.checked)
                  }
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className="text-sm font-semibold text-gray-900">
                  {t(`availability.day.${day}`)}
                </label>
              </div>
            </div>

            {dayData.enabled && (
              <div className="grid grid-cols-2 gap-3 ml-8">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {t("availability.start")}
                  </label>
                  <input
                    type="time"
                    value={dayData.start}
                    onChange={(e) =>
                      handleChange(day, 'start', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {t("availability.end")}
                  </label>
                  <input
                    type="time"
                    value={dayData.end}
                    onChange={(e) =>
                      handleChange(day, 'end', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
