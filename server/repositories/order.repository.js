const prisma = require('../utils/prisma');

const findOrderById = async (tx, id) => {
  const db = tx || prisma;
  return await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
      payment: true,
      statusHistory: {
        orderBy: { createdAt: 'asc' },
      },
      returns: {
        orderBy: { createdAt: 'desc' },
      },
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });
};

const findOrderByIdempotencyKey = async (tx, idempotencyKey) => {
  if (!idempotencyKey) return null;
  const db = tx || prisma;
  return await db.order.findUnique({
    where: { idempotencyKey },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payment: true,
    },
  });
};

const findOrdersByUserId = async (userId) => {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payment: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
      returns: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findOrdersByUserIdPaginated = async (userId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const [items, totalItems] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                brand: true,
                images: true,
              },
            },
          },
        },
        payment: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        returns: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: { userId } }),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    currentPage: page,
  };
};

const createOrder = async (tx, data) => {
  const db = tx || prisma;
  return await db.order.create({
    data,
    include: {
      items: true,
      payment: true,
      statusHistory: true,
    },
  });
};

const updateOrderStatus = async (tx, id, status) => {
  const db = tx || prisma;
  return await db.order.update({
    where: { id },
    data: { status },
  });
};

module.exports = {
  findOrderById,
  findOrderByIdempotencyKey,
  findOrdersByUserId,
  findOrdersByUserIdPaginated,
  createOrder,
  updateOrderStatus,
};
