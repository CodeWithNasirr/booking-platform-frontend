"use client";

export default function ServiceSelectorSkeleton() {
  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"
          />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
