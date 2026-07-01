// // src/app/tenant-site/[domain]/my-orders/MyOrdersClient.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import LayoutRenderer from "../LayoutRenderer";
import CustomerOrdersDashboard from "@/app/tenant-site/modules/CustomerOrdersDashboard";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { BrandRoot, Button, EmptyState } from "@/components/ui";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function resolveToken() {
  const customerToken = localStorage.getItem("customer_token");
  if (customerToken) return { token: customerToken, type: "jwt" };

  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith("customer_order_token_")) {
      const guestToken = localStorage.getItem(key);
      if (guestToken) return { token: guestToken, type: "guest" };
    }
  }

  return { token: null, type: null };
}

function buildHeaders(domain, token, tokenType) {
  const headers = { "Content-Type": "application/json" };
  if (domain) headers["X-Tenant"] = domain;
  
  if (token) {
    if (tokenType === "guest") {
      headers["X-Order-Token"] = token;
    } else {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

export default function MyOrdersClient({
  domain,
  site,
  header,
  footer,
}) {
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasToken, setHasToken] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const auth = resolveToken();

      if (!auth.token) {
        setHasToken(false);
        setLoading(false);
        return;
      }

      setHasToken(true);

      const res = await fetch(`${API_BASE}/api/v1/orders/my-orders/`, {
        headers: buildHeaders(domain, auth.token, auth.type),
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("customer_token");
          setHasToken(false);
          setLoading(false);
          return;
        }
        throw new Error(`${res.status}`);
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch {
      setError("Failed to load your orders.");
    } finally {
      setLoading(false);
    }
  }, [domain]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSelectOrder = (orderId) => {
    router.push(tenantRoutes.myOrder(orderId));
  };

  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <BrandRoot>
      {headerSection.length > 0 && (
        <LayoutRenderer sections={headerSection} site={site} />
      )}

      <main className="min-h-screen bg-gray-50">
        {loading ? (
          <div className="max-w-4xl mx-auto px-4 py-8" role="status" aria-busy="true" aria-label="Loading orders">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-white border border-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="max-w-4xl mx-auto px-4 py-16">
            <EmptyState
              title="Couldn't load your orders"
              hint={error}
              action={<Button variant="primary" onClick={fetchOrders}>Try again</Button>}
            />
          </div>
        ) : !hasToken ? (
          <CustomerOrdersDashboard
            domain={domain}
            onSelectOrder={handleSelectOrder}
            onRefresh={fetchOrders}
          />
        ) : (
          <CustomerOrdersDashboard
            domain={domain}
            orders={orders}
            onSelectOrder={handleSelectOrder}
            onRefresh={fetchOrders}
          />
        )}
      </main>

      {footerSection.length > 0 && (
        <LayoutRenderer sections={footerSection} site={site} />
      )}
    </BrandRoot>
  );
}