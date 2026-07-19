const { z } = require('zod');
const { ValidationError } = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || error.errors || [];
      const details = issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      next(new ValidationError('Validation failed', details));
    } else {
      next(error);
    }
  }
};

module.exports = validate;
