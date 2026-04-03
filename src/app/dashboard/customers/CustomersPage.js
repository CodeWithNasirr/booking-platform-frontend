'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import useCustomers from './hooks/useCustomers'
import { useTenantPermission } from "@/lib/useTenantPermission";

import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  MessageSquare,
  Tag,
  X,
  Check,
  Loader2,
  RefreshCw,
  Download,
  Upload,
  AlertCircle,
  Building2,
  Clock,
  FileText
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'



const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  vip: { label: 'VIP', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700 border-red-200' },
}

const defaultAvailableTags = [
  'Regular',
  'VIP',
  'Hair Color',
  'Barber',
  'Massage',
  'Nails',
  'Spa',
  'Coloring',
  'Styling',
  'Premium',
  'New',
  'Referral',
]

export default function CustomersPage() {
  const { user, loadingUser, requiresOnboarding, t, isRTL,tenants  } = useApp()
  const router = useRouter()

  const { allowed: canView } = useTenantPermission("customers.view");
  const { allowed: canManage } = useTenantPermission("customers.manage");

  const dropdownRef = useRef(null)

  // Use the custom hook for customer management
  const {
    customers,
    stats,
    tags: availableTags,
    loading,
    error,
    filters,
    updateFilters,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateStatus,
    getCustomer,
    addNote,
    getBookings,
    refresh,
  } = useCustomers()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewingCustomer, setViewingCustomer] = useState(null)
  // console.log(viewingCustomer,"viewingCustomerviewingCustomer")
  const [customerBookings, setCustomerBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [viewTab, setViewTab] = useState('overview')
  const [dropdownOpenId, setDropdownOpenId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  
  // Animation states
  const [modalVisible, setModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    company_name: '',
    notes: '',
    tags: [],
    status: 'active',
  })

  // RTL support
  const rtl = isRTL

  // Block back navigation
  useBlockBackNavigation(!!user)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auth guard
  useEffect(() => {
    if (!loadingUser && !user) {
      router.replace('/')
    }
  }, [loadingUser, user, router])
  

  // Onboarding redirect
  useEffect(() => {
    if (requiresOnboarding) {
      router.replace('/auth/onboarding?step=1')
    }
  }, [requiresOnboarding, router])

  if (!canView) return null;



  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: searchQuery })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, updateFilters])

  // Status filter
  useEffect(() => {
    updateFilters({ status: selectedStatus })
  }, [selectedStatus, updateFilters])

  // Handle modal animations
  useEffect(() => {
    if (isAddDialogOpen) {
      requestAnimationFrame(() => setModalVisible(true))
    } else {
      setModalVisible(false)
    }
  }, [isAddDialogOpen])

  useEffect(() => {
    if (viewingCustomer) {
      requestAnimationFrame(() => setViewModalVisible(true))
    } else {
      setViewModalVisible(false)
    }
  }, [viewingCustomer])

  // Fetch bookings when viewing customer
  const fetchCustomerBookings = useCallback(async (customerId) => {
    setLoadingBookings(true)
    const result = await getBookings(customerId)

    if (result.success) {
      const bookings = Array.isArray(result.data)
        ? result.data
        : result.data?.results || []

      setCustomerBookings(bookings)
    }

    setLoadingBookings(false)
  }, [getBookings])


  if (requiresOnboarding || loadingUser) {
    return null
  }

  const handleAddCustomer = async () => {
    setSubmitting(true)
    setFormError(null)

    const customerData = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      city: form.city,
      country: form.country,
      company_name: form.company_name,
      notes: form.notes,
      tags: form.tags,
      status: form.status,
    }

    let result
    if (editingCustomer) {
      result = await updateCustomer(editingCustomer.id, customerData)
    } else {
      result = await createCustomer(customerData)
    }

    setSubmitting(false)

    if (result.success) {
      closeAddModal()
    } else {
      setFormError(
        typeof result.error === 'object'
          ? Object.values(result.error).flat().join(', ')
          : result.error
      )
    }
  }

  const closeAddModal = () => {
    setModalVisible(false)
    setTimeout(() => {
      setIsAddDialogOpen(false)
      setEditingCustomer(null)
      resetForm()
    }, 200)
  }

  const closeViewModal = () => {
    setViewModalVisible(false)
    setTimeout(() => {
      setViewingCustomer(null)
    }, 200)
  }

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      company_name: '',
      notes: '',
      tags: [],
      status: 'active',
    })
    setActiveTab('basic')
    setFormError(null)
  }

  const handleEditCustomer = async (customer) => {
    const result = await getCustomer(customer.id)
    if (result.success) {
      const c = result.data
      setEditingCustomer(c)
      setForm({
        first_name: c.first_name || '',
        last_name: c.last_name || '',
        email: c.email || '',
        phone: c.phone || '',
        address: c.address || '',
        city: c.city || '',
        country: c.country || '',
        company_name: c.company_name || '',
        notes: c.notes || '',
        tags: c.tags || [],
        status: c.status || 'active',
      })
      setIsAddDialogOpen(true)
    }
    setDropdownOpenId(null)
  }

  const handleViewCustomer = async (customer) => {
    const result = await getCustomer(customer.id)
    if (result.success) {
      setViewingCustomer(result.data)
      setViewTab('overview')
      fetchCustomerBookings(customer.id)
    }
    setDropdownOpenId(null)
  }

  const handleDeleteCustomer = async (id) => {
    if (confirm(t('customers.modal.deleteConfirm'))) {
      const result = await deleteCustomer(id)
      if (!result.success) {
        alert(t('customers.error.deleteFailed'))
      }
    }
    setDropdownOpenId(null)
  }

  const handleStatusChange = async (customerId, newStatus) => {
    await updateStatus(customerId, newStatus)
    if (viewingCustomer?.id === customerId) {
      setViewingCustomer(prev => ({ ...prev, status: newStatus }))
    }
  }

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  const currency = tenants[0]?.default_currency || 'SAR'; 
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get tags list (combine available from API with defaults)
  const allTags = [
    ...new Set(
      [...defaultAvailableTags, ...(availableTags || [])]
        .map(tag => typeof tag === 'string' ? tag : tag.name)
    )
  ]

  // Form tabs configuration
  const formTabs = [
    { key: 'basic', label: t('customers.tabs.basicInfo') },
    { key: 'additional', label: t('customers.tabs.additional') },
  ]

  // View tabs configuration
  const viewTabs = [
    { key: 'overview', label: t('customers.tabs.overview') },
    { key: 'bookings', label: t('customers.tabs.bookings') },
    { key: 'notes', label: t('customers.tabs.notes') },
  ]

  return (
    <div className={`space-y-6 ${rtl ? 'rtl' : 'ltr'}`} dir={rtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('customers.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('customers.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="p-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
            title={t('customers.actions.refresh')}
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {canManage && (
            <button
                onClick={() => {
                setEditingCustomer(null)
                resetForm()
                setIsAddDialogOpen(true)
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:transform hover:scale-105 active:scale-95"
            >
                <Plus className="w-4 h-4" />
                {t('customers.addCustomer')}
            </button>
            )}

        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button onClick={refresh} className="ml-auto text-red-600 hover:text-red-800 font-medium">
            {t('customers.actions.retry')}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#8B1E3F]/10 rounded-xl p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('customers.stats.totalCustomers')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '—' : stats?.total_customers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#8B1E3F]/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-[#8B1E3F]" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#8B1E3F]/10 rounded-xl p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('customers.stats.active')}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {loading ? '—' : stats?.active_customers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#8B1E3F]/10 rounded-xl p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('customers.stats.vip')}</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {loading ? '—' : stats?.vip_customers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#8B1E3F]/10 rounded-xl p-5 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('customers.stats.totalRevenue')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '—' : formatCurrency(stats?.total_revenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#8B1E3F]/10 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute ${rtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type="text"
              placeholder={t('customers.search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${rtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent transition-all duration-200`}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent bg-white min-w-[180px] transition-all duration-200"
          >
            <option value="all">{t('customers.status.all')}</option>
            <option value="active">{t('customers.status.active')}</option>
            <option value="inactive">{t('customers.status.inactive')}</option>
            <option value="vip">{t('customers.status.vip')}</option>
            <option value="blocked">{t('customers.status.blocked')}</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && customers.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1E3F]" />
          <span className="ml-3 text-gray-600">{t('customers.loading.customers')}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && (
        <div className="bg-white border border-[#8B1E3F]/10 rounded-xl p-12 text-center animate-in fade-in duration-300">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('customers.empty.title')}</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || selectedStatus !== 'all'
              ? t('customers.filter.adjustSearch')
              : t('customers.empty.description')}
          </p>
          {!searchQuery && selectedStatus === 'all' && (
            
            <button
              onClick={() => {
                setEditingCustomer(null)
                resetForm()
                setIsAddDialogOpen(true)
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all duration-200 font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('customers.addFirstCustomer')}
            </button>
          )}
        </div>
      )}

      {/* Customers Grid */}
      {customers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div
              key={`customer-card-${customer.id}`}
              className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-[#8B1E3F]/30 transition-all duration-300 hover:shadow-lg animate-in fade-in"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center text-white font-semibold text-lg shadow-md">
                    {customer.avatar ? (
                      <img
                        src={customer.avatar}
                        alt={customer.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      getInitials(customer.name)
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {customer.name || 'Unknown'}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      {customer.average_rating > 0 && (
                        <>
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">
                            {Number(customer.average_rating).toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative" ref={dropdownOpenId === customer.id ? dropdownRef : null}>
                  {canManage && (  
                  <button
                    onClick={() =>
                      setDropdownOpenId(
                        dropdownOpenId === customer.id ? null : customer.id
                      )
                    }
                    className="p-2 rounded-lg hover:bg-[#8B1E3F]/10 transition-colors duration-200"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                  )}
                  
                  {/* Animated Dropdown */}
                  <div
                    className={`absolute ${rtl ? 'left-0' : 'right-0'} top-10 z-50 w-48 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden transform transition-all duration-200 origin-top ${
                      dropdownOpenId === customer.id
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
                  >
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-[#8B1E3F]/5 transition-colors duration-150"
                    >
                      <Eye className="w-4 h-4" />
                      {t('customers.actions.viewProfile')}
                    </button>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-[#8B1E3F]/5 transition-colors duration-150"
                    >
                      <Edit className="w-4 h-4" />
                      {t('customers.actions.edit')}
                    </button>
                    <button className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-gray-700 hover:bg-[#8B1E3F]/5 transition-colors duration-150">
                      <MessageSquare className="w-4 h-4" />
                      {t('customers.actions.sendMessage')}
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('customers.actions.delete')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.city && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{customer.city}</span>
                  </div>
                )}
              </div>

              {customer.tags && customer.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {customer.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={`customer-${customer.id}-tag-${tagIndex}-${tag}`}
                      className="px-2.5 py-1 bg-[#8B1E3F]/10 text-[#8B1E3F] text-xs rounded-lg font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {customer.tags.length > 3 && (
                    <span 
                      key={`customer-${customer.id}-tag-more`}
                      className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium"
                    >
                      +{customer.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600">{t('customers.card.bookings')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {customer.total_bookings || 0}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">{t('customers.card.spent')}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(customer.total_spent)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    statusConfig[customer.status]?.color || statusConfig.active.color
                  }`}
                >
                  {t(`customers.status.${customer.status}`) || statusConfig[customer.status]?.label || 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Customer Modal with Animation */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className={`absolute inset-0 bg-[#8B1E3F]/20 backdrop-blur-sm transition-opacity duration-300 ${
              modalVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeAddModal}
          />
          <div 
            className={`relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 ${
              modalVisible 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 translate-y-4'
            }`}
          >
            <div className="px-6 py-4 border-b border-[#8B1E3F]/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCustomer ? t('customers.modal.editTitle') : t('customers.modal.addTitle')}
              </h2>
              <button
                onClick={closeAddModal}
                className="p-2 rounded-lg hover:bg-[#8B1E3F]/10 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form Error */}
            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            {/* Tabs */}
            <div className="px-6 pt-4 border-b border-[#8B1E3F]/10">
              <div className="flex gap-4">
                {formTabs.map((tab) => (
                  <button
                    key={`form-tab-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-3 px-1 font-medium transition-all duration-200 ${
                      activeTab === tab.key
                        ? 'text-[#8B1E3F] border-b-2 border-[#8B1E3F]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {activeTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('customers.form.firstName')} *
                      </label>
                      <input
                        type="text"
                        placeholder={t('customers.placeholder.firstName')}
                        value={form.first_name}
                        onChange={(e) =>
                          setForm({ ...form, first_name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('customers.form.lastName')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('customers.placeholder.lastName')}
                        value={form.last_name}
                        onChange={(e) =>
                          setForm({ ...form, last_name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('customers.form.email')} *
                      </label>
                      <input
                        type="email"
                        placeholder={t('customers.placeholder.email')}
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        disabled={!!editingCustomer}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('customers.form.phone')}
                      </label>
                      <input
                        type="tel"
                        placeholder={t('customers.placeholder.phone')}
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customers.form.companyName')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('customers.placeholder.company')}
                      value={form.company_name}
                      onChange={(e) =>
                        setForm({ ...form, company_name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customers.form.address')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('customers.placeholder.address')}
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('customers.form.city')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('customers.placeholder.city')}
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('customers.form.country')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('customers.placeholder.country')}
                        value={form.country}
                        onChange={(e) =>
                          setForm({ ...form, country: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customers.form.status')}
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent bg-white transition-all duration-200"
                    >
                      <option value="active">{t('customers.status.active')}</option>
                      <option value="inactive">{t('customers.status.inactive')}</option>
                      <option value="vip">{t('customers.status.vip')}</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'additional' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customers.form.tags')}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allTags.map((tag, tagIndex) => (
                        <button
                          key={`form-tag-${tagIndex}-${tag}`}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            form.tags.includes(tag)
                              ? 'bg-[#8B1E3F] text-white shadow-md scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-[#8B1E3F]/10'
                          }`}
                        >
                          {form.tags.includes(tag) && (
                            <Check className="w-3 h-3 inline mr-1" />
                          )}
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('customers.form.notes')}
                    </label>
                    <textarea
                      placeholder={t('customers.form.notesPlaceholder')}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F] focus:border-transparent resize-none transition-all duration-200"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#8B1E3F]/10 flex items-center justify-end gap-3">
              <button
                onClick={closeAddModal}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                {t('customers.button.cancel')}
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={submitting || !form.first_name || !form.email}
                className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all duration-200 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingCustomer ? t('customers.button.update') : t('customers.button.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Modal with Animation */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className={`absolute inset-0 bg-[#8B1E3F]/20 backdrop-blur-sm transition-opacity duration-300 ${
              viewModalVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeViewModal}
          />
          <div 
            className={`relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 ${
              viewModalVisible 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 translate-y-4'
            }`}
          >
            <div className="px-6 py-4 border-b border-[#8B1E3F]/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {t('customers.modal.profileTitle')}
              </h2>
              <button
                onClick={closeViewModal}
                className="p-2 rounded-lg hover:bg-[#8B1E3F]/10 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* View Tabs */}
            <div className="px-6 pt-4 border-b border-[#8B1E3F]/10">
              <div className="flex gap-6">
                {viewTabs.map((tab) => (
                  <button
                    key={`view-tab-${tab.key}`}
                    onClick={() => setViewTab(tab.key)}
                    className={`pb-3 px-1 font-medium transition-all duration-200 ${
                      viewTab === tab.key
                        ? 'text-[#8B1E3F] border-b-2 border-[#8B1E3F]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {viewTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Customer Header */}
                  <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-[#8B1E3F]/5 to-purple-50 rounded-xl border border-[#8B1E3F]/20">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {viewingCustomer.avatar ? (
                        <img
                          src={viewingCustomer.avatar}
                          alt={viewingCustomer.name}
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        getInitials(viewingCustomer.name)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {viewingCustomer.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {viewingCustomer.average_rating > 0 && (
                              <>
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm text-gray-600">
                                  {Number(viewingCustomer.average_rating).toFixed(1)} {t('customers.card.rating')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <select
                          value={viewingCustomer.status}
                          onChange={(e) => handleStatusChange(viewingCustomer.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all duration-200 ${
                            statusConfig[viewingCustomer.status]?.color || statusConfig.active.color
                          }`}
                        >
                          <option value="active">{t('customers.status.active')}</option>
                          <option value="inactive">{t('customers.status.inactive')}</option>
                          <option value="vip">{t('customers.status.vip')}</option>
                          <option value="blocked">{t('customers.status.blocked')}</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="w-4 h-4 text-[#8B1E3F]" />
                          {viewingCustomer.email}
                        </div>
                        {viewingCustomer.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-[#8B1E3F]" />
                            {viewingCustomer.phone}
                          </div>
                        )}
                        {viewingCustomer.company_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Building2 className="w-4 h-4 text-[#8B1E3F]" />
                            {viewingCustomer.company_name}
                          </div>
                        )}
                        {viewingCustomer.city && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="w-4 h-4 text-[#8B1E3F]" />
                            {viewingCustomer.city}
                            {viewingCustomer.country && `, ${viewingCustomer.country}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-[#8B1E3F]/5 rounded-xl text-center border border-[#8B1E3F]/10">
                      <p className="text-sm text-gray-600">{t('customers.profile.totalBookings')}</p>
                      <p className="text-2xl font-bold text-[#8B1E3F] mt-1">
                        {viewingCustomer.total_bookings || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl text-center border border-green-200">
                      <p className="text-sm text-gray-600">{t('customers.profile.totalSpent')}</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {formatCurrency(viewingCustomer.total_spent)}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl text-center border border-purple-200">
                      <p className="text-sm text-gray-600">{t('customers.profile.avgBooking')}</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {viewingCustomer.total_bookings > 0
                          ? formatCurrency(
                              viewingCustomer.total_spent / viewingCustomer.total_bookings
                            )
                          : '$0'}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {viewingCustomer.tags && viewingCustomer.tags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('customers.form.tags')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {viewingCustomer.tags.map((tag, tagIndex) => (
                          <span
                            key={`view-customer-${viewingCustomer.id}-tag-${tagIndex}-${tag}`}
                            className="px-3 py-1.5 bg-[#8B1E3F]/10 text-[#050505] rounded-lg text-sm font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {viewingCustomer.notes && (
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('customers.form.notes')}
                      </label>
                      <p className="text-gray-700">{viewingCustomer.notes}</p>
                    </div>
                  )}

                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {t('customers.profile.customerSince')}
                      </label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar className="w-4 h-4 text-[#8B1E3F]" />
                        {formatDate(viewingCustomer.joined_date || viewingCustomer.created_at)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        {t('customers.profile.lastBooking')}
                      </label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Clock className="w-4 h-4 text-[#8B1E3F]" />
                        {formatDate(viewingCustomer.last_booking_at)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewTab === 'bookings' && (
                <div className="animate-in fade-in duration-200">
                  {loadingBookings ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
                      <span className="ml-2 text-gray-600">{t('customers.loading.bookings')}</span>
                    </div>
                  ) : customerBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">{t('customers.empty.noBookings')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerBookings.map((booking, bookingIndex) => (
                        <div
                          key={`booking-${booking.id || bookingIndex}`}
                          className="p-4 border border-gray-200 rounded-xl hover:border-[#8B1E3F]/30 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {booking.service_name || 'Service'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {booking.booking_number}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                booking.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                            <span>{formatDate(booking.created_at)}</span>
                            <span>{formatCurrency(booking.total_amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {viewTab === 'notes' && (
                <div className="animate-in fade-in duration-200">
                  {viewingCustomer.activity_notes?.length > 0 ? (
                    <div className="space-y-3">
                      {viewingCustomer.activity_notes.map((note, noteIndex) => (
                        <div
                          key={`note-${note.id || noteIndex}`}
                          className="p-4 border border-gray-200 rounded-xl"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium">
                              {note.note_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(note.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700">{note.content}</p>
                          {note.created_by_name && (
                            <p className="text-xs text-gray-500 mt-2">
                              By {note.created_by_name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">{t('customers.empty.noNotes')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#8B1E3F]/10 flex items-center justify-end gap-3">
              <button
                onClick={closeViewModal}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                {t('customers.button.close')}
              </button>
              <button
                onClick={() => {
                  handleEditCustomer(viewingCustomer)
                  closeViewModal()
                }}
                className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all duration-200 font-medium shadow-md flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {t('customers.button.editCustomer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInFromTop {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        .slide-in-from-top-2 {
          animation: slideInFromTop 0.2s ease-out;
        }
        
        .duration-200 {
          animation-duration: 200ms;
        }
        
        .duration-300 {
          animation-duration: 300ms;
        }
      `}</style>
    </div>
  )
}