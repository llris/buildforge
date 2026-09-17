const legalService = require('../services/legal.service');
const { sendSuccess } = require('../utils/response');

const getTerms = async (req, res, next) => {
  try {
    const terms = legalService.getTerms();
    return sendSuccess(res, terms);
  } catch (error) {
    next(error);
  }
};

const acceptTerms = async (req, res, next) => {
  try {
    const user = await legalService.acceptTerms(req.user.id);
    return sendSuccess(res, { user, message: 'Terms and Conditions accepted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTerms,
  acceptTerms,
};
