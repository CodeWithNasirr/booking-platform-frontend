// src/lib/datetime.js
//
// Tenant-timezone-aware date/time formatting. The DB stores canonical UTC; we
// only convert to the tenant's timezone for DISPLAY. Always pass the tenant's
// timezone (from useTenantLocale) for tenant business times, so a tenant in
// Asia/Riyadh and one in Asia/Kolkata see their own local times regardless of
// the viewer's device timezone.

function _toDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Core: format a UTC/ISO value in an explicit IANA timezone. */
export function formatInTimeZone(value, timeZone, options = {}, locale = undefined) {
  const d = _toDate(value);
  if (!d) return "";
  const opts = { ...options };
  if (timeZone) opts.timeZone = timeZone;
  try {
    return new Intl.DateTimeFormat(locale, opts).format(d);
  } catch {
    // Invalid timezone/locale → fall back without the timezone rather than throw.
    delete opts.timeZone;
    try {
      return new Intl.DateTimeFormat(locale, opts).format(d);
    } catch {
      return d.toISOString();
    }
  }
}

export function formatTenantDate(value, timeZone, locale) {
  return formatInTimeZone(value, timeZone,
    { year: "numeric", month: "short", day: "numeric" }, locale);
}

export function formatTenantDateTime(value, timeZone, locale) {
  return formatInTimeZone(value, timeZone,
    { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }, locale);
}

export function formatTenantTime(value, timeZone, locale) {
  return formatInTimeZone(value, timeZone,
    { hour: "2-digit", minute: "2-digit" }, locale);
}
