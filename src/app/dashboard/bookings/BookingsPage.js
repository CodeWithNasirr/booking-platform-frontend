// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { useApp } from '@/contexts/AppContext'
// import {
//   Plus,
//   Search,
//   Calendar as CalendarIcon,
//   Clock,
//   DollarSign,
//   MoreVertical,
//   Eye,
//   Edit,
//   Trash2,
//   CheckCircle,
//   XCircle,
//   Download,
//   RefreshCw,
//   X,
// } from 'lucide-react'
// import useBlockBackNavigation from '@/lib/useBlockBackNavigation'

// const mockBookings = [
//   {
//     id: '1',
//     bookingNumber: 'BK-2024-0001',
//     customer: {
//       name: 'Sarah Johnson',
//       email: 'sarah@email.com',
//       phone: '+1 234 567 8900',
//     },
//     service: { name: 'Haircut & Style', duration: 60, price: 85 },
//     provider: { name: 'Maria Garcia' },
//     date: '2024-01-15',
//     time: '10:00 AM',
//     status: 'confirmed',
//     paymentStatus: 'paid',
//     notes: 'Customer prefers window seat',
//     createdAt: '2024-01-10',
//   },
//   {
//     id: '2',
//     bookingNumber: 'BK-2024-0002',
//     customer: {
//       name: 'John Smith',
//       email: 'john@email.com',
//       phone: '+1 234 567 8901',
//     },
//     service: { name: 'Beard Trim', duration: 30, price: 35 },
//     provider: { name: 'Ahmed Ali' },
//     date: '2024-01-15',
//     time: '11:30 AM',
//     status: 'pending',
//     paymentStatus: 'unpaid',
//     createdAt: '2024-01-14',
//   },
//   {
//     id: '3',
//     bookingNumber: 'BK-2024-0003',
//     customer: { name: 'Emma Wilson', email: 'emma@email.com', phone: '+1 234 567 8902' },
//     service: { name: 'Hair Coloring', duration: 120, price: 150 },
//     provider: { name: 'Maria Garcia' },
//     date: '2024-01-15',
//     time: '02:00 PM',
//     status: 'in-progress',
//     paymentStatus: 'paid',
//     createdAt: '2024-01-12',
//   },
//   {
//     id: '4',
//     bookingNumber: 'BK-2024-0004',
//     customer: {
//       name: 'Michael Brown',
//       email: 'michael@email.com',
//       phone: '+1 234 567 8903',
//     },
//     service: { name: 'Massage Therapy', duration: 60, price: 120 },
//     provider: { name: 'Lisa Chen' },
//     date: '2024-01-14',
//     time: '03:30 PM',
//     status: 'completed',
//     paymentStatus: 'paid',
//     createdAt: '2024-01-10',
//   },
//   {
//     id: '5',
//     bookingNumber: 'BK-2024-0005',
//     customer: {
//       name: 'Sophie Taylor',
//       email: 'sophie@email.com',
//       phone: '+1 234 567 8904',
//     },
//     service: { name: 'Manicure & Pedicure', duration: 75, price: 55 },
//     provider: { name: 'Anna Lee' },
//     date: '2024-01-14',
//     time: '04:00 PM',
//     status: 'cancelled',
//     paymentStatus: 'refunded',
//     notes: 'Cancelled due to emergency',
//     createdAt: '2024-01-13',
//   },
// ]

// const mockServices = [
//   { id: '1', name: 'Haircut & Style', duration: 60, price: 85 },
//   { id: '2', name: 'Color Treatment', duration: 120, price: 150 },
//   { id: '3', name: 'Beard Trim', duration: 30, price: 35 },
//   { id: '4', name: 'Facial Treatment', duration: 45, price: 80 },
//   { id: '5', name: 'Massage Therapy', duration: 60, price: 120 },
// ]

// const mockProviders = [
//   { id: '1', name: 'Maria Garcia', specialties: ['Hair', 'Color'] },
//   { id: '2', name: 'Ahmed Ali', specialties: ['Barber'] },
//   { id: '3', name: 'Lisa Chen', specialties: ['Massage', 'Wellness'] },
//   { id: '4', name: 'Anna Lee', specialties: ['Nails'] },
// ]

// const timeSlots = [
//   '09:00 AM',
//   '09:30 AM',
//   '10:00 AM',
//   '10:30 AM',
//   '11:00 AM',
//   '11:30 AM',
//   '12:00 PM',
//   '12:30 PM',
//   '01:00 PM',
//   '01:30 PM',
//   '02:00 PM',
//   '02:30 PM',
//   '03:00 PM',
//   '03:30 PM',
//   '04:00 PM',
//   '04:30 PM',
//   '05:00 PM',
//   '05:30 PM',
// ]

// const statusConfig = {
//   pending: {
//     label: 'Pending',
//     color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
//     icon: Clock,
//   },
//   confirmed: {
//     label: 'Confirmed',
//     color: 'bg-blue-100 text-blue-700 border-blue-200',
//     icon: CheckCircle,
//   },
//   'in-progress': {
//     label: 'In Progress',
//     color: 'bg-purple-100 text-purple-700 border-purple-200',
//     icon: RefreshCw,
//   },
//   completed: {
//     label: 'Completed',
//     color: 'bg-green-100 text-green-700 border-green-200',
//     icon: CheckCircle,
//   },
//   cancelled: {
//     label: 'Cancelled',
//     color: 'bg-red-100 text-red-700 border-red-200',
//     icon: XCircle,
//   },
//   'no-show': {
//     label: 'No Show',
//     color: 'bg-gray-100 text-gray-700 border-gray-200',
//     icon: XCircle,
//   },
// }

// const paymentConfig = {
//   unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-700' },
//   paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
//   partial: { label: 'Partial', color: 'bg-yellow-100 text-yellow-700' },
//   refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
// }

// export default function BookingsPage() {
//   const { user, loadingUser, requiresOnboarding } = useApp()
//   const router = useRouter()

//   const [bookings, setBookings] = useState(mockBookings)
//   const [search, setSearch] = useState('')
//   const [statusFilter, setStatusFilter] = useState('all')
//   const [paymentFilter, setPaymentFilter] = useState('all')
//   const [newBookingModal, setNewBookingModal] = useState(false)
//   const [viewingBooking, setViewingBooking] = useState(null)
//   const [menuOpenId, setMenuOpenId] = useState(null)
//   const [activeTab, setActiveTab] = useState('customer')

//   const [form, setForm] = useState({
//     customerName: '',
//     customerEmail: '',
//     customerPhone: '',
//     serviceId: '',
//     providerId: '',
//     date: '',
//     time: '',
//     notes: '',
//   })

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

//   const filtered = bookings.filter((b) => {
//     const matchSearch =
//       b.customer.name.toLowerCase().includes(search.toLowerCase()) ||
//       b.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
//       b.service.name.toLowerCase().includes(search.toLowerCase())
//     const matchStatus = statusFilter === 'all' || b.status === statusFilter
//     const matchPayment = paymentFilter === 'all' || b.paymentStatus === paymentFilter
//     return matchSearch && matchStatus && matchPayment
//   })

//   const stats = [
//     {
//       label: 'Total Bookings',
//       value: bookings.length,
//       icon: CalendarIcon,
//       bgColor: 'bg-[#8B1E3F]/10',
//       textColor: 'text-[#8B1E3F]',
//     },
//     {
//       label: 'Pending',
//       value: bookings.filter((b) => b.status === 'pending').length,
//       icon: Clock,
//       bgColor: 'bg-yellow-100',
//       textColor: 'text-yellow-600',
//     },
//     {
//       label: 'Confirmed',
//       value: bookings.filter((b) => b.status === 'confirmed').length,
//       icon: CheckCircle,
//       bgColor: 'bg-blue-100',
//       textColor: 'text-blue-600',
//     },
//     {
//       label: 'Completed',
//       value: bookings.filter((b) => b.status === 'completed').length,
//       icon: CheckCircle,
//       bgColor: 'bg-green-100',
//       textColor: 'text-green-600',
//     },
//     {
//       label: 'Revenue',
//       value: `$${bookings
//         .filter((b) => b.paymentStatus === 'paid' || b.paymentStatus === 'partial')
//         .reduce((sum, b) => sum + b.service.price, 0)}`,
//       icon: DollarSign,
//       bgColor: 'bg-green-100',
//       textColor: 'text-green-600',
//     },
//   ]

//   const handleCreateBooking = () => {
//     const service = mockServices.find((s) => s.id === form.serviceId)
//     const provider = mockProviders.find((p) => p.id === form.providerId)

//     if (!service || !provider) return

//     const booking = {
//       id: String(Date.now()),
//       bookingNumber: `BK-2024-${String(bookings.length + 1).padStart(4, '0')}`,
//       customer: {
//         name: form.customerName,
//         email: form.customerEmail,
//         phone: form.customerPhone,
//       },
//       service: {
//         name: service.name,
//         duration: service.duration,
//         price: service.price,
//       },
//       provider: { name: provider.name },
//       date: form.date,
//       time: form.time,
//       status: 'pending',
//       paymentStatus: 'unpaid',
//       notes: form.notes,
//       createdAt: new Date().toISOString().split('T')[0],
//     }

//     setBookings([booking, ...bookings])
//     setNewBookingModal(false)
//     resetForm()
//   }

//   const resetForm = () => {
//     setForm({
//       customerName: '',
//       customerEmail: '',
//       customerPhone: '',
//       serviceId: '',
//       providerId: '',
//       date: '',
//       time: '',
//       notes: '',
//     })
//     setActiveTab('customer')
//   }

//   const handleStatusChange = (bookingId, newStatus) => {
//     setBookings((prev) =>
//       prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
//     )
//     setMenuOpenId(null)
//   }

//   const handleDelete = (bookingId) => {
//     if (confirm('Are you sure you want to delete this booking?')) {
//       setBookings((prev) => prev.filter((b) => b.id !== bookingId))
//     }
//     setMenuOpenId(null)
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
//           <p className="text-gray-600 mt-1">
//             Manage all your appointments and reservations
//           </p>
//         </div>

//         <div className="flex gap-3">
//           <button
//             onClick={() => router.push('/dashboard/calendar')}
//             className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
//           >
//             <CalendarIcon className="w-4 h-4" />
//             Calendar View
//           </button>
//           <button
//             onClick={() => setNewBookingModal(true)}
//             className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 transition-opacity font-medium shadow-sm"
//           >
//             <Plus className="w-4 h-4" />
//             New Booking
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
//         {stats.map((stat, i) => {
//           const Icon = stat.icon
//           return (
//             <div
//               key={i}
//               className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600">{stat.label}</p>
//                   <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
//                 </div>
//                 <div
//                   className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
//                 >
//                   <Icon className={`w-6 h-6 ${stat.textColor}`} />
//                 </div>
//               </div>
//             </div>
//           )
//         })}
//       </div>

//       {/* Filters */}
//       <div className="bg-white border border-gray-200 rounded-xl p-4">
//         <div className="flex flex-col md:flex-row gap-4">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search by customer, booking number, or service..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//             />
//           </div>

//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white min-w-[180px]"
//           >
//             <option value="all">All Status</option>
//             <option value="pending">Pending</option>
//             <option value="confirmed">Confirmed</option>
//             <option value="in-progress">In Progress</option>
//             <option value="completed">Completed</option>
//             <option value="cancelled">Cancelled</option>
//             <option value="no-show">No Show</option>
//           </select>

//           <select
//             value={paymentFilter}
//             onChange={(e) => setPaymentFilter(e.target.value)}
//             className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white min-w-[180px]"
//           >
//             <option value="all">All Payments</option>
//             <option value="paid">Paid</option>
//             <option value="unpaid">Unpaid</option>
//             <option value="partial">Partial</option>
//             <option value="refunded">Refunded</option>
//           </select>

//           <button className="p-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition">
//             <Download className="w-5 h-5 text-gray-600" />
//           </button>
//         </div>
//       </div>

//       {/* Bookings Table */}
//       <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-50 border-b border-gray-200">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Booking
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Customer
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Service
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Provider
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Date & Time
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Payment
//                 </th>
//                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filtered.map((booking) => (
//                 <BookingRow
//                   key={booking.id}
//                   booking={booking}
//                   menuOpenId={menuOpenId}
//                   setMenuOpenId={setMenuOpenId}
//                   onView={setViewingBooking}
//                   onStatusChange={handleStatusChange}
//                   onDelete={handleDelete}
//                 />
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* New Booking Modal */}
//       {newBookingModal && (
//         <NewBookingModal
//           form={form}
//           setForm={setForm}
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           services={mockServices}
//           providers={mockProviders}
//           timeSlots={timeSlots}
//           onSave={handleCreateBooking}
//           onClose={() => {
//             setNewBookingModal(false)
//             resetForm()
//           }}
//         />
//       )}

//       {/* View Booking Modal */}
//       {viewingBooking && (
//         <ViewBookingModal
//           booking={viewingBooking}
//           onClose={() => setViewingBooking(null)}
//         />
//       )}
//     </div>
//   )
// }

// // Booking Row Component
// function BookingRow({
//   booking,
//   menuOpenId,
//   setMenuOpenId,
//   onView,
//   onStatusChange,
//   onDelete,
// }) {
//   const statusCfg = statusConfig[booking.status]
//   const paymentCfg = paymentConfig[booking.paymentStatus]
//   const StatusIcon = statusCfg.icon

//   const getInitials = (name) => {
//     return name
//       .split(' ')
//       .map((n) => n[0])
//       .join('')
//       .toUpperCase()
//   }

//   return (
//     <tr className="hover:bg-gray-50 transition-colors">
//       <td className="px-6 py-4 whitespace-nowrap">
//         <div className="font-medium text-gray-900">{booking.bookingNumber}</div>
//         <div className="text-sm text-gray-500">{booking.createdAt}</div>
//       </td>
//       <td className="px-6 py-4 whitespace-nowrap">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-sm font-semibold">
//             {getInitials(booking.customer.name)}
//           </div>
//           <div>
//             <div className="font-medium text-gray-900">{booking.customer.name}</div>
//             <div className="text-sm text-gray-500">{booking.customer.phone}</div>
//           </div>
//         </div>
//       </td>
//       <td className="px-6 py-4">
//         <div className="font-medium text-gray-900">{booking.service.name}</div>
//         <div className="text-sm text-gray-500">
//           {booking.service.duration} min • ${booking.service.price}
//         </div>
//       </td>
//       <td className="px-6 py-4 whitespace-nowrap">
//         <div className="font-medium text-gray-900">{booking.provider.name}</div>
//       </td>
//       <td className="px-6 py-4 whitespace-nowrap">
//         <div className="font-medium text-gray-900">{booking.date}</div>
//         <div className="text-sm text-gray-500">{booking.time}</div>
//       </td>
//       <td className="px-6 py-4 whitespace-nowrap">
//         <span
//           className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}
//         >
//           <StatusIcon className="w-3.5 h-3.5" />
//           {statusCfg.label}
//         </span>
//       </td>
//       <td className="px-6 py-4 whitespace-nowrap">
//         <span
//           className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${paymentCfg.color}`}
//         >
//           {paymentCfg.label}
//         </span>
//       </td>
//       <td className="px-6 py-4 whitespace-nowrap text-right">
//         <div className="relative inline-block">
//           <button
//             onClick={() =>
//               setMenuOpenId(menuOpenId === booking.id ? null : booking.id)
//             }
//             className="p-2 rounded-lg hover:bg-gray-100 transition"
//           >
//             <MoreVertical className="w-4 h-4" />
//           </button>

//           {menuOpenId === booking.id && (
//             <div className="absolute right-0 top-10 z-50 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
//               <button
//                 onClick={() => {
//                   onView(booking)
//                   setMenuOpenId(null)
//                 }}
//                 className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition"
//               >
//                 <Eye className="w-4 h-4" />
//                 View Details
//               </button>
//               <button className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition">
//                 <Edit className="w-4 h-4" />
//                 Edit Booking
//               </button>
//               {booking.status === 'pending' && (
//                 <button
//                   onClick={() => onStatusChange(booking.id, 'confirmed')}
//                   className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition"
//                 >
//                   <CheckCircle className="w-4 h-4" />
//                   Confirm
//                 </button>
//               )}
//               {booking.status === 'confirmed' && (
//                 <button
//                   onClick={() => onStatusChange(booking.id, 'in-progress')}
//                   className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition"
//                 >
//                   <RefreshCw className="w-4 h-4" />
//                   Start Service
//                 </button>
//               )}
//               {booking.status === 'in-progress' && (
//                 <button
//                   onClick={() => onStatusChange(booking.id, 'completed')}
//                   className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 transition"
//                 >
//                   <CheckCircle className="w-4 h-4" />
//                   Complete
//                 </button>
//               )}
//               <button
//                 onClick={() => onStatusChange(booking.id, 'cancelled')}
//                 className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition"
//               >
//                 <XCircle className="w-4 h-4" />
//                 Cancel
//               </button>
//               <button
//                 onClick={() => onDelete(booking.id)}
//                 className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition"
//               >
//                 <Trash2 className="w-4 h-4" />
//                 Delete
//               </button>
//             </div>
//           )}
//         </div>
//       </td>
//     </tr>
//   )
// }

// // New Booking Modal Component
// function NewBookingModal({
//   form,
//   setForm,
//   activeTab,
//   setActiveTab,
//   services,
//   providers,
//   timeSlots,
//   onSave,
//   onClose,
// }) {
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//       <div
//         className="absolute inset-0 bg-black/50 backdrop-blur-sm"
//         onClick={onClose}
//       />

//       <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
//         <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//           <h2 className="text-xl font-semibold text-gray-900">Create New Booking</h2>
//           <button
//             onClick={onClose}
//             className="p-2 rounded-lg hover:bg-gray-100 transition"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Tabs */}
//         <div className="px-6 pt-4 border-b border-gray-200">
//           <div className="flex gap-4">
//             {[
//               { key: 'customer', label: 'Customer' },
//               { key: 'service', label: 'Service' },
//               { key: 'details', label: 'Details' },
//             ].map((tab) => (
//               <button
//                 key={tab.key}
//                 onClick={() => setActiveTab(tab.key)}
//                 className={`pb-3 px-1 font-medium transition-all ${
//                   activeTab === tab.key
//                     ? 'text-primary border-b-2 border-primary'
//                     : 'text-gray-500 hover:text-gray-700'
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto px-6 py-6">
//           {activeTab === 'customer' && (
//             <CustomerTab form={form} setForm={setForm} />
//           )}
//           {activeTab === 'service' && (
//             <ServiceTab
//               form={form}
//               setForm={setForm}
//               services={services}
//               providers={providers}
//             />
//           )}
//           {activeTab === 'details' && (
//             <DetailsTab form={form} setForm={setForm} timeSlots={timeSlots} />
//           )}
//         </div>

//         <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={onSave}
//             className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 transition font-medium shadow-sm"
//           >
//             Create Booking
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// function CustomerTab({ form, setForm }) {
//   return (
//     <div className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Customer Name *
//         </label>
//         <input
//           type="text"
//           placeholder="John Doe"
//           value={form.customerName}
//           onChange={(e) => setForm({ ...form, customerName: e.target.value })}
//           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Email *
//         </label>
//         <input
//           type="email"
//           placeholder="john@example.com"
//           value={form.customerEmail}
//           onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
//           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Phone *
//         </label>
//         <input
//           type="tel"
//           placeholder="+1 234 567 8900"
//           value={form.customerPhone}
//           onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
//           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//         />
//       </div>
//     </div>
//   )
// }

// function ServiceTab({ form, setForm, services, providers }) {
//   return (
//     <div className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Select Service *
//         </label>
//         <select
//           value={form.serviceId}
//           onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
//           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
//         >
//           <option value="">Choose a service</option>
//           {services.map((service) => (
//             <option key={service.id} value={service.id}>
//               {service.name} - {service.duration}min - ${service.price}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Select Provider *
//         </label>
//         <select
//           value={form.providerId}
//           onChange={(e) => setForm({ ...form, providerId: e.target.value })}
//           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
//         >
//           <option value="">Choose a provider</option>
//           {providers.map((provider) => (
//             <option key={provider.id} value={provider.id}>
//               {provider.name} ({provider.specialties.join(', ')})
//             </option>
//           ))}
//         </select>
//       </div>
//     </div>
//   )
// }

// function DetailsTab({ form, setForm, timeSlots }) {
//   return (
//     <div className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Date *
//         </label>
//         <input
//           type="date"
//           value={form.date}
//           onChange={(e) => setForm({ ...form, date: e.target.value })}
//           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Time *
//         </label>
//         <select
//           value={form.time}
//           onChange={(e) => setForm({ ...form, time: e.target.value })}
//           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
//         >
//           <option value="">Select time slot</option>
//           {timeSlots.map((time) => (
//             <option key={time} value={time}>
//               {time}
//             </option>
//           ))}
//         </select>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Notes (Optional)
//         </label>
//         <textarea
//           placeholder="Any special requests or notes..."
//           value={form.notes}
//           onChange={(e) => setForm({ ...form, notes: e.target.value })}
//           rows={4}
//           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
//         />
//       </div>
//     </div>
//   )
// }

// // View Booking Modal
// function ViewBookingModal({ booking, onClose }) {
//   const statusCfg = statusConfig[booking.status]
//   const paymentCfg = paymentConfig[booking.paymentStatus]
//   const StatusIcon = statusCfg.icon

//   const getInitials = (name) => {
//     return name
//       .split(' ')
//       .map((n) => n[0])
//       .join('')
//       .toUpperCase()
//   }

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
//       <div
//         className="absolute inset-0 bg-black/50 backdrop-blur-sm"
//         onClick={onClose}
//       />

//       <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl">
//         <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//           <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
//           <button
//             onClick={onClose}
//             className="p-2 rounded-lg hover:bg-gray-100 transition"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="px-6 py-6 space-y-6">
//           {/* Booking Number & Status */}
//           <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
//             <div>
//               <p className="text-sm text-gray-600">Booking Number</p>
//               <p className="text-lg font-semibold text-gray-900">
//                 {booking.bookingNumber}
//               </p>
//             </div>
//             <div className="flex gap-2">
//               <span
//                 className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}
//               >
//                 <StatusIcon className="w-3.5 h-3.5" />
//                 {statusCfg.label}
//               </span>
//               <span
//                 className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${paymentCfg.color}`}
//               >
//                 {paymentCfg.label}
//               </span>
//             </div>
//           </div>

//           {/* Customer & Provider */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <p className="text-sm text-gray-600 mb-2">Customer</p>
//               <div className="flex items-center gap-3">
//                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">
//                   {getInitials(booking.customer.name)}
//                 </div>
//                 <div>
//                   <p className="font-medium text-gray-900">{booking.customer.name}</p>
//                   <p className="text-sm text-gray-600">{booking.customer.email}</p>
//                   <p className="text-sm text-gray-600">{booking.customer.phone}</p>
//                 </div>
//               </div>
//             </div>

//             <div>
//               <p className="text-sm text-gray-600 mb-2">Service Provider</p>
//               <div className="flex items-center gap-3">
//                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
//                   {getInitials(booking.provider.name)}
//                 </div>
//                 <div>
//                   <p className="font-medium text-gray-900">{booking.provider.name}</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Service Details */}
//           <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
//             <p className="text-sm text-gray-600 mb-2">Service Details</p>
//             <p className="font-semibold text-gray-900 mb-1">
//               {booking.service.name}
//             </p>
//             <div className="flex items-center gap-4 text-sm text-gray-600">
//               <span className="flex items-center gap-1">
//                 <Clock className="w-4 h-4" />
//                 {booking.service.duration} minutes
//               </span>
//               <span className="flex items-center gap-1">
//                 <DollarSign className="w-4 h-4" />
//                 ${booking.service.price}
//               </span>
//             </div>
//           </div>

//           {/* Date & Time */}
//           <div className="grid grid-cols-2 gap-4">
//             <div className="p-4 bg-gray-50 rounded-xl">
//               <p className="text-sm text-gray-600 mb-1">Date</p>
//               <p className="font-medium text-gray-900">{booking.date}</p>
//             </div>
//             <div className="p-4 bg-gray-50 rounded-xl">
//               <p className="text-sm text-gray-600 mb-1">Time</p>
//               <p className="font-medium text-gray-900">{booking.time}</p>
//             </div>
//           </div>

//           {/* Notes */}
//           {booking.notes && (
//             <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
//               <p className="text-sm text-gray-600 mb-1">Notes</p>
//               <p className="text-gray-900">{booking.notes}</p>
//             </div>
//           )}
//         </div>

//         <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
//           >
//             Close
//           </button>
//           <button className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 transition font-medium shadow-sm">
//             Edit Booking
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }


// src/app/dashboard/bookings/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';

import useBookings from './hooks/useBookings';
import BookingStats from './components/BookingStats';
import BookingFilters from './components/BookingFilters';
import BookingsList from './components/BookingsList';

import NewBookingModal from './NewBookingModal';
import { useTenantPermission } from "@/lib/useTenantPermission";

import ViewBookingModal from './ViewBookingModal';
import CancelBookingModal from './CancelBookingModal';
import EditBookingModal from './EditBookingModal';

import {
  Plus,
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function BookingsPage() {
  const { user, loadingUser, requiresOnboarding, t, isRTL } = useApp();
  const router = useRouter();
  

  // Booking state management
  const {
    bookings,
    stats,
    loading,
    error,
    filters,
    updateFilter,
    clearFilters,
    fetchBookings,
    createBooking,
    updateStatus,
    updateBooking,
    cancelBooking,
    deleteBooking,
  } = useBookings();

  // Modal states
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);

  const [editingBooking, setEditingBooking] = useState(null);

  const { allowed: canCreate } = useTenantPermission("bookings.create");
  const { allowed: canViewCalendar } = useTenantPermission("calendar.view");
  const { allowed: canEdit } = useTenantPermission("bookings.edit");
  const { allowed: canDelete } = useTenantPermission("bookings.delete");
  const { allowed: canView } = useTenantPermission("bookings.view");


  const hasAnyAction = canEdit || canDelete || canCreate;
  
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

  // Handle status change
  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateStatus(bookingId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Handle cancel
  const handleCancel = async (bookingId, reason, refundRequested) => {
    if (!canEdit) return;
    try {
      await cancelBooking(bookingId, reason, refundRequested);
      setCancellingBooking(null);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  // Handle delete
  const handleDelete = async (bookingId) => {
    if (!canDelete) return;

    if (!confirm(t('bookings.confirm.delete'))) return;
    
    try {
      await deleteBooking(bookingId);
    } catch (err) {
      console.error('Failed to delete booking:', err);
    }
  };

  // Handle create
  const handleCreate = async (bookingData) => {
    try {
      await createBooking(bookingData);
      setShowNewBooking(false);
    } catch (err) {
      console.error('Failed to create booking:', err);
    }
  };
 
  // Loading state
  if (loadingUser || requiresOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B1E3F]" />
      </div>
    );
  }
  // / handleEdit callback
  const handleEditSave = async (updateData) => {
    if (!editingBooking) return;
    try {
      await updateBooking(editingBooking.id, updateData);
      setEditingBooking(null);
    } catch (err) {
      console.error('Failed to update booking:', err);
    }
  };


  const handleEditOpen = (booking) => {
    if (!canEdit) return;

    setEditingBooking(booking);
  };

  if (!canView) {
    return (
      <div className="p-6 text-center text-red-500">
        🚫 You don't have permission to view bookings
      </div>
    );
  }

  return (
    
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('bookings.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('bookings.subtitle')}
          </p>
        </div>

        <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          
          {canViewCalendar && (
          <button
            onClick={() => router.push('/dashboard/calendar')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            <CalendarIcon className="w-4 h-4" />
            {t('bookings.calendarView')}
          </button>
          )}

          {canCreate && (
          <button
            onClick={() => setShowNewBooking(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#8B1E3F]/80 hover:opacity-90 transition-opacity font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t('bookings.newBooking')}
          </button>
          )}

        </div>
      </div>

      {/* Stats Cards */}
      <BookingStats stats={stats} />

      {/* Filters */}
      <BookingFilters
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        onRefresh={fetchBookings}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchBookings}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            {t('bookings.error.retry')}
          </button>
        </div>
      )}

      {/* Bookings List */}
      <BookingsList
        hasAnyAction={hasAnyAction}
        bookings={bookings}
        loading={loading}
        onView={setViewingBooking}
        onEdit={handleEditOpen}   // ✅ ADD THIS
        onStatusChange={handleStatusChange}
        onCancel={setCancellingBooking}
        onDelete={handleDelete}
      />

      {/* New Booking Modal */}
      { canCreate && showNewBooking && (
        <NewBookingModal
          onSave={handleCreate}
          onClose={() => setShowNewBooking(false)}
        />
      )}

      {/* View Booking Modal */}
      {viewingBooking && (
        <ViewBookingModal
          booking={viewingBooking}
          onClose={() => setViewingBooking(null)}
          onStatusChange={handleStatusChange}
          onCancel={() => {
            setCancellingBooking(viewingBooking);
            setViewingBooking(null);
          }}
        />
      )}

      {/* // Render EditBookingModal */}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          onSave={handleEditSave}
          onClose={() => setEditingBooking(null)}
        />
      )}

      {/* Cancel Booking Modal */}
      {cancellingBooking && (
        <CancelBookingModal
          booking={cancellingBooking}
          onConfirm={handleCancel}
          onClose={() => setCancellingBooking(null)}
        />
      )}
    </div>
  );
}