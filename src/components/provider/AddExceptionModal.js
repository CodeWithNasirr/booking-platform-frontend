'use client';

import { useState } from 'react';
import { X, Calendar } from 'lucide-react';

export default function AddExceptionModal({ onClose, onSave }) {
  const [date, setDate] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ date, is_available: isAvailable, reason });
    setLoading(false);
  };

  // Get tomorrow's date for min attribute
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[16px] w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#101828]">Add Exception</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[14px] font-medium text-[#364153] mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[#4a5565]" />
              <input
                type="date"
                required
                min={minDate}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[44px] pl-10 pr-4 rounded-[12px] border border-[#e5e7eb] focus:border-[#800020] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#364153] mb-2">
              Availability
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  checked={!isAvailable}
                  onChange={() => setIsAvailable(false)}
                  className="accent-[#800020]"
                />
                <span className="text-[14px]">Day Off (Unavailable)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="availability"
                  checked={isAvailable}
                  onChange={() => setIsAvailable(true)}
                  className="accent-[#800020]"
                />
                <span className="text-[14px]">Available (Special Hours)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#364153] mb-2">
              Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Vacation, Public Holiday"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-[44px] px-4 rounded-[12px] border border-[#e5e7eb] focus:border-[#800020] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[44px] rounded-[12px] border border-[#e5e7eb] text-[#4a5565] font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !date}
              className="flex-1 h-[44px] rounded-[12px] bg-[#800020] text-white font-medium hover:bg-[#600018] disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Exception'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}