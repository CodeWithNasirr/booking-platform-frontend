"use client";

/**
 * Tenant-site customer portal branding.
 *
 * The customer portal must feel like it belongs to the business, so we
 * bridge the tenant's primary colour into the Phase-1 semantic tokens
 * (--primary / --ring / --brand-primary) on a wrapper element. Every
 * design-system primitive (bg-primary, ring-primary …) then adopts the
 * tenant accent automatically — no second colour system.
 */

import { useMemo } from "react";

function hexToHslChannels(hex) {
  if (!hex || typeof hex !== "string") return null;
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue /= 6;
  }
  return `${Math.round(hue * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function readableFg(hex) {
  if (!hex || typeof hex !== "string") return "#FFFFFF";
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return "#FFFFFF";
  const [r, g, b] = m.slice(0, 3).map((c) => parseInt(c, 16) / 255);
  const lum = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return L > 0.5 ? "#0F172A" : "#FFFFFF";
}

/** Extract branding (primary colour, logo, business name) from `site`. */
export function getTenantBrand(site) {
  const tc = site?.theme_config || {};
  const th = site?.theme || {};
  const primary =
    tc.primary_color || th.primary_color || site?.primary_color || "#8B1E3F";
  const logo =
    site?.tenant?.logo || tc.logo_url || tc.logo || th.logo_url || "";
  const name =
    site?.tenant?.name || tc.business_name || th.business_name || site?.name || "";
  return { primary, primaryFg: readableFg(primary), logo, name };
}

/**
 * PortalBrandRoot — mounts the tenant accent as CSS variables so the
 * customer portal's primitives render in the business's colour.
 */
export default function PortalBrandRoot({ site, as: As = "div", className = "", children, ...rest }) {
  const brand = getTenantBrand(site);
  const style = useMemo(() => {
    const vars = {
      "--brand-primary": brand.primary,
      "--brand-primary-fg": brand.primaryFg,
    };
    const ch = hexToHslChannels(brand.primary);
    const fgCh = hexToHslChannels(brand.primaryFg);
    if (ch) { vars["--primary"] = ch; vars["--ring"] = ch; }
    if (fgCh) { vars["--primary-foreground"] = fgCh; }
    return vars;
  }, [brand.primary, brand.primaryFg]);

  return (
    <As style={style} className={className} {...rest}>
      {children}
    </As>
  );
}
