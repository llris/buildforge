const rateLimit = require('express-rate-limit');

// Rate limiter for authentication sensitive routes (login, register, forgot-password, reset-password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts from this IP, please try again in 15 minutes',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

// Rate limiter for order placement & checkout endpoints
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      message: 'Order creation rate limit exceeded. Please try again shortly.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP. Please slow down.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

module.exports = {
  authLimiter,
  orderLimiter,
  apiLimiter,
};
