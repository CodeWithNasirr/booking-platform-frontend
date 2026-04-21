"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { translations } from "../translations";
import { useRouter } from "next/navigation";
const AppContext = createContext(undefined);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTenant, setActiveTenant] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [tenantTimezone, setTenantTimezone] = useState("UTC");
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const activeTenantObj =  tenants.find((t) => t.id === activeTenant) || tenants[0] || null;

  const hasProviders = activeTenantObj?.has_providers ?? false;
    
  // ---------------- HYDRATION ----------------
  useEffect(() => {
    const savedLang = Cookies.get("app_language") || "en";
    const savedTenant = Cookies.get("active_tenant");

    setLanguage(savedLang);
    if (savedTenant) setActiveTenant(savedTenant);

    setHydrated(true);
  }, []);

  const isRTL = language === "ar" || language === "ur";
  // const t = (key) => translations[language]?.[key] ?? key;
  
  const t = (value) => {
    if (!value) return "";

    // 1️⃣ If already a normal string
    if (typeof value === "string") {
      // Try key-based translation first
      return translations?.[language]?.[value] ?? value;
    }

    // 2️⃣ If multilingual object
    if (typeof value === "object") {
      return (
        value[language] ||   // current language
        value.en ||          // fallback to English
        Object.values(value)[0] || // last fallback
        ""
      );
    }

    return "";
  };


  useEffect(() => {
    if (!hydrated) return;

    Cookies.set("app_language", language);

    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [hydrated, language, isRTL]);

  useEffect(() => {
    if (!hydrated) return;

    async function load() {
      try {
        let access = Cookies.get("access_token");
        const refresh = Cookies.get("refresh_token");

        if (!access && !refresh) {
          setUser(null);
          setLoadingUser(false);
          return;
        }

        // 👉 FIRST REQUEST
        let response = await fetch(`${BACKEND_URL}/api/v1/auth/me/`, {
          headers: {
            Authorization: `Bearer ${access}`,
            "X-Tenant": Cookies.get("active_tenant"),
          },
          credentials: "include",
        });

        // 👉 REFRESH TOKEN FLOW
        if (response.status === 401 && refresh) {
          const refreshRes = await fetch(`${BACKEND_URL}/api/v1/auth/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          });

          const refreshData = await refreshRes.json();

          if (refreshRes.ok) {
            Cookies.set("access_token", refreshData.access);
            access = refreshData.access;

            // 🔥 NEW VARIABLE (IMPORTANT)
            const retryRes = await fetch(`${BACKEND_URL}/api/v1/auth/me/`, {
              headers: {
                Authorization: `Bearer ${access}`,
                "X-Tenant": Cookies.get("active_tenant"),
              },
              credentials: "include",
            });

            response = retryRes;
          } else {
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            setUser(null);
            setLoadingUser(false);
            return;
          }
        }

        // 🔥 SAFE PARSE
        const text = await response.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("❌ Non-JSON /auth/me response:", text);
          setUser(null);
          return;
        }

        console.log("User data loaded:", data);

        if (response.ok) {
          setUser(data.user);
          setTenants(data.tenants);
          setRequiresOnboarding(data.requires_onboarding);

          if (data.active_tenant) {
            Cookies.set("active_tenant", data.active_tenant);
            setActiveTenant(data.active_tenant);
          }
        }
      } catch (err) {
        console.error("Load user error:", err);
        setUser(null);
      }

      setLoadingUser(false);
    }

    load();
  }, [hydrated]);

  // ---------------- CONTEXT ----------------
  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        isRTL,
        t,

        user,
        setUser,

        tenants,
        setTenants,
        
        hasProviders,

        activeTenant,
        setActiveTenant,

        selectTenant: (id) => {
          Cookies.set("active_tenant", id);
          setActiveTenant(id);
        },
          
        requiresOnboarding,
        setRequiresOnboarding,

        loadingUser,

        logout: () => {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          Cookies.remove("active_tenant");
          router.push("/auth/login");
          setUser(null);
          setTenants([]);
          setActiveTenant(null);
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
