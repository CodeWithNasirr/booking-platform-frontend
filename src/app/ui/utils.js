"use client";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — compose conditional class names and de-duplicate conflicting
 * Tailwind utilities so a caller's `className` reliably overrides a
 * primitive's defaults.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
