const prisma = require('../utils/prisma');
const { TERMS_VERSION, TERMS_EFFECTIVE_DATE, TERMS_CONTENT } = require('../config/legalTerms');
const { NotFoundError } = require('../utils/AppError');

/**
 * Returns current active terms and conditions with version and metadata.
 */
const getTerms = () => {
  return {
    version: TERMS_VERSION,
    effectiveDate: TERMS_EFFECTIVE_DATE,
    content: TERMS_CONTENT,
  };
};

/**
 * Records terms acceptance for an authenticated user.
 * Idempotent: sets termsAcceptedAt = now and termsVersion = current version.
 */
const acceptTerms = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isEmailVerified: true,
      isActive: true,
      termsAcceptedAt: true,
      termsVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

module.exports = {
  getTerms,
  acceptTerms,
};
