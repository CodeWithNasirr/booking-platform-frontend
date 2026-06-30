"use client";

/**
 * Avatar — deterministic initial-letter circle. Used by the
 * conversation feed and any list row that wants a face.
 *
 *   <Avatar name="Sarah Khan" role="customer" size="md" />
 */

const SIZES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-sm",
};

const ROLE_TONE = {
  customer: "bg-blue-100 text-blue-700",
  provider: "bg-emerald-100 text-emerald-700",
  admin:    "bg-gray-200 text-gray-700",
  system:   "bg-amber-100 text-amber-700",
};

function initialsOf(name) {
  if (!name) return "·";
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w[0]?.toUpperCase() || "").join("") || "·";
}

export default function Avatar({
  name, role, size = "md", src, className = "",
}) {
  const tone = ROLE_TONE[role] || "bg-gray-100 text-gray-700";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name || ""}
        className={`${SIZES[size]} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }
  return (
    <div
      aria-hidden={!name}
      className={`${SIZES[size]} rounded-full font-bold flex items-center justify-center shrink-0 ${tone} ${className}`}
    >
      {initialsOf(name)}
    </div>
  );
}
