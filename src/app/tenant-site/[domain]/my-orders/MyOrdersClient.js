// src/app/tenant-site/[domain]/my-orders/MyOrdersClient.js
"use client";

import { useRouter } from "next/navigation";
import LayoutRenderer from "../LayoutRenderer";
import CustomerOrdersDashboard from "@/app/tenant-site/modules/CustomerOrdersDashboard";
import { tenantRoutes } from "@/lib/tenantRoutes";

export default function MyOrdersClient({ domain, site, header, footer }) {
  const router = useRouter();

  // Auth (guest OTP / JWT) and order fetching are owned by
  // CustomerOrdersDashboard. This shell wires the tenant site chrome and
  // navigation only.
  const tenantId = site?.tenant?.id || site?.id;

  const handleSelectOrder = (orderId) => {
    router.push(tenantRoutes.myOrder(orderId));
  };

  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <>
      {headerSection.length > 0 && <LayoutRenderer sections={headerSection} site={site} />}

      <main className="min-h-screen bg-muted">
        <CustomerOrdersDashboard
          domain={domain}
          tenantId={tenantId}
          site={site}
          onSelectOrder={handleSelectOrder}
        />
      </main>

      {footerSection.length > 0 && <LayoutRenderer sections={footerSection} site={site} />}
    </>
  );
}
