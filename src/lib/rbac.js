// lib/rbac.js - Role-Based Access Control Utilities

/**
 * User Roles in the System:
 * - super_admin: Platform admin (manages all tenants)
 * - owner: Tenant owner (business owner)
 * - provider: Service provider (staff member)
 * - customer: End customer (future)
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  PROVIDER: 'provider',
  CUSTOMER: 'customer',
};

/**
 * Route Access Matrix
 * Defines which roles can access which routes
 */
export const ROUTE_ACCESS = {
  // Superadmin routes (only platform admins)
  '/superadmin': [ROLES.SUPER_ADMIN],
  '/superadmin/dashboard': [ROLES.SUPER_ADMIN],
  '/superadmin/tenants': [ROLES.SUPER_ADMIN],
  '/superadmin/analytics': [ROLES.SUPER_ADMIN],
  '/superadmin/settings': [ROLES.SUPER_ADMIN],

  // Tenant owner routes (business owners)
  '/dashboard': [ROLES.OWNER],
  '/dashboard/services': [ROLES.OWNER],
  '/dashboard/providers': [ROLES.OWNER],
  '/dashboard/bookings': [ROLES.OWNER],
  '/dashboard/customers': [ROLES.OWNER],
  '/dashboard/finance': [ROLES.OWNER],
  '/dashboard/analytics': [ROLES.OWNER],
  '/dashboard/settings': [ROLES.OWNER],

  // Provider routes (staff members)
  '/provider': [ROLES.PROVIDER],
  '/provider/dashboard': [ROLES.PROVIDER],
  '/provider/bookings': [ROLES.PROVIDER],
  '/provider/calendar': [ROLES.PROVIDER],
  '/provider/customers': [ROLES.PROVIDER],
  '/provider/profile': [ROLES.PROVIDER],

  // Customer routes (future)
  '/customer': [ROLES.CUSTOMER],
  '/customer/bookings': [ROLES.CUSTOMER],
  '/customer/profile': [ROLES.CUSTOMER],
};

/**
 * Get user's primary role
 * @param {Object} user - User object from context
 * @param {Array} tenants - Array of tenant memberships
 * @returns {string} Primary role
 */
export function getUserRole(user, tenants) {
  // 1. Check if superadmin
  if (user?.is_superadmin || user?.role === 'super_admin') {
    return ROLES.SUPER_ADMIN;
  }

  // 2. Check tenant memberships
  if (tenants && tenants.length > 0) {
    // Return first tenant's role (can be extended for multi-role support)
    return tenants[0].role || ROLES.CUSTOMER;
  }

  // 3. Default to customer
  return ROLES.CUSTOMER;
}

/**
 * Check if user can access a route
 * @param {string} pathname - Current route path
 * @param {string} userRole - User's role
 * @returns {boolean} True if user can access route
 */
export function canAccessRoute(pathname, userRole) {
  // Find matching route pattern
  const routePattern = Object.keys(ROUTE_ACCESS).find(pattern => {
    if (pattern === pathname) return true;
    if (pathname.startsWith(pattern + '/')) return true;
    return false;
  });

  if (!routePattern) {
    // Route not in access matrix, allow by default
    return true;
  }

  const allowedRoles = ROUTE_ACCESS[routePattern];
  return allowedRoles.includes(userRole);
}

/**
 * Get redirect path based on user role
 * @param {string} userRole - User's role
 * @returns {string} Redirect path
 */
export function getRoleBasedRedirect(userRole) {
  switch (userRole) {
    case ROLES.SUPER_ADMIN:
      return '/superadmin/dashboard';
    case ROLES.OWNER:
      return '/dashboard';
    case ROLES.PROVIDER:
      return '/provider';
    case ROLES.CUSTOMER:
      return '/customer';
    default:
      return '/';
  }
}

/**
 * Get dashboard home based on user role and tenant type
 * @param {Object} user - User object
 * @param {Array} tenants - Tenant memberships
 * @param {string} activeTenantId - Active tenant ID
 * @returns {Object} Dashboard configuration
 */
export function getDashboardConfig(user, tenants, activeTenantId) {
  const userRole = getUserRole(user, tenants);

  // Superadmin
  if (userRole === ROLES.SUPER_ADMIN) {
    return {
      route: '/superadmin/dashboard',
      title: 'Platform Admin',
      description: 'Manage all tenants and platform settings',
    };
  }

  // Find active tenant
  const activeTenant = tenants?.find(t => t.id === activeTenantId) || tenants?.[0];
  if (!activeTenant) {
    return {
      route: '/auth/onboarding',
      title: 'Setup Required',
      description: 'Complete your account setup',
    };
  }

  // Provider
  if (activeTenant.role === ROLES.PROVIDER) {
    return {
      route: '/provider',
      title: 'Provider Dashboard',
      description: 'Manage your bookings and schedule',
      tenantName: activeTenant.name,
    };
  }

  // Owner (Individual or Business)
  if (activeTenant.role === ROLES.OWNER) {
    const hasProviders = activeTenant.has_providers || false;
    
    return {
      route: '/dashboard',
      title: hasProviders ? 'Business Dashboard' : 'Owner Dashboard',
      description: hasProviders 
        ? 'Manage your team and business operations'
        : 'Manage your services and bookings',
      tenantName: activeTenant.name,
      hasProviders,
    };
  }

  // Default
  return {
    route: '/dashboard',
    title: 'Dashboard',
    description: 'Welcome back',
  };
}

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 * @param {string} userRole - User's role
 * @returns {boolean} True if user has permission
 */
export function hasPermission(permission, userRole) {
  const PERMISSIONS = {
    // Superadmin permissions
    'manage_all_tenants': [ROLES.SUPER_ADMIN],
    'view_platform_analytics': [ROLES.SUPER_ADMIN],
    'manage_platform_settings': [ROLES.SUPER_ADMIN],

    // Owner permissions
    'manage_services': [ROLES.SUPER_ADMIN, ROLES.OWNER],
    'manage_providers': [ROLES.SUPER_ADMIN, ROLES.OWNER],
    'view_finance': [ROLES.SUPER_ADMIN, ROLES.OWNER],
    'manage_tenant_settings': [ROLES.SUPER_ADMIN, ROLES.OWNER],

    // Provider permissions
    'view_own_bookings': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.PROVIDER],
    'manage_own_schedule': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.PROVIDER],
    'view_customers': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.PROVIDER],

    // Customer permissions
    'book_services': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.PROVIDER, ROLES.CUSTOMER],
    'view_own_bookings_customer': [ROLES.CUSTOMER],
  };

  const allowedRoles = PERMISSIONS[permission] || [];
  return allowedRoles.includes(userRole);
}