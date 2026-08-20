"use client";

/**
 * Button — primary / secondary / ghost / danger / outline / subtle.
 *
 * Uses semantic design tokens (primary, secondary, muted, danger…)
 * so the accent follows tenant branding automatically and there is
 * no hard-coded blue. Sizes keep a >=44px touch target on the
 * comfortable defaults for mobile.
 */

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-110 shadow-sm",
  secondary:
    "bg-surface border border-border text-foreground hover:bg-muted",
  ghost:
    "text-foreground hover:bg-muted",
  subtle:
    "bg-muted text-foreground hover:bg-muted/70",
  danger:
    "bg-danger text-danger-foreground hover:brightness-110 shadow-sm",
  success:
    "bg-success text-success-foreground hover:brightness-110 shadow-sm",
  outline:
    "border border-primary text-primary hover:bg-primary/10",
  link:
    "text-primary underline-offset-4 hover:underline px-0 h-auto",
};

const SIZES = {
  sm: "h-8 px-3 text-xs gap-1",
  md: "h-11 px-4 text-sm sm:h-10", // 44px on mobile, 40px on >=sm
  lg: "h-12 px-5 text-sm",
  icon: "h-11 w-11 sm:h-10 sm:w-10", // 44px touch target on mobile
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
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  ].filter(Boolean).join(" ");

  return (
    <As
      ref={ref}
      className={cls}
      disabled={As === "button" ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </As>
  );
});

export default Button;
