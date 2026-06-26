'use client';

import { useState } from 'react';
import { Plus, Check, Clock, MoreVertical, Loader2, AlertCircle, MapPin, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/provider/DashboardLayout';
import RequestServiceModal from '@/components/provider/RequestServiceModal';
import { useProviderServices } from './hooks/useProviderServices';
import { useApp } from '@/contexts/AppContext';

export default function ServicesPage() {
  const router = useRouter();
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState('my-services');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const {
    myServices,
    availableServices,
    requests,
    enableService,
    disableService,
    myServicesLoading,
    availableLoading,
    requestsLoading,
    myServicesError,
    availableError,
    requestsError,
  } = useProviderServices();

  // Stats calculation with safe defaults
  const digitalCount = myServices.filter(s => 
    s.service?.service_type === 'digital' || s.type === t('services_digital_service')
  ).length;
  const onlineCount = myServices.filter(s => 
    s.service?.service_type === 'online' || s.type === t('services_online_service')
  ).length;

  const tabs = [
    { id: 'my-services', label: `${t('services_tab_my')} (${myServices.length})` },
    { id: 'available', label: `${t('services_tab_available')} (${availableServices.length})` },
    { id: 'requests', label: `${t('services_tab_requests')} (${requests.length})` },
  ];

  const handleEnable = async (serviceId) => {
    const success = await enableService(serviceId);
    if (success) {
      console.log(t('services_toast_enabled'));
    }
  };

  const handleDisable = async (serviceId) => {
    const success = await disableService(serviceId);
    if (success) {
      console.log(t('services_toast_disabled'));
    }
  };

  return (
    <DashboardLayout pageName={t('services_page_title')}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">
              {t('services_page_title')}
            </h1>
            <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">
              {t('services_page_subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-gradient-to-b from-[#800020] to-[#600018] h-[36px] px-4 rounded-[10px] shadow-md flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:shadow-lg transition-all w-full sm:w-auto"
          >
            <Plus size={16} />
            {t('services_request_new')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <ServiceStatCard 
            label={t('services_stat_active')} 
            value={myServices.length} 
            gradient="from-[#800020] to-[#600018]" 
            icon={<Check size={20} />}
          />
          <ServiceStatCard 
            label={t('services_stat_digital')} 
            value={digitalCount} 
            color="bg-[#7e0120]" 
            icon={<Globe size={20} />}
          />
          <ServiceStatCard 
            label={t('services_stat_online')} 
            value={onlineCount} 
            gradient="from-[#00c950] to-[#00a63e]" 
            icon={<MapPin size={20} />}
          />
        </div>

        {/* Tabs */}
        <div className="bg-[#f3f4f6] flex gap-2 p-1 rounded-[16px] w-full overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-[40px] rounded-[12px] px-4 whitespace-nowrap flex-shrink-0 transition-all ${
                activeTab === tab.id 
                  ? 'bg-white shadow-sm text-[#101828]' 
                  : 'text-[#4a5565] hover:bg-white/50'
              }`}
            >
              <span className="text-[14px] md:text-[16px]">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'my-services' && (
            <MyServicesTab 
              services={myServices} 
              loading={myServicesLoading}
              error={myServicesError}
              onDisable={handleDisable}
            />
          )}

          {activeTab === 'available' && (
            <AvailableTab 
              services={availableServices}
              loading={availableLoading}
              error={availableError}
              onEnable={handleEnable}
            />
          )}

          {activeTab === 'requests' && (
            <RequestsTab 
              requests={requests}
              loading={requestsLoading}
              error={requestsError}
            />
          )}
        </div>
      </div>

      {showRequestModal && (
        <RequestServiceModal 
          availableServices={availableServices || []}
          onClose={() => setShowRequestModal(false)} 
        />
      )}
    </DashboardLayout>
  );
}

// ==========================
// SUB-COMPONENTS
// ==========================

function MyServicesTab({ services = [], loading, error, onDisable }) {
  const { t } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#800020]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="mr-2" size={20} />
        <span>{t('services_error_loading')}: {error}</span>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#4a5565]">
        <Check size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium">{t('services_empty_my_title')}</p>
        <p className="text-sm">{t('services_empty_my_subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {services.map((item) => {
        const service = item.service || item;
        const title = item.title || service.name?.en || service.name || t('services_unnamed');
        const category = item.category || (service.category?.name?.en || service.category?.name) || t('services_general');
        const type = item.type || (service.service_type === 'digital' ? t('services_digital_service') : t('services_online_service'));
        const description = item.description || service.short_description?.en || service.description?.en || t('services_no_description');
        const deliveryTime = item.delivery_time || 
          (service.service_type === 'digital' 
            ? `${service.default_delivery_days || 3} ${t('services_days')}`
            : `${service.duration_minutes || 60} ${t('services_min')}`);
        const price = item.price || `$${service.base_price || 0}`;

        return (
          <div key={item.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6 flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <div className="rounded-[16px] size-10 md:size-12 bg-green-50 flex items-center justify-center shrink-0">
                <Check className="text-[#00A63E]" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] text-[#101828] font-semibold leading-[24px] mb-1 truncate">
                  {title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#dbeafe] border border-[#bedbff] text-[#1447e6] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
                    {type}
                  </span>
                  <span className="border border-[rgba(0,0,0,0.08)] text-[#1a1a1a] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
                    {category}
                  </span>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={16} className="text-[#364153]" />
              </button>
            </div>
            
            <p className="text-[14px] text-[#4a5565] leading-[20px] line-clamp-2">{description}</p>
            
            <div className="border-t border-[#f3f4f6] pt-4 flex items-center justify-between">
              <div className="flex gap-4 items-center text-[14px]">
                <div className="flex items-center gap-1 text-[#364153]">
                  <Clock size={14} />
                  <span>{deliveryTime}</span>
                </div>
                <span className="text-[#101828] font-semibold">{price}</span>
              </div>
              <button 
                onClick={() => onDisable(service.id)}
                className="bg-white border border-[#ffc9c9] h-8 px-3 rounded-[10px] text-[#e7000b] text-[14px] font-medium hover:bg-red-50 transition-colors"
              >
                {t('services_disable')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AvailableTab({ services = [], loading, error, onEnable }) {
  const { t } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#800020]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="mr-2" size={20} />
        <span>{t('services_error_available')}: {error}</span>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#4a5565]">
        <Check size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium">{t('services_empty_available_title')}</p>
        <p className="text-sm">{t('services_empty_available_subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {services.map((service) => {
        const name = service.name?.en || service.name || t('services_unnamed');
        const categoryName = service.category?.name?.en || service.category?.name || t('services_general');
        const description = service.short_description?.en || service.description?.en || t('services_no_description_available');
        const deliveryTime = service.service_type === 'digital' 
          ? `${service.default_delivery_days || 3} ${t('services_days')}`
          : `${service.duration_minutes || 60} ${t('services_min')}`;

        return (
          <div key={service.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6 flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <div className="rounded-[16px] size-10 md:size-12 bg-blue-50 flex items-center justify-center shrink-0">
                <Plus className="text-[#1447e6]" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] text-[#101828] font-semibold leading-[24px] mb-1 truncate">
                  {name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#dbeafe] border border-[#bedbff] text-[#1447e6] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
                    {service.service_type === 'digital' ? t('services_digital_service') : t('services_online_service')}
                  </span>
                  {categoryName && (
                    <span className="border border-[rgba(0,0,0,0.08)] text-[#1a1a1a] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
                      {categoryName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-[14px] text-[#4a5565] leading-[20px] line-clamp-2">{description}</p>
            
            <div className="border-t border-[#f3f4f6] pt-4 flex items-center justify-between">
              <div className="flex gap-4 items-center text-[14px]">
                <div className="flex items-center gap-1 text-[#364153]">
                  <Clock size={14} />
                  <span>{deliveryTime}</span>
                </div>
                <span className="text-[#101828] font-semibold">
                  ${service.base_price || 0}
                </span>
              </div>
              <button 
                onClick={() => onEnable(service.id)}
                className="bg-gradient-to-b from-[#800020] to-[#600018] h-8 px-4 rounded-[10px] text-white text-[14px] font-medium hover:shadow-md transition-all"
              >
                {t('services_enable')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequestsTab({ requests = [], loading, error }) {
  const { t } = useApp();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#800020]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        <AlertCircle className="mr-2" size={20} />
        <span>{t('services_error_requests')}: {error}</span>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#4a5565]">
        <Clock size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium">{t('services_empty_requests_title')}</p>
        <p className="text-sm">{t('services_empty_requests_subtitle')}</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'approved': return t('services_status_approved');
      case 'rejected': return t('services_status_rejected');
      default: return t('services_status_pending');
    }
  };

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const serviceName = request.service_name || request.service?.name?.en || request.service?.name || t('services_unknown');
        return (
          <div key={request.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 items-start min-w-0">
                <div className="rounded-[16px] size-10 bg-gray-50 flex items-center justify-center shrink-0">
                  <Clock className="text-gray-400" size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[16px] text-[#101828] font-semibold leading-[24px] truncate">
                    {serviceName}
                  </h3>
                  {request.message && (
                    <p className="text-[14px] text-[#4a5565] mt-1 line-clamp-2">{request.message}</p>
                  )}
                  <p className="text-[12px] text-[#4a5565] mt-2">
                    {t('services_requested_on')} {request.created_at ? new Date(request.created_at).toLocaleDateString() : t('services_unknown')}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[12px] font-medium capitalize whitespace-nowrap ${getStatusColor(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ServiceStatCard({ label, value, color, gradient, icon }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
      <div className={`rounded-[16px] size-10 md:size-12 flex items-center justify-center mb-3 ${color || `bg-gradient-to-b ${gradient}`}`}>
        <div className="text-white">{icon}</div>
      </div>
      <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight">{value}</p>
      <p className="text-xs md:text-[14px] text-[#4a5565]">{label}</p>
    </div>
  );
}
// 'use client';

// import { useState } from 'react';
// import { Plus, Check, Clock, DollarSign, MoreVertical, Loader2, AlertCircle } from 'lucide-react';
// import { useRouter } from 'next/navigation';
// import DashboardLayout from '@/components/provider/DashboardLayout';
// import RequestServiceModal from '@/components/provider/RequestServiceModal';
// import { 
//   useMyServices, 
//   useAvailableServices, 
//   useServiceRequests 
// } from '@/hooks/providerServiceApi';

// export default function ServicesPage() {
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState('my-services');
//   const [showRequestModal, setShowRequestModal] = useState(false);

//   // Use hooks that internally use useApp for tenant management
//   const { 
//     services: myServices, 
//     loading: myServicesLoading, 
//     error: myServicesError,
//     disableService 
//   } = useMyServices();

//   const { 
//     services: availableServices, 
//     loading: availableLoading, 
//     error: availableError,
//     enableService 
//   } = useAvailableServices();

//   const { 
//     requests, 
//     loading: requestsLoading, 
//     error: requestsError 
//   } = useServiceRequests();

//   // Stats calculation
//   const digitalCount = myServices.filter(s => 
//     s.service?.service_type === 'digital' || s.type === 'Digital Service'
//   ).length;
//   const onlineCount = myServices.filter(s => 
//     s.service?.service_type === 'online' || s.type === 'Online Service'
//   ).length;

//   const tabs = [
//     { id: 'my-services', label: `My Services (${myServices.length})` },
//     { id: 'available', label: `Available (${availableServices.length})` },
//     { id: 'requests', label: `Requests (${requests.length})` },
//   ];

//   // Handle enable service
//   const handleEnable = async (serviceId) => {
//     const success = await enableService(serviceId);
//     if (success) {
//       console.log('Service enabled successfully');
//     }
//   };

//   // Handle disable service
//   const handleDisable = async (serviceId) => {
//     const success = await disableService(serviceId);
//     if (success) {
//       console.log('Service disabled successfully');
//     }
//   };

//   // Combined loading state
//   const isInitialLoading = myServicesLoading && availableLoading && requestsLoading;

//   return (
//     <DashboardLayout pageName="My Services">
//       <div className="flex flex-col gap-6">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
//           <div>
//             <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">My Services</h1>
//             <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">Manage your digital and online service offerings</p>
//           </div>
//           <button
//             onClick={() => setShowRequestModal(true)}
//             className="bg-gradient-to-b from-[#800020] to-[#600018] h-[36px] px-4 rounded-[10px] shadow-md flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:shadow-lg transition-all w-full sm:w-auto"
//           >
//             <Plus size={16} />
//             Request New Service
//           </button>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
//           <ServiceStatCard 
//             label="Active Services" 
//             value={myServices.length} 
//             gradient="from-[#800020] to-[#600018]" 
//           />
//           <ServiceStatCard 
//             label="Digital Services" 
//             value={digitalCount} 
//             color="bg-[#7e0120]" 
//           />
//           <ServiceStatCard 
//             label="Online Services" 
//             value={onlineCount} 
//             gradient="from-[#00c950] to-[#00a63e]" 
//           />
//         </div>

//         {/* Tabs */}
//         <div className="bg-[#f3f4f6] flex gap-2 p-1 rounded-[16px] w-full overflow-x-auto">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`h-[40px] rounded-[12px] px-4 whitespace-nowrap flex-shrink-0 transition-all ${
//                 activeTab === tab.id 
//                   ? 'bg-white shadow-sm text-[#101828]' 
//                   : 'text-[#4a5565] hover:bg-white/50'
//               }`}
//             >
//               <span className="text-[14px] md:text-[16px]">{tab.label}</span>
//             </button>
//           ))}
//         </div>

//         {/* Tab Content */}
//         <div className="min-h-[400px]">
//           {/* My Services Tab */}
//           {activeTab === 'my-services' && (
//             <MyServicesTab 
//               services={myServices} 
//               loading={myServicesLoading}
//               error={myServicesError}
//               onDisable={handleDisable}
//             />
//           )}

//           {/* Available Tab */}
//           {activeTab === 'available' && (
//             <AvailableTab 
//               services={availableServices}
//               loading={availableLoading}
//               error={availableError}
//               onEnable={handleEnable}
//             />
//           )}

//           {/* Requests Tab */}
//           {activeTab === 'requests' && (
//             <RequestsTab 
//               requests={requests}
//               loading={requestsLoading}
//               error={requestsError}
//             />
//           )}
//         </div>
//       </div>

//       {showRequestModal && (
//         <RequestServiceModal 
//           availableServices={availableServices}
//           onClose={() => setShowRequestModal(false)} 
//         />
//       )}
//     </DashboardLayout>
//   );
// }

// // ==========================
// // SUB-COMPONENTS (same as before)
// // ==========================

// function MyServicesTab({ services, loading, error, onDisable }) {
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loader2 className="animate-spin text-[#800020]" size={32} />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center h-64 text-red-600">
//         <AlertCircle className="mr-2" size={20} />
//         <span>Error loading services: {error}</span>
//       </div>
//     );
//   }

//   if (services.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center h-64 text-[#4a5565]">
//         <Check size={48} className="mb-4 text-gray-300" />
//         <p className="text-lg font-medium">No active services</p>
//         <p className="text-sm">Enable services from the Available tab</p>
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
//       {services.map((item) => {
//         const service = item.service || item;
//         return (
//           <div key={item.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6 flex flex-col gap-4">
//             <div className="flex gap-3 items-start">
//               <div className="rounded-[16px] size-10 md:size-12 bg-green-50 flex items-center justify-center shrink-0">
//                 <Check className="text-[#00A63E]" size={20} />
//               </div>
//               <div className="flex-1 min-w-0">
//                 <h3 className="text-[16px] text-[#101828] font-semibold leading-[24px] mb-1">
//                   {item.title || service.name?.en || service.name}
//                 </h3>
//                 <div className="flex flex-wrap gap-2">
//                   <span className="bg-[#dbeafe] border border-[#bedbff] text-[#1447e6] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
//                     {item.type || (service.service_type === 'digital' ? 'Digital Service' : 'Online Service')}
//                   </span>
//                   <span className="border border-[rgba(0,0,0,0.08)] text-[#1a1a1a] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
//                     {item.category || 'General'}
//                   </span>
//                 </div>
//               </div>
//               <button className="p-1 hover:bg-gray-100 rounded-lg">
//                 <MoreVertical size={16} className="text-[#364153]" />
//               </button>
//             </div>
            
//             <p className="text-[14px] text-[#4a5565] leading-[20px]">
//               {item.description || service.short_description?.en || service.description?.en || 'No description'}
//             </p>
            
//             <div className="border-t border-[#f3f4f6] pt-4 flex items-center justify-between">
//               <div className="flex gap-4 items-center text-[14px]">
//                 <div className="flex items-center gap-1 text-[#364153]">
//                   <Clock size={14} />
//                   <span>{item.delivery_time || `${service.default_delivery_days || 3} days`}</span>
//                 </div>
//                 <span className="text-[#101828] font-semibold">
//                   {item.price || `$${service.base_price}`}
//                 </span>
//               </div>
//               <button 
//                 onClick={() => onDisable(service.id)}
//                 className="bg-white border border-[#ffc9c9] h-8 px-3 rounded-[10px] text-[#e7000b] text-[14px] font-medium hover:bg-red-50 transition-colors"
//               >
//                 Disable
//               </button>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// function AvailableTab({ services, loading, error, onEnable }) {
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loader2 className="animate-spin text-[#800020]" size={32} />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center h-64 text-red-600">
//         <AlertCircle className="mr-2" size={20} />
//         <span>Error loading available services: {error}</span>
//       </div>
//     );
//   }

//   if (services.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center h-64 text-[#4a5565]">
//         <Check size={48} className="mb-4 text-gray-300" />
//         <p className="text-lg font-medium">No available services</p>
//         <p className="text-sm">All services have been enabled</p>
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
//       {services.map((service) => (
//         <div key={service.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6 flex flex-col gap-4">
//           <div className="flex gap-3 items-start">
//             <div className="rounded-[16px] size-10 md:size-12 bg-blue-50 flex items-center justify-center shrink-0">
//               <Plus className="text-[#1447e6]" size={20} />
//             </div>
//             <div className="flex-1 min-w-0">
//               <h3 className="text-[16px] text-[#101828] font-semibold leading-[24px] mb-1">
//                 {service.name?.en || service.name}
//               </h3>
//               <div className="flex flex-wrap gap-2">
//                 <span className="bg-[#dbeafe] border border-[#bedbff] text-[#1447e6] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
//                   {service.service_type === 'digital' ? 'Digital Service' : 'Online Service'}
//                 </span>
//                 {service.category && (
//                   <span className="border border-[rgba(0,0,0,0.08)] text-[#1a1a1a] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
//                     {service.category.name?.en || service.category.name}
//                   </span>
//                 )}
//               </div>
//             </div>
//           </div>
          
//           <p className="text-[14px] text-[#4a5565] leading-[20px]">
//             {service.short_description?.en || service.description?.en || 'No description available'}
//           </p>
          
//           <div className="border-t border-[#f3f4f6] pt-4 flex items-center justify-between">
//             <div className="flex gap-4 items-center text-[14px]">
//               <div className="flex items-center gap-1 text-[#364153]">
//                 <Clock size={14} />
//                 <span>
//                   {service.service_type === 'digital' 
//                     ? `${service.default_delivery_days || 3} days`
//                     : `${service.duration_minutes || 60} min`
//                   }
//                 </span>
//               </div>
//               <span className="text-[#101828] font-semibold">
//                 ${service.base_price}
//               </span>
//             </div>
//             <button 
//               onClick={() => onEnable(service.id)}
//               className="bg-gradient-to-b from-[#800020] to-[#600018] h-8 px-4 rounded-[10px] text-white text-[14px] font-medium hover:shadow-md transition-all"
//             >
//               Enable
//             </button>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// function RequestsTab({ requests, loading, error }) {
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loader2 className="animate-spin text-[#800020]" size={32} />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center h-64 text-red-600">
//         <AlertCircle className="mr-2" size={20} />
//         <span>Error loading requests: {error}</span>
//       </div>
//     );
//   }

//   if (requests.length === 0) {
//     return (
//       <div className="flex flex-col items-center justify-center h-64 text-[#4a5565]">
//         <Clock size={48} className="mb-4 text-gray-300" />
//         <p className="text-lg font-medium">No pending requests</p>
//         <p className="text-sm">Request new services to get started</p>
//       </div>
//     );
//   }

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'approved': return 'bg-green-100 text-green-700';
//       case 'rejected': return 'bg-red-100 text-red-700';
//       default: return 'bg-yellow-100 text-yellow-700';
//     }
//   };

//   return (
//     <div className="space-y-4">
//       {requests.map((request) => (
//         <div key={request.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
//           <div className="flex items-start justify-between">
//             <div className="flex gap-3 items-start">
//               <div className="rounded-[16px] size-10 bg-gray-50 flex items-center justify-center shrink-0">
//                 <Clock className="text-gray-400" size={20} />
//               </div>
//               <div>
//                 <h3 className="text-[16px] text-[#101828] font-semibold leading-[24px]">
//                   {request.service_name || request.service?.name?.en}
//                 </h3>
//                 <p className="text-[14px] text-[#4a5565] mt-1">
//                   {request.message || 'No message provided'}
//                 </p>
//                 <p className="text-[12px] text-[#4a5565] mt-2">
//                   Requested on {new Date(request.created_at).toLocaleDateString()}
//                 </p>
//               </div>
//             </div>
//             <span className={`px-3 py-1 rounded-full text-[12px] font-medium capitalize ${getStatusColor(request.status)}`}>
//               {request.status}
//             </span>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// function ServiceStatCard({ label, value, color, gradient }) {
//   return (
//     <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
//       <div className={`rounded-[16px] size-10 md:size-12 flex items-center justify-center mb-3 ${color || `bg-gradient-to-b ${gradient}`}`}>
//         <Check className="text-white" size={20} />
//       </div>
//       <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight">{value}</p>
//       <p className="text-xs md:text-[14px] text-[#4a5565]">{label}</p>
//     </div>
//   );
// }
