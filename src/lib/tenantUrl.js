// utils/tenantUrl.ts
export function getTenantWebsiteUrl(tenant) {
  const primary = tenant[0]?.primary_domain;
  if (!primary) return null;

  // -----------------------------
  // 🌍 Custom domain (always direct)
  // -----------------------------
  if (primary.is_custom) {
    return `https://${primary.domain}`;
  }

  // -----------------------------
  // 🧪 Development (localhost)
  // -----------------------------
  if (process.env.NODE_ENV === "development") {
    return `http://${primary.domain}.lvh.me:3000`;
    // OR if you prefer lvh.me:
    // return `http://${primary.domain}.lvh.me:3000`;
  }

  // -----------------------------
  // 🚀 Production subdomain
  // -----------------------------
  return `${process.env.NEXT_PUBLIC_FRONTEND_PROTOCOL}://${primary.domain}.${process.env.NEXT_PUBLIC_FRONTEND_DOMAIN}`;
}
