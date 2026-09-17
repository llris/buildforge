import { describe, it, expect, vi, beforeEach } from 'vitest';

const qaService = require('../qa.service');
const qaRepo = require('../../repositories/qa.repository');
const prisma = require('../../utils/prisma');

describe('QA Service', () => {
  const userId = 'user-123';
  const productId = 'prod-456';
  const questionId = 'q-789';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createQuestion', () => {
    it('creates a question for existing product', async () => {
      vi.spyOn(prisma.product, 'findUnique').mockResolvedValue({ id: productId });
      vi.spyOn(qaRepo, 'createQuestion').mockResolvedValue({
        id: questionId,
        userId,
        productId,
        question: 'Does this support DDR5?',
      });

      const q = await qaService.createQuestion(userId, productId, 'Does this support DDR5?');
      expect(q.id).toBe(questionId);
      expect(q.question).toBe('Does this support DDR5?');
    });

    it('throws NotFoundError if product does not exist', async () => {
      vi.spyOn(prisma.product, 'findUnique').mockResolvedValue(null);

      await expect(
        qaService.createQuestion(userId, 'nonexistent', 'Does this support DDR5?')
      ).rejects.toThrow(/Product nonexistent not found/i);
    });
  });

  describe('createAnswer', () => {
    it('creates an answer for existing question', async () => {
      vi.spyOn(qaRepo, 'findQuestionById').mockResolvedValue({ id: questionId });
      vi.spyOn(qaRepo, 'createAnswer').mockResolvedValue({
        id: 'ans-1',
        questionId,
        userId,
        answer: 'Yes, up to 6000MHz.',
      });

      const ans = await qaService.createAnswer(userId, questionId, 'Yes, up to 6000MHz.');
      expect(ans.id).toBe('ans-1');
      expect(ans.answer).toBe('Yes, up to 6000MHz.');
    });

    it('throws NotFoundError if question does not exist', async () => {
      vi.spyOn(qaRepo, 'findQuestionById').mockResolvedValue(null);

      await expect(
        qaService.createAnswer(userId, 'nonexistent', 'Yes')
      ).rejects.toThrow(/Question nonexistent not found/i);
    });
  });
});
