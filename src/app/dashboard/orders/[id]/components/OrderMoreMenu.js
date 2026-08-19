'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { MoreVertical, CheckCircle, Play, Truck, UserPlus, XCircle, Pencil } from 'lucide-react';
import IconButton from '@/components/ui/IconButton';
import Portal from '@/components/ui/Portal';

function iconFor(item) {
  if (item.kind === 'edit') return Pencil;
  if (item.action === 'cancel') return XCircle;
  if (item.action === 'assign_provider') return UserPlus;
  if (item.action === 'complete') return CheckCircle;
  if (item.action === 'deliver') return Truck;
  if (item.endpoint === 'start_work') return Play;
  return CheckCircle;
}

/** Desktop header "More actions" dropdown. */
export default function OrderMoreMenu({ items, onSelect, label }) {
  const { isRTL } = useApp();
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  return (
    <div className="relative inline-block">
      <IconButton
        label={label}
        icon={MoreVertical}
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      />
      {open && (
        <Portal>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="menu"
            className={`fixed z-50 w-56 p-1.5 bg-popover text-popover-foreground border border-border rounded-xl shadow-md top-1/2 -translate-y-1/2 animate-in ${isRTL ? 'left-4' : 'right-4'}`}
          >
            {items.map((item, i) => {
              const Icon = iconFor(item);
              const danger = item.style === 'danger';
              return (
                <button
                  key={item.id || i}
                  role="menuitem"
                  onClick={() => { onSelect(item); setOpen(false); }}
                  className={`w-full px-3 py-2.5 flex items-center gap-2.5 text-sm rounded-lg transition ${isRTL ? 'flex-row-reverse text-right' : 'text-start'} ${danger ? 'text-danger hover:bg-danger-soft' : 'text-foreground hover:bg-muted'}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </Portal>
      )}
    </div>
  );
}
