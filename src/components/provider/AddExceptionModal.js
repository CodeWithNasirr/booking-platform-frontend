'use client';

import { X, Plus } from 'lucide-react';

export default function AddExceptionModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-[12px] shadow-xl w-full max-w-[510px] relative p-4 md:p-6">
        <button onClick={onClose} className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-lg">
          <X size={20} className="text-[#1A1A1A]" />
        </button>

        <div className="mb-6">
          <h2 className="text-[18px] text-[#1a1a1a] font-semibold mb-1">Add Exception</h2>
          <p className="text-[14px] text-[#6c6c7c]">Block specific dates or set special hours for certain days</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-2">
            <label className="text-[14px] text-[#1a1a1a] font-medium">Exception Type *</label>
            <select className="h-[40px] rounded-[12px] border border-[#e5e7eb] px-3 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#800020]/20">
              <option>Full Day Off</option>
              <option>Partial Availability</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] text-[#1a1a1a] font-medium">Title *</label>
            <input 
              type="text" 
              placeholder="e.g., Vacation, Holiday, Special Event"
              className="bg-[#f8f9fa] h-[40px] rounded-[10px] px-3 text-[14px] border border-transparent focus:border-[#800020] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] text-[#1a1a1a] font-medium">Description</label>
            <textarea 
              rows={2}
              placeholder="Optional description..."
              className="bg-[#f8f9fa] rounded-[10px] p-3 text-[14px] border border-transparent focus:border-[#800020] focus:outline-none resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] text-[#1a1a1a] font-medium">Date *</label>
            <input 
              type="date" 
              className="h-[40px] rounded-[12px] border border-[#e5e7eb] px-3 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="bg-white border border-[rgba(0,0,0,0.08)] h-[40px] px-6 rounded-[10px] text-[14px] font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-[#800020] h-[40px] px-6 rounded-[10px] text-white text-[14px] font-medium hover:bg-[#600018] flex items-center gap-2"
            >
              <Plus size={16} />
              Add Exception
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}