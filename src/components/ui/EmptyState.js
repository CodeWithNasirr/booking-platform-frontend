"use client";

/**
 * EmptyState — centered icon + title + hint + optional action.
 * Use everywhere a list / pane has nothing to show.
 */
export default function EmptyState({
  icon: Icon, title, hint, action, className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
          <Icon className="w-6 h-6" />
        </div>
      )}
      {title && (
        <p className="text-base font-semibold text-gray-700">{title}</p>
      )}
      {hint && (
        <p className="text-sm text-gray-500 mt-1 max-w-sm">{hint}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
