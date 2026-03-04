"use client";

import { useApp } from "@/contexts/AppContext";

export function AvailabilityManager({ availability, onChange }) {
  const { t } = useApp();

  const days = [
    t("days.monday"),
    t("days.tuesday"),
    t("days.wednesday"),
    t("days.thursday"),
    t("days.friday"),
    t("days.saturday"),
    t("days.sunday"),
  ];

  const toggleDay = (dayIndex) => {
    const exists = availability.find((a) => a.day_of_week === dayIndex);

    if (exists) {
      onChange(availability.filter((a) => a.day_of_week !== dayIndex));
    } else {
      onChange([
        ...availability,
        {
          day_of_week: dayIndex,
          start_time: "09:00",
          end_time: "17:00",
          slot_duration: 60,
          buffer_time: 15,
          max_bookings_per_slot: 1,
        },
      ]);
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">
        {t("availability.weeklySchedule")}
      </h4>

      {days.map((day, idx) => {
        const config = availability.find(
          (a) => a.day_of_week === idx
        );

        return (
          <div
            key={day}
            className="flex items-center gap-4 p-3 border rounded-lg"
          >
            <input
              type="checkbox"
              checked={!!config}
              onChange={() => toggleDay(idx)}
              className="rounded text-[#8B1E3F]"
            />

            <span className="w-24 font-medium">{day}</span>

            {config && (
              <>
                <input
                  type="time"
                  value={config.start_time}
                  onChange={(e) => {
                    const newAvail = availability.map((a) =>
                      a.day_of_week === idx
                        ? { ...a, start_time: e.target.value }
                        : a
                    );
                    onChange(newAvail);
                  }}
                  className="px-2 py-1 border rounded"
                />

                <span>{t("common.to")}</span>

                <input
                  type="time"
                  value={config.end_time}
                  onChange={(e) => {
                    const newAvail = availability.map((a) =>
                      a.day_of_week === idx
                        ? { ...a, end_time: e.target.value }
                        : a
                    );
                    onChange(newAvail);
                  }}
                  className="px-2 py-1 border rounded"
                />

                <select
                  value={config.slot_duration}
                  onChange={(e) => {
                    const newAvail = availability.map((a) =>
                      a.day_of_week === idx
                        ? {
                            ...a,
                            slot_duration: parseInt(e.target.value),
                          }
                        : a
                    );
                    onChange(newAvail);
                  }}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={30}>
                    {t("availability.slot30")}
                  </option>
                  <option value={60}>
                    {t("availability.slot60")}
                  </option>
                  <option value={90}>
                    {t("availability.slot90")}
                  </option>
                  <option value={120}>
                    {t("availability.slot120")}
                  </option>
                </select>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
