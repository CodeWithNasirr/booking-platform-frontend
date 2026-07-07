import Cookies from "js-cookie";
import { handleApiError } from "@/lib/apiErrorHandler";
import { COOKIE_OPTIONS } from "@/lib/cookieConfig";

function getCurrentLanguage() {
  if (typeof document === "undefined") return "en";

  const cookies = document.cookie.split("; ");

  // Prefer the tenant site's language
  const tenantLang = cookies.find(c => c.startsWith("tenant_lang="));
  if (tenantLang) {
    return decodeURIComponent(tenantLang.split("=")[1]);
  }

  // Fallback
  const appLang = cookies.find(c => c.startsWith("app_language="));
  if (appLang) {
    return decodeURIComponent(appLang.split("=")[1]);
  }

  return "en";
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
let isRefreshing = false;
/* ---------------- REFRESH TOKEN ---------------- */

async function refreshAccessToken() {
  const refresh = Cookies.get("refresh_token");

  if (!refresh) return null;

  const res = await fetch(`${API_BASE}/api/v1/auth/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
    credentials: "include",
  });

  if (!res.ok) {
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");

    console.error(
      "REFRESH FAILED",
      res.status,
      window.location.pathname
    );
    // clear impersonation too
    if (typeof window !== "undefined") {
      localStorage.removeItem("impersonation_token");
      localStorage.removeItem("impersonation_tenant");
      Cookies.remove(
        "impersonation_token",
        COOKIE_OPTIONS
      );

      Cookies.remove(
        "impersonation_tenant",
        COOKIE_OPTIONS
      );
    }

    if (
      window.location.pathname !==
      "/auth/login"
    ) {
      window.location.href =
        "/auth/login";
    }

    return null;
  }

  const data = await res.json();

  Cookies.set(
    "access_token",
    data.access,
    COOKIE_OPTIONS
  );

  return data.access;
}

/* ---------------- MAIN FETCH ---------------- */

export async function apiFetch(
  endpoint,
  activeTenant = null,
  options = {}
) {
  let token = Cookies.get("access_token");

  // 🔥 GLOBAL IMPERSONATION TOKEN
  const impersonationToken =
    Cookies.get("impersonation_token");


  const makeRequest = (accessToken) => {
    const isFormData =
      options.body instanceof FormData;

    return fetch(`${API_BASE}${endpoint}`, {
      ...options,

      headers: {
        ...(!isFormData && {
          "Content-Type": "application/json",
        }),

        "X-Locale": getCurrentLanguage(),
        
        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),

        ...(activeTenant && {
          "X-Tenant": activeTenant,
        }),

        ...(impersonationToken && {
          "X-Impersonate": impersonationToken,
        }),

        ...options.headers,
      },

      credentials: "include",
    });
  };

  // const makeRequest = (accessToken) =>
  //   fetch(`${API_BASE}${endpoint}`, {
  //     ...options,

  //     headers: {
  //       "Content-Type": "application/json",

  //       ...(accessToken && {
  //         Authorization: `Bearer ${accessToken}`,
  //       }),

  //       ...(activeTenant && {
  //         "X-Tenant": activeTenant,
  //       }),

  //       // 🔥 ADD IMPERSONATION HEADER
  //       ...(impersonationToken && {
  //         "X-Impersonate": impersonationToken,
  //       }),

  //       ...options.headers,
  //     },

  //     credentials: "include",
  //   });

  let res = await makeRequest(token);

  /* ---------------- AUTO REFRESH ---------------- */
  if (
    res.status === 401 &&
    !impersonationToken &&
    !options._retry &&
    !isRefreshing
  ) {
    try {
      isRefreshing = true;
      console.error(
        "REFRESH FAILED",
        res.status,
        window.location.pathname
      );
      const newToken =
        await refreshAccessToken();

      if (newToken) {
        res = await makeRequest(
          newToken
        );
      }
    } finally {
      isRefreshing = false;
    }
  }

  /* ---------------- JSON RESPONSE ---------------- */

  const data = await res.json().catch(() => ({}));

  const normalize = (value) => {
    if (Array.isArray(value)) {
      return normalize(value[0]);
    }

    return value;
  };

  /* ---------------- ERROR HANDLING ---------------- */

  if (!res.ok) {
    // 🔥 If impersonation expired → clean session
    if (
      res.status === 401 &&
      impersonationToken
    ) {
     Cookies.remove(
        "impersonation_token",
        COOKIE_OPTIONS
      );

      Cookies.remove(
        "impersonation_tenant",
        COOKIE_OPTIONS
      );

      localStorage.removeItem(
        "impersonation_token"
      );

      localStorage.removeItem(
        "impersonation_tenant"
      );

      if (
        window.location.pathname !==
        "/superadmin/tenants"
      ) {
        window.location.href =
          "/superadmin/tenants";
      }
    }

    const normalized = {
      ...data,

      code: normalize(data.code),
      detail: normalize(data.detail),

      message: normalize(
        data.detail || data.message
      ),
    };

    handleApiError(res, normalized);
  }

  return data;
}