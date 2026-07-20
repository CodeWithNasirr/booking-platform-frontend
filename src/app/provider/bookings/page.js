'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Video, 
  RefreshCw,
  AlertCircle,
  Mail,
  Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function BookingsPage() {
  const router = useRouter();
  const { t, activeTenant } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ today: 0, upcoming: 0, completed: 0, thisWeek: 0 });

  const tenantId = activeTenant?.id || activeTenant;

  const tabs = [
    { id: 'all', label: t('bookings_tab_all') },
    { id: 'upcoming', label: t('bookings_tab_upcoming') },
    { id: 'completed', label: t('bookings_tab_completed') },
    { id: 'cancelled', label: t('bookings_tab_cancelled') },
  ];

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const getAuthHeaders = () => {
    const token = Cookies.get("access_token");
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Tenant': tenantId || '',
    };
  };

  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/v1/bookings/`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(t('bookings_error_login'));
        }
        throw new Error(t('bookings_error_fetch'));
      }

      const data = await response.json();
      console.log('Fetched bookings data:', data);
      const bookingsArray = Array.isArray(data) ? data : (data.results || []);

      const mappedBookings = bookingsArray.map((booking) => {
        const customer = booking.customer;
        const service = booking.service;
        
        return {
          id: booking.booking_number || booking.id,
          bookingId: booking.id,
          title: service?.name?.en || service?.name || t('bookings_default_title'),
          client: customer?.full_name || customer?.email || t('bookings_unknown_client'),
          clientEmail: customer?.email || '',
          clientPhone: customer?.phone || '',
          date: formatDate(booking.scheduled_datetime),
          time: formatTime(booking.scheduled_datetime),
          duration: booking.duration_minutes 
            ? `${booking.duration_minutes} ${t('bookings_min')}` 
            : `1 ${t('bookings_hour')}`,
          platform: booking.meeting_provider || 'Google Meet',
          price: parseFloat(booking.total_amount) || 0,
          status: mapStatus(booking.status, t),
          initials: getInitials(customer?.full_name || customer?.email),
          meetingUrl: booking.meeting_url,
          meetingId: booking.meeting_id,
          scheduledDatetime: booking.scheduled_datetime,
          bookingNumber: booking.booking_number,
          rawData: booking
        };
      });

      setBookings(mappedBookings);
      calculateStats(mappedBookings);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, t]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const calculateStats = (data) => {
    const today = new Date().toDateString();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const todayCount = data.filter(b => 
      new Date(b.scheduledDatetime).toDateString() === today && 
      b.status === t('bookings_status_upcoming')
    ).length;

    const upcomingCount = data.filter(b => 
      b.status === t('bookings_status_upcoming') && new Date(b.scheduledDatetime) > new Date()
    ).length;

    const completedCount = data.filter(b => b.status === t('bookings_status_completed')).length;

    const weekTotal = data
      .filter(b => {
        const date = new Date(b.scheduledDatetime);
        return date <= weekFromNow && date >= new Date() && b.status !== t('bookings_status_cancelled');
      })
      .reduce((sum, b) => sum + b.price, 0);

    setStats({
      today: todayCount,
      upcoming: upcomingCount,
      completed: completedCount,
      thisWeek: weekTotal
    });
  };

  const formatDate = (datetime) => {
    if (!datetime) return t('bookings_tbd');
    const date = new Date(datetime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return t('bookings_today');
    if (date.toDateString() === tomorrow.toDateString()) return t('bookings_tomorrow');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (datetime) => {
    if (!datetime) return t('bookings_tbd');
    return new Date(datetime).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleJoinMeeting = (booking) => {
    if (booking.meetingUrl) {
      window.open(booking.meetingUrl, '_blank');
    } else {
      toast.error(t('bookings_error_meeting_link'));
    }
  };

  const handleReschedule = (booking) => {
    router.push(`/provider/bookings/${booking.bookingId}/reschedule`);
  };

  const handleCancel = async (booking) => {
    if (!confirm(t('bookings_cancel_confirm'))) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/bookings/${booking.bookingId}/cancel/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ reason: t('bookings_cancel_reason') })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || t('bookings_error_cancel'));
      }

      toast.success(t('bookings_toast_cancelled'));
      fetchBookings(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status.toLowerCase() === activeTab;
  });

  if (loading) {
    return (
      <DashboardLayout pageName={t('bookings_page_title')}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin text-[#800020] mx-auto mb-4" />
            <p className="text-[#4a5565]">{t('bookings_loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !bookings.length) {
    return (
      <DashboardLayout pageName={t('bookings_page_title')}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#101828] mb-2">{t('bookings_error_title')}</h3>
            <p className="text-[#4a5565] mb-4">{error}</p>
            <button 
              onClick={() => fetchBookings()}
              className="bg-[#800020] text-white px-4 py-2 rounded-[10px] hover:bg-[#600018] transition-colors"
            >
              {t('bookings_try_again')}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageName={t('bookings_page_title')}>
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">
              {t('bookings_page_title')}
            </h1>
            <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">
              {t('bookings_page_subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchBookings(true)}
              disabled={refreshing}
              className="bg-white border border-[#e5e7eb] h-[36px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-[#4a5565] text-[14px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {t('bookings_refresh')}
            </button>
            <Link
              href="/provider/availability"
              className="bg-[#800020] h-[36px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors w-full sm:w-auto"
            >
              <Calendar size={16} />
              {t('bookings_manage_availability')}
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard icon={Calendar} label={t('bookings_stat_today')} value={stats.today.toString()} color="bg-[#800020]" />
          <StatCard icon={Clock} label={t('bookings_stat_upcoming')} value={stats.upcoming.toString()} color="bg-[#2563eb]" />
          <StatCard icon={CheckCircle} label={t('bookings_stat_completed')} value={stats.completed.toString()} color="bg-[#10b981]" />
          <StatCard icon={DollarSign} label={t('bookings_stat_week')} value={`$${stats.thisWeek}`} color="bg-[#a855f7]" />
        </div>

        {/* Tabs */}
        <div className="bg-[#f3f4f6] flex gap-2 p-1 rounded-[16px] w-full overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-[40px] rounded-[12px] px-4 whitespace-nowrap flex-shrink-0 transition-all ${
                activeTab === tab.id 
                  ? 'bg-white shadow-sm text-[#101828]' 
                  : 'text-[#4a5565] hover:bg-white/50'
              }`}
            >
              <span className="text-[14px] md:text-[16px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Banner */}
        {stats.today > 0 && (
          <div className="bg-[#800020] rounded-[16px] p-4 md:p-[24px] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg md:text-[20px] text-white font-bold leading-[28px] mb-1">
                {t('bookings_banner_title')}
              </h2>
              <p className="text-sm text-white/90">
                {t('bookings_banner_desc', { count: stats.today })}
              </p>
            </div>
            <Calendar className="size-10 md:size-14 text-white opacity-80" strokeWidth={1.5} />
          </div>
        )}

        {/* Bookings List */}
        <div className="flex flex-col gap-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-12 text-center">
              <div className="bg-gray-50 rounded-full size-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="size-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-[#101828] mb-2">
                {t('bookings_empty_title')}
              </h3>
              <p className="text-[#4a5565] mb-4">
                {activeTab === 'all' 
                  ? t('bookings_empty_all') 
                  : t('bookings_empty_filtered', { status: activeTab })}
              </p>
              <Link
                href="/provider/availability"
                className="text-[#800020] font-medium hover:underline"
              >
                {t('bookings_manage_availability_link')} →
              </Link>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-[24px] hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="bg-[#800020] rounded-full size-10 md:size-[48px] flex items-center justify-center shrink-0 text-white font-semibold">
                    {booking.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-2">
                      <div>
                        <h3 className="text-base md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-1">
                          {booking.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-[#4a5565] text-[13px] md:text-[14px]">
                          <span className="font-medium">{booking.client}</span>
                          <span>•</span>
                          <span>#{booking.bookingNumber}</span>
                          {booking.clientEmail && (
                            <>
                              <span className="hidden md:inline">•</span>
                              <span className="hidden md:flex items-center gap-1">
                                <Mail size={12} />
                                {booking.clientEmail}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`h-[24px] px-3 rounded-[10px] flex items-center gap-1 border ${
                          booking.status === t('bookings_status_upcoming') ? 'bg-[#dbeafe] border-[#bedbff] text-[#1447e6]' :
                          booking.status === t('bookings_status_completed') ? 'bg-[#d1fae5] border-[#a7f3d0] text-[#059669]' :
                          'bg-[#fee2e2] border-[#fecaca] text-[#dc2626]'
                        }`}>
                          <Clock size={12} />
                          <span className="text-[12px] font-medium">{booking.status}</span>
                        </div>
                        <span className="text-base md:text-[18px] text-[#101828] font-bold">${booking.price}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-[13px] md:text-[14px] text-[#364153]">
                      <div className="flex items-center gap-1">
                        <Calendar size={16} className="text-[#800020]" />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} className="text-[#800020]" />
                        <span>{booking.time}</span>
                      </div>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">{booking.duration}</span>
                      <span className="text-[#800020] font-medium flex items-center gap-1">
                        <Video size={14} />
                        {booking.platform}
                      </span>
                      {booking.meetingId && (
                        <span className="text-gray-500">ID: {booking.meetingId}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/provider/bookings/${booking.bookingId}`)}
                        className="bg-[#800020] h-[32px] px-4 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018] transition-colors flex items-center gap-2"
                      >
                        <Video size={14} />
                        {t('bookings_open_workspace') || 'Open'}
                      </button>
                      <button
                        onClick={() => handleJoinMeeting(booking)}
                        disabled={!booking.meetingUrl || booking.status !== t('bookings_status_upcoming')}
                        className="bg-white border border-[rgba(0,0,0,0.08)] h-[32px] px-4 rounded-[10px] text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Video size={14} />
                        {t('bookings_join_meeting')}
                      </button>
                      <button 
                        onClick={() => handleReschedule(booking)}
                        disabled={booking.status !== t('bookings_status_upcoming')}
                        className="bg-white border border-[rgba(0,0,0,0.08)] h-[32px] px-4 rounded-[10px] text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {t('bookings_reschedule')}
                      </button>
                      <button 
                        onClick={() => handleCancel(booking)}
                        disabled={booking.status !== t('bookings_status_upcoming')}
                        className="bg-white border border-[#ffc9c9] h-[32px] px-4 rounded-[10px] text-[#e7000b] text-[14px] font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {t('bookings_cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
      <div className={`${color} rounded-[16px] size-10 md:size-12 flex items-center justify-center mb-3`}>
        <Icon className="text-white w-5 h-5 md:w-6 md:h-6" />
      </div>
      <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight">{value}</p>
      <p className="text-xs md:text-[14px] text-[#4a5565] leading-[20px]">{label}</p>
    </div>
  );
}

// Helper: map backend status to localized display status
function mapStatus(status, t) {
  const statusMap = {
    'draft': t('bookings_status_upcoming'),
    'pending_payment': t('bookings_status_upcoming'),
    'paid': t('bookings_status_upcoming'),
    'scheduled': t('bookings_status_upcoming'),
    'completed': t('bookings_status_completed'),
    'cancelled': t('bookings_status_cancelled'),
    'refunded': t('bookings_status_cancelled')
  };
  return statusMap[status] || t('bookings_status_upcoming');
}


// 'use client';

// import { useState, useEffect, useCallback } from 'react';
// import { 
//   Calendar, 
//   Clock, 
//   CheckCircle, 
//   DollarSign, 
//   Video, 
//   RefreshCw,
//   AlertCircle,
//   Mail,
//   Loader2
// } from 'lucide-react';
// import DashboardLayout from '@/components/provider/DashboardLayout';
// import Link from 'next/link';
// import { useApp } from '@/contexts/AppContext';
// import Cookies from 'js-cookie';
// import { toast } from 'react-hot-toast';
// import { useRouter } from 'next/navigation';

// export default function BookingsPage() {
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState('all');
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [stats, setStats] = useState({ today: 0, upcoming: 0, completed: 0, thisWeek: 0 });

//   const { activeTenant } = useApp();
//   const tenantId = activeTenant?.id || activeTenant;

//   const tabs = [
//     { id: 'all', label: 'All Bookings' },
//     { id: 'upcoming', label: 'Upcoming' },
//     { id: 'completed', label: 'Completed' },
//     { id: 'cancelled', label: 'Cancelled' },
//   ];

//   const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

//   const getAuthHeaders = () => {
//     const token = Cookies.get("access_token");
//     return {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//       'X-Tenant': tenantId || '',
//     };
//   };

//   const fetchBookings = useCallback(async (isRefresh = false) => {
//     try {
//       if (isRefresh) setRefreshing(true);
//       else setLoading(true);
//       setError(null);

//       const response = await fetch(`${API_BASE}/api/v1/bookings/`, {
//         headers: getAuthHeaders(),
//         credentials: "include",

//       });

//       if (!response.ok) {
//         if (response.status === 401) {
//           throw new Error('Please login again');
//         }
//         throw new Error('Failed to fetch bookings');
//       }

//       const data = await response.json();
//       const bookingsArray = Array.isArray(data) ? data : (data.results || []);

//       const mappedBookings = bookingsArray.map((booking) => {
//         const customer = booking.customer;
//         const service = booking.service;
        
//         return {
//           id: booking.booking_number || booking.id,
//           bookingId: booking.id,  // This is the UUID for API calls
//           title: service?.name?.en || service?.name || 'Consultation',
//           client: customer?.full_name || customer?.email || 'Unknown Client',
//           clientEmail: customer?.email || '',
//           clientPhone: customer?.phone || '',
//           date: formatDate(booking.scheduled_datetime),
//           time: formatTime(booking.scheduled_datetime),
//           duration: booking.duration_minutes 
//             ? `${booking.duration_minutes} min` 
//             : '1 hour',
//           platform: booking.meeting_provider || 'Google Meet',
//           price: parseFloat(booking.total_amount) || 0,
//           status: mapStatus(booking.status),
//           initials: getInitials(customer?.full_name || customer?.email),
//           meetingUrl: booking.meeting_url,
//           meetingId: booking.meeting_id,
//           scheduledDatetime: booking.scheduled_datetime,
//           bookingNumber: booking.booking_number,
//           rawData: booking
//         };
//       });

//       setBookings(mappedBookings);
//       calculateStats(mappedBookings);
//     } catch (err) {
//       console.error('Fetch error:', err);
//       setError(err.message);
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [tenantId]);

//   useEffect(() => {
//     fetchBookings();
//   }, [fetchBookings]);

//   const calculateStats = (data) => {
//     const today = new Date().toDateString();
//     const weekFromNow = new Date();
//     weekFromNow.setDate(weekFromNow.getDate() + 7);

//     const todayCount = data.filter(b => 
//       new Date(b.scheduledDatetime).toDateString() === today && 
//       b.status === 'Upcoming'
//     ).length;

//     const upcomingCount = data.filter(b => 
//       b.status === 'Upcoming' && new Date(b.scheduledDatetime) > new Date()
//     ).length;

//     const completedCount = data.filter(b => b.status === 'Completed').length;

//     const weekTotal = data
//       .filter(b => {
//         const date = new Date(b.scheduledDatetime);
//         return date <= weekFromNow && date >= new Date() && b.status !== 'Cancelled';
//       })
//       .reduce((sum, b) => sum + b.price, 0);

//     setStats({
//       today: todayCount,
//       upcoming: upcomingCount,
//       completed: completedCount,
//       thisWeek: weekTotal
//     });
//   };

//   const formatDate = (datetime) => {
//     if (!datetime) return 'TBD';
//     const date = new Date(datetime);
//     const today = new Date();
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
    
//     if (date.toDateString() === today.toDateString()) return 'Today';
//     if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
//     return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
//   };

//   const formatTime = (datetime) => {
//     if (!datetime) return 'TBD';
//     return new Date(datetime).toLocaleTimeString('en-US', { 
//       hour: 'numeric', 
//       minute: '2-digit',
//       hour12: true 
//     });
//   };

//   const mapStatus = (status) => {
//     const statusMap = {
//       'draft': 'Upcoming',
//       'pending_payment': 'Upcoming',
//       'paid': 'Upcoming',
//       'scheduled': 'Upcoming',
//       'completed': 'Completed',
//       'cancelled': 'Cancelled',
//       'refunded': 'Cancelled'
//     };
//     return statusMap[status] || 'Upcoming';
//   };

//   const getInitials = (name) => {
//     if (!name) return '??';
//     return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
//   };

//   const handleJoinMeeting = (booking) => {
//     if (booking.meetingUrl) {
//       window.open(booking.meetingUrl, '_blank');
//     } else {
//       toast.error("Meeting link not available yet");
//     }
//   };

//   // FIXED: Working reschedule handler
//   const handleReschedule = (booking) => {
//     // Option 1: Navigate to reschedule page (recommended)
//     router.push(`/provider/bookings/${booking.bookingId}/reschedule`);
    
//     // Option 2: If you don't have a page yet, use this temporary implementation:
//     /*
//     const newDate = prompt('Enter new date (YYYY-MM-DD):', booking.scheduledDatetime?.split('T')[0]);
//     const newTime = prompt('Enter new time (HH:MM):', booking.time?.replace(/[^0-9:]/g, ''));
    
//     if (newDate && newTime) {
//       // Call your reschedule API here
//       toast.success(`Reschedule request submitted for ${newDate} at ${newTime}`);
//     }
//     */
//   };

//   // FIXED: Corrected cancel API call
//   const handleCancel = async (booking) => {
//     if (!confirm('Are you sure you want to cancel this booking?')) return;

//     try {
//       // FIXED: Use booking.bookingId (the UUID) instead of booking.rawData.booking.id
//       const response = await fetch(`${API_BASE}/api/v1/bookings/${booking.bookingId}/cancel/`, {
//         method: 'POST',
//         headers: getAuthHeaders(),
//         credentials: "include",

//         body: JSON.stringify({ reason: 'Cancelled by provider' })
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.detail || 'Failed to cancel booking');
//       }

//       toast.success("Booking cancelled successfully");
//       fetchBookings(true); // Refresh the list
//     } catch (err) {
//       toast.error(err.message);
//     }
//   };

//   const filteredBookings = bookings.filter(booking => {
//     if (activeTab === 'all') return true;
//     return booking.status.toLowerCase() === activeTab;
//   });

//   if (loading) {
//     return (
//       <DashboardLayout pageName="Bookings">
//         <div className="flex items-center justify-center h-96">
//           <div className="text-center">
//             <Loader2 className="size-8 animate-spin text-[#800020] mx-auto mb-4" />
//             <p className="text-[#4a5565]">Loading your bookings...</p>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   if (error && !bookings.length) {
//     return (
//       <DashboardLayout pageName="Bookings">
//         <div className="flex items-center justify-center h-96">
//           <div className="text-center max-w-md">
//             <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
//             <h3 className="text-lg font-semibold text-[#101828] mb-2">Failed to load bookings</h3>
//             <p className="text-[#4a5565] mb-4">{error}</p>
//             <button 
//               onClick={() => fetchBookings()}
//               className="bg-[#800020] text-white px-4 py-2 rounded-[10px] hover:bg-[#600018] transition-colors"
//             >
//               Try Again
//             </button>
//           </div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout pageName="Bookings">
//       <div className="flex flex-col gap-6">
//         {/* Header Section */}
//         <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
//           <div>
//             <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">Bookings</h1>
//             <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">
//               Manage your online appointment bookings
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={() => fetchBookings(true)}
//               disabled={refreshing}
//               className="bg-white border border-[#e5e7eb] h-[36px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-[#4a5565] text-[14px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
//             >
//               <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
//               Refresh
//             </button>
//             <Link
//               href="/provider/availability"
//               className="bg-[#800020] h-[36px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors w-full sm:w-auto"
//             >
//               <Calendar size={16} />
//               Manage Availability
//             </Link>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
//           <StatCard icon={Calendar} label="Today's Bookings" value={stats.today.toString()} color="bg-[#800020]" />
//           <StatCard icon={Clock} label="Upcoming" value={stats.upcoming.toString()} color="bg-[#2563eb]" />
//           <StatCard icon={CheckCircle} label="Completed" value={stats.completed.toString()} color="bg-[#10b981]" />
//           <StatCard icon={DollarSign} label="This Week" value={`$${stats.thisWeek}`} color="bg-[#a855f7]" />
//         </div>

//         {/* Tabs */}
//         <div className="bg-[#f3f4f6] flex gap-2 p-1 rounded-[16px] w-full overflow-x-auto">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`h-[40px] rounded-[12px] px-4 whitespace-nowrap flex-shrink-0 transition-all ${
//                 activeTab === tab.id 
//                   ? 'bg-white shadow-sm text-[#101828]' 
//                   : 'text-[#4a5565] hover:bg-white/50'
//               }`}
//             >
//               <span className="text-[14px] md:text-[16px] font-medium">{tab.label}</span>
//             </button>
//           ))}
//         </div>

//         {/* Banner */}
//         {stats.today > 0 && (
//           <div className="bg-[#800020] rounded-[16px] p-4 md:p-[24px] flex flex-col sm:flex-row items-center justify-between gap-4">
//             <div>
//               <h2 className="text-lg md:text-[20px] text-white font-bold leading-[28px] mb-1">Today's Schedule</h2>
//               <p className="text-sm text-white/90">You have {stats.today} appointment(s) scheduled for today</p>
//             </div>
//             <Calendar className="size-10 md:size-14 text-white opacity-80" strokeWidth={1.5} />
//           </div>
//         )}

//         {/* Bookings List */}
//         <div className="flex flex-col gap-4">
//           {filteredBookings.length === 0 ? (
//             <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-12 text-center">
//               <div className="bg-gray-50 rounded-full size-16 flex items-center justify-center mx-auto mb-4">
//                 <Calendar className="size-8 text-gray-400" />
//               </div>
//               <h3 className="text-lg font-semibold text-[#101828] mb-2">No bookings found</h3>
//               <p className="text-[#4a5565] mb-4">
//                 {activeTab === 'all' 
//                   ? "You don't have any bookings yet." 
//                   : `No ${activeTab} bookings found.`}
//               </p>
//               <Link
//                 href="/provider/availability"
//                 className="text-[#800020] font-medium hover:underline"
//               >
//                 Manage your availability →
//               </Link>
//             </div>
//           ) : (
//             filteredBookings.map((booking) => (
//               <div key={booking.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-[24px] hover:shadow-md transition-shadow">
//                 <div className="flex items-start gap-4">
//                   <div className="bg-[#800020] rounded-full size-10 md:size-[48px] flex items-center justify-center shrink-0 text-white font-semibold">
//                     {booking.initials}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-2">
//                       <div>
//                         <h3 className="text-base md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-1">
//                           {booking.title}
//                         </h3>
//                         <div className="flex flex-wrap items-center gap-2 text-[#4a5565] text-[13px] md:text-[14px]">
//                           <span className="font-medium">{booking.client}</span>
//                           <span>•</span>
//                           <span>#{booking.bookingNumber}</span>
//                           {booking.clientEmail && (
//                             <>
//                               <span className="hidden md:inline">•</span>
//                               <span className="hidden md:flex items-center gap-1">
//                                 <Mail size={12} />
//                                 {booking.clientEmail}
//                               </span>
//                             </>
//                           )}
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2 shrink-0">
//                         <div className={`h-[24px] px-3 rounded-[10px] flex items-center gap-1 border ${
//                           booking.status === 'Upcoming' ? 'bg-[#dbeafe] border-[#bedbff] text-[#1447e6]' :
//                           booking.status === 'Completed' ? 'bg-[#d1fae5] border-[#a7f3d0] text-[#059669]' :
//                           'bg-[#fee2e2] border-[#fecaca] text-[#dc2626]'
//                         }`}>
//                           <Clock size={12} />
//                           <span className="text-[12px] font-medium">{booking.status}</span>
//                         </div>
//                         <span className="text-base md:text-[18px] text-[#101828] font-bold">${booking.price}</span>
//                       </div>
//                     </div>

//                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-[13px] md:text-[14px] text-[#364153]">
//                       <div className="flex items-center gap-1">
//                         <Calendar size={16} className="text-[#800020]" />
//                         <span>{booking.date}</span>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <Clock size={16} className="text-[#800020]" />
//                         <span>{booking.time}</span>
//                       </div>
//                       <span className="bg-gray-100 px-2 py-0.5 rounded-full">{booking.duration}</span>
//                       <span className="text-[#800020] font-medium flex items-center gap-1">
//                         <Video size={14} />
//                         {booking.platform}
//                       </span>
//                       {booking.meetingId && (
//                         <span className="text-gray-500">ID: {booking.meetingId}</span>
//                       )}
//                     </div>

//                     <div className="flex flex-wrap gap-2">
//                       <button 
//                         onClick={() => handleJoinMeeting(booking)}
//                         disabled={!booking.meetingUrl || booking.status !== 'Upcoming'}
//                         className="bg-[#800020] h-[32px] px-4 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         <Video size={14} />
//                         Join Meeting
//                       </button>
//                       <button 
//                         onClick={() => handleReschedule(booking)}
//                         disabled={booking.status !== 'Upcoming'}
//                         className="bg-white border border-[rgba(0,0,0,0.08)] h-[32px] px-4 rounded-[10px] text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
//                       >
//                         Reschedule
//                       </button>
//                       <button 
//                         onClick={() => handleCancel(booking)}
//                         disabled={booking.status !== 'Upcoming'}
//                         className="bg-white border border-[#ffc9c9] h-[32px] px-4 rounded-[10px] text-[#e7000b] text-[14px] font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }

// function StatCard({ icon: Icon, label, value, color }) {
//   return (
//     <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
//       <div className={`${color} rounded-[16px] size-10 md:size-12 flex items-center justify-center mb-3`}>
//         <Icon className="text-white w-5 h-5 md:w-6 md:h-6" />
//       </div>
//       <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight">{value}</p>
//       <p className="text-xs md:text-[14px] text-[#4a5565] leading-[20px]">{label}</p>
//     </div>
//   );
// }