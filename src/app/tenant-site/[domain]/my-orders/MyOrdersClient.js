// src/app/tenant-site/[domain]/my-orders/MyOrdersClient.js
"use client";

/**
 * MyOrdersClient — Customer Order List Page
 *
 * Wraps CustomerOrdersDashboard with OTP authentication.
 * Fetches the customer's orders from the backend and passes them down.
 *
 * Step 6 Fix:
 * - Imports CustomerOrdersDashboard from modules/ (correct path)
 * - NOT from services/[slug]/order/ (broken relative imports)
 * - Fetches from /api/v1/orders/my-orders/ (matches Step 2 backend)
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMyOrders } from "@/app/tenant-site/api/orderApi";
import CustomerOrdersDashboard from "@/app/tenant-site/modules/CustomerOrdersDashboard";

export default function MyOrdersClient({ domain }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // ─── Fetch Customer Orders ───
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("customer_token");
      if (!token) {
        // Redirect to login if no token
        router.push(`/${domain}/login?redirect=my-orders`);
        return;
      }

      const data = await getMyOrders(domain, token);
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);

      // Handle auth errors
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem("customer_token");
        router.push(`/${domain}/login?redirect=my-orders`);
        return;
      }

      setError("Failed to load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [domain, router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ─── Handle Order Selection (navigate to detail) ───
  const handleSelectOrder = (orderId) => {
    setSelectedOrderId(orderId);
    router.push(`/${domain}/my-orders/${orderId}`);
  };

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Render Dashboard ───
  return (
    <CustomerOrdersDashboard
      orders={orders}
      domain={domain}
      onSelectOrder={handleSelectOrder}
      onRefresh={fetchOrders}
    />
  );
}