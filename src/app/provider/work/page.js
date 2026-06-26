'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Play,
  Send,
  Check
} from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

export default function MyWorkPage() {
  const { t, activeTenant } = useApp();
  const [activeTab, setActiveTab] = useState('orders');
  const [stats, setStats] = useState({
    total_orders: 0,
    active_orders: 0,
    completed_orders: 0,
    total_bookings: 0,
    upcoming_bookings: 0,
    today_bookings: 0
  });
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const tenantRef = useRef(activeTenant?.id || activeTenant);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    tenantRef.current = activeTenant?.id || activeTenant;
  }, [activeTenant?.id]);

  const getAuthHeaders = useCallback(() => ({
    'Authorization': `Bearer ${Cookies.get("access_token")}`,
    'Content-Type': 'application/json',
    'X-Tenant': tenantRef.current || '',
  }), []);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/providers/dashboard/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(t('work_error_fetch_stats'));
      const data = await response.json();
      setStats(data);
    } catch (err) {
      toast.error(err.message);
    }
  }, [getAuthHeaders, API_BASE, t]);

  const fetchOrders = useCallback(async () => {
    try {
      let url = `${API_BASE}/api/v1/providers/work/orders/`;
      const params = new URLSearchParams();
      if (statusFilter && activeTab === 'orders') params.append('status', statusFilter);
      if (searchQuery && activeTab === 'orders') params.append('search', searchQuery);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(t('work_error_fetch_orders'));
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error(err.message);
    }
  }, [getAuthHeaders, API_BASE, statusFilter, searchQuery, activeTab, t]);

  const fetchBookings = useCallback(async () => {
    try {
      let url = `${API_BASE}/api/v1/providers/work/bookings/`;
      const params = new URLSearchParams();
      if (statusFilter === 'upcoming' && activeTab === 'bookings') {
        params.append('filter', 'upcoming');
      }
      if (statusFilter === 'completed' && activeTab === 'bookings') {
        params.append('filter', 'completed');
      }
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(t('work_error_fetch_bookings'));
      const data = await response.json();
      setBookings(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error(err.message);
    }
  }, [getAuthHeaders, API_BASE, statusFilter, activeTab, t]);

  useEffect(() => {
    let isMounted = true;
    
    const loadAll = async () => {
      if (!isMounted) return;
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchOrders(), fetchBookings()]);
      if (isMounted) setLoading(false);
    };
    
    loadAll();
    
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (loading) return;
    
    const timeoutId = setTimeout(() => {
      if (activeTab === 'orders') {
        fetchOrders();
      } else {
        fetchBookings();
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [statusFilter, searchQuery, activeTab]);

  const handleAction = async (type, id, action) => {
    setActionLoading(`${type}-${id}-${action}`);
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/providers/work/${type}/${id}/${action}/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || t('work_error_action_failed'));
      }
      
      toast.success(t('work_toast_action_success', { action, type: t(`work_${type.slice(0, -1)}`) }));
      
      fetchDashboard();
      if (type === 'orders') fetchOrders();
      else fetchBookings();
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      paid: 'bg-blue-100 text-blue-700 border-blue-200',
      accepted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
      delivered: 'bg-purple-100 text-purple-700 border-purple-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      scheduled: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getLocalizedStatus = (status) => {
    const statusMap = {
      pending: t('work_status_pending'),
      paid: t('work_status_paid'),
      accepted: t('work_status_accepted'),
      in_progress: t('work_status_in_progress'),
      delivered: t('work_status_delivered'),
      completed: t('work_status_completed'),
      scheduled: t('work_status_scheduled'),
      cancelled: t('work_status_cancelled'),
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <DashboardLayout pageName={t('work_page_title')}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="size-8 animate-spin text-[#800020]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageName={t('work_page_title')}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#101828]">{t('work_page_title')}</h1>
            <p className="text-[#4a5565] mt-1">{t('work_page_subtitle')}</p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              Promise.all([fetchDashboard(), fetchOrders(), fetchBookings()])
                .finally(() => setLoading(false));
            }}
            className="flex items-center gap-2 px-4 py-2 border border-[#e5e7eb] rounded-[10px] hover:bg-gray-50 text-[#4a5565]"
          >
            <RefreshCw size={16} />
            {t('work_refresh')}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Briefcase} 
            label={t('work_stat_active_orders')} 
            value={stats.active_orders} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={CheckCircle} 
            label={t('work_stat_completed')} 
            value={stats.completed_orders} 
            color="bg-green-500" 
          />
          <StatCard 
            icon={Calendar} 
            label={t('work_stat_upcoming_bookings')} 
            value={stats.upcoming_bookings} 
            color="bg-[#800020]" 
          />
          <StatCard 
            icon={Clock} 
            label={t('work_stat_today')} 
            value={stats.today_bookings} 
            color="bg-orange-500" 
          />
        </div>

        {/* Tabs */}
        <div className="bg-[#f3f4f6] p-1 rounded-[12px] w-fit flex gap-1">
          <button
            onClick={() => { 
              setActiveTab('orders'); 
              setStatusFilter(''); 
              setSearchQuery('');
            }}
            className={`px-6 py-2 rounded-[10px] text-sm font-medium transition-all ${
              activeTab === 'orders' 
                ? 'bg-white shadow-sm text-[#101828]' 
                : 'text-[#4a5565] hover:text-[#101828]'
            }`}
          >
            {t('work_tab_orders')} ({stats.total_orders})
          </button>
          <button
            onClick={() => { 
              setActiveTab('bookings'); 
              setStatusFilter(''); 
              setSearchQuery('');
            }}
            className={`px-6 py-2 rounded-[10px] text-sm font-medium transition-all ${
              activeTab === 'bookings' 
                ? 'bg-white shadow-sm text-[#101828]' 
                : 'text-[#494b4e] hover:text-[#101828]'
            }`}
          >
            {t('work_tab_bookings')} ({stats.total_bookings})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#4a5565]" />
            <input
              type="text"
              placeholder={activeTab === 'orders' ? t('work_search_orders') : t('work_search_bookings')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:border-[#800020]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:border-[#800020] bg-white"
          >
            <option value="">{t('work_filter_all')}</option>
            {activeTab === 'orders' ? (
              <>
                <option value="accepted">{t('work_filter_accepted')}</option>
                <option value="in_progress">{t('work_filter_in_progress')}</option>
                <option value="delivered">{t('work_filter_delivered')}</option>
                <option value="completed">{t('work_filter_completed')}</option>
              </>
            ) : (
              <>
                <option value="upcoming">{t('work_filter_upcoming')}</option>
                <option value="completed">{t('work_filter_completed')}</option>
              </>
            )}
          </select>
        </div>

        {/* Content */}
        {activeTab === 'orders' ? (
          <OrdersTable 
            orders={orders} 
            getStatusBadge={getStatusBadge}
            getLocalizedStatus={getLocalizedStatus}
            onAction={handleAction}
            actionLoading={actionLoading}
            t={t}
          />
        ) : (
          <BookingsTable 
            bookings={bookings}
            getStatusBadge={getStatusBadge}
            getLocalizedStatus={getLocalizedStatus}
            onAction={handleAction}
            actionLoading={actionLoading}
            t={t}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4">
      <div className={`${color} w-10 h-10 rounded-[12px] flex items-center justify-center mb-3`}>
        <Icon className="text-white size-5" />
      </div>
      <p className="text-2xl font-bold text-[#101828]">{value}</p>
      <p className="text-sm text-[#4a5565]">{label}</p>
    </div>
  );
}

function OrdersTable({ orders, getStatusBadge, getLocalizedStatus, onAction, actionLoading, t }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-12 text-center">
        <div className="bg-gray-50 rounded-full size-16 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="size-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-[#101828] mb-2">{t('work_empty_orders_title')}</h3>
        <p className="text-[#4a5565]">{t('work_empty_orders_desc')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-[#e5e7eb]">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_order_id')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_service')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_customer')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_status')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_time_left')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-[#101828]">
                  #{order.order_number}
                </td>
                <td className="px-6 py-4 text-sm text-[#4a5565]">
                  {order.service_name}
                </td>
                <td className="px-6 py-4 text-sm text-[#4a5565]">
                  {order.customer_name}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                    {getLocalizedStatus(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[#4a5565]">
                  {order.days_left > 0 ? t('work_days_left', { count: order.days_left }) : t('work_due_today')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {order.status === 'paid' && (
                      <ActionButton
                        onClick={() => onAction('orders', order.id, 'accept')}
                        loading={actionLoading === `orders-${order.id}-accept`}
                        icon={Check}
                        label={t('work_action_accept')}
                        variant="primary"
                      />
                    )}
                    {order.status === 'accepted' && (
                      <ActionButton
                        onClick={() => onAction('orders', order.id, 'start')}
                        loading={actionLoading === `orders-${order.id}-start`}
                        icon={Play}
                        label={t('work_action_start')}
                        variant="primary"
                      />
                    )}
                    {order.status === 'in_progress' && (
                      <ActionButton
                        onClick={() => onAction('orders', order.id, 'deliver')}
                        loading={actionLoading === `orders-${order.id}-deliver`}
                        icon={Send}
                        label={t('work_action_deliver')}
                        variant="secondary"
                      />
                    )}
                    {order.status === 'delivered' && (
                      <span className="text-sm text-[#4a5565] italic">{t('work_awaiting_approval')}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BookingsTable({ bookings, getStatusBadge, getLocalizedStatus, onAction, actionLoading, t }) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-12 text-center">
        <div className="bg-gray-50 rounded-full size-16 flex items-center justify-center mx-auto mb-4">
          <Calendar className="size-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-[#101828] mb-2">{t('work_empty_bookings_title')}</h3>
        <p className="text-[#4a5565]">{t('work_empty_bookings_desc')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-[#e5e7eb]">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_booking_id')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_service')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_customer')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_date_time')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_status')}</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">{t('work_col_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-[#101828]">
                  #{booking.booking_number}
                </td>
                <td className="px-6 py-4 text-sm text-[#4a5565]">
                  {booking.service_name}
                </td>
                <td className="px-6 py-4 text-sm text-[#4a5565]">
                  {booking.customer_email}
                </td>
                <td className="px-6 py-4 text-sm text-[#4a5565]">
                  {booking.formatted_date ? (
                    <>
                      <div className="text-xs text-[#800020]" >{booking.formatted_date}</div>
                      <div className="text-xs text-[#800020]" >{booking.formatted_time}</div>
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">
                      {t('work_not_scheduled')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(booking.status)}`}>
                    {getLocalizedStatus(booking.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {booking.meeting_url && (
                      <a
                        href={booking.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100"
                      >
                        {t('work_action_join')}
                      </a>
                    )}
                    {booking.status === 'scheduled' && (
                      <ActionButton
                        onClick={() => onAction('bookings', booking.id, 'complete')}
                        loading={actionLoading === `bookings-${booking.id}-complete`}
                        icon={Check}
                        label={t('work_action_complete')}
                        variant="primary"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButton({ onClick, loading, icon: Icon, label, variant }) {
  const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors";
  const variants = {
    primary: "bg-[#800020] text-white hover:bg-[#600018]",
    secondary: "bg-purple-100 text-purple-700 hover:bg-purple-200"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${baseStyles} ${variants[variant]} disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Icon className="size-3.5" />
      )}
      {label}
    </button>
  );
}
// 'use client';

// import { useState, useEffect, useCallback, useRef } from 'react';
// import { 
//   Briefcase, 
//   Calendar, 
//   CheckCircle, 
//   Clock, 
//   AlertCircle,
//   Loader2,
//   RefreshCw,
//   Search,
//   Play,
//   Send,
//   Check
// } from 'lucide-react';
// import DashboardLayout from '@/components/provider/DashboardLayout';
// import { useApp } from '@/contexts/AppContext';
// import Cookies from 'js-cookie';
// import { toast } from 'react-hot-toast';

// export default function MyWorkPage() {
//   const [activeTab, setActiveTab] = useState('orders');
//   const [stats, setStats] = useState({
//     total_orders: 0,
//     active_orders: 0,
//     completed_orders: 0,
//     total_bookings: 0,
//     upcoming_bookings: 0,
//     today_bookings: 0
//   });
//   const [orders, setOrders] = useState([]);
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [actionLoading, setActionLoading] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [statusFilter, setStatusFilter] = useState('');

//   const { activeTenant } = useApp();
  
//   // Use ref to prevent dependency changes causing re-renders
//   const tenantRef = useRef(activeTenant?.id || activeTenant);
//   const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

//   // Update ref when tenant actually changes (not on every render)
//   useEffect(() => {
//     tenantRef.current = activeTenant?.id || activeTenant;
//   }, [activeTenant?.id]);

//   const getAuthHeaders = useCallback(() => ({
//     'Authorization': `Bearer ${Cookies.get("access_token")}`,
//     'Content-Type': 'application/json',
//     'X-Tenant': tenantRef.current || '',
//   }), []); // Empty deps - function doesn't change

//   // Fetch functions with NO dependencies that change every render
//   const fetchDashboard = useCallback(async () => {
//     try {
//       const response = await fetch(`${API_BASE}/api/v1/providers/dashboard/`, {
//         headers: getAuthHeaders(),
//       });
//       if (!response.ok) throw new Error('Failed to fetch stats');
//       const data = await response.json();
//       setStats(data);
//     } catch (err) {
//       toast.error(err.message);
//     }
//   }, [getAuthHeaders, API_BASE]); // Only depend on stable values

//   const fetchOrders = useCallback(async () => {
//     try {
//       let url = `${API_BASE}/api/v1/providers/work/orders/`;
//       // Build query string manually to avoid dependency issues
//       const params = new URLSearchParams();
//       if (statusFilter && activeTab === 'orders') params.append('status', statusFilter);
//       if (searchQuery && activeTab === 'orders') params.append('search', searchQuery);
//       if (params.toString()) url += `?${params.toString()}`;
      
//       const response = await fetch(url, { headers: getAuthHeaders() });
//       if (!response.ok) throw new Error('Failed to fetch orders');
//       const data = await response.json();
//       // console.log(data,"data")
//       setOrders(Array.isArray(data) ? data : data.results || []);
//     } catch (err) {
//       toast.error(err.message);
//     }
//   }, [getAuthHeaders, API_BASE, statusFilter, searchQuery, activeTab]);

//   const fetchBookings = useCallback(async () => {
//     try {
//       let url = `${API_BASE}/api/v1/providers/work/bookings/`;
//       const params = new URLSearchParams();
//       if (statusFilter === 'upcoming' && activeTab === 'bookings') {
//         params.append('filter', 'upcoming');
//       }
//       if (statusFilter === 'completed' && activeTab === 'bookings') {
//         params.append('filter', 'completed');
//       }
//       if (params.toString()) url += `?${params.toString()}`;
      
//       const response = await fetch(url, { headers: getAuthHeaders() });
//       if (!response.ok) throw new Error('Failed to fetch bookings');
//       const data = await response.json();
//       // console.log(data,"data")

//       setBookings(Array.isArray(data) ? data : data.results || []);
//     } catch (err) {
//       toast.error(err.message);
//     }
//   }, [getAuthHeaders, API_BASE, statusFilter, activeTab]);

//   // Single load effect - only runs ONCE on mount
//   useEffect(() => {
//     let isMounted = true;
    
//     const loadAll = async () => {
//       if (!isMounted) return;
//       setLoading(true);
//       await Promise.all([fetchDashboard(), fetchOrders(), fetchBookings()]);
//       if (isMounted) setLoading(false);
//     };
    
//     loadAll();
    
//     return () => { isMounted = false; };
//   }, []); // EMPTY DEPS - only run once on mount

//   // Separate effect for filter changes (not on initial load)
//   useEffect(() => {
//     // Skip initial render
//     if (loading) return;
    
//     const timeoutId = setTimeout(() => {
//       if (activeTab === 'orders') {
//         fetchOrders();
//       } else {
//         fetchBookings();
//       }
//     }, 300); // Debounce filter changes
    
//     return () => clearTimeout(timeoutId);
//   }, [statusFilter, searchQuery, activeTab]); // Only filter changes trigger refetch

//   const handleAction = async (type, id, action) => {
//     setActionLoading(`${type}-${id}-${action}`);
//     try {
//       const response = await fetch(
//         `${API_BASE}/api/v1/providers/work/${type}/${id}/${action}/`,
//         {
//           method: 'POST',
//           headers: getAuthHeaders(),
//         }
//       );
      
//       if (!response.ok) {
//         const err = await response.json();
//         throw new Error(err.detail || 'Action failed');
//       }
      
//       toast.success(`Successfully ${action}ed ${type.slice(0, -1)}`);
      
//       // Refresh only the changed data
//       fetchDashboard();
//       if (type === 'orders') fetchOrders();
//       else fetchBookings();
      
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setActionLoading(null);
//     }
//   };

//   const getStatusBadge = (status) => {
//     const styles = {
//       pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
//       paid: 'bg-blue-100 text-blue-700 border-blue-200',
//       accepted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
//       in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
//       delivered: 'bg-purple-100 text-purple-700 border-purple-200',
//       completed: 'bg-green-100 text-green-700 border-green-200',
//       scheduled: 'bg-cyan-100 text-cyan-700 border-cyan-200',
//       cancelled: 'bg-red-100 text-red-700 border-red-200',
//     };
//     return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
//   };

//   if (loading) {
//     return (
//       <DashboardLayout pageName="My Work">
//         <div className="flex items-center justify-center h-96">
//           <Loader2 className="size-8 animate-spin text-[#800020]" />
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout pageName="My Work">
//       <div className="flex flex-col gap-6">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//           <div>
//             <h1 className="text-2xl font-bold text-[#101828]">My Work</h1>
//             <p className="text-[#4a5565] mt-1">Manage your assigned orders and appointments</p>
//           </div>
//           <button
//             onClick={() => {
//               setLoading(true);
//               Promise.all([fetchDashboard(), fetchOrders(), fetchBookings()])
//                 .finally(() => setLoading(false));
//             }}
//             className="flex items-center gap-2 px-4 py-2 border border-[#e5e7eb] rounded-[10px] hover:bg-gray-50 text-[#4a5565]"
//           >
//             <RefreshCw size={16} />
//             Refresh
//           </button>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatCard 
//             icon={Briefcase} 
//             label="Active Orders" 
//             value={stats.active_orders} 
//             color="bg-blue-500" 
//           />
//           <StatCard 
//             icon={CheckCircle} 
//             label="Completed" 
//             value={stats.completed_orders} 
//             color="bg-green-500" 
//           />
//           <StatCard 
//             icon={Calendar} 
//             label="Upcoming Bookings" 
//             value={stats.upcoming_bookings} 
//             color="bg-[#800020]" 
//           />
//           <StatCard 
//             icon={Clock} 
//             label="Today" 
//             value={stats.today_bookings} 
//             color="bg-orange-500" 
//           />
//         </div>

//         {/* Tabs */}
//         <div className="bg-[#f3f4f6] p-1 rounded-[12px] w-fit flex gap-1">
//           <button
//             onClick={() => { 
//               setActiveTab('orders'); 
//               setStatusFilter(''); 
//               setSearchQuery('');
//             }}
//             className={`px-6 py-2 rounded-[10px] text-sm font-medium transition-all ${
//               activeTab === 'orders' 
//                 ? 'bg-white shadow-sm text-[#101828]' 
//                 : 'text-[#4a5565] hover:text-[#101828]'
//             }`}
//           >
//             Orders ({stats.total_orders})
//           </button>
//           <button
//             onClick={() => { 
//               setActiveTab('bookings'); 
//               setStatusFilter(''); 
//               setSearchQuery('');
//             }}
//             className={`px-6 py-2 rounded-[10px] text-sm font-medium transition-all ${
//               activeTab === 'bookings' 
//                 ? 'bg-white shadow-sm text-[#101828]' 
//                 : 'text-[#494b4e] hover:text-[#101828]'
//             }`}
//           >
//             Bookings ({stats.total_bookings})
//           </button>
//         </div>

//         {/* Filters */}
//         <div className="flex flex-col sm:flex-row gap-4">
//           <div className="relative flex-1 max-w-md">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#4a5565]" />
//             <input
//               type="text"
//               placeholder={activeTab === 'orders' ? "Search orders..." : "Search bookings..."}
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:border-[#800020]"
//             />
//           </div>
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="px-4 py-2 border border-[#e5e7eb] rounded-[10px] focus:outline-none focus:border-[#800020] bg-white"
//           >
//             <option value="">All Status</option>
//             {activeTab === 'orders' ? (
//               <>
//                 <option value="accepted">Accepted</option>
//                 <option value="in_progress">In Progress</option>
//                 <option value="delivered">Delivered</option>
//                 <option value="completed">Completed</option>
//               </>
//             ) : (
//               <>
//                 <option value="upcoming">Upcoming</option>
//                 <option value="completed">Completed</option>
//               </>
//             )}
//           </select>
//         </div>

//         {/* Content */}
//         {activeTab === 'orders' ? (
//           <OrdersTable 
//             orders={orders} 
//             getStatusBadge={getStatusBadge}
//             onAction={handleAction}
//             actionLoading={actionLoading}
//           />
//         ) : (
//           <BookingsTable 
//             bookings={bookings}
//             getStatusBadge={getStatusBadge}
//             onAction={handleAction}
//             actionLoading={actionLoading}
//           />
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }

// function StatCard({ icon: Icon, label, value, color }) {
//   return (
//     <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4">
//       <div className={`${color} w-10 h-10 rounded-[12px] flex items-center justify-center mb-3`}>
//         <Icon className="text-white size-5" />
//       </div>
//       <p className="text-2xl font-bold text-[#101828]">{value}</p>
//       <p className="text-sm text-[#4a5565]">{label}</p>
//     </div>
//   );
// }

// function OrdersTable({ orders, getStatusBadge, onAction, actionLoading }) {
//   if (orders.length === 0) {
//     return (
//       <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-12 text-center">
//         <div className="bg-gray-50 rounded-full size-16 flex items-center justify-center mx-auto mb-4">
//           <CheckCircle className="size-8 text-gray-400" />
//         </div>
//         <h3 className="text-lg font-semibold text-[#101828] mb-2">No orders found</h3>
//         <p className="text-[#4a5565]">You're all caught up! 🎉</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white border border-[#e5e7eb] rounded-[16px] overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead className="bg-gray-50 border-b border-[#e5e7eb]">
//             <tr>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Order ID</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Service</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Customer</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Status</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Time Left</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-[#e5e7eb]">
//             {orders.map((order) => (
//               <tr key={order.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 text-sm font-medium text-[#101828]">
//                   #{order.order_number}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-[#4a5565]">
//                   {order.service_name}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-[#4a5565]">
//                   {order.customer_name}
//                 </td>
//                 <td className="px-6 py-4">
//                   <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
//                     {order.status.replace('_', ' ')}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4 text-sm text-[#4a5565]">
//                   {order.days_left > 0 ? `${order.days_left} days` : 'Due today'}
//                 </td>
//                 <td className="px-6 py-4">
//                   <div className="flex gap-2">
//                     {order.status === 'paid' && (
//                       <ActionButton
//                         onClick={() => onAction('orders', order.id, 'accept')}
//                         loading={actionLoading === `orders-${order.id}-accept`}
//                         icon={Check}
//                         label="Accept"
//                         variant="primary"
//                       />
//                     )}
//                     {order.status === 'accepted' && (
//                       <ActionButton
//                         onClick={() => onAction('orders', order.id, 'start')}
//                         loading={actionLoading === `orders-${order.id}-start`}
//                         icon={Play}
//                         label="Start"
//                         variant="primary"
//                       />
//                     )}
//                     {order.status === 'in_progress' && (
//                       <ActionButton
//                         onClick={() => onAction('orders', order.id, 'deliver')}
//                         loading={actionLoading === `orders-${order.id}-deliver`}
//                         icon={Send}
//                         label="Deliver"
//                         variant="secondary"
//                       />
//                     )}
//                     {order.status === 'delivered' && (
//                       <span className="text-sm text-[#4a5565] italic">Awaiting approval</span>
//                     )}
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// function BookingsTable({ bookings, getStatusBadge, onAction, actionLoading }) {
//   if (bookings.length === 0) {
//     return (
//       <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-12 text-center">
//         <div className="bg-gray-50 rounded-full size-16 flex items-center justify-center mx-auto mb-4">
//           <Calendar className="size-8 text-gray-400" />
//         </div>
//         <h3 className="text-lg font-semibold text-[#101828] mb-2">No bookings found</h3>
//         <p className="text-[#4a5565]">No upcoming appointments scheduled</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white border border-[#e5e7eb] rounded-[16px] overflow-hidden">
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead className="bg-gray-50 border-b border-[#e5e7eb]">
//             <tr>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Booking ID</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Service</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Customer</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Date & Time</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Status</th>
//               <th className="text-left px-6 py-4 text-sm font-semibold text-[#364153]">Actions</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-[#e5e7eb]">
//             {bookings.map((booking) => (
//               <tr key={booking.id} className="hover:bg-gray-50">
//                 <td className="px-6 py-4 text-sm font-medium text-[#101828]">
//                   #{booking.booking_number}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-[#4a5565]">
//                   {booking.service_name}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-[#4a5565]">
//                   {booking.customer_email}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-[#4a5565]">
//                   {booking.formatted_date ? (
//                     <>
//                       <div className="text-xs text-[#800020]" >{booking.formatted_date}</div>
//                       <div className="text-xs text-[#800020]" >{booking.formatted_time}</div>
//                     </>
//                   ) : (
//                     <span className="text-gray-400 text-xs">
//                       Not scheduled yet
//                     </span>
//                   )}

//                 </td>
//                 <td className="px-6 py-4">
//                   <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(booking.status)}`}>
//                     {booking.status}
//                   </span>
//                 </td>
//                 <td className="px-6 py-4">
//                   <div className="flex gap-2">
//                     {booking.meeting_url && (
//                       <a
//                         href={booking.meeting_url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100"
//                       >
//                         Join
//                       </a>
//                     )}
//                     {booking.status === 'scheduled' && (
//                       <ActionButton
//                         onClick={() => onAction('bookings', booking.id, 'complete')}
//                         loading={actionLoading === `bookings-${booking.id}-complete`}
//                         icon={Check}
//                         label="Complete"
//                         variant="primary"
//                       />
//                     )}
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// function ActionButton({ onClick, loading, icon: Icon, label, variant }) {
//   const baseStyles = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors";
//   const variants = {
//     primary: "bg-[#800020] text-white hover:bg-[#600018]",
//     secondary: "bg-purple-100 text-purple-700 hover:bg-purple-200"
//   };
  
//   return (
//     <button
//       onClick={onClick}
//       disabled={loading}
//       className={`${baseStyles} ${variants[variant]} disabled:opacity-50`}
//     >
//       {loading ? (
//         <Loader2 className="size-3.5 animate-spin" />
//       ) : (
//         <Icon className="size-3.5" />
//       )}
//       {label}
//     </button>
//   );
// }