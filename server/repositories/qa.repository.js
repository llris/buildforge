const prisma = require('../utils/prisma');

const createQuestion = async (data) => {
  return await prisma.productQuestion.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      answers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });
};

const findQuestionById = async (id) => {
  return await prisma.productQuestion.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      answers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

const findQuestionsByProductId = async (productId) => {
  return await prisma.productQuestion.findMany({
    where: { productId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
      answers: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const createAnswer = async (data) => {
  return await prisma.productAnswer.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
};

module.exports = {
  createQuestion,
  findQuestionById,
  findQuestionsByProductId,
  createAnswer,
};
