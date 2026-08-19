"use client";

import { forwardRef } from "react";

/**
 * Textarea — token-based multiline field matching Input styling.
 */
const Textarea = forwardRef(function Textarea(
  { className = "", invalid = false, rows = 4, ...props },
  ref,
) {
  const base =
    "w-full bg-input-background text-foreground placeholder:text-muted-foreground " +
    "border rounded-xl text-sm px-3 py-2 transition focus:outline-none focus:ring-2 resize-y " +
    "disabled:opacity-50 disabled:cursor-not-allowed " +
    (invalid
      ? "border-danger focus:ring-danger/40 focus:border-danger"
      : "border-border focus:ring-ring/40 focus:border-ring");

  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={`${base} ${className}`}
      {...props}
    />
  );
});

export default Textarea;
