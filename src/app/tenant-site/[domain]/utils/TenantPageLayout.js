"use client";

import LayoutRenderer from "../LayoutRenderer";

export default function TenantPageLayout({ header, footer, site, children }) {
const headerSection = header ? [header] : [];
const footerSection = footer ? [footer] : [];

return (
<>
{headerSection.length > 0 && ( <LayoutRenderer sections={headerSection} site={site} />
)}

  <main className="min-h-screen bg-gray-50">{children}</main>

  {footerSection.length > 0 && (
    <LayoutRenderer sections={footerSection} site={site} />
  )}
</>

);
}
