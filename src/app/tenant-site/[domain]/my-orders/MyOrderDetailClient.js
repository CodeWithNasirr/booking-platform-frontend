// src/app/tenant-site/[domain]/my-orders/[id]/MyOrderDetailClient.js

/**
 * MyOrderDetailClient — Single Order Detail Page
 *
 * Fetches a single order by ID and displays full detail view
 * with messages, files, status history, and actions.
 *
 * Route: /{domain}/my-orders/{id}
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getOrderDetail,
  sendOrderMessage,
  completeOrder,
  cancelOrder,
  submitOrderReview,} from "@/lib/orderApi";

export default function MyOrderDetailClient({ domain, orderId }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // ─── Fetch Order Detail ───
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("customer_token");
      if (!token) {
        router.push(`/${domain}/login?redirect=my-orders/${orderId}`);
        return;
      }

      const data = await getOrderDetail(domain, orderId, token);
      setOrder(data);
    } catch (err) {
      console.error("Failed to fetch order:", err);

      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem("customer_token");
        router.push(`/${domain}/login?redirect=my-orders/${orderId}`);
        return;
      }

      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  }, [domain, orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ─── Send Message ───
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setSendingMessage(true);
      const token = localStorage.getItem("customer_token");
      await sendOrderMessage(domain, orderId, messageText, token);
      setMessageText("");
      // Refresh order to show new message
      await fetchOrder();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── Complete Order (accept delivery) ───
  const handleComplete = async () => {
    try {
      const token = localStorage.getItem("customer_token");
      await completeOrder(domain, orderId, token);
      await fetchOrder();
    } catch (err) {
      console.error("Failed to complete order:", err);
    }
  };

  // ─── Cancel Order ───
  const handleCancel = async (reason) => {
    try {
      const token = localStorage.getItem("customer_token");
      await cancelOrder(domain, orderId, reason, token);
      await fetchOrder();
    } catch (err) {
      console.error("Failed to cancel order:", err);
    }
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // ─── Error ───
  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Order not found"}</p>
          <button
            onClick={() => router.push(`/${domain}/my-orders`)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // ─── Status badge color ───
  const statusColors = {
    pending_payment: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    completed: "bg-green-200 text-green-900",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <button
        onClick={() => router.push(`/${domain}/my-orders`)}
        className="text-blue-600 hover:underline mb-6 block"
      >
        ← Back to Orders
      </button>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{order.service_name}</h1>
            <p className="text-gray-500">Order #{order.order_number}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || "bg-gray-100"}`}
          >
            {order.status?.replace(/_/g, " ")}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Amount:</span>{" "}
            <span className="font-medium">
              {order.currency} {order.total_amount}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Delivery:</span>{" "}
            <span className="font-medium">{order.delivery_days} days</span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>{" "}
            <span className="font-medium">
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>
          {order.provider_name && (
            <div>
              <span className="text-gray-500">Provider:</span>{" "}
              <span className="font-medium">{order.provider_name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          {order.status === "delivered" && (
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Accept Delivery
            </button>
          )}
          {["pending_payment", "paid", "in_progress"].includes(
            order.status
          ) && (
            <button
              onClick={() => handleCancel("Customer requested cancellation")}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Messages</h2>

        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {order.messages?.length > 0 ? (
            order.messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`p-3 rounded-lg ${
                  msg.is_system_message
                    ? "bg-gray-50 text-gray-600 text-sm italic"
                    : msg.sender?.id === order.customer?.id
                      ? "bg-blue-50 ml-8"
                      : "bg-gray-50 mr-8"
                }`}
              >
                {!msg.is_system_message && (
                  <p className="text-xs text-gray-500 mb-1">
                    {msg.sender?.first_name || "Provider"}
                  </p>
                )}
                <p>{msg.content}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No messages yet.</p>
          )}
        </div>

        {/* Message input — only for active orders */}
        {!["cancelled", "refunded", "completed"].includes(order.status) && (
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border rounded-lg px-3 py-2"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !messageText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingMessage ? "..." : "Send"}
            </button>
          </div>
        )}
      </div>

      {/* Files */}
      {order.files?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Files</h2>
          <div className="space-y-2">
            {order.files.map((file, idx) => (
              <div
                key={file.id || idx}
                className="flex justify-between items-center p-2 border rounded"
              >
                <div>
                  <p className="font-medium">{file.file_name}</p>
                  <p className="text-xs text-gray-500">{file.file_type}</p>
                </div>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// /**
//  * MyOrderDetailClient.js
//  * 
//  * Customer-facing order detail on tenant site.
//  * Reuses CustomerOrdersDashboard with orderId prop.
//  * OTP auth required — auto-validates saved token, else redirects to /my-orders.
//  * 
//  * Route: /my-orders/[orderId] (on tenant subdomain)
//  */

// import { useState, useEffect } from "react";
// import { useTenantLang } from "../../../contexts/TenantLangContext";
// import { useTenantTheme } from "../../../contexts/TenantThemeContext";
// import CustomerOrdersDashboard from "../../../modules/CustomerOrdersDashboard";

// const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// export default function MyOrderDetailClient({ domain, tenantId, orderId }) {
//   const { language } = useTenantLang();
//   const theme = useTenantTheme();

//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [unauthorized, setUnauthorized] = useState(false);

//   useEffect(() => {
//     const savedToken = localStorage.getItem("guest_order_token");
//     if (!savedToken) {
//       setUnauthorized(true);
//       setLoading(false);
//       return;
//     }

//     // Validate token
//     async function validate() {
//       try {
//         const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/`, {
//           headers: {
//             "X-Tenant": domain,
//             Authorization: `Bearer ${savedToken}`,
//           },
//         });

//         if (!res.ok) throw new Error("Unauthorized");
//         setToken(savedToken);
//       } catch {
//         localStorage.removeItem("guest_order_token");
//         setUnauthorized(true);
//       } finally {
//         setLoading(false);
//       }
//     }

//     validate();
//   }, [domain, orderId]);

//   if (loading) {
//     return (
//       <div className="max-w-3xl mx-auto p-6 space-y-6">
//         {[1, 2, 3].map((i) => (
//           <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
//         ))}
//       </div>
//     );
//   }

//   if (unauthorized) {
//     return (
//       <div className="max-w-lg mx-auto p-6 text-center">
//         <div className="text-5xl mb-4">🔒</div>
//         <h2 className="text-xl font-bold text-gray-900 mb-2">
//           Authentication Required
//         </h2>
//         <p className="text-gray-600 mb-6">
//           Please verify your email to view order details.
//         </p>
//         <a
//           href="/my-orders"
//           className="px-6 py-3 text-white rounded-xl font-semibold inline-block"
//           style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
//         >
//           Go to My Orders
//         </a>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <CustomerOrdersDashboard
//         domain={domain}
//         token={token}
//         orderId={orderId}
//       />
//     </div>
//   );
// }// src/app/tenant-site/[domain]/my-orders/[id]/MyOrderDetailClient.js
// "use client";

/**
 * MyOrderDetailClient — Single Order Detail Page
 *
 * Fetches a single order by ID and displays full detail view
 * with messages, files, status history, and actions.
 *
 * Route: /{domain}/my-orders/{id}
 */

