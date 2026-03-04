'use client';

import { 
  Package, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  MessageSquare,
  ChevronRight,
  Icon,
} from 'lucide-react';

function WelcomeBanner() {
  return (
    <div className="bg-gradient-to-b from-[#800020] to-[#600018] flex flex-col gap-2 p-6 rounded-[16px]">
      <h1 className="text-xl md:text-[24px] text-white font-bold leading-tight md:leading-[32px]">
        Welcome back, Service Provider!
      </h1>
      <p className="text-sm md:text-[16px] text-[rgba(255,255,255,0.9)] leading-[20px] md:leading-[24px]">
        You have 2 active orders and 3 upcoming appointments
      </p>
    </div>
  );
}

function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard label="Active Orders" value="2" icon={Package} iconColor="bg-[#7c011f]" />
      <StatCard label="Bookings" value="3" icon={Calendar} iconColor="bg-gradient-to-br from-[#00c950] to-[#00a63e]" />
      <StatCard label="Earnings" value="$1,515" icon={DollarSign} iconColor="bg-gradient-to-b from-[#800020] to-[#600018]" />
      <StatCard label="Completion" value="98%" icon={CheckCircle} iconColor="bg-gradient-to-br from-[#ad46ff] to-[#9810fa]" />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, iconColor }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-[24px]">
      <div className={`rounded-[16px] size-10 md:size-[48px] flex items-center justify-center mb-3 md:mb-4 ${iconColor}`}>
        <Icon className="text-white w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
      </div>
      <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight md:leading-[32px]">{value}</p>
      <p className="text-xs md:text-[14px] text-[#4a5565] leading-[16px] md:leading-[20px]">{label}</p>
    </div>
  );
}

function TwoColumnLayout() {
  return (
    <div className="flex flex-col xl:grid xl:grid-cols-[1fr_300px] gap-6">
      <LeftColumn />
      <RightColumn />
    </div>
  );
}

function LeftColumn() {
  return (
    <div className="flex flex-col gap-6">
      <ActiveOrders />
      <UpcomingAppointments />
    </div>
  );
}

function ActiveOrders() {
  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-[24.8px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package size={20} className="text-[#800020] shrink-0" strokeWidth={1.66667} />
          <h2 className="text-base md:text-[18px] text-[#101828] font-semibold leading-[24px] md:leading-[28px]">
            Active Orders
          </h2>
        </div>
        <button className="bg-white h-8 md:h-[32px] px-3 md:px-[12.8px] rounded-[10px] border border-[rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors flex items-center gap-1">
          <span className="hidden md:block text-[14px] text-[#1a1a1a] font-medium leading-[20px]">View All</span>
          <ChevronRight size={16} className="md:hidden" />
        </button>
      </div>
      <div className="flex flex-col gap-3 md:gap-[12px]">
        <OrderCard title="Logo Design" client="Sarah Johnson" deadline="05/01/2026" price="$250" status="In Progress" />
        <OrderCard title="Website Development" client="Michael Chen" deadline="10/01/2026" price="$850" status="Pending" />
      </div>
    </div>
  );
}

function OrderCard({ title, client, deadline, price, status }) {
  return (
    <div className="bg-[#f9fafb] rounded-[12px] p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <h3 className="text-[15px] md:text-[16px] text-[#101828] font-medium leading-[24px] truncate">{title}</h3>
          <p className="text-[13px] md:text-[14px] text-[#4a5565] leading-[20px]">Client: {client}</p>
        </div>
        <div className={`shrink-0 h-[22px] px-2 rounded-[10px] border flex items-center ${
          status === 'In Progress' ? 'bg-[#dbeafe] border-[#bedbff]' : 'bg-[#fef9c2] border-[#fff085]'
        }`}>
          <p className={`text-[11px] md:text-[12px] font-medium leading-[16px] ${status === 'In Progress' ? 'text-[#1447e6]' : 'text-[#a65f00]'}`}>
            {status}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] md:text-[14px] text-[#4a5565] leading-[20px]">Due: {deadline}</p>
        <p className="text-[14px] md:text-[15px] text-[#101828] font-semibold leading-[20px]">{price}</p>
      </div>
    </div>
  );
}

function UpcomingAppointments() {
  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-[24.8px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-[#800020] shrink-0" strokeWidth={1.66667} />
          <h2 className="text-base md:text-[18px] text-[#101828] font-semibold leading-[24px] md:leading-[28px]">
            Appointments
          </h2>
        </div>
        <button className="bg-white h-8 md:h-[32px] px-3 md:px-[12.8px] rounded-[10px] border border-[rgba(0,0,0,0.08)] hover:bg-gray-50 transition-colors flex items-center gap-1">
          <span className="hidden md:block text-[14px] text-[#1a1a1a] font-medium leading-[20px]">View All</span>
          <ChevronRight size={16} className="md:hidden" />
        </button>
      </div>
      <div className="flex flex-col gap-3 md:gap-[12px]">
        <AppointmentCard title="Business Consultation" client="David Martinez" date="Today" time="10:00 AM" platform="Google Meet" price="$120" />
        <AppointmentCard title="Web Dev Consultation" client="Lisa Thompson" date="Today" time="2:00 PM" platform="Zoom" price="$95" />
        <AppointmentCard title="UI/UX Review" client="Emma Wilson" date="Tomorrow" time="11:00 AM" platform="Zoom" price="$150" />
      </div>
    </div>
  );
}

function AppointmentCard({ title, client, date, time, platform, price }) {
  return (
    <div className="bg-[#f9fafb] rounded-[12px] p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <h3 className="text-[15px] md:text-[16px] text-[#101828] font-medium leading-[24px] truncate">{title}</h3>
          <p className="text-[13px] md:text-[14px] text-[#4a5565] leading-[20px]">Client: {client}</p>
        </div>
        <p className="text-[14px] md:text-[15px] text-[#101828] font-semibold leading-[20px] shrink-0">{price}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] md:text-[14px] text-[#4a5565] leading-[20px]">
        <span>{date}</span>
        <span>{time}</span>
        <span className="text-[#800020]">{platform}</span>
      </div>
    </div>
  );
}

function RightColumn() {
  return (
    <div className="flex flex-col gap-6 w-full xl:w-[300px]">
      <PendingActions />
      <Messages />
      <QuickActions />
    </div>
  );
}

function PendingActions() {
  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-[24.8px]">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-[#800020]" strokeWidth={1.66667} />
        <h2 className="text-base md:text-[18px] text-[#101828] font-semibold leading-[28px]">Pending Actions</h2>
      </div>
      <div className="flex flex-col gap-3">
        <ActionCard title="New order from Michael" description="Website Development - Review requirements" time="30 min ago" buttonText="Review" />
        <ActionCard title="Booking confirmation" description="Lisa Thompson - Web Dev Consultation" time="1 hour ago" buttonText="Confirm" />
      </div>
    </div>
  );
}

function ActionCard({ title, description, time, buttonText }) {
  return (
    <div className="bg-[#fff7ed] rounded-[12px] border border-[#ffd6a7] p-3 md:p-[12.8px]">
      <h3 className="text-[13px] md:text-[14px] text-[#101828] font-medium leading-[20px] mb-1">{title}</h3>
      <p className="text-[11px] md:text-[12px] text-[#4a5565] leading-[16px] mb-3">{description}</p>
      <div className="flex items-center justify-between">
        <p className="text-[11px] md:text-[12px] text-[#6a7282] leading-[16px]">{time}</p>
        <button className="bg-[#800020] h-7 md:h-[28px] px-3 rounded-[10px] hover:bg-[#600018] transition-colors">
          <p className="text-[11px] md:text-[12px] text-white font-medium leading-[16px]">{buttonText}</p>
        </button>
      </div>
    </div>
  );
}

function Messages() {
  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-[24.8px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} className="text-[#800020]" strokeWidth={1.66667} />
          <h2 className="text-base md:text-[18px] text-[#101828] font-semibold leading-[28px]">Messages</h2>
        </div>
        <button className="text-[12px] text-[#800020] font-medium hover:underline">View All</button>
      </div>
      <div className="flex flex-col gap-3">
        <MessageCard name="Sarah Johnson" message="Looking forward to your concepts" time="10 min ago" unread />
        <MessageCard name="David Martinez" message="Can we reschedule?" time="1 hour ago" unread />
        <MessageCard name="Michael Chen" message="Thanks for the quick response!" time="2 hours ago" />
      </div>
    </div>
  );
}

function MessageCard({ name, message, time, unread }) {
  return (
    <div className="bg-[#f9fafb] rounded-[12px] p-3 flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#800020] to-[#600018] flex items-center justify-center text-white text-xs font-medium shrink-0">
        {name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] md:text-[14px] text-[#101828] font-medium leading-[20px] truncate">{name}</p>
          {unread && <div className="bg-[#800020] rounded-full size-[6px] shrink-0" />}
        </div>
        <p className="text-[11px] md:text-[12px] text-[#4a5565] leading-[16px] truncate">{message}</p>
        <p className="text-[11px] text-[#6a7282] leading-[16px] mt-1">{time}</p>
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-[24.8px]">
      <h2 className="text-base md:text-[18px] text-[#101828] font-semibold leading-[28px] mb-4">Quick Actions</h2>
      <div className="flex flex-col gap-2">
        <button className="bg-white h-9 md:h-[36px] rounded-[10px] border border-[rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-gray-50 transition-colors text-[13px] md:text-[14px] text-[#1a1a1a] font-medium leading-[20px]">
          Update Availability
        </button>
        <button className="bg-white h-9 md:h-[36px] rounded-[10px] border border-[rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-gray-50 transition-colors text-[13px] md:text-[14px] text-[#1a1a1a] font-medium leading-[20px]">
          Manage Services
        </button>
        <button className="bg-white h-9 md:h-[36px] rounded-[10px] border border-[rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-gray-50 transition-colors text-[13px] md:text-[14px] text-[#1a1a1a] font-medium leading-[20px]">
          View Earnings
        </button>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <WelcomeBanner />
      <StatsCards />
      <TwoColumnLayout />
    </div>
  );
}