
"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { platformLogin } from "@/lib/platformApi";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const data = await platformLogin(formData.email, formData.password);
      // console.log(data,"platformLogin")
      // Save tokens
      const cookieOpts = formData.rememberMe ? { expires: 30 } : {};
      Cookies.set("access_token", data.access, cookieOpts);
      Cookies.set("refresh_token", data.refresh, cookieOpts);

      // Store platform role for middleware checks
      Cookies.set("platform_role", data.platform?.role || "", cookieOpts);

      // Redirect to superadmin dashboard
      router.push("/superadmin/dashboard");
    } catch (err) {
      const errData = err.data || {};

      if (errData.detail) {
        setErrors({ email: errData.detail });
      } else if (errData.email) {
        setErrors({ email: Array.isArray(errData.email) ? errData.email[0] : errData.email });
      } else if (errData.password) {
        setErrors({
          password: Array.isArray(errData.password) ? errData.password[0] : errData.password,
        });
      } else {
        setErrors({ email: err.message || "Login failed" });
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Home</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Admin Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Platform Admin</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Superadmin Access</h1>
          <p className="text-slate-400">Restricted area — authorized personnel only</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@platform.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-900/50
                  ${errors.email ? "border-red-500" : "border-slate-700"}
                  text-white placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                />
              </div>
              {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-slate-900/50
                  ${errors.password ? "border-red-500" : "border-slate-700"}
                  text-white placeholder:text-slate-500
                  focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-400 mt-1">{errors.password}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-300">Remember me</span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl
              hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-600/20
              disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : (
                "Access Platform"
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="text-center">
          <p className="text-sm text-slate-400">🔒 All login attempts are monitored and logged</p>
        </div>
      </div>
    </div>
  );
}
// "use client";

// import { useState } from 'react';
// import { useApp } from '@/contexts/AppContext';
// import Cookies from 'js-cookie';
// import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';

// export default function AdminLogin() {
//   const { setUser } = useApp();
//   const router = useRouter();
//   const API = process.env.NEXT_PUBLIC_API_URL || "yourplatform.com";


//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     rememberMe: false,
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [isLoading, setIsLoading] = useState(false);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));

//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.email.trim()) newErrors.email = 'Email is required';
//     if (!formData.password) newErrors.password = 'Password is required';
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!validateForm()) return;

//     setIsLoading(true);

//     try {
//       // TODO: Update endpoint when backend is ready
//       const res = await fetch(`${API}/api/v1/platform/auth/login/`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: formData.email,
//           password: formData.password,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         if (data.detail) {
//           setErrors({ email: data.detail });
//         } else if (data.email) {
//           setErrors({ email: data.email[0] });
//         } else if (data.password) {
//           setErrors({ password: data.password[0] });
//         } else {
//           setErrors({ email: "Invalid credentials" });
//         }
//         setIsLoading(false);
//         return;
//       }

//       // Verify superadmin status
//       if (!data.user?.is_superadmin && !data.platform?.is_platform_employee) {
//         setErrors({ email: "Access denied. Superadmin credentials required." });
//         setIsLoading(false);
//         return;
//       }

//       // Save tokens
//       Cookies.set("access_token", data.access);
//       Cookies.set("refresh_token", data.refresh);

//       // Update context (admin doesn't need tenants)
//       setUser(data.user);

//       // Redirect to admin dashboard
//       router.push("/superadmin/dashboard");

//     } catch (err) {
//       console.error("Admin login error:", err);
//       setErrors({ email: "Server error, please try again later" });
//     }

//     setIsLoading(false);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      
//       <Link
//         href="/"
//         className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-colors"
//       >
//         <ArrowLeft className="w-4 h-4" />
//         <span className="text-sm">Back to Home</span>
//       </Link>

//       <div className="w-full max-w-md">
        
//         {/* Admin Badge */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center gap-2 mb-4">
//             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg">
//               <Shield className="w-6 h-6 text-white" />
//             </div>
//             <span className="text-2xl font-bold text-white">Platform Admin</span>
//           </div>
//           <h1 className="text-3xl font-bold text-white mb-2">Superadmin Access</h1>
//           <p className="text-slate-400">Restricted area - authorized personnel only</p>
//         </div>

//         {/* Login Form */}
//         <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8 mb-6">
//           <form onSubmit={handleSubmit} className="space-y-5">
            
//             {/* Email Field */}
//             <div>
//               <label className="block text-sm text-slate-300 mb-2">Admin Email</label>
//               <div className="relative">
//                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   placeholder="admin@platform.com"
//                   className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-900/50
//                   ${errors.email ? "border-red-500" : "border-slate-700"}
//                   text-white placeholder:text-slate-500
//                   focus:outline-none focus:ring-2 focus:ring-red-500/50`}
//                 />
//               </div>
//               {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email}</p>}
//             </div>

//             {/* Password Field */}
//             <div>
//               <label className="block text-sm text-slate-300 mb-2">Password</label>
//               <div className="relative">
//                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   name="password"
//                   value={formData.password}
//                   onChange={handleChange}
//                   placeholder="••••••••"
//                   className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-slate-900/50
//                   ${errors.password ? "border-red-500" : "border-slate-700"}
//                   text-white placeholder:text-slate-500
//                   focus:outline-none focus:ring-2 focus:ring-red-500/50`}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-300"
//                 >
//                   {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
//                 </button>
//               </div>
//               {errors.password && <p className="text-sm text-red-400 mt-1">{errors.password}</p>}
//             </div>

//             {/* Remember Me */}
//             <div className="flex items-center justify-between">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="checkbox"
//                   name="rememberMe"
//                   checked={formData.rememberMe}
//                   onChange={handleChange}
//                   className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-red-600 focus:ring-red-500"
//                 />
//                 <span className="text-sm text-slate-300">Remember me</span>
//               </label>
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl
//               hover:from-red-700 hover:to-red-800 transition-all shadow-lg shadow-red-600/20
//               disabled:opacity-50 disabled:cursor-not-allowed font-medium"
//             >
//               {isLoading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   Verifying...
//                 </span>
//               ) : (
//                 'Access Platform'
//               )}
//             </button>

//           </form>
//         </div>

//         {/* Security Notice */}
//         <div className="text-center">
//           <p className="text-sm text-slate-400">
//             🔒 All login attempts are monitored and logged
//           </p>
//         </div>

//       </div>
//     </div>
//   );
// }