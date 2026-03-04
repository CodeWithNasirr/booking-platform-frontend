// =============================================================================
// DATE TIME PICKER COMPONENT
// =============================================================================
"use client";

import { useState, useEffect } from "react";
import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";

import { formatTime } from "../utils/time";



export default function DateTimePicker({
  tenantId,
  domain,
  service,
  staff,
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  theme,
  lang,
  isRTL,
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [closedDates, setClosedDates] = useState({});

  const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    
    const days = [];
    
    // Previous month padding
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, disabled: true });
    }
    
    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isPast = date < today;
      // const isSunday = date.getDay() === 0; // Example: closed on Sundays
      
    const dateStr = date
        ? toYMD(date)
        : null;

      days.push({
        date,
        day: d,
        dateStr,
        disabled: isPast,
        isClosed: !!closedDates[dateStr],
        isToday: date.getTime() === today.getTime(),
      });

    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = isRTL 
    ? ["Sat", "Fri", "Thu", "Wed", "Tue", "Mon", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function toYMD(date) {
      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
    }

  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate || !service) return;

      const dateStr = toYMD(selectedDate);

      if (closedDates[dateStr]) {
        // This date is already known to have no slots
        setAvailableSlots([]);
        return;
      }

      setIsLoadingSlots(true);

      try {
        const providerParam = staff ? `&provider=${staff.id}` : "";
        const res = await fetch(
          `${API_BASE}/api/v1/booking/slots/?service=${service.id}&date=${dateStr}${providerParam}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Tenant": domain,
            },
          }
        );

        const data = await res.json();
        console.log(data)
        const slots = data.slots || [];

        setAvailableSlots(slots);

        // 👇 MARK DATE AS CLOSED IF NO SLOTS
        if (slots.length === 0) {
          setClosedDates(prev => ({
            ...prev,
            [dateStr]: true,
          }));
        }
      } catch (e) {
        console.error(e);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    
    fetchSlots();
  }, [selectedDate, service, staff]);




  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : lang === "ur" ? "ur-PK" : "en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const isDateSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="p-6">
      {/* Service Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-500">
          {resolveTranslated({ en: "Selected Service", ar: "الخدمة المختارة", ur: "منتخب سروس" }, lang)}
        </p>
        <p className="font-semibold text-gray-900">
          {resolveTranslated(service?.title || service?.name, lang)}
        </p>
        {staff && (
          <p className="text-sm text-gray-600">
            {resolveTranslated({ en: "with", ar: "مع", ur: "کے ساتھ" }, lang)} {staff.name}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {resolveTranslated({ en: "Select Date", ar: "اختر التاريخ", ur: "تاریخ منتخب کریں" }, lang)}
          </h3>

          {/* Month Navigation */}
          <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h4 className="font-semibold text-gray-900">
              {formatMonthYear(currentMonth)}
            </h4>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayObj) => (
              <button
                key={dayObj.dateStr || `empty-${Math.random()}`}
                disabled={dayObj.disabled}
                onClick={() => dayObj.date && onDateSelect(dayObj.date)}
                className={`
                  relative aspect-square rounded-lg text-sm font-medium
                  ${dayObj.disabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"}
                  ${isDateSelected(dayObj.date) ? "text-white" : ""}
                `}
                style={{
                  backgroundColor: isDateSelected(dayObj.date)
                    ? theme.primary_color || "#3B82F6"
                    : undefined,
                }}
              >
                {dayObj.day}

                {dayObj.isClosed && (
                  <span className="absolute bottom-1 left-1 right-1 text-[10px] bg-red-100 text-red-600 rounded">
                    Closed
                  </span>
                )}
              </button>
            ))}

          </div>
        </div>

        {/* Time Slots */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {resolveTranslated({ en: "Select Time", ar: "اختر الوقت", ur: "وقت منتخب کریں" }, lang)}
          </h3>

          {!selectedDate ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-4">📅</div>
              <p>
                {resolveTranslated({ en: "Select a date first", ar: "اختر التاريخ أولاً", ur: "پہلے تاریخ منتخب کریں" }, lang)}
              </p>
            </div>
          ) : isLoadingSlots ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
              {availableSlots.map((slot) => {
                const time = slot.time || slot.start_time || slot;
                const isSelected = selectedTime === time;
                const isAvailable = slot.available !== false;

                return (
                  <button
                    key={time}
                    disabled={!isAvailable}
                    onClick={() => onTimeSelect(time)}
                    className={`
                      py-3 px-4 rounded-lg text-sm font-medium transition-all
                      ${!isAvailable ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}
                      ${isSelected ? "text-white" : isAvailable ? "bg-gray-100 hover:bg-gray-200 text-gray-700" : ""}
                    `}
                    style={{
                      backgroundColor: isSelected ? theme.primary_color || "#3B82F6" : undefined
                    }}
                  >
                    {formatTime(time)}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-4">😔</div>
              <p>
                {resolveTranslated({ en: "No available slots", ar: "لا توجد مواعيد متاحة", ur: "کوئی دستیاب سلاٹ نہیں" }, lang)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}