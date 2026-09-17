require('dotenv').config();
// 1. Validate Env Variables (Fails fast if missing)
const { env } = require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const pinoHttp = require('pino-http');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');

// Routes and Middleware
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/AppError');

const app = express();
const PORT = env.PORT;

const allowedOrigins = env.CLIENT_URL
  ? env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

// Security Headers with Razorpay CSP allowance
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com"],
        frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
        connectSrc: [
          "'self'",
          "https://api.razorpay.com",
          "https://lumberjack.razorpay.com",
          "https://checkout.razorpay.com",
          ...allowedOrigins,
        ],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS Allowlist
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin "${origin}" not allowed by BuildForge policy`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Global API rate limiter (skips during tests)
app.use('/api/', apiLimiter);

// Structured Request Logging
app.use(
  pinoHttp({
    logger,
    genReqId: function (req, res) {
      return req.headers['x-request-id'] || crypto.randomUUID();
    },
  })
);

// Mount API v1 Routes
app.use('/api/v1', routes);

// Handle unknown routes
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;
