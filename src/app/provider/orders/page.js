// src/app/tenant-site/[domain]/provider/orders/page.js
import { fetchSite } from "../../utils/fetchSite";
import ProviderOrdersClient from "./ProviderOrdersClient";
import { notFound } from "next/navigation";

export async function generateMetadata() {
  return { title: "Provider - My Orders" };
}

export default async function ProviderOrdersPage() {
 
  return (
    <ProviderOrdersClient
    />
  );
}


// 'use client';

// import { useState } from 'react';
// import { Package, Clock, CheckCircle, DollarSign, Calendar, ChevronRight } from 'lucide-react';
// import DashboardLayout from '@/components/provider/DashboardLayout';
// import Link from 'next/link';

// export default function OrdersPage() {
//   const [activeTab, setActiveTab] = useState('all');

//   const tabs = [
//     { id: 'all', label: 'All Orders' },
//     { id: 'pending', label: 'Pending' },
//     { id: 'progress', label: 'In Progress' },
//     { id: 'delivered', label: 'Delivered' },
//   ];

//   const orders = [
//     { 
//       id: 'ORD-2401', 
//       title: 'Logo Design', 
//       client: 'Sarah Johnson', 
//       description: 'Need a modern logo for my tech startup. Looking for something minimalist and professional.', 
//       deadline: '05/01/2026', 
//       daysLeft: 2, 
//       price: 250, 
//       status: 'In Progress',
//       initials: 'SJ'
//     },
//   ];

//   return (
//     <DashboardLayout pageName="Orders">
//       <div className="flex flex-col gap-6">
//         {/* Header */}
//         <div>
//           <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">Orders</h1>
//           <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">Manage your digital service orders</p>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
//           <OrderStatCard icon={Package} label="Active Orders" value="1" color="bg-[#2563eb]" />
//           <OrderStatCard icon={Clock} label="Pending" value="1" color="bg-[#f59e0b]" />
//           <OrderStatCard icon={CheckCircle} label="Delivered" value="1" color="bg-[#10b981]" />
//           <OrderStatCard icon={DollarSign} label="Total Earned" value="$1,280" color="bg-[#800020]" />
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
//               <span className="text-[14px] md:text-[16px]">{tab.label}</span>
//             </button>
//           ))}
//         </div>

//         {/* Orders List */}
//         <div className="flex flex-col gap-4">
//           {orders.map((order) => (
//             <div key={order.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
//               <div className="flex items-start gap-4">
//                 <div className="bg-[#800020] rounded-full size-10 md:size-12 flex items-center justify-center shrink-0 text-white font-semibold">
//                   {order.initials}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-2">
//                     <div>
//                       <h3 className="text-base md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-1">
//                         {order.title}
//                       </h3>
//                       <p className="text-[13px] md:text-[14px] text-[#4a5565]">Client: {order.client}</p>
//                     </div>
//                     <div className="flex items-center gap-2 shrink-0">
//                       <div className="bg-[#dbeafe] border border-[#bedbff] h-[24px] px-3 rounded-[10px] flex items-center">
//                         <span className="text-[12px] text-[#1447e6] font-medium">{order.status}</span>
//                       </div>
//                       <span className="text-base md:text-[18px] text-[#101828] font-bold">${order.price}</span>
//                       <span className="text-[13px] md:text-[14px] text-[#4a5565]">#{order.id}</span>
//                     </div>
//                   </div>
                  
//                   <p className="text-[13px] md:text-[14px] text-[#4a5565] leading-[20px] mb-4 line-clamp-2">
//                     {order.description}
//                   </p>

//                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] md:text-[14px] text-[#364153]">
//                       <div className="flex items-center gap-1">
//                         <Calendar size={16} />
//                         <span>Deadline: {order.deadline}</span>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <Clock size={16} />
//                         <span>{order.daysLeft} days left</span>
//                       </div>
//                     </div>
//                     <Link
//                       href={`/provider/orders/${order.id}`}
//                       className="bg-white border border-[rgba(0,0,0,0.08)] h-[32px] px-4 rounded-[10px] text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-1 w-full sm:w-auto justify-center"
//                     >
//                       View Details
//                       <ChevronRight size={14} className="md:hidden" />
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }

// function OrderStatCard({ icon: Icon, label, value, color }) {
//   return (
//     <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
//       <div className={`${color} rounded-[16px] size-10 md:size-12 flex items-center justify-center mb-3`}>
//         <Icon className="text-white" size={20} />
//       </div>
//       <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight">{value}</p>
//       <p className="text-xs md:text-[14px] text-[#4a5565]">{label}</p>
//     </div>
//   );
// }