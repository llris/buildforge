import { describe, it, expect, vi, beforeEach } from 'vitest';

const prisma = require('../../utils/prisma');
const adminUserService = require('../adminUser.service');
const adminReturnService = require('../adminReturn.service');
const adminInventoryService = require('../adminInventory.service');
const { ValidationError } = require('../../utils/AppError');

describe('Admin User & Role Management Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prevents self-demotion from ADMIN role', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'admin-1', role: 'ADMIN', isActive: true });

    await expect(
      adminUserService.changeUserRole('admin-1', 'admin-1', 'CUSTOMER')
    ).rejects.toThrow(ValidationError);
  });

  it('prevents demoting the last active ADMIN in the database', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'admin-2', role: 'ADMIN', isActive: true });
    vi.spyOn(prisma.user, 'count').mockResolvedValue(1); // Only 1 active admin exists

    await expect(
      adminUserService.changeUserRole('admin-1', 'admin-2', 'CUSTOMER')
    ).rejects.toThrow(/Security lockout protection/);
  });

  it('allows promoting CUSTOMER to SUPPORT or ADMIN', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'user-1', role: 'CUSTOMER', isActive: true });
    vi.spyOn(prisma.user, 'update').mockResolvedValue({ id: 'user-1', role: 'SUPPORT', isActive: true });
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({});
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb(prisma));

    const result = await adminUserService.changeUserRole('admin-1', 'user-1', 'SUPPORT');
    expect(result.role).toBe('SUPPORT');
  });

  it('prevents deactivating the last active ADMIN', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'admin-1', role: 'ADMIN', isActive: true });
    vi.spyOn(prisma.user, 'count').mockResolvedValue(1);

    await expect(
      adminUserService.toggleUserStatus('admin-2', 'admin-1')
    ).rejects.toThrow(/Security lockout protection/);
  });
});

describe('Admin Return Management (Defensive Refund & Restock)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('approves return, restocks inventory, and updates order to REFUNDED even if gateway fails', async () => {
    const mockReturn = {
      id: 'ret-123',
      status: 'REQUESTED',
      items: [{ orderItemId: 'item-1', qty: 2 }],
      order: {
        id: 'ord-123',
        status: 'DELIVERED',
        userId: 'user-1',
        totalAmount: 150,
        user: { email: 'buyer@example.com' },
        items: [{ id: 'item-1', productId: 'prod-1', qty: 2 }],
        payment: { provider: 'RAZORPAY', razorpayPaymentId: 'pay_invalid_test_id' },
      },
    };

    vi.spyOn(prisma.return, 'findUnique').mockResolvedValue(mockReturn);
    vi.spyOn(prisma.inventory, 'updateMany').mockResolvedValue({ count: 1 });
    vi.spyOn(prisma.return, 'update').mockResolvedValue({ ...mockReturn, status: 'REFUNDED' });
    vi.spyOn(prisma.order, 'update').mockResolvedValue({ ...mockReturn.order, status: 'REFUNDED' });
    vi.spyOn(prisma.orderStatusHistory, 'create').mockResolvedValue({});
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({});
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb(prisma));

    const res = await adminReturnService.approveReturn('admin-1', 'ret-123');

    expect(res.status).toBe('REFUNDED');
    expect(prisma.inventory.updateMany).toHaveBeenCalledWith({
      where: { productId: 'prod-1' },
      data: { stockQty: { increment: 2 } },
    });
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'ord-123' },
      data: { status: 'REFUNDED' },
    });
  });

  it('rejects return with a required reason', async () => {
    const mockReturn = {
      id: 'ret-123',
      status: 'REQUESTED',
      orderId: 'ord-123',
      order: { userId: 'user-1', user: { email: 'buyer@example.com' } },
    };

    vi.spyOn(prisma.return, 'findUnique').mockResolvedValue(mockReturn);
    vi.spyOn(prisma.return, 'update').mockResolvedValue({ ...mockReturn, status: 'REJECTED' });
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({});
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb(prisma));

    const res = await adminReturnService.rejectReturn('admin-1', 'ret-123', {
      reason: 'Outside return policy',
    });

    expect(res.status).toBe('REJECTED');
  });
});

describe('Admin Inventory Stock Adjustment', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requires a mandatory reason note for stock adjustments', async () => {
    await expect(
      adminInventoryService.adjustStock('admin-1', 'prod-1', { stockQty: 50, reason: '' })
    ).rejects.toThrow(/reason note is mandatory/);
  });

  it('adjusts stock and records audit log', async () => {
    const mockInventory = {
      id: 'inv-1',
      productId: 'prod-1',
      stockQty: 10,
      lowStockThreshold: 5,
      product: { name: 'RTX 4090' },
    };

    vi.spyOn(prisma.inventory, 'findUnique').mockResolvedValue(mockInventory);
    vi.spyOn(prisma.inventory, 'update').mockResolvedValue({ ...mockInventory, stockQty: 25 });
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({});
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb) => cb(prisma));

    const result = await adminInventoryService.adjustStock('admin-1', 'prod-1', {
      stockQty: 25,
      reason: 'Warehouse delivery restock',
    });

    expect(result.stockQty).toBe(25);
  });
});
