// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { useApp } from '@/contexts/AppContext'
// import {
//   Plus,
//   Search,
//   MoreVertical,
//   Edit,
//   Trash2,
//   Eye,
//   Clock,
//   DollarSign,
//   Tag,
//   Grid,
//   List,
//   Package,
//   Copy,
//   X,
//   RotateCcw,
//   Archive,
//   AlertTriangle
// } from 'lucide-react'
// import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
// import Cookies from "js-cookie";

// export default function ServicesPage() {
//   const { user, loadingUser, requiresOnboarding, activeTenant } = useApp()
//   const router = useRouter()

//   const [services, setServices] = useState([])
//   const [search, setSearch] = useState('')
//   const [view, setView] = useState('grid') // 'grid' | 'list'
//   const [viewMode, setViewMode] = useState('active') // 'active' | 'deleted'
//   const [selectedCategory, setSelectedCategory] = useState('all');
//   const [modalOpen, setModalOpen] = useState(false)
//   const [editing, setEditing] = useState(null)
//   const [menuOpenId, setMenuOpenId] = useState(null)
//   const [menuDirection, setMenuDirection] = useState('down')
//   const [activeTab, setActiveTab] = useState('basic')
//   const [serviceCategories, setServiceCategories] = useState([]);
//   const [deletedCount, setDeletedCount] = useState(0);
//   const tenantId = activeTenant;

//   const [form, setForm] = useState({
//     name: '',
//     category_id: "",
//     price: 0,
//     duration: 60,
//     description: '',
//     isActive: true,
//     serviceType: 'online',
//     maxCapacity: 1,
//     image: '',
//   })

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

//   const API_BASE = process.env.NEXT_PUBLIC_API_URL;

//   const authFetch = async (url, options = {}) => {
//     if (!tenantId) {
//       throw new Error("Tenant not ready yet");
//     }

//     const token = Cookies.get("access_token");

//     const res = await fetch(url, {
//       ...options,
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: token ? `Bearer ${token}` : "",
//         "X-Tenant": tenantId,
//         ...(options.headers || {}),
//       },
//     });

//     if (!res.ok) {
//       const error = await res.json();
//       throw error;
//     }
//     // handle DELETE / 204
//     if (res.status === 204) {
//       return null;
//     }

//     return res.json();
//   };

//   // Fetch services based on view mode
//   useEffect(() => {
//     if (!user || !activeTenant) return;

//     async function loadServices() {
//       try {
//         const endpoint = viewMode === 'deleted' 
//           ? `${API_BASE}/api/v1/services/deleted/`
//           : `${API_BASE}/api/v1/services/`;
          
//         const data = await authFetch(endpoint);
//         // console.log(`Fetched ${viewMode} services:`, data);
        
//         const normalized = (data.results || data).map((s) => ({
//           id: s.id,
//           slug: s.slug,
//           name: s.name?.en || "",
//           category: s.category_name?.en || s.category?.name?.en || "Uncategorized",
//           category_id: s.category?.id || s.category || "",
//           price: s.base_price,
//           duration: s.duration_minutes || 0,
//           description: s.short_description?.en || "",
//           isActive: s.is_active,
//           serviceType: s.service_type,
//           created_at: s.created_at,
//           deleted_at: s.deleted_at, // Track if deleted
//         }));

//         setServices(normalized);
        
//         // If in active mode, also fetch deleted count for stats
//         if (viewMode === 'active') {
//           try {
//             const deletedData = await authFetch(`${API_BASE}/api/v1/services/deleted/`);
//             setDeletedCount(deletedData.length || deletedData.results?.length || 0);
//           } catch (e) {
//             setDeletedCount(0);
//           }
//         }
//       } catch (e) {
//         console.error("Failed to load services", e);
//         if (viewMode === 'deleted') {
//           setServices([]); // Don't show error for empty recycle bin
//         }
//       }
//     }

//     loadServices();
//   }, [user, activeTenant, viewMode]);

//   useEffect(() => {
//     if (!activeTenant) return;

//     authFetch(`${API_BASE}/api/v1/service-categories/`)
//       .then((data) => {
//         console.log("Fetched categories:", data);
//         setServiceCategories(data.results || []);
//       })
//       .catch((err) => {
//         console.error("Failed to load categories", err);
//         setServiceCategories([]);
//       });
//   }, [activeTenant]);

//   const filtered = services.filter((s) => {
//     const matchText =
//       s.name.toLowerCase().includes(search.toLowerCase()) ||
//       s.description.toLowerCase().includes(search.toLowerCase());

//     const matchCat =
//       selectedCategory === 'all' || s.category === selectedCategory;

//     return matchText && matchCat;
//   });

//   // Stats calculation
//   const stats = [
//     {
//       label: viewMode === 'deleted' ? 'Deleted Services' : 'Total Services',
//       value: services.length,
//       icon: viewMode === 'deleted' ? Archive : Package,
//       color: 'from-primary to-primary/80',
//       bgColor: viewMode === 'deleted' ? 'bg-red-100' : 'bg-[#8B1E3F]/10',
//       textColor: viewMode === 'deleted' ? 'text-red-600' : 'text-[#8B1E3F]',
//     },
//     {
//       label: 'Active',
//       value: viewMode === 'deleted' ? 0 : services.filter((s) => s.isActive).length,
//       icon: Eye,
//       color: 'from-green-500 to-green-600',
//       bgColor: 'bg-green-100',
//       textColor: 'text-green-600',
//     },
//     {
//       label: 'Inactive',
//       value: viewMode === 'deleted' ? 0 : services.filter((s) => !s.isActive).length,
//       icon: Eye,
//       color: 'from-gray-400 to-gray-500',
//       bgColor: 'bg-gray-100',
//       textColor: 'text-gray-600',
//     },
//     {
//       label: viewMode === 'deleted' ? 'Can Restore' : 'In Recycle Bin',
//       value: viewMode === 'deleted' ? services.length : deletedCount,
//       icon: viewMode === 'deleted' ? RotateCcw : Archive,
//       color: 'from-purple-500 to-purple-600',
//       bgColor: 'bg-purple-100',
//       textColor: 'text-purple-600',
//       onClick: () => setViewMode(viewMode === 'deleted' ? 'active' : 'deleted'),
//       clickable: true,
//     },
//   ];

//   const handleSave = async () => {
//     try {
//       const payload = {
//         name: { en: form.name },
//         description: { en: form.description },
//         category: form.category_id || null,
//         base_price: form.price,
//         duration_minutes: form.duration,
//         service_type: form.serviceType,
//         is_active: form.isActive,
//         image: form.image,
//       };

//       let saved;

//       if (editing) {
//         if (!editing.slug) {
//           alert("Service slug missing. Please refresh.");
//           return;
//         }

//         saved = await authFetch(
//           `${API_BASE}/api/v1/services/${editing.slug}/`,
//           {
//             method: "PATCH",
//             body: JSON.stringify(payload),
//           }
//         );
//       } else {
//         saved = await authFetch(
//           `${API_BASE}/api/v1/services/`,
//           {
//             method: "POST",
//             body: JSON.stringify(payload),
//           }
//         );
//       }

//       if (!saved.slug) {
//         throw new Error("Save response missing slug");
//       }

//       // Re-fetch detail
//       const fresh = await authFetch(
//         `${API_BASE}/api/v1/services/${saved.slug}/`
//       );

//       const normalizedService = {
//         id: fresh.id,
//         slug: fresh.slug,
//         name: fresh.name?.en || "",
//         category: fresh.category?.name?.en || "Uncategorized",
//         category_id: fresh.category?.id || "",
//         price: fresh.base_price,
//         duration: fresh.duration_minutes || 0,
//         description: fresh.short_description?.en || fresh.description?.en || "",
//         isActive: fresh.is_active,
//         serviceType: fresh.service_type,
//         image: fresh.image || "",
//         created_at: fresh.created_at,
//         is_featured: fresh.is_featured,
//       };

//       // ✅ FIX: Maintain position when editing, append when creating
//       setServices((prev) => {
//         if (editing) {
//           // Replace in-place to maintain order
//           return prev.map((s) => s.id === saved.id ? normalizedService : s);
//         } else {
//           // Add new service to beginning (newest first)
//           return [normalizedService, ...prev];
//         }
//       });

//       setModalOpen(false);
//       setEditing(null);
//       resetForm();

//     } catch (err) {
//       console.error(err);
//       alert("Failed to save service");
//     }
//   };

//   const resetForm = () => {
//     setForm({
//       name: '',
//       category_id: '',
//       price: 0,
//       duration: 60,
//       description: '',
//       isActive: true,
//       serviceType: 'online',
//       maxCapacity: 1,
//       image: '',
//     })
//     setMenuOpenId(null);
//   }

//   const handleEdit = (service) => {
//     setEditing(service);
//     setForm({
//       name: service.name,
//       category_id: service.category_id || "",
//       price: service.price,
//       duration: service.duration,
//       description: service.description,
//       isActive: service.isActive,
//       serviceType: service.serviceType,
//       image: service.image || "",
//     });
//     setModalOpen(true);
//   };

//   const handleDuplicate = async (service) => {
//     try {
//       const res = await authFetch(
//         `${API_BASE}/api/v1/services/${service.slug}/duplicate/`,
//         { method: "POST" }
//       );

//       const newService = {
//         id: res.service.id,
//         slug: res.service.slug,
//         name: res.service.name.en,
//         category: res.service.category?.name?.en || "Uncategorized",
//         category_id: res.service.category?.id || "",
//         price: res.service.base_price,
//         duration: res.service.duration_minutes || 0,
//         description: res.service.description?.en || "",
//         isActive: res.service.is_active,
//         serviceType: res.service.service_type,
//       };

//       // Insert after the original service
//       setServices((prev) => {
//         const index = prev.findIndex((s) => s.id === service.id);
//         if (index >= 0) {
//           const newServices = [...prev];
//           newServices.splice(index + 1, 0, newService);
//           return newServices;
//         }
//         return [newService, ...prev];
//       });
      
//     } catch (err) {
//       alert("Duplicate failed: " + (err.message || "Unknown error"));
//     }
//   };

//   const handleToggleActive = async (service) => {
//     console.log("Toggling active status for service:", service);
//     try {
//       const res = await authFetch(
//         `${API_BASE}/api/v1/services/${service.slug}/toggle_active/`,
//         { method: "POST" }
//       );

//       setServices((prev) =>
//         prev.map((s) =>
//           s.id === service.id ? { ...s, isActive: res.is_active } : s
//         )
//       );
//     } catch {
//       alert("Failed to update status");
//     }
//   };

//   // Soft Delete (Move to Recycle Bin)
//   const handleDelete = async (service) => {
//     if (!confirm(viewMode === 'deleted' 
//       ? "Permanently delete this service? This cannot be undone." 
//       : "Delete this service? It will be moved to the Recycle Bin."
//     )) return;

//     try {
//       if (viewMode === 'deleted') {
//         // Permanent delete (optional - if your backend supports hard delete)
//         // For now, we'll just restore it and then soft delete again if needed
//         // Or you can add a permanent delete endpoint
//        await authFetch(
//           `${API_BASE}/api/v1/services/${service.slug}/permanent_delete/`,
//           { method: "DELETE" }
//         );
//       } else {
//         // Soft delete
//         await authFetch(`${API_BASE}/api/v1/services/${service.slug}/`, {
//           method: "DELETE",
//         });
//       }

//       setServices((prev) => prev.filter((s) => s.id !== service.id));
      
//       if (viewMode === 'active') {
//         setDeletedCount(prev => prev + 1);
//       }
//     } catch (err) {
//       alert(err.message || "Delete failed");
//     }
//   };

//   // Restore from Recycle Bin
//   const handleRestore = async (service) => {
//     try {
//       await authFetch(
//         `${API_BASE}/api/v1/services/${service.slug}/restore/`,
//         { method: "POST" }
//       );

//       // Remove from current (deleted) list
//       setServices((prev) => prev.filter((s) => s.id !== service.id));
//       setDeletedCount(prev => Math.max(0, prev - 1));
      
//       // Optionally switch back to active view if no more deleted items
//       if (services.length <= 1) {
//         // Keep them in deleted view but show empty state
//       }
//     } catch (err) {
//       alert("Restore failed: " + (err.message || "Unknown error"));
//     }
//   };

//   const openAddModal = () => {
//     setEditing(null)
//     resetForm()
//     setModalOpen(true)
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">
//             {viewMode === 'deleted' ? 'Recycle Bin' : 'Services'}
//           </h1>
//           <p className="text-gray-600 mt-1">
//             {viewMode === 'deleted' 
//               ? 'Restore or permanently delete services' 
//               : 'Manage your services and pricing'}
//           </p>
//         </div>

//         <div className="flex gap-3">
//           {/* Toggle View Mode */}
//           <button
//             onClick={() => setViewMode(viewMode === 'deleted' ? 'active' : 'deleted')}
//             className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium shadow-sm transition-all ${
//               viewMode === 'deleted'
//                 ? 'bg-green-600 text-white hover:bg-green-700'
//                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//             }`}
//           >
//             {viewMode === 'deleted' ? (
//               <>
//                 <Eye className="w-4 h-4" />
//                 View Active
//               </>
//             ) : (
//               <>
//                 <Archive className="w-4 h-4" />
//                 Recycle Bin {deletedCount > 0 && `(${deletedCount})`}
//               </>
//             )}
//           </button>

//           {viewMode === 'active' && (
//             <button
//               onClick={openAddModal}
//               className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 transition-opacity font-medium shadow-sm"
//             >
//               <Plus className="w-4 h-4" />
//               Add Service
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         {stats.map((stat, i) => {
//           const Icon = stat.icon
//           return (
//             <div
//               key={i}
//               onClick={stat.clickable ? stat.onClick : undefined}
//               className={`bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow ${
//                 stat.clickable ? 'cursor-pointer hover:border-purple-300' : ''
//               }`}
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600">{stat.label}</p>
//                   <p className="text-2xl font-bold text-gray-900 mt-1">
//                     {stat.value}
//                   </p>
//                 </div>
//                 <div
//                   className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
//                 >
//                   <Icon className={`w-6 h-6 ${stat.textColor}`} />
//                 </div>
//               </div>
//             </div>
//           )
//         })}
//       </div>

//       {/* Warning for deleted view */}
//       {viewMode === 'deleted' && (
//         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
//           <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
//           <div className="text-sm text-yellow-800">
//             <p className="font-medium">Recycle Bin</p>
//             <p>Services here are inactive and hidden from customers. You can restore them or permanently delete them.</p>
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="bg-white border border-gray-200 rounded-xl p-4">
//         <div className="flex flex-col md:flex-row gap-4">
//           {/* Search */}
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder={viewMode === 'deleted' ? "Search deleted services..." : "Search services..."}
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//             />
//           </div>

//           {/* Category Filter - only show in active mode */}
//           {viewMode === 'active' && (
//             <select
//               value={selectedCategory}
//               onChange={(e) => setSelectedCategory(e.target.value)}
//               className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white"
//             >
//               <option value="all">All Categories</option>
//               {serviceCategories.map((cat) => (
//                 <option key={cat.id} value={cat.name.en}>
//                   {cat.name.en}
//                 </option>
//               ))}
//             </select>
//           )}

//           {/* View Toggle */}
//           <div className="flex gap-2">
//             <button
//               onClick={() => setView('grid')}
//               className={`p-3 rounded-xl border transition-all ${
//                 view === 'grid'
//                   ? 'bg-primary text-white border-primary'
//                   : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
//               }`}
//             >
//               <Grid className="w-5 h-5" />
//             </button>
//             <button
//               onClick={() => setView('list')}
//               className={`p-3 rounded-xl border transition-all ${
//                 view === 'list'
//                   ? 'bg-primary text-white border-primary'
//                   : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
//               }`}
//             >
//               <List className="w-5 h-5" />
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Content */}
//       {viewMode === 'deleted' && services.length === 0 ? (
//         <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
//           <Archive className="w-16 h-16 mx-auto text-gray-300 mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">Recycle Bin is empty</h3>
//           <p className="text-gray-500 mb-6">Deleted services will appear here</p>
//           <button
//             onClick={() => setViewMode('active')}
//             className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 font-medium transition-colors"
//           >
//             <Eye className="w-4 h-4" />
//             Back to Services
//           </button>
//         </div>
//       ) : (
//         <>
//           {/* Grid View */}
//           {view === 'grid' && (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {filtered.map((service) => (
//                 <ServiceCard
//                   key={service.id}
//                   service={service}
//                   viewMode={viewMode}
//                   menuOpenId={menuOpenId}
//                   setMenuOpenId={setMenuOpenId}
//                   menuDirection={menuDirection}
//                   setMenuDirection={setMenuDirection}
//                   onEdit={handleEdit}
//                   onDuplicate={handleDuplicate}
//                   onToggleActive={handleToggleActive}
//                   onDelete={handleDelete}
//                   onRestore={handleRestore}
//                 />
//               ))}
//             </div>
//           )}

//           {/* List View */}
//           {view === 'list' && (
//             <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
//               <div className="overflow-x-auto">
//                 <table className="w-full text-sm">
//                   <thead className="bg-gray-50 border-b border-gray-200">
//                     <tr>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Service
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Category
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Price
//                       </th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Type
//                       </th>
//                       {viewMode === 'active' && (
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                           Status
//                         </th>
//                       )}
//                       <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                         Actions
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="bg-white divide-y divide-gray-200">
//                     {filtered.map((service) => (
//                       <ServiceRow
//                         key={service.id}
//                         service={service}
//                         viewMode={viewMode}
//                         menuOpenId={menuOpenId}
//                         setMenuOpenId={setMenuOpenId}
//                         menuDirection={menuDirection}
//                         setMenuDirection={setMenuDirection}
//                         onEdit={handleEdit}
//                         onDuplicate={handleDuplicate}
//                         onToggleActive={handleToggleActive}
//                         onDelete={handleDelete}
//                         onRestore={handleRestore}
//                       />
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}
//         </>
//       )}

//       {/* Modal - only for active mode */}
//       {modalOpen && viewMode === 'active' && (
//         <ServiceModal
//           editing={editing}
//           form={form}
//           setForm={setForm}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           categories={serviceCategories}
//           onSave={handleSave}
//           onClose={() => {
//             setModalOpen(false)
//             setEditing(null)
//             resetForm()
//           }}
//         />
//       )}
//     </div>
//   )
// }

// // Service Card Component
// function ServiceCard({
//   service,
//   viewMode,
//   menuOpenId,
//   setMenuOpenId,
//   menuDirection,
//   setMenuDirection,
//   onEdit,
//   onDuplicate,
//   onToggleActive,
//   onDelete,
//   onRestore,
// }) {
//   const isDeleted = viewMode === 'deleted';
  
//   return (
//     <div
//       className={`relative bg-white border-2 rounded-xl p-5 transition-all ${
//         isDeleted
//           ? 'border-red-100 bg-red-50/30'
//           : service.isActive
//           ? 'border-gray-200 hover:border-primary/30 hover:shadow-lg'
//           : 'border-gray-100 bg-gray-50'
//       }`}
//     >
//       {/* Header */}
//       <div className="flex items-start justify-between mb-4">
//         <div className="flex-1">
//           <div className="flex items-center gap-2 mb-2">
//             <h3 className="font-semibold text-gray-900">{service.name}</h3>
//             {isDeleted && (
//               <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
//                 Deleted
//               </span>
//             )}
//             {!isDeleted && !service.isActive && (
//               <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
//                 Inactive
//               </span>
//             )}
//           </div>
//           <span className="inline-block px-2 py-1 bg-accent text-accent-foreground text-xs rounded-md border border-gray-200">
//             {service.category}
//           </span>
//         </div>

//         {/* Menu */}
//         <div className="relative">
//           <button
//             onClick={(e) => {
//               const rect = e.currentTarget.getBoundingClientRect()
//               const spaceBelow = window.innerHeight - rect.bottom
//               const spaceAbove = rect.top
//               setMenuDirection(
//                 spaceBelow < 200 && spaceAbove > spaceBelow ? 'up' : 'down'
//               )
//               setMenuOpenId(menuOpenId === service.id ? null : service.id)
//             }}
//             className="p-2 rounded-lg hover:bg-gray-100 transition"
//           >
//             <MoreVertical className="w-4 h-4" />
//           </button>

//           {menuOpenId === service.id && (
//             <DropdownMenu
//               direction={menuDirection}
//               viewMode={viewMode}
//               onEdit={() => onEdit(service)}
//               onDuplicate={() => onDuplicate(service)}
//               onToggleActive={() => onToggleActive(service)}
//               onDelete={() => onDelete(service)}
//               onRestore={() => onRestore(service)}
//               isActive={service.isActive}
//             />
//           )}
//         </div>
//       </div>

//       {/* Description */}
//       <p className="text-sm text-gray-600 mb-4 line-clamp-2">
//         {service.description}
//       </p>

//       {/* Footer */}
//       <div className="flex items-center justify-between pt-4 border-t border-gray-200">
//         <div className="flex items-center gap-4 text-sm text-gray-600">
//           <div className="flex items-center gap-1">
//             <DollarSign className="w-4 h-4" />
//             <span className="font-medium">${service.price}</span>
//           </div>
//           {service.duration > 0 && (
//             <div className="flex items-center gap-1">
//               <Clock className="w-4 h-4" />
//               <span>{service.duration}m</span>
//             </div>
//           )}
//         </div>
//         <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md capitalize">
//           {service.serviceType}
//         </span>
//       </div>
//     </div>
//   )
// }

// // Service Row Component
// function ServiceRow({
//   service,
//   viewMode,
//   menuOpenId,
//   setMenuOpenId,
//   menuDirection,
//   setMenuDirection,
//   onEdit,
//   onDuplicate,
//   onToggleActive,
//   onDelete,
//   onRestore,
// }) {
//   const isDeleted = viewMode === 'deleted';
  
//   return (
//     <tr className={isDeleted ? 'bg-red-50/30' : !service.isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}>
//       <td className="px-6 py-4 whitespace-nowrap">
//         <div className="font-medium text-gray-900">{service.name}</div>
//         <div className="text-sm text-gray-500 truncate max-w-xs">
//           {service.description}
//         </div>
//       </td>
//       <td className="px-6 py-4 whitespace-nowrap">
//         <span className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-md border border-gray-200">
//           {service.category}
//         </span>
//       </td>
//       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//         ${service.price}
//       </td>
//       <td className="px-6 py-4 whitespace-nowrap">
//         <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md capitalize">
//           {service.serviceType}
//         </span>
//       </td>
//       {!isDeleted && (
//         <td className="px-6 py-4 whitespace-nowrap">
//           <span
//             className={`px-2 py-1 text-xs font-medium rounded-full ${
//               service.isActive
//                 ? 'bg-green-100 text-green-700'
//                 : 'bg-gray-100 text-gray-600'
//             }`}
//           >
//             {service.isActive ? 'Active' : 'Inactive'}
//           </span>
//         </td>
//       )}
//       <td className="px-6 py-4 whitespace-nowrap text-right">
//         <div className="relative inline-block">
//           <button
//             onClick={(e) => {
//               const rect = e.currentTarget.getBoundingClientRect()
//               const spaceBelow = window.innerHeight - rect.bottom
//               const spaceAbove = rect.top
//               setMenuDirection(
//                 spaceBelow < 200 && spaceAbove > spaceBelow ? 'up' : 'down'
//               )
//               setMenuOpenId(menuOpenId === service.id ? null : service.id)
//             }}
//             className="p-2 rounded-lg hover:bg-gray-100 transition"
//           >
//             <MoreVertical className="w-4 h-4" />
//           </button>

//           {menuOpenId === service.id && (
//             <DropdownMenu
//               direction={menuDirection}
//               viewMode={viewMode}
//               onEdit={() => onEdit(service)}
//               onDuplicate={() => onDuplicate(service)}
//               onToggleActive={() => onToggleActive(service)}
//               onDelete={() => onDelete(service)}
//               onRestore={() => onRestore(service)}
//               isActive={service.isActive}
//             />
//           )}
//         </div>
//       </td>
//     </tr>
//   )
// }

// // Dropdown Menu Component
// function DropdownMenu({
//   direction,
//   viewMode,
//   onEdit,
//   onDuplicate,
//   onToggleActive,
//   onDelete,
//   onRestore,
//   isActive,
// }) {
//   const isDeleted = viewMode === 'deleted';
  
//   return (
//     <div
//       className={`absolute right-0 z-50 w-44 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in
//         ${
//         direction === 'up'
//             ? 'bottom-5 origin-bottom'
//             : 'top-10 origin-top'
//         }`}
//     >
//       {isDeleted ? (
//         // Deleted mode actions
//         <>
//           <button
//             onClick={onRestore}
//             className="w-full px-4 py-2 flex items-center gap-2 text-sm text-green-700 hover:bg-green-50 transition"
//           >
//             <RotateCcw className="w-4 h-4" />
//             Restore
//           </button>
//           <div className="border-t border-gray-200 my-1"></div>
//           <button
//             onClick={onDelete}
//             className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition"
//           >
//             <Trash2 className="w-4 h-4" />
//             Delete Forever
//           </button>
//         </>
//       ) : (
//         // Active mode actions
//         <>
//           <button
//             onClick={onEdit}
//             className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition"
//           >
//             <Edit className="w-4 h-4" />
//             Edit
//           </button>
//           <button
//             onClick={onDuplicate}
//             className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition"
//           >
//             <Copy className="w-4 h-4" />
//             Duplicate
//           </button>
//           <button
//             onClick={onToggleActive}
//             className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition"
//           >
//             <Eye className="w-4 h-4" />
//             {isActive ? 'Deactivate' : 'Activate'}
//           </button>
//           <div className="border-t border-gray-200 my-1"></div>
//           <button
//             onClick={onDelete}
//             className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition"
//           >
//             <Trash2 className="w-4 h-4" />
//             Move to Bin
//           </button>
//         </>
//       )}
//     </div>
//   )
// }

// // Service Modal Component (unchanged from your original)
// function ServiceModal({
//   editing,
//   form,
//   setForm,
//   activeTab,
//   setActiveTab,
//   categories,
//   onSave,
//   onClose,
// }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//       <div
//         className="absolute inset-0 bg-black/50 backdrop-blur-sm"
//         onClick={onClose}
//       />
//       <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//           <h2 className="text-xl font-semibold text-gray-900">
//             {editing ? 'Edit Service' : 'Add New Service'}
//           </h2>
//           <button
//             onClick={onClose}
//             className="p-2 rounded-lg hover:bg-gray-100 transition"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Tabs */}
//         <div className="px-6 pt-4 border-b border-gray-200">
//           <div className="flex gap-4">
//             <button
//               onClick={() => setActiveTab('basic')}
//               className={`pb-3 px-1 font-medium transition-all ${
//                 activeTab === 'basic'
//                   ? 'text-primary border-b-2 border-primary'
//                   : 'text-gray-500 hover:text-gray-700'
//               }`}
//             >
//               Basic Info
//             </button>
//             <button
//               onClick={() => setActiveTab('advanced')}
//               className={`pb-3 px-1 font-medium transition-all ${
//                 activeTab === 'advanced'
//                   ? 'text-primary border-b-2 border-primary'
//                   : 'text-gray-500 hover:text-gray-700'
//               }`}
//             >
//               Advanced
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto px-6 py-6">
//           {activeTab === 'basic' && (
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Service Name *
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g., Haircut & Style"
//                   value={form.name}
//                   onChange={(e) => setForm({ ...form, name: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Category *
//                 </label>
//                 <select
//                   value={form.category_id}
//                   onChange={(e) =>
//                     setForm({ ...form, category_id: e.target.value })
//                   }
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white"
//                 >
//                   <option value="">Select category</option>
//                   {categories.map((c) => (
//                     <option key={c.id} value={c.id}>
//                       {c.name.en}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Price ($) *
//                   </label>
//                   <input
//                     type="number"
//                     placeholder="0.00"
//                     value={form.price}
//                     onChange={(e) =>
//                       setForm({ ...form, price: parseFloat(e.target.value) || 0 })
//                     }
//                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Duration (minutes)
//                   </label>
//                   <input
//                     type="number"
//                     placeholder="60"
//                     value={form.duration}
//                     onChange={(e) =>
//                       setForm({ ...form, duration: parseInt(e.target.value) || 0 })
//                     }
//                     className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Description
//                 </label>
//                 <textarea
//                   placeholder="Brief description of the service..."
//                   value={form.description}
//                   onChange={(e) =>
//                     setForm({ ...form, description: e.target.value })
//                   }
//                   rows={4}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
//                 />
//               </div>
//             </div>
//           )}

//           {activeTab === 'advanced' && (
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Service Type
//                 </label>
//                 <select
//                   value={form.serviceType}
//                   onChange={(e) =>
//                     setForm({ ...form, serviceType: e.target.value })
//                   }
//                   className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white"
//                 >
//                   <option value="online">Online Service</option>
//                   <option value="digital">Digital Service</option>
//                 </select>
//               </div>

//               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-900">
//                     Active Status
//                   </label>
//                   <p className="text-sm text-gray-500 mt-1">
//                     Make this service visible to customers
//                   </p>
//                 </div>
//                 <button
//                   onClick={() =>
//                     setForm({ ...form, isActive: !form.isActive })
//                   }
//                   className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
//                     form.isActive ? 'bg-primary' : 'bg-gray-300'
//                   }`}
//                 >
//                   <span
//                     className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
//                       form.isActive ? 'translate-x-6' : 'translate-x-1'
//                     }`}
//                   />
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onSave}
//             className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 transition font-medium shadow-sm"
//           >
//             {editing ? 'Update Service' : 'Add Service'}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }