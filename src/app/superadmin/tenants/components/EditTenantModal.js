// // components/superadmin/EditTenantModal.jsx
"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Save, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/t";

const MAROON = "#800020";

export default function EditTenantModal({ tenant, onClose, onSave, loading }) {
  const { t, isRTL } = useTranslation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
    subscription_tier: "",
    platform_fee_percent: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        email: tenant?.owner?.email || tenant.owner_email || tenant.email || "",
        phone: tenant?.owner?.phone || tenant.phone || "",
        status: tenant.status || "active",
        subscription_tier: tenant.subscription_tier || "free",
        platform_fee_percent: tenant.platform_fee_percent?.toString() || "",
        notes: tenant.notes || "",
      });
    }
  }, [tenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t("superadmin.edit_tenant.errors.name_required");
    }
    if (!formData.email.trim()) {
      newErrors.email = t("superadmin.edit_tenant.errors.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("superadmin.edit_tenant.errors.email_invalid");
    }
    if (formData.platform_fee_percent && (isNaN(formData.platform_fee_percent) || formData.platform_fee_percent < 0 || formData.platform_fee_percent > 100)) {
      newErrors.platform_fee_percent = t("superadmin.edit_tenant.errors.fee_range");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      status: formData.status,
      subscription_tier: formData.subscription_tier,
      platform_fee_percent: formData.platform_fee_percent ? parseFloat(formData.platform_fee_percent) : null,
      notes: formData.notes,
    };

    onSave(payload);
  };

  const statusOptions = [
    { value: "active", label: t("superadmin.tenants.status_active") },
    { value: "trial", label: t("superadmin.tenants.status_trial") },
    { value: "suspended", label: t("superadmin.tenants.status_suspended") },
    { value: "pending", label: t("superadmin.tenants.status_pending") },
    { value: "cancelled", label: t("superadmin.tenants.status_cancelled") },
  ];

  const tierOptions = [
    { value: "free", label: t("superadmin.tenants.tier_free") },
    { value: "starter", label: t("superadmin.tenants.tier_starter") },
    { value: "professional", label: t("superadmin.tenants.tier_professional") },
    { value: "enterprise", label: t("superadmin.tenants.tier_enterprise") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t("superadmin.edit_tenant.title")}</h3>
            <p className="text-sm text-gray-500">{t("superadmin.edit_tenant.subtitle", { name: tenant?.name })}</p>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("superadmin.edit_tenant.fields.business_name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-300 focus:ring-[#800020]/30 focus:border-[#800020]"
              }`}
              placeholder={t("superadmin.edit_tenant.placeholders.business_name")}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          {/* Email & Phone */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("superadmin.edit_tenant.fields.email")} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.email
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-[#800020]/30 focus:border-[#800020]"
                }`}
                placeholder={t("superadmin.edit_tenant.placeholders.email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("superadmin.edit_tenant.fields.phone")}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
                placeholder={t("superadmin.edit_tenant.placeholders.phone")}
              />
            </div>
          </div>

          {/* Status & Tier */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("superadmin.edit_tenant.fields.status")}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] bg-white"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("superadmin.edit_tenant.fields.subscription_tier")}
              </label>
              <select
                name="subscription_tier"
                value={formData.subscription_tier}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] bg-white"
              >
                {tierOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Platform Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("superadmin.edit_tenant.fields.platform_fee")}
            </label>
            <div className="relative">
              <input
                type="number"
                name="platform_fee_percent"
                value={formData.platform_fee_percent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isRTL ? "pl-8" : "pr-8"} ${
                  errors.platform_fee_percent
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-[#800020]/30 focus:border-[#800020]"
                }`}
                placeholder="0.00"
              />
              <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 text-sm ${isRTL ? "left-3" : "right-3"}`}>%</span>
            </div>
            {errors.platform_fee_percent && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.platform_fee_percent}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t("superadmin.edit_tenant.hints.platform_fee")}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("superadmin.edit_tenant.fields.notes")}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] resize-none"
              placeholder={t("superadmin.edit_tenant.placeholders.notes")}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("superadmin.common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-colors"
              style={{ backgroundColor: MAROON }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {t("superadmin.edit_tenant.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// "use client";

// import React, { useState, useEffect } from "react";
// import { X, Loader2, Save, AlertCircle } from "lucide-react";

// const MAROON = "#800020";

// export default function EditTenantModal({ tenant, onClose, onSave, loading }) {

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     status: "",
//     subscription_tier: "",
//     platform_fee_percent: "",
//     notes: "",
//   });

//   const [errors, setErrors] = useState({});

//   // Initialize form with tenant data
//   useEffect(() => {
//     if (tenant) {
//       setFormData({
//         name: tenant.name || "",
//         email: tenant?.owner?.email || tenant.owner_email || tenant.email || "",
//         phone: tenant?.owner?.phone || tenant.phone || "",

//         status: tenant.status || "active",
//         subscription_tier: tenant.subscription_tier || "free",
//         platform_fee_percent: tenant.platform_fee_percent?.toString() || "",
//         notes: tenant.notes || "",
//       });
//     }
//   }, [tenant]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//     // Clear error when field is edited
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: null }));
//     }
//   };

//   const validate = () => {
//     const newErrors = {};
//     if (!formData.name.trim()) {
//       newErrors.name = "Business name is required";
//     }
//     if (!formData.email.trim()) {
//       newErrors.email = "Email is required";
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       newErrors.email = "Invalid email format";
//     }
//     if (formData.platform_fee_percent && (isNaN(formData.platform_fee_percent) || formData.platform_fee_percent < 0 || formData.platform_fee_percent > 100)) {
//       newErrors.platform_fee_percent = "Must be between 0 and 100";
//     }
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!validate()) return;

//     const payload = {
//       name: formData.name,
//       email: formData.email,
//       phone: formData.phone,
//       status: formData.status,
//       subscription_tier: formData.subscription_tier,
//       platform_fee_percent: formData.platform_fee_percent ? parseFloat(formData.platform_fee_percent) : null,
//       notes: formData.notes,
//     };

//     onSave(payload);
//   };

//   const statusOptions = [
//     { value: "active", label: "Active" },
//     { value: "trial", label: "Trial" },
//     { value: "suspended", label: "Suspended" },
//     { value: "pending", label: "Pending" },
//     { value: "cancelled", label: "Cancelled" },
//   ];

//   const tierOptions = [
//     { value: "free", label: "Free" },
//     { value: "starter", label: "Starter" },
//     { value: "professional", label: "Professional" },
//     { value: "enterprise", label: "Enterprise" },
//   ];

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//         {/* Header */}
//         <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">Edit Tenant</h3>
//             <p className="text-sm text-gray-500">Update {tenant?.name} details</p>
//           </div>
//           <button
//             onClick={onClose}
//             disabled={loading}
//             className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
//           >
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="p-5 space-y-5">
//           {/* Business Name */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Business Name <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
//                 errors.name
//                   ? "border-red-300 focus:ring-red-200"
//                   : "border-gray-300 focus:ring-[#800020]/30 focus:border-[#800020]"
//               }`}
//               placeholder="Enter business name"
//             />
//             {errors.name && (
//               <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
//                 <AlertCircle className="w-3 h-3" /> {errors.name}
//               </p>
//             )}
//           </div>

//           {/* Email & Phone */}
//           <div className="grid md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Email <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
//                   errors.email
//                     ? "border-red-300 focus:ring-red-200"
//                     : "border-gray-300 focus:ring-[#800020]/30 focus:border-[#800020]"
//                 }`}
//                 placeholder="admin@example.com"
//               />
//               {errors.email && (
//                 <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
//                   <AlertCircle className="w-3 h-3" /> {errors.email}
//                 </p>
//               )}
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Phone
//               </label>
//               <input
//                 type="tel"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleChange}
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
//                 placeholder="+1 (555) 000-0000"
//               />
//             </div>
//           </div>

//           {/* Status & Tier */}
//           <div className="grid md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Status
//               </label>
//               <select
//                 name="status"
//                 value={formData.status}
//                 onChange={handleChange}
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] bg-white"
//               >
//                 {statusOptions.map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Subscription Tier
//               </label>
//               <select
//                 name="subscription_tier"
//                 value={formData.subscription_tier}
//                 onChange={handleChange}
//                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] bg-white"
//               >
//                 {tierOptions.map((opt) => (
//                   <option key={opt.value} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Platform Fee */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Platform Fee (%)
//             </label>
//             <div className="relative">
//               <input
//                 type="number"
//                 name="platform_fee_percent"
//                 value={formData.platform_fee_percent}
//                 onChange={handleChange}
//                 min="0"
//                 max="100"
//                 step="0.01"
//                 className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 pr-8 ${
//                   errors.platform_fee_percent
//                     ? "border-red-300 focus:ring-red-200"
//                     : "border-gray-300 focus:ring-[#800020]/30 focus:border-[#800020]"
//                 }`}
//                 placeholder="0.00"
//               />
//               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
//             </div>
//             {errors.platform_fee_percent && (
//               <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
//                 <AlertCircle className="w-3 h-3" /> {errors.platform_fee_percent}
//               </p>
//             )}
//             <p className="mt-1 text-xs text-gray-500">
//               Percentage fee charged on transactions (0-100)
//             </p>
//           </div>

//           {/* Notes */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Internal Notes
//             </label>
//             <textarea
//               name="notes"
//               value={formData.notes}
//               onChange={handleChange}
//               rows={3}
//               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] resize-none"
//               placeholder="Add internal notes about this tenant..."
//             />
//           </div>

//           {/* Footer */}
//           <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
//             <button
//               type="button"
//               onClick={onClose}
//               disabled={loading}
//               className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-colors"
//               style={{ backgroundColor: MAROON }}
//             >
//               {loading && <Loader2 className="w-4 h-4 animate-spin" />}
//               <Save className="w-4 h-4" />
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }