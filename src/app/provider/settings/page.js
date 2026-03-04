'use client';

import { useState } from 'react';
import { 
  User, 
  Bell, 
  SlidersHorizontal, 
  CreditCard, 
  Shield, 
  Eye, 
  EyeOff, 
  Check,
  Video,
  DollarSign,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  
  const [emailNotifications, setEmailNotifications] = useState({
    allEmails: true,
    newOrders: true,
    bookingUpdates: true,
    paymentAlerts: true,
    promotions: false,
  });

  const [integrations, setIntegrations] = useState({
    zoom: { connected: true, name: 'Zoom' },
    googleMeet: { connected: false, name: 'Google Meet' },
    teams: { connected: false, name: 'Microsoft Teams' }
  });

  const [payments, setPayments] = useState({
    stripe: { connected: true, name: 'Stripe' },
    paypal: { connected: false, name: 'PayPal' }
  });

  const toggleIntegration = (key) => {
    setIntegrations(prev => ({
      ...prev,
      [key]: { ...prev[key], connected: !prev[key].connected }
    }));
  };

  const togglePayment = (key) => {
    setPayments(prev => ({
      ...prev,
      [key]: { ...prev[key], connected: !prev[key].connected }
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: SlidersHorizontal },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const notificationSettings = [
    { key: 'allEmails', title: 'All Email Notifications', desc: 'Receive all email notifications' },
    { key: 'newOrders', title: 'New Orders', desc: 'Notifications for new order requests' },
    { key: 'bookingUpdates', title: 'Booking Updates', desc: 'Updates on your bookings and appointments' },
    { key: 'paymentAlerts', title: 'Payment Alerts', desc: 'Alerts for payments and transactions' },
    { key: 'promotions', title: 'Promotions', desc: 'Special offers and promotional updates' },
  ];

  return (
    <DashboardLayout pageName="Settings">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">Settings</h1>
          <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Vertical on desktop, horizontal scroll on mobile */}
          <div className="lg:w-[280px] shrink-0">
            <div className="bg-white rounded-[16px] border border-[#e5e7eb] overflow-hidden flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 lg:px-6 py-4 min-w-[140px] lg:min-w-0 whitespace-nowrap transition-colors ${
                      isActive 
                        ? 'bg-[#800020] text-white' 
                        : 'bg-white text-[#364153] hover:bg-[#f9fafb]'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-[#364153]'} />
                    <span className="text-[15px] font-medium">{tab.label}</span>
                    <ChevronRight size={16} className={`ml-auto hidden lg:block ${isActive ? 'text-white/70' : 'text-[#9ca3af]'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-6">
                <h3 className="text-lg md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-6">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
                      <input
                        type="text"
                        defaultValue="John Provider"
                        className="w-full h-12 pl-10 pr-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] font-medium">Email Address</label>
                    <input
                      type="email"
                      defaultValue="john@example.com"
                      className="w-full h-12 px-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] font-medium">Phone Number</label>
                    <input
                      type="tel"
                      defaultValue="+1 234 567 8900"
                      className="w-full h-12 px-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] font-medium">Timezone</label>
                    <select className="w-full h-12 px-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#800020]/20">
                      <option>America/New_York (EST)</option>
                      <option>America/Los_Angeles (PST)</option>
                      <option>America/Chicago (CST)</option>
                      <option>Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-[#f3f4f6]">
                  <button className="bg-white border border-[rgba(0,0,0,0.08)] h-10 px-6 rounded-[10px] flex items-center justify-center gap-2 text-[14px] font-medium hover:bg-gray-50 transition-colors">
                    <X size={16} />
                    Cancel
                  </button>
                  <button className="bg-[#800020] h-10 px-6 rounded-[10px] flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors">
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-6">
                <h3 className="text-lg md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-2">Email Notifications</h3>
                <p className="text-[14px] text-[#4a5565] mb-6">Choose which notifications you want to receive</p>
                
                <div className="flex flex-col">
                  {notificationSettings.map((setting, index) => (
                    <div 
                      key={setting.key} 
                      className={`flex items-center justify-between py-4 ${
                        index !== notificationSettings.length - 1 ? 'border-b border-[#f3f4f6]' : ''
                      }`}
                    >
                      <div className="pr-4">
                        <h4 className="text-[15px] text-[#101828] font-medium leading-[24px] mb-1">{setting.title}</h4>
                        <p className="text-[14px] text-[#4a5565] leading-[20px]">{setting.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={emailNotifications[setting.key]}
                          onChange={() => setEmailNotifications(prev => ({
                            ...prev,
                            [setting.key]: !prev[setting.key]
                          }))}
                          className="sr-only peer"
                        />
                        <div className={`w-12 h-7 rounded-full peer transition-colors ${
                          emailNotifications[setting.key] ? 'bg-[#800020]' : 'bg-gray-200'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-6 h-6 rounded-full transition-transform ${
                            emailNotifications[setting.key] ? 'translate-x-5' : ''
                          }`} />
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-6">
                <h3 className="text-lg md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-2">Video Conferencing</h3>
                <p className="text-[14px] text-[#4a5565] mb-6">Connect your video conferencing accounts for online appointments</p>
                
                <div className="flex flex-col gap-4">
                  {Object.entries(integrations).map(([key, integration]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[#e5e7eb] rounded-[12px] gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-[12px] size-12 flex items-center justify-center text-white font-bold text-lg ${
                          key === 'zoom' ? 'bg-[#2d8cff]' :
                          key === 'googleMeet' ? 'bg-[#34a853]' :
                          'bg-[#5b5fc7]'
                        }`}>
                          {key === 'zoom' ? 'Z' : key === 'googleMeet' ? 'G' : 'T'}
                        </div>
                        <div>
                          <h4 className="text-[16px] text-[#101828] font-medium leading-[24px]">{integration.name}</h4>
                          <p className="text-[14px] text-[#4a5565] leading-[20px]">
                            {integration.connected ? 'Connected and active' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      {integration.connected ? (
                        <button 
                          onClick={() => toggleIntegration(key)}
                          className="bg-white border border-[#ffc9c9] h-9 px-4 rounded-[10px] text-[#e7000b] text-[14px] font-medium hover:bg-red-50 transition-colors w-full sm:w-auto"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button 
                          onClick={() => toggleIntegration(key)}
                          className="bg-[#800020] h-9 px-4 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018] transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                          <Video size={16} />
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-6">
                <h3 className="text-lg md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-2">Payment Methods</h3>
                <p className="text-[14px] text-[#4a5565] mb-6">Manage your payment processing accounts</p>
                
                <div className="flex flex-col gap-4">
                  {Object.entries(payments).map(([key, payment]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[#e5e7eb] rounded-[12px] gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-[12px] size-12 flex items-center justify-center text-white font-bold text-lg ${
                          key === 'stripe' ? 'bg-[#635bff]' : 'bg-[#0070ba]'
                        }`}>
                          {key === 'stripe' ? 'S' : 'P'}
                        </div>
                        <div>
                          <h4 className="text-[16px] text-[#101828] font-medium leading-[24px]">{payment.name}</h4>
                          <div className="flex items-center gap-2">
                            {payment.connected && (
                              <>
                                <Check size={14} className="text-[#16a34a]" />
                                <span className="text-[14px] text-[#16a34a] font-medium">Connected</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {payment.connected ? (
                        <button className="bg-white border border-[rgba(0,0,0,0.08)] h-9 px-4 rounded-[10px] text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto">
                          Manage
                        </button>
                      ) : (
                        <button 
                          onClick={() => togglePayment(key)}
                          className="bg-[#800020] h-9 px-4 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018] transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                          <DollarSign size={16} />
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-6">
                <h3 className="text-lg md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-6">Change Password</h3>
                
                <div className="flex flex-col gap-5 max-w-[600px]">
                  {[
                    { key: 'current', label: 'Current Password' },
                    { key: 'new', label: 'New Password' },
                    { key: 'confirm', label: 'Confirm New Password' }
                  ].map((field) => (
                    <div key={field.key} className="flex flex-col gap-2">
                      <label className="text-[14px] text-[#364153] font-medium">{field.label}</label>
                      <div className="relative">
                        <input
                          type={showPassword[field.key] ? 'text' : 'password'}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          className="w-full h-12 px-4 pr-12 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {showPassword[field.key] ? (
                            <EyeOff size={18} className="text-[#6a7282]" />
                          ) : (
                            <Eye size={18} className="text-[#6a7282]" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button className="bg-white border border-[rgba(0,0,0,0.08)] h-10 px-6 rounded-[10px] text-[14px] font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                      <X size={16} />
                      Cancel
                    </button>
                    <button className="bg-[#800020] h-10 px-6 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018] transition-colors flex items-center justify-center gap-2">
                      <Shield size={16} />
                      Update Password
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-[#f3f4f6]">
                  <h3 className="text-[16px] text-red-600 font-semibold mb-4">Danger Zone</h3>
                  <div className="bg-red-50 border border-red-100 rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[15px] text-[#101828] font-medium mb-1">Delete Account</h4>
                      <p className="text-[14px] text-[#4a5565]">Once deleted, your account cannot be recovered</p>
                    </div>
                    <button className="bg-red-600 text-white h-10 px-4 rounded-[10px] text-[14px] font-medium hover:bg-red-700 transition-colors whitespace-nowrap">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}