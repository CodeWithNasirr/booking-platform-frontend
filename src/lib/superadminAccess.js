// src/lib/superadminAccess.js
//
// Single source of truth for Platform Admin (Super Admin) route access.
//
// Every gate that decides "can this employee see / reach module X" — the
// sidebar visibility, the in-layout route guard, and any per-page check —
// reads from THIS map, so they can never disagree (the class of bug where a
// menu item is hidden but the URL still loads the page).
//
// Each rule maps a route prefix to the permission(s) required to reach it.
//   - perms: []            -> any active platform employee may enter
//   - mode: "any" (default) -> holding ANY listed permission grants access
//   - mode: "all"           -> ALL listed permissions are required
//
// The owner / super-role bypass lives inside hasPermission() (context), so it
// does not need to be encoded here.

export const SUPERADMIN_ACCESS_RULES = [
  // Dashboard + landing — employee-only, no specific permission.
  { prefix: "/superadmin/dashboard", perms: [] },

  // Tenants
  { prefix: "/superadmin/tenants", perms: ["tenants.view"] },
  { prefix: "/superadmin/documents", perms: ["tenants.view"] },

  // Billing family (most specific first so /plans/new resolves before /billing)
  { prefix: "/superadmin/billing/plans", perms: ["plans.create", "plans.edit"], mode: "any" },
  { prefix: "/superadmin/billing/invoices", perms: ["billing.view"] },
  { prefix: "/superadmin/billing/subscriptions", perms: ["subscriptions.view", "billing.view"], mode: "any" },
  { prefix: "/superadmin/billing/analytics", perms: ["analytics.view", "billing.view"], mode: "any" },
  { prefix: "/superadmin/billing", perms: ["billing.view", "plans.view"], mode: "any" },

  // Enterprise + sales
  { prefix: "/superadmin/enterprise", perms: ["billing.view", "plans.view"], mode: "any" },
  { prefix: "/superadmin/sales-inquiries", perms: ["billing.view", "plans.view"], mode: "any" },

  // Content / announcements
  { prefix: "/superadmin/notifications", perms: ["system.manage_settings"] },
  { prefix: "/superadmin/announcements", perms: ["announcements.view"] },

  // Templates
  { prefix: "/superadmin/templates", perms: ["templates.view"] },

  // Integrations
  { prefix: "/superadmin/integrations", perms: ["system.manage_integrations"] },

  // Support
  { prefix: "/superadmin/support", perms: ["tickets.view"] },

  // Employees
  { prefix: "/superadmin/sub-admins", perms: ["employees.view"] },

  // System / observability
  { prefix: "/superadmin/logs", perms: ["system.view_logs"] },
  { prefix: "/superadmin/health", perms: ["system.view_health", "system.view_logs"], mode: "any" },

  // Finance operations
  { prefix: "/superadmin/refunds", perms: ["billing.refund", "billing.view"], mode: "any" },
  { prefix: "/superadmin/dunning", perms: ["billing.view"] },

  // Settings
  { prefix: "/superadmin/settings", perms: ["system.view_settings", "system.manage_settings"], mode: "any" },
];

/**
 * Find the most specific access rule for a pathname (longest matching prefix).
 * Returns null when no rule matches.
 */
export function matchAccessRule(pathname) {
  if (!pathname) return null;
  let best = null;
  for (const rule of SUPERADMIN_ACCESS_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      if (!best || rule.prefix.length > best.prefix.length) {
        best = rule;
      }
    }
  }
  return best;
}

/**
 * Evaluate a rule against a permission checker.
 *
 * @param {object|null} rule   result of matchAccessRule (null => unmapped)
 * @param {(code:string)=>boolean} hasPermission  owner-aware checker
 * @returns {boolean}
 *
 * Unmapped routes fall back to employee-only access: reaching /superadmin/*
 * already requires an active platform membership (the provider redirects
 * non-employees), and every sensitive module is mapped above. New sensitive
 * pages MUST add a rule here rather than relying on this fallback.
 */
export function canAccessRule(rule, hasPermission) {
  if (!rule) return true;
  const perms = rule.perms || [];
  if (perms.length === 0) return true;
  if (rule.mode === "all") return perms.every((p) => hasPermission(p));
  return perms.some((p) => hasPermission(p));
}

/**
 * Convenience: can this employee access the given path?
 */
export function canAccessPath(pathname, hasPermission) {
  return canAccessRule(matchAccessRule(pathname), hasPermission);
}
