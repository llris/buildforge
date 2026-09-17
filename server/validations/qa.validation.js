const { z } = require('zod');

const createQuestionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    question: z.string().min(5, 'Question must be at least 5 characters').max(1000, 'Question cannot exceed 1000 characters'),
  }),
});

const createAnswerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid question ID'),
  }),
  body: z.object({
    answer: z.string().min(2, 'Answer must be at least 2 characters').max(2000, 'Answer cannot exceed 2000 characters'),
  }),
});

const questionIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid question ID'),
  }),
});

module.exports = {
  createQuestionSchema,
  createAnswerSchema,
  questionIdParamSchema,
};
