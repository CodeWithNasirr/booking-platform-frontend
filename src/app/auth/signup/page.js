// "use client";

// import { useState, useEffect } from "react";
// import {
//   ArrowLeft,
//   Mail,
//   Phone,
//   Lock,
//   Eye,
//   EyeOff,
//   UserPlus,
// } from "lucide-react";
// import Image from "next/image";
// import { useApp } from "@/contexts/AppContext";
// import { useRouter } from "next/navigation";
// import Link from "next/link";
// import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
// import Cookies from "js-cookie";
// import { Button } from "@/app/ui/button";

// export default function RegisterWizard() {
//   const router = useRouter();
//   const { t, isRTL, setUser, requiresOnboarding, tenants, activeTenant,setActiveTenant,selectTenant } = useApp();

//   const [step, setStep] = useState("register");
//   const [isLoading, setIsLoading] = useState(false);
//   const [tempId, setTempId] = useState(null);

//   const [error, setError] = useState("");
//   const [otpError, setOtpError] = useState("");
//   const [resendCooldown, setResendCooldown] = useState(0);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//   const [formData, setFormData] = useState({
//     full_name: "",
//     email: "",
//     phone: "",
//     password: "",
//     confirm_password: "",
//   });

//   const [otpCode, setOtpCode] = useState("");

//   // unified handler
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   // OTP input
//   const handleOtpChange = (e) => {
//     setOtpCode(e.target.value.replace(/[^0-9]/g, ""));
//   };

//   /* -------------------- LANGUAGE / ONBOARDING REDIRECT -------------------- */
//   useEffect(() => {
//     if (!requiresOnboarding) return;

//     const tenant =
//       tenants?.find((t) => t.id === activeTenant) || tenants?.[0];

//     const step = tenant ? tenant.onboarding_step || 1 : 1;
//     const url = `/auth/onboarding?step=${step}`;

//     // ❌ prevent redirect loop if we are already on onboarding page
//     if (window.location.pathname.startsWith("/auth/onboarding")) return;

//     // const win = window.open(url, "_blank");
//     // if (win) try { win.focus(); } catch {}
//     router.replace(url);

//     // router.replace("/");
//   }, [requiresOnboarding, tenants, activeTenant, router]);


//   /* -------------------- RESEND TIMER -------------------- */
//   useEffect(() => {
//     if (resendCooldown > 0) {
//       const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [resendCooldown]);

//   /* -------------------- REGISTER → SEND OTP -------------------- */
//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (formData.password !== formData.confirm_password) {
//       setError(t("auth.passwordMismatch"));
//       return;
//     }

//     setIsLoading(true);

//     const res = await fetch("http://lvh.me:8000/api/v1/auth/register/", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(formData),
//     });

//     const data = await res.json();
   
//     setIsLoading(false);

  
//     if (!res.ok) {
//         // Collect all backend error messages
//         const messages = [];

//         Object.entries(data).forEach(([field, errors]) => {
//           if (Array.isArray(errors)) {
//             errors.forEach((msg) => messages.push(msg));
//           } else if (typeof errors === "string") {
//             messages.push(errors);
//           }
//         });

//         alert(messages.join("\n"));
//         setIsLoading(false);
//         return;
//       }


//     setTempId(data.temp_id);
//     setResendCooldown(data.cooldown);
//     setStep("otp");
//   };

//   /* -------------------- VERIFY OTP -------------------- */
//   const handleVerifyOTP = async () => {
//     if (otpCode.length !== 6)
//       return setOtpError(t("auth.invalidOtp"));

//     setIsLoading(true);

//     const res = await fetch(
//       "http://lvh.me:8000/api/v1/auth/register/verify/",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ temp_id: tempId, code: otpCode }),
//       }
//     );

//     const data = await res.json();
//     console.log(data)
//     /* 🔥 Too many attempts → reset registration */
//     if (res.status === 429) {
//       setOtpError(data.detail || t("auth.tooManyAttempts"));

//       // Wait 1 second then redirect (optional delay for UX)
//       setTimeout(() => {
//         window.location.reload();
//       }, 5000);
//       setIsLoading(false);
//       return;
//     }

//    if (!res.ok) {
//       // Collect all backend error messages
//       const messages = [];

//       Object.entries(data).forEach(([field, errors]) => {
//         if (Array.isArray(errors)) {
//           errors.forEach((msg) => messages.push(msg));
//         } else if (typeof errors === "string") {
//           messages.push(errors);
//         }
//       });

//       alert(messages.join("\n"));
//       setIsLoading(false);
//       return;
//     }


//     Cookies.set("access_token", data.access);
//     Cookies.set("refresh_token", data.refresh);
//     setUser(data.user);


//     // NEW — store tenant ID
//   if (data.tenant?.id) {
//     Cookies.set("active_tenant", data.tenant.id);
//     selectTenant(data.tenant.id);
//   }
//   // Redirect to onboarding
//   window.location.href = `/auth/onboarding?step=${data.tenant.onboarding_step || 1}`;

  
//   };

//   /* -------------------- RESEND CODE -------------------- */
//   const handleResend = async () => {
//     if (!tempId) return;
//     setResendCooldown(60);

//     await fetch("http://lvh.me:8000/api/v1/auth/register/resend/", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ temp_id: tempId }),
//     });
//   };

//   /* -------------------- UI -------------------- */
//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-accent via-background to-secondary">


//       {/* Language Switcher */}
//       <div className="absolute top-4 right-4">
//         <LanguageSwitcher />
//       </div>

//       {/* Back Button */}
//       <Link
//         href="/"
//         className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
//       >
//         <ArrowLeft className="w-4 h-4" />
//         <span>{t("common.backHome")}</span>
//       </Link>

//       <div className="w-full max-w-md">
        
//         {/* Logo & Titles */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center gap-2 mb-4">
//             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[hsl(345_65%_32%)] flex items-center justify-center">
//               <UserPlus className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-2xl font-bold">BookingPro</span>
//           </div>

//           <h1 className="text-3xl font-bold">{t("auth.signup")}</h1>
//           <p className="text-gray-600">{t("auth.createAccountSubtitle")}</p>
//         </div>

//         {/* -------------------- REGISTRATION FORM -------------------- */}
//         {step === "register" && (
//           <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6">
//             <form onSubmit={handleRegister} className="space-y-6">

//               {/* Full Name */}
//               <div>
//                 <label className="block mb-2">{t("auth.fullName")}</label>
//                 <input
//                   name="full_name"
//                   value={formData.full_name}
//                   onChange={handleChange}
//                   placeholder={t("auth.fullNamePlaceholder")}
//                   className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
//                   required
//                 />
//               </div>

//               {/* Email */}
//               <div>
//                 <label className="block mb-2">{t("common.email")}</label>
//                 <div className="relative">
//                   <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
//                   <input
//                     name="email"
//                     type="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     placeholder={t("auth.emailPlaceholder")}
//                     className={`w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} py-3 border border-border rounded-xl
// focus:outline-none focus:ring-2 focus:ring-ring
// `}
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Phone */}
//               <div>
//                 <label className="block mb-2">{t("auth.phone")}</label>
//                 <div className="relative">
//                   <Phone className={`absolute top-1/2 -translate-y-1/2 w-5 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
//                   <input
//                     name="phone"
//                     value={formData.phone}
//                     onChange={handleChange}
//                     placeholder={t("auth.phonePlaceholder")}
//                     className={`w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} py-3 border border-border rounded-xl
// focus:outline-none focus:ring-2 focus:ring-ring
// `}
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Password */}
//               <div>
//                 <label className="block mb-2">{t("common.password")}</label>

//                 <div className="relative">
//                   <Lock
//                     className={`absolute top-1/2 -translate-y-1/2 w-5 text-gray-400 ${
//                       isRTL ? "right-3" : "left-3"
//                     }`}
//                   />

//                   <input
//                     name="password"
//                     type={showPassword ? "text" : "password"}
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder={t("auth.passwordPlaceholder")}
//                     className={`w-full ${
//                       isRTL ? "pr-12 pl-10" : "pl-10 pr-12"
//                     } py-3 border border-border rounded-xl
// focus:outline-none focus:ring-2 focus:ring-ring
// `}
//                     required
//                   />

//                   {/* Eye Toggle */}
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className={`absolute top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 ${
//                       isRTL ? "left-2" : "right-2"
//                     }`}
//                   >
//                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
//               </div>

//               {/* Confirm Password */}
//               <div>
//                 <label className="block mb-2">{t("auth.confirmPassword")}</label>

//                 <div className="relative">
//                   <Lock
//                     className={`absolute top-1/2 -translate-y-1/2 w-5 text-gray-400 ${
//                       isRTL ? "right-3" : "left-3"
//                     }`}
//                   />

//                   <input
//                     name="confirm_password"
//                     type={showConfirmPassword ? "text" : "password"}
//                     value={formData.confirm_password}
//                     onChange={handleChange}
//                     placeholder={t("auth.confirmPasswordPlaceholder")}
//                     className={`w-full ${
//                       isRTL ? "pr-12 pl-10" : "pl-10 pr-12"
//                     } py-3 border border-border rounded-xl
// focus:outline-none focus:ring-2 focus:ring-ring
// `}
//                     required
//                   />

//                   {/* Eye Toggle */}
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     className={`absolute top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 ${
//                       isRTL ? "left-2" : "right-2"
//                     }`}
//                   >
//                     {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                   </button>
//                 </div>
//               </div>


//               {error && (
//                 <p className="text-destructive text-sm text-center">{error}</p>
//               )}

//               <Button
//                 type="submit"
//                 className="w-full bg-primary text-primary-foreground py-3 text-lg hover:opacity-90"

//                 disabled={isLoading}
//               >
//                 {isLoading ? t("auth.processing") : t("auth.createAccount")}
//               </Button>
//             </form>
//           </div>
//         )}

//         {/* -------------------- OTP STEP -------------------- */}
//         {step === "otp" && (
//           <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6">

//             <p className="text-center text-gray-600">
//               {t("auth.otpSent")}
//             </p>

//             <input
//               maxLength={6}
//               value={otpCode}
//               onChange={handleOtpChange}
//               className="w-full text-center text-2xl tracking-widest py-4 border border-border rounded-xl
// focus:outline-none focus:ring-2 focus:ring-ring
// "
//               placeholder="000000"
//             />

//             {otpError && <p className="text-red-500 text-center">{otpError}</p>}

//             <Button
//               onClick={handleVerifyOTP}
//               className="w-full bg-blue-600 py-3 text-lg"
//               disabled={isLoading || otpCode.length !== 6}
//             >
//               {isLoading ? t("auth.verifying") : t("auth.verify")}
//             </Button>

//             <Button
//               variant="ghost"
//               onClick={handleResend}
//               disabled={resendCooldown > 0}
//               className="w-full"
//             >
//               {resendCooldown > 0
//                 ? `${t("auth.resendIn")} ${resendCooldown}s`
//                 : t("auth.resendCode")}
//             </Button>
//           </div>
//         )}

//         {/* Footer */}
//         <div className="text-center mt-4">
//           <p className="text-gray-600">
//             {t("auth.alreadyHaveAccount")}{" "}
//             <Link href="/auth/login" className="text-primary hover:underline font-medium">
//               {t("auth.signIn")}
//             </Link>
//           </p>
//         </div>

//       </div>
//     </div>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Sparkles,
  Check,
} from "lucide-react";
import Image from "next/image";
import { useApp } from "@/contexts/AppContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Cookies from "js-cookie";
import { Button } from "@/app/ui/button";

export default function RegisterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRTL, setUser, requiresOnboarding, tenants, activeTenant, setActiveTenant, selectTenant } = useApp();

  // ── Read plan from URL query params ──
  const selectedPlan = searchParams.get("plan") || "free";
  const selectedInterval = searchParams.get("interval") || "month";

  const [step, setStep] = useState("register");
  const [isLoading, setIsLoading] = useState(false);
  const [tempId, setTempId] = useState(null);

  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [otpCode, setOtpCode] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (e) => {
    setOtpCode(e.target.value.replace(/[^0-9]/g, ""));
  };

  // ── Plan display names ──
  const planLabels = {
    free: { name: "Free", color: "slate" },
    starter: { name: "Starter", color: "blue" },
    professional: { name: "Professional", color: "rose" },
    enterprise: { name: "Enterprise", color: "purple" },
  };

  const planInfo = planLabels[selectedPlan] || planLabels.free;

  /* ── REDIRECT IF ALREADY ONBOARDING ── */
  useEffect(() => {
    if (!requiresOnboarding) return;

    const tenant =
      tenants?.find((t) => t.id === activeTenant) || tenants?.[0];

    const step = tenant ? tenant.onboarding_step || 1 : 1;
    const url = `/auth/onboarding?step=${step}`;

    if (window.location.pathname.startsWith("/auth/onboarding")) return;
    router.replace(url);
  }, [requiresOnboarding, tenants, activeTenant, router]);

  /* ── RESEND TIMER ── */
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /* ── REGISTER → SEND OTP ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setIsLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // ── Pass selected plan to backend ──
          selected_plan: selectedPlan,
          billing_interval: selectedInterval,
        }),
      }
    );

    const data = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      const messages = [];
      Object.entries(data).forEach(([field, errors]) => {
        if (Array.isArray(errors)) {
          errors.forEach((msg) => messages.push(msg));
        } else if (typeof errors === "string") {
          messages.push(errors);
        }
      });
      alert(messages.join("\n"));
      return;
    }

    setTempId(data.temp_id);
    setResendCooldown(data.cooldown);
    setStep("otp");
  };

  /* ── VERIFY OTP ── */
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return setOtpError(t("auth.invalidOtp"));

    setIsLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register/verify/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temp_id: tempId,
          code: otpCode,
          // ── Pass plan info through verification too ──
          selected_plan: selectedPlan,
          billing_interval: selectedInterval,
        }),
      }
    );

    const data = await res.json();

    if (res.status === 429) {
      setOtpError(data.detail || t("auth.tooManyAttempts"));
      setTimeout(() => window.location.reload(), 5000);
      setIsLoading(false);
      return;
    }

    if (!res.ok) {
      const messages = [];
      Object.entries(data).forEach(([field, errors]) => {
        if (Array.isArray(errors)) {
          errors.forEach((msg) => messages.push(msg));
        } else if (typeof errors === "string") {
          messages.push(errors);
        }
      });
      alert(messages.join("\n"));
      setIsLoading(false);
      return;
    }

    Cookies.set("access_token", data.access);
    Cookies.set("refresh_token", data.refresh);
    setUser(data.user);

    if (data.tenant?.id) {
      Cookies.set("active_tenant", data.tenant.id);
      selectTenant(data.tenant.id);
    }

    window.location.href = `/auth/onboarding?step=${data.tenant.onboarding_step || 1}`;
  };

  /* ── RESEND CODE ── */
  const handleResend = async () => {
    if (!tempId) return;
    setResendCooldown(60);

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register/resend/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_id: tempId }),
      }
    );
  };

  /* ── UI ── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-accent via-background to-secondary">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      {/* Back Button */}
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t("common.backHome")}</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo & Titles */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[hsl(345_65%_32%)] flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">BookingPro</span>
          </div>

          <h1 className="text-3xl font-bold">{t("auth.signup")}</h1>
          <p className="text-gray-600">{t("auth.createAccountSubtitle")}</p>
        </div>

        {/* ── SELECTED PLAN BANNER ── */}
        {selectedPlan && selectedPlan !== "free" && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {planInfo.name} Plan
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    14-day free trial
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-0.5">
                  Full access during trial · No credit card required
                </p>
              </div>
              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            </div>
          </div>
        )}

        {/* ── REGISTRATION FORM ── */}
        {step === "register" && (
          <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6">
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block mb-2">{t("auth.fullName")}</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder={t("auth.fullNamePlaceholder")}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2">{t("common.email")}</label>
                <div className="relative">
                  <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("auth.emailPlaceholder")}
                    className={`w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring`}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-2">{t("auth.phone")}</label>
                <div className="relative">
                  <Phone className={`absolute top-1/2 -translate-y-1/2 w-5 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("auth.phonePlaceholder")}
                    className={`w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring`}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2">{t("common.password")}</label>
                <div className="relative">
                  <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("auth.passwordPlaceholder")}
                    className={`w-full ${isRTL ? "pr-12 pl-10" : "pl-10 pr-12"} py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 ${isRTL ? "left-2" : "right-2"}`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block mb-2">{t("auth.confirmPassword")}</label>
                <div className="relative">
                  <Lock className={`absolute top-1/2 -translate-y-1/2 w-5 text-gray-400 ${isRTL ? "right-3" : "left-3"}`} />
                  <input
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    className={`w-full ${isRTL ? "pr-12 pl-10" : "pl-10 pr-12"} py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 ${isRTL ? "left-2" : "right-2"}`}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 text-lg hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading
                  ? t("auth.processing")
                  : selectedPlan !== "free"
                  ? `Create Account & Start Trial`
                  : t("auth.createAccount")}
              </Button>
            </form>
          </div>
        )}

        {/* ── OTP STEP ── */}
        {step === "otp" && (
          <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6">
            <p className="text-center text-gray-600">{t("auth.otpSent")}</p>

            <input
              maxLength={6}
              value={otpCode}
              onChange={handleOtpChange}
              className="w-full text-center text-2xl tracking-widest py-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="000000"
            />

            {otpError && <p className="text-red-500 text-center">{otpError}</p>}

            <Button
              onClick={handleVerifyOTP}
              className="w-full bg-blue-600 py-3 text-lg"
              disabled={isLoading || otpCode.length !== 6}
            >
              {isLoading ? t("auth.verifying") : t("auth.verify")}
            </Button>

            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full"
            >
              {resendCooldown > 0
                ? `${t("auth.resendIn")} ${resendCooldown}s`
                : t("auth.resendCode")}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-gray-600">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}