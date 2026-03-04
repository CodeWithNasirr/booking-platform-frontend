'use client';

import { useState } from 'react';
import { Plus, Clock, Info } from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';
import AddExceptionModal from '@/components/provider/AddExceptionModal';

export default function AvailabilityPage() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [days, setDays] = useState([
    { name: 'Monday', available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Tuesday', available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Wednesday', available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Thursday', available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Friday', available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Saturday', available: false, slots: [] },
    { name: 'Sunday', available: false, slots: [] },
  ]);

  const toggleDay = (index) => {
    const newDays = [...days];
    newDays[index].available = !newDays[index].available;
    if (newDays[index].available && newDays[index].slots.length === 0) {
      newDays[index].slots = [{ start: '09:00', end: '17:00' }];
    }
    setDays(newDays);
  };

  return (
    <DashboardLayout pageName="Availability">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">My Availability</h1>
            <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">Set your working hours and manage time off</p>
          </div>
          <button
            onClick={() => setShowExceptionModal(true)}
            className="bg-[#800020] h-[36px] px-4 rounded-[10px] shadow-md flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors w-full sm:w-auto"
          >
            <Plus size={16} />
            Add Exception
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-[#f3f4f6] flex gap-2 p-1 rounded-[16px] w-fit">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`h-[40px] rounded-[12px] px-4 transition-all ${
              activeTab === 'weekly' 
                ? 'bg-white shadow-sm text-[#101828]' 
                : 'text-[#4a5565] hover:bg-white/50'
            }`}
          >
            <span className="text-[14px] md:text-[16px]">Weekly Schedule</span>
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`h-[40px] rounded-[12px] px-4 transition-all ${
              activeTab === 'exceptions' 
                ? 'bg-white shadow-sm text-[#101828]' 
                : 'text-[#4a5565] hover:bg-white/50'
            }`}
          >
            <span className="text-[14px] md:text-[16px]">Exceptions & Leaves</span>
          </button>
        </div>

        {activeTab === 'weekly' ? (
          <div className="flex flex-col gap-3 md:gap-4">
            {days.map((day, index) => (
              <div key={day.name} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={day.available} 
                        onChange={() => toggleDay(index)} 
                        className="sr-only peer" 
                      />
                      <div className={`w-11 h-6 rounded-full peer transition-colors ${day.available ? 'bg-[#800020]' : 'bg-gray-200'}`}>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${day.available ? 'translate-x-5' : ''}`} />
                      </div>
                    </label>
                    <div>
                      <p className="text-[16px] text-[#101828] font-semibold leading-[24px]">{day.name}</p>
                      <p className="text-[14px] text-[#4a5565]">{day.available ? 'Available' : 'Unavailable'}</p>
                    </div>
                  </div>
                  {day.available && (
                    <div className="flex items-center gap-2 bg-[#f3f4f6] h-[40px] px-4 rounded-[12px] w-fit">
                      <Clock size={16} className="text-[#364153]" />
                      <span className="text-[14px] text-[#364153]">{day.slots[0].start} - {day.slots[0].end}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[12px] p-4 flex gap-3">
              <Info className="size-5 text-[#2563eb] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[14px] text-[#1e40af] font-semibold mb-1">About Exceptions</h3>
                <p className="text-[14px] text-[#1e40af] leading-[20px]">
                  Exceptions override your regular weekly schedule. Use them to block specific dates for vacation, holidays, or to set special hours for certain days.
                </p>
              </div>
            </div>
            <div className="text-center py-12 text-[#6a7282]">
              No exceptions added yet
            </div>
          </div>
        )}
      </div>

      {showExceptionModal && (
        <AddExceptionModal onClose={() => setShowExceptionModal(false)} />
      )}
    </DashboardLayout>
  );
}