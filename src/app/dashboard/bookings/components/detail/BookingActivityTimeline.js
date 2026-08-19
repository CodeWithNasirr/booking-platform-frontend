'use client';

import { useApp } from '@/contexts/AppContext';
import { History } from 'lucide-react';
import StatusPill from '@/components/ui/StatusPill';
import EmptyState from '@/components/ui/EmptyState';
import { getStatusMeta } from '../bookingPresentation';

/**
 * BookingActivityTimeline — the booking's status history rendered as a
 * vertical activity feed (distinct from the live message thread, which
 * lives in the conversation panel). Read-only, token-styled.
 */
export default function BookingActivityTimeline({ booking, className = '' }) {
  const { t, isRTL } = useApp();
  const history = Array.isArray(booking.status_history) ? booking.status_history : [];

  const formatWhen = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    }).format(d);
  };

  if (history.length === 0) {
    return (
      <div className={`rounded-xl border border-border bg-card ${className}`}>
        <EmptyState icon={History} title={t('bookings.detail.noActivity')} />
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <ol className="relative">
        {history.map((entry, index) => {
          const meta = getStatusMeta(entry.to_status, t);
          const last = index === history.length - 1;
          return (
            <li key={entry.id || index} className="flex gap-3 pb-4 last:pb-0">
              {/* Rail */}
              <div className="flex flex-col items-center">
                <span className={`mt-1 w-2.5 h-2.5 rounded-full ${index === 0 ? 'bg-primary' : 'bg-border'}`} />
                {!last && <span className="flex-1 w-px bg-border mt-1" />}
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusPill tone={meta.tone} size="sm" label={meta.label} />
                  <span className="text-xs text-muted-foreground">{formatWhen(entry.created_at)}</span>
                </div>
                {entry.changed_by_name && (
                  <p className="text-xs text-muted-foreground mt-1">{entry.changed_by_name}</p>
                )}
                {entry.notes && (
                  <p className="text-sm text-foreground mt-1">{entry.notes}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
