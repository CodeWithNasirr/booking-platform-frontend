// "use client";
// import Cookies from 'js-cookie';

// import { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   AreaChart,
//   Area,
//   BarChart,
//   Bar,
//   LineChart,
//   Line,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
// } from "recharts";
// import {
//   CalendarDays,
//   TrendingUp,
//   TrendingDown,
//   DollarSign,
//   Users,
//   Star,
//   ArrowUpRight,
//   ArrowDownRight,
//   Clock,
//   BarChart3,
//   Filter,
//   Download,
//   RefreshCw,
//   ChevronDown,
//   Loader2,
// } from "lucide-react";

// // ─── API Layer ───────────────────────────────────────────────────────────────

// const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// async function fetchWithAuth(
//   endpoint,
//   activeTenant,
//   options = {},
// ) {
//   const token = Cookies.get('access_token');

//   if (!activeTenant) {
//     throw new Error("Tenant not ready");
//   }

//   const res = await fetch(`${API_BASE}${endpoint}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//       "X-Tenant": activeTenant, // ✅ tenant header added
//       ...options.headers,
//     },
//   });

//   let data = null;

//   try {
//     data = await res.json();
//   } catch {
//     data = null;
//   }

//   if (!res.ok) {
//     const message =
//       data?.detail ||
//       data?.message ||
//       `Request failed: ${res.status}`;

//     const error = new Error(message);
//     error.status = res.status;
//     error.data = data;
//     throw error;
//   }

//   return data;
// }


// const analyticsAPI = {
//   getKPIs: (params,activeTenant) =>
//     fetchWithAuth(
//       `/api/v1/analytics/kpis/?${new URLSearchParams(params).toString()}`,activeTenant
//     ),
//   getBookingsOverTime: (params,activeTenant) =>
//     fetchWithAuth(
//       `/api/v1/analytics/bookings-over-time/?${new URLSearchParams(params).toString()}`,activeTenant
//     ),
//   getRevenueByCategory: (params,activeTenant) =>
//     fetchWithAuth(
//       `/api/v1/analytics/revenue-by-category/?${new URLSearchParams(params).toString()}`,activeTenant
//     ),
//   getRevenueTrends: (params,activeTenant) =>
//     fetchWithAuth(
//       `/api/v1/analytics/revenue-trends/?${new URLSearchParams(params).toString()}`,activeTenant
//     ),
//   getPeakHours: (params,activeTenant) =>
//     fetchWithAuth(
//       `/api/v1/analytics/peak-hours/?${new URLSearchParams(params).toString()}`,activeTenant
//     ),
//   getTopServices: (params,activeTenant) =>
//     fetchWithAuth(
//       `/api/v1/analytics/top-services/?${new URLSearchParams(params).toString()}`,activeTenant
//     ),
//   getTopProviders: (params,activeTenant) =>
//     fetchWithAuth(
//       `/api/v1/analytics/top-providers/?${new URLSearchParams(params).toString()}`,activeTenant
//     ),
//   getBookingStatusOverview: (params,activeTenant) =>
//     fetchWithAuth(
//       `/api/v1/analytics/booking-status/?${new URLSearchParams(params).toString()}`,activeTenant
//     ),
// };

// // ─── Constants ───────────────────────────────────────────────────────────────

// const DATE_RANGES = [
//   { label: "Last 7 Days", value: "7d" },
//   { label: "Last 30 Days", value: "30d" },
//   { label: "Last 90 Days", value: "90d" },
//   { label: "This Month", value: "this_month" },
//   { label: "Last Month", value: "last_month" },
//   { label: "This Year", value: "this_year" },
// ];

// const CHART_COLORS = [
//   "#6366f1",
//   "#22c55e",
//   "#f59e0b",
//   "#ef4444",
//   "#06b6d4",
//   "#8b5cf6",
//   "#ec4899",
//   "#14b8a6",
// ];

// const STATUS_COLORS = {
//   completed: "#22c55e",
//   confirmed: "#6366f1",
//   in_progress: "#3b82f6",
//   scheduled: "#06b6d4",
//   pending_payment: "#f59e0b",
//   deposit_paid: "#a855f7",
//   paid: "#8b5cf6",
//   cancelled: "#ef4444",
//   refunded: "#f97316",
//   no_show: "#64748b",
// };

// // ─── Utility Helpers ─────────────────────────────────────────────────────────

// function formatCurrency(amount, currency = "SAR") {
//   return new Intl.NumberFormat("en-SA", {
//     style: "currency",
//     currency,
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(amount);
// }

// function formatNumber(num) {
//   if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
//   if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
//   return num?.toLocaleString() ?? "0";
// }

// function formatPercent(value) {
//   return `${value >= 0 ? "+" : ""}${value?.toFixed(1) ?? "0"}%`;
// }

// function getDateRangeParams(rangeValue) {
//   const now = new Date();
//   const params = {};

//   switch (rangeValue) {
//     case "7d":
//       params.start_date = new Date(now - 7 * 86400000)
//         .toISOString()
//         .split("T")[0];
//       params.end_date = now.toISOString().split("T")[0];
//       break;
//     case "30d":
//       params.start_date = new Date(now - 30 * 86400000)
//         .toISOString()
//         .split("T")[0];
//       params.end_date = now.toISOString().split("T")[0];
//       break;
//     case "90d":
//       params.start_date = new Date(now - 90 * 86400000)
//         .toISOString()
//         .split("T")[0];
//       params.end_date = now.toISOString().split("T")[0];
//       break;
//     case "this_month":
//       params.start_date = new Date(now.getFullYear(), now.getMonth(), 1)
//         .toISOString()
//         .split("T")[0];
//       params.end_date = now.toISOString().split("T")[0];
//       break;
//     case "last_month":
//       params.start_date = new Date(now.getFullYear(), now.getMonth() - 1, 1)
//         .toISOString()
//         .split("T")[0];
//       params.end_date = new Date(now.getFullYear(), now.getMonth(), 0)
//         .toISOString()
//         .split("T")[0];
//       break;
//     case "this_year":
//       params.start_date = new Date(now.getFullYear(), 0, 1)
//         .toISOString()
//         .split("T")[0];
//       params.end_date = now.toISOString().split("T")[0];
//       break;
//     default:
//       params.start_date = new Date(now - 30 * 86400000)
//         .toISOString()
//         .split("T")[0];
//       params.end_date = now.toISOString().split("T")[0];
//   }

//   return params;
// }

// // ─── Reusable Components ─────────────────────────────────────────────────────

// function KPICard({ title, value, change, changeLabel, icon: Icon, loading }) {
//   const isPositive = change >= 0;

//   return (
//     <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
//       <div className="flex items-start justify-between mb-3">
//         <div className="p-2 bg-indigo-50 rounded-lg">
//           <Icon className="w-5 h-5 text-indigo-600" />
//         </div>
//         {change !== undefined && change !== null && (
//           <span
//             className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
//               isPositive
//                 ? "bg-emerald-50 text-emerald-700"
//                 : "bg-red-50 text-red-700"
//             }`}
//           >
//             {isPositive ? (
//               <ArrowUpRight className="w-3 h-3" />
//             ) : (
//               <ArrowDownRight className="w-3 h-3" />
//             )}
//             {formatPercent(change)}
//           </span>
//         )}
//       </div>
//       {loading ? (
//         <div className="animate-pulse">
//           <div className="h-8 bg-gray-200 rounded w-24 mb-1" />
//           <div className="h-4 bg-gray-100 rounded w-16" />
//         </div>
//       ) : (
//         <>
//           <p className="text-2xl font-bold text-gray-900">{value}</p>
//           <p className="text-sm text-gray-500 mt-1">
//             {title}
//             {changeLabel && (
//               <span className="text-gray-400"> · {changeLabel}</span>
//             )}
//           </p>
//         </>
//       )}
//     </div>
//   );
// }

// function ChartCard({ title, subtitle, children, actions, loading, className = "" }) {
//   return (
//     <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
//       <div className="flex items-start justify-between mb-4">
//         <div>
//           <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
//           {subtitle && (
//             <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
//           )}
//         </div>
//         {actions && <div className="flex items-center gap-2">{actions}</div>}
//       </div>
//       {loading ? (
//         <div className="flex items-center justify-center w-[220px] h-64 min-h-[250px] flex-shrink-0">
//           <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
//         </div>
//       ) : (
//         children
//       )}
//     </div>
//   );
// }

// function CustomTooltip({ active, payload, label, formatter }) {
//   if (!active || !payload?.length) return null;

//   return (
//     <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700">
//       <p className="text-gray-400 mb-1">{label}</p>
//       {payload.map((entry, i) => (
//         <p key={i} className="flex items-center gap-2">
//           <span
//             className="w-2 h-2 rounded-full"
//             style={{ backgroundColor: entry.color }}
//           />
//           <span className="text-gray-300">{entry.name}:</span>
//           <span className="font-medium">
//             {formatter ? formatter(entry.value) : entry.value}
//           </span>
//         </p>
//       ))}
//     </div>
//   );
// }

// function DataTable({ columns, data, loading, emptyMessage = "No data available" }) {
//   if (loading) {
//     return (
//       <div className="animate-pulse space-y-3">
//         {[...Array(5)].map((_, i) => (
//           <div key={i} className="h-10 bg-gray-100 rounded" />
//         ))}
//       </div>
//     );
//   }

//   if (!data?.length) {
//     return (
//       <div className="text-center py-8 text-sm text-gray-400">
//         {emptyMessage}
//       </div>
//     );
//   }

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full text-sm">
//         <thead>
//           <tr className="border-b border-gray-100">
//             {columns.map((col) => (
//               <th
//                 key={col.key}
//                 className={`py-2.5 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left ${col.className || ""}`}
//               >
//                 {col.label}
//               </th>
//             ))}
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((row, idx) => (
//             <tr
//               key={row.id || idx}
//               className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
//             >
//               {columns.map((col) => (
//                 <td
//                   key={col.key}
//                   className={`py-3 px-3 ${col.className || ""}`}
//                 >
//                   {col.render ? col.render(row[col.key], row) : row[col.key]}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// function StatusBadge({ status }) {
//   const colorMap = {
//     completed: "bg-emerald-50 text-emerald-700",
//     confirmed: "bg-indigo-50 text-indigo-700",
//     in_progress: "bg-blue-50 text-blue-700",
//     scheduled: "bg-cyan-50 text-cyan-700",
//     pending_payment: "bg-amber-50 text-amber-700",
//     deposit_paid: "bg-purple-50 text-purple-700",
//     paid: "bg-violet-50 text-violet-700",
//     cancelled: "bg-red-50 text-red-700",
//     refunded: "bg-orange-50 text-orange-700",
//     no_show: "bg-gray-100 text-gray-600",
//   };

//   const label = status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

//   return (
//     <span
//       className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${colorMap[status] || "bg-gray-100 text-gray-600"}`}
//     >
//       {label || status}
//     </span>
//   );
// }

// // ─── Booking Status Pie Chart ────────────────────────────────────────────────

// function BookingStatusChart({ data, loading }) {
//   const chartData = useMemo(() => {
//     if (!data) return [];
//     return Object.entries(data).map(([status, count]) => ({
//       name: status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
//       value: count,
//       status,
//     }));
//   }, [data]);

//   const total = useMemo(
//     () => chartData.reduce((sum, d) => sum + d.value, 0),
//     [chartData]
//   );

//   return (
//     <ChartCard title="Booking Status Overview" subtitle="Current distribution" loading={loading}>
//       <div className="flex items-center gap-6">
//         <div className="w-[220px] h-64 min-h-[250px] flex-shrink-0">
//           <ResponsiveContainer width="100%" height="100%">
//             <PieChart>
//               <Pie
//                 data={chartData}
//                 cx="50%"
//                 cy="50%"
//                 innerRadius={55}
//                 outerRadius={80}
//                 paddingAngle={2}
//                 dataKey="value"
//               >
//                 {chartData.map((entry, i) => (
//                   <Cell
//                     key={entry.status}
//                     fill={STATUS_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]}
//                   />
//                 ))}
//               </Pie>
//               <Tooltip
//                 content={({ active, payload }) => {
//                   if (!active || !payload?.length) return null;
//                   const d = payload[0].payload;
//                   return (
//                     <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
//                       <p className="font-medium">{d.name}</p>
//                       <p className="text-gray-300">
//                         {d.value} ({((d.value / total) * 100).toFixed(1)}%)
//                       </p>
//                     </div>
//                   );
//                 }}
//               />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>
//         <div className="flex-1 space-y-2">
//           {chartData
//             .sort((a, b) => b.value - a.value)
//             .slice(0, 6)
//             .map((d) => (
//               <div key={d.status} className="flex items-center justify-between text-sm">
//                 <div className="flex items-center gap-2">
//                   <span
//                     className="w-2.5 h-2.5 rounded-full"
//                     style={{ backgroundColor: STATUS_COLORS[d.status] || "#94a3b8" }}
//                   />
//                   <span className="text-gray-600">{d.name}</span>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <span className="text-gray-900 font-medium">{d.value}</span>
//                   <span className="text-gray-400 text-xs w-10 text-right">
//                     {((d.value / total) * 100).toFixed(0)}%
//                   </span>
//                 </div>
//               </div>
//             ))}
//         </div>
//       </div>
//     </ChartCard>
//   );
// }

// // ─── Peak Hours Heatmap ──────────────────────────────────────────────────────

// function PeakHoursChart({ data, loading }) {
//   const chartData = useMemo(() => {
//     if (!data?.length) return [];
//     return data.map((d) => ({
//       ...d,
//       hour:
//       d.hour !== null && d.hour !== undefined
//         ? `${String(d.hour).padStart(2, "0")}:00`
//         : "Unknown",

//     }));
//   }, [data]);

//   return (
//     <ChartCard title="Peak Booking Hours" subtitle="Bookings by hour of day" loading={loading}>
//       <div className="w-[220px] h-64 min-h-[250px] flex-shrink-0">
//         <ResponsiveContainer width="100%" height="100%">
//           <BarChart data={chartData} barSize={16}>
//             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//             <XAxis
//               dataKey="hour"
//               tick={{ fontSize: 11, fill: "#94a3b8" }}
//               axisLine={false}
//               tickLine={false}
//               interval={2}
//             />
//             <YAxis
//               tick={{ fontSize: 11, fill: "#94a3b8" }}
//               axisLine={false}
//               tickLine={false}
//             />
//             <Tooltip
//               content={(props) => (
//                 <CustomTooltip {...props} formatter={(v) => `${v} bookings`} />
//               )}
//             />
//             <Bar dataKey="count" name="Bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
//           </BarChart>
//         </ResponsiveContainer>
//       </div>
//     </ChartCard>
//   );
// }

// // ─── Main Page Component ─────────────────────────────────────────────────────
// import { useApp } from '@/contexts/AppContext'
// export default function AnalyticsPage() {
//   const [dateRange, setDateRange] = useState("30d");
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const { activeTenant } = useApp()

//   // Data states
//   const [kpis, setKPIs] = useState(null);
//   const [bookingsOverTime, setBookingsOverTime] = useState([]);
//   const [revenueByCategory, setRevenueByCategory] = useState([]);
//   const [revenueTrends, setRevenueTrends] = useState([]);
//   const [peakHours, setPeakHours] = useState([]);
//   const [topServices, setTopServices] = useState([]);
//   const [topProviders, setTopProviders] = useState([]);
//   const [bookingStatus, setBookingStatus] = useState(null);

//   const loadAnalytics = useCallback(
//     async (showFullLoader = true) => {
//       const params = getDateRangeParams(dateRange);

//       if (showFullLoader) setLoading(true);
//       else setRefreshing(true);

//       try {
//         const [
//           kpiData,
//           bookingsData,
//           categoryData,
//           trendsData,
//           peakData,
//           servicesData,
//           providersData,
//           statusData,
//         ] = await Promise.allSettled([
//           analyticsAPI.getKPIs(params,activeTenant),
//           analyticsAPI.getBookingsOverTime(params,activeTenant),
//           analyticsAPI.getRevenueByCategory(params,activeTenant),
//           analyticsAPI.getRevenueTrends(params,activeTenant),
//           analyticsAPI.getPeakHours(params,activeTenant),
//           analyticsAPI.getTopServices(params,activeTenant),
//           analyticsAPI.getTopProviders(params,activeTenant),
//           analyticsAPI.getBookingStatusOverview(params,activeTenant),
//         ]);

//         if (kpiData.status === "fulfilled") setKPIs(kpiData.value);
//         if (bookingsData.status === "fulfilled")
//           setBookingsOverTime(bookingsData.value?.results || bookingsData.value || []);
//         if (categoryData.status === "fulfilled")
//           setRevenueByCategory(categoryData.value?.results || categoryData.value || []);
//         if (trendsData.status === "fulfilled")
//           setRevenueTrends(trendsData.value?.results || trendsData.value || []);
//         if (peakData.status === "fulfilled")
//           setPeakHours(peakData.value?.results || peakData.value || []);
//         if (servicesData.status === "fulfilled")
//           setTopServices(servicesData.value?.results || servicesData.value || []);
//         if (providersData.status === "fulfilled")
//           setTopProviders(providersData.value?.results || providersData.value || []);
//         if (statusData.status === "fulfilled") setBookingStatus(statusData.value);
//       } catch (err) {
//         console.error("Failed to load analytics:", err);
//       } finally {
//         setLoading(false);
//         setRefreshing(false);
//       }
//     },
//     [dateRange]
//   );

//   useEffect(() => {
//     loadAnalytics(true);
//   }, [loadAnalytics]);

//   // ─── Top Services Table Config ───────────────────────────────────────────

//   const serviceColumns = [
//     {
//       key: "rank",
//       label: "#",
//       className: "w-10",
//       render: (_, row) => (
//         <span className="text-gray-400 font-medium">{row.rank || "-"}</span>
//       ),
//     },
//     {
//       key: "name",
//       label: "Service",
//       render: (val, row) => (
//         <div>
//           <p className="font-medium text-gray-900">{typeof val === "object" ? val?.en : val}</p>
//           {row.category && (
//             <p className="text-xs text-gray-400">{typeof row.category === "object" ? row.category?.en : row.category}
// </p>
//           )}
//         </div>
//       ),
//     },
//     {
//       key: "bookings_count",
//       label: "Bookings",
//       className: "text-right",
//       render: (val) => (
//         <span className="font-medium text-gray-900">{formatNumber(val)}</span>
//       ),
//     },
//     {
//       key: "revenue",
//       label: "Revenue",
//       className: "text-right",
//       render: (val) => (
//         <span className="font-medium text-gray-900">{formatCurrency(val)}</span>
//       ),
//     },
//     {
//       key: "avg_rating",
//       label: "Rating",
//       className: "text-right",
//       render: (val) =>
//         val ? (
//           <div className="flex items-center justify-end gap-1">
//             <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
//             <span className="font-medium text-gray-900">
//               {val?.toFixed(1)}
//             </span>
//           </div>
//         ) : (
//           <span className="text-gray-300">—</span>
//         ),
//     },
//   ];

//   // ─── Top Providers Table Config ──────────────────────────────────────────

//   const providerColumns = [
//     {
//       key: "rank",
//       label: "#",
//       className: "w-10",
//       render: (_, row) => (
//         <span className="text-gray-400 font-medium">{row.rank || "-"}</span>
//       ),
//     },
//     {
//       key: "name",
//       label: "Provider",
//       render: (val, row) => (
//         <div className="flex items-center gap-2.5">
//           <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-medium text-xs flex items-center justify-center">
//             {val
//               ?.split(" ")
//               .map((w) => w[0])
//               .join("")
//               .slice(0, 2)
//               .toUpperCase() || "?"}
//           </div>
//           <div>
//             <p className="font-medium text-gray-900">{typeof val === "object" ? val?.en : val}</p>
//             {row.specialty && (
//               <p className="text-xs text-gray-400">{row.specialty}</p>
//             )}
//           </div>
//         </div>
//       ),
//     },
//     {
//       key: "completed_bookings",
//       label: "Completed",
//       className: "text-right",
//       render: (val) => (
//         <span className="font-medium text-gray-900">{formatNumber(val)}</span>
//       ),
//     },
//     {
//       key: "revenue",
//       label: "Revenue",
//       className: "text-right",
//       render: (val) => (
//         <span className="font-medium text-gray-900">{formatCurrency(val)}</span>
//       ),
//     },
//     {
//       key: "avg_rating",
//       label: "Rating",
//       className: "text-right",
//       render: (val) =>
//         val ? (
//           <div className="flex items-center justify-end gap-1">
//             <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
//             <span className="font-medium text-gray-900">
//               {val?.toFixed(1)}
//             </span>
//           </div>
//         ) : (
//           <span className="text-gray-300">—</span>
//         ),
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gray-50/80">
//       <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         {/* ── Header ─────────────────────────────────────────────────────── */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
//           <div>
//             <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
//             <p className="text-sm text-gray-500 mt-0.5">
//               Track performance across your bookings and services
//             </p>
//           </div>

//           <div className="flex items-center gap-2">
//             <div className="relative">
//               <select
//                 value={dateRange}
//                 onChange={(e) => setDateRange(e.target.value)}
//                 className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
//               >
//                 {DATE_RANGES.map((r) => (
//                   <option key={r.value} value={r.value}>
//                     {r.label}
//                   </option>
//                 ))}
//               </select>
//               <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
//             </div>

//             <button
//               onClick={() => loadAnalytics(false)}
//               disabled={refreshing}
//               className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-50"
//               title="Refresh data"
//             >
//               <RefreshCw
//                 className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
//               />
//             </button>

//             <button
//               className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
//               title="Export data"
//             >
//               <Download className="w-4 h-4" />
//             </button>
//           </div>
//         </div>

//         {/* ── KPI Cards ──────────────────────────────────────────────────── */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//           <KPICard
//             title="Total Bookings"
//             value={formatNumber(kpis?.total_bookings)}
//             change={kpis?.bookings_change}
//             changeLabel="vs prev period"
//             icon={CalendarDays}
//             loading={loading}
//           />
//           <KPICard
//             title="Revenue"
//             value={formatCurrency(kpis?.total_revenue || 0)}
//             change={kpis?.revenue_change}
//             changeLabel="vs prev period"
//             icon={DollarSign}
//             loading={loading}
//           />
//           <KPICard
//             title="Conversion Rate"
//             value={`${kpis?.conversion_rate?.toFixed(1) || "0"}%`}
//             change={kpis?.conversion_change}
//             changeLabel="vs prev period"
//             icon={TrendingUp}
//             loading={loading}
//           />
//           <KPICard
//             title="Avg. Rating"
//             value={kpis?.avg_rating?.toFixed(2) || "—"}
//             change={kpis?.rating_change}
//             changeLabel="vs prev period"
//             icon={Star}
//             loading={loading}
//           />
//         </div>

//         {/* ── Row 1: Bookings Over Time + Revenue Trends ─────────────────── */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
//           <ChartCard
//             title="Bookings Over Time"
//             subtitle="Daily booking volume"
//             loading={loading}
//           >
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={bookingsOverTime}>
//                   <defs>
//                     <linearGradient id="bookingsGrad" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
//                       <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                   <XAxis
//                     dataKey="date"
//                     tick={{ fontSize: 11, fill: "#94a3b8" }}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <YAxis
//                     tick={{ fontSize: 11, fill: "#94a3b8" }}
//                     axisLine={false}
//                     tickLine={false}
//                     allowDecimals={false}
//                   />
//                   <Tooltip
//                     content={(props) => (
//                       <CustomTooltip {...props} formatter={(v) => `${v} bookings`} />
//                     )}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="count"
//                     name="Bookings"
//                     stroke="#6366f1"
//                     strokeWidth={2}
//                     fill="url(#bookingsGrad)"
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </ChartCard>

//           <ChartCard
//             title="Revenue Trends"
//             subtitle="Revenue and fees over time"
//             loading={loading}
//           >
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={revenueTrends}>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                   <XAxis
//                     dataKey="date"
//                     tick={{ fontSize: 11, fill: "#94a3b8" }}
//                     axisLine={false}
//                     tickLine={false}
//                   />
//                   <YAxis
//                     tick={{ fontSize: 11, fill: "#94a3b8" }}
//                     axisLine={false}
//                     tickLine={false}
//                     tickFormatter={(v) => formatCurrency(v)}
//                   />
//                   <Tooltip
//                     content={(props) => (
//                       <CustomTooltip {...props} formatter={(v) => formatCurrency(v)} />
//                     )}
//                   />
//                   <Legend
//                     wrapperStyle={{ fontSize: 12 }}
//                     iconType="circle"
//                     iconSize={8}
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="revenue"
//                     name="Revenue"
//                     stroke="#6366f1"
//                     strokeWidth={2}
//                     dot={false}
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="platform_fees"
//                     name="Platform Fees"
//                     stroke="#22c55e"
//                     strokeWidth={2}
//                     dot={false}
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="net_revenue"
//                     name="Net Revenue"
//                     stroke="#f59e0b"
//                     strokeWidth={2}
//                     dot={false}
//                     strokeDasharray="6 3"
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </ChartCard>
//         </div>

//         {/* ── Row 2: Revenue by Category + Peak Hours ────────────────────── */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
//           <ChartCard
//             title="Revenue by Category"
//             subtitle="Service category breakdown"
//             loading={loading}
//           >
//             <div className="h-64 min-h-[250px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={revenueByCategory} layout="vertical" barSize={20}>
//                   <CartesianGrid
//                     strokeDasharray="3 3"
//                     horizontal={false}
//                     stroke="#f1f5f9"
//                   />
//                   <XAxis
//                     type="number"
//                     tick={{ fontSize: 11, fill: "#94a3b8" }}
//                     axisLine={false}
//                     tickLine={false}
//                     tickFormatter={(v) => formatCurrency(v)}
//                   />
//                   <YAxis
//                     dataKey="category"
//                     type="category"
//                     tick={{ fontSize: 11, fill: "#64748b" }}
//                     axisLine={false}
//                     tickLine={false}
//                     width={120}
//                   />
//                   <Tooltip
//                     content={(props) => (
//                       <CustomTooltip {...props} formatter={(v) => formatCurrency(v)} />
//                     )}
//                   />
//                   <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
//                     {revenueByCategory.map((_, i) => (
//                       <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
//                     ))}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </ChartCard>

//           <PeakHoursChart data={peakHours} loading={loading} />
//         </div>

//         {/* ── Row 3: Booking Status + Top Services ───────────────────────── */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
//           <BookingStatusChart data={bookingStatus} loading={loading} />

//           <ChartCard title="Top Services" subtitle="By booking volume" loading={loading}>
//             <DataTable
//               columns={serviceColumns}
//               data={topServices}
//               loading={loading}
//               emptyMessage="No service data yet"
//             />
//           </ChartCard>
//         </div>

//         {/* ── Row 4: Top Providers ───────────────────────────────────────── */}
//         <ChartCard
//           title="Top Providers"
//           subtitle="By completed bookings and revenue"
//           loading={loading}
//           className="mb-4"
//         >
//           <DataTable
//             columns={providerColumns}
//             data={topProviders}
//             loading={loading}
//             emptyMessage="No provider data yet"
//           />
//         </ChartCard>
//       </div>
//     </div>
//   );
// }



"use client";

import Cookies from "js-cookie";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Calendar,
  DollarSign,
  Star,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  Loader2,
  Target,
  CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
// ─── API Layer ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function fetchWithAuth(endpoint, activeTenant, options = {}) {
  const token = Cookies.get("access_token");
  if (!activeTenant) throw new Error("Tenant not ready");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      "X-Tenant": activeTenant,
      ...options.headers,
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.detail || data?.message || `Request failed: ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

const analyticsAPI = {
  getKPIs: (params, t) =>
    apiFetch(`/api/v1/analytics/kpis/?${new URLSearchParams(params)}`, t),
  getBookingsOverTime: (params, t) =>
    apiFetch(
      `/api/v1/analytics/bookings-over-time/?${new URLSearchParams(params)}`,
      t
    ),
  getRevenueByCategory: (params, t) =>
    apiFetch(
      `/api/v1/analytics/revenue-by-category/?${new URLSearchParams(params)}`,
      t
    ),
  getRevenueTrends: (params, t) =>
    apiFetch(
      `/api/v1/analytics/revenue-trends/?${new URLSearchParams(params)}`,
      t
    ),
  getPeakHours: (params, t) =>
    apiFetch(
      `/api/v1/analytics/peak-hours/?${new URLSearchParams(params)}`,
      t
    ),
  getTopServices: (params, t) =>
    apiFetch(
      `/api/v1/analytics/top-services/?${new URLSearchParams(params)}`,
      t
    ),
  getTopProviders: (params, t) =>
    apiFetch(
      `/api/v1/analytics/top-providers/?${new URLSearchParams(params)}`,
      t
    ),
  getBookingStatusOverview: (params, t) =>
    apiFetch(
      `/api/v1/analytics/booking-status/?${new URLSearchParams(params)}`,
      t
    ),
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: "This Week", value: "7d" },
  { label: "This Month", value: "30d" },
  { label: "This Quarter", value: "90d" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
];

// Maroon combination palette
const CHART_COLORS = [
  "#8B1E3F",
  "#A8345C",
  "#10B981",
  "#F59E0B",
  "#3B82F6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

const STATUS_COLORS = {
  completed: "#10B981",
  confirmed: "#8B1E3F",
  upcoming: "#8B1E3F",
  in_progress: "#3B82F6",
  scheduled: "#06b6d4",
  pending_payment: "#F59E0B",
  deposit_paid: "#a855f7",
  paid: "#8b5cf6",
  cancelled: "#EF4444",
  refunded: "#f97316",
  no_show: "#64748b",
};

// ─── Utility Helpers ─────────────────────────────────────────────────────────

/**
 * FIX: Safely extract display text from a value that may be a multilingual
 * object like { en: "Haircut", ar: "قص شعر" } — prevents "Objects are not
 * valid as a React child" error.
 */
function toText(val, fallback = "—") {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return val.en || val.ar || val.ur || Object.values(val)[0] || fallback;
  }
  return fallback;
}

function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "SAR 0";
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num) {
  if (num == null) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatPercent(value) {
  if (value == null) return "+0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function getDateRangeParams(rangeValue) {
  const now = new Date();
  const fmt = (d) => d.toISOString().split("T")[0];
  const daysAgo = (n) => new Date(now - n * 86400000);

  switch (rangeValue) {
    case "7d":
      return { start_date: fmt(daysAgo(7)), end_date: fmt(now) };
    case "30d":
      return { start_date: fmt(daysAgo(30)), end_date: fmt(now) };
    case "90d":
      return { start_date: fmt(daysAgo(90)), end_date: fmt(now) };
    case "last_month":
      return {
        start_date: fmt(
          new Date(now.getFullYear(), now.getMonth() - 1, 1)
        ),
        end_date: fmt(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "this_year":
      return {
        start_date: fmt(new Date(now.getFullYear(), 0, 1)),
        end_date: fmt(now),
      };
    default:
      return { start_date: fmt(daysAgo(30)), end_date: fmt(now) };
  }
}

// ─── Reusable: Maroon Tooltip ────────────────────────────────────────────────

function MaroonTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white text-gray-900 text-xs rounded-lg px-3 py-2 shadow-xl border border-[#8B1E3F]">
      <p className="text-gray-500 mb-1 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant } = useApp();
  const router = useRouter();
  const [dateRange, setDateRange] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useBlockBackNavigation(!!user);

  useEffect(() => {
    if (!loadingUser && !user) router.replace("/");
  }, [loadingUser, user, router]);

  useEffect(() => {
    if (requiresOnboarding) router.replace("/auth/onboarding?step=1");
  }, [requiresOnboarding, router]);

  // ── Data states ──────────────────────────────────────────────────────────
  const [kpis, setKPIs] = useState(null);
  const [bookingsOverTime, setBookingsOverTime] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [bookingStatus, setBookingStatus] = useState(null);

  const loadAnalytics = useCallback(
    async (showFullLoader = true) => {
      if (!activeTenant) return;
      const params = getDateRangeParams(dateRange);
      if (showFullLoader) setLoading(true);
      else setRefreshing(true);

      try {
        const [
          kpiRes,
          bookingsRes,
          catRes,
          trendsRes,
          peakRes,
          svcRes,
          provRes,
          statusRes,
        ] = await Promise.allSettled([
          analyticsAPI.getKPIs(params, activeTenant),
          analyticsAPI.getBookingsOverTime(params, activeTenant),
          analyticsAPI.getRevenueByCategory(params, activeTenant),
          analyticsAPI.getRevenueTrends(params, activeTenant),
          analyticsAPI.getPeakHours(params, activeTenant),
          analyticsAPI.getTopServices(params, activeTenant),
          analyticsAPI.getTopProviders(params, activeTenant),
          analyticsAPI.getBookingStatusOverview(params, activeTenant),
        ]);

        const val = (r) =>
          r.status === "fulfilled" ? r.value : null;
        const list = (r) =>
          r.status === "fulfilled"
            ? r.value?.results || r.value || []
            : [];

        if (val(kpiRes)) setKPIs(val(kpiRes));
        setBookingsOverTime(list(bookingsRes));
        setRevenueByCategory(list(catRes));
        setRevenueTrends(list(trendsRes));
        setPeakHours(list(peakRes));
        setTopServices(list(svcRes));
        setTopProviders(list(provRes));
        if (val(statusRes)) setBookingStatus(val(statusRes));
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange, activeTenant]
  );

  useEffect(() => {
    loadAnalytics(true);
  }, [loadAnalytics]);

  // ── Derived data ─────────────────────────────────────────────────────────

  // Revenue by category — safely unwrap multilingual category names
  const categoryData = useMemo(
    () =>
      revenueByCategory.map((d) => ({
        ...d,
        name: toText(d.category, "Other"),
      })),
    [revenueByCategory]
  );

  // Peak hours — format hour number to readable label
  const peakHoursData = useMemo(
    () =>
      peakHours.map((d) => ({
        ...d,
        label:
          d.hour != null
            ? `${d.hour > 12 ? d.hour - 12 : d.hour || 12} ${d.hour >= 12 ? "PM" : "AM"}`
            : "?",
      })),
    [peakHours]
  );

  // Booking status cards
  const statusCards = useMemo(() => {
    if (!bookingStatus) return [];
    return Object.entries(bookingStatus)
      .filter(([, count]) => typeof count === "number" && count > 0)
      .map(([key, value]) => ({
        key,
        label: key
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
        color: STATUS_COLORS[key] || "#64748b",
      }))
      .sort((a, b) => b.value - a.value);
  }, [bookingStatus]);

  const statusTotal = useMemo(
    () => statusCards.reduce((s, d) => s + d.value, 0),
    [statusCards]
  );

  // ── Guards ───────────────────────────────────────────────────────────────

  if (requiresOnboarding || loadingUser) return null;

  // ── Skeleton helpers ─────────────────────────────────────────────────────

  const SkeletonKPI = () => (
    <div className="animate-pulse p-6 rounded-xl bg-white border border-[#8B1E3F]/10">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div className="w-16 h-6 rounded-full bg-gray-200" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-24 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-20" />
    </div>
  );

  const SkeletonChart = () => (
    <div className="animate-pulse bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
      <div className="h-5 bg-gray-200 rounded w-40 mb-6" />
      <div className="flex items-center justify-center" style={{ height: 320 }}>
        <Loader2 className="w-6 h-6 text-[#8B1E3F]/30 animate-spin" />
      </div>
    </div>
  );

  const SkeletonList = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-[72px] bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  // ── KPI card config ──────────────────────────────────────────────────────

  const kpiCards = [
    {
      title: "Total Bookings",
      value: formatNumber(kpis?.total_bookings),
      change: kpis?.bookings_change,
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Revenue",
      value: formatCurrency(kpis?.total_revenue || 0),
      change: kpis?.revenue_change,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Conversion Rate",
      value: `${kpis?.conversion_rate?.toFixed(1) || "0"}%`,
      change: kpis?.conversion_change,
      icon: Target,
      color: "from-[#8B1E3F] to-[#6B1630]",
    },
    {
      title: "Avg. Rating",
      value: kpis?.avg_rating?.toFixed(2) || "—",
      change: kpis?.rating_change,
      icon: Star,
      color: "from-amber-500 to-amber-600",
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 bg-[#FAF5F7] min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics & Insights
          </h1>
          <p className="text-gray-600 mt-1">
            Track your business performance and metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none bg-white cursor-pointer hover:border-[#8B1E3F]/50 transition-colors shadow-sm"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadAnalytics(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-white hover:border-[#8B1E3F]/30 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-white hover:border-[#8B1E3F]/30 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonKPI key={i} />)
          : kpiCards.map((kpi, index) => {
              const Icon = kpi.icon;
              const isPositive = kpi.change >= 0;
              const hasChange =
                kpi.change !== undefined && kpi.change !== null;

              return (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    {hasChange && (
                      <div
                        className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${
                          isPositive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUp className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" />
                        )}
                        {formatPercent(kpi.change)}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {kpi.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {kpi.title}
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Charts Row 1: Bookings Over Time + Revenue by Category ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings Over Time */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Bookings Over Time
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-[#8B1E3F]" />
                <span className="text-gray-600">Bookings</span>
              </div>
            </div>
            {/* FIX: explicit style height on wrapper — prevents ResponsiveContainer -1 error */}
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bookingsOverTime}>
                  <defs>
                    <linearGradient
                      id="colorBookings"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8B1E3F"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="#8B1E3F"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={(props) => (
                      <MaroonTooltip
                        {...props}
                        formatter={(v) => `${v} bookings`}
                      />
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Bookings"
                    stroke="#8B1E3F"
                    fill="url(#colorBookings)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Revenue by Category – Donut */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Revenue by Category
              </h2>
            </div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="name"
                  >
                    {categoryData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #8B1E3F",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => [
                      formatCurrency(value),
                      "Revenue",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {categoryData.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {categoryData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#8B1E3F]/5 transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {categoryData.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400">
                No category data yet
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Charts Row 2: Revenue Trends + Peak Hours ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Revenue Trends
              </h2>
            </div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueTrends}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <Tooltip
                    content={(props) => (
                      <MaroonTooltip
                        {...props}
                        formatter={(v) => formatCurrency(v)}
                      />
                    )}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#8B1E3F"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Peak Hours */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Peak Hours
              </h2>
              <span className="text-sm text-gray-600">
                Average bookings per hour
              </span>
            </div>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#9CA3AF"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: "12px" }} />
                  <Tooltip
                    content={(props) => (
                      <MaroonTooltip
                        {...props}
                        formatter={(v) => `${v} bookings`}
                      />
                    )}
                  />
                  <Bar
                    dataKey="count"
                    name="Bookings"
                    fill="#A8345C"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Top Performers ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Top Services
            </h2>
            <button onClick={() => router.push('/dashboard/services')} className="px-4 py-2 text-sm font-medium text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors">
              View All
            </button>
        
          </div>

          {loading ? (
            <SkeletonList />
          ) : !topServices?.length ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No service data yet
            </div>
          ) : (
            <div className="space-y-3">
              {topServices.map((service, index) => (
                <div
                  key={service.id || index}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                      <span className="text-white font-bold">
                        {service.rank || index + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      {/* FIX: toText() prevents rendering {en: "..."} objects */}
                      <div className="font-semibold text-gray-900 group-hover:text-[#8B1E3F] transition-colors truncate">
                        {toText(service.name, "Service")}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        {formatNumber(service.bookings_count)} bookings
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-bold text-gray-900">
                      {formatCurrency(service.revenue)}
                    </div>
                    {service.avg_rating ? (
                      <div className="flex items-center justify-end gap-1 text-sm text-green-600">
                        <Star className="w-3 h-3 fill-current" />
                        {service.avg_rating.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Providers */}
        <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Top Providers
            </h2>
            <button onClick={() => router.push('/dashboard/providers')} className="px-4 py-2 text-sm font-medium text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors">
              View All
            </button>
          </div>

          {loading ? (
            <SkeletonList />
          ) : !topProviders?.length ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No provider data yet
            </div>
          ) : (
            <div className="space-y-3">
              {topProviders.map((provider, index) => {
                const name = toText(provider.name, "Provider");
                const initials = name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={provider.id || index}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
                        {initials || "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 group-hover:text-[#8B1E3F] transition-colors truncate">
                          {name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {toText(provider.specialty, "")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(provider.revenue)}
                      </div>
                      {provider.avg_rating ? (
                        <div className="flex items-center justify-end gap-1 text-sm text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          {provider.avg_rating.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Booking Status Overview ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#8B1E3F]/10 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            Booking Status Overview
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : statusCards.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-400">
            No booking status data yet
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusCards.slice(0, 8).map((status) => (
              <div
                key={status.key}
                className="p-6 rounded-xl border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all bg-white group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${status.color}20` }}
                >
                  <CheckCircle
                    className="w-6 h-6"
                    style={{ color: status.color }}
                  />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatNumber(status.value)}
                </div>
                <div className="text-sm text-gray-600">{status.label}</div>
                {statusTotal > 0 && (
                  <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(status.value / statusTotal) * 100}%`,
                        backgroundColor: status.color,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}