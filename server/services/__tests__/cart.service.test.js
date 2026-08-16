import { describe, it, expect, vi, beforeEach } from 'vitest';
const cartRepo = require('../../repositories/cart.repository');
const couponRepo = require('../../repositories/coupon.repository');
const productRepo = require('../../repositories/product.repository');
const cartService = require('../cart.service');

describe('Cart Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Stock Limits & Inventory Check', () => {
    it('should reject adding an item when requested quantity exceeds available stock', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'AMD Ryzen 7 7700X',
        price: 349,
        discountPrice: 299,
        isActive: true,
        inventory: { stockQty: 5, reservedQty: 2 }, // available: 3
      };

      vi.spyOn(productRepo, 'findByIdWithInventory').mockResolvedValue(mockProduct);
      vi.spyOn(cartRepo, 'findOrCreateCart').mockResolvedValue({ id: 'cart-1', userId: 'user-1', items: [] });
      vi.spyOn(cartRepo, 'findCartItem').mockResolvedValue(null);

      await expect(cartService.addItem('user-1', 'prod-1', 4)).rejects.toThrow(
        /Only 3 available in stock/
      );
    });

    it('should reject adding an item when existing cart quantity + new quantity exceeds stock', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'AMD Ryzen 7 7700X',
        price: 349,
        isActive: true,
        inventory: { stockQty: 10, reservedQty: 0 }, // available: 10
      };

      vi.spyOn(productRepo, 'findByIdWithInventory').mockResolvedValue(mockProduct);
      vi.spyOn(cartRepo, 'findOrCreateCart').mockResolvedValue({ id: 'cart-1', userId: 'user-1', items: [] });
      vi.spyOn(cartRepo, 'findCartItem').mockResolvedValue({ id: 'item-1', cartId: 'cart-1', productId: 'prod-1', qty: 8 });

      await expect(cartService.addItem('user-1', 'prod-1', 3)).rejects.toThrow(
        /Only 10 available in stock \(8 already in your cart\)/
      );
    });

    it('should reject adding an item that is out of stock', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'RTX 4090',
        price: 1599,
        isActive: true,
        inventory: { stockQty: 5, reservedQty: 5 }, // available: 0
      };

      vi.spyOn(productRepo, 'findByIdWithInventory').mockResolvedValue(mockProduct);

      await expect(cartService.addItem('user-1', 'prod-1', 1)).rejects.toThrow(
        /out of stock/
      );
    });

    it('should reject updating quantity beyond available stock', async () => {
      const mockCartItem = {
        id: 'item-1',
        qty: 2,
        cart: { userId: 'user-1' },
        product: {
          id: 'prod-1',
          name: 'Corsair RAM',
          inventory: { stockQty: 4, reservedQty: 0 }, // available: 4
        },
      };

      vi.spyOn(cartRepo, 'findCartItemById').mockResolvedValue(mockCartItem);

      await expect(cartService.updateItemQty('user-1', 'item-1', 5)).rejects.toThrow(
        /Only 4 available in stock/
      );
    });

    it('should successfully add item when within stock limits', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'Kingston DDR5',
        price: 89,
        discountPrice: 79,
        isActive: true,
        inventory: { stockQty: 20, reservedQty: 2 },
      };

      vi.spyOn(productRepo, 'findByIdWithInventory').mockResolvedValue(mockProduct);
      vi.spyOn(cartRepo, 'findOrCreateCart').mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            qty: 2,
            product: mockProduct,
          },
        ],
      });
      vi.spyOn(cartRepo, 'findCartItem').mockResolvedValue(null);
      vi.spyOn(cartRepo, 'createCartItem').mockResolvedValue({ id: 'item-1', qty: 2 });

      const res = await cartService.addItem('user-1', 'prod-1', 2);
      expect(res.itemCount).toBe(2);
      expect(res.subtotal).toBe(158); // 79 * 2
      expect(cartRepo.createCartItem).toHaveBeenCalledWith('cart-1', 'prod-1', 2);
    });
  });

  describe('Coupon Validation & Calculation', () => {
    it('should calculate discount for valid active coupon', async () => {
      vi.spyOn(couponRepo, 'findByCode').mockResolvedValue({
        id: 'c-1',
        code: 'WELCOME10',
        discountPercent: 10,
        isActive: true,
        expiresAt: new Date(Date.now() + 86400000), // tomorrow
        usageLimit: 100,
        usedCount: 5,
        minOrderAmount: 50,
      });

      const res = await cartService.applyCoupon('WELCOME10', 200);
      expect(res.valid).toBe(true);
      expect(res.discountPercent).toBe(10);
      expect(res.discountAmount).toBe(20);
      expect(res.newTotal).toBe(180);
    });

    it('should reject inactive coupon', async () => {
      vi.spyOn(couponRepo, 'findByCode').mockResolvedValue({
        id: 'c-2',
        code: 'INACTIVE',
        discountPercent: 20,
        isActive: false,
      });

      await expect(cartService.applyCoupon('INACTIVE', 100)).rejects.toThrow(
        /Invalid or inactive coupon/
      );
    });

    it('should reject expired coupon', async () => {
      vi.spyOn(couponRepo, 'findByCode').mockResolvedValue({
        id: 'c-3',
        code: 'EXPIRED',
        discountPercent: 15,
        isActive: true,
        expiresAt: new Date(Date.now() - 86400000), // yesterday
      });

      await expect(cartService.applyCoupon('EXPIRED', 100)).rejects.toThrow(
        /coupon has expired/
      );
    });

    it('should reject coupon that has reached usage limit', async () => {
      vi.spyOn(couponRepo, 'findByCode').mockResolvedValue({
        id: 'c-4',
        code: 'MAXED',
        discountPercent: 50,
        isActive: true,
        usageLimit: 10,
        usedCount: 10,
      });

      await expect(cartService.applyCoupon('MAXED', 100)).rejects.toThrow(
        /reached its maximum usage limit/
      );
    });

    it('should reject coupon when order subtotal is below minOrderAmount', async () => {
      vi.spyOn(couponRepo, 'findByCode').mockResolvedValue({
        id: 'c-5',
        code: 'BIGSPENDER',
        discountPercent: 25,
        isActive: true,
        minOrderAmount: 500,
      });

      await expect(cartService.applyCoupon('BIGSPENDER', 250)).rejects.toThrow(
        /does not meet the minimum requirement of \$500.00/
      );
    });
  });

  describe('Guest Cart Merging', () => {
    it('should merge guest items into user cart and clamp to stock', async () => {
      const mockProduct = {
        id: 'prod-1',
        name: 'SSD 1TB',
        price: 99,
        isActive: true,
        inventory: { stockQty: 5, reservedQty: 0 }, // max 5
      };

      vi.spyOn(productRepo, 'findByIdWithInventory').mockResolvedValue(mockProduct);
      vi.spyOn(cartRepo, 'findOrCreateCart').mockResolvedValue({
        id: 'cart-1',
        userId: 'user-1',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            qty: 5,
            product: mockProduct,
          },
        ],
      });
      vi.spyOn(cartRepo, 'findCartItem').mockResolvedValue({ id: 'item-1', qty: 2 });
      vi.spyOn(cartRepo, 'updateCartItemQty').mockResolvedValue({ id: 'item-1', qty: 5 });

      // Guest has 4, existing has 2 -> total requested 6, clamped to 5
      await cartService.mergeCart('user-1', [{ productId: 'prod-1', qty: 4 }]);
      expect(cartRepo.updateCartItemQty).toHaveBeenCalledWith('item-1', 5);
    });
  });
});
