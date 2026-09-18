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

const getDisclaimer = async (req, res, next) => {
  try {
    const disclaimer = legalService.getDisclaimer();
    return sendSuccess(res, disclaimer);
  } catch (error) {
    next(error);
  }
};

const getPrivacy = async (req, res, next) => {
  try {
    const privacy = legalService.getPrivacy();
    return sendSuccess(res, privacy);
  } catch (error) {
    next(error);
  }
};

const getCopyright = async (req, res, next) => {
  try {
    const copyright = legalService.getCopyright();
    return sendSuccess(res, copyright);
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
  getDisclaimer,
  getPrivacy,
  getCopyright,
  acceptTerms,
};
