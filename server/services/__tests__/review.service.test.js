import { describe, it, expect, vi, beforeEach } from 'vitest';

const reviewService = require('../review.service');
const reviewRepo = require('../../repositories/review.repository');
const prisma = require('../../utils/prisma');

describe('Review Service', () => {
  const userId = 'user-123';
  const productId = 'prod-456';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createReview', () => {
    it('rejects review when user has no DELIVERED order for the product', async () => {
      vi.spyOn(prisma.product, 'findUnique').mockResolvedValue({ id: productId, name: 'GPU RTX 4070' });
      vi.spyOn(prisma.orderItem, 'findFirst').mockResolvedValue(null); // Not purchased / delivered

      await expect(
        reviewService.createReview(userId, productId, { rating: 5, title: 'Amazing', comment: 'Super fast' })
      ).rejects.toThrow(/Only verified buyers with a delivered order can review/i);
    });

    it('creates review and recomputes product ratings when user has a DELIVERED order', async () => {
      vi.spyOn(prisma.product, 'findUnique').mockResolvedValue({ id: productId, name: 'GPU RTX 4070' });
      vi.spyOn(prisma.orderItem, 'findFirst').mockResolvedValue({ id: 'order-item-1', productId });
      vi.spyOn(reviewRepo, 'findUserReviewForProduct').mockResolvedValue(null);
      vi.spyOn(reviewRepo, 'createReview').mockResolvedValue({
        id: 'rev-1',
        userId,
        productId,
        rating: 5,
        title: 'Great GPU',
        comment: 'Runs cool',
        isVerifiedPurchase: true,
      });
      const aggSpy = vi.spyOn(reviewRepo, 'aggregateProductRatings').mockResolvedValue({ avgRating: 5, ratingCount: 1 });

      const review = await reviewService.createReview(userId, productId, {
        rating: 5,
        title: 'Great GPU',
        comment: 'Runs cool',
      });

      expect(review.id).toBe('rev-1');
      expect(review.isVerifiedPurchase).toBe(true);
      expect(aggSpy).toHaveBeenCalledWith(productId);
    });

    it('rejects duplicate review if user already reviewed this product', async () => {
      vi.spyOn(prisma.product, 'findUnique').mockResolvedValue({ id: productId, name: 'GPU RTX 4070' });
      vi.spyOn(prisma.orderItem, 'findFirst').mockResolvedValue({ id: 'order-item-1', productId });
      vi.spyOn(reviewRepo, 'findUserReviewForProduct').mockResolvedValue({ id: 'existing-rev-1' });

      await expect(
        reviewService.createReview(userId, productId, { rating: 4, title: 'Second review' })
      ).rejects.toThrow(/already submitted a review/i);
    });
  });

  describe('updateReview and deleteReview', () => {
    it('updates review and recomputes ratings', async () => {
      vi.spyOn(reviewRepo, 'findReviewById').mockResolvedValue({
        id: 'rev-1',
        userId,
        productId,
        rating: 4,
      });
      vi.spyOn(reviewRepo, 'updateReview').mockResolvedValue({
        id: 'rev-1',
        userId,
        productId,
        rating: 5,
        title: 'Updated title',
      });
      const aggSpy = vi.spyOn(reviewRepo, 'aggregateProductRatings').mockResolvedValue({ avgRating: 5, ratingCount: 1 });

      const updated = await reviewService.updateReview(userId, 'rev-1', { rating: 5, title: 'Updated title' });

      expect(updated.rating).toBe(5);
      expect(aggSpy).toHaveBeenCalledWith(productId);
    });

    it('deletes review and recomputes ratings', async () => {
      vi.spyOn(reviewRepo, 'findReviewById').mockResolvedValue({
        id: 'rev-1',
        userId,
        productId,
      });
      vi.spyOn(reviewRepo, 'deleteReview').mockResolvedValue({ id: 'rev-1' });
      const aggSpy = vi.spyOn(reviewRepo, 'aggregateProductRatings').mockResolvedValue({ avgRating: 0, ratingCount: 0 });

      const res = await reviewService.deleteReview(userId, 'rev-1');

      expect(res.message).toContain('deleted successfully');
      expect(aggSpy).toHaveBeenCalledWith(productId);
    });
  });
});
