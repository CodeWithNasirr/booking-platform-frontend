'use client';

import { useApp } from '@/contexts/AppContext';
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  XCircle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import Portal from '@/components/ui/Portal';
import IconButton from '@/components/ui/IconButton';
import {
  getAvailableTransitions,
  isBookingEditable,
} from './bookingPresentation';

/**
 * BookingActionsMenu — the row/card overflow menu. Behaviour (status
 * transitions, edit-gating, cancel/delete) is identical to the previous
 * BookingRow menu; only the styling moved onto design tokens. Shared by
 * the desktop table row and the mobile card.
 */
export default function BookingActionsMenu({
  booking,
  menuOpenId,
  setMenuOpenId,
  onView,
  onEdit,
  onStatusChange,
  onCancel,
  onDelete,
  hasAnyAction = true,
}) {
  const { t, isRTL } = useApp();
  const status = booking.status || 'pending';
  const editable = isBookingEditable(status);
  const transitions = getAvailableTransitions(status);
  const open = menuOpenId === booking.id;

  const itemBase =
    'w-full px-3 py-2.5 flex items-center gap-2.5 text-sm rounded-lg transition ' +
    (isRTL ? 'flex-row-reverse text-right' : 'text-start');

  if (!hasAnyAction) return null;

  return (
    <div className="relative inline-block">
      <IconButton
        label={t('bookings.table.actions') || 'Actions'}
        icon={MoreVertical}
        size="sm"
        variant="ghost"
        onClick={() => setMenuOpenId(open ? null : booking.id)}
        aria-haspopup="menu"
        aria-expanded={open}
      />

      {open && (
        <Portal>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpenId(null)}
            aria-hidden="true"
          />
          <div
            role="menu"
            className={`fixed z-50 w-52 p-1.5 bg-popover text-popover-foreground border border-border rounded-xl shadow-md top-1/2 -translate-y-1/2 animate-in ${
              isRTL ? 'left-4' : 'right-4'
            }`}
          >
            <button
              role="menuitem"
              onClick={() => { onView(booking); setMenuOpenId(null); }}
              className={`${itemBase} text-foreground hover:bg-muted`}
            >
              <Eye className="w-4 h-4 shrink-0" />
              {t('bookings.actions.view') || 'View'}
            </button>

            <button
              role="menuitem"
              onClick={() => { if (onEdit && editable) onEdit(booking); setMenuOpenId(null); }}
              disabled={!editable}
              className={`${itemBase} ${editable ? 'text-foreground hover:bg-muted' : 'text-muted-foreground/60 cursor-not-allowed'}`}
            >
              <Edit className="w-4 h-4 shrink-0" />
              {t('bookings.actions.edit') || 'Edit'}
            </button>

            {transitions.includes('scheduled') && (
              <button
                role="menuitem"
                onClick={() => { onStatusChange(booking.id, 'scheduled'); setMenuOpenId(null); }}
                className={`${itemBase} text-foreground hover:bg-muted`}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                {t('bookings.actions.schedule') || 'Schedule'}
              </button>
            )}

            {transitions.includes('completed') && (
              <button
                role="menuitem"
                onClick={() => { onStatusChange(booking.id, 'completed'); setMenuOpenId(null); }}
                className={`${itemBase} text-foreground hover:bg-muted`}
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                {t('bookings.actions.complete') || 'Complete'}
              </button>
            )}

            {!['completed', 'cancelled', 'refunded'].includes(status) && (
              <button
                role="menuitem"
                onClick={() => { onCancel(booking); setMenuOpenId(null); }}
                className={`${itemBase} text-danger hover:bg-danger-soft`}
              >
                <XCircle className="w-4 h-4 shrink-0" />
                {t('bookings.actions.cancel') || 'Cancel'}
              </button>
            )}

            <div className="my-1 h-px bg-border" role="separator" />

            <button
              role="menuitem"
              onClick={() => { onDelete(booking.id); setMenuOpenId(null); }}
              className={`${itemBase} text-danger hover:bg-danger-soft`}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              {t('bookings.actions.delete') || 'Delete'}
            </button>
          </div>
        </Portal>
      )}
    </div>
  );
}
