import { describe, it, expect, vi, beforeEach } from 'vitest';
const alertRepo = require('../../repositories/alert.repository');
const productRepo = require('../../repositories/product.repository');
const alertService = require('../alert.service');

describe('Alert Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should create or update a price alert', async () => {
    vi.spyOn(productRepo, 'findByIdWithInventory').mockResolvedValue({ id: 'prod-1', isActive: true });
    vi.spyOn(alertRepo, 'createOrUpdateAlert').mockResolvedValue({
      id: 'a-1',
      userId: 'u-1',
      productId: 'prod-1',
      targetPrice: 199.99,
    });

    const res = await alertService.createAlert('u-1', 'prod-1', 199.99);
    expect(res.targetPrice).toBe(199.99);
    expect(alertRepo.createOrUpdateAlert).toHaveBeenCalledWith('u-1', 'prod-1', 199.99);
  });

  it('should reject invalid target price', async () => {
    vi.spyOn(productRepo, 'findByIdWithInventory').mockResolvedValue({ id: 'prod-1', isActive: true });

    await expect(alertService.createAlert('u-1', 'prod-1', 0)).rejects.toThrow(
      /greater than 0/
    );
  });

  it('should delete a price alert', async () => {
    vi.spyOn(alertRepo, 'findAlertById').mockResolvedValue({ id: 'a-1', userId: 'u-1' });
    vi.spyOn(alertRepo, 'deleteAlert').mockResolvedValue({ count: 1 });
    vi.spyOn(alertRepo, 'findAlertsByUserId').mockResolvedValue([]);

    const res = await alertService.deleteAlert('u-1', 'a-1');
    expect(alertRepo.deleteAlert).toHaveBeenCalledWith('a-1', 'u-1');
    expect(res).toEqual([]);
  });
});
