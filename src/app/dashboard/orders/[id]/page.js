// src/app/dashboard/orders/[id]/page.js
import AdminOrderDetailClient from "./AdminOrderDetailClient";

export const metadata = { title: "Order Detail | Dashboard" };

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  return <AdminOrderDetailClient orderId={id} />;
}

// "use client";

// /**
//  * Dashboard Order Detail Page
//  * 
//  * Tenant admin view of a single order with admin actions.
//  * Route: /dashboard/orders/[id]
//  */

// import { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { useApp } from "@/contexts/AppContext";
// import {
//   ArrowLeft,
//   Package,
//   User,
//   DollarSign,
//   Calendar,
//   Clock,
//   FileText,
//   MessageSquare,
//   CheckCircle,
//   XCircle,
//   RefreshCw,
//   AlertTriangle,
//   Download,
// } from "lucide-react";

// const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// const STATUS_CONFIG = {
//   pending_payment: { label: "Pending Payment", color: "bg-gray-100 text-gray-700", icon: "⏳" },
//   paid: { label: "Paid", color: "bg-blue-100 text-blue-700", icon: "💳" },
//   accepted: { label: "Accepted", color: "bg-indigo-100 text-indigo-700", icon: "✅" },
//   in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700", icon: "🔨" },
//   delivered: { label: "Delivered", color: "bg-green-100 text-green-700", icon: "📦" },
//   completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: "✓" },
//   revision_requested: { label: "Revision Requested", color: "bg-orange-100 text-orange-700", icon: "🔄" },
//   cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: "❌" },
//   refunded: { label: "Refunded", color: "bg-red-100 text-red-700", icon: "💸" },
// };

// export default function DashboardOrderDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { tenants, activeTenant } = useApp();

//   const orderId = params.id;
//   const tenant = tenants?.find((t) => t.id === activeTenant) || tenants?.[0];
//   const domain = tenant?.primary_domain?.domain;

//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [actionLoading, setActionLoading] = useState(false);

//   function getToken() {
//     return (
//       localStorage.getItem("access_token") ||
//       document.cookie.match(/access_token=([^;]+)/)?.[1]
//     );
//   }

//   function authHeaders() {
//     return {
//       "Content-Type": "application/json",
//       "X-Tenant": domain,
//       Authorization: `Bearer ${getToken()}`,
//     };
//   }

//   async function loadOrder() {
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/`, {
//         headers: authHeaders(),
//       });
//       if (!res.ok) throw new Error("Failed to fetch order");
//       const data = await res.json();
//       setOrder(data);
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     if (domain && orderId) loadOrder();
//   }, [domain, orderId]);

//   async function adminAction(endpoint, method = "POST", body = null) {
//     setActionLoading(true);
//     setError(null);
//     try {
//       const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/${endpoint}/`, {
//         method,
//         headers: authHeaders(),
//         ...(body ? { body: JSON.stringify(body) } : {}),
//       });
//       if (!res.ok) {
//         const err = await res.json().catch(() => ({}));
//         throw new Error(err.detail || err.error || "Action failed");
//       }
//       await loadOrder();
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setActionLoading(false);
//     }
//   }

//   if (loading) {
//     return (
//       <div className="space-y-6">
//         <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
//         <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
//         <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
//       </div>
//     );
//   }

//   if (!order) {
//     return (
//       <div className="text-center py-16">
//         <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
//         <p className="text-gray-500">{error || "Order not found"}</p>
//         <button
//           onClick={() => router.push("/dashboard/orders")}
//           className="mt-4 text-blue-600 hover:underline text-sm"
//         >
//           ← Back to Orders
//         </button>
//       </div>
//     );
//   }

//   const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;

//   return (
//     <div className="space-y-6 max-w-4xl">
//       {/* Back button */}
//       <button
//         onClick={() => router.push("/dashboard/orders")}
//         className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
//       >
//         <ArrowLeft className="w-4 h-4" />
//         Back to Orders
//       </button>

//       {/* Header */}
//       <div className="flex items-start justify-between">
//         <div>
//           <div className="flex items-center gap-3">
//             <h1 className="text-2xl font-bold text-gray-900">
//               {order.order_number}
//             </h1>
//             <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusCfg.color}`}>
//               {statusCfg.icon} {statusCfg.label}
//             </span>
//           </div>
//           <p className="text-gray-500 mt-1">{order.service_name}</p>
//         </div>

//         <div className="text-right">
//           <p className="text-2xl font-bold text-gray-900">
//             ${Number(order.total_amount).toFixed(2)}
//           </p>
//           <p className="text-sm text-gray-500">
//             Fee: ${Number(order.platform_fee || 0).toFixed(2)}
//           </p>
//         </div>
//       </div>

//       {/* Error */}
//       {error && (
//         <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
//           <AlertTriangle className="w-4 h-4" />
//           {error}
//           <button onClick={() => setError(null)} className="ml-auto font-bold">×</button>
//         </div>
//       )}

//       {/* Info Grid */}
//       <div className="grid md:grid-cols-2 gap-6">
//         {/* Customer */}
//         <div className="bg-white rounded-xl border border-gray-200 p-5">
//           <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//             <User className="w-4 h-4" /> Customer
//           </h3>
//           <div className="space-y-2 text-sm">
//             <Row label="Name" value={order.customer_name || "—"} />
//             <Row label="Email" value={order.customer_email || "—"} />
//             <Row label="Phone" value={order.customer_phone || "—"} />
//           </div>
//         </div>

//         {/* Order Details */}
//         <div className="bg-white rounded-xl border border-gray-200 p-5">
//           <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//             <Package className="w-4 h-4" /> Order Details
//           </h3>
//           <div className="space-y-2 text-sm">
//             <Row label="Provider" value={order.provider_name || "Unassigned"} />
//             <Row label="Package" value={order.package_name || "—"} />
//             <Row label="Created" value={new Date(order.created_at).toLocaleString()} />
//             {order.due_date && (
//               <Row label="Due Date" value={new Date(order.due_date).toLocaleDateString()} />
//             )}
//             <Row
//               label="Revisions"
//               value={`${order.revisions_used || 0} / ${order.revisions_allowed || 0}`}
//             />
//           </div>
//         </div>

//         {/* Finance */}
//         <div className="bg-white rounded-xl border border-gray-200 p-5">
//           <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//             <DollarSign className="w-4 h-4" /> Finance
//           </h3>
//           <div className="space-y-2 text-sm">
//             <Row label="Subtotal" value={`$${Number(order.subtotal || order.total_amount).toFixed(2)}`} />
//             <Row label="Platform Fee" value={`$${Number(order.platform_fee || 0).toFixed(2)}`} />
//             <Row
//               label="Provider Earning"
//               value={`$${Number(order.provider_earning || 0).toFixed(2)}`}
//               valueClass="text-green-600 font-semibold"
//             />
//             {order.stripe_payment_intent_id && (
//               <Row label="Stripe PI" value={order.stripe_payment_intent_id} />
//             )}
//           </div>
//         </div>

//         {/* Requirements */}
//         {order.requirements && Object.keys(order.requirements).length > 0 && (
//           <div className="bg-white rounded-xl border border-gray-200 p-5">
//             <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//               <FileText className="w-4 h-4" /> Customer Requirements
//             </h3>
//             <div className="space-y-2 text-sm">
//               {Object.entries(order.requirements).map(([key, value]) => (
//                 <Row key={key} label={key.replace(/_/g, " ")} value={String(value)} />
//               ))}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Files */}
//       {order.files && order.files.length > 0 && (
//         <div className="bg-white rounded-xl border border-gray-200 p-5">
//           <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//             <FileText className="w-4 h-4" /> Files ({order.files.length})
//           </h3>
//           <div className="space-y-2">
//             {order.files.map((file) => (
//               <a
//                 key={file.id}
//                 href={file.file_url || file.file}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 <Download className="w-4 h-4 text-gray-400" />
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">
//                     {file.original_filename || file.file_name}
//                   </p>
//                   <p className="text-xs text-gray-500">
//                     {file.category} · {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : ""}
//                   </p>
//                 </div>
//               </a>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Messages */}
//       {order.messages && order.messages.length > 0 && (
//         <div className="bg-white rounded-xl border border-gray-200 p-5">
//           <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//             <MessageSquare className="w-4 h-4" /> Messages ({order.messages.length})
//           </h3>
//           <div className="space-y-3 max-h-64 overflow-y-auto">
//             {order.messages.map((msg) => (
//               <div
//                 key={msg.id}
//                 className={`p-3 rounded-lg text-sm ${
//                   msg.is_system
//                     ? "bg-blue-50 text-blue-800 italic"
//                     : msg.sender_type === "customer"
//                     ? "bg-gray-50"
//                     : "bg-indigo-50"
//                 }`}
//               >
//                 <p>{msg.content}</p>
//                 <p className="text-xs text-gray-400 mt-1">
//                   {msg.sender_name} · {new Date(msg.created_at).toLocaleString()}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Review */}
//       {order.review && (
//         <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-5">
//           <h3 className="font-semibold text-gray-900 mb-2">Customer Review</h3>
//           <div className="flex gap-1 mb-2">
//             {[1, 2, 3, 4, 5].map((s) => (
//               <span key={s} className={s <= order.review.rating ? "text-yellow-400" : "text-gray-300"}>
//                 ★
//               </span>
//             ))}
//           </div>
//           {order.review.comment && (
//             <p className="text-sm text-gray-600">{order.review.comment}</p>
//           )}
//         </div>
//       )}

//       {/* Status History */}
//       {order.status_history && order.status_history.length > 0 && (
//         <div className="bg-white rounded-xl border border-gray-200 p-5">
//           <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
//             <Clock className="w-4 h-4" /> Status History
//           </h3>
//           <div className="space-y-3">
//             {order.status_history.map((entry, idx) => (
//               <div key={idx} className="flex items-start gap-3 text-sm">
//                 <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
//                 <div>
//                   <p className="text-gray-900">
//                     <span className="font-medium">{entry.from_status || "—"}</span>
//                     {" → "}
//                     <span className="font-medium">{entry.to_status}</span>
//                   </p>
//                   {entry.note && <p className="text-gray-500">{entry.note}</p>}
//                   <p className="text-xs text-gray-400">
//                     {entry.changed_by_name || "System"} · {new Date(entry.changed_at).toLocaleString()}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Admin Actions */}
//       <div className="bg-white rounded-xl border border-gray-200 p-5">
//         <h3 className="font-semibold text-gray-900 mb-4">Admin Actions</h3>
//         <div className="flex flex-wrap gap-3">
//           {order.status === "paid" && (
//             <>
//               <ActionButton
//                 label="Accept Order"
//                 icon={CheckCircle}
//                 color="green"
//                 loading={actionLoading}
//                 onClick={() => adminAction("accept_order")}
//               />
//               <ActionButton
//                 label="Decline Order"
//                 icon={XCircle}
//                 color="gray"
//                 loading={actionLoading}
//                 onClick={() => {
//                   if (confirm("Decline this order? It will be unassigned.")) {
//                     adminAction("decline_order");
//                   }
//                 }}
//               />
//             </>
//           )}

//           {order.status === "accepted" && (
//             <ActionButton
//               label="Start Work"
//               icon={RefreshCw}
//               color="blue"
//               loading={actionLoading}
//               onClick={() => adminAction("start_work")}
//             />
//           )}

//           {["paid", "accepted", "in_progress"].includes(order.status) && (
//             <ActionButton
//               label="Cancel & Refund"
//               icon={XCircle}
//               color="red"
//               loading={actionLoading}
//               onClick={() => {
//                 if (confirm("Cancel this order and process a refund?")) {
//                   adminAction("cancel");
//                 }
//               }}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function Row({ label, value, valueClass = "" }) {
//   return (
//     <div className="flex justify-between">
//       <span className="text-gray-500 capitalize">{label}</span>
//       <span className={`font-medium text-gray-900 text-right ${valueClass}`}>{value}</span>
//     </div>
//   );
// }

// function ActionButton({ label, icon: Icon, color, loading, onClick }) {
//   const colors = {
//     green: "bg-green-600 hover:bg-green-700 text-white",
//     blue: "bg-blue-600 hover:bg-blue-700 text-white",
//     red: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200",
//     gray: "bg-gray-100 hover:bg-gray-200 text-gray-700",
//   };

//   return (
//     <button
//       onClick={onClick}
//       disabled={loading}
//       className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${colors[color]}`}
//     >
//       <Icon className="w-4 h-4" />
//       {loading ? "..." : label}
//     </button>
//   );
// }