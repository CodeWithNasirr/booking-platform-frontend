// tenant-site/[domain]/utils/fetchSite.js

export async function fetchSite(domain) {
  const api = process.env.NEXT_PUBLIC_API_URL;

  const headers = {
    "X-Tenant": domain,
  };

  const [siteRes, layoutRes, pagesRes] = await Promise.all([
    fetch(`${api}/api/v1/website/site/`, { headers }),
    fetch(`${api}/api/v1/website/layout/`, { headers }),
    fetch(`${api}/api/v1/website/pages/`, { headers }),
  ]);

  return {
    site: await siteRes.json(),
    layout: await layoutRes.json(),
    pages: await pagesRes.json(),
  };
}
