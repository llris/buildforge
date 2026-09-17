import { describe, it, expect, vi, beforeEach } from 'vitest';

const authService = require('../auth.service');
const prisma = require('../../utils/prisma');
const mailService = require('../mail');
const { TERMS_VERSION } = require('../../config/legalTerms');

describe('Auth Service - Registration & Terms Acceptance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('throws ValidationError if acceptedTerms is missing or false', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123!',
          acceptedTerms: false,
        })
      ).rejects.toThrow(/You must accept the Terms and Conditions/);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow(/You must accept the Terms and Conditions/);
    });

    it('creates user with termsAcceptedAt and termsVersion when acceptedTerms is true', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      
      const mockCreatedUser = {
        id: 'new-user-1',
        email: 'test@example.com',
        role: 'CUSTOMER',
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
      };

      vi.spyOn(prisma.user, 'create').mockResolvedValue(mockCreatedUser);
      vi.spyOn(prisma.refreshToken, 'create').mockResolvedValue({ id: 'rt-1' });
      vi.spyOn(mailService, 'sendMail').mockResolvedValue({});

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        acceptedTerms: true,
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@example.com',
            termsVersion: TERMS_VERSION,
            termsAcceptedAt: expect.any(Date),
          }),
        })
      );

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});
