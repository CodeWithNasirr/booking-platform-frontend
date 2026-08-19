"use client";

/**
 * Badge — compact label for counts, tags and inline status.
 * For row/list status prefer <StatusPill>; use <Badge> for
 * neutral labels, counters and metadata chips.
 *
 *   <Badge variant="success">Paid</Badge>
 *   <Badge variant="soft-info">Beta</Badge>
 */

const VARIANTS = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary text-primary-foreground",
  outline: "border border-border text-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
  info: "bg-info text-info-foreground",
  // Soft (tinted) variants
  "soft-success": "bg-success-soft text-success-soft-foreground",
  "soft-warning": "bg-warning-soft text-warning-soft-foreground",
  "soft-danger": "bg-danger-soft text-danger-soft-foreground",
  "soft-info": "bg-info-soft text-info-soft-foreground",
  "soft-brand": "bg-accent text-accent-foreground",
};

const SIZES = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
};

export default function Badge({
  variant = "neutral", size = "md", className = "", children, ...rest
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap ${VARIANTS[variant] || VARIANTS.neutral} ${SIZES[size] || SIZES.md} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
