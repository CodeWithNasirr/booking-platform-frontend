"use client";

/**
 * Tabs — controlled, token-based tab strip. Two visual styles:
 *   variant="underline" (default) — page-level section tabs
 *   variant="segment"             — pill/segmented control
 *
 *   <Tabs
 *     value={tab}
 *     onChange={setTab}
 *     items={[
 *       { value: "all", label: "All", count: 12 },
 *       { value: "open", label: "Open", icon: Inbox },
 *     ]}
 *   />
 *
 * Renders an ARIA tablist; pair panels with role="tabpanel".
 */
export default function Tabs({
  value, onChange, items = [], variant = "underline",
  ariaLabel = "Tabs", className = "",
}) {
  const isSegment = variant === "segment";
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={
        isSegment
          ? `inline-flex items-center gap-1 p-1 rounded-xl bg-muted overflow-x-auto ${className}`
          : `flex items-center gap-1 border-b border-border overflow-x-auto ${className}`
      }
    >
      {items.map((item) => {
        const active = value === item.value;
        const Icon = item.icon;
        if (isSegment) {
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                active
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {item.label}
              {typeof item.count === "number" && (
                <span className="ms-1 text-[10px] font-semibold text-muted-foreground">
                  {item.count}
                </span>
              )}
            </button>
          );
        }
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`inline-flex items-center gap-1.5 h-11 sm:h-10 px-3 -mb-px border-b-2 text-sm font-medium whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {item.label}
            {typeof item.count === "number" && (
              <span className={`ms-1 inline-flex items-center px-1.5 rounded-full text-[10px] font-semibold ${
                active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
