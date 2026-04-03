// src/app/dashboard/orders/page.js
import AdminOrdersClient from "./AdminOrdersClient";

export const metadata = { title: "Orders | Dashboard" };

export default function OrdersPage() {
  return <AdminOrdersClient />;
}

// "use client";

// /**
//  * Dashboard Orders Page
//  * 
//  * Tenant owner's admin view of all orders.
//  * Route: /dashboard/orders
//  * 
//  * Shows all orders across all providers with admin actions.
//  */

// import { useState, useEffect } from "react";
// import { useApp } from "@/contexts/AppContext";
// import { resolveTranslated } from "@/app/tenant-site/[domain]/utils/resolveTranslated";
// import {
//   Package,
//   Search,
//   Filter,
//   Eye,
//   DollarSign,
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   RefreshCw,
//   XCircle,
//   ChevronRight,
// } from "lucide-react";

// const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// const STATUS_MAP = {
//   pending_payment: { label: "Pending", color: "bg-gray-100 text-gray-700", icon: Clock },
//   paid: { label: "Paid (New)", color: "bg-blue-100 text-blue-700", icon: DollarSign },
//   accepted: { label: "Accepted", color: "bg-indigo-100 text-indigo-700", icon: CheckCircle },
//   in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: RefreshCw },
//   delivered: { label: "Delivered", color: "bg-green-100 text-green-700", icon: Package },
//   completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
//   revision_requested: { label: "Revision", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
//   cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
//   refunded: { label: "Refunded", color: "bg-red-100 text-red-700", icon: XCircle },
// };

// export default function DashboardOrdersPage() {
//   const { user, activeTenant, tenants, t, isRTL } = useApp();

//   const [orders, setOrders] = useState([]);
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState("all");
//   const [search, setSearch] = useState("");

//   const tenant = tenants?.find((t) => t.id === activeTenant) || tenants?.[0];
//   const domain = tenant?.primary_domain?.domain;

//   function getToken() {
//     return (
//       localStorage.getItem("access_token") ||
//       document.cookie.match(/access_token=([^;]+)/)?.[1]
//     );
//   }

//   // Fetch orders
//   useEffect(() => {
//     if (!domain) return;

//     async function fetchOrders() {
//       setLoading(true);
//       const token = getToken();

//       try {
//         const params = new URLSearchParams();
//         if (filter !== "all") params.set("status", filter);
//         if (search) params.set("search", search);

//         const res = await fetch(
//           `${API_BASE}/api/v1/orders/?${params.toString()}`,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               "X-Tenant": domain,
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         if (!res.ok) throw new Error("Failed to fetch orders");
//         const data = await res.json();
//         setOrders(data.results || data || []);
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchOrders();
//   }, [domain, filter, search]);

//   // Fetch stats
//   useEffect(() => {
//     if (!domain) return;

//     async function fetchStats() {
//       const token = getToken();
//       try {
//         const res = await fetch(`${API_BASE}/api/v1/orders/stats/`, {
//           headers: {
//             "X-Tenant": domain,
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         if (res.ok) {
//           const data = await res.json();
//           setStats(data);
//         }
//       } catch (e) {
//         console.error(e);
//       }
//     }

//     fetchStats();
//   }, [domain]);

//   const filters = [
//     { key: "all", label: "All Orders" },
//     { key: "paid", label: "New (Pending Accept)" },
//     { key: "in_progress", label: "In Progress" },
//     { key: "delivered", label: "Delivered" },
//     { key: "revision_requested", label: "Revisions" },
//     { key: "completed", label: "Completed" },
//     { key: "cancelled", label: "Cancelled" },
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
//           <p className="text-gray-500 text-sm mt-1">
//             Manage digital service orders
//           </p>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       {stats && (
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           <StatCard
//             label="Total Orders"
//             value={stats.total || 0}
//             icon={Package}
//             color="blue"
//           />
//           <StatCard
//             label="Active"
//             value={stats.active || 0}
//             icon={RefreshCw}
//             color="yellow"
//           />
//           <StatCard
//             label="Completed"
//             value={stats.completed || 0}
//             icon={CheckCircle}
//             color="green"
//           />
//           <StatCard
//             label="Revenue"
//             value={`$${Number(stats.total_revenue || 0).toFixed(0)}`}
//             icon={DollarSign}
//             color="emerald"
//           />
//         </div>
//       )}

//       {/* Filters + Search */}
//       <div className="flex flex-col sm:flex-row gap-4">
//         <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
//           {filters.map((f) => (
//             <button
//               key={f.key}
//               onClick={() => setFilter(f.key)}
//               className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
//                 filter === f.key
//                   ? "bg-[#8B1E3F] text-white"
//                   : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//               }`}
//             >
//               {f.label}
//             </button>
//           ))}
//         </div>

//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//           <input
//             type="text"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search orders..."
//             className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
//           />
//         </div>
//       </div>

//       {/* Orders Table */}
//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         {loading ? (
//           <div className="p-8 space-y-4">
//             {[1, 2, 3, 4, 5].map((i) => (
//               <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
//             ))}
//           </div>
//         ) : orders.length === 0 ? (
//           <div className="p-12 text-center">
//             <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//             <p className="text-gray-500">No orders found</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-200">
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Provider</th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
//                   <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
//                   <th className="px-6 py-3"></th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-100">
//                 {orders.map((order) => {
//                   const statusCfg = STATUS_MAP[order.status] || STATUS_MAP.pending_payment;
//                   const StatusIcon = statusCfg.icon;

//                   return (
//                     <tr
//                       key={order.id}
//                       className="hover:bg-gray-50 transition-colors cursor-pointer"
//                       onClick={() =>
//                         (window.location.href = `/dashboard/orders/${order.id}`)
//                       }
//                     >
//                       <td className="px-6 py-4">
//                         <span className="font-mono text-sm font-semibold text-gray-900">
//                           {order.order_number}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-700">
//                         {order.service_name}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-600">
//                         {order.customer_name || order.customer_email || "—"}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-600">
//                         {order.provider_name || "Unassigned"}
//                       </td>
//                       <td className="px-6 py-4">
//                         <span
//                           className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}
//                         >
//                           <StatusIcon className="w-3 h-3" />
//                           {statusCfg.label}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 text-sm font-semibold text-gray-900">
//                         ${Number(order.total_amount).toFixed(2)}
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-500">
//                         {new Date(order.created_at).toLocaleDateString()}
//                       </td>
//                       <td className="px-6 py-4">
//                         <ChevronRight className="w-4 h-4 text-gray-400" />
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function StatCard({ label, value, icon: Icon, color }) {
//   const colors = {
//     blue: "bg-blue-50 text-blue-600",
//     yellow: "bg-yellow-50 text-yellow-600",
//     green: "bg-green-50 text-green-600",
//     emerald: "bg-emerald-50 text-emerald-600",
//   };

//   return (
//     <div className="bg-white rounded-xl border border-gray-200 p-4">
//       <div className="flex items-center gap-3">
//         <div className={`p-2 rounded-lg ${colors[color]}`}>
//           <Icon className="w-5 h-5" />
//         </div>
//         <div>
//           <p className="text-2xl font-bold text-gray-900">{value}</p>
//           <p className="text-xs text-gray-500">{label}</p>
//         </div>
//       </div>
//     </div>
//   );
// }