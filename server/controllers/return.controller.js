const returnService = require('../services/return.service');
const { sendSuccess } = require('../utils/response');

const createReturn = async (req, res, next) => {
  try {
    const returnReq = await returnService.createReturn(req.user.id, req.params.id, req.body);
    return sendSuccess(res, returnReq, 201);
  } catch (err) {
    next(err);
  }
};

const getUserReturns = async (req, res, next) => {
  try {
    const returns = await returnService.getUserReturns(req.user.id);
    return sendSuccess(res, returns);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReturn,
  getUserReturns,
};
