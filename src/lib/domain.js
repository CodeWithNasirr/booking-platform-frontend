// // config/domain.ts
// export const FRONTEND_DOMAIN =
//   process.env.NEXT_PUBLIC_FRONTEND_DOMAIN || "localhost:3000";

// export const FRONTEND_PROTOCOL =
//   process.env.NEXT_PUBLIC_FRONTEND_PROTOCOL || "http";


/**
 * Domain Detection Utility
 * 
 * Determines login type based on hostname
 * - admin.* → Superadmin login
 * - Everything else → Tenant login
 */

export function getDomainType() {
  // SSR safety check
  if (typeof window === 'undefined') {
    return 'tenant'; // Default to tenant during SSR
  }

  const hostname = window.location.hostname;

  // Development: admin.lvh.me:3000 or admin.localhost
  if (hostname.startsWith('admin.')) {
    return 'admin';
  }

  // Production: admin.yourplatform.com
  const mainDomain = process.env.NEXT_PUBLIC_FRONTEND_DOMAIN;
  if (mainDomain && hostname === `admin.${mainDomain}`) {
    return 'admin';
  }

  // Default to tenant login
  return 'tenant';
}

/**
 * Get login API endpoint based on domain type
 */
export function getLoginEndpoint(domainType) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://lvh.me:8000';
  
  return domainType === 'admin'
    ? `${baseUrl}/api/v1/platform/auth/login/`
    : `${baseUrl}/api/v1/auth/login/`;
}

/**
 * Get redirect path after successful login
 */
export function getPostLoginRedirect(domainType) {
  return domainType === 'admin' 
    ? '/superadmin/dashboard' 
    : '/dashboard';
}





// lib/domain.js
//  Future Extensions
// export function getDomainType() {
//   const hostname = window.location.hostname;
  
//   if (hostname.startsWith('admin.')) return 'admin';
//   if (hostname.startsWith('provider.')) return 'provider';  // New
//   if (hostname.startsWith('customer.')) return 'customer';  // New
  
//   return 'tenant';
// }

// // page.js
// const COMPONENTS = {
//   admin: AdminLogin,
//   provider: ProviderLogin,
//   customer: CustomerLogin,
//   tenant: TenantLogin,
// };

// return <>{COMPONENTS[domainType]}</>;