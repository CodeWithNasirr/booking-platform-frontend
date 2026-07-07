"use client";

/**
 * useBrand — single hook every panel and primitive consumes to
 * get the active tenant's brand. The CRM, provider workspace,
 * and customer portal all live in different React trees with
 * different sources of truth:
 *
 *   - customer portal → TenantThemeContext (server-rendered site)
 *   - CRM / dashboard → AppContext.activeTenant
 *   - provider       → AppContext.activeTenant
 *
 * useBrand tries each in turn and returns a normalised shape:
 *
 *   {
 *     primary, primaryFg,    -- accent + readable foreground
 *     secondary,
 *     businessName, logo,
 *     ready                  -- false until the brand resolves;
 *                              lets pages render skeletons until
 *                              the accent is known
 *   }
 *
 * The hook ALSO mounts brand-scoped CSS variables on a single
 * root span so any primitive can opt-in via Tailwind arbitrary
 * values like text-[color:var(--brand-primary)] without prop
 * drilling.
 */

import { useEffect, useMemo } from "react";

const FALLBACK = {
  primary: "#3B82F6",
  primaryFg: "#FFFFFF",
  secondary: "#0F172A",
  businessName: "",
  logo: "",
  ready: false,
};

// Pick a readable text colour against the brand background using
// a simple WCAG luminance calculation. Keeps every button label
// legible regardless of the tenant's chosen accent.
function readableFg(hex) {
  if (!hex || typeof hex !== "string") return "#FFFFFF";
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return "#FFFFFF";
  const [r, g, b] = m.slice(0, 3).map((h) => parseInt(h, 16) / 255);
  const lum = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return L > 0.5 ? "#0F172A" : "#FFFFFF";
}

function brandFromTenant(tenant) {
  if (!tenant) return null;
  const primary = tenant.theme?.primary_color
    || tenant.primary_color
    || tenant.theme_config?.primary_color
    || null;
  if (!primary) return null;
  return {
    primary,
    primaryFg: readableFg(primary),
    secondary: tenant.theme?.secondary_color
      || tenant.secondary_color
      || tenant.theme_config?.secondary_color
      || "#0F172A",
    businessName: tenant.business_name || tenant.name || "",
    logo: tenant.logo || tenant.business_logo || "",
    ready: true,
  };
}

export function useBrand() {
  // Try tenant-site theme first (customer portal). The hook is
  // imported lazily so we don't break tree-shaking on dashboard
  // pages that don't have the provider.
  let siteTheme = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    const mod = require("@/app/tenant-site/contexts/TenantThemeContext");
    siteTheme = mod?.useTenantTheme?.() || null;
  } catch {}

  let dashboardTenant = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    const mod = require("@/contexts/AppContext");
    const ctx = mod?.useApp?.();
    if (ctx) {
      dashboardTenant = ctx.tenants?.find(
        (t) => String(t.id) === String(ctx.activeTenant?.id || ctx.activeTenant),
      ) || ctx.tenants?.[0] || null;
    }
  } catch {}

  const brand = useMemo(() => {
    if (siteTheme?.primary_color) {
      return {
        primary: siteTheme.primary_color,
        primaryFg: readableFg(siteTheme.primary_color),
        secondary: siteTheme.secondary_color || "#0F172A",
        businessName: siteTheme.business_name || "",
        logo: siteTheme.logo || "",
        ready: true,
      };
    }
    return brandFromTenant(dashboardTenant) || FALLBACK;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    siteTheme?.primary_color,
    siteTheme?.secondary_color,
    dashboardTenant?.id,
    dashboardTenant?.theme?.primary_color,
    dashboardTenant?.primary_color,
  ]);

  return brand;
}

/**
 * BrandRoot — mounts the brand as CSS variables so primitives
 * can style themselves via Tailwind arbitrary values.
 *
 *   <BrandRoot>
 *     <button className="bg-[color:var(--brand-primary)]
 *                       text-[color:var(--brand-primary-fg)]">
 *       …
 *     </button>
 *   </BrandRoot>
 *
 * Each panel (CRM / provider / customer portal) wraps its tree
 * in one BrandRoot so the variables are scoped to the
 * appropriate brand source.
 */
export function BrandRoot({ as: As = "div", className = "", children, ...rest }) {
  const brand = useBrand();
  const style = useMemo(() => ({
    "--brand-primary": brand.primary,
    "--brand-primary-fg": brand.primaryFg,
    "--brand-secondary": brand.secondary,
  }), [brand.primary, brand.primaryFg, brand.secondary]);
  return (
    <As style={style} className={className} {...rest}>
      {children}
    </As>
  );
}

// useBrandStyle — quick prop-style helper for places that can't
// rely on the var (e.g. inline SVG fill or third-party libs).
export function useBrandStyle() {
  const b = useBrand();
  return {
    primary: b.primary,
    primaryFg: b.primaryFg,
    secondary: b.secondary,
  };
}
