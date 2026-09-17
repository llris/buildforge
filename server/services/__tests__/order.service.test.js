import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

const orderService = require('../order.service');
const prisma = require('../../utils/prisma');
const cartRepo = require('../../repositories/cart.repository');
const addressRepo = require('../../repositories/address.repository');
const orderRepo = require('../../repositories/order.repository');
const productRepo = require('../../repositories/product.repository');
const paymentRepo = require('../../repositories/payment.repository');
const reservationRepo = require('../../repositories/reservation.repository');
const { env } = require('../../config/env');

describe('Order Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkout', () => {
    it('returns existing order if idempotency key was already processed (idempotent)', async () => {
      const mockExisting = {
        id: 'ord-existing-1',
        userId: 'user-1',
        totalAmount: 299.99,
        subtotal: 250.0,
        taxAmount: 18.75,
        shippingFee: 15.0,
        discountAmount: 0,
        payment: { razorpayOrderId: 'order_rzp_123' },
      };

      vi.spyOn(orderRepo, 'findOrderByIdempotencyKey').mockResolvedValue(mockExisting);

      const res = await orderService.checkout('user-1', {
        idempotencyKey: 'test-key-12345678',
      });

      expect(res.orderId).toBe('ord-existing-1');
      expect(res.razorpayOrderId).toBe('order_rzp_123');
      expect(res.total).toBe(299.99);
    });

    it('rejects checkout when cart is empty', async () => {
      vi.spyOn(orderRepo, 'findOrderByIdempotencyKey').mockResolvedValue(null);
      vi.spyOn(cartRepo, 'findCartByUserId').mockResolvedValue({ items: [] });

      await expect(
        orderService.checkout('user-1', { idempotencyKey: 'test-key-12345678' })
      ).rejects.toThrow(/cart is empty/);
    });

    it('rejects checkout when requested quantity exceeds available stock', async () => {
      vi.spyOn(orderRepo, 'findOrderByIdempotencyKey').mockResolvedValue(null);
      vi.spyOn(cartRepo, 'findCartByUserId').mockResolvedValue({
        items: [
          {
            productId: 'p-1',
            qty: 5,
            product: { name: 'GPU', price: 500 },
          },
        ],
      });
      vi.spyOn(addressRepo, 'findAddressById').mockResolvedValue({
        id: 'addr-1',
        userId: 'user-1',
        street: '123 Main St',
        city: 'NY',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      vi.spyOn(productRepo, 'findInventoryByProductId').mockResolvedValue({
        stockQty: 3,
        reservedQty: 0,
      });

      await expect(
        orderService.checkout('user-1', {
          addressId: 'addr-1',
          idempotencyKey: 'test-key-12345678',
        })
      ).rejects.toThrow(/Insufficient stock for "GPU"/);
    });
  });

  describe('verifyPayment', () => {
    it('throws ValidationError when Razorpay signature is invalid/tampered', async () => {
      await expect(
        orderService.verifyPayment('user-1', {
          orderId: '00000000-0000-0000-0000-000000000001',
          razorpayOrderId: 'order_123',
          razorpayPaymentId: 'pay_123',
          razorpaySignature: 'invalid_tampered_signature',
        })
      ).rejects.toThrow(/Invalid payment signature/);
    });

    it('verifies valid signature, transitions order to PAID, and deducts inventory', async () => {
      const rzpOrderId = 'order_valid_123';
      const rzpPaymentId = 'pay_valid_456';
      const validSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${rzpOrderId}|${rzpPaymentId}`)
        .digest('hex');

      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
        totalAmount: 150.0,
        items: [{ productId: 'p-1', qty: 2, product: { name: 'CPU' } }],
        payment: { id: 'pay-db-1' },
        user: { email: 'user@example.com' },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      vi.spyOn(orderRepo, 'findOrderById')
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({ ...mockOrder, status: 'PAID' });
      vi.spyOn(paymentRepo, 'updatePayment').mockResolvedValue({});
      vi.spyOn(productRepo, 'updateInventory').mockResolvedValue({});
      vi.spyOn(reservationRepo, 'releaseReservationsForOrder').mockResolvedValue({});
      vi.spyOn(cartRepo, 'clearCart').mockResolvedValue({});

      // Mock DB order status update for state machine
      vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder);
      vi.spyOn(prisma.order, 'update').mockResolvedValue({ ...mockOrder, status: 'PAID' });
      vi.spyOn(prisma.orderStatusHistory, 'create').mockResolvedValue({});

      const res = await orderService.verifyPayment('user-1', {
        orderId: 'order-1',
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: rzpPaymentId,
        razorpaySignature: validSignature,
      });

      expect(res.status).toBe('PAID');
    });
  });

  describe('cancelOrder', () => {
    it('restocks inventory when cancelling a PAID order', async () => {
      const mockOrder = {
        id: 'order-cancel-1',
        userId: 'user-1',
        status: 'PAID',
        items: [{ productId: 'p-1', qty: 2 }],
        user: { id: 'user-1', role: 'CUSTOMER' },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      vi.spyOn(orderRepo, 'findOrderById')
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({ ...mockOrder, status: 'CANCELLED' });

      let inventoryRestocked = false;
      vi.spyOn(productRepo, 'updateInventory').mockImplementation(() => {
        inventoryRestocked = true;
        return {};
      });

      vi.spyOn(prisma.order, 'findUnique').mockResolvedValue(mockOrder);
      vi.spyOn(prisma.order, 'update').mockResolvedValue({ ...mockOrder, status: 'CANCELLED' });
      vi.spyOn(prisma.orderStatusHistory, 'create').mockResolvedValue({});

      const res = await orderService.cancelOrder('user-1', 'order-cancel-1', 'Customer request');
      expect(res.status).toBe('CANCELLED');
      expect(inventoryRestocked).toBe(true);
    });

    it('rejects cancellation for DELIVERED orders', async () => {
      const mockOrder = {
        id: 'order-delivered-1',
        userId: 'user-1',
        status: 'DELIVERED',
        items: [],
        user: { id: 'user-1', role: 'CUSTOMER' },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        return await callback(prisma);
      });

      vi.spyOn(orderRepo, 'findOrderById').mockResolvedValue(mockOrder);

      await expect(
        orderService.cancelOrder('user-1', 'order-delivered-1')
      ).rejects.toThrow(/Cannot cancel order in DELIVERED status/);
    });
  });
});
