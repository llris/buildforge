const wishlistService = require('../services/wishlist.service');
const { sendSuccess } = require('../utils/response');

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user.id);
    return sendSuccess(res, wishlist);
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const wishlist = await wishlistService.addItem(req.user.id, productId);
    return sendSuccess(res, wishlist);
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wishlist = await wishlistService.removeItem(req.user.id, id);
    return sendSuccess(res, wishlist);
  } catch (error) {
    next(error);
  }
};

const moveToCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await wishlistService.moveToCart(req.user.id, id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addItem,
  removeItem,
  moveToCart,
};
