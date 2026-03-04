// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { useApp } from '@/contexts/AppContext'
// import {
//   ChevronLeft,
//   ChevronRight,
//   Calendar as CalendarIcon,
//   List,
//   Clock,
//   User,
//   Plus,
// } from 'lucide-react'
// import useBlockBackNavigation from '@/lib/useBlockBackNavigation'

// const mockCalendarBookings = [
//   {
//     id: '1',
//     customerName: 'Sarah Johnson',
//     serviceName: 'Haircut & Style',
//     providerName: 'Maria Garcia',
//     startTime: '10:00',
//     endTime: '11:00',
//     status: 'confirmed',
//     color: 'bg-blue-500',
//   },
//   {
//     id: '2',
//     customerName: 'John Smith',
//     serviceName: 'Beard Trim',
//     providerName: 'Ahmed Ali',
//     startTime: '11:30',
//     endTime: '12:00',
//     status: 'pending',
//     color: 'bg-yellow-500',
//   },
//   {
//     id: '3',
//     customerName: 'Emma Wilson',
//     serviceName: 'Hair Coloring',
//     providerName: 'Maria Garcia',
//     startTime: '14:00',
//     endTime: '16:00',
//     status: 'confirmed',
//     color: 'bg-blue-500',
//   },
//   {
//     id: '4',
//     customerName: 'Michael Brown',
//     serviceName: 'Massage',
//     providerName: 'Lisa Chen',
//     startTime: '15:30',
//     endTime: '16:30',
//     status: 'confirmed',
//     color: 'bg-blue-500',
//   },
//   {
//     id: '5',
//     customerName: 'Sophie Taylor',
//     serviceName: 'Manicure',
//     providerName: 'Anna Lee',
//     startTime: '16:00',
//     endTime: '17:15',
//     status: 'completed',
//     color: 'bg-green-500',
//   },
// ]

// const hours = Array.from({ length: 13 }, (_, i) => i + 9) // 9 AM to 9 PM
// const daysOfWeek = [
//   'Monday',
//   'Tuesday',
//   'Wednesday',
//   'Thursday',
//   'Friday',
//   'Saturday',
//   'Sunday',
// ]
// const monthDays = Array.from({ length: 31 }, (_, i) => i + 1)

// const providers = [
//   { id: 'all', name: 'All Providers' },
//   { id: '1', name: 'Maria Garcia' },
//   { id: '2', name: 'Ahmed Ali' },
//   { id: '3', name: 'Lisa Chen' },
//   { id: '4', name: 'Anna Lee' },
// ]

// export default function CalendarPage() {
//   const { user, loadingUser, requiresOnboarding } = useApp()
//   const router = useRouter()

//   const [viewMode, setViewMode] = useState('week')
//   const [selectedDate, setSelectedDate] = useState(new Date())
//   const [selectedProvider, setSelectedProvider] = useState('all')

//   // Block back navigation
//   useBlockBackNavigation(!!user)

//   // Auth guard
//   useEffect(() => {
//     if (!loadingUser && !user) {
//       router.replace('/')
//     }
//   }, [loadingUser, user, router])

//   // Onboarding redirect
//   useEffect(() => {
//     if (requiresOnboarding) {
//       router.replace('/auth/onboarding?step=1')
//     }
//   }, [requiresOnboarding, router])

//   if (requiresOnboarding || loadingUser) {
//     return null
//   }

//   const formatDate = (date) => {
//     return date.toLocaleDateString('en-US', {
//       month: 'long',
//       day: 'numeric',
//       year: 'numeric',
//     })
//   }

//   const getWeekDates = () => {
//     const curr = new Date(selectedDate)
//     const first = curr.getDate() - curr.getDay() + 1
//     return Array.from({ length: 7 }, (_, i) => {
//       const date = new Date(curr.setDate(first + i))
//       return {
//         date: date.getDate(),
//         day: daysOfWeek[i],
//         fullDate: date,
//         isToday: date.toDateString() === new Date().toDateString(),
//       }
//     })
//   }

//   const navigateDate = (direction) => {
//     const newDate = new Date(selectedDate)
//     if (viewMode === 'day') {
//       newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
//     } else if (viewMode === 'week') {
//       newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
//     } else {
//       newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
//     }
//     setSelectedDate(newDate)
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
//           <p className="text-gray-600 mt-1">View and manage your bookings schedule</p>
//         </div>

//         <div className="flex gap-3">
//           <button
//             onClick={() => router.push('/dashboard/bookings')}
//             className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
//           >
//             <List className="w-4 h-4" />
//             List View
//           </button>
//           <button
//             onClick={() => router.push('/dashboard/bookings')}
//             className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 transition-opacity font-medium shadow-sm"
//           >
//             <Plus className="w-4 h-4" />
//             New Booking
//           </button>
//         </div>
//       </div>

//       {/* Controls */}
//       <div className="bg-white border border-gray-200 rounded-xl p-4">
//         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//           {/* Date Navigation */}
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => navigateDate('prev')}
//               className="h-10 w-10 rounded-xl border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center"
//             >
//               <ChevronLeft className="w-4 h-4" />
//             </button>
//             <div className="min-w-[200px] text-center">
//               <p className="font-semibold text-gray-900">{formatDate(selectedDate)}</p>
//             </div>
//             <button
//               onClick={() => navigateDate('next')}
//               className="h-10 w-10 rounded-xl border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center"
//             >
//               <ChevronRight className="w-4 h-4" />
//             </button>
//             <button
//               onClick={() => setSelectedDate(new Date())}
//               className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition font-medium text-gray-700"
//             >
//               Today
//             </button>
//           </div>

//           {/* View Mode & Provider Filter */}
//           <div className="flex items-center gap-3">
//             <select
//               value={selectedProvider}
//               onChange={(e) => setSelectedProvider(e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
//             >
//               {providers.map((provider) => (
//                 <option key={provider.id} value={provider.id}>
//                   {provider.name}
//                 </option>
//               ))}
//             </select>

//             <div className="flex bg-gray-100 p-1 rounded-xl">
//               <button
//                 onClick={() => setViewMode('day')}
//                 className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//                   viewMode === 'day'
//                     ? 'bg-white text-gray-900 shadow-sm'
//                     : 'text-gray-600 hover:text-gray-900'
//                 }`}
//               >
//                 Day
//               </button>
//               <button
//                 onClick={() => setViewMode('week')}
//                 className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//                   viewMode === 'week'
//                     ? 'bg-white text-gray-900 shadow-sm'
//                     : 'text-gray-600 hover:text-gray-900'
//                 }`}
//               >
//                 Week
//               </button>
//               <button
//                 onClick={() => setViewMode('month')}
//                 className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
//                   viewMode === 'month'
//                     ? 'bg-white text-gray-900 shadow-sm'
//                     : 'text-gray-600 hover:text-gray-900'
//                 }`}
//               >
//                 Month
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Calendar Views */}
//       <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
//         {/* Day View */}
//         {viewMode === 'day' && (
//           <DayView selectedDate={selectedDate} hours={hours} bookings={mockCalendarBookings} formatDate={formatDate} />
//         )}

//         {/* Week View */}
//         {viewMode === 'week' && (
//           <WeekView getWeekDates={getWeekDates} hours={hours} bookings={mockCalendarBookings} />
//         )}

//         {/* Month View */}
//         {viewMode === 'month' && (
//           <MonthView
//             selectedDate={selectedDate}
//             daysOfWeek={daysOfWeek}
//             monthDays={monthDays}
//             bookings={mockCalendarBookings}
//           />
//         )}
//       </div>

//       {/* Legend */}
//       <div className="bg-white border border-gray-200 rounded-xl p-4">
//         <div className="flex items-center gap-6">
//           <p className="text-sm font-medium text-gray-600">Status:</p>
//           <div className="flex flex-wrap gap-4">
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 rounded bg-yellow-500" />
//               <span className="text-sm text-gray-700">Pending</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 rounded bg-blue-500" />
//               <span className="text-sm text-gray-700">Confirmed</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 rounded bg-purple-500" />
//               <span className="text-sm text-gray-700">In Progress</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 rounded bg-green-500" />
//               <span className="text-sm text-gray-700">Completed</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-4 rounded bg-red-500" />
//               <span className="text-sm text-gray-700">Cancelled</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Today's Schedule & Quick Stats */}
//       <div className="grid lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2">
//           <TodaySchedule bookings={mockCalendarBookings} />
//         </div>
//         <div>
//           <QuickStats />
//         </div>
//       </div>
//     </div>
//   )
// }

// // Booking Card Component
// function BookingCard({ booking }) {
//   return (
//     <div
//       className={`${booking.color} text-white p-2 rounded-lg mb-1 text-xs cursor-pointer hover:opacity-90 transition-opacity`}
//     >
//       <div className="font-medium truncate">{booking.customerName}</div>
//       <div className="text-white/90 truncate">{booking.serviceName}</div>
//       <div className="text-white/80 truncate">
//         {booking.startTime} - {booking.endTime}
//       </div>
//     </div>
//   )
// }

// // Day View Component
// function DayView({ selectedDate, hours, bookings, formatDate }) {
//   return (
//     <div className="p-6">
//       <div className="flex gap-6">
//         {/* Time Column */}
//         <div className="w-20 flex-shrink-0">
//           <div className="h-12" />
//           {hours.map((hour) => (
//             <div
//               key={hour}
//               className="h-20 border-b border-gray-100 text-sm text-gray-600 py-2"
//             >
//               {hour}:00
//             </div>
//           ))}
//         </div>

//         {/* Bookings Column */}
//         <div className="flex-1">
//           <div className="h-12 flex items-center justify-center bg-primary/10 rounded-xl mb-4">
//             <p className="font-medium text-gray-900">{formatDate(selectedDate)}</p>
//           </div>
//           <div className="relative">
//             {hours.map((hour) => (
//               <div key={hour} className="h-20 border-b border-gray-100">
//                 {bookings
//                   .filter((b) => parseInt(b.startTime.split(':')[0]) === hour)
//                   .map((booking) => (
//                     <BookingCard key={booking.id} booking={booking} />
//                   ))}
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// // Week View Component
// function WeekView({ getWeekDates, hours, bookings }) {
//   return (
//     <div className="overflow-x-auto">
//       <div className="min-w-[800px] p-6">
//         <div className="flex gap-2">
//           {/* Time Column */}
//           <div className="w-20 flex-shrink-0">
//             <div className="h-16" />
//             {hours.map((hour) => (
//               <div
//                 key={hour}
//                 className="h-20 border-b border-gray-100 text-sm text-gray-600 py-2"
//               >
//                 {hour}:00
//               </div>
//             ))}
//           </div>

//           {/* Day Columns */}
//           {getWeekDates().map((dayInfo, index) => (
//             <div key={index} className="flex-1 min-w-[120px]">
//               <div
//                 className={`h-16 flex flex-col items-center justify-center rounded-xl mb-2 ${
//                   dayInfo.isToday
//                     ? 'bg-primary text-white'
//                     : 'bg-gray-50'
//                 }`}
//               >
//                 <p
//                   className={`text-sm ${
//                     dayInfo.isToday ? 'text-white' : 'text-gray-600'
//                   }`}
//                 >
//                   {dayInfo.day.slice(0, 3)}
//                 </p>
//                 <p
//                   className={`text-xl font-semibold ${
//                     dayInfo.isToday ? 'text-white' : 'text-gray-900'
//                   }`}
//                 >
//                   {dayInfo.date}
//                 </p>
//               </div>
//               <div className="relative">
//                 {hours.map((hour) => (
//                   <div key={hour} className="h-20 border-b border-gray-100 px-1">
//                     {index < 3 &&
//                       bookings
//                         .filter((b) => parseInt(b.startTime.split(':')[0]) === hour)
//                         .slice(0, 1)
//                         .map((booking) => (
//                           <BookingCard key={booking.id} booking={booking} />
//                         ))}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }

// // Month View Component
// function MonthView({ selectedDate, daysOfWeek, monthDays, bookings }) {
//   return (
//     <div className="p-6">
//       {/* Month Header */}
//       <div className="grid grid-cols-7 gap-2 mb-2">
//         {daysOfWeek.map((day) => (
//           <div
//             key={day}
//             className="text-center text-sm font-medium text-gray-600 py-2"
//           >
//             {day.slice(0, 3)}
//           </div>
//         ))}
//       </div>

//       {/* Calendar Grid */}
//       <div className="grid grid-cols-7 gap-2">
//         {monthDays.map((day) => {
//           const isToday =
//             day === new Date().getDate() &&
//             selectedDate.getMonth() === new Date().getMonth()
//           const hasBookings = day <= 15

//           return (
//             <div
//               key={day}
//               className={`min-h-[100px] p-2 border rounded-xl hover:border-primary/30 transition-colors cursor-pointer ${
//                 isToday ? 'bg-primary/5 border-primary' : 'border-gray-200'
//               }`}
//             >
//               <div
//                 className={`text-sm font-medium mb-2 ${
//                   isToday ? 'text-primary' : 'text-gray-900'
//                 }`}
//               >
//                 {day}
//               </div>
//               {hasBookings && (
//                 <div className="space-y-1">
//                   {bookings.slice(0, 2).map((booking, idx) => (
//                     <div
//                       key={idx}
//                       className={`${booking.color} text-white text-xs p-1 rounded truncate`}
//                     >
//                       {booking.startTime} {booking.serviceName}
//                     </div>
//                   ))}
//                   {bookings.length > 2 && (
//                     <div className="text-xs text-gray-600 text-center">
//                       +{bookings.length - 2} more
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           )
//         })}
//       </div>
//     </div>
//   )
// }

// // Today's Schedule Component
// function TodaySchedule({ bookings }) {
//   return (
//     <div className="bg-white border border-gray-200 rounded-xl p-6">
//       <h3 className="font-semibold text-gray-900 mb-4">Today&apos;s Schedule</h3>
//       <div className="space-y-3">
//         {bookings.slice(0, 5).map((booking) => (
//           <div
//             key={booking.id}
//             className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
//           >
//             <div className={`w-1 h-12 rounded-full ${booking.color}`} />
//             <div className="flex-1 min-w-0">
//               <p className="font-medium text-gray-900 truncate">
//                 {booking.customerName}
//               </p>
//               <p className="text-sm text-gray-600 truncate">{booking.serviceName}</p>
//             </div>
//             <div className="text-right">
//               <p className="text-sm font-medium text-gray-900">{booking.startTime}</p>
//               <p className="text-xs text-gray-600">{booking.providerName}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// // Quick Stats Component
// function QuickStats() {
//   const stats = [
//     {
//       label: 'Today',
//       value: '12',
//       icon: CalendarIcon,
//       bgColor: 'bg-primary/10',
//       iconBg: 'bg-primary',
//     },
//     {
//       label: 'This Week',
//       value: '68',
//       icon: Clock,
//       bgColor: 'bg-purple-50',
//       iconBg: 'bg-purple-500',
//     },
//     {
//       label: 'This Month',
//       value: '284',
//       icon: User,
//       bgColor: 'bg-green-50',
//       iconBg: 'bg-green-500',
//     },
//   ]

//   return (
//     <div className="bg-white border border-gray-200 rounded-xl p-6">
//       <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
//       <div className="space-y-4">
//         {stats.map((stat, i) => {
//           const Icon = stat.icon
//           return (
//             <div
//               key={i}
//               className={`flex items-center justify-between p-3 ${stat.bgColor} rounded-xl`}
//             >
//               <div className="flex items-center gap-3">
//                 <div
//                   className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}
//                 >
//                   <Icon className="w-5 h-5 text-white" />
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600">{stat.label}</p>
//                   <p className="text-xl font-bold text-gray-900">{stat.value}</p>
//                 </div>
//               </div>
//             </div>
//           )
//         })}
//       </div>
//     </div>
//   )
// }

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import { useCalendar } from './hooks/useCalendar';
import useBlockBackNavigation from '@/lib/useBlockBackNavigation';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Clock,
  User,
  Plus,
  Video,
  RefreshCw,
  Loader2,
  ExternalLink,
} from 'lucide-react';

// Hours to display (9 AM to 9 PM)
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9);
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Status colors mapping
const STATUS_COLORS = {
  draft: 'bg-gray-400',
  pending_payment: 'bg-yellow-500',
  deposit_paid: 'bg-orange-500',
  paid: 'bg-blue-400',
  confirmed: 'bg-blue-500',
  scheduled: 'bg-indigo-500',
  in_progress: 'bg-purple-500',
  delivered: 'bg-teal-500',
  completed: 'bg-green-500',
  revision_requested: 'bg-amber-500',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending_payment: 'Pending Payment',
  deposit_paid: 'Deposit Paid',
  paid: 'Paid',
  confirmed: 'Confirmed',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  delivered: 'Delivered',
  completed: 'Completed',
  revision_requested: 'Revision',
};

export default function CalendarPage() {
  const { user, loadingUser, requiresOnboarding } = useApp();
  const router = useRouter();
  const calendar = useCalendar();

  // Block back navigation when user is logged in
  useBlockBackNavigation(!!user);

  // Auth guard
  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace('/');
    }
  }, [loadingUser, user, router]);

  // Onboarding redirect
  useEffect(() => {
    if (requiresOnboarding) {
      router.replace('/auth/onboarding?step=1');
    }
  }, [requiresOnboarding, router]);

  if (requiresOnboarding || loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleBookingClick = (booking) => {
    router.push(`/dashboard/bookings?booking=${booking.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage your bookings schedule</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={calendar.refreshAll}
            disabled={calendar.isLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${calendar.isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => router.push('/dashboard/bookings')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <List className="w-4 h-4" />
            List View
          </button>
          <button
            onClick={() => router.push('/dashboard/bookings?new=true')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 transition-opacity font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => calendar.navigateDate('prev')}
              className="h-10 w-10 rounded-xl border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-[240px] text-center">
              <p className="font-semibold text-gray-900">{calendar.displayDate}</p>
            </div>
            <button
              onClick={() => calendar.navigateDate('next')}
              className="h-10 w-10 rounded-xl border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={calendar.goToToday}
              className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition font-medium text-gray-700"
            >
              Today
            </button>
          </div>

          {/* View Mode & Provider Filter */}
          <div className="flex items-center gap-3">
            <select
              value={calendar.selectedProvider}
              onChange={(e) => calendar.setSelectedProvider(e.target.value)}
              disabled={calendar.loadingProviders}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              {calendar.providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>

            <div className="flex bg-gray-100 p-1 rounded-xl">
              {['day', 'week', 'month'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => calendar.setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                    calendar.viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {calendar.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{calendar.error}</p>
          <button
            onClick={calendar.fetchBookings}
            className="mt-2 text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Calendar Views */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden relative">
        {calendar.loadingBookings && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {calendar.viewMode === 'day' && (
          <DayView
            selectedDate={calendar.selectedDate}
            bookings={calendar.getBookingsForDate(calendar.dateRange.start)}
            onBookingClick={handleBookingClick}
          />
        )}

        {calendar.viewMode === 'week' && (
          <WeekView
            weekDates={calendar.weekDates}
            getBookingsForDate={calendar.getBookingsForDate}
            onBookingClick={handleBookingClick}
          />
        )}

        {calendar.viewMode === 'month' && (
          <MonthView
            monthDates={calendar.monthDates}
            getBookingsForDate={calendar.getBookingsForDate}
            onDateClick={calendar.goToDate}
            onBookingClick={handleBookingClick}
          />
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <p className="text-sm font-medium text-gray-600">Status:</p>
          <div className="flex flex-wrap gap-4">
            {Object.entries(STATUS_LABELS).slice(0, 6).map(([status, label]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${STATUS_COLORS[status]}`} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Schedule & Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TodaySchedule
            schedule={calendar.todaySchedule}
            loading={calendar.loadingToday}
            onBookingClick={handleBookingClick}
          />
        </div>
        <div>
          <QuickStats stats={calendar.stats} loading={calendar.loadingStats} />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// BOOKING CARD COMPONENT
// =====================================================

function BookingCard({ booking, onClick, compact = false }) {
  const color = booking.color || STATUS_COLORS[booking.status] || 'bg-gray-500';

  if (compact) {
    return (
      <div
        onClick={() => onClick?.(booking)}
        className={`${color} text-white px-2 py-1 rounded text-xs cursor-pointer hover:opacity-90 transition-opacity truncate`}
      >
        {booking.start_time} {booking.service_name}
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick?.(booking)}
      className={`${color} text-white p-2 rounded-lg mb-1 text-xs cursor-pointer hover:opacity-90 transition-opacity`}
    >
      <div className="font-medium truncate">{booking.customer_name}</div>
      <div className="text-white/90 truncate">{booking.service_name}</div>
      <div className="text-white/80 truncate">
        {booking.start_time}
        {booking.end_time && ` - ${booking.end_time}`}
      </div>
    </div>
  );
}

// =====================================================
// DAY VIEW COMPONENT
// =====================================================

function DayView({ selectedDate, bookings, onBookingClick }) {
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group bookings by hour
  const bookingsByHour = {};
  bookings.forEach((booking) => {
    if (booking.start_time) {
      const hour = parseInt(booking.start_time.split(':')[0], 10);
      if (!bookingsByHour[hour]) {
        bookingsByHour[hour] = [];
      }
      bookingsByHour[hour].push(booking);
    }
  });

  return (
    <div className="p-6">
      <div className="flex gap-6">
        {/* Time Column */}
        <div className="w-20 flex-shrink-0">
          <div className="h-12" />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-20 border-b border-gray-100 text-sm text-gray-600 py-2"
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Bookings Column */}
        <div className="flex-1">
          <div className="h-12 flex items-center justify-center bg-primary/10 rounded-xl mb-4">
            <p className="font-medium text-gray-900">{formatDate(selectedDate)}</p>
          </div>
          <div className="relative">
            {HOURS.map((hour) => (
              <div key={hour} className="h-20 border-b border-gray-100 px-2">
                {(bookingsByHour[hour] || []).map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onClick={onBookingClick}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// WEEK VIEW COMPONENT
// =====================================================

function WeekView({ weekDates, getBookingsForDate, onBookingClick }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px] p-6">
        <div className="flex gap-2">
          {/* Time Column */}
          <div className="w-20 flex-shrink-0">
            <div className="h-16" />
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-20 border-b border-gray-100 text-sm text-gray-600 py-2"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDates.map((dayInfo, index) => {
            const dayBookings = getBookingsForDate(dayInfo.dateStr);
            
            // Group by hour
            const bookingsByHour = {};
            dayBookings.forEach((booking) => {
              if (booking.start_time) {
                const hour = parseInt(booking.start_time.split(':')[0], 10);
                if (!bookingsByHour[hour]) {
                  bookingsByHour[hour] = [];
                }
                bookingsByHour[hour].push(booking);
              }
            });

            return (
              <div key={index} className="flex-1 min-w-[120px]">
                <div
                  className={`h-16 flex flex-col items-center justify-center rounded-xl mb-2 ${
                    dayInfo.isToday ? 'bg-primary text-white' : 'bg-gray-50'
                  }`}
                >
                  <p className={`text-sm ${dayInfo.isToday ? 'text-white' : 'text-gray-600'}`}>
                    {dayInfo.day.slice(0, 3)}
                  </p>
                  <p
                    className={`text-xl font-semibold ${
                      dayInfo.isToday ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {dayInfo.date}
                  </p>
                </div>
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-20 border-b border-gray-100 px-1">
                      {(bookingsByHour[hour] || []).slice(0, 2).map((booking) => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          onClick={onBookingClick}
                        />
                      ))}
                      {(bookingsByHour[hour]?.length || 0) > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{bookingsByHour[hour].length - 2} more
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MONTH VIEW COMPONENT
// =====================================================

function MonthView({ monthDates, getBookingsForDate, onDateClick, onBookingClick }) {
  return (
    <div className="p-6">
      {/* Month Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {monthDates.map((dayInfo, index) => {
          const dayBookings = getBookingsForDate(dayInfo.dateStr);
          const hasBookings = dayBookings.length > 0;

          return (
            <div
              key={index}
              onClick={() => onDateClick?.(dayInfo.fullDate)}
              className={`min-h-[100px] p-2 border rounded-xl hover:border-primary/30 transition-colors cursor-pointer ${
                dayInfo.isToday
                  ? 'bg-primary/5 border-primary'
                  : dayInfo.isCurrentMonth
                  ? 'border-gray-200'
                  : 'border-gray-100 bg-gray-50/50'
              }`}
            >
              <div
                className={`text-sm font-medium mb-2 ${
                  dayInfo.isToday
                    ? 'text-primary'
                    : dayInfo.isCurrentMonth
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
              >
                {dayInfo.date}
              </div>
              {hasBookings && (
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onClick={onBookingClick}
                      compact
                    />
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-gray-600 text-center">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================
// TODAY'S SCHEDULE COMPONENT
// =====================================================

function TodaySchedule({ schedule, loading, onBookingClick }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Today&apos;s Schedule</h3>
        {schedule?.count > 0 && (
          <span className="text-sm text-gray-500">{schedule.count} bookings</span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : !schedule?.bookings?.length ? (
        <div className="text-center py-8 text-gray-500">
          <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No bookings scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedule.bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => onBookingClick?.(booking)}
              className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className={`w-1 h-12 rounded-full ${booking.color || 'bg-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {booking.customer_name}
                </p>
                <p className="text-sm text-gray-600 truncate">{booking.service_name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-gray-900">{booking.start_time}</p>
                <p className="text-xs text-gray-600">{booking.provider_name}</p>
              </div>
              {booking.meeting_url && (
                <a
                  href={booking.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                >
                  <Video className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// QUICK STATS COMPONENT
// =====================================================

function QuickStats({ stats, loading }) {
  const statsList = [
    {
      label: 'Today',
      value: stats?.today ?? 0,
      icon: CalendarIcon,
      bgColor: 'bg-primary/10',
      iconBg: 'bg-primary',
    },
    {
      label: 'This Week',
      value: stats?.this_week ?? 0,
      icon: Clock,
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-500',
    },
    {
      label: 'This Month',
      value: stats?.this_month ?? 0,
      icon: User,
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-500',
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {statsList.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className={`flex items-center justify-between p-3 ${stat.bgColor} rounded-xl`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}