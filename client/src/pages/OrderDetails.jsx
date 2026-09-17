import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  ArrowLeft,
  XCircle,
  AlertCircle,
  FileText,
  RotateCcw,
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

const RETURN_STATUS_BADGES = {
  REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

const ORDER_STAGES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of mind');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('Defective item');
  const [selectedReturnItems, setSelectedReturnItems] = useState({});

  const fetchOrder = () => {
    setLoading(true);
    api
      .get(`/orders/${id}`)
      .then((res) => {
        const orderData = res.data.data;
        setOrder(orderData);
        if (orderData?.items) {
          const initialMap = {};
          orderData.items.forEach((item) => {
            initialMap[item.id] = {
              selected: true,
              qty: item.qty,
              reason: 'Defective item',
            };
          });
          setSelectedReturnItems(initialMap);
        }
      })
      .catch((err) => console.error('Failed to load order:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.post(`/orders/${id}/cancel`, { reason: cancelReason });
      setOrder(res.data.data);
      setShowCancelModal(false);
      setActionSuccess('Order cancelled successfully.');
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleReturnItemToggle = (itemId) => {
    setSelectedReturnItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
      },
    }));
  };

  const handleReturnItemQtyChange = (itemId, maxQty, delta) => {
    setSelectedReturnItems((prev) => {
      const currentQty = prev[itemId]?.qty || 1;
      const newQty = Math.max(1, Math.min(maxQty, currentQty + delta));
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          qty: newQty,
        },
      };
    });
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    const itemsToReturn = Object.entries(selectedReturnItems)
      .filter(([_, item]) => item.selected)
      .map(([orderItemId, item]) => ({
        orderItemId,
        qty: item.qty,
        reason: item.reason || returnReason,
      }));

    if (itemsToReturn.length === 0) {
      setActionError('Please select at least one item to return.');
      return;
    }

    setSubmittingReturn(true);
    try {
      await api.post(`/orders/${id}/returns`, {
        reason: returnReason,
        items: itemsToReturn,
      });
      setShowReturnModal(false);
      setActionSuccess('Return request submitted successfully. Our team will review it shortly.');
      fetchOrder();
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to submit return request.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-sm text-gray-500 mt-2">
          Unable to locate details for order #{id?.slice(0, 8)}.
        </p>
        <Link
          to="/orders"
          className="mt-6 inline-flex px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          Return to Orders
        </Link>
      </div>
    );
  }

  const badgeClass = STATUS_BADGES[order.status] || 'bg-gray-50 text-gray-600 border-gray-200';
  const shippingAddr = order.shippingAddress || {};
  const canCancel = ['PENDING', 'PAID', 'PROCESSING'].includes(order.status);

  // 7-day return window eligibility check
  const isDelivered = order.status === 'DELIVERED';
  const deliveredHistory = (order.statusHistory || []).find((h) => h.status === 'DELIVERED');
  const deliveredDate = deliveredHistory?.createdAt ? new Date(deliveredHistory.createdAt) : new Date(order.updatedAt);
  const now = new Date();
  const daysSinceDelivery = Math.floor((now - deliveredDate) / (1000 * 60 * 60 * 24));
  const isWithinReturnWindow = isDelivered && daysSinceDelivery <= 7;
  const hasExistingReturn = (order.returns || []).length > 0;
  const latestReturn = hasExistingReturn ? order.returns[0] : null;

  // Pipeline stage index
  const currentStageIndex = ORDER_STAGES.indexOf(order.status);
  const isTerminal = ['CANCELLED', 'RETURNED', 'REFUNDED'].includes(order.status);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-gray-400 hover:text-blue-600 flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${badgeClass}`}
            >
              {order.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Order
            </button>
          )}

          {isWithinReturnWindow && !hasExistingReturn && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Request Return ({7 - daysSinceDelivery}d left)
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Return Request Banner if Return Exists */}
      {hasExistingReturn && latestReturn && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-gray-900">Return Request Active</p>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    RETURN_STATUS_BADGES[latestReturn.status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {latestReturn.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Reason: {latestReturn.reason} &bull; Requested on{' '}
                {new Date(latestReturn.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Link
            to="/dashboard?tab=returns"
            className="text-xs font-bold text-blue-600 hover:underline shrink-0"
          >
            View in Returns Dashboard &rarr;
          </Link>
        </div>
      )}

      {/* Horizontal Status Stepper (Standard Pipeline) */}
      {!isTerminal && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">
            Delivery Progression
          </h2>
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-gray-100 -z-0" />

            {ORDER_STAGES.map((stage, idx) => {
              const isPastOrCurrent = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;
              const historyItem = (order.statusHistory || []).find((h) => h.status === stage);

              return (
                <div key={stage} className="relative z-10 flex sm:flex-col items-center gap-3 sm:gap-2 w-full sm:w-auto">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
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

      {/* 3-Column Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shipping Address */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Shipping Address</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed">
            {shippingAddr.street}
            <br />
            {shippingAddr.city}, {shippingAddr.state} {shippingAddr.zip}
            <br />
            {shippingAddr.country}
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Payment Summary</span>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-bold text-gray-900">{order.payment?.status || 'PENDING'}</span>
            </div>
            <div className="flex justify-between">
              <span>Gateway:</span>
              <span className="font-medium text-gray-700">{order.payment?.provider || 'RAZORPAY'}</span>
            </div>
            {order.payment?.transactionId && (
              <div className="flex justify-between">
                <span>Transaction:</span>
                <span className="font-mono text-[10px]">{order.payment.transactionId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Invoice Breakdown</span>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>${(order.shippingFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${(order.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-1.5 font-extrabold text-sm text-gray-900">
              <span>Total:</span>
              <span className="text-blue-600">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">
          Order Items ({(order.items || []).length})
        </h2>

        <div className="divide-y divide-gray-100">
          {(order.items || []).map((item) => (
            <div key={item.id} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link to={`/products/${item.product?.slug || item.productId}`}>
                  <img
                    src={item.product?.images?.[0] || 'https://placehold.co/80x80?text=No+Img'}
                    alt={item.product?.name}
                    className="w-14 h-14 rounded-xl bg-gray-50 p-1 border object-contain hover:scale-105 transition"
                  />
                </Link>
                <div>
                  <Link
                    to={`/products/${item.product?.slug || item.productId}`}
                    className="text-xs sm:text-sm font-bold text-gray-900 hover:text-blue-600 transition line-clamp-1"
                  >
                    {item.product?.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Qty: {item.qty} &times; ${item.priceSnapshot.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-extrabold text-gray-900 block">
                  ${(item.priceSnapshot * item.qty).toFixed(2)}
                </span>
                {isDelivered && (
                  <Link
                    to={`/products/${item.product?.slug || item.productId}?tab=reviews`}
                    className="text-[11px] font-bold text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Write a Review
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Vertical Status History Timeline */}
      {order.statusHistory?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">
            Detailed Status Timeline
          </h2>

          <div className="relative border-l-2 border-gray-100 ml-4 space-y-6">
            {order.statusHistory.map((hist) => (
              <div key={hist.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-gray-900">{hist.status}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(hist.createdAt).toLocaleString()}
                  </span>
                </div>
                {hist.comment && <p className="text-xs text-gray-500 mt-1">{hist.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Cancel Order</h3>
            </div>
            <p className="text-xs text-gray-500">
              Are you sure you want to cancel Order #{order.id.slice(0, 8).toUpperCase()}? Reserved or purchased items will be returned to inventory.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Reason for cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-gray-50"
              >
                <option value="Change of mind">Change of mind</option>
                <option value="Found better price elsewhere">Found better price elsewhere</option>
                <option value="Selected incorrect components">Selected incorrect components</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow hover:bg-rose-700 transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-lg font-bold text-gray-900">Request Return (RMA)</h3>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Select the items and quantities you wish to return for Order #{order.id.slice(0, 8).toUpperCase()}.
            </p>

            {/* General Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Return Reason
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Defective item">Defective or malfunctioning item</option>
                <option value="Incompatible with my system">Incompatible with my system</option>
                <option value="Item not as described">Item not as described</option>
                <option value="Damaged in transit">Damaged during transit</option>
                <option value="Changed mind">Changed mind</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Items selection */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                Select Items to Return
              </label>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                {(order.items || []).map((item) => {
                  const itemState = selectedReturnItems[item.id] || { selected: false, qty: 1 };
                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={itemState.selected}
                          onChange={() => handleReturnItemToggle(item.id)}
                          className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900 line-clamp-1">
                            {item.product?.name}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Purchased: {item.qty} &bull; ${item.priceSnapshot.toFixed(2)} ea
                          </p>
                        </div>
                      </div>

                      {itemState.selected && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">Qty:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleReturnItemQtyChange(item.id, item.qty, -1)}
                              className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-bold text-gray-800">
                              {itemState.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleReturnItemQtyChange(item.id, item.qty, 1)}
                              className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReturn}
                onClick={handleSubmitReturn}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submittingReturn ? 'Submitting...' : 'Confirm Return Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
