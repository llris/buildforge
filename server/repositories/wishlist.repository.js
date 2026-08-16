const prisma = require('../utils/prisma');

const findWishlistByUserId = async (userId) => {
  return await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              inventory: true,
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
};

const findOrCreateWishlist = async (userId) => {
  let wishlist = await findWishlistByUserId(userId);
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
    });
  }
  return wishlist;
};

const findWishlistItem = async (wishlistId, productId) => {
  return await prisma.wishlistItem.findFirst({
    where: { wishlistId, productId },
  });
};

const findWishlistItemById = async (itemId) => {
  return await prisma.wishlistItem.findUnique({
    where: { id: itemId },
    include: {
      wishlist: true,
      product: {
        include: {
          inventory: true,
        },
      },
    },
  });
};

const createWishlistItem = async (wishlistId, productId) => {
  return await prisma.wishlistItem.upsert({
    where: {
      wishlistId_productId: {
        wishlistId,
        productId,
      },
    },
    update: {},
    create: {
      wishlistId,
      productId,
    },
    include: {
      product: {
        include: {
          inventory: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });
};

const deleteWishlistItem = async (itemId) => {
  return await prisma.wishlistItem.delete({
    where: { id: itemId },
  });
};

const deleteWishlistItemByProduct = async (wishlistId, productId) => {
  return await prisma.wishlistItem.deleteMany({
    where: { wishlistId, productId },
  });
};

module.exports = {
  findWishlistByUserId,
  findOrCreateWishlist,
  findWishlistItem,
  findWishlistItemById,
  createWishlistItem,
  deleteWishlistItem,
  deleteWishlistItemByProduct,
};
