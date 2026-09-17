const prisma = require('../utils/prisma');

const findCartByUserId = async (userId, tx = null) => {
  const db = tx || prisma;
  return await db.cart.findUnique({
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
        orderBy: { createdAt: 'asc' },
      },
    },
  });
};

const findOrCreateCart = async (userId, tx = null) => {
  const db = tx || prisma;
  let cart = await findCartByUserId(userId, db);
  if (!cart) {
    cart = await db.cart.create({
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
  return cart;
};

const findCartItem = async (cartId, productId, tx = null) => {
  const db = tx || prisma;
  return await db.cartItem.findFirst({
    where: { cartId, productId },
    include: {
      product: {
        include: {
          inventory: true,
        },
      },
    },
  });
};

const findCartItemById = async (itemId, tx = null) => {
  const db = tx || prisma;
  return await db.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: true,
      product: {
        include: {
          inventory: true,
        },
      },
    },
  });
};

const createCartItem = async (cartId, productId, qty, tx = null) => {
  const db = tx || prisma;
  return await db.cartItem.create({
    data: {
      cartId,
      productId,
      qty,
    },
    include: {
      product: {
        include: {
          inventory: true,
        },
      },
    },
  });
};

const updateCartItemQty = async (itemId, qty, tx = null) => {
  const db = tx || prisma;
  return await db.cartItem.update({
    where: { id: itemId },
    data: { qty },
    include: {
      product: {
        include: {
          inventory: true,
        },
      },
    },
  });
};

const deleteCartItem = async (itemId, tx = null) => {
  const db = tx || prisma;
  return await db.cartItem.delete({
    where: { id: itemId },
  });
};

const clearCart = async (cartIdOrUserId, tx = null) => {
  const db = tx || prisma;
  return await db.cartItem.deleteMany({
    where: {
      OR: [{ cartId: cartIdOrUserId }, { cart: { userId: cartIdOrUserId } }],
    },
  });
};

module.exports = {
  findCartByUserId,
  findOrCreateCart,
  findCartItem,
  findCartItemById,
  createCartItem,
  updateCartItemQty,
  deleteCartItem,
  clearCart,
};
