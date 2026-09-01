// Tenant storefront robots.txt (proxied from the backend, tenant-scoped).

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(_req, { params }) {
  const { domain } = await params;
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/public/robots.txt?slug=${encodeURIComponent(domain)}`,
      { headers: { "X-Tenant": domain }, cache: "no-store" },
    );
    const txt = res.ok ? await res.text() : "User-agent: *\nAllow: /\n";
    return new Response(txt, {
      status: 200,
      headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return new Response("User-agent: *\nAllow: /\n", {
      status: 200, headers: { "Content-Type": "text/plain" },
    });
  }
}
