import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Search,
  ArrowRight,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';
import api from '../api/axios';

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

const ORDER_STAGES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderTracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch recent orders for easy 1-click selection
  useEffect(() => {
    api
      .get('/orders?limit=5')
      .then((res) => {
        const list = res.data.data?.orders || (Array.isArray(res.data.data) ? res.data.data : []);
        setRecentOrders(list);
      })
      .catch((err) => console.error('Failed to load recent orders:', err))
      .finally(() => setLoadingRecent(false));
  }, []);

  // Fetch specific order when query param or initialOrderId changes
  useEffect(() => {
    if (initialOrderId) {
      loadOrder(initialOrderId);
    }
  }, [initialOrderId]);

  const loadOrder = async (id) => {
    if (!id || !id.trim()) return;
    setLoadingOrder(true);
    setErrorMessage('');
    try {
      const res = await api.get(`/orders/${id.trim()}`);
      setSelectedOrder(res.data.data);
      setSearchParams({ orderId: id.trim() });
    } catch (err) {
      setErrorMessage(err.response?.data?.error?.message || 'Order not found. Please check the Order ID.');
      setSelectedOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      loadOrder(orderIdInput.trim());
    }
  };

  const currentStageIndex = selectedOrder ? ORDER_STAGES.indexOf(selectedOrder.status) : -1;
  const isTerminal = selectedOrder && ['CANCELLED', 'RETURNED', 'REFUNDED'].includes(selectedOrder.status);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Search */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-sm text-center max-w-3xl mx-auto space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Truck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Track Your Shipment
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          Enter your Order ID to see real-time updates, courier tracking, and milestone history.
        </p>

        <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex gap-2 pt-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="e.g. ord_123456 or UUID..."
              className="w-full text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </div>
          <button
            type="submit"
            disabled={loadingOrder || !orderIdInput.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow disabled:opacity-50"
          >
            {loadingOrder ? 'Searching...' : 'Track'}
          </button>
        </form>

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 max-w-md mx-auto flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Tracked Order Details */}
      {selectedOrder && (
        <div className="space-y-6 animate-fade-in">
          {/* Status Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Tracking Order
              </span>
              <h2 className="text-xl font-extrabold text-gray-900">
                #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                  STATUS_BADGES[selectedOrder.status] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {selectedOrder.status}
              </span>
              <Link
                to={`/orders/${selectedOrder.id}`}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Full Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Stepper Pipeline */}
          {!isTerminal && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">
                Milestone Pipeline
              </h3>
              <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-gray-100 -z-0" />

                {ORDER_STAGES.map((stage, idx) => {
                  const isPastOrCurrent = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;
                  const historyItem = (selectedOrder.statusHistory || []).find((h) => h.status === stage);

                  return (
                    <div key={stage} className="relative z-10 flex sm:flex-col items-center gap-3 sm:gap-2 w-full sm:w-auto">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md scale-110'
                            : isPastOrCurrent
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        {isPastOrCurrent && !isCurrent ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>
                      <div className="sm:text-center">
                        <p
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-blue-600'
                              : isPastOrCurrent
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          {stage}
                        </p>
                        {historyItem && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(historyItem.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2-Column: Address/Summary & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Delivery Address</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {selectedOrder.shippingAddress?.street}
                <br />
                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}{' '}
                {selectedOrder.shippingAddress?.zip}
                <br />
                {selectedOrder.shippingAddress?.country}
              </p>

              <div className="border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gray-900 block mb-2">Package Items</span>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate max-w-[220px]">
                        {item.qty}x {item.product?.name}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${(item.priceSnapshot * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Status Audit Log */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                Shipment History Timeline
              </h3>
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-4">
                {(selectedOrder.statusHistory || []).map((hist) => (
                  <div key={hist.id} className="relative pl-5">
                    <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-gray-900">{hist.status}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(hist.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {hist.comment && <p className="text-xs text-gray-500 mt-0.5">{hist.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders List for 1-Click Track */}
      {!selectedOrder && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Select an Order to Track</h2>

          {loadingRecent ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No orders found. Once you place an order, you will be able to track it here.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((ord) => {
                const badgeClass = STATUS_BADGES[ord.status] || 'bg-gray-100 text-gray-700';
                return (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setOrderIdInput(ord.id);
                      loadOrder(ord.id);
                    }}
                    className="py-3.5 flex items-center justify-between hover:bg-gray-50/80 px-3 rounded-xl cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">
                          Order #{ord.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Placed {new Date(ord.createdAt).toLocaleDateString()} &bull;{' '}
                          {(ord.items || []).length} items &bull; ${(ord.totalAmount || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeClass}`}
                      >
                        {ord.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

