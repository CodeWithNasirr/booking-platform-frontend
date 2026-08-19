"use client";

import { forwardRef } from "react";

/**
 * IconButton — square, accessible icon-only button with a >=44px
 * touch target on mobile. `label` is required for a11y.
 *
 *   <IconButton label="Close" icon={X} onClick={onClose} />
 */

const VARIANTS = {
  ghost: "text-foreground hover:bg-muted",
  subtle: "bg-muted text-foreground hover:bg-muted/70",
  outline: "border border-border text-foreground hover:bg-muted",
  primary: "bg-primary text-primary-foreground hover:brightness-110",
  danger: "text-danger hover:bg-danger-soft",
};

const SIZES = {
  sm: "h-9 w-9",
  md: "h-11 w-11 sm:h-10 sm:w-10",
  lg: "h-12 w-12",
};

const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = "ghost", size = "md", className = "", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant] || VARIANTS.ghost} ${SIZES[size] || SIZES.md} ${className}`}
      {...rest}
    >
      {Icon && <Icon className="w-5 h-5" />}
    </button>
  );
});

export default IconButton;
