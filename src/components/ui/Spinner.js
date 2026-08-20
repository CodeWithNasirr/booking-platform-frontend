"use client";

import { Loader2 } from "lucide-react";

/**
 * Spinner — consistent Lucide-based loading indicator.
 */
const SIZES = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-8 h-8" };

export default function Spinner({ size = "md", className = "", label = "Loading" }) {
  return (
    <span role="status" aria-label={label} className={`inline-flex ${className}`}>
      <Loader2 className={`animate-spin text-primary ${SIZES[size] || SIZES.md}`} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
