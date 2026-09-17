import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, ShieldCheck, AlertCircle, ShoppingBag } from 'lucide-react';
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

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders')
      .then((res) => setOrders(res.data.data || []))
      .catch((err) => console.error('Failed to fetch orders:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">No Orders Placed Yet</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          You haven't made any purchases yet. Build your dream PC or browse our high-end components.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/products"
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow hover:bg-blue-700 transition"
          >
            Explore Catalog
          </Link>
          <Link
            to="/builder"
            className="px-6 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
          >
            PC Builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="border-b border-gray-200 pb-5 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order History</h1>
        <p className="text-xs text-gray-500 mt-1">
          Track shipments, view payment invoices, and manage past purchases
        </p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const badgeClass = STATUS_BADGES[order.status] || 'bg-gray-50 text-gray-600 border-gray-200';
          const items = order.items || [];
          const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 transition"
            >
              {/* Header bar */}
              <div className="bg-gray-50/70 px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block font-semibold">ORDER ID</span>
                    <span className="font-mono font-bold text-gray-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">DATE PLACED</span>
                    <span className="font-medium text-gray-700">{dateStr}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">TOTAL AMOUNT</span>
                    <span className="font-extrabold text-blue-600">${order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${badgeClass}`}
                  >
                    {order.status}
                  </span>
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Items Preview */}
              <div className="p-6 divide-y divide-gray-100">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product?.images?.[0] || 'https://placehold.co/50x50?text=No+Img'}
                        alt={item.product?.name}
                        className="w-10 h-10 rounded-lg bg-gray-50 p-1 border object-contain"
                      />
                      <div>
                        <p className="font-bold text-gray-900 line-clamp-1">{item.product?.name}</p>
                        <p className="text-gray-400">
                          Qty: {item.qty} &bull; ${item.priceSnapshot.toFixed(2)} ea
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${(item.priceSnapshot * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-gray-400 pt-2 text-right">
                    +{items.length - 3} more item(s) in this order
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
