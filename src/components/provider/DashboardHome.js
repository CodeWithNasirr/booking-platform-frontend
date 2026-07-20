'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useApp } from '@/contexts/AppContext';
// import useRenderTrace from "@/lib/useRenderTrace";

export default function ProviderHome() {
  // useRenderTrace("DashboardHome(provider)");
  const [stats, setStats] = useState({
    active_orders: 0,
    upcoming_bookings: 0,
    today_bookings: 0
  });
  const [loading, setLoading] = useState(true);

  const { activeTenant, t } = useApp();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchDashboardData();
  }, [activeTenant]);

  const fetchDashboardData = async () => {
    console.log("[AUTH-TRACE] provider dashboard fetch START");
    try {
      const headers = {
        'Authorization': `Bearer ${Cookies.get("access_token")}`,
        'X-Tenant': activeTenant || '',
      };

      const response = await fetch(`${API_BASE}/api/v1/providers/dashboard/`, { headers, credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
      console.log("[AUTH-TRACE] provider dashboard fetch SETTLED");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#800020] to-[#a33] rounded-[16px] p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{t("provider_welcome")}</h1>
        <p className="text-white/90">
          {t("provider_welcome_sub", { orders: stats.active_orders, bookings: stats.upcoming_bookings })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStatCard
          icon={Briefcase}
          label={t("provider_active_orders")}
          value={stats.active_orders}
          href="/provider/work?tab=orders"
          color="bg-blue-500"
        />
        <QuickStatCard
          icon={Calendar}
          label={t("provider_upcoming_bookings")}
          value={stats.upcoming_bookings}
          href="/provider/work?tab=bookings"
          color="bg-[#800020]"
        />
        <QuickStatCard
          icon={Clock}
          label={t("provider_today_appointments")}
          value={stats.today_bookings}
          href="/provider/work?tab=bookings&filter=today"
          color="bg-orange-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/provider/work"
          className="bg-white border border-[#e5e7eb] rounded-[16px] p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 rounded-[12px] p-3">
                <Briefcase className="size-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[#101828]">{t("provider_my_work")}</h3>
                <p className="text-sm text-[#4a5565]">{t("provider_my_work_desc")}</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-[#4a5565] group-hover:text-[#800020]" />
          </div>
        </Link>

        <Link
          href="/provider/availability"
          className="bg-white border border-[#e5e7eb] rounded-[16px] p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 rounded-[12px] p-3">
                <Calendar className="size-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[#101828]">{t("provider_availability")}</h3>
                <p className="text-sm text-[#4a5565]">{t("provider_availability_desc")}</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-[#4a5565] group-hover:text-[#800020]" />
          </div>
        </Link>
      </div>

      {/* Pending Actions Alert */}
      {(stats.active_orders > 0 || stats.today_bookings > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-[16px] p-4 flex gap-3">
          <AlertCircle className="size-5 text-orange-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-orange-900">{t("provider_pending_actions")}</h3>
            <p className="text-sm text-orange-800 mt-1">
              {stats.active_orders > 0 && t("provider_pending_orders", { count: stats.active_orders })}
              {stats.active_orders > 0 && stats.today_bookings > 0 && " "}
              {stats.today_bookings > 0 && t("provider_pending_today", { count: stats.today_bookings })}
            </p>
            <Link 
              href="/provider/work" 
              className="inline-block mt-2 text-sm font-medium text-orange-700 hover:underline"
            >
              {t("provider_view_my_work")} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickStatCard({ icon: Icon, label, value, href, color }) {
  return (
    <Link href={href} className="bg-white border border-[#e5e7eb] rounded-[16px] p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`${color} rounded-[12px] p-3`}>
          <Icon className="size-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-[#101828]">{value}</span>
      </div>
      <p className="mt-4 text-sm text-[#4a5565] font-medium">{label}</p>
    </Link>
  );
}

// 'use client';

// import { useState, useEffect } from 'react';
// import { 
//   Briefcase, 
//   Calendar, 
//   CheckCircle, 
//   Clock, 
//   ChevronRight,
//   AlertCircle
// } from 'lucide-react';
// import DashboardLayout from '@/components/provider/DashboardLayout';
// import Link from 'next/link';
// import Cookies from 'js-cookie';
// import { useApp } from '@/contexts/AppContext';

// export default function ProviderHome() {
//   const [stats, setStats] = useState({
//     active_orders: 0,
//     upcoming_bookings: 0,
//     today_bookings: 0
//   });
//   const [recentWork, setRecentWork] = useState([]);
//   const [loading, setLoading] = useState(true);
  
//   const { activeTenant,t } = useApp();
//   const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
//   useEffect(() => {
//     fetchDashboardData();
//   }, [activeTenant]);

//   const fetchDashboardData = async () => {
//     try {
//       const headers = {
//         'Authorization': `Bearer ${Cookies.get("access_token")}`,
//         'X-Tenant': activeTenant || '',
//       };
    
//       const response = await fetch(`${API_BASE}/api/v1/providers/dashboard/`, { headers, credentials: "include" });
//       if (response.ok) {
//         const data = await response.json();
//         setStats(data);
//       }
//     } catch (err) {
//       console.error('Failed to fetch dashboard:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
   
//       <div className="flex flex-col gap-6">
//         {/* Welcome Banner */}
//         <div className="bg-gradient-to-r from-[#800020] to-[#a33] rounded-[16px] p-6 text-white">
//           <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
//           <p className="text-white/90">
//             You have {stats.active_orders} active orders and {stats.upcoming_bookings} upcoming appointments
//           </p>
//         </div>

//         {/* Quick Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <QuickStatCard
//             icon={Briefcase}
//             label="Active Orders"
//             value={stats.active_orders}
//             href="/provider/work?tab=orders"
//             color="bg-blue-500"
//           />
//           <QuickStatCard
//             icon={Calendar}
//             label="Upcoming Bookings"
//             value={stats.upcoming_bookings}
//             href="/provider/work?tab=bookings"
//             color="bg-[#800020]"
//           />
//           <QuickStatCard
//             icon={Clock}
//             label="Today's Appointments"
//             value={stats.today_bookings}
//             href="/provider/work?tab=bookings&filter=today"
//             color="bg-orange-500"
//           />
//         </div>

//         {/* Quick Actions */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Link
//             href="/provider/work"
//             className="bg-white border border-[#e5e7eb] rounded-[16px] p-6 hover:shadow-md transition-shadow group"
//           >
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <div className="bg-blue-50 rounded-[12px] p-3">
//                   <Briefcase className="size-6 text-blue-600" />
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-[#101828]">My Work</h3>
//                   <p className="text-sm text-[#4a5565]">View orders and appointments</p>
//                 </div>
//               </div>
//               <ChevronRight className="size-5 text-[#4a5565] group-hover:text-[#800020]" />
//             </div>
//           </Link>

//           <Link
//             href="/provider/availability"
//             className="bg-white border border-[#e5e7eb] rounded-[16px] p-6 hover:shadow-md transition-shadow group"
//           >
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <div className="bg-green-50 rounded-[12px] p-3">
//                   <Calendar className="size-6 text-green-600" />
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-[#101828]">Availability</h3>
//                   <p className="text-sm text-[#4a5565]">Manage your schedule</p>
//                 </div>
//               </div>
//               <ChevronRight className="size-5 text-[#4a5565] group-hover:text-[#800020]" />
//             </div>
//           </Link>
//         </div>

//         {/* Pending Actions Alert */}
//         {(stats.active_orders > 0 || stats.today_bookings > 0) && (
//           <div className="bg-orange-50 border border-orange-200 rounded-[16px] p-4 flex gap-3">
//             <AlertCircle className="size-5 text-orange-600 shrink-0" />
//             <div>
//               <h3 className="font-semibold text-orange-900">Pending Actions</h3>
//               <p className="text-sm text-orange-800 mt-1">
//                 {stats.active_orders > 0 && `${stats.active_orders} orders require your attention. `}
//                 {stats.today_bookings > 0 && `You have ${stats.today_bookings} appointment(s) today.`}
//               </p>
//               <Link 
//                 href="/provider/work" 
//                 className="inline-block mt-2 text-sm font-medium text-orange-700 hover:underline"
//               >
//                 View My Work →
//               </Link>
//             </div>
//           </div>
//         )}
//       </div>

//   );
// }

// function QuickStatCard({ icon: Icon, label, value, href, color }) {
//   return (
//     <Link href={href} className="bg-white border border-[#e5e7eb] rounded-[16px] p-6 hover:shadow-md transition-shadow">
//       <div className="flex items-start justify-between">
//         <div className={`${color} rounded-[12px] p-3`}>
//           <Icon className="size-6 text-white" />
//         </div>
//         <span className="text-2xl font-bold text-[#101828]">{value}</span>
//       </div>
//       <p className="mt-4 text-sm text-[#4a5565] font-medium">{label}</p>
//     </Link>
//   );
// }