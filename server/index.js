require('dotenv').config();
// 1. Validate Env Variables (Fails fast if missing)
const { env } = require('./config/env');

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const pinoHttp = require('pino-http');
const logger = require('./utils/logger');

// Routes and Middleware
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/AppError');

const app = express();
const PORT = env.PORT;

const cookieParser = require('cookie-parser');

// Middlewares
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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


