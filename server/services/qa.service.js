const prisma = require('../utils/prisma');
const qaRepo = require('../repositories/qa.repository');
const { NotFoundError } = require('../utils/AppError');

const createQuestion = async (userId, productId, question) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new NotFoundError(`Product ${productId} not found`);
  }

  return await qaRepo.createQuestion({
    userId,
    productId,
    question,
  });
};

const createAnswer = async (userId, questionId, answer) => {
  const question = await qaRepo.findQuestionById(questionId);
  if (!question) {
    throw new NotFoundError(`Question ${questionId} not found`);
  }

  return await qaRepo.createAnswer({
    userId,
    questionId,
    answer,
  });
};

const getProductQuestions = async (productId) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new NotFoundError(`Product ${productId} not found`);
  }

  return await qaRepo.findQuestionsByProductId(productId);
};

module.exports = {
  createQuestion,
  createAnswer,
  getProductQuestions,
};
