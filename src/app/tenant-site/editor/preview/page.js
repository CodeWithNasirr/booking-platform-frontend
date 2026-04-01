/**
 * Preview Route - app/tenant-site/editor/preview/page.js
 * 
 * This route is loaded inside an iframe by the website builder.
 * It renders the sections with full styling and handles communication
 * with the parent editor frame via postMessage.
 */

import PreviewClient from "./PreviewClient";
// import { TenantLangProvider } from "../../contexts/TenantLangContext";

// export default function PreviewPage() {
//   return (
//     <TenantLangProvider>
//       <PreviewClient />
//     </TenantLangProvider>
//   );
// }
import TenantClientWrapper from "../../[domain]/TenantClientWrapper";

export default function PreviewPage() {
  return (
    <TenantClientWrapper
      theme={{}}
      site={{}}
      tenantTimezone="UTC"
    >
      <PreviewClient />
    </TenantClientWrapper>
  );
}