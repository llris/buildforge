import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

export default function ProductCard({ product, onCompareToggle, isCompared, hideCompare }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const stock = product.inventory?.stockQty || 0;
  const isOutOfStock = stock <= 0;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="product-card group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md hover:border-blue-300">
      <Link to={`/products/${product.slug}`} className="absolute inset-0 z-10" />

      {/* Badges */}
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-1.5">
        {product.discountPrice && (
          <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            SALE
          </span>
        )}
        {isOutOfStock && (
          <span className="rounded-full bg-gray-800/90 text-white px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
            Out of Stock
          </span>
        )}
      </div>

      {/* Compare Checkbox */}
      {!hideCompare && (
        <div className="absolute right-3 top-3 z-20">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm border border-gray-200 text-xs font-medium text-gray-700 shadow-sm hover:bg-white transition">
            <input
              type="checkbox"
              checked={isCompared}
              onChange={(e) => onCompareToggle(product, e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Compare</span>
          </label>
        </div>
      )}

      {/* Image */}
      <div className="aspect-square overflow-hidden bg-gray-50/50 p-6 flex items-center justify-center border-b border-gray-100">
        <img
          src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'}
          alt={product.name}
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {product.brand}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < Math.round(product.avgRating || 0)
                    ? 'fill-current'
                    : 'fill-gray-200 text-gray-200'
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {(product.avgRating || 0).toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">({product.ratingCount || 0})</span>
        </div>

        {/* Price & Action Buttons */}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            {product.discountPrice ? (
              <>
                <span className="text-lg font-extrabold text-gray-900 leading-tight">
                  ${product.discountPrice.toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-extrabold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          <div className="relative z-20 flex gap-2">
            {/* Wishlist Toggle Button */}
            <button
              onClick={handleToggleWishlist}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition shadow-sm ${
                isWishlisted
                  ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-rose-600'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
