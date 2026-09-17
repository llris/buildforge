const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qa.controller');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createAnswerSchema } = require('../validations/qa.validation');

// Answer a question: POST /api/v1/questions/:id/answers
router.post('/:id/answers', requireAuth, validate(createAnswerSchema), qaController.createAnswer);

module.exports = router;
