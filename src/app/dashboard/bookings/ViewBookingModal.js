// src/app/dashboard/bookings/ViewBookingModal.js
'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useApp } from '@/contexts/AppContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { CallDock } from '@/components/collaboration';
import BookingConversationPanel from '@/components/bookings/BookingConversationPanel';

import { BrandRoot } from '@/components/ui/brand';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import StatusPill from '@/components/ui/StatusPill';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';

import BookingDetailSidebar from './components/detail/BookingDetailSidebar';
import BookingActivityTimeline from './components/detail/BookingActivityTimeline';
import {
  getStatusMeta,
  getPaymentMeta,
  getInitials,
  getCustomerName,
} from './components/bookingPresentation';

import {
  ArrowLeft,
  CheckCircle,
  Play,
  XCircle,
  MessageSquare,
  LayoutPanelLeft,
  History,
} from 'lucide-react';

// Status transitions — preserved exactly from the previous modal so the
// available status actions stay identical.
function getTransitions(status) {
  const transitions = {
    pending: ['confirmed'],
    pending_payment: ['paid'],
    confirmed: ['scheduled', 'in_progress'],
    scheduled: ['in_progress'],
    in_progress: ['completed'],
  };
  return transitions[status] || [];
}

export default function ViewBookingModal({
  booking,
  onClose,
  onStatusChange,
  onCancel,
}) {
  const { t, isRTL, activeTenant, user } = useApp();
  const tenantId = activeTenant?.id || activeTenant;
  const { markTargetRead } = useNotifications();

  const [tab, setTab] = useState('chat'); // mobile: overview | chat | activity

  // Opening this booking's conversation clears its unread message
  // notifications (backend read state) + updates the bell / sidebar dot.
  useEffect(() => {
    if (booking?.id) markTargetRead('booking', booking.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id]);

  // Esc to close + body scroll lock while the full-screen detail is open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const status = booking.status || 'pending';
  const statusMeta = getStatusMeta(status, t);
  const payMeta = getPaymentMeta(booking, t);
  const customerName = getCustomerName(booking);

  const transitions = getTransitions(status);
  const statusActions = [];
  if (transitions.includes('confirmed')) statusActions.push({ key: 'confirmed', label: t('bookings.actions.confirm'), icon: CheckCircle });
  if (transitions.includes('in_progress')) statusActions.push({ key: 'in_progress', label: t('bookings.actions.start'), icon: Play });
  if (transitions.includes('completed')) statusActions.push({ key: 'completed', label: t('bookings.actions.complete'), icon: CheckCircle });
  const canCancel = !['completed', 'cancelled', 'refunded'].includes(status);

  const runStatus = (key) => { onStatusChange(booking.id, key); onClose(); };

  // Action buttons (used in the desktop header and the mobile action bar)
  const ActionButtons = ({ compact = false }) => (
    <>
      {statusActions.map((a, i) => (
        <Button
          key={a.key}
          variant={i === 0 ? 'primary' : 'secondary'}
          size="md"
          leftIcon={<a.icon className="w-4 h-4" />}
          className={compact ? 'flex-1' : ''}
          onClick={() => runStatus(a.key)}
        >
          {a.label}
        </Button>
      ))}
      {canCancel && (
        <Button
          variant={statusActions.length ? 'ghost' : 'secondary'}
          size="md"
          leftIcon={<XCircle className="w-4 h-4" />}
          className={`${compact ? 'flex-1' : ''} text-danger`}
          onClick={onCancel}
        >
          {t('bookings.actions.cancel')}
        </Button>
      )}
    </>
  );

  // The single CallDock instance (its ringing/active overlays render via
  // its own Portal, so they show over any tab; it stays mounted because
  // tabs toggle with `hidden`, never unmount).
  const callDock = (
    <CallDock
      subjectType="booking"
      subjectId={booking.id}
      tenantId={tenantId}
      authMode="jwt"
      jwt={Cookies.get('access_token') || null}
      selfUserId={user?.id}
      selfName={user?.full_name || user?.name || 'You'}
      canStart={['paid', 'scheduled'].includes(booking.status)}
    />
  );

  const conversation = (
    <BookingConversationPanel
      bookingId={booking.id}
      domain={tenantId}
      auth={{ jwt: Cookies.get('access_token') || null }}
      viewer="admin"
      showComposer={!['cancelled', 'refunded'].includes(booking.status)}
    />
  );

  const tabItems = [
    { value: 'overview', label: t('bookings.detail.overview'), icon: LayoutPanelLeft },
    { value: 'chat', label: t('bookings.detail.chat'), icon: MessageSquare },
    { value: 'activity', label: t('bookings.detail.activity'), icon: History },
  ];

  return (
    <BrandRoot as="div" className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-surface">
        <div className="flex items-center gap-3 px-3 sm:px-4 h-16">
          <IconButton
            label={t('bookings.detail.back')}
            icon={ArrowLeft}
            variant="ghost"
            onClick={onClose}
            className={`shrink-0 ${isRTL ? 'rotate-180' : ''}`}
          />
          <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground hidden sm:flex items-center justify-center text-xs font-semibold shrink-0">
            {getInitials(customerName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-foreground truncate">{customerName}</span>
              <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                · {booking.booking_number}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusPill
                tone={statusMeta.tone}
                size="sm"
                label={
                  <span className="inline-flex items-center gap-1">
                    <statusMeta.Icon className="w-3 h-3" />{statusMeta.label}
                  </span>
                }
              />
              <Badge variant={payMeta.tone}>{payMeta.label}</Badge>
            </div>
          </div>

          {/* Desktop primary/secondary actions */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <ActionButtons />
          </div>
        </div>

        {/* Mobile segmented navigation */}
        <div className="lg:hidden px-3 pb-2">
          <Tabs value={tab} onChange={setTab} items={tabItems} variant="segment" className="w-full" />
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-col flex-1 min-h-0 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-4 lg:p-4 lg:overflow-hidden">
        {/* Left / main — conversation (chat + files + timeline + composer) */}
        <section
          className={`${tab === 'chat' ? 'flex' : 'hidden'} lg:flex flex-1 min-h-0 flex-col lg:rounded-xl lg:border lg:border-border lg:bg-card overflow-hidden`}
        >
          <div className="hidden lg:flex items-center gap-2 px-4 h-12 border-b border-border shrink-0">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">{t('bookings.detail.chat')}</h2>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {conversation}
          </div>
        </section>

        {/* Right / sidebar — booking info + call controls */}
        <aside
          className={`${tab === 'overview' ? 'block' : 'hidden'} lg:block flex-1 lg:flex-none min-h-0 overflow-y-auto p-3 lg:p-0`}
        >
          <BookingDetailSidebar booking={booking} callSlot={callDock} />
          {/* Activity is a sidebar card on desktop */}
          <div className="hidden lg:block mt-4">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('bookings.detail.activity')}
              </h3>
            </div>
            <BookingActivityTimeline booking={booking} />
          </div>
        </aside>

        {/* Activity — mobile tab only */}
        <section
          className={`${tab === 'activity' ? 'block' : 'hidden'} lg:hidden flex-1 min-h-0 overflow-y-auto p-3`}
        >
          <BookingActivityTimeline booking={booking} />
        </section>
      </div>

      {/* Mobile action bar (hidden on chat tab, where the composer lives) */}
      {(statusActions.length > 0 || canCancel) && (
        <div
          className={`${tab === 'chat' ? 'hidden' : 'flex'} lg:hidden shrink-0 items-center gap-2 border-t border-border bg-surface p-3`}
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        >
          <ActionButtons compact />
        </div>
      )}
    </BrandRoot>
  );
}
