import { describe, it, expect, vi, beforeEach } from 'vitest';
const wishlistRepo = require('../../repositories/wishlist.repository');
const alertRepo = require('../../repositories/alert.repository');
const productRepo = require('../../repositories/product.repository');
const cartService = require('../cart.service');
const wishlistService = require('../wishlist.service');

describe('Wishlist Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should add an item to wishlist idempotently', async () => {
    vi.spyOn(productRepo, 'findByIdWithInventory').mockResolvedValue({ id: 'prod-1', isActive: true });
    vi.spyOn(wishlistRepo, 'findOrCreateWishlist').mockResolvedValue({ id: 'w-1', userId: 'u-1', items: [] });
    vi.spyOn(wishlistRepo, 'findWishlistItem').mockResolvedValue(null);
    const createSpy = vi.spyOn(wishlistRepo, 'createWishlistItem').mockResolvedValue({ id: 'wi-1' });
    vi.spyOn(alertRepo, 'findAlertsByUserId').mockResolvedValue([]);

    await wishlistService.addItem('u-1', 'prod-1');
    expect(createSpy).toHaveBeenCalledWith('w-1', 'prod-1');
  });

  it('should not create duplicate wishlist item if already in wishlist', async () => {
    vi.spyOn(productRepo, 'findByIdWithInventory').mockResolvedValue({ id: 'prod-1', isActive: true });
    vi.spyOn(wishlistRepo, 'findOrCreateWishlist').mockResolvedValue({ id: 'w-1', userId: 'u-1', items: [] });
    vi.spyOn(wishlistRepo, 'findWishlistItem').mockResolvedValue({ id: 'wi-1' });
    const createSpy = vi.spyOn(wishlistRepo, 'createWishlistItem');
    vi.spyOn(alertRepo, 'findAlertsByUserId').mockResolvedValue([]);

    await wishlistService.addItem('u-1', 'prod-1');
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('should move item from wishlist to cart', async () => {
    const mockWishlistItem = {
      id: 'wi-1',
      productId: 'prod-1',
      wishlist: { userId: 'u-1' },
      product: { id: 'prod-1', name: 'RTX 4080' },
    };

    vi.spyOn(wishlistRepo, 'findWishlistItemById').mockResolvedValue(mockWishlistItem);
    const addCartSpy = vi.spyOn(cartService, 'addItem').mockResolvedValue({ id: 'cart-1', items: [{ productId: 'prod-1' }] });
    const deleteWishlistSpy = vi.spyOn(wishlistRepo, 'deleteWishlistItem').mockResolvedValue();
    vi.spyOn(wishlistRepo, 'findOrCreateWishlist').mockResolvedValue({ id: 'w-1', userId: 'u-1', items: [] });
    vi.spyOn(alertRepo, 'findAlertsByUserId').mockResolvedValue([]);

    const result = await wishlistService.moveToCart('u-1', 'wi-1');
    expect(addCartSpy).toHaveBeenCalledWith('u-1', 'prod-1', 1);
    expect(deleteWishlistSpy).toHaveBeenCalledWith('wi-1');
    expect(result.cart).toBeDefined();
    expect(result.wishlist).toBeDefined();
  });
});
