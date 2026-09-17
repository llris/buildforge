const prisma = require('../utils/prisma');
const { NotFoundError, ValidationError } = require('../utils/AppError');
const reviewRepo = require('../repositories/review.repository');
const auditService = require('./audit.service');

// ==========================================
// REVIEWS MODERATION
// ==========================================
const getReviews = async ({ page = 1, limit = 20, status, search = '' }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (status === 'approved') where.isApproved = true;
  if (status === 'hidden') where.isApproved = false;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { comment: { contains: search, mode: 'insensitive' } },
      { product: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true, images: true } },
      },
    }),
  ]);

  return {
    reviews,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const toggleReviewApproval = async (actorId, reviewId, isApproved) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new NotFoundError(`Review with ID "${reviewId}" not found`);
  }

  const updatedReview = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id: reviewId },
      data: { isApproved },
    });

    await auditService.recordAuditLog({
      actorId,
      action: isApproved ? 'APPROVE_REVIEW' : 'HIDE_REVIEW',
      entityType: 'Review',
      entityId: reviewId,
      before: { isApproved: review.isApproved },
      after: { isApproved },
      tx,
    });

    return updated;
  });

  await reviewRepo.aggregateProductRatings(review.productId);
  return updatedReview;
};

const deleteReview = async (actorId, reviewId) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    throw new NotFoundError(`Review with ID "${reviewId}" not found`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: reviewId } });

    await auditService.recordAuditLog({
      actorId,
      action: 'DELETE_REVIEW',
      entityType: 'Review',
      entityId: reviewId,
      before: review,
      after: null,
      tx,
    });
  });

  await reviewRepo.aggregateProductRatings(review.productId);
  return { message: 'Review deleted successfully' };
};

// ==========================================
// Q&A MODERATION
// ==========================================
const getQA = async ({ page = 1, limit = 20, search = '' }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (search) {
    where.OR = [
      { question: { contains: search, mode: 'insensitive' } },
      { product: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, questions] = await Promise.all([
    prisma.productQuestion.count({ where }),
    prisma.productQuestion.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        product: { select: { id: true, name: true, slug: true, images: true } },
        answers: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
  ]);

  return {
    questions,
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

const toggleQuestionApproval = async (actorId, questionId, isApproved) => {
  const question = await prisma.productQuestion.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new NotFoundError(`Question with ID "${questionId}" not found`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.productQuestion.update({
      where: { id: questionId },
      data: { isApproved },
    });

    await auditService.recordAuditLog({
      actorId,
      action: isApproved ? 'APPROVE_QUESTION' : 'HIDE_QUESTION',
      entityType: 'ProductQuestion',
      entityId: questionId,
      before: { isApproved: question.isApproved },
      after: { isApproved },
      tx,
    });

    return res;
  });

  return updated;
};

const deleteQuestion = async (actorId, questionId) => {
  const question = await prisma.productQuestion.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new NotFoundError(`Question with ID "${questionId}" not found`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.productQuestion.delete({ where: { id: questionId } });

    await auditService.recordAuditLog({
      actorId,
      action: 'DELETE_QUESTION',
      entityType: 'ProductQuestion',
      entityId: questionId,
      before: question,
      after: null,
      tx,
    });
  });

  return { message: 'Question deleted successfully' };
};

const adminAnswerQuestion = async (actorId, questionId, { content }) => {
  if (!content || !content.trim()) {
    throw new ValidationError('Answer content is required');
  }

  const question = await prisma.productQuestion.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new NotFoundError(`Question with ID "${questionId}" not found`);
  }

  const answer = await prisma.$transaction(async (tx) => {
    const newAnswer = await tx.productAnswer.create({
      data: {
        questionId,
        userId: actorId,
        answer: content.trim(),
        isApproved: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await auditService.recordAuditLog({
      actorId,
      action: 'ADMIN_ANSWER_QUESTION',
      entityType: 'ProductAnswer',
      entityId: newAnswer.id,
      before: null,
      after: newAnswer,
      tx,
    });

    return newAnswer;
  });

  return answer;
};

const toggleAnswerApproval = async (actorId, answerId, isApproved) => {
  const answer = await prisma.productAnswer.findUnique({ where: { id: answerId } });
  if (!answer) {
    throw new NotFoundError(`Answer with ID "${answerId}" not found`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.productAnswer.update({
      where: { id: answerId },
      data: { isApproved },
    });

    await auditService.recordAuditLog({
      actorId,
      action: isApproved ? 'APPROVE_ANSWER' : 'HIDE_ANSWER',
      entityType: 'ProductAnswer',
      entityId: answerId,
      before: { isApproved: answer.isApproved },
      after: { isApproved },
      tx,
    });

    return res;
  });

  return updated;
};

const deleteAnswer = async (actorId, answerId) => {
  const answer = await prisma.productAnswer.findUnique({ where: { id: answerId } });
  if (!answer) {
    throw new NotFoundError(`Answer with ID "${answerId}" not found`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.productAnswer.delete({ where: { id: answerId } });

    await auditService.recordAuditLog({
      actorId,
      action: 'DELETE_ANSWER',
      entityType: 'ProductAnswer',
      entityId: answerId,
      before: answer,
      after: null,
      tx,
    });
  });

  return { message: 'Answer deleted successfully' };
};

module.exports = {
  getReviews,
  toggleReviewApproval,
  deleteReview,
  getQA,
  toggleQuestionApproval,
  deleteQuestion,
  adminAnswerQuestion,
  toggleAnswerApproval,
  deleteAnswer,
};
