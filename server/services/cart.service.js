const cartRepo = require('../repositories/cart.repository');
const couponRepo = require('../repositories/coupon.repository');
const productRepo = require('../repositories/product.repository');
const { ValidationError, NotFoundError } = require('../utils/AppError');

const formatCart = (cart) => {
  const items = (cart.items || []).map((item) => {
    const unitPrice = item.product.discountPrice ?? item.product.price;
    const lineTotal = Number((unitPrice * item.qty).toFixed(2));
    const stockQty = item.product.inventory?.stockQty || 0;
    const reservedQty = item.product.inventory?.reservedQty || 0;
    const availableStock = Math.max(0, stockQty - reservedQty);

    return {
      id: item.id,
      productId: item.productId,
      qty: item.qty,
      unitPrice,
      originalPrice: item.product.price,
      discountPrice: item.product.discountPrice,
      lineTotal,
      availableStock,
      isOutOfStock: availableStock <= 0,
      isLowStock: availableStock > 0 && availableStock <= (item.product.inventory?.lowStockThreshold || 5),
      product: {
        id: item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        slug: item.product.slug,
        price: item.product.price,
        discountPrice: item.product.discountPrice,
        images: item.product.images || [],
        specs: item.product.specs,
        category: item.product.category,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    subtotal,
    itemCount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

const getCart = async (userId) => {
  const cart = await cartRepo.findOrCreateCart(userId);
  return formatCart(cart);
};

const addItem = async (userId, productId, qty = 1) => {
  const product = await productRepo.findByIdWithInventory(productId);

  if (!product || !product.isActive) {
    throw new NotFoundError('Product not found or is no longer available');
  }

  const stockQty = product.inventory?.stockQty || 0;
  const reservedQty = product.inventory?.reservedQty || 0;
  const availableStock = Math.max(0, stockQty - reservedQty);

  if (availableStock <= 0) {
    throw new ValidationError(`"${product.name}" is currently out of stock`);
  }

  const cart = await cartRepo.findOrCreateCart(userId);
  const existingItem = await cartRepo.findCartItem(cart.id, productId);

  const existingQty = existingItem ? existingItem.qty : 0;
  const targetQty = existingQty + qty;

  if (targetQty > availableStock) {
    throw new ValidationError(
      `Cannot add ${qty} item(s). Only ${availableStock} available in stock${
        existingQty > 0 ? ` (${existingQty} already in your cart)` : ''
      }.`
    );
  }

  if (existingItem) {
    await cartRepo.updateCartItemQty(existingItem.id, targetQty);
  } else {
    await cartRepo.createCartItem(cart.id, productId, qty);
  }

  return await getCart(userId);
};

const updateItemQty = async (userId, itemId, qty) => {
  const item = await cartRepo.findCartItemById(itemId);
  if (!item || item.cart.userId !== userId) {
    throw new NotFoundError('Cart item not found');
  }

  const stockQty = item.product.inventory?.stockQty || 0;
  const reservedQty = item.product.inventory?.reservedQty || 0;
  const availableStock = Math.max(0, stockQty - reservedQty);

  if (qty > availableStock) {
    throw new ValidationError(
      `Cannot set quantity to ${qty}. Only ${availableStock} available in stock.`
    );
  }

  await cartRepo.updateCartItemQty(itemId, qty);
  return await getCart(userId);
};

const removeItem = async (userId, itemId) => {
  const item = await cartRepo.findCartItemById(itemId);
  if (!item || item.cart.userId !== userId) {
    throw new NotFoundError('Cart item not found');
  }

  await cartRepo.deleteCartItem(itemId);
  return await getCart(userId);
};

const clearCart = async (userId) => {
  const cart = await cartRepo.findOrCreateCart(userId);
  await cartRepo.clearCart(cart.id);
  return await getCart(userId);
};

const mergeCart = async (userId, guestItems = []) => {
  const cart = await cartRepo.findOrCreateCart(userId);

  for (const guestItem of guestItems) {
    if (!guestItem.productId || !guestItem.qty || guestItem.qty < 1) continue;

    const product = await productRepo.findByIdWithInventory(guestItem.productId);

    if (!product || !product.isActive) continue;

    const stockQty = product.inventory?.stockQty || 0;
    const reservedQty = product.inventory?.reservedQty || 0;
    const availableStock = Math.max(0, stockQty - reservedQty);

    if (availableStock <= 0) continue;

    const existing = await cartRepo.findCartItem(cart.id, guestItem.productId);
    const combinedQty = (existing ? existing.qty : 0) + guestItem.qty;
    const finalQty = Math.min(combinedQty, availableStock);

    if (existing) {
      await cartRepo.updateCartItemQty(existing.id, finalQty);
    } else {
      await cartRepo.createCartItem(cart.id, guestItem.productId, finalQty);
    }
  }

  return await getCart(userId);
};

const applyCoupon = async (code, subtotal = 0) => {
  if (!code || typeof code !== 'string') {
    throw new ValidationError('Coupon code is required');
  }

  const coupon = await couponRepo.findByCode(code.trim());

  if (!coupon || !coupon.isActive) {
    throw new ValidationError('Invalid or inactive coupon code');
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    throw new ValidationError('This coupon has expired');
  }

  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new ValidationError('This coupon has reached its maximum usage limit');
  }

  const minOrder = coupon.minOrderAmount || 0;
  if (subtotal < minOrder) {
    throw new ValidationError(
      `Order subtotal of $${subtotal.toFixed(2)} does not meet the minimum requirement of $${minOrder.toFixed(
        2
      )} for this coupon`
    );
  }

  let discountAmount = Number(((subtotal * coupon.discountPercent) / 100).toFixed(2));
  if (coupon.maxDiscount != null && discountAmount > coupon.maxDiscount) {
    discountAmount = coupon.maxDiscount;
  }

  const newTotal = Number(Math.max(0, subtotal - discountAmount).toFixed(2));

  return {
    valid: true,
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    discountAmount,
    newTotal,
  };
};

module.exports = {
  formatCart,
  getCart,
  addItem,
  updateItemQty,
  removeItem,
  clearCart,
  mergeCart,
  applyCoupon,
};
