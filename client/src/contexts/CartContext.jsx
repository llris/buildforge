import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const GUEST_CART_KEY = 'buildforge_guest_cart';

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState({ id: null, items: [], subtotal: 0, itemCount: 0 });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Helper for computing guest cart totals
  const computeGuestCart = (items) => {
    const formattedItems = items.map((item) => {
      const unitPrice = item.product?.discountPrice ?? item.product?.price ?? item.unitPrice ?? 0;
      const lineTotal = Number((unitPrice * item.qty).toFixed(2));
      const stockQty = item.product?.inventory?.stockQty ?? item.availableStock ?? 50;
      const reservedQty = item.product?.inventory?.reservedQty ?? 0;
      const availableStock = Math.max(0, stockQty - reservedQty);

      return {
        id: item.id || `guest-${item.productId}`,
        productId: item.productId,
        qty: item.qty,
        unitPrice,
        originalPrice: item.product?.price ?? unitPrice,
        discountPrice: item.product?.discountPrice ?? null,
        lineTotal,
        availableStock,
        isOutOfStock: availableStock <= 0,
        isLowStock: availableStock > 0 && availableStock <= 5,
        product: item.product || {
          id: item.productId,
          name: item.name || 'Product',
          brand: item.brand || '',
          slug: item.slug || '',
          price: unitPrice,
          discountPrice: item.discountPrice,
          images: item.images || [],
        },
      };
    });

    const subtotal = Number(formattedItems.reduce((sum, it) => sum + it.lineTotal, 0).toFixed(2));
    const itemCount = formattedItems.reduce((sum, it) => sum + it.qty, 0);

    return {
      id: 'guest',
      items: formattedItems,
      subtotal,
      itemCount,
    };
  };

  // Fetch Cart (Server or Guest LocalStorage)
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        // Merge guest items if any were left in localStorage
        const storedGuestCart = localStorage.getItem(GUEST_CART_KEY);
        if (storedGuestCart) {
          try {
            const parsed = JSON.parse(storedGuestCart);
            if (Array.isArray(parsed) && parsed.length > 0) {
              await api.post('/cart/merge', {
                items: parsed.map((it) => ({ productId: it.productId, qty: it.qty })),
              });
              localStorage.removeItem(GUEST_CART_KEY);
            }
          } catch (e) {
            console.error('Failed to merge guest cart', e);
          }
        }

        const res = await api.get('/cart');
        setCart(res.data.data);
      } else {
        const stored = localStorage.getItem(GUEST_CART_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setCart(computeGuestCart(parsed));
          } catch (e) {
            setCart({ id: 'guest', items: [], subtotal: 0, itemCount: 0 });
          }
        } else {
          setCart({ id: 'guest', items: [], subtotal: 0, itemCount: 0 });
        }
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add To Cart
  const addToCart = async (productOrId, qty = 1) => {
    const isObject = typeof productOrId === 'object' && productOrId !== null;
    const productId = isObject ? productOrId.id : productOrId;
    const product = isObject ? productOrId : null;

    try {
      if (user) {
        const res = await api.post('/cart/items', { productId, qty });
        setCart(res.data.data);
        showToast('Item added to cart!');
        return { success: true };
      } else {
        // Guest Cart in localStorage
        const currentGuestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
        const existingIdx = currentGuestItems.findIndex((it) => it.productId === productId);

        // Fetch product if not provided
        let productDetails = product;
        if (!productDetails) {
          try {
            const pRes = await api.get(`/products/${productId}`);
            productDetails = pRes.data.data;
          } catch (e) {
            // fallback
          }
        }

        const stock = productDetails?.inventory?.stockQty ?? 50;
        const reserved = productDetails?.inventory?.reservedQty ?? 0;
        const availableStock = Math.max(0, stock - reserved);

        if (availableStock <= 0) {
          showToast('Product is currently out of stock', 'error');
          return { success: false, error: 'Out of stock' };
        }

        if (existingIdx > -1) {
          const newQty = currentGuestItems[existingIdx].qty + qty;
          if (newQty > availableStock) {
            showToast(`Only ${availableStock} available in stock`, 'error');
            return { success: false, error: 'Exceeds stock' };
          }
          currentGuestItems[existingIdx].qty = newQty;
        } else {
          if (qty > availableStock) {
            showToast(`Only ${availableStock} available in stock`, 'error');
            return { success: false, error: 'Exceeds stock' };
          }
          currentGuestItems.push({
            id: `guest-${productId}`,
            productId,
            qty,
            product: productDetails,
          });
        }

        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(currentGuestItems));
        setCart(computeGuestCart(currentGuestItems));
        showToast('Item added to cart!');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add item to cart';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  // Update Item Quantity
  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return removeFromCart(itemId);

    try {
      if (user) {
        const res = await api.patch(`/cart/items/${itemId}`, { qty: newQty });
        setCart(res.data.data);
      } else {
        const currentGuestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
        const idx = currentGuestItems.findIndex(
          (it) => it.id === itemId || it.productId === itemId
        );
        if (idx > -1) {
          const item = currentGuestItems[idx];
          const stock = item.product?.inventory?.stockQty ?? 50;
          const reserved = item.product?.inventory?.reservedQty ?? 0;
          const available = Math.max(0, stock - reserved);

          if (newQty > available) {
            showToast(`Only ${available} available in stock`, 'error');
            return;
          }

          currentGuestItems[idx].qty = newQty;
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(currentGuestItems));
          setCart(computeGuestCart(currentGuestItems));
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update quantity';
      showToast(msg, 'error');
    }
  };

  // Remove Item
  const removeFromCart = async (itemId) => {
    try {
      if (user) {
        const res = await api.delete(`/cart/items/${itemId}`);
        setCart(res.data.data);
        showToast('Item removed from cart');
      } else {
        const currentGuestItems = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
        const filtered = currentGuestItems.filter(
          (it) => it.id !== itemId && it.productId !== itemId
        );
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(filtered));
        setCart(computeGuestCart(filtered));
        showToast('Item removed from cart');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove item';
      showToast(msg, 'error');
    }
  };

  // Clear Cart
  const clearCart = async () => {
    try {
      if (user) {
        const res = await api.delete('/cart');
        setCart(res.data.data);
      } else {
        localStorage.removeItem(GUEST_CART_KEY);
        setCart({ id: 'guest', items: [], subtotal: 0, itemCount: 0 });
      }
      setAppliedCoupon(null);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  // Apply Coupon
  const applyCoupon = async (code) => {
    if (!code || !code.trim()) {
      showToast('Please enter a coupon code', 'error');
      return { success: false, error: 'Coupon code required' };
    }

    try {
      const res = await api.post('/cart/apply-coupon', {
        code: code.trim(),
        subtotal: cart.subtotal,
      });

      const data = res.data.data;
      setAppliedCoupon(data);
      showToast(`Coupon "${data.code}" applied: ${data.discountPercent}% off!`);
      return { success: true, data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid coupon code';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    showToast('Coupon removed');
  };

  // Calculated values
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = Number(Math.max(0, cart.subtotal - discountAmount).toFixed(2));

  const value = {
    cart,
    items: cart.items || [],
    itemCount: cart.itemCount || 0,
    subtotal: cart.subtotal || 0,
    discountAmount,
    total,
    appliedCoupon,
    loading,
    toast,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    showToast,
    refreshCart: fetchCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border ${
              toast.type === 'error'
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-zinc-900 text-white border-zinc-700'
            }`}
          >
            {toast.type === 'error' ? (
              <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
