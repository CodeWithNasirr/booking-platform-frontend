"use client";

import dynamic from "next/dynamic";
import LayoutRenderer from "../LayoutRenderer";

const CustomerRequestsDashboard = dynamic(
  () => import("../../modules/CustomerRequestsDashboard"),
  { ssr: false }
);

export default function MyRequestsClient({
  domain,
  site,
  header,
  footer,
}) {
  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];
  console.log(site,"SITE...")
  return (
    <>
      {headerSection.length > 0 && (
        <LayoutRenderer
          sections={headerSection}
          site={site}
        />
      )}

      <main className="min-h-screen bg-gray-50">
        <CustomerRequestsDashboard
          domain={domain}
          tenantId={site.tenant_id}
        />
      </main>

      {footerSection.length > 0 && (
        <LayoutRenderer
          sections={footerSection}
          site={site}
        />
      )}
    </>
  );
}