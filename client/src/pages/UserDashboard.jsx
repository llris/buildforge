import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Package,
  Wrench,
  Star,
  Bell,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileCheck,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const STATUS_BADGES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  RETURNED: 'bg-gray-100 text-gray-700 border-gray-300',
  REFUNDED: 'bg-gray-100 text-gray-700 border-gray-300',
};

const RETURN_STATUS_BADGES = {
  REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export default function UserDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  // Global messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const clearMessages = () => {
    setSuccessMsg('');
    setErrorMsg('');
  };

  // ==============================
  // TAB 1: PROFILE
  // ==============================
  const [profileName, setProfileName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    clearMessages();
    setSavingProfile(true);
    try {
      const res = await api.patch('/auth/profile', { name: profileName });
      updateUser({ name: res.data.data.name });
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setSuccessMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  // ==============================
  // TAB 2: ADDRESSES
  // ==============================
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleOpenAddressModal = (addr = null) => {
    clearMessages();
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        zip: addr.zip || '',
        country: addr.country || 'United States',
        isDefault: addr.isDefault || false,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States',
        isDefault: addresses.length === 0,
      });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    clearMessages();
    setSavingAddress(true);
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, addressForm);
        setSuccessMsg('Address updated successfully.');
      } else {
        await api.post('/addresses', addressForm);
        setSuccessMsg('New address added successfully.');
      }
      setShowAddressModal(false);
      fetchAddresses();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    clearMessages();
    try {
      await api.patch(`/addresses/${id}/default`);
      setSuccessMsg('Default address updated.');
      fetchAddresses();
    } catch (err) {
      setErrorMsg('Failed to set default address.');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    clearMessages();
    try {
      await api.delete(`/addresses/${id}`);
      setSuccessMsg('Address removed.');
      fetchAddresses();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to delete address.');
    }
  };

  // ==============================
  // TAB 3: MY ORDERS
  // ==============================
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchOrders = async (page = 1) => {
    setLoadingOrders(true);
    try {
      const res = await api.get(`/orders?page=${page}&limit=5`);
      const payload = res.data.data;
      if (payload?.orders) {
        setOrders(payload.orders);
        setOrdersPage(payload.page || 1);
        setOrdersTotalPages(payload.totalPages || 1);
      } else if (Array.isArray(payload)) {
        setOrders(payload);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // ==============================
  // TAB 4: MY BUILDS
  // ==============================
  const [builds, setBuilds] = useState([]);
  const [loadingBuilds, setLoadingBuilds] = useState(false);

  const fetchBuilds = async () => {
    setLoadingBuilds(true);
    try {
      const res = await api.get('/builds');
      setBuilds(res.data.data || []);
    } catch (err) {
      console.error('Failed to load builds:', err);
    } finally {
      setLoadingBuilds(false);
    }
  };

  const handleDeleteBuild = async (id) => {
    if (!window.confirm('Are you sure you want to delete this saved build?')) return;
    clearMessages();
    try {
      await api.delete(`/builds/${id}`);
      setSuccessMsg('Build removed successfully.');
      fetchBuilds();
    } catch (err) {
      setErrorMsg('Failed to delete build.');
    }
  };

  // ==============================
  // TAB 5: MY REVIEWS
  // ==============================
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [savingReview, setSavingReview] = useState(false);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await api.get('/reviews/me');
      setReviews(res.data.data || []);
    } catch (err) {
      console.error('Failed to load user reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOpenEditReview = (rev) => {
    clearMessages();
    setEditingReview(rev);
    setReviewForm({
      rating: rev.rating,
      title: rev.title || '',
      comment: rev.comment || '',
    });
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    clearMessages();
    setSavingReview(true);
    try {
      await api.patch(`/reviews/${editingReview.id}`, reviewForm);
      setSuccessMsg('Review updated successfully.');
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update review.');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    clearMessages();
    try {
      await api.delete(`/reviews/${id}`);
      setSuccessMsg('Review deleted.');
      fetchReviews();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to delete review.');
    }
  };

  // ==============================
  // TAB 6: MY ALERTS
  // ==============================
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await api.get('/alerts');
      setAlerts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load price alerts:', err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleDeleteAlert = async (id) => {
    clearMessages();
    try {
      await api.delete(`/alerts/${id}`);
      setSuccessMsg('Price alert removed.');
      fetchAlerts();
    } catch (err) {
      setErrorMsg('Failed to remove price alert.');
    }
  };

  // ==============================
  // TAB 7: MY RETURNS
  // ==============================
  const [returns, setReturns] = useState([]);
  const [loadingReturns, setLoadingReturns] = useState(false);

  const fetchReturns = async () => {
    setLoadingReturns(true);
    try {
      const res = await api.get('/returns');
      setReturns(res.data.data || []);
    } catch (err) {
      console.error('Failed to load returns:', err);
    } finally {
      setLoadingReturns(false);
    }
  };

  // Tab change fetch dispatcher
  useEffect(() => {
    clearMessages();
    if (activeTab === 'addresses') fetchAddresses();
    if (activeTab === 'orders') fetchOrders(1);
    if (activeTab === 'builds') fetchBuilds();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'alerts') fetchAlerts();
    if (activeTab === 'returns') fetchReturns();
  }, [activeTab]);

  const navTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'builds', label: 'My Builds', icon: Wrench },
    { id: 'reviews', label: 'My Reviews', icon: Star },
    { id: 'alerts', label: 'Price Alerts', icon: Bell },
    { id: 'returns', label: 'Returns (RMA)', icon: RotateCcw },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Dashboard Top Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {user?.name || 'Welcome back!'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/tracking"
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            Track Shipment
          </Link>
          <Link
            to="/builder"
            className="px-4 py-2 bg-blue-600 rounded-xl text-xs font-bold text-white shadow hover:bg-blue-700 transition"
          >
            Open PC Builder
          </Link>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-700 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid with Sidebar Tabs + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition text-left ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-3 space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: PROFILE */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Details */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
                  Profile Information
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full text-xs sm:text-sm bg-gray-100 border border-gray-200 text-gray-500 rounded-xl px-4 py-2.5 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Account email cannot be modified directly.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              </div>

              {/* Terms & Legal Acceptance Status */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 text-gray-900 font-bold text-base mb-3">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <span>Terms & Legal Agreement</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold text-gray-700">Accepted Terms Version:</span>{' '}
                    {user?.termsVersion || 'v1.0'}
                  </p>
                  {user?.termsAcceptedAt && (
                    <p>
                      <span className="font-semibold text-gray-700">Accepted On:</span>{' '}
                      {new Date(user.termsAcceptedAt).toLocaleString()}
                    </p>
                  )}
                  <Link
                    to="/terms"
                    className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline pt-2 text-xs"
                  >
                    <span>View current Terms & Conditions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Change Password */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      required
                      className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold shadow hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {changingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ADDRESSES */}
          {/* ========================================================= */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Saved Addresses</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manage delivery destinations and default shipping address
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAddressModal()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Address</span>
                </button>
              </div>

              {loadingAddresses ? (
                <div className="py-12 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <MapPin className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">No saved addresses found.</p>
                  <button
                    onClick={() => handleOpenAddressModal()}
                    className="px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 text-xs font-bold rounded-xl transition"
                  >
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                        addr.isDefault
                          ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-gray-900">
                            {addr.street}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {addr.city}, {addr.state} {addr.zip}
                          <br />
                          {addr.country}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4 text-xs">
                        <div className="flex items-center gap-2">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="font-bold text-blue-600 hover:underline"
                            >
                              Set Default
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenAddressModal(addr)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-gray-100 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Address Modal */}
          {showAddressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </h3>
                  <button
                    onClick={() => setShowAddressModal(false)}
                    className="text-gray-400 hover:text-gray-600 font-bold"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      placeholder="123 Tech Lane"
                      required
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="San Francisco"
                        required
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="CA"
                        required
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={addressForm.zip}
                        onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                        placeholder="94107"
                        required
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        placeholder="United States"
                        required
                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="defaultCheckbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="defaultCheckbox" className="text-gray-700 font-medium">
                      Set as default shipping address
                    </label>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(false)}
                      className="flex-1 py-2 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingAddress ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: MY ORDERS */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Order History</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View order status, tracking, invoices, and initiate returns
                  </p>
                </div>
              </div>

              {loadingOrders ? (
                <div className="py-12 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">You haven't placed any orders yet.</p>
                  <Link
                    to="/products"
                    className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow hover:bg-blue-700 transition"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => {
                    const badgeClass = STATUS_BADGES[ord.status] || 'bg-gray-100 text-gray-700';
                    return (
                      <div
                        key={ord.id}
                        className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-gray-900">
                              #{ord.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeClass}`}
                            >
                              {ord.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(ord.createdAt).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Items preview */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-2 overflow-x-auto py-1">
                            {(ord.items || []).slice(0, 4).map((item) => (
                              <img
                                key={item.id}
                                src={item.product?.images?.[0] || 'https://placehold.co/40x40?text=No+Img'}
                                alt={item.product?.name}
                                className="w-12 h-12 rounded-xl bg-gray-50 border p-1 object-contain shrink-0"
                                title={item.product?.name}
                              />
                            ))}
                            {(ord.items || []).length > 4 && (
                              <span className="text-xs font-semibold text-gray-400 pl-1">
                                +{ord.items.length - 4} more
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] uppercase text-gray-400 block font-semibold">
                                Total
                              </span>
                              <span className="text-sm font-extrabold text-blue-600">
                                ${(ord.totalAmount || 0).toFixed(2)}
                              </span>
                            </div>

                            <Link
                              to={`/orders/${ord.id}`}
                              className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition flex items-center gap-1"
                            >
                              <span>Details</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Controls */}
                  {ordersTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs font-bold">
                      <button
                        onClick={() => fetchOrders(Math.max(1, ordersPage - 1))}
                        disabled={ordersPage <= 1}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>
                      <span className="text-gray-500">
                        Page {ordersPage} of {ordersTotalPages}
                      </span>
                      <button
                        onClick={() => fetchOrders(Math.min(ordersTotalPages, ordersPage + 1))}
                        disabled={ordersPage >= ordersTotalPages}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: MY BUILDS */}
          {/* ========================================================= */}
          {activeTab === 'builds' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Saved PC Builds</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Your custom configured rigs and part compatibility lists
                  </p>
                </div>
                <Link
                  to="/builder"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Build</span>
                </Link>
              </div>

              {loadingBuilds ? (
                <div className="py-12 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : builds.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Wrench className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">No saved builds yet.</p>
                  <Link
                    to="/builder"
                    className="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow hover:bg-blue-700 transition"
                  >
                    Create a Rig in PC Builder
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {builds.map((b) => (
                    <div
                      key={b.id}
                      className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                            {b.name || 'Custom Build'}
                          </h3>
                          <span className="text-xs font-extrabold text-blue-600">
                            ${(b.totalPrice || 0).toFixed(2)}
                          </span>
                        </div>
                        {b.description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{b.description}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">
                          Last updated: {new Date(b.updatedAt || b.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
                        <Link
                          to={`/builder?buildId=${b.id}`}
                          className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>Open in Builder</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => handleDeleteBuild(b.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-50 transition"
                          title="Delete Build"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: MY REVIEWS */}
          {/* ========================================================= */}
          {activeTab === 'reviews' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900">My Product Reviews</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Reviews and feedback you have submitted for delivered hardware
                </p>
              </div>

              {loadingReviews ? (
                <div className="py-12 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Star className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">You haven't written any reviews yet.</p>
                  <p className="text-[11px] text-gray-400">
                    You can write reviews for products on orders that have been successfully delivered.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          to={`/products/${rev.product?.slug || rev.productId}`}
                          className="text-xs sm:text-sm font-bold text-gray-900 hover:text-blue-600 transition line-clamp-1"
                        >
                          {rev.product?.name || 'Product'}
                        </Link>
                        <span className="text-[10px] text-gray-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>

                      {rev.title && <p className="text-xs font-bold text-gray-800">{rev.title}</p>}
                      <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>

                      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2 text-xs">
                        <button
                          onClick={() => handleOpenEditReview(rev)}
                          className="px-3 py-1 font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="px-3 py-1 font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Review Modal */}
              {editingReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h3 className="text-base font-bold text-gray-900">Edit Your Review</h3>
                      <button
                        onClick={() => setEditingReview(null)}
                        className="text-gray-400 hover:text-gray-600 font-bold"
                      >
                        &times;
                      </button>
                    </div>

                    <form onSubmit={handleUpdateReview} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Rating</label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              className="p-1 focus:outline-none"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  star <= reviewForm.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Review Headline</label>
                        <input
                          type="text"
                          value={reviewForm.title}
                          onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                          placeholder="e.g. Great performance and low temps"
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Review Details</label>
                        <textarea
                          rows={3}
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          required
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingReview(null)}
                          className="flex-1 py-2 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={savingReview}
                          className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-bold shadow hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingReview ? 'Updating...' : 'Update Review'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: MY ALERTS */}
          {/* ========================================================= */}
          {activeTab === 'alerts' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900">Price Drop Alerts</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Products you are monitoring for price reductions
                </p>
              </div>

              {loadingAlerts ? (
                <div className="py-12 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">No price alerts set.</p>
                  <p className="text-[11px] text-gray-400">
                    Visit any product page to set custom price alert thresholds.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((al) => (
                    <div
                      key={al.id}
                      className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-gray-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={al.product?.images?.[0] || 'https://placehold.co/50x50?text=No+Img'}
                          alt={al.product?.name}
                          className="w-12 h-12 rounded-xl bg-gray-50 border p-1 object-contain"
                        />
                        <div>
                          <Link
                            to={`/products/${al.product?.slug || al.productId}`}
                            className="text-xs font-bold text-gray-900 hover:text-blue-600 line-clamp-1"
                          >
                            {al.product?.name || 'Product'}
                          </Link>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Target: <span className="font-bold text-gray-700">${al.targetPrice?.toFixed(2)}</span> &bull; Current: ${(al.product?.price || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteAlert(al.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-gray-50 transition"
                        title="Remove alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: MY RETURNS */}
          {/* ========================================================= */}
          {activeTab === 'returns' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900">Return Requests (RMA)</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track return and refund requests for eligible delivered orders
                </p>
              </div>

              {loadingReturns ? (
                <div className="py-12 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : returns.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <RotateCcw className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-500 font-medium">No return requests found.</p>
                  <p className="text-[11px] text-gray-400">
                    Returns can be requested from the Order Details page within 7 days of delivery.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {returns.map((ret) => {
                    const badgeClass =
                      RETURN_STATUS_BADGES[ret.status] || 'bg-gray-100 text-gray-700';
                    return (
                      <div
                        key={ret.id}
                        className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-gray-900">
                              RMA #{ret.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeClass}`}
                            >
                              {ret.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            Requested: {new Date(ret.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-700">Reason:</span> {ret.reason}
                        </div>

                        {/* Items returned */}
                        {(ret.items || []).length > 0 && (
                          <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3 text-xs space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                              Returned Items
                            </span>
                            {ret.items.map((it) => (
                              <div key={it.id} className="flex justify-between text-gray-700">
                                <span>
                                  {it.orderItem?.product?.name || `Item #${it.orderItemId?.slice(0, 6)}`}
                                </span>
                                <span className="font-semibold">Qty: {it.qty}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
                          <Link
                            to={`/orders/${ret.orderId}`}
                            className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>View Original Order</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

