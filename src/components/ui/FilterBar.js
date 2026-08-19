"use client";

/**
 * FilterBar — pill-row filters with active state + count badges.
 *
 *   <FilterBar
 *     value={statusFilter}
 *     onChange={setStatusFilter}
 *     options={[
 *       { value: "all", label: "All", count: 42 },
 *       { value: "open", label: "Open", count: 7, tone: "warning" },
 *     ]}
 *   />
 *
 * Tones map onto the semantic status tokens.
 */

const TONE_DOT = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-muted-foreground",
  // Legacy aliases
  emerald: "bg-success",
  green: "bg-success",
  yellow: "bg-warning",
  amber: "bg-warning",
  rose: "bg-danger",
  red: "bg-danger",
  blue: "bg-info",
  gray: "bg-muted-foreground",
  slate: "bg-muted-foreground",
  indigo: "bg-indigo-400",
  purple: "bg-purple-400",
};

export default function FilterBar({
  value, onChange, options, ariaLabel = "Filters", className = "",
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex gap-2 overflow-x-auto ${className}`}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            {opt.tone && (
              <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[opt.tone] || TONE_DOT.neutral}`} />
            )}
            {opt.label}
            {typeof opt.count === "number" && opt.count > 0 && (
              <span
                className={`ms-1 inline-flex items-center px-1.5 rounded-full text-[10px] font-semibold ${
                  isActive ? "bg-white/20" : "bg-surface text-foreground border border-border"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
