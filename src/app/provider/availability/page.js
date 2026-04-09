'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, Info, Loader2, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';
import AddExceptionModal from '@/components/provider/AddExceptionModal';
import { useApp } from '@/contexts/AppContext';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

export default function AvailabilityPage() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState([
    { name: 'Monday', day_of_week: 0, available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Tuesday', day_of_week: 1, available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Wednesday', day_of_week: 2, available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Thursday', day_of_week: 3, available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Friday', day_of_week: 4, available: true, slots: [{ start: '09:00', end: '17:00' }] },
    { name: 'Saturday', day_of_week: 5, available: false, slots: [] },
    { name: 'Sunday', day_of_week: 6, available: false, slots: [] },
  ]);
  const [exceptions, setExceptions] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const getAuthHeaders = () => {
    const token = Cookies.get("access_token");
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Tenant': tenantId || '',
    };
  };

  // Fetch availability on mount
  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/v1/providers/my-availability/`, {
        headers: getAuthHeaders(),
        credentials: "include",

      });

      if (!response.ok) throw new Error('Failed to fetch availability');

      const data = await response.json();
      if (data && data.length === 7) {
        setDays(data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Fetch exceptions
  const fetchExceptions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/providers/my-exceptions/`, {
        headers: getAuthHeaders(),
      credentials: "include",
      });

      if (!response.ok) throw new Error('Failed to fetch exceptions');

      const data = await response.json();
      setExceptions(data);
    } catch (err) {
      console.error('Failed to load exceptions:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAvailability();
    fetchExceptions();
  }, [fetchAvailability, fetchExceptions]);

  // Auto-save when toggling (debounced)
  const saveAvailability = async (updatedDays) => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/v1/providers/update-availability/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      credentials: "include",
        body: JSON.stringify({ days: updatedDays }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Availability updated');
      setHasChanges(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (index) => {
    const newDays = [...days];
    newDays[index].available = !newDays[index].available;
    
    if (newDays[index].available && newDays[index].slots.length === 0) {
      newDays[index].slots = [{ start: '09:00', end: '17:00' }];
    }
    
    setDays(newDays);
    setHasChanges(true);
    
    // Auto-save after a short delay
    setTimeout(() => saveAvailability(newDays), 500);
  };

  const updateSlot = (dayIndex, slotIndex, field, value) => {
    const newDays = [...days];
    newDays[dayIndex].slots[slotIndex][field] = value;
    setDays(newDays);
    setHasChanges(true);
  };

  const addSlot = (dayIndex) => {
    const newDays = [...days];
    const lastSlot = newDays[dayIndex].slots[newDays[dayIndex].slots.length - 1];
    const startHour = lastSlot ? parseInt(lastSlot.end.split(':')[0]) : 9;
    const endHour = Math.min(startHour + 1, 23);
    
    newDays[dayIndex].slots.push({
      start: `${String(startHour).padStart(2, '0')}:00`,
      end: `${String(endHour).padStart(2, '0')}:00`
    });
    setDays(newDays);
    setHasChanges(true);
  };

  const removeSlot = (dayIndex, slotIndex) => {
    const newDays = [...days];
    newDays[dayIndex].slots.splice(slotIndex, 1);
    if (newDays[dayIndex].slots.length === 0) {
      newDays[dayIndex].available = false;
    }
    setDays(newDays);
    setHasChanges(true);
    saveAvailability(newDays);
  };

  const handleAddException = async (exceptionData) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/providers/add-exception/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: "include",

        body: JSON.stringify(exceptionData),
      });

      if (!response.ok) throw new Error('Failed to add exception');

      toast.success('Exception added');
      fetchExceptions();
      setShowExceptionModal(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteException = async (exceptionId) => {
    if (!confirm('Delete this exception?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/v1/providers/delete-exception/?exception_id=${exceptionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: "include",

      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Exception deleted');
      fetchExceptions();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageName="Availability">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="size-8 animate-spin text-[#800020]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageName="Availability">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px]">My Availability</h1>
            <p className="text-sm md:text-[16px] text-[#4a5565] leading-[24px]">
              Set your working hours and manage time off
              {saving && <span className="ml-2 text-[#800020]">(Saving...)</span>}
            </p>
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
                <div className="flex flex-col gap-4">
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
                  </div>

                  {day.available && (
                    <div className="flex flex-col gap-2 pl-[60px]">
                      {day.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center gap-2">
                          <div className="flex items-center gap-2 bg-[#f3f4f6] px-4 py-2 rounded-[12px]">
                            <Clock size={16} className="text-[#364153]" />
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateSlot(index, slotIndex, 'start', e.target.value)}
                              className="bg-transparent border-none text-[14px] text-[#364153] focus:outline-none"
                            />
                            <span className="text-[#364153]">-</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateSlot(index, slotIndex, 'end', e.target.value)}
                              className="bg-transparent border-none text-[14px] text-[#364153] focus:outline-none"
                            />
                          </div>
                          {day.slots.length > 1 && (
                            <button
                              onClick={() => removeSlot(index, slotIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addSlot(index)}
                        className="text-[#800020] text-[14px] font-medium hover:underline w-fit"
                      >
                        + Add time slot
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {hasChanges && (
              <button
                onClick={() => saveAvailability(days)}
                disabled={saving}
                className="bg-[#800020] text-white h-[48px] rounded-[12px] font-medium hover:bg-[#600018] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
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
            
            {exceptions.length === 0 ? (
              <div className="text-center py-12 text-[#6a7282] bg-white border border-[#e5e7eb] rounded-[16px]">
                No exceptions added yet
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {exceptions.map((exc) => (
                  <div key={exc.id} className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#101828]">
                        {new Date(exc.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-[14px] text-[#4a5565]">
                        {exc.is_available ? 'Available (Override)' : 'Unavailable'} 
                        {exc.reason && ` • ${exc.reason}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteException(exc.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showExceptionModal && (
        <AddExceptionModal 
          onClose={() => setShowExceptionModal(false)} 
          onSave={handleAddException}
        />
      )}
    </DashboardLayout>
  );
}