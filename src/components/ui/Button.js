"use client";

/**
 * Button — primary / secondary / ghost / danger variants.
 *
 * The primary variant uses the tenant brand CSS variables so
 * accents stay consistent across the tenant's UI without any
 * hard-coded blue.
 */

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-[color:var(--brand-primary,#3B82F6)] text-[color:var(--brand-primary-fg,#fff)] hover:brightness-110",
  secondary:
    "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50",
  ghost:
    "text-gray-700 hover:bg-gray-100",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700",
  outline:
    "border border-[color:var(--brand-primary,#3B82F6)] text-[color:var(--brand-primary,#3B82F6)] hover:bg-[color:var(--brand-primary,#3B82F6)]/10",
};

const SIZES = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
  icon: "w-9 h-9",
};

const Button = forwardRef(function Button(
  {
    as: As = "button",
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    className = "",
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const cls = [
    "inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary,#3B82F6)]/40 focus-visible:ring-offset-1",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(" ");

  return (
    <As
      ref={ref}
      className={cls}
      disabled={disabled || loading}
      {...rest}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : leftIcon}
      {children}
      {!loading && rightIcon}
    </As>
  );
});

export default Button;
