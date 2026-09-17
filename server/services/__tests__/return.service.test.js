import { describe, it, expect, vi, beforeEach } from 'vitest';

const returnService = require('../return.service');
const orderRepo = require('../../repositories/order.repository');
const returnRepo = require('../../repositories/return.repository');

describe('Return Service', () => {
  const userId = 'user-123';
  const orderId = 'order-abc';
  const productId = 'prod-xyz';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createReturn', () => {
    it('rejects return for non-delivered order', async () => {
      vi.spyOn(orderRepo, 'findOrderById').mockResolvedValue({
        id: orderId,
        userId,
        status: 'SHIPPED', // Not delivered
        items: [{ productId, qty: 1 }],
      });

      await expect(
        returnService.createReturn(userId, orderId, {
          items: [{ productId, qty: 1 }],
          reason: 'Defective part',
        })
      ).rejects.toThrow(/only allowed for DELIVERED orders/i);
    });

    it('rejects return if 7-day window has expired', async () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      vi.spyOn(orderRepo, 'findOrderById').mockResolvedValue({
        id: orderId,
        userId,
        status: 'DELIVERED',
        updatedAt: eightDaysAgo,
        statusHistory: [{ status: 'DELIVERED', createdAt: eightDaysAgo }],
        items: [{ productId, qty: 1, product: { name: 'Motherboard', slug: 'mobo' } }],
      });

      await expect(
        returnService.createReturn(userId, orderId, {
          items: [{ productId, qty: 1 }],
          reason: 'Defective part',
        })
      ).rejects.toThrow(/Return window expired/i);
    });

    it('creates return request for delivered order within 7 days', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      vi.spyOn(orderRepo, 'findOrderById').mockResolvedValue({
        id: orderId,
        userId,
        status: 'DELIVERED',
        updatedAt: twoDaysAgo,
        statusHistory: [{ status: 'DELIVERED', createdAt: twoDaysAgo }],
        items: [{ productId, qty: 1, product: { name: 'Motherboard', slug: 'mobo' } }],
      });

      vi.spyOn(returnRepo, 'createReturn').mockResolvedValue({
        id: 'ret-1',
        orderId,
        status: 'REQUESTED',
        reason: 'Defective memory slot',
        items: [{ productId, qty: 1, name: 'Motherboard' }],
      });

      const res = await returnService.createReturn(userId, orderId, {
        items: [{ productId, qty: 1 }],
        reason: 'Defective memory slot',
      });

      expect(res.id).toBe('ret-1');
      expect(res.status).toBe('REQUESTED');
    });
  });
});
