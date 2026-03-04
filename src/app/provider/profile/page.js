'use client';

import { useState } from 'react';
import { 
  User, 
  Briefcase, 
  Bell, 
  Shield, 
  Camera, 
  Star, 
  CheckCircle, 
  ShieldCheck, 
  Plus, 
  Pencil,
  Mail,
  Phone,
  MapPin,
  Save,
  X
} from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [services, setServices] = useState([
    { id: 1, name: 'Haircut & Style', duration: '45 min', price: '$85', enabled: true },
    { id: 2, name: 'Hair Coloring', duration: '90 min', price: '$120', enabled: true },
    { id: 3, name: 'Beard Trim', duration: '20 min', price: '$25', enabled: false }
  ]);

  const [notifications, setNotifications] = useState({
    newBookings: true,
    bookingConfirmations: true,
    orderUpdates: false,
    messages: true,
    promotions: false,
    serviceRequests: true
  });

  const toggleService = (id) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'services', label: 'My Services', icon: Briefcase },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const stats = [
    { icon: Star, label: 'Rating', value: '4.9/5.0', subtext: '156 reviews', color: 'text-[#f59e0b]', bg: 'bg-[#fffbeb]', border: 'border-[#fef3c7]' },
    { icon: CheckCircle, label: 'Completed', value: '487', subtext: 'Total jobs', color: 'text-[#2463eb]', bg: 'bg-[#eff6ff]', border: 'border-[#dbeafe]' },
    { icon: ShieldCheck, label: 'Success Rate', value: '98%', subtext: 'Completion', color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]', border: 'border-[#bbf7d0]' }
  ];

  return (
    <DashboardLayout pageName="Profile">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">Profile & Settings</h1>
          <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">Manage your profile and account settings</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <div className="relative shrink-0">
              <div className="bg-gradient-to-b from-[#800020] to-[#600018] rounded-[16px] size-20 md:size-24 flex items-center justify-center">
                <span className="text-2xl md:text-[32px] text-white font-bold">SP</span>
              </div>
              <button className="absolute bottom-0 right-0 bg-[#2463eb] rounded-[8px] size-8 flex items-center justify-center border-2 border-white hover:bg-[#1d4ed8] transition-colors">
                <Camera size={16} className="text-white" />
              </button>
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg md:text-[20px] text-[#101828] font-semibold leading-[28px] mb-1">Service Provider</h2>
                  <p className="text-[14px] text-[#4a5565] leading-[20px]">Service Provider • Hair Stylist</p>
                </div>
                <div className="bg-[#dcfce7] h-8 px-4 rounded-[10px] border border-[#bbf7d0] flex items-center w-fit">
                  <span className="text-[14px] text-[#166534] font-medium">Active</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {stats.map((stat, idx) => (
                  <div key={idx} className={`${stat.bg} rounded-[12px] p-3 md:p-4 border ${stat.border}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={16} className={stat.color} />
                      <span className="text-[12px] text-[#6a7282] leading-[16px]">{stat.label}</span>
                    </div>
                    <p className="text-lg md:text-[20px] text-[#101828] font-bold leading-[28px]">{stat.value}</p>
                    <p className="text-[11px] md:text-[12px] text-[#6a7282] leading-[16px]">{stat.subtext}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e5e7eb] overflow-x-auto">
          <div className="flex gap-6 md:gap-8 min-w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
                    isActive ? 'border-[#2463eb]' : 'border-transparent hover:border-[#e5e7eb]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={isActive ? 'text-[#2463eb]' : 'text-[#4a5565]'} />
                    <span className={`text-[14px] leading-[20px] ${isActive ? 'text-[#2463eb] font-medium' : 'text-[#4a5565]'}`}>
                      {tab.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 max-w-[800px]">
              <div>
                <h3 className="text-[16px] md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#99A1AF]" />
                      <input
                        type="text"
                        defaultValue="Service Provider"
                        className="w-full h-[40px] pl-10 pr-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#99A1AF]" />
                      <input
                        type="email"
                        defaultValue="provider@demo.com"
                        className="w-full h-[40px] pl-10 pr-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#99A1AF]" />
                      <input
                        type="tel"
                        defaultValue="+1 (555) 123-4567"
                        className="w-full h-[40px] pl-10 pr-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Profession</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#99A1AF]" />
                      <input
                        type="text"
                        defaultValue="Hair Stylist"
                        className="w-full h-[40px] pl-10 pr-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#99A1AF]" />
                      <input
                        type="text"
                        defaultValue="New York, NY"
                        className="w-full h-[40px] pl-10 pr-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#f3f4f6]">
                <button className="bg-white border border-[rgba(0,0,0,0.08)] h-[40px] px-6 rounded-[10px] flex items-center gap-2 text-[14px] font-medium hover:bg-gray-50 transition-colors">
                  <X size={16} />
                  Cancel
                </button>
                <button className="bg-[#800020] h-[40px] px-6 rounded-[10px] flex items-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors">
                  <Save size={16} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-[16px] md:text-[18px] text-[#101828] font-semibold leading-[24px]">My Services</h3>
                  <p className="text-[14px] text-[#4a5565] leading-[20px]">Manage the services you offer</p>
                </div>
                <button className="bg-[#800020] h-[40px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors w-full sm:w-auto">
                  <Plus size={18} />
                  Add Service
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {services.map((service) => (
                  <div key={service.id} className="bg-white border border-[#e5e7eb] rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={service.enabled}
                          onChange={() => toggleService(service.id)}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-colors ${service.enabled ? 'bg-[#800020]' : 'bg-gray-200'}`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${service.enabled ? 'translate-x-5' : ''}`} />
                        </div>
                      </label>
                      <div>
                        <h4 className="text-[16px] text-[#101828] font-medium leading-[24px]">{service.name}</h4>
                        <p className="text-[14px] text-[#4a5565] leading-[20px]">{service.duration} • {service.price}</p>
                      </div>
                    </div>
                    <button className="bg-white border border-[rgba(0,0,0,0.08)] h-9 px-4 rounded-[10px] flex items-center gap-2 text-[14px] font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
                      <Pencil size={14} />
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="flex flex-col gap-6 max-w-[800px]">
              <div>
                <h3 className="text-[16px] md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-2">Notification Preferences</h3>
                <p className="text-[14px] text-[#4a5565] leading-[20px]">Choose how you want to be notified</p>
              </div>

              <div className="flex flex-col">
                {Object.entries({
                  newBookings: { title: 'New Booking Requests', desc: 'Get notified when customers book your services' },
                  bookingConfirmations: { title: 'Booking Confirmations', desc: 'Receive confirmation when bookings are confirmed' },
                  orderUpdates: { title: 'Order Updates', desc: 'Stay updated on order status changes' },
                  messages: { title: 'New Messages', desc: 'Get notified about new customer messages' },
                  promotions: { title: 'Promotions & Tips', desc: 'Receive marketing tips and promotional offers' },
                  serviceRequests: { title: 'Service Requests', desc: 'Get notified when admin approves new services' }
                }).map(([key, { title, desc }]) => (
                  <div key={key} className="flex items-center justify-between py-4 border-b border-[#f3f4f6] last:border-0">
                    <div>
                      <h4 className="text-[14px] text-[#101828] font-medium leading-[20px] mb-1">{title}</h4>
                      <p className="text-[14px] text-[#4a5565] leading-[20px]">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                      <input
                        type="checkbox"
                        checked={notifications[key]}
                        onChange={() => setNotifications({...notifications, [key]: !notifications[key]})}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer transition-colors ${notifications[key] ? 'bg-[#800020]' : 'bg-gray-200'}`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${notifications[key] ? 'translate-x-5' : ''}`} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="flex flex-col gap-6 max-w-[600px]">
              <div>
                <h3 className="text-[16px] md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-4">Change Password</h3>
                <p className="text-[14px] text-[#4a5565] leading-[20px] mb-6">Update your password to keep your account secure</p>
                
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="h-[40px] px-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="h-[40px] px-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="h-[40px] px-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="bg-white border border-[rgba(0,0,0,0.08)] h-[40px] px-6 rounded-[10px] text-[14px] font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button className="bg-[#800020] h-[40px] px-6 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018] transition-colors">
                  Update Password
                </button>
              </div>

              <div className="pt-6 border-t border-[#f3f4f6]">
                <h3 className="text-[16px] font-semibold leading-[24px] mb-4 text-red-600">Danger Zone</h3>
                <div className="bg-red-50 border border-red-100 rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[14px] text-[#101828] font-medium leading-[20px] mb-1">Delete Account</h4>
                    <p className="text-[14px] text-[#4a5565] leading-[20px]">Once deleted, your account cannot be recovered</p>
                  </div>
                  <button className="bg-red-600 text-white h-[40px] px-4 rounded-[10px] text-[14px] font-medium hover:bg-red-700 transition-colors whitespace-nowrap">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}