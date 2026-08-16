import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck, Tag, X, Wrench } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export default function ShoppingCart() {
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    total,
    appliedCoupon,
    loading,
    updateQty,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    const res = await applyCoupon(couponCode.trim());
    setCouponLoading(false);
    if (res.success) {
      setCouponCode('');
    } else {
      setCouponError(res.error || 'Failed to apply coupon');
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-6 shadow-inner">
          <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Cart is Empty</h1>
        <p className="mt-3 text-base text-gray-500 max-w-md mx-auto">
          Looks like you haven't added any components or custom PC builds to your cart yet.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/products"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            Explore Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/builder"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Wrench className="w-4 h-4 text-blue-600" />
            Build Custom PC
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shopping Cart</h1>
          <p className="text-sm text-gray-500 mt-1">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            {!user && ' (Guest Cart - will sync on login)'}
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-gray-500 hover:text-red-600 transition flex items-center gap-1 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Cart
        </button>
      </div>

      {/* Cart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Line Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const product = item.product || {};
            const isOutOfStock = item.availableStock <= 0;
            const maxAllowed = Math.max(1, item.availableStock || 50);

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-sm transition hover:border-gray-300"
              >
                {/* Product Image */}
                <Link
                  to={`/products/${product.slug || item.productId}`}
                  className="h-20 w-20 flex-shrink-0 bg-gray-50 rounded-xl border border-gray-100 p-2 flex items-center justify-center overflow-hidden"
                >
                  <img
                    src={product.images?.[0] || 'https://placehold.co/200x200?text=No+Image'}
                    alt={product.name}
                    className="h-full w-full object-contain hover:scale-105 transition"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {product.brand || 'Component'}
                  </p>
                  <Link
                    to={`/products/${product.slug || item.productId}`}
                    className="text-sm sm:text-base font-semibold text-gray-900 hover:text-blue-600 transition line-clamp-1 mt-0.5"
                  >
                    {product.name}
                  </Link>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm font-bold text-gray-900">
                      ${item.unitPrice.toFixed(2)}
                    </span>
                    {item.discountPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ${item.originalPrice.toFixed(2)}
                      </span>
                    )}
                    {item.isLowStock && (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        Only {item.availableStock} left
                      </span>
                    )}
                  </div>
                </div>

                {/* Stepper and Totals */}
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50 h-9">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      disabled={item.qty <= 1}
                      className="px-2.5 h-full text-gray-500 hover:text-gray-900 disabled:opacity-40 transition"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      disabled={item.qty >= maxAllowed || isOutOfStock}
                      className="px-2.5 h-full text-gray-500 hover:text-gray-900 disabled:opacity-40 transition"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right w-24">
                    <span className="text-base font-extrabold text-gray-900 block">
                      ${item.lineTotal.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      (${item.unitPrice.toFixed(2)} ea)
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-4 flex justify-between items-center text-sm text-gray-600">
            <Link to="/products" className="text-blue-600 hover:underline font-medium">
              &larr; Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sticky top-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
              Order Summary
            </h2>

            {/* Subtotal & Line items */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>

              {/* Applied Coupon Display */}
              {appliedCoupon && (
                <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    <div>
                      <span className="font-bold text-xs uppercase tracking-wider block">
                        {appliedCoupon.code} ({appliedCoupon.discountPercent}% OFF)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">-${discountAmount.toFixed(2)}</span>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-700 hover:text-red-600 transition"
                      title="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Shipping & Tax */}
              <div className="flex justify-between text-gray-500 text-xs pt-1">
                <span>Shipping Estimate</span>
                <span className="italic">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Estimated Tax</span>
                <span className="italic">Calculated at checkout</span>
              </div>
            </div>

            {/* Coupon Input */}
            <div className="border-t border-gray-100 pt-4">
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">
                  Promo Code / Coupon
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      if (couponError) setCouponError('');
                    }}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 text-sm bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase font-mono"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-600 font-medium">{couponError}</p>
                )}
              </form>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-base font-bold text-gray-900">Estimated Total</span>
                <span className="text-3xl font-extrabold text-blue-600">${total.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-gray-400 text-right">Taxes & shipping finalized at step 2</p>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-base shadow-md hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Security Guarantee Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure 256-Bit SSL Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
