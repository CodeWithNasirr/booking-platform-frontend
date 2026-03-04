"use client";

import { useApp } from "@/contexts/AppContext";

export default function Step4_Availability({
  daysOfWeek,
  weeklySchedule,
  toggleDay,
  updateScheduleTime,
  tenantState,
}) {
  const { t, isRTL } = useApp();

  const timeInputBase =
    "h-10 rounded-lg border border-border bg-background px-3 text-sm " +
    "text-foreground focus:outline-none focus:ring-2 focus:ring-ring " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t("onboarding.step4.title")}
        </h3>

        <p className="text-foreground/70">
          {t("onboarding.step4.subtitle")}
        </p>

        {/* MULTI PROVIDER NOTE */}
        {tenantState?.has_providers && (
          <p className="text-sm text-muted mt-1">
            {t("onboarding.step4.multiProviderNote")}
          </p>
        )}
      </div>

      {/* DAYS LIST */}
      <div className="space-y-3">
        {daysOfWeek.map((day) => {
          const dayState = weeklySchedule[day.id];
          const enabled = dayState.enabled;

          return (
            <div
              key={day.id}
              className={[
                "p-4 rounded-2xl border flex items-center justify-between gap-4 transition",
                enabled
                  ? "bg-background border-border"
                  : "bg-secondary border-border/60",
                isRTL ? "flex-row-reverse" : "",
              ].join(" ")}
            >
              {/* DAY + TOGGLE */}
              <div className="flex items-center gap-4 min-w-[160px]">
                <button
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={[
                    "relative inline-flex h-6 w-11 items-center rounded-full transition",
                    enabled ? "bg-primary" : "bg-border",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-block h-5 w-5 transform rounded-full bg-background shadow transition",
                      enabled ? isRTL
                    ? "-translate-x-7" // RTL ON → left
                    : "translate-x-7"  // LTR ON → right
                  : isRTL
                  ? "-translate-x-1"   // RTL OFF → right
                  : "translate-x-1",  // LTR OFF → left,
                    ].join(" ")}
                  />
                </button>

                <span
                  className={[
                    "font-medium",
                    enabled ? "text-foreground" : "text-foreground/50",
                  ].join(" ")}
                >
                  {t(`weekdays.${day.id}`)}
                </span>
              </div>

              {/* TIME RANGE */}
              <div className="flex flex-1 items-center gap-4 justify-end">
                <input
                  type="time"
                  className={timeInputBase}
                  value={dayState.start}
                  disabled={!enabled}
                  onChange={(e) =>
                    updateScheduleTime(day.id, "start", e.target.value)
                  }
                />

                <span className="text-foreground/40">
                  {t("onboarding.step4.to")}
                </span>

                <input
                  type="time"
                  className={timeInputBase}
                  value={dayState.end}
                  disabled={!enabled}
                  onChange={(e) =>
                    updateScheduleTime(day.id, "end", e.target.value)
                  }
                />
              </div>

              {/* STATUS */}
              {!enabled && (
                <span className="text-sm text-foreground/40 ml-2">
                  {t("onboarding.step4.unavailable")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* TIP */}
      <div className="p-4 bg-accent border border-border rounded-2xl">
        <p className="text-sm text-foreground/80">
          <strong>{t("common.tip")}:</strong>{" "}
          {t("onboarding.step4.tip")}
        </p>
      </div>
    </div>
  );
}
