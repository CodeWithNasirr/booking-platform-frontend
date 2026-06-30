"use client";

import { Search } from "lucide-react";

/**
 * SearchInput — `type="search"`, leading icon, aria-labeled.
 * Use everywhere search affordances live so the UX is uniform.
 */
export default function SearchInput({
  value, onChange, placeholder = "Search…",
  ariaLabel = "Search", className = "", inputClassName = "",
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        aria-hidden="true"
        className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-gray-400 pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full h-10 border border-gray-200 rounded-xl pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-primary,#3B82F6)]/30 focus:border-[color:var(--brand-primary,#3B82F6)] ${inputClassName}`}
      />
    </div>
  );
}
