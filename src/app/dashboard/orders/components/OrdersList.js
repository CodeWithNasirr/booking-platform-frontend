'use client';

import { useApp } from '@/contexts/AppContext';
import OrderRow from './OrderRow';
import OrderCard from './OrderCard';

function TableSkeleton({ rows = 6 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t border-border">
          <td className="px-4 py-3"><div className="h-3.5 w-40 rounded bg-muted animate-pulse" /><div className="h-2.5 w-20 rounded bg-muted animate-pulse mt-2" /></td>
          <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-muted animate-pulse" /><div><div className="h-3.5 w-28 rounded bg-muted animate-pulse" /><div className="h-2.5 w-20 rounded bg-muted animate-pulse mt-2" /></div></div></td>
          <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3.5 w-24 rounded bg-muted animate-pulse" /></td>
          <td className="px-4 py-3 text-end"><div className="h-3.5 w-16 rounded bg-muted animate-pulse ms-auto" /></td>
          <td className="px-4 py-3"><div className="h-6 w-20 rounded-full bg-muted animate-pulse" /></td>
          <td className="px-4 py-3 hidden xl:table-cell"><div className="h-5 w-16 rounded-md bg-muted animate-pulse" /></td>
          <td className="px-4 py-3 hidden xl:table-cell"><div className="h-3.5 w-16 rounded bg-muted animate-pulse" /></td>
          <td className="px-4 py-3 hidden lg:table-cell"><div className="h-3.5 w-16 rounded bg-muted animate-pulse" /></td>
        </tr>
      ))}
    </tbody>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2"><div className="h-4 w-36 rounded bg-muted animate-pulse" /><div className="h-3 w-20 rounded bg-muted animate-pulse" /></div>
        <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="mt-3 flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-muted animate-pulse" /><div className="h-3.5 w-28 rounded bg-muted animate-pulse" /></div>
      <div className="mt-3 h-px bg-border" />
      <div className="mt-3 flex items-center justify-between"><div className="h-5 w-16 rounded-md bg-muted animate-pulse" /><div className="h-4 w-12 rounded bg-muted animate-pulse" /></div>
    </div>
  );
}

const COLS = ['order', 'customer', 'provider', 'amount', 'status', 'payment', 'activity', 'date'];
const COL_CLS = {
  amount: 'text-end',
  provider: 'hidden lg:table-cell',
  date: 'hidden lg:table-cell',
  payment: 'hidden xl:table-cell',
  activity: 'hidden xl:table-cell',
};

export default function OrdersList({ orders, loading, canManage, onOpen }) {
  const { t } = useApp();

  const Head = (
    <thead>
      <tr className="border-b border-border bg-muted/40">
        {COLS.map((c) => (
          <th
            key={c}
            className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${COL_CLS[c] || ''} ${c === 'amount' ? 'text-end' : 'text-start'}`}
          >
            {t(`orders.table.${c}`)}
          </th>
        ))}
      </tr>
    </thead>
  );

  if (loading) {
    return (
      <>
        <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-sm">{Head}<TableSkeleton /></table></div>
        </div>
        <div className="md:hidden space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {Head}
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} onOpen={onOpen} clickable={canManage} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onOpen={onOpen} clickable={canManage} />
        ))}
      </div>
    </>
  );
}
