const wishlistRepo = require('../repositories/wishlist.repository');
const alertRepo = require('../repositories/alert.repository');
const productRepo = require('../repositories/product.repository');
const cartService = require('./cart.service');
const { NotFoundError } = require('../utils/AppError');

const formatWishlist = (wishlist, alerts = []) => {
  const alertMap = new Map();
  alerts.forEach((alert) => {
    alertMap.set(alert.productId, {
      id: alert.id,
      targetPrice: alert.targetPrice,
      createdAt: alert.createdAt,
    });
  });

  const items = (wishlist.items || []).map((item) => {
    const stockQty = item.product.inventory?.stockQty || 0;
    const reservedQty = item.product.inventory?.reservedQty || 0;
    const availableStock = Math.max(0, stockQty - reservedQty);
    const activeAlert = alertMap.get(item.productId) || null;

    return {
      id: item.id,
      productId: item.productId,
      availableStock,
      isOutOfStock: availableStock <= 0,
      hasPriceAlert: !!activeAlert,
      priceAlert: activeAlert,
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

  return {
    id: wishlist.id,
    userId: wishlist.userId,
    items,
    itemCount: items.length,
    createdAt: wishlist.createdAt,
    updatedAt: wishlist.updatedAt,
  };
};

const getWishlist = async (userId) => {
  const wishlist = await wishlistRepo.findOrCreateWishlist(userId);
  const alerts = await alertRepo.findAlertsByUserId(userId);
  return formatWishlist(wishlist, alerts);
};

const addItem = async (userId, productId) => {
  const product = await productRepo.findByIdWithInventory(productId);

  if (!product || !product.isActive) {
    throw new NotFoundError('Product not found or is inactive');
  }

  const wishlist = await wishlistRepo.findOrCreateWishlist(userId);
  const existing = await wishlistRepo.findWishlistItem(wishlist.id, productId);

  if (!existing) {
    await wishlistRepo.createWishlistItem(wishlist.id, productId);
  }

  return await getWishlist(userId);
};

const removeItem = async (userId, itemId) => {
  const wishlist = await wishlistRepo.findOrCreateWishlist(userId);
  
  // Could be wishlistItem.id or product.id
  const itemById = await wishlistRepo.findWishlistItemById(itemId);
  if (itemById && itemById.wishlistId === wishlist.id) {
    await wishlistRepo.deleteWishlistItem(itemId);
  } else {
    // Attempt deletion by productId
    await wishlistRepo.deleteWishlistItemByProduct(wishlist.id, itemId);
  }

  return await getWishlist(userId);
};

const moveToCart = async (userId, itemId) => {
  const item = await wishlistRepo.findWishlistItemById(itemId);
  if (!item || item.wishlist.userId !== userId) {
    throw new NotFoundError('Wishlist item not found');
  }

  const updatedCart = await cartService.addItem(userId, item.productId, 1);
  await wishlistRepo.deleteWishlistItem(itemId);
  const updatedWishlist = await getWishlist(userId);

  return {
    cart: updatedCart,
    wishlist: updatedWishlist,
  };
};

module.exports = {
  formatWishlist,
  getWishlist,
  addItem,
  removeItem,
  moveToCart,
};
