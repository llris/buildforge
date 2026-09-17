const qaService = require('../services/qa.service');
const { sendSuccess } = require('../utils/response');

const createQuestion = async (req, res, next) => {
  try {
    const question = await qaService.createQuestion(req.user.id, req.params.id, req.body.question);
    return sendSuccess(res, question, 201);
  } catch (err) {
    next(err);
  }
};

const createAnswer = async (req, res, next) => {
  try {
    const answer = await qaService.createAnswer(req.user.id, req.params.id, req.body.answer);
    return sendSuccess(res, answer, 201);
  } catch (err) {
    next(err);
  }
};

const getProductQuestions = async (req, res, next) => {
  try {
    const questions = await qaService.getProductQuestions(req.params.id);
    return sendSuccess(res, questions);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createQuestion,
  createAnswer,
  getProductQuestions,
};
