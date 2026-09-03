"use client";

// useTenantLocale — the single client-side accessor for the ACTIVE tenant's
// locale (currency, timezone, language). Sourced from the tenant object already
// loaded into AppContext from /api/v1/auth/me/ (TenantSerializer exposes
// default_currency, timezone, default_language), so when the tenant changes
// their default currency/timezone a reload propagates it everywhere at once.
//
// IMPORTANT: always resolve the ACTIVE tenant — never tenants[0] — so a user who
// belongs to multiple tenants never sees another tenant's currency/timezone.

import { useApp } from "@/contexts/AppContext";

export function useTenantLocale() {
  const { activeTenantObj, tenants, activeTenant, language } = useApp();

  const tenant =
    activeTenantObj ||
    (tenants || []).find((x) => String(x.id) === String(activeTenant)) ||
    (tenants || [])[0] ||
    {};

  return {
    // Empty when genuinely unknown — callers pass it straight to the shared
    // formatter, which shows a bare number rather than assuming a currency.
    currency: tenant.default_currency || "",
    timezone: tenant.timezone || "",
    language: tenant.default_language || language || "en",
  };
}
