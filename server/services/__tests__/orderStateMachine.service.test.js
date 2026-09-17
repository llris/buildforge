import { describe, it, expect, vi } from 'vitest';
import orderStateMachine from '../orderStateMachine.service';

describe('Order State Machine Service', () => {
  describe('canTransition', () => {
    it('allows valid normal transitions', () => {
      expect(orderStateMachine.canTransition('PENDING', 'PAID')).toBe(true);
      expect(orderStateMachine.canTransition('PAID', 'PROCESSING')).toBe(true);
      expect(orderStateMachine.canTransition('PROCESSING', 'SHIPPED')).toBe(true);
      expect(orderStateMachine.canTransition('SHIPPED', 'DELIVERED')).toBe(true);
      expect(orderStateMachine.canTransition('DELIVERED', 'RETURNED')).toBe(true);
      expect(orderStateMachine.canTransition('RETURNED', 'REFUNDED')).toBe(true);
    });

    it('allows valid cancellation transitions', () => {
      expect(orderStateMachine.canTransition('PENDING', 'CANCELLED')).toBe(true);
      expect(orderStateMachine.canTransition('PAID', 'CANCELLED')).toBe(true);
      expect(orderStateMachine.canTransition('PROCESSING', 'CANCELLED')).toBe(true);
    });

    it('allows identical status transition as no-op', () => {
      expect(orderStateMachine.canTransition('PAID', 'PAID')).toBe(true);
      expect(orderStateMachine.canTransition('PENDING', 'PENDING')).toBe(true);
    });

    it('rejects illegal transitions', () => {
      expect(orderStateMachine.canTransition('PENDING', 'SHIPPED')).toBe(false);
      expect(orderStateMachine.canTransition('PENDING', 'DELIVERED')).toBe(false);
      expect(orderStateMachine.canTransition('SHIPPED', 'CANCELLED')).toBe(false);
      expect(orderStateMachine.canTransition('DELIVERED', 'CANCELLED')).toBe(false);
      expect(orderStateMachine.canTransition('CANCELLED', 'PAID')).toBe(false);
      expect(orderStateMachine.canTransition('CANCELLED', 'PENDING')).toBe(false);
      expect(orderStateMachine.canTransition('REFUNDED', 'PAID')).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('does not throw for valid transition', () => {
      expect(() => orderStateMachine.validateTransition('PENDING', 'PAID')).not.toThrow();
    });

    it('throws ValidationError for illegal transition', () => {
      expect(() => orderStateMachine.validateTransition('PENDING', 'DELIVERED')).toThrow(
        /Illegal order status transition from PENDING to DELIVERED/
      );
      expect(() => orderStateMachine.validateTransition('CANCELLED', 'PAID')).toThrow(
        /Illegal order status transition from CANCELLED to PAID/
      );
    });
  });

  describe('transitionOrder', () => {
    it('throws NotFoundError if order does not exist', async () => {
      const mockTx = {
        order: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      await expect(
        orderStateMachine.transitionOrder(mockTx, 'nonexistent-id', 'PAID')
      ).rejects.toThrow(/not found/);
    });

    it('updates status and writes to orderStatusHistory on valid transition', async () => {
      const mockOrder = { id: 'order-123', status: 'PENDING' };
      const mockTx = {
        order: {
          findUnique: vi.fn().mockResolvedValue(mockOrder),
          update: vi.fn().mockResolvedValue({ id: 'order-123', status: 'PAID' }),
        },
        orderStatusHistory: {
          create: vi.fn().mockResolvedValue({ id: 'hist-1', orderId: 'order-123', status: 'PAID' }),
        },
      };

      const result = await orderStateMachine.transitionOrder(
        mockTx,
        'order-123',
        'PAID',
        'Payment confirmed'
      );

      expect(mockTx.order.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: { status: 'PAID' },
      });

      expect(mockTx.orderStatusHistory.create).toHaveBeenCalledWith({
        data: {
          orderId: 'order-123',
          status: 'PAID',
          comment: 'Payment confirmed',
        },
      });

      expect(result.status).toBe('PAID');
    });
  });
});
