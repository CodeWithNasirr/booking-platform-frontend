'use client';

import { useState } from 'react';
import { Calendar, Clock, CheckCircle, DollarSign, Video, X, ChevronLeft } from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';
import Link from 'next/link';

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const bookings = [
    {
      id: 'BKG-3',
      title: 'Business Consultation',
      client: 'David Martinez',
      date: 'Today',
      time: '10:00 AM',
      duration: '1 hour',
      platform: 'Google Meet',
      price: 120,
      status: 'Upcoming',
      initials: 'DM'
    },
    {
      id: 'BKG-4',
      title: 'Web Dev Consultation',
      client: 'Lisa Thompson',
      date: 'Today',
      time: '2:00 PM',
      duration: '30 min',
      platform: 'Zoom',
      price: 95,
      status: 'Upcoming',
      initials: 'LT'
    }
  ];

  return (
    <DashboardLayout pageName="Bookings">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">Bookings</h1>
            <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">Manage your online appointment bookings</p>
          </div>
          <Link
            href="/provider/availability"
            className="bg-[#800020] h-[36px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors w-full sm:w-auto"
          >
            <Calendar size={16} />
            Manage Availability
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard icon={Calendar} label="Today's Bookings" value="2" color="bg-[#800020]" />
          <StatCard icon={Clock} label="Upcoming" value="2" color="bg-[#2563eb]" />
          <StatCard icon={CheckCircle} label="Completed" value="1" color="bg-[#10b981]" />
          <StatCard icon={DollarSign} label="This Week" value="$485" color="bg-[#a855f7]" />
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
              <span className="text-[14px] md:text-[16px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Banner */}
        <div className="bg-[#800020] rounded-[16px] p-4 md:p-[24px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-[20px] text-white font-bold leading-[28px] mb-1">Today's Schedule</h2>
            <p className="text-sm text-white/90">You have 2 appointment(s) scheduled for today</p>
          </div>
          <Calendar className="size-10 md:size-14 text-white opacity-80" strokeWidth={1.5} />
        </div>

        {/* Bookings List */}
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-[24px]">
              <div className="flex items-start gap-4">
                <div className="bg-[#800020] rounded-full size-10 md:size-[48px] flex items-center justify-center shrink-0 text-white font-semibold">
                  {booking.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-2">
                    <div>
                      <h3 className="text-base md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-1">
                        {booking.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[#4a5565] text-[13px] md:text-[14px]">
                        <span>{booking.client}</span>
                        <span>•</span>
                        <span>#{booking.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bg-[#dbeafe] border border-[#bedbff] h-[24px] px-3 rounded-[10px] flex items-center gap-1">
                        <Clock size={12} className="text-[#1447e6]" />
                        <span className="text-[12px] text-[#1447e6] font-medium">{booking.status}</span>
                      </div>
                      <span className="text-base md:text-[18px] text-[#101828] font-bold">${booking.price}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-[13px] md:text-[14px] text-[#364153]">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>{booking.time}</span>
                    </div>
                    <span>{booking.duration}</span>
                    <span className="text-[#800020]">{booking.platform}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button className="bg-[#800020] h-[32px] px-4 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018] transition-colors flex items-center gap-2">
                      <Video size={14} />
                      Join Meeting
                    </button>
                    <button className="bg-white border border-[rgba(0,0,0,0.08)] h-[32px] px-4 rounded-[10px] text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors">
                      Reschedule
                    </button>
                    <button className="bg-white border border-[#ffc9c9] h-[32px] px-4 rounded-[10px] text-[#e7000b] text-[14px] font-medium hover:bg-red-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
      <div className={`${color} rounded-[16px] size-10 md:size-12 flex items-center justify-center mb-3`}>
        <Icon className="text-white w-5 h-5 md:w-6 md:h-6" />

      </div>
      <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight">{value}</p>
      <p className="text-xs md:text-[14px] text-[#4a5565] leading-[20px]">{label}</p>
    </div>
  );
}