import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  ArrowRightCircle,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  CreditCard,
  MapPin,
  Package,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const STATUS_COLORS = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  PAID: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PROCESSING: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  SHIPPED: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  REFUNDED: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

const NEXT_STATUS_OPTIONS = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Drawers / Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [trackingNote, setTrackingNote] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [advanceError, setAdvanceError] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
      });
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const res = await api.get(`/admin/orders?${params.toString()}`);
      if (res.data.success) {
        setOrders(res.data.data.orders);
        setTotalPages(res.data.data.totalPages);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const openDetails = async (orderId) => {
    try {
      const res = await api.get(`/admin/orders/${orderId}`);
      if (res.data.success) {
        setSelectedOrder(res.data.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      showToast('Failed to load order details', 'error');
    }
  };

  const openAdvanceModal = (order) => {
    setSelectedOrder(order);
    const validNext = NEXT_STATUS_OPTIONS[order.status] || [];
    setTargetStatus(validNext[0] || '');
    setTrackingNote('');
    setStatusComment('');
    setAdvanceError('');
    setAdvanceModalOpen(true);
  };

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!targetStatus) {
      setAdvanceError('Please select a target status');
      return;
    }

    setSubmitting(true);
    setAdvanceError('');
    try {
      const res = await api.patch(`/admin/orders/${selectedOrder.id}/status`, {
        status: targetStatus,
        trackingNote: trackingNote.trim() || undefined,
        comment: statusComment.trim() || undefined,
      });

      if (res.data.success) {
        showToast(`Order status updated to ${targetStatus}`);
        setAdvanceModalOpen(false);
        fetchOrders();
        if (detailModalOpen) {
          setSelectedOrder(res.data.data);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Status transition failed';
      setAdvanceError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold transition-all transform animate-bounce ${
            toast.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order Fulfillment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track customer orders, advance shipping milestones, and manage dispatch
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID, customer email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading customer orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const style = STATUS_COLORS[ord.status] || STATUS_COLORS.PENDING;
                  const canAdvance = (NEXT_STATUS_OPTIONS[ord.status] || []).length > 0;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{ord.id.slice(0, 8).toUpperCase()}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{ord.user?.name || 'Customer'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{ord.user?.email}</p>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {ord.items?.length || 0} item{(ord.items?.length || 0) > 1 ? 's' : ''}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 font-black text-slate-900">
                        {formatINR(ord.totalAmount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${style.bg} ${style.text} ${style.border}`}
                        >
                          {ord.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetails(ord.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {canAdvance && (
                            <button
                              onClick={() => openAdvanceModal(ord)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            >
                              <ArrowRightCircle className="w-3.5 h-3.5" />
                              <span>Advance</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{orders.length}</span> of{' '}
            <span className="font-bold text-slate-800">{total}</span> orders
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      (STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.PENDING).bg
                    } ${(STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.PENDING).text} ${
                      (STATUS_COLORS[selectedOrder.status] || STATUS_COLORS.PENDING).border
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  Full ID: {selectedOrder.id} &bull; Placed on{' '}
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
              {/* Customer & Address Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Shipping Address Snapshot</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5 pl-6">
                    <p className="font-bold text-slate-900">
                      {selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name}
                    </p>
                    <p>{selectedOrder.shippingAddress?.street || 'N/A'}</p>
                    <p>
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{' '}
                      {selectedOrder.shippingAddress?.postalCode}
                    </p>
                    <p className="text-slate-400">{selectedOrder.shippingAddress?.phone}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Payment Information</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pl-6">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Method:</span>
                      <span className="font-bold">{selectedOrder.payment?.provider || 'RAZORPAY'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment Status:</span>
                      <span className="font-bold text-emerald-600">
                        {selectedOrder.payment?.status || 'COMPLETED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transaction ID:</span>
                      <span className="font-mono text-[10px]">
                        {selectedOrder.payment?.transactionId || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Ordered Products
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {item.product?.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.product?.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Unit: {formatINR(item.price)} &times; {item.qty}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-900">
                          {formatINR(item.price * item.qty)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-slate-50/80 flex items-center justify-between font-black text-slate-900 text-xs">
                    <span>Order Total</span>
                    <span className="text-sm text-blue-600">{formatINR(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Order Status History
                </h3>
                <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-3">
                  {selectedOrder.statusHistory?.map((hist, idx) => (
                    <div key={hist.id || idx} className="relative">
                      <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-4 ring-blue-50" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{hist.status}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(hist.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {hist.comment && (
                          <p className="text-xs text-slate-600 mt-0.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                            {hist.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Close
              </button>
              {(NEXT_STATUS_OPTIONS[selectedOrder.status] || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    openAdvanceModal(selectedOrder);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Advance Status
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advance Order Status Modal */}
      {advanceModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Advance Order Status</h3>
                <p className="text-xs text-slate-500 font-mono">
                  #{selectedOrder.id.slice(0, 8).toUpperCase()} (Current: {selectedOrder.status})
                </p>
              </div>
              <button
                onClick={() => setAdvanceModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {advanceError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{advanceError}</span>
              </div>
            )}

            <form onSubmit={handleAdvanceSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  New Status *
                </label>
                <select
                  required
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                >
                  {(NEXT_STATUS_OPTIONS[selectedOrder.status] || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {targetStatus === 'SHIPPED' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Courier / Tracking Number Note
                  </label>
                  <input
                    type="text"
                    value={trackingNote}
                    onChange={(e) => setTrackingNote(e.target.value)}
                    placeholder="e.g. BlueDart AW# 894729184"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This tracking note will be emailed to the customer automatically.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Status Change Comment
                </label>
                <textarea
                  rows={2}
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Optional internal/audit comment"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdvanceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Transition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
