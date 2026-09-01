// Tenant storefront sitemap. Crawlers hit https://<tenant>/sitemap.xml, which
// the proxy rewrites to /tenant-site/<slug>/sitemap.xml. We proxy the backend's
// tenant-scoped sitemap so it always reflects the tenant's live services/pages.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(_req, { params }) {
  const { domain } = await params;
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/public/sitemap.xml?slug=${encodeURIComponent(domain)}`,
      { headers: { "X-Tenant": domain }, cache: "no-store" },
    );
    const xml = res.ok
      ? await res.text()
      : '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      { status: 200, headers: { "Content-Type": "application/xml" } },
    );
  }
}
