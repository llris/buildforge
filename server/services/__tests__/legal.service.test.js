import { describe, it, expect, vi, beforeEach } from 'vitest';

const legalService = require('../legal.service');
const prisma = require('../../utils/prisma');
const { TERMS_VERSION, TERMS_EFFECTIVE_DATE } = require('../../config/legalTerms');

describe('Legal Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTerms', () => {
    it('returns current version, effective date, and terms content', () => {
      const terms = legalService.getTerms();
      expect(terms).toHaveProperty('version', TERMS_VERSION);
      expect(terms).toHaveProperty('effectiveDate', TERMS_EFFECTIVE_DATE);
      expect(terms).toHaveProperty('content');
      expect(typeof terms.content).toBe('string');
      expect(terms.content).toContain('Terms and Conditions');
    });
  });

  describe('acceptTerms', () => {
    it('updates user termsAcceptedAt and termsVersion in database', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'CUSTOMER',
        isEmailVerified: true,
        isActive: true,
      };

      const mockUpdated = {
        ...mockUser,
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
      };

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      vi.spyOn(prisma.user, 'update').mockResolvedValue(mockUpdated);

      const result = await legalService.acceptTerms('user-123');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            termsVersion: TERMS_VERSION,
          }),
        })
      );
      expect(result.termsVersion).toBe(TERMS_VERSION);
      expect(result.termsAcceptedAt).toBeDefined();
    });

    it('throws NotFoundError if user does not exist', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(legalService.acceptTerms('nonexistent-id')).rejects.toThrow(
        /User not found/
      );
    });
  });
});
