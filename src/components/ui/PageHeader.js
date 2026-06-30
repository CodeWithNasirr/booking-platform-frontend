"use client";

/**
 * PageHeader — title + optional subtitle + actions row.
 * Every primary page mounts one and slots actions on the right.
 *
 *   <PageHeader title="Custom Requests" actions={<NewButton/>} />
 *
 * On mobile the actions wrap underneath the title.
 */
export default function PageHeader({ title, subtitle, actions, className = "" }) {
  return (
    <header className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
