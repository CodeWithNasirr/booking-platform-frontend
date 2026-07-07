"use client";

import dynamic from "next/dynamic";
import LayoutRenderer from "../LayoutRenderer";

const CustomRequestModule = dynamic(
  () => import("../../modules/CustomRequestModule"),
  { ssr: false }
);

export default function RequestServiceClient({
  domain,
  site,
  header,
  footer,
  settings,
}) {
  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <>
      {headerSection.length > 0 && (
        <LayoutRenderer sections={headerSection} site={site} />
      )}

      <main className="min-h-screen bg-gray-50">
        <CustomRequestModule
          data={{}}
          settings={settings}
          tenantId={site?.id}
          domain={domain}
        />
      </main>

      {footerSection.length > 0 && (
        <LayoutRenderer sections={footerSection} site={site} />
      )}
    </>
  );
}