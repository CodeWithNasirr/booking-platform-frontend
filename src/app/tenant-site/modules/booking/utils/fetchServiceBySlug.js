const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchServiceBySlug(slug, domain) {
  if (!slug) throw new Error("Missing service slug");

  const res = await fetch(`${API_BASE}/api/v1/public-services/`, {
    headers: {
      "Content-Type": "application/json",
      "X-Tenant": domain,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch services");

  const data = await res.json();
  const services = data.services || data.results || data || [];

  const normalize = v =>
    v?.toString().toLowerCase().trim().replace(/\s+/g, "-");

  const service = services.find(s =>
    s.slug
      ? normalize(s.slug) === normalize(slug)
      : normalize(s.title?.en || s.name) === normalize(slug)
  );

  if (!service) throw new Error("Service not found");
  return service;
}
