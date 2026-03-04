import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

/* ---------------- REFRESH TOKEN ---------------- */

async function refreshAccessToken() {
  const refresh = Cookies.get("refresh_token");
  if (!refresh) return null;

  const res = await fetch(`${API_BASE}/api/v1//auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    window.location.href = "/auth/login";
    return null;
  }

  const data = await res.json();
  Cookies.set("access_token", data.access);

  return data.access;
}

/* ---------------- MAIN FETCH ---------------- */

export async function apiFetch(
  endpoint,
  activeTenant,
  options = {}
) {
  if (!activeTenant) throw new Error("Tenant not ready");

  let token = Cookies.get("access_token");

  const makeRequest = (accessToken) =>
    fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
        "X-Tenant": activeTenant,
        ...options.headers,
      },
    });

  let res = await makeRequest(token);

  // ✅ auto refresh on 401
  if (res.status === 401) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      res = await makeRequest(newToken);
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed: ${res.status}`;

    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
