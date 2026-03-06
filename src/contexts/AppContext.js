// In your main app routing
// const App = () => {
//   const { user, tenant } = useApp();
  
//   const getUserDashboard = () => {
//     const membership = user.memberships.find(m => m.tenant_id === tenant.id);
    
//     // INDIVIDUAL OWNER - Show Owner Dashboard (with booking fulfillment)
//     if (membership.role === 'owner' && !tenant.has_providers) {
//       return 'owner-solo';  // Owner dashboard + order/booking handling
//     }
    
//     // BUSINESS OWNER - Show Owner Dashboard (management view)
//     if (membership.role === 'owner' && tenant.has_providers) {
//       return 'owner-business';  // Owner dashboard + provider management
//     }
    
//     // PROVIDER - Show Provider Dashboard (your current code)
//     if (membership.role === 'provider') {
//       return 'provider';  // Your ProviderDashboard.js
//     }
    
//     // CUSTOMER
//     return 'customer';
//   };
// };


"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { translations } from "../translations";

const AppContext = createContext(undefined);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }) {

  const [hydrated, setHydrated] = useState(false);
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTenant, setActiveTenant] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [tenantTimezone, setTenantTimezone] = useState("UTC");

  
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

  // ---------------- LOAD USER ----------------
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

        let res = await fetch("http://lvh.me:8000/api/v1/auth/me/", {
          headers: { Authorization: `Bearer ${access}` },
        });
          
        if (res.status === 401 && refresh) {
          const refreshRes = await fetch("http://lvh.me:8000/api/v1/auth/token/refresh/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          });

          const refreshData = await refreshRes.json();
          if (refreshRes.ok) {
            Cookies.set("access_token", refreshData.access);
            access = refreshData.access;

            res = await fetch("http://lvh.me:8000/api/v1/auth/me/", {
              headers: { Authorization: `Bearer ${access}` },
            });
          } else {
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            setUser(null);
            setLoadingUser(false);
            return;
          }
        }

        const data = await res.json();
        console.log("User data loaded:", data);

        if (res.ok) {
          setUser(data.user);
          setTenants(data.tenants);
          setRequiresOnboarding(data.requires_onboarding);

          // AUTO-SELECT tenant from backend if provided
          if (data.active_tenant) {
            Cookies.set("active_tenant", data.active_tenant);
            setActiveTenant(data.active_tenant);
          }
        }
      } catch {
        setUser(null);
      }

      setLoadingUser(false);
    }

    load();
  }, [hydrated]);
  // console.log(tenants,"Tenants from AppContext");

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
