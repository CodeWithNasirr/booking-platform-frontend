"use client";

import { forwardRef } from "react";

/**
 * Input — token-based text field with a 44px touch target on
 * mobile. Supports optional leading/trailing icons (logical
 * inset so they flip in RTL) and an invalid state.
 */
const Input = forwardRef(function Input(
  { className = "", leadingIcon: Leading, trailingIcon: Trailing, invalid = false, ...props },
  ref,
) {
  const base =
    "w-full h-11 sm:h-10 bg-input-background text-foreground placeholder:text-muted-foreground " +
    "border rounded-xl text-sm transition focus:outline-none focus:ring-2 " +
    "disabled:opacity-50 disabled:cursor-not-allowed " +
    (invalid
      ? "border-danger focus:ring-danger/40 focus:border-danger"
      : "border-border focus:ring-ring/40 focus:border-ring");

  if (Leading || Trailing) {
    return (
      <div className="relative">
        {Leading && (
          <Leading className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        )}
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={`${base} ${Leading ? "ps-9" : "ps-3"} ${Trailing ? "pe-9" : "pe-3"} ${className}`}
          {...props}
        />
        {Trailing && (
          <Trailing className="absolute top-1/2 -translate-y-1/2 end-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        )}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${base} px-3 ${className}`}
      {...props}
    />
  );
});

export default Input;
