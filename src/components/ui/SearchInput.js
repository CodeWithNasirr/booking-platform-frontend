"use client";

import { Search } from "lucide-react";

/**
 * SearchInput — `type="search"`, leading icon, aria-labeled.
 * Use everywhere search affordances live so the UX is uniform.
 * Uses logical inset (start/end) so the icon flips correctly in RTL.
 */
export default function SearchInput({
  value, onChange, placeholder = "Search…",
  ariaLabel = "Search", className = "", inputClassName = "",
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        aria-hidden="true"
        className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`w-full h-11 sm:h-10 bg-input-background border border-border rounded-xl ps-9 pe-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring ${inputClassName}`}
      />
    </div>
  );
}
