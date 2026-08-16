import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { refreshCart, showToast } = useCart();
  const [wishlist, setWishlist] = useState({ id: null, items: [], itemCount: 0 });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist({ id: null, items: [], itemCount: 0 });
      setAlerts([]);
      return;
    }

    setLoading(true);
    try {
      const [wRes, aRes] = await Promise.all([
        api.get('/wishlist'),
        api.get('/alerts').catch(() => ({ data: { data: [] } })),
      ]);
      setWishlist(wRes.data.data);
      setAlerts(aRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = (productId) => {
    return (wishlist.items || []).some((it) => it.productId === productId || it.product?.id === productId);
  };

  const hasPriceAlert = (productId) => {
    return (alerts || []).some((a) => a.productId === productId);
  };

  const getPriceAlert = (productId) => {
    return (alerts || []).find((a) => a.productId === productId);
  };

  const addToWishlist = async (productId) => {
    if (!user) {
      showToast('Please log in to save items to your wishlist', 'error');
      return { success: false, requireAuth: true };
    }

    try {
      const res = await api.post('/wishlist/items', { productId });
      setWishlist(res.data.data);
      showToast('Added to wishlist');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to wishlist';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const removeFromWishlist = async (itemIdOrProductId) => {
    if (!user) return;

    try {
      const res = await api.delete(`/wishlist/items/${itemIdOrProductId}`);
      setWishlist(res.data.data);
      showToast('Removed from wishlist');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove from wishlist';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const moveToCart = async (wishlistItemId) => {
    if (!user) return;

    try {
      const res = await api.post(`/wishlist/items/${wishlistItemId}/move-to-cart`);
      setWishlist(res.data.data.wishlist);
      await refreshCart();
      showToast('Moved to cart!');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to move item to cart';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const createPriceAlert = async (productId, targetPrice) => {
    if (!user) {
      showToast('Please log in to set price alerts', 'error');
      return { success: false, requireAuth: true };
    }

    try {
      const res = await api.post('/alerts', { productId, targetPrice: Number(targetPrice) });
      const createdAlert = res.data.data;
      setAlerts((prev) => [...prev.filter((a) => a.productId !== productId), createdAlert]);
      showToast(`Price alert set for $${Number(targetPrice).toFixed(2)}`);
      await fetchWishlist();
      return { success: true, alert: createdAlert };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to set price alert';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const deletePriceAlert = async (alertIdOrProductId) => {
    if (!user) return;

    try {
      const res = await api.delete(`/alerts/${alertIdOrProductId}`);
      setAlerts(res.data.data);
      showToast('Price alert removed');
      await fetchWishlist();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove price alert';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const togglePriceAlert = async (productId, currentPrice) => {
    const existing = getPriceAlert(productId);
    if (existing) {
      return await deletePriceAlert(existing.id);
    } else {
      // Default target price to 10% below current price or current price
      const target = Number((currentPrice * 0.9).toFixed(2));
      return await createPriceAlert(productId, target);
    }
  };

  const value = {
    wishlist,
    items: wishlist.items || [],
    itemCount: wishlist.itemCount || 0,
    alerts,
    loading,
    isInWishlist,
    hasPriceAlert,
    getPriceAlert,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    moveToCart,
    createPriceAlert,
    deletePriceAlert,
    togglePriceAlert,
    refreshWishlist: fetchWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
