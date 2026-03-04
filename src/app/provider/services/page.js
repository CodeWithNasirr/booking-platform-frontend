'use client';

import { useState } from 'react';
import { Plus, Check, Clock, DollarSign, MoreVertical } from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';
import RequestServiceModal from '@/components/provider/RequestServiceModal';

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('my-services');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const tabs = [
    { id: 'my-services', label: 'My Services (4)' },
    { id: 'available', label: 'Available (8)' },
    { id: 'requests', label: 'Requests (1)' },
  ];

  const services = [
    {
      id: 1,
      title: 'Logo Design',
      category: 'Design',
      type: 'Digital Service',
      description: 'Professional logo design with 3 concepts and unlimited revisions',
      deliveryTime: '3-5 days',
      price: '$250'
    },
    {
      id: 2,
      title: 'Content Writing',
      category: 'Content',
      type: 'Digital Service',
      description: '5 SEO-optimized blog posts (1000 words each)',
      deliveryTime: '2-3 days',
      price: '$180'
    }
  ];

  return (
    <DashboardLayout pageName="My Services">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">My Services</h1>
            <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">Manage your digital and online service offerings</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-gradient-to-b from-[#800020] to-[#600018] h-[36px] px-4 rounded-[10px] shadow-md flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:shadow-lg transition-all w-full sm:w-auto"
          >
            <Plus size={16} />
            Request New Service
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <ServiceStatCard label="Active Services" value="4" gradient="from-[#800020] to-[#600018]" />
          <ServiceStatCard label="Digital Services" value="2" color="bg-[#7e0120]" />
          <ServiceStatCard label="Online Services" value="2" gradient="from-[#00c950] to-[#00a63e]" />
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

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <div className="rounded-[16px] size-10 md:size-12 bg-green-50 flex items-center justify-center shrink-0">
                  <Check className="text-[#00A63E]" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] text-[#101828] font-semibold leading-[24px] mb-1">{service.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#dbeafe] border border-[#bedbff] text-[#1447e6] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
                      {service.type}
                    </span>
                    <span className="border border-[rgba(0,0,0,0.08)] text-[#1a1a1a] text-[12px] font-medium px-2 py-0.5 rounded-[10px]">
                      {service.category}
                    </span>
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-lg">
                  <MoreVertical size={16} className="text-[#364153]" />
                </button>
              </div>
              
              <p className="text-[14px] text-[#4a5565] leading-[20px]">{service.description}</p>
              
              <div className="border-t border-[#f3f4f6] pt-4 flex items-center justify-between">
                <div className="flex gap-4 items-center text-[14px]">
                  <div className="flex items-center gap-1 text-[#364153]">
                    <Clock size={14} />
                    <span>{service.deliveryTime}</span>
                  </div>
                  <span className="text-[#101828] font-semibold">{service.price}</span>
                </div>
                <button className="bg-white border border-[#ffc9c9] h-8 px-3 rounded-[10px] text-[#e7000b] text-[14px] font-medium hover:bg-red-50 transition-colors">
                  Disable
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showRequestModal && (
        <RequestServiceModal onClose={() => setShowRequestModal(false)} />
      )}
    </DashboardLayout>
  );
}

function ServiceStatCard({ label, value, color, gradient }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
      <div className={`rounded-[16px] size-10 md:size-12 flex items-center justify-center mb-3 ${color || `bg-gradient-to-b ${gradient}`}`}>
        <Check className="text-white" size={20} />
      </div>
      <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight">{value}</p>
      <p className="text-xs md:text-[14px] text-[#4a5565]">{label}</p>
    </div>
  );
}