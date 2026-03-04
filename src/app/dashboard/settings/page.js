// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { useApp } from '@/contexts/AppContext'
// import {
//   Building2,
//   Users,
//   Shield,
//   Globe,
//   Languages,
//   Bell,
//   Save,
//   Upload,
//   Trash2,
//   Plus,
//   Edit2,
//   Check,
//   X,
//   Mail,
//   Phone,
//   MapPin,
//   Clock,
//   CreditCard,
//   Key,
//   AlertCircle,
// } from 'lucide-react'
// import useBlockBackNavigation from '@/lib/useBlockBackNavigation'

// const tabs = [
//   { key: 'business', label: 'Business Info', icon: Building2 },
//   { key: 'team', label: 'Team Members', icon: Users },
//   { key: 'roles', label: 'Roles & Permissions', icon: Shield },
//   { key: 'domain', label: 'Domain & Branding', icon: Globe },
//   { key: 'language', label: 'Language & Region', icon: Languages },
//   { key: 'notifications', label: 'Notifications', icon: Bell },
// ]

// const initialBusinessInfo = {
//   businessName: 'Elegant Spa & Wellness',
//   email: 'contact@elegantspa.com',
//   phone: '+1 (555) 123-4567',
//   address: '123 Main Street, Suite 100',
//   city: 'New York',
//   state: 'NY',
//   zipCode: '10001',
//   country: 'United States',
//   taxId: '12-3456789',
//   website: 'https://elegantspa.com',
//   description: 'Premium spa and wellness center offering a wide range of beauty and relaxation services.',
// }

// const initialTeamMembers = [
//   {
//     id: '1',
//     name: 'John Smith',
//     email: 'john@elegantspa.com',
//     role: 'Owner',
//     permissions: 'Full Access',
//     avatar: 'JS',
//     status: 'active',
//   },
//   {
//     id: '2',
//     name: 'Sarah Johnson',
//     email: 'sarah@elegantspa.com',
//     role: 'Manager',
//     permissions: 'Manage Staff & Services',
//     avatar: 'SJ',
//     status: 'active',
//   },
//   {
//     id: '3',
//     name: 'Michael Brown',
//     email: 'michael@elegantspa.com',
//     role: 'Staff',
//     permissions: 'View Only',
//     avatar: 'MB',
//     status: 'active',
//   },
// ]

// const initialRoles = [
//   {
//     id: '1',
//     name: 'Owner',
//     description: 'Full system access with billing permissions',
//     permissions: ['all'],
//     color: 'blue',
//   },
//   {
//     id: '2',
//     name: 'Manager',
//     description: 'Manage staff, services, and bookings',
//     permissions: ['manage_staff', 'manage_services', 'manage_bookings', 'view_reports'],
//     color: 'purple',
//   },
//   {
//     id: '3',
//     name: 'Staff',
//     description: 'View assigned bookings and update availability',
//     permissions: ['view_bookings', 'update_availability'],
//     color: 'green',
//   },
// ]

// const initialNotificationSettings = {
//   emailNotifications: {
//     newBooking: true,
//     bookingCancellation: true,
//     paymentReceived: true,
//     customerReview: true,
//     dailySummary: false,
//     weeklySummary: true,
//   },
//   smsNotifications: {
//     newBooking: true,
//     bookingReminder: true,
//     paymentIssue: true,
//   },
//   pushNotifications: {
//     newBooking: true,
//     messages: true,
//     systemUpdates: false,
//   },
// }

// export default function TenantSettingsPage() {
//   const { user, loadingUser, requiresOnboarding, language, setLanguage } = useApp()
//   const router = useRouter()
  
//   const [activeTab, setActiveTab] = useState('business')
//   const [businessInfo, setBusinessInfo] = useState(initialBusinessInfo)
//   const [teamMembers, setTeamMembers] = useState(initialTeamMembers)
//   const [roles, setRoles] = useState(initialRoles)
//   const [notificationSettings, setNotificationSettings] = useState(initialNotificationSettings)
//   const [brandColors, setBrandColors] = useState({
//     primary: '#8B1E3F',
//     secondary: '#10B981',
//   })
//   const [saving, setSaving] = useState(false)

//   // Block back navigation
//   useBlockBackNavigation(!!user)

//   // Auth guard
//   useEffect(() => {
//     if (!loadingUser && !user) {
//       router.replace('/')
//     }
//   }, [loadingUser, user, router])

//   // Onboarding redirect
//   useEffect(() => {
//     if (requiresOnboarding) {
//       router.replace('/auth/onboarding?step=1')
//     }
//   }, [requiresOnboarding, router])

//   if (requiresOnboarding || loadingUser) {
//     return null
//   }

//   const handleSave = () => {
//     setSaving(true)
//     setTimeout(() => setSaving(false), 1000)
//   }

//   const toggleEmailNotification = (key) => {
//     setNotificationSettings((prev) => ({
//       ...prev,
//       emailNotifications: {
//         ...prev.emailNotifications,
//         [key]: !prev.emailNotifications[key],
//       },
//     }))
//   }

//   const toggleSmsNotification = (key) => {
//     setNotificationSettings((prev) => ({
//       ...prev,
//       smsNotifications: {
//         ...prev.smsNotifications,
//         [key]: !prev.smsNotifications[key],
//       },
//     }))
//   }

//   const getRoleColorClasses = (color) => {
//     const colors = {
//       blue: 'bg-blue-100 text-blue-600',
//       purple: 'bg-purple-100 text-purple-600',
//       green: 'bg-green-100 text-green-600',
//     }
//     return colors[color] || 'bg-gray-100 text-gray-600'
//   }

//   return (
//     <div className="space-y-6 p-6 bg-[#FAF5F7] min-h-screen">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
//           <p className="text-gray-600 mt-1">Manage your business settings and preferences</p>
//         </div>
//       </div>

//       {/* Tabs and Content */}
//       <div className="bg-white rounded-2xl border border-[#8B1E3F]/10 shadow-sm overflow-hidden">
//         {/* Tab Headers */}
//         <div className="border-b border-[#8B1E3F]/10 px-6 overflow-x-auto">
//           <div className="flex items-center gap-1 -mb-px min-w-max">
//             {tabs.map((tab) => {
//               const Icon = tab.icon
//               return (
//                 <button
//                   key={tab.key}
//                   onClick={() => setActiveTab(tab.key)}
//                   className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
//                     activeTab === tab.key
//                       ? 'border-[#8B1E3F] text-[#8B1E3F]'
//                       : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-[#8B1E3F]/30'
//                   }`}
//                 >
//                   <Icon className="w-4 h-4" />
//                   {tab.label}
//                 </button>
//               )
//             })}
//           </div>
//         </div>

//         {/* Tab Content */}
//         <div className="p-6">
//           {/* Business Info Tab */}
//           {activeTab === 'business' && (
//             <div className="space-y-6">
//               <div className="flex items-center gap-4 pb-6 border-b border-[#8B1E3F]/10">
//                 <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
//                   <Building2 className="w-10 h-10 text-white" />
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="text-lg font-bold text-gray-900">Business Logo</h3>
//                   <p className="text-sm text-gray-600">Upload your business logo (recommended: 512x512px)</p>
//                 </div>
//                 <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 transition-all shadow-sm">
//                   <Upload className="w-4 h-4" />
//                   Upload Logo
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     Business Name *
//                   </label>
//                   <input
//                     type="text"
//                     value={businessInfo.businessName}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     Email Address *
//                   </label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                     <input
//                       type="email"
//                       value={businessInfo.email}
//                       onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
//                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     Phone Number *
//                   </label>
//                   <div className="relative">
//                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                     <input
//                       type="tel"
//                       value={businessInfo.phone}
//                       onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
//                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     Website
//                   </label>
//                   <div className="relative">
//                     <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//                     <input
//                       type="url"
//                       value={businessInfo.website}
//                       onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
//                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
//                     />
//                   </div>
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     Street Address *
//                   </label>
//                   <div className="relative">
//                     <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//                     <input
//                       type="text"
//                       value={businessInfo.address}
//                       onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
//                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     City *
//                   </label>
//                   <input
//                     type="text"
//                     value={businessInfo.city}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     State / Province *
//                   </label>
//                   <input
//                     type="text"
//                     value={businessInfo.state}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     ZIP / Postal Code *
//                   </label>
//                   <input
//                     type="text"
//                     value={businessInfo.zipCode}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, zipCode: e.target.value })}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     Country *
//                   </label>
//                   <select
//                     value={businessInfo.country}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, country: e.target.value })}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white"
//                   >
//                     <option>United States</option>
//                     <option>Canada</option>
//                     <option>United Kingdom</option>
//                     <option>Australia</option>
//                   </select>
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-sm font-bold text-gray-700 mb-2">
//                     Business Description
//                   </label>
//                   <textarea
//                     value={businessInfo.description}
//                     onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
//                     rows={4}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all resize-none"
//                   />
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 pt-6 border-t border-[#8B1E3F]/10">
//                 <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all">
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   disabled={saving}
//                   className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 font-medium"
//                 >
//                   {saving ? (
//                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   ) : (
//                     <Save className="w-4 h-4" />
//                   )}
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Team Members Tab */}
//           {activeTab === 'team' && (
//             <div className="space-y-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
//                   <p className="text-sm text-gray-600">Manage who has access to your business</p>
//                 </div>
//                 <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium">
//                   <Plus className="w-4 h-4" />
//                   Add Member
//                 </button>
//               </div>

//               <div className="space-y-3">
//                 {teamMembers.map((member) => (
//                   <div
//                     key={member.id}
//                     className="p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all group"
//                   >
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
//                           <span className="text-white font-bold">{member.avatar}</span>
//                         </div>
//                         <div>
//                           <div className="font-bold text-gray-900">{member.name}</div>
//                           <div className="text-sm text-gray-600">{member.email}</div>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-6">
//                         <div className="text-right">
//                           <div className="text-sm font-bold text-[#8B1E3F]">{member.role}</div>
//                           <div className="text-xs text-gray-600">{member.permissions}</div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <button className="p-2 rounded-lg border border-gray-300 hover:bg-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 transition-all">
//                             <Edit2 className="w-4 h-4 text-gray-600" />
//                           </button>
//                           {member.role !== 'Owner' && (
//                             <button className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all">
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Roles & Permissions Tab */}
//           {activeTab === 'roles' && (
//             <div className="space-y-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-bold text-gray-900">Roles & Permissions</h3>
//                   <p className="text-sm text-gray-600">Define access levels for your team</p>
//                 </div>
//                 <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium">
//                   <Plus className="w-4 h-4" />
//                   Create Role
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {roles.map((role) => (
//                   <div
//                     key={role.id}
//                     className="p-6 rounded-xl border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all bg-white"
//                   >
//                     <div className="flex items-start justify-between mb-4">
//                       <div className={`w-10 h-10 rounded-xl ${getRoleColorClasses(role.color)} flex items-center justify-center`}>
//                         <Shield className="w-5 h-5" />
//                       </div>
//                       {role.name !== 'Owner' && (
//                         <button className="p-2 rounded-lg hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100">
//                           <Edit2 className="w-4 h-4 text-gray-600" />
//                         </button>
//                       )}
//                     </div>
//                     <h4 className="font-bold text-gray-900 mb-2">{role.name}</h4>
//                     <p className="text-sm text-gray-600 mb-4">{role.description}</p>
//                     <div className="space-y-2">
//                       {role.permissions.map((permission, index) => (
//                         <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
//                           <div className="w-1.5 h-1.5 rounded-full bg-[#8B1E3F]" />
//                           <span className="capitalize">{permission.replace(/_/g, ' ')}</span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Domain & Branding Tab */}
//           {activeTab === 'domain' && (
//             <div className="space-y-6">
//               <div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-4">Custom Domain</h3>
//                 <div className="p-6 rounded-xl border border-[#8B1E3F]/10 bg-gradient-to-r from-[#8B1E3F]/5 to-white">
//                   <div className="flex items-start gap-4 mb-4">
//                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md flex-shrink-0">
//                       <Globe className="w-6 h-6 text-white" />
//                     </div>
//                     <div className="flex-1">
//                       <h4 className="font-bold text-gray-900 mb-2">Booking Site URL</h4>
//                       <p className="text-sm text-gray-600 mb-4">
//                         Your current booking site URL. Upgrade to use your own domain.
//                       </p>
//                       <div className="flex items-center gap-3">
//                         <input
//                           type="text"
//                           value="elegant-spa.bookingpro.app"
//                           readOnly
//                           className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 font-mono text-sm"
//                         />
//                         <button className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 transition-all">
//                           Copy Link
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="pt-4 border-t border-[#8B1E3F]/10">
//                     <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium">
//                       <Key className="w-4 h-4" />
//                       Connect Custom Domain
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-4">Brand Colors</h3>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-2">Primary Color</label>
//                     <div className="flex items-center gap-3">
//                       <input
//                         type="color"
//                         value={brandColors.primary}
//                         onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
//                         className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer"
//                       />
//                       <input
//                         type="text"
//                         value={brandColors.primary}
//                         onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
//                         className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono"
//                       />
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-2">Secondary Color</label>
//                     <div className="flex items-center gap-3">
//                       <input
//                         type="color"
//                         value={brandColors.secondary}
//                         onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
//                         className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer"
//                       />
//                       <input
//                         type="text"
//                         value={brandColors.secondary}
//                         onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
//                         className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Language & Region Tab */}
//           {activeTab === 'language' && (
//             <div className="space-y-6">
//               <div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-4">Language Preferences</h3>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-2">
//                       Default Language
//                     </label>
//                     <select
//                       value={language}
//                       onChange={(e) => setLanguage(e.target.value)}
//                       className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white"
//                     >
//                       <option value="en">English</option>
//                       <option value="ar">العربية (Arabic)</option>
//                       <option value="ur">اردو (Urdu)</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-2">
//                       Timezone
//                     </label>
//                     <select className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white">
//                       <option>Eastern Time (ET) - UTC-5</option>
//                       <option>Central Time (CT) - UTC-6</option>
//                       <option>Mountain Time (MT) - UTC-7</option>
//                       <option>Pacific Time (PT) - UTC-8</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-2">
//                       Date Format
//                     </label>
//                     <select className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white">
//                       <option>MM/DD/YYYY</option>
//                       <option>DD/MM/YYYY</option>
//                       <option>YYYY-MM-DD</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-bold text-gray-700 mb-2">
//                       Time Format
//                     </label>
//                     <select className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white">
//                       <option>12-hour (AM/PM)</option>
//                       <option>24-hour</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 pt-6 border-t border-[#8B1E3F]/10">
//                 <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all">
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   disabled={saving}
//                   className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 font-medium"
//                 >
//                   {saving ? (
//                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   ) : (
//                     <Save className="w-4 h-4" />
//                   )}
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Notifications Tab */}
//           {activeTab === 'notifications' && (
//             <div className="space-y-6">
//               <div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-4">Email Notifications</h3>
//                 <div className="space-y-3">
//                   {Object.entries(notificationSettings.emailNotifications).map(([key, value]) => (
//                     <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 transition-all">
//                       <div>
//                         <div className="font-bold text-gray-900 capitalize">
//                           {key.replace(/([A-Z])/g, ' $1').trim()}
//                         </div>
//                         <div className="text-sm text-gray-600">
//                           Receive email when this event occurs
//                         </div>
//                       </div>
//                       <button
//                         onClick={() => toggleEmailNotification(key)}
//                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                           value ? 'bg-[#8B1E3F]' : 'bg-gray-200'
//                         }`}
//                       >
//                         <span
//                           className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                             value ? 'translate-x-6' : 'translate-x-1'
//                           }`}
//                         />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-4">SMS Notifications</h3>
//                 <div className="space-y-3">
//                   {Object.entries(notificationSettings.smsNotifications).map(([key, value]) => (
//                     <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 transition-all">
//                       <div>
//                         <div className="font-bold text-gray-900 capitalize">
//                           {key.replace(/([A-Z])/g, ' $1').trim()}
//                         </div>
//                         <div className="text-sm text-gray-600">
//                           Receive SMS when this event occurs
//                         </div>
//                       </div>
//                       <button
//                         onClick={() => toggleSmsNotification(key)}
//                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                           value ? 'bg-[#8B1E3F]' : 'bg-gray-200'
//                         }`}
//                       >
//                         <span
//                           className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                             value ? 'translate-x-6' : 'translate-x-1'
//                           }`}
//                         />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 pt-6 border-t border-[#8B1E3F]/10">
//                 <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all">
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   disabled={saving}
//                   className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 font-medium"
//                 >
//                   {saving ? (
//                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   ) : (
//                     <Save className="w-4 h-4" />
//                   )}
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import {
  Building2,
  Users,
  Shield,
  Globe,
  Languages,
  Bell,
  Save,
  Upload,
  Trash2,
  Plus,
  Edit2,
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Key,
  AlertCircle,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
import BillingSettings from '@/components/dashboard/billing/BillingSettings'

const tabs = [
  { key: 'business', label: 'Business Info', icon: Building2 },
  { key: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { key: 'team', label: 'Team Members', icon: Users },
  { key: 'roles', label: 'Roles & Permissions', icon: Shield },
  { key: 'domain', label: 'Domain & Branding', icon: Globe },
  { key: 'language', label: 'Language & Region', icon: Languages },
  { key: 'notifications', label: 'Notifications', icon: Bell },
]

const initialBusinessInfo = {
  businessName: 'Elegant Spa & Wellness',
  email: 'contact@elegantspa.com',
  phone: '+1 (555) 123-4567',
  address: '123 Main Street, Suite 100',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'United States',
  taxId: '12-3456789',
  website: 'https://elegantspa.com',
  description: 'Premium spa and wellness center offering a wide range of beauty and relaxation services.',
}

const initialTeamMembers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@elegantspa.com',
    role: 'Owner',
    permissions: 'Full Access',
    avatar: 'JS',
    status: 'active',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@elegantspa.com',
    role: 'Manager',
    permissions: 'Manage Staff & Services',
    avatar: 'SJ',
    status: 'active',
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael@elegantspa.com',
    role: 'Staff',
    permissions: 'View Only',
    avatar: 'MB',
    status: 'active',
  },
]

const initialRoles = [
  {
    id: '1',
    name: 'Owner',
    description: 'Full system access with billing permissions',
    permissions: ['all'],
    color: 'blue',
  },
  {
    id: '2',
    name: 'Manager',
    description: 'Manage staff, services, and bookings',
    permissions: ['manage_staff', 'manage_services', 'manage_bookings', 'view_reports'],
    color: 'purple',
  },
  {
    id: '3',
    name: 'Staff',
    description: 'View assigned bookings and update availability',
    permissions: ['view_bookings', 'update_availability'],
    color: 'green',
  },
]

const initialNotificationSettings = {
  emailNotifications: {
    newBooking: true,
    bookingCancellation: true,
    paymentReceived: true,
    customerReview: true,
    dailySummary: false,
    weeklySummary: true,
  },
  smsNotifications: {
    newBooking: true,
    bookingReminder: true,
    paymentIssue: true,
  },
  pushNotifications: {
    newBooking: true,
    messages: true,
    systemUpdates: false,
  },
}

export default function TenantSettingsPage() {
  const { user, loadingUser, requiresOnboarding, language, setLanguage } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Read initial tab from URL (supports ?tab=billing from Stripe redirect) ──
  const initialTab = searchParams.get('tab') || 'business'

  const [activeTab, setActiveTab] = useState(initialTab)
  const [businessInfo, setBusinessInfo] = useState(initialBusinessInfo)
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers)
  const [roles, setRoles] = useState(initialRoles)
  const [notificationSettings, setNotificationSettings] = useState(initialNotificationSettings)
  const [brandColors, setBrandColors] = useState({
    primary: '#8B1E3F',
    secondary: '#10B981',
  })
  const [saving, setSaving] = useState(false)

  // ── Sync tab changes to URL ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', activeTab)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
  }, [activeTab])

  // Block back navigation
  useBlockBackNavigation(!!user)

  // Auth guard
  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace('/')
    }
  }, [loadingUser, user, router])

  // Onboarding redirect
  useEffect(() => {
    if (requiresOnboarding) {
      router.replace('/auth/onboarding?step=1')
    }
  }, [requiresOnboarding, router])

  if (requiresOnboarding || loadingUser) {
    return null
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => setSaving(false), 1000)
  }

  const toggleEmailNotification = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: !prev.emailNotifications[key],
      },
    }))
  }

  const toggleSmsNotification = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      smsNotifications: {
        ...prev.smsNotifications,
        [key]: !prev.smsNotifications[key],
      },
    }))
  }

  const getRoleColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
    }
    return colors[color] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-6 p-6 bg-[#FAF5F7] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your business settings and preferences</p>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="bg-white rounded-2xl border border-[#8B1E3F]/10 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-[#8B1E3F]/10 px-6 overflow-x-auto">
          <div className="flex items-center gap-1 -mb-px min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-5 py-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-[#8B1E3F] text-[#8B1E3F]'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-[#8B1E3F]/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* ══════ BILLING TAB ══════ */}
          {activeTab === 'billing' && <BillingSettings />}

          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-[#8B1E3F]/10">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">Business Logo</h3>
                  <p className="text-sm text-gray-600">Upload your business logo (recommended: 512x512px)</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 transition-all shadow-sm">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Business Name *</label>
                  <input
                    type="text"
                    value={businessInfo.businessName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, businessName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={businessInfo.website}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Street Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={businessInfo.address}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={businessInfo.city}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">State / Province *</label>
                  <input
                    type="text"
                    value={businessInfo.state}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Business Description</label>
                  <textarea
                    value={businessInfo.description}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#8B1E3F]/10">
                <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 font-medium"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Team Members Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Team Members</h3>
                  <p className="text-sm text-gray-600">Manage who has access to your business</p>
                </div>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium">
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 hover:bg-[#8B1E3F]/5 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md">
                          <span className="text-white font-bold">{member.avatar}</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-600">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#8B1E3F]">{member.role}</div>
                          <div className="text-xs text-gray-600">{member.permissions}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-lg border border-gray-300 hover:bg-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 transition-all">
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          {member.role !== 'Owner' && (
                            <button className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roles & Permissions Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Roles & Permissions</h3>
                  <p className="text-sm text-gray-600">Define access levels for your team</p>
                </div>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium">
                  <Plus className="w-4 h-4" />
                  Create Role
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <div key={role.id} className="p-6 rounded-xl border border-[#8B1E3F]/10 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl ${getRoleColorClasses(role.color)} flex items-center justify-center`}>
                        <Shield className="w-5 h-5" />
                      </div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{role.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                    <div className="space-y-2">
                      {role.permissions.map((permission, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8B1E3F]" />
                          <span className="capitalize">{permission.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Domain & Branding Tab */}
          {activeTab === 'domain' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Custom Domain</h3>
                <div className="p-6 rounded-xl border border-[#8B1E3F]/10 bg-gradient-to-r from-[#8B1E3F]/5 to-white">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center shadow-md flex-shrink-0">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">Booking Site URL</h4>
                      <p className="text-sm text-gray-600 mb-4">Your current booking site URL.</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value="elegant-spa.bookingpro.app"
                          readOnly
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-600 font-mono text-sm"
                        />
                        <button className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 transition-all">
                          Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#8B1E3F]/10">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md font-medium">
                      <Key className="w-4 h-4" />
                      Connect Custom Domain
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Brand Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColors.primary}
                        onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                        className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandColors.primary}
                        onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={brandColors.secondary}
                        onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                        className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandColors.secondary}
                        onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Language & Region Tab */}
          {activeTab === 'language' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Language Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Default Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white"
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="ur">اردو (Urdu)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Timezone</label>
                    <select className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all bg-white">
                      <option>Eastern Time (ET) - UTC-5</option>
                      <option>Central Time (CT) - UTC-6</option>
                      <option>Pacific Time (PT) - UTC-8</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-[#8B1E3F]/10">
                <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 font-medium">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-3">
                  {Object.entries(notificationSettings.emailNotifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 transition-all">
                      <div>
                        <div className="font-bold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-sm text-gray-600">Receive email when this event occurs</div>
                      </div>
                      <button
                        onClick={() => toggleEmailNotification(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-[#8B1E3F]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">SMS Notifications</h3>
                <div className="space-y-3">
                  {Object.entries(notificationSettings.smsNotifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 transition-all">
                      <div>
                        <div className="font-bold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-sm text-gray-600">Receive SMS when this event occurs</div>
                      </div>
                      <button
                        onClick={() => toggleSmsNotification(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-[#8B1E3F]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-[#8B1E3F]/10">
                <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-md disabled:opacity-50 font-medium">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}