// src/app/tenant-site/[domain]/my-orders/[id]/page.js
/**
 * Order Detail Page
 *
 * Route: /{domain}/my-orders/{id}
 */

import MyOrderDetailClient from "../MyOrderDetailClient";
export default function OrderDetailPage({ params }) {
  const { domain, id } =  params;

  return <MyOrderDetailClient domain={domain} orderId={id} />;
}