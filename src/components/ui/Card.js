"use client";

/**
 * Card — the universal container. Replaces the dozen ad-hoc
 * `bg-white rounded-2xl border border-gray-100 shadow-sm p-6`
 * variants strewn across pages.
 *
 * Variants:
 *   default — soft shadow, hairline border, generous padding
 *   flat    — no shadow, useful inside scrollable panes
 *   inset   — sub-card (lighter background, no shadow)
 *
 * `interactive` enables hover state for clickable cards.
 */

import { forwardRef } from "react";

const PADDING = {
  none: "",
  sm:   "p-3",
  md:   "p-4",
  lg:   "p-6",
};

const VARIANTS = {
  default: "bg-white border border-gray-100 shadow-sm",
  flat:    "bg-white border border-gray-100",
  inset:   "bg-gray-50 border border-gray-200",
};

const Card = forwardRef(function Card(
  { as: As = "div", variant = "default", padding = "lg", interactive = false, className = "", children, ...rest },
  ref,
) {
  const cls = [
    "rounded-2xl",
    VARIANTS[variant],
    PADDING[padding],
    interactive && "hover:shadow transition cursor-pointer",
    className,
  ].filter(Boolean).join(" ");

  return (
    <As ref={ref} className={cls} {...rest}>
      {children}
    </As>
  );
});

export default Card;

export function SectionCard({ title, action, children, padding = "lg", className = "" }) {
  return (
    <Card padding={padding} className={className}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && (
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}
