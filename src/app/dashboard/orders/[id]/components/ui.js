'use client';

/** Small shared building blocks for the order detail sidebar/sections. */

export function Section({ icon: Icon, title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground truncate">{title}</h3>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Row({ label, children, strong = false, tone }) {
  const toneCls = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : strong ? 'font-semibold text-foreground' : 'text-foreground';
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-end tabular-nums ${toneCls}`}>{children}</span>
    </div>
  );
}
