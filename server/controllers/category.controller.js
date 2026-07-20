const categoryService = require('../services/category.service');
const { sendSuccess } = require('../utils/response');

const getCategories = async (req, res, next) => {
  try {
    const tree = await categoryService.getCategoriesTree();
    sendSuccess(res, tree);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCategories,
};
