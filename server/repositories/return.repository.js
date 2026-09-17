const prisma = require('../utils/prisma');

const createReturn = async (data) => {
  return await prisma.return.create({
    data,
    include: {
      order: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
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
        },
      },
    },
  });
};

const findReturnsByUserId = async (userId) => {
  return await prisma.return.findMany({
    where: {
      order: {
        userId,
      },
    },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
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
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const findReturnById = async (id) => {
  return await prisma.return.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });
};

const findReturnsByOrderId = async (orderId) => {
  return await prisma.return.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  createReturn,
  findReturnsByUserId,
  findReturnById,
  findReturnsByOrderId,
};
