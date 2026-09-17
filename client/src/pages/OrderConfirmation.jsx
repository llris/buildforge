import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Truck, MapPin, Calendar, Clock, ShoppingBag } from 'lucide-react';
import api from '../api/axios';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data.data))
      .catch((err) => console.error('Failed to load order:', err))
      .finally(() => setLoading(false));
  }, [id]);

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
          We couldn't retrieve the details for order #{id?.slice(0, 8)}.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const shippingAddr = order.shippingAddress || {};

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Banner */}
      <div className="text-center space-y-3 mb-10">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
          <CheckCircle className="w-10 h-10 stroke-[2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Payment Successful!</h1>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Thank you for choosing BuildForge. We've received your order and our technicians are preparing your components.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-700">
          <span>Order ID:</span>
          <span className="font-bold text-blue-600">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* Order Status Stepper */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6">
          Live Tracking Status
        </h3>

        <div className="grid grid-cols-4 gap-2 text-center relative">
          <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-gray-200 -z-0" />

          {/* Placed / Paid */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-900 mt-2">Paid</span>
            <span className="text-[10px] text-gray-400">Confirmed</span>
          </div>

          {/* Processing */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow ${
                order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Package className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-900 mt-2">Processing</span>
            <span className="text-[10px] text-gray-400">Warehouse</span>
          </div>

          {/* Shipped */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow ${
                order.status === 'SHIPPED' || order.status === 'DELIVERED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-900 mt-2">Shipped</span>
            <span className="text-[10px] text-gray-400">In Transit</span>
          </div>

          {/* Delivered */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow ${
                order.status === 'DELIVERED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-900 mt-2">Delivered</span>
            <span className="text-[10px] text-gray-400">Completed</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Delivery Address */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Delivery Destination</span>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed font-medium">
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
            <span>Payment Breakdown</span>
          </div>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-900">${(order.subtotal || 0).toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-semibold">-${order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping Fee:</span>
              <span className="font-semibold text-gray-900">${(order.shippingFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span className="font-semibold text-gray-900">${(order.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-sm font-bold text-gray-900">
              <span>Total Paid:</span>
              <span className="text-blue-600">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-10">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
          Ordered Hardware Components
        </h3>
        <div className="divide-y divide-gray-100">
          {(order.items || []).map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={item.product?.images?.[0] || 'https://placehold.co/80x80?text=No+Img'}
                  alt={item.product?.name}
                  className="w-12 h-12 rounded-lg bg-gray-50 p-1 border object-contain"
                />
                <div>
                  <p className="text-xs font-bold text-gray-900">{item.product?.name}</p>
                  <p className="text-[11px] text-gray-400">
                    Qty: {item.qty} &times; ${item.priceSnapshot.toFixed(2)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-gray-900">
                ${(item.priceSnapshot * item.qty).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/orders"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-900 text-white font-bold text-xs shadow hover:bg-gray-800 transition text-center"
        >
          View All Orders
        </Link>
        <Link
          to="/products"
          className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 transition text-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
