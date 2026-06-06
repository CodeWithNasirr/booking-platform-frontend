// skofficial456@gmail.com provider pass:skcode4321
// auth/login/TenantLogin.js
"use client";

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/app/ui/button';
import Cookies from 'js-cookie';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { Briefcase, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import { COOKIE_OPTIONS } from "@/lib/cookieConfig";
export default function TenantLogin() {
  const { t, isRTL, setUser, setTenants, setRequiresOnboarding, selectTenant } = useApp();
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API_URL || "yourplatform.com";

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const data = await apiFetch(`/api/v1/auth/login/`, null, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      console.log("Login response:", data);


      // Save tokens
      Cookies.set(
        "access_token",
        data.access,
        COOKIE_OPTIONS
      );

      Cookies.set(
        "refresh_token",
        data.refresh,
        COOKIE_OPTIONS
      );

      // Update context
      setUser(data.user);
      setTenants(data.tenants || []);
      setRequiresOnboarding(data.requires_onboarding);

      // Store active tenant
      if (data.active_tenant) {
        Cookies.set(
          "active_tenant",
          data.active_tenant,
          COOKIE_OPTIONS
        );
        selectTenant(data.active_tenant);
      }

      const tenants = data.tenants || [];

      // Routing logic
      if (!tenants.length) {
        router.push("/auth/onboarding?step=1");
        return;
      }

      if (data.requires_onboarding) {
        const active = tenants.find((t) => t.id === data.active_tenant) || tenants[0];
        router.push(`/auth/onboarding?step=${active.onboarding_step || 1}`);
        return;
      }
    
      //   PROVIDER: Redirect to provider dashboard
      const firstMembership = tenants[0];
      if (firstMembership.role === 'provider') {
        Cookies.set(
          "active_tenant",
          firstMembership.id,
          COOKIE_OPTIONS
        );
        selectTenant(firstMembership.id);
        router.push("/provider");
        return;
      }
      

      if (tenants.length === 1) {
        Cookies.set("active_tenant", tenants[0].id,COOKIE_OPTIONS);
        selectTenant(tenants[0].id);
        router.push("/dashboard");
        return;
      }

      router.push("/tenants/select");

    } 
    catch (err) {
    console.error("Login error:", err);

    if (err.data?.email) {
      setErrors({ email: err.data.email[0] });
    } else if (err.data?.password) {
      setErrors({ password: err.data.password[0] });
    } else if (err.data?.non_field_errors) {
      setErrors({ email: err.data.non_field_errors[0] });
    } else {
      setErrors({ email: err.message || "Login failed" });
    }
  }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-secondary flex items-center justify-center p-4">
      
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <LanguageSwitcher />
      </div>

      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">{t("common.backHome")}</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">BookingPro</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("nav.login")}</h1>
          <p className="text-gray-600">{t("auth.welcome")}</p>
        </div>

        <div className="bg-background rounded-2xl shadow-xl border border-border p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">{t("common.email")}</label>
              <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("auth.emailPlaceholder")}
                  className={`w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} py-3 rounded-xl border
                  ${errors.email ? "border-destructive" : "border-border"}
                  focus:outline-none focus:ring-2 focus:ring-ring`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">{t("common.password")}</label>
              <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("auth.passwordPlaceholder")}
                  className={`w-full ${isRTL ? "pr-10 pl-12" : "pl-10 pr-12"} py-3 rounded-xl border
                  ${errors.password ? "border-destructive" : "border-border"}
                  focus:outline-none focus:ring-2 focus:ring-ring`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 p-2 text-gray-400 ${isRTL ? "left-0" : "right-0"}`}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{t("auth.rememberMe")}</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                {t("auth.forgotPassword")}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? t("auth.signingIn") : t("auth.signIn")}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">{t("auth.orContinue")}</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-gray-700">{t("auth.google")}</span>
              </button>
              <button type="button" className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-xl hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-gray-700">{t("auth.facebook")}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Signup Link */}
        <div className="text-center">
          <p className="text-gray-600">
            {t("auth.noAccount")}{" "}
            <Link href="/auth/signup" className="text-primary font-medium hover:underline">
              {t("auth.signupFree")}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}