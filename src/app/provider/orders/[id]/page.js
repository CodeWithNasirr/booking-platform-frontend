'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Video, MessageSquare, Upload, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/provider/DashboardLayout';
import Link from 'next/link';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;

  const orderDetails = {
    title: 'Logo Design',
    id: orderId,
    client: 'Sarah Johnson',
    initials: 'SJ',
    orderDate: '01/01/2026',
    deadline: '05/01/2026',
    price: '$250',
    daysLeft: '2 days',
    status: 'In Progress',
    description: 'Need a modern logo for my tech startup. Looking for something minimalist and professional.'
  };

  return (
    <DashboardLayout pageName="Order Details">
      <div className="flex flex-col gap-6">
        {/* Back Button */}
        <Link 
          href="/provider/orders" 
          className="flex items-center gap-2 text-[#364153] hover:text-[#101828] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          <span className="text-[14px] leading-[20px]">Back to Orders</span>
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
              {/* Header Info */}
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-[#800020] rounded-full size-12 md:size-14 flex items-center justify-center shrink-0 text-white font-semibold text-lg">
                  {orderDetails.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                    <div>
                      <h1 className="text-xl md:text-[24px] text-[#101828] font-bold leading-[32px] mb-1">
                        {orderDetails.title}
                      </h1>
                      <p className="text-[14px] md:text-[16px] text-[#4a5565]">Order #{orderDetails.id}</p>
                      <p className="text-[13px] md:text-[14px] text-[#4a5565]">Client: {orderDetails.client}</p>
                    </div>
                    <div className="bg-[#dbeafe] border border-[#bedbff] h-[28px] px-4 rounded-[10px] flex items-center shrink-0 w-fit">
                      <span className="text-[14px] text-[#1447e6] font-medium">{orderDetails.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <DetailItem label="Order Date" value={orderDetails.orderDate} />
                <DetailItem label="Deadline" value={orderDetails.deadline} />
                <DetailItem label="Price" value={orderDetails.price} />
                <DetailItem label="Days Left" value={orderDetails.daysLeft} highlight />
              </div>

              {/* Description */}
              <div className="border-t border-[#e5e7eb] pt-6">
                <h2 className="text-[18px] text-[#101828] font-semibold leading-[24px] mb-2">Order Description</h2>
                <p className="text-[14px] text-[#4a5565] leading-[20px]">{orderDetails.description}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-4 md:p-6">
              <h2 className="text-[18px] text-[#101828] font-semibold leading-[24px] mb-4">Quick Actions</h2>
              <div className="flex flex-col gap-2">
                <button className="bg-[#800020] h-[40px] rounded-[10px] flex items-center justify-center gap-2 text-white text-[14px] font-medium hover:bg-[#600018] transition-colors">
                  <Video size={16} />
                  Start Video Call
                </button>
                <button className="bg-white border border-[rgba(0,0,0,0.08)] h-[40px] rounded-[10px] text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare size={16} />
                  Send Message
                </button>
                <button className="bg-white border border-[rgba(0,0,0,0.08)] h-[40px] rounded-[10px] text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Upload size={16} />
                  Upload Files
                </button>
                <button className="bg-white border border-[rgba(0,0,0,0.08)] h-[40px] rounded-[10px] text-[#1a1a1a] text-[14px] font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle size={16} />
                  Mark as Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function DetailItem({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[12px] text-[#6a7282] leading-[16px] mb-1">{label}</p>
      <p className={`text-[15px] md:text-[16px] font-semibold leading-[24px] ${highlight ? 'text-[#800020]' : 'text-[#101828]'}`}>
        {value}
      </p>
    </div>
  );
}