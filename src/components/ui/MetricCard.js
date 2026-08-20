"use client";

import Card from "./Card";

/**
 * MetricCard — KPI tile. Number, label, optional delta + icon.
 * Dashboards stack these in a 1/2/4-column responsive grid.
 */
export default function MetricCard({
  label, value, delta, hint, icon: Icon, className = "",
}) {
  return (
    <Card padding="lg" className={className}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            {value}
          </p>
          {(delta || hint) && (
            <p className={`text-xs mt-1 ${delta && delta < 0 ? "text-danger" : "text-success"}`}>
              {typeof delta === "number" && (
                <>{delta >= 0 ? "▲ " : "▼ "}{Math.abs(delta)}% </>
              )}
              {hint && <span className="text-muted-foreground">{hint}</span>}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </Card>
  );
}
