"use client";

export function HeaderSkeleton() {
  return <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />;
}

export function CardSkeleton({ className = "" }) {
  return <div className={`h-36 rounded-2xl bg-gray-100 animate-pulse ${className}`} />;
}

export function FeedSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-12 rounded-xl bg-gray-100 animate-pulse w-3/4" />
      <div className="h-12 rounded-xl bg-gray-100 animate-pulse w-2/3 ml-auto" />
      <div className="h-12 rounded-xl bg-gray-100 animate-pulse w-1/2" />
    </div>
  );
}

export function RequestDetailSkeleton() {
  return (
    <div className="space-y-4">
      <HeaderSkeleton />
      <CardSkeleton />
      <FeedSkeleton />
    </div>
  );
}

export function ListRowSkeleton({ count = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}
