const prisma = require('../utils/prisma');
const {
  TERMS_VERSION,
  TERMS_EFFECTIVE_DATE,
  TERMS_CONTENT,
  DISCLAIMER_VERSION,
  DISCLAIMER_EFFECTIVE_DATE,
  DISCLAIMER_CONTENT,
  PRIVACY_VERSION,
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_CONTENT,
  COPYRIGHT_VERSION,
  COPYRIGHT_EFFECTIVE_DATE,
  COPYRIGHT_CONTENT,
} = require('../config/legalTerms');
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
 * Returns current active disclaimer with version and metadata.
 */
const getDisclaimer = () => {
  return {
    version: DISCLAIMER_VERSION,
    effectiveDate: DISCLAIMER_EFFECTIVE_DATE,
    content: DISCLAIMER_CONTENT,
  };
};

/**
 * Returns current active privacy policy with version and metadata.
 */
const getPrivacy = () => {
  return {
    version: PRIVACY_VERSION,
    effectiveDate: PRIVACY_EFFECTIVE_DATE,
    content: PRIVACY_CONTENT,
  };
};

/**
 * Returns current active copyright notice with version and metadata.
 */
const getCopyright = () => {
  return {
    version: COPYRIGHT_VERSION,
    effectiveDate: COPYRIGHT_EFFECTIVE_DATE,
    content: COPYRIGHT_CONTENT,
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
  getDisclaimer,
  getPrivacy,
  getCopyright,
  acceptTerms,
};
