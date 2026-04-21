// src/app/tenant-site/modules/booking/DateTimePicker.js
"use client";

import { useState, useEffect, useMemo } from "react";

import resolveTranslated from "@/app/tenant-site/[domain]/utils/resolveTranslated";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Pure helpers — NO Date objects, NO timezone conversions ──────────────────

/**
 * Returns today's date in the given IANA timezone as "YYYY-MM-DD".
 * This is the ONLY place we touch Intl/timezone for dates.
 */
function getTodayStr(timezone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // new Date() = "right now in UTC" — safe
}

/**
 * Returns "YYYY-MM-DD" for a given year/month(0-indexed)/day.
 * Pure string arithmetic — no Date, no timezone.
 */
function toDateStr(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Returns the day-of-week (0=Sun … 6=Sat) for the 1st of year/month.
 * Uses Date.UTC so it's always Gregorian calendar, TZ-independent.
 */
function firstDayOfWeek(year, month) {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

/**
 * Returns the number of days in year/month.
 */
function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** "2024-01" from year/month */
function monthLabel(year, month, lang) {
  // Safe: Date.UTC gives a fixed point in time, getUTCFullYear/Month are TZ-free
  const d = new Date(Date.UTC(year, month, 1));
  const locale = lang === "ar" ? "ar-SA" : lang === "ur" ? "ur-PK" : "en-US";
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

/** Parse "HH:MM" → "h:MM AM/PM" */
function formatTime(timeStr) {
  if (!timeStr) return "";
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

/**
 * Format a "YYYY-MM-DD" string for display.
 * We use Date.UTC so the Intl formatter works from a fixed UTC point,
 * then output in the tenant timezone. Safe: no local-midnight ambiguity.
 */
function formatDateStr(dateStr, lang, timezone) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const locale = lang === "ar" ? "ar-SA" : lang === "ur" ? "ur-PK" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DateTimePicker({
  domain,
  service,
  staff,
  selectedDate,   // string "YYYY-MM-DD" | null
  selectedTime,   // string "HH:MM" | null
  onDateSelect,   // (dateStr: string) => void
  onTimeSelect,   // (timeStr: string) => void
  timezone,       // tenant IANA timezone string
  theme,
  lang,
  isRTL,
}) {
  // ── Today as a string in tenant TZ ──────────────────────────────────────
  const todayStr = useMemo(() => getTodayStr(timezone), [timezone]);
  const [todayYear, todayMonth] = todayStr.split("-").map(Number);

  // ── Current month as plain integers ─────────────────────────────────────
  const [calYear,  setCalYear]  = useState(todayYear);
  const [calMonth, setCalMonth] = useState(todayMonth - 1); // 0-indexed

  // ── Slot state ───────────────────────────────────────────────────────────
  const [availableSlots,  setAvailableSlots]  = useState([]);
  const [isLoadingSlots,  setIsLoadingSlots]  = useState(false);
  const [closedDates,     setClosedDates]     = useState({});  // dateStr → reason | true

  // ── Generate calendar days as plain objects ──────────────────────────────
  const calendarDays = useMemo(() => {
    const padding  = firstDayOfWeek(calYear, calMonth); // Sun=0
    const numDays  = daysInMonth(calYear, calMonth);
    const days     = [];

    for (let i = 0; i < padding; i++) {
      days.push(null); // empty cell
    }

    for (let d = 1; d <= numDays; d++) {
      const dateStr = toDateStr(calYear, calMonth, d);
      days.push({
        dateStr,
        day: d,
        isPast:   dateStr < todayStr,
        isToday:  dateStr === todayStr,
        isClosed: !!closedDates[dateStr],
        closedReason: closedDates[dateStr] || null,
      });
    }

    return days;
  }, [calYear, calMonth, todayStr, closedDates]);

  // ── Month navigation — pure arithmetic ──────────────────────────────────
  function goPrevMonth() {
    if (calMonth === 0) {
      setCalYear(y => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth(m => m - 1);
    }
  }

  function goNextMonth() {
    if (calMonth === 11) {
      setCalYear(y => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth(m => m + 1);
    }
  }

  // ── Fetch slots when selectedDate changes ────────────────────────────────
  useEffect(() => {
    if (!selectedDate || !service) {
      setAvailableSlots([]);
      return;
    }

    // Already known as closed — no need to fetch
    if (closedDates[selectedDate]) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;
    setIsLoadingSlots(true);

    const providerParam = staff?.id ? `&provider=${staff.id}` : "";
    // date is already "YYYY-MM-DD" — backend interprets it in tenant TZ
    fetch(
      `${API_BASE}/api/v1/booking/slots/?service=${service.id}&date=${selectedDate}${providerParam}`,
      { headers: { "Content-Type": "application/json", "X-Tenant": domain } }
    )
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const slots = data.slots || [];
        setAvailableSlots(slots);

        // Mark date as closed if no slots at all
        if (slots.length === 0) {
          setClosedDates(prev => ({ ...prev, [selectedDate]: true }));
          return;
        }

        // Mark as "no staff" if every slot is provider_unavailable
        const allNoStaff = slots.every(
          s => !s.available && s.reason === "provider_unavailable"
        );
        if (allNoStaff) {
          setClosedDates(prev => ({ ...prev, [selectedDate]: "provider_unavailable" }));
        }
      })
      .catch(() => {
        if (!cancelled) setAvailableSlots([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });

    return () => { cancelled = true; };
  }, [selectedDate, service?.id, staff?.id, domain]); // NOT timezone — intentional

  // ── Render ───────────────────────────────────────────────────────────────
  const weekDayLabels = isRTL
    ? ["Sat", "Fri", "Thu", "Wed", "Tue", "Mon", "Sun"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const primaryColor = theme?.primary_color || "#3B82F6";

  return (
    <div className="p-6">
      {/* Service summary */}
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
        {/* ── Calendar ── */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {resolveTranslated({ en: "Select Date", ar: "اختر التاريخ", ur: "تاریخ منتخب کریں" }, lang)}
          </h3>

          {/* Month navigation */}
          <div className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={goPrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            </button>

            <h4 className="font-semibold text-gray-900">
              {monthLabel(calYear, calMonth, lang)}
            </h4>

            <button
              onClick={goNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDayLabels.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayObj, idx) => {
              if (!dayObj) {
                // Empty cell
                return <div key={`empty-${idx}`} />;
              }

              const { dateStr, day, isPast, isToday, isClosed, closedReason } = dayObj;
              const isSelected = dateStr === selectedDate;
              const isDisabled = isPast;

              return (
                <button
                  key={dateStr}
                  disabled={isDisabled}
                  onClick={() => !isDisabled && onDateSelect(dateStr)}
                  className={[
                    "relative aspect-square rounded-lg text-sm font-medium transition-colors",
                    isDisabled
                      ? "text-gray-300 cursor-not-allowed"
                      : isSelected
                      ? "text-white"
                      : isToday
                      ? "ring-2 ring-offset-1 hover:bg-gray-100"
                      : "hover:bg-gray-100 text-gray-700",
                  ].join(" ")}
                  style={{
                    backgroundColor: isSelected ? primaryColor : undefined,
                    ringColor: isToday && !isSelected ? primaryColor : undefined,
                  }}
                >
                  {day}

                  {isClosed && !isDisabled && (
                    <span
                      className={`
                        absolute bottom-0.5 left-0.5 right-0.5 text-[9px] rounded leading-tight
                        ${closedReason === "provider_unavailable"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-red-100 text-red-600"}
                      `}
                    >
                      {closedReason === "provider_unavailable"
                        ? resolveTranslated({ en: "No staff", ar: "لا موظف", ur: "عملہ نہیں" }, lang)
                        : resolveTranslated({ en: "Closed", ar: "مغلق", ur: "بند" }, lang)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Time slots ── */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {resolveTranslated({ en: "Select Time", ar: "اختر الوقت", ur: "وقت منتخب کریں" }, lang)}
          </h3>

          {!selectedDate ? (
            <EmptyState
              icon="📅"
              text={resolveTranslated({ en: "Select a date first", ar: "اختر التاريخ أولاً", ur: "پہلے تاریخ منتخب کریں" }, lang)}
            />
          ) : isLoadingSlots ? (
            <SlotSkeleton />
          ) : availableSlots.length === 0 ? (
            <EmptyState
              icon="😔"
              text={resolveTranslated({ en: "No available slots", ar: "لا توجد مواعيد متاحة", ur: "کوئی سلاٹ نہیں" }, lang)}
            />
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {availableSlots.map(slot => {
                const timeStr    = slot.time;        // "HH:MM" from backend
                const isSelected = timeStr === selectedTime;
                const isAvail    = slot.available !== false;

                return (
                  <div key={timeStr} className="flex flex-col items-center gap-1">
                    <button
                      disabled={!isAvail}
                      onClick={() => isAvail && onTimeSelect(timeStr)}
                      className={[
                        "py-3 px-2 rounded-lg text-sm font-medium transition-all w-full",
                        !isAvail
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isSelected
                          ? "text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700",
                      ].join(" ")}
                      style={{
                        backgroundColor: isSelected ? primaryColor : undefined,
                      }}
                    >
                      {formatTime(timeStr)}
                    </button>

                    {!isAvail && (
                      <span className="text-[10px] text-center text-red-500 leading-tight">
                        {slot.reason === "provider_unavailable"
                          ? resolveTranslated({ en: "No staff", ar: "لا موظف", ur: "عملہ نہیں" }, lang)
                          : slot.reason === "service_unavailable"
                          ? resolveTranslated({ en: "Unavailable", ar: "غير متاح", ur: "دستیاب نہیں" }, lang)
                          : resolveTranslated({ en: "Booked", ar: "محجوز", ur: "بک" }, lang)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function ChevronLeft({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm text-center">{text}</p>
    </div>
  );
}

function SlotSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export { formatDateStr, formatTime, getTodayStr };