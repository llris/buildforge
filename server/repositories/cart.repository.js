const prisma = require('../utils/prisma');

const findCartByUserId = async (userId) => {
  return await prisma.cart.findUnique({
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

const findOrCreateCart = async (userId) => {
  let cart = await findCartByUserId(userId);
  if (!cart) {
    cart = await prisma.cart.create({
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

const findCartItem = async (cartId, productId) => {
  return await prisma.cartItem.findFirst({
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

const findCartItemById = async (itemId) => {
  return await prisma.cartItem.findUnique({
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

const createCartItem = async (cartId, productId, qty) => {
  return await prisma.cartItem.create({
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

const updateCartItemQty = async (itemId, qty) => {
  return await prisma.cartItem.update({
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

const deleteCartItem = async (itemId) => {
  return await prisma.cartItem.delete({
    where: { id: itemId },
  });
};

const clearCart = async (cartId) => {
  return await prisma.cartItem.deleteMany({
    where: { cartId },
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
