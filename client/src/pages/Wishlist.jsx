import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, Bell, BellOff, ArrowRight, ShieldAlert, Check } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';

export default function Wishlist() {
  const { user } = useAuth();
  const {
    items,
    itemCount,
    loading,
    removeFromWishlist,
    moveToCart,
    createPriceAlert,
    deletePriceAlert,
    hasPriceAlert,
    getPriceAlert,
  } = useWishlist();

  // Price Alert Modal State
  const [alertModalItem, setAlertModalItem] = useState(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [isSettingAlert, setIsSettingAlert] = useState(false);

  const openPriceAlertModal = (item) => {
    const unitPrice = item.product?.discountPrice ?? item.product?.price ?? 100;
    const existing = getPriceAlert(item.productId);
    setAlertModalItem(item);
    setTargetPrice(existing ? existing.targetPrice : (unitPrice * 0.9).toFixed(2));
  };

  const handleSavePriceAlert = async (e) => {
    e.preventDefault();
    if (!alertModalItem || !targetPrice) return;

    setIsSettingAlert(true);
    await createPriceAlert(alertModalItem.productId, parseFloat(targetPrice));
    setIsSettingAlert(false);
    setAlertModalItem(null);
  };

  const handleToggleAlert = async (item) => {
    const existing = getPriceAlert(item.productId);
    if (existing) {
      await deletePriceAlert(existing.id);
    } else {
      openPriceAlertModal(item);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-inner">
          <Heart className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Wishlist</h1>
        <p className="mt-3 text-base text-gray-500 max-w-md mx-auto">
          Please log in to your BuildForge account to save components, track build prices, and set price drop notifications.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            Create an Account
          </Link>
        </div>
      </div>
    );
  }

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
        <div className="mx-auto w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-6 shadow-inner">
          <Heart className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Wishlist is Empty</h1>
        <p className="mt-3 text-base text-gray-500 max-w-md mx-auto">
          You haven't saved any hardware components yet. Click the heart icon on any product card to save it for later.
        </p>
        <div className="mt-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition"
          >
            Explore Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Saved Wishlist</h1>
        <p className="text-sm text-gray-500 mt-1">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} saved in your account
        </p>
      </div>

      {/* Grid of Saved Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => {
          const product = item.product || {};
          const isOutOfStock = item.availableStock <= 0;
          const alert = getPriceAlert(item.productId);
          const currentPrice = product.discountPrice ?? product.price;

          return (
            <div
              key={item.id}
              className="flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group"
            >
              {/* Product Thumbnail */}
              <div className="relative aspect-square bg-gray-50 p-6 flex items-center justify-center border-b border-gray-100">
                <Link to={`/products/${product.slug || item.productId}`} className="h-full w-full flex items-center justify-center">
                  <img
                    src={product.images?.[0] || 'https://placehold.co/300x300?text=No+Image'}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                  />
                </Link>

                {/* Stock Status Badge */}
                <span
                  className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isOutOfStock
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}
                >
                  {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                </span>

                {/* Remove button */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-gray-400 hover:text-red-600 hover:bg-white shadow-sm transition"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {product.brand}
                  </p>
                  <Link
                    to={`/products/${product.slug || item.productId}`}
                    className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition line-clamp-2 mt-0.5"
                  >
                    {product.name}
                  </Link>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-xl font-extrabold text-gray-900">
                      ${currentPrice.toFixed(2)}
                    </span>
                    {product.discountPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-5 border-t border-gray-100 mt-4">
                  {/* Price Alert Toggle / Status */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleAlert(item)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                        alert
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                      title={alert ? 'Price alert active' : 'Set price alert'}
                    >
                      {alert ? (
                        <>
                          <Bell className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                          <span>Alert: &le; ${alert.targetPrice.toFixed(2)}</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5 text-gray-400" />
                          <span>Notify on price drop</span>
                        </>
                      )}
                    </button>

                    {alert && (
                      <button
                        onClick={() => deletePriceAlert(alert.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Cancel price alert"
                      >
                        <BellOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Move to Cart CTA */}
                  <button
                    onClick={() => moveToCart(item.id)}
                    disabled={isOutOfStock}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Alert Modal */}
      {alertModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Set Price Drop Alert</h3>
                <p className="text-xs text-gray-500">We will notify you when price reaches your target</p>
              </div>
            </div>

            <form onSubmit={handleSavePriceAlert} className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-700 line-clamp-1 mb-1">
                  {alertModalItem.product?.name}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Current Price: <span className="font-bold text-gray-800">${(alertModalItem.product?.discountPrice ?? alertModalItem.product?.price).toFixed(2)}</span>
                </p>

                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Target Notification Price ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    required
                    placeholder="e.g. 299.99"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAlertModalItem(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettingAlert}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSettingAlert ? 'Saving...' : 'Set Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
