const prisma = require('../utils/prisma');

const findByCode = async (code) => {
  return await prisma.coupon.findFirst({
    where: {
      code: {
        equals: code,
        mode: 'insensitive',
      },
    },
  });
};

const updateUsedCount = async (id) => {
  return await prisma.coupon.update({
    where: { id },
    data: {
      usedCount: {
        increment: 1,
      },
    },
  });
};

module.exports = {
  findByCode,
  updateUsedCount,
};
