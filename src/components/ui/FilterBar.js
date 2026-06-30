"use client";

/**
 * FilterBar — pill-row filters with active state + count badges.
 *
 *   <FilterBar
 *     value={statusFilter}
 *     onChange={setStatusFilter}
 *     options={[
 *       { value: "all", label: "All", count: 42 },
 *       { value: "open", label: "Open", count: 7, tone: "yellow" },
 *     ]}
 *   />
 */

const TONE_DOT = {
  yellow: "bg-yellow-400",
  blue: "bg-blue-400",
  indigo: "bg-indigo-400",
  emerald: "bg-emerald-400",
  purple: "bg-purple-400",
  slate: "bg-slate-400",
  rose: "bg-rose-400",
  gray: "bg-gray-400",
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
            className={`flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-medium whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary,#3B82F6)]/30 ${
              isActive
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.tone && (
              <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[opt.tone] || TONE_DOT.gray}`} />
            )}
            {opt.label}
            {typeof opt.count === "number" && opt.count > 0 && (
              <span
                className={`ml-1 inline-flex items-center px-1.5 rounded-full text-[10px] font-semibold ${
                  isActive ? "bg-white/20" : "bg-white text-gray-700 border border-gray-200"
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
