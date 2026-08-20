// src/app/tenant-site/modules/order-checkout/brandVars.js
//
// Bridge the tenant's primary colour into the Phase-1 semantic tokens so
// every primitive (bg-primary, ring-ring, text-primary …) in the checkout
// renders in the tenant's colour. Never hard-codes a brand colour: when the
// tenant hasn't set one we return undefined and the site's existing --primary
// is inherited.

function hexToHslChannels(hex) {
  if (!hex || typeof hex !== "string") return null;
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0, hue = 0;
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
  const m = (hex || "").replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return "#FFFFFF";
  const [r, g, b] = m.slice(0, 3).map((c) => parseInt(c, 16) / 255);
  const lum = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return L > 0.5 ? "#0F172A" : "#FFFFFF";
}

export function brandStyle(theme) {
  const hex = theme?.primary_color;
  if (!hex) return undefined;
  const ch = hexToHslChannels(hex);
  if (!ch) return undefined;
  const style = { "--primary": ch, "--ring": ch, "--brand-primary": hex };
  const fg = hexToHslChannels(readableFg(hex));
  if (fg) style["--primary-foreground"] = fg;
  return style;
}
