// src/app/tenant-site/[domain]/my-orders/page.js
/**
 * My Orders Page (Tenant Site — Customer-Facing)
 *
 * Step 6 Fix: Was importing MyOrderDetailClient (detail view)
 * instead of MyOrdersClient (list view). The page rendered
 * an order detail expecting an orderId that was never passed.
 *
 * Route: /{domain}/my-orders
 */
import MyOrdersClient from "./MyOrdersClient";

export default function MyOrdersPage({ params }) {
  const { domain } = params;

  return <MyOrdersClient domain={domain} />;
}