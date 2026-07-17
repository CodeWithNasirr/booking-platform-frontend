"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { translations } from "../translations";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import { COOKIE_OPTIONS } from "@/lib/cookieConfig";

const AppContext = createContext(undefined);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function AppProvider({ children }) {
  console.log("APP COntenxt Mount")
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState(null);

  const [loadingUser, setLoadingUser] = useState(true);
  const [authInitialized,
  setAuthInitialized] =
  useState(false);
  const [activeTenant, setActiveTenant] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [requiresOnboarding, setRequiresOnboarding] = useState(false);
  const [tenantTimezone, setTenantTimezone] = useState("UTC");
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const activeTenantObj =
    tenants.find(
      (t) => String(t.id) === String(activeTenant)
    ) ||
    tenants[0] ||
    null;

  const hasProviders = activeTenantObj?.has_providers ?? false;

  // ── Single source of truth for auth-gating ──────────────────────
  // `authReady` is the ONE flag guards should wait on: the client has
  // hydrated AND the /auth/me load has settled. `role` is derived from the
  // resolved active tenant (never recomputed with mismatched types in a
  // layout). Every guard reads these — no local roleChecked copies.
  const authReady = hydrated && !loadingUser;
  const role = activeTenantObj?.role ?? null;

  // ---------------- HYDRATION ----------------
  useEffect(() => {
    const savedLang = Cookies.get("app_language") || "en";
    const savedTenant = Cookies.get("active_tenant");

    setLanguage(savedLang);
    if (savedTenant) setActiveTenant(savedTenant);

    setHydrated(true);

    // Listen for language changes triggered by t.js setLanguage()
    // (called from LanguageSwitcher inside superadmin/landing which
    //  don't have AppProvider and use useTranslation instead of useApp)
    function onExternalLangChange(e) {
      setLanguage(e.detail.lang);
    }

    window.addEventListener("app-lang-change", onExternalLangChange);
    return () => window.removeEventListener("app-lang-change", onExternalLangChange);
  }, []);

  const isRTL = language === "ar" || language === "ur";
  // const t = (key) => translations[language]?.[key] ?? key;
  
  // const t = (value) => {
  //   if (!value) return "";

  //   // 1️⃣ If already a normal string
  //   if (typeof value === "string") {
  //     // Try key-based translation first
  //     return translations?.[language]?.[value] ?? value;
  //   }

  //   // 2️⃣ If multilingual object
  //   if (typeof value === "object") {
  //     return (
  //       value[language] ||   // current language
  //       value.en ||          // fallback to English
  //       Object.values(value)[0] || // last fallback
  //       ""
  //     );
  //   }

  //   return "";
  // };

  const t = (key, params = {}) => {
    if (!key) return "";

    let text = "";

    // multilingual object support
    if (typeof key === "object") {
      text =
        key[language] ||
        key.en ||
        Object.values(key)[0] ||
        "";
    } else {
      text =
        translations?.[language]?.[key] ??
        translations?.en?.[key] ??
        key;
    }

    // Replace placeholders
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(
        new RegExp(`{{\\s*${param}\\s*}}`, "g"),
        String(value)
      );
    });

    return text;
  };


  useEffect(() => {
    if (!hydrated) return;

    Cookies.set("app_language", language);
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;

    // Notify useTranslation() hooks across the entire tree
    // so superadmin and landing pages re-render without a refresh
    window.dispatchEvent(
      new CustomEvent("app-lang-change", { detail: { lang: language } })
    );
  }, [hydrated, language, isRTL]);

  useEffect(() => {
    if (!hydrated) return;

    async function load() {
      try {
        const access = Cookies.get("access_token");
        const refresh = Cookies.get("refresh_token");

        const impersonation =
          Cookies.get("impersonation_token");

       if (
        impersonation &&
        !access &&
        !refresh
      ) {
        Cookies.remove(
          "impersonation_token",
          
          COOKIE_OPTIONS
        );

        Cookies.remove(
          "impersonation_tenant",
          COOKIE_OPTIONS
        );

        setUser(null);
        setLoadingUser(false);

        return;
      }

        if (!access && !refresh) {
          setUser(null);
          setTenants([]);
          setLoadingUser(false);
          setAuthInitialized(true);
          return;
        }

        const data = await apiFetch(
          "/api/v1/auth/me/",
          Cookies.get("active_tenant")
        );

        console.log("User data loaded:", data);

        setUser(data.user || null);
        setTenants(data.tenants || []);
        setRequiresOnboarding(data.requires_onboarding || false);

        if (data.active_tenant) {
          Cookies.set(
            "active_tenant",
            data.active_tenant,
            COOKIE_OPTIONS
          );

          setActiveTenant(data.active_tenant);
        }
      } catch (err) {
        console.error("Load user error:", err);

        setUser(null);
        setTenants([]);
      } finally {
        setLoadingUser(false);
        setAuthInitialized(true);
      }
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
        activeTenantObj,
        role,
        authReady,
        setActiveTenant,

        selectTenant: (id) => {
          Cookies.set(
            "active_tenant",
            id,
            COOKIE_OPTIONS
          );
          setActiveTenant(id);
        },
          
        requiresOnboarding,
        setRequiresOnboarding,

        loadingUser,
        authInitialized,

        logout: () => {
         Cookies.remove(
            "access_token",
            COOKIE_OPTIONS
          );

          Cookies.remove(
            "refresh_token",
            COOKIE_OPTIONS
          );

          Cookies.remove(
            "active_tenant",
            COOKIE_OPTIONS
          );
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
