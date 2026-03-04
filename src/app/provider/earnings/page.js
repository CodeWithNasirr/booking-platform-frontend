'use client';

import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Download, ArrowUpRight, Wallet, CreditCard, Clock, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';

const data = [
  { name: 'Mon', value: 240 },
  { name: 'Tue', value: 310 },
  { name: 'Wed', value: 175 },
  { name: 'Thu', value: 480 },
  { name: 'Fri', value: 410 },
  { name: 'Sat', value: 580 },
  { name: 'Sun', value: 290 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#101828] text-white text-xs px-3 py-2 rounded-lg shadow-xl">
        <p className="font-semibold">{label}</p>
        <p className="text-[#e5e7eb]">${payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function EarningsPage() {
  const [activeTab, setActiveTab] = useState('week');
  const [hoveredBar, setHoveredBar] = useState(null);

  return (
    <DashboardLayout pageName="Earnings">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">Earnings & Payouts</h1>
            <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">Track your income and manage payouts</p>
          </div>
          <button className="bg-white border border-[rgba(0,0,0,0.08)] h-[36px] px-4 rounded-[10px] flex items-center justify-center gap-2 text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto">
            <Download size={16} />
            Download Report
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Earnings */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-[#00c950] to-[#00a63e] rounded-[16px] size-10 md:size-12 flex items-center justify-center">
                <span className="text-white text-xl font-bold">$</span>
              </div>
              <div className="bg-[#dcfce7] h-6 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ArrowUpRight size={12} className="text-[#008236]" />
                <span className="text-[12px] text-[#008236] font-medium">+12.5%</span>
              </div>
            </div>
            <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight mb-1">$2,370</p>
            <p className="text-xs md:text-[14px] text-[#4a5565]">Total Earnings</p>
          </div>

          {/* This Week */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-[#2b7fff] to-[#155dfc] rounded-[16px] size-10 md:size-12 flex items-center justify-center">
                <ArrowUpRight className="text-white" size={20} />
              </div>
              <div className="bg-[#dcfce7] h-6 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ArrowUpRight size={12} className="text-[#008236]" />
                <span className="text-[12px] text-[#008236] font-medium">+8.2%</span>
              </div>
            </div>
            <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight mb-1">$1,240</p>
            <p className="text-xs md:text-[14px] text-[#4a5565]">This Week</p>
          </div>

          {/* Pending */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
            <div className="mb-4">
              <div className="bg-gradient-to-br from-[#f0b100] to-[#d08700] rounded-[16px] size-10 md:size-12 flex items-center justify-center">
                <Clock className="text-white" size={20} />
              </div>
            </div>
            <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight mb-1">$150</p>
            <p className="text-xs md:text-[14px] text-[#4a5565]">Pending</p>
          </div>

          {/* Average Per Job */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-[#ad46ff] to-[#9810fa] rounded-[16px] size-10 md:size-12 flex items-center justify-center">
                <span className="text-white text-lg font-bold">Avg</span>
              </div>
              <div className="bg-[#dcfce7] h-6 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ArrowUpRight size={12} className="text-[#008236]" />
                <span className="text-[12px] text-[#008236] font-medium">+5.3%</span>
              </div>
            </div>
            <p className="text-xl md:text-[24px] text-[#101828] font-bold leading-tight mb-1">$95</p>
            <p className="text-xs md:text-[14px] text-[#4a5565]">Avg. Per Job</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col xl:grid xl:grid-cols-[1fr_320px] gap-6">
          {/* Chart Section */}
          <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-[16px] md:text-[18px] text-[#101828] font-semibold leading-[24px]">Earnings Overview</h2>
              <div className="bg-[#f3f4f6] flex gap-1 h-[36px] items-center p-1 rounded-[10px] w-fit">
                {['week', 'month', 'year'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`h-[28px] px-3 rounded-[8px] text-[14px] transition-all ${
                      activeTab === tab 
                        ? 'bg-[#800020] text-white' 
                        : 'text-[#4a5565] hover:bg-white/50'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Recharts Bar Chart */}
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#4a5565', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', opacity: 0.4 }} />
                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 0, 0]}
                    onMouseEnter={(_, index) => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={hoveredBar === index ? '#600018' : '#800020'}
                        style={{
                          transition: 'fill 0.3s ease',
                          filter: hoveredBar === index ? 'brightness(1.1)' : 'none'
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Next Payout Card */}
            <div className="bg-[#800020] rounded-[16px] p-4 md:p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 rounded-[12px] size-10 flex items-center justify-center">
                  <Wallet size={20} className="text-white" />
                </div>
                <p className="text-[16px] font-semibold">Next Payout</p>
              </div>
              <p className="text-2xl md:text-[32px] font-bold leading-tight mb-1">$1,240</p>
              <p className="text-sm text-white/90 mb-4">Expected on Nov 27, 2025</p>
              <div className="flex flex-col gap-2 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Frequency</span>
                  <span className="font-medium">Weekly</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Account</span>
                  <span className="font-medium">****4532</span>
                </div>
              </div>
            </div>

            {/* Settings Card */}
            <div className="bg-white rounded-[16px] border border-[#e5e7eb] p-4 md:p-6">
              <h2 className="text-[16px] md:text-[18px] text-[#101828] font-semibold leading-[24px] mb-4">Payout Settings</h2>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Bank Account', icon: CreditCard },
                  { label: 'Payment Schedule', icon: Clock },
                  { label: 'Tax Information', icon: Wallet }
                ].map((item, idx) => (
                  <button 
                    key={idx} 
                    className="bg-white border border-[rgba(0,0,0,0.08)] h-[44px] px-4 rounded-[10px] flex items-center justify-between hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={16} className="text-[#4a5565]" />
                      <span className="text-[14px] text-[#1a1a1a] font-medium">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-[#4a5565] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}