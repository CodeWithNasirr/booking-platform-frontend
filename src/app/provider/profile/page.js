'use client';

import { useState, useEffect, useCallback } from 'react';
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
  X,
  Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile data
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    profession: '',
    bio: '',
    location: ''
  });
  
  // Stats
  const [stats, setStats] = useState({
    rating: 0,
    total_reviews: 0,
    completed_jobs: 0,
    success_rate: 0
  });
  
  // Services
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  
  // Notifications
  const [notifications, setNotifications] = useState({
    new_bookings: true,
    booking_confirmations: true,
    order_updates: false,
    messages: true,
    promotions: false,
    service_requests: true
  });

  const { activeTenant } = useApp();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const getAuthHeaders = useCallback(() => ({
    'Authorization': `Bearer ${Cookies.get("access_token")}`,
    'Content-Type': 'application/json',
    'X-Tenant': activeTenant || '',
  }), [activeTenant]);

  // Fetch all profile data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch profile
        const profileRes = await fetch(`${API_BASE}/api/v1/providers/profile/me/`, {
          headers: getAuthHeaders(),
          credentials: "include"
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile({
            full_name: profileData.full_name || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            profession: profileData.profession || '',
            bio: profileData.bio || '',
            location: '' // Add to model if needed
          });
        }
        
        // Fetch stats
        const statsRes = await fetch(`${API_BASE}/api/v1/providers/profile/stats/`, {
          headers: getAuthHeaders(),
          credentials: "include"
        });
        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
        
        // Fetch services
        const servicesRes = await fetch(`${API_BASE}/api/v1/providers/services/`, {
          headers: getAuthHeaders(),
          credentials: "include"

        });
        if (servicesRes.ok) {
          setServices(await servicesRes.json());
        }
        
        // Fetch notifications
        const notifRes = await fetch(`${API_BASE}/api/v1/providers/notifications/`, {
          headers: getAuthHeaders(),
          credentials: "include"

        });
        if (notifRes.ok) {
          setNotifications(await notifRes.json());
        }
        
      } catch (err) {
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []); // Empty deps - only on mount

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/providers/profile/update/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: "include",

        body: JSON.stringify(profile)
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleService = async (serviceId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/providers/services/${serviceId}/toggle/`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: "include"

        }
      );
      
      if (!response.ok) throw new Error('Failed to toggle service');
      
      const data = await response.json();
      
      // Update local state
      setServices(services.map(s => 
        s.id === serviceId ? { ...s, is_active: !s.is_active } : s
      ));
      
      toast.success(data.detail);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddService = async (serviceId) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/providers/services/add/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: "include",

        body: JSON.stringify({ service_id: serviceId })
      });
      
      if (!response.ok) throw new Error('Failed to add service');
      
      const data = await response.json();
      setServices([...services, data.service]);
      toast.success('Service added successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/providers/notifications/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: "include",

        body: JSON.stringify(notifications)
      });
      
      if (!response.ok) throw new Error('Failed to save notifications');
      
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      current_password: formData.get('current_password'),
      new_password: formData.get('new_password'),
      confirm_password: formData.get('confirm_password')
    };
    
    if (data.new_password !== data.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/providers/security/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: "include",

        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to change password');
      }
      
      toast.success('Password changed successfully');
      e.target.reset();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/providers/security/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: "include"

      });
      
      if (!response.ok) throw new Error('Failed to delete account');
      
      toast.success('Account deleted. Redirecting...');
      // Redirect to logout or home
      window.location.href = '/';
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageName="Profile">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="size-8 animate-spin text-[#800020]" />
        </div>
      </DashboardLayout>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'services', label: 'My Services', icon: Briefcase },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const statCards = [
    { 
      icon: Star, 
      label: 'Rating', 
      value: `${stats.rating}/5.0`, 
      subtext: `${stats.total_reviews} reviews`, 
      color: 'text-[#f59e0b]', 
      bg: 'bg-[#fffbeb]', 
      border: 'border-[#fef3c7]' 
    },
    { 
      icon: CheckCircle, 
      label: 'Completed', 
      value: stats.completed_jobs.toString(), 
      subtext: 'Total jobs', 
      color: 'text-[#2463eb]', 
      bg: 'bg-[#eff6ff]', 
      border: 'border-[#dbeafe]' 
    },
    { 
      icon: ShieldCheck, 
      label: 'Success Rate', 
      value: `${stats.success_rate}%`, 
      subtext: 'Completion', 
      color: 'text-[#16a34a]', 
      bg: 'bg-[#f0fdf4]', 
      border: 'border-[#bbf7d0]' 
    }
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
                <span className="text-2xl md:text-[32px] text-white font-bold">
                  {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'SP'}
                </span>
              </div>
              <button className="absolute bottom-0 right-0 bg-[#2463eb] rounded-[8px] size-8 flex items-center justify-center border-2 border-white hover:bg-[#1d4ed8] transition-colors">
                <Camera size={16} className="text-white" />
              </button>
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg md:text-[20px] text-[#101828] font-semibold leading-[28px] mb-1">
                    {profile.full_name || 'Service Provider'}
                  </h2>
                  <p className="text-[14px] text-[#4a5565] leading-[20px]">
                    {profile.profession || 'Service Provider'} • {profile.email}
                  </p>
                </div>
                <div className="bg-[#dcfce7] h-8 px-4 rounded-[10px] border border-[#bbf7d0] flex items-center w-fit">
                  <span className="text-[14px] text-[#166534] font-medium">Active</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {statCards.map((stat, idx) => (
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
                        value={profile.full_name}
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
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
                        value={profile.email}
                        readOnly
                        className="w-full h-[40px] pl-10 pr-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#4a5565] bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#99A1AF]" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
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
                        value={profile.profession}
                        onChange={(e) => setProfile({...profile, profession: e.target.value})}
                        className="w-full h-[40px] pl-10 pr-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      rows={4}
                      className="w-full p-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[#f3f4f6]">
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-white border border-[rgba(0,0,0,0.08)] h-[40px] px-6 rounded-[10px] flex items-center gap-2 text-[14px] font-medium hover:bg-gray-50 transition-colors"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-[#800020] h-[40px] px-6 rounded-[10px] flex items-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
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
                <button 
                  onClick={() => setActiveTab('add-service')}
                  className="bg-[#800020] h-[40px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors w-full sm:w-auto"
                >
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
                          checked={service.is_active}
                          onChange={() => handleToggleService(service.id)}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 rounded-full peer transition-colors ${service.is_active ? 'bg-[#800020]' : 'bg-gray-200'}`}>
                          <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform ${service.is_active ? 'translate-x-5' : ''}`} />
                        </div>
                      </label>
                      <div>
                        <h4 className="text-[16px] text-[#101828] font-medium leading-[24px]">{service.name}</h4>
                        <p className="text-[14px] text-[#4a5565] leading-[20px]">{service.duration} • {service.price_display}</p>
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

          {activeTab === 'add-service' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={() => setActiveTab('services')}
                  className="text-[#4a5565] hover:text-[#101828]"
                >
                  ← Back
                </button>
                <h3 className="text-[16px] md:text-[18px] text-[#101828] font-semibold leading-[24px]">Add New Service</h3>
              </div>
              
              <div className="flex flex-col gap-3">
                {availableServices.length === 0 ? (
                  <p className="text-[#4a5565]">No additional services available</p>
                ) : (
                  availableServices.map((service) => (
                    <div key={service.id} className="bg-white border border-[#e5e7eb] rounded-[12px] p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-[16px] text-[#101828] font-medium">{service.name}</h4>
                        <p className="text-[14px] text-[#4a5565]">{service.duration_minutes} min • From ${service.base_price}</p>
                      </div>
                      <button 
                        onClick={() => handleAddService(service.id)}
                        className="bg-[#800020] h-9 px-4 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018]"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
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
                  new_bookings: { title: 'New Booking Requests', desc: 'Get notified when customers book your services' },
                  booking_confirmations: { title: 'Booking Confirmations', desc: 'Receive confirmation when bookings are confirmed' },
                  order_updates: { title: 'Order Updates', desc: 'Stay updated on order status changes' },
                  messages: { title: 'New Messages', desc: 'Get notified about new customer messages' },
                  promotions: { title: 'Promotions & Tips', desc: 'Receive marketing tips and promotional offers' },
                  service_requests: { title: 'Service Requests', desc: 'Get notified when admin approves new services' }
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
                        onChange={() => {
                          const updated = {...notifications, [key]: !notifications[key]};
                          setNotifications(updated);
                          handleSaveNotifications();
                        }}
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
                
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Current Password</label>
                    <input
                      name="current_password"
                      type="password"
                      required
                      placeholder="Enter current password"
                      className="h-[40px] px-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">New Password</label>
                    <input
                      name="new_password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="Enter new password"
                      className="h-[40px] px-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] text-[#364153] leading-[20px] font-medium">Confirm New Password</label>
                    <input
                      name="confirm_password"
                      type="password"
                      required
                      placeholder="Confirm new password"
                      className="h-[40px] px-4 rounded-[10px] border border-[#e5e7eb] text-[14px] text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" className="bg-white border border-[rgba(0,0,0,0.08)] h-[40px] px-6 rounded-[10px] text-[14px] font-medium hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="bg-[#800020] h-[40px] px-6 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018] transition-colors">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              <div className="pt-6 border-t border-[#f3f4f6]">
                <h3 className="text-[16px] font-semibold leading-[24px] mb-4 text-red-600">Danger Zone</h3>
                <div className="bg-red-50 border border-red-100 rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[14px] text-[#101828] font-medium leading-[20px] mb-1">Delete Account</h4>
                    <p className="text-[14px] text-[#4a5565] leading-[20px]">Once deleted, your account cannot be recovered</p>
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    className="bg-red-600 text-white h-[40px] px-4 rounded-[10px] text-[14px] font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
                  >
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