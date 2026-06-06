export async function fetchIntegrations(domain) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tenant/${domain}/integrations/`,
      {
        cache: "no-store", // 🔥 always fresh
      }
    );

    if (!res.ok) return [];

    const data = await res.json();

    return data.integrations || data || [];
  } catch (e) {
    return [];
  }
}