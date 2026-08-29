"use client";

/**
 * StarRating — read-only star row (whole + half stars).
 * Used by the tenant reviews dashboard and the public storefront display.
 */

import { Star, StarHalf } from "lucide-react";

export default function StarRating({ value = 0, size = 16, className = "" }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i += 1) {
    if (i < full) {
      stars.push(
        <Star key={i} width={size} height={size} className="fill-amber-400 text-amber-400" />
      );
    } else if (i === full && half) {
      stars.push(
        <StarHalf key={i} width={size} height={size} className="fill-amber-400 text-amber-400" />
      );
    } else {
      stars.push(
        <Star key={i} width={size} height={size} className="text-gray-300" />
      );
    }
  }
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${v} out of 5`}>
      {stars}
    </span>
  );
}
