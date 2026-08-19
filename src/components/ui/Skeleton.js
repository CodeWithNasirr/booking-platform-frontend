"use client";

/**
 * Skeleton — token-based loading placeholder. Replaces the ad-hoc
 * `bg-gray-100 animate-pulse` blocks scattered across pages.
 *
 *   <Skeleton className="h-24 rounded-2xl" />
 *   <SkeletonText lines={3} />
 *   <SkeletonCard />
 */

export default function Skeleton({ className = "", rounded = "rounded-xl" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-muted ${rounded} ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded-md bg-muted animate-pulse"
          style={{ width: `${90 - i * 12}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-border p-6 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonRows({ count = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}
