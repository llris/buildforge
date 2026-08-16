const cartService = require('../services/cart.service');
const { sendSuccess } = require('../utils/response');

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    const cart = await cartService.addItem(req.user.id, productId, qty);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { qty } = req.body;
    const cart = await cartService.updateItemQty(req.user.id, id, qty);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cart = await cartService.removeItem(req.user.id, id);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.id);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const mergeCart = async (req, res, next) => {
  try {
    const { items } = req.body;
    const cart = await cartService.mergeCart(req.user.id, items);
    return sendSuccess(res, cart);
  } catch (error) {
    next(error);
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    let finalSubtotal = subtotal;

    // If subtotal is not passed and user is logged in, calculate from user's cart
    if (finalSubtotal === undefined && req.user) {
      const cart = await cartService.getCart(req.user.id);
      finalSubtotal = cart.subtotal;
    }

    const result = await cartService.applyCoupon(code, finalSubtotal || 0);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCart,
  applyCoupon,
};
