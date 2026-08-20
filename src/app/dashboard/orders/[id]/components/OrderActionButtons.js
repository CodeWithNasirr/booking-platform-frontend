'use client';

import Button from '@/components/ui/Button';
import { CheckCircle, Play, Truck, UserPlus, XCircle, Pencil } from 'lucide-react';

const VARIANT = { primary: 'primary', success: 'success', secondary: 'secondary', danger: 'secondary', edit: 'secondary' };

function iconFor(item) {
  if (item.kind === 'edit') return Pencil;
  if (item.action === 'cancel') return XCircle;
  if (item.action === 'assign_provider') return UserPlus;
  if (item.action === 'complete') return CheckCircle;
  if (item.action === 'deliver') return Truck;
  if (item.endpoint === 'start_work') return Play;
  return CheckCircle;
}

/** Vertical stack of contextual action buttons (sidebar + mobile sheet). */
export default function OrderActionButtons({ items, onSelect, actionLoading, className = '' }) {
  if (!items.length) return null;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {items.map((item, i) => {
        const Icon = iconFor(item);
        const busy = actionLoading && actionLoading === (item.endpoint || item.action);
        return (
          <Button
            key={item.id || i}
            variant={VARIANT[item.kind === 'edit' ? 'edit' : item.style] || 'secondary'}
            size="md"
            className={`w-full justify-center ${item.style === 'danger' ? 'text-danger border-danger/30 hover:bg-danger-soft' : ''}`}
            leftIcon={<Icon className="w-4 h-4" />}
            loading={busy}
            disabled={actionLoading != null}
            onClick={() => onSelect(item)}
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
