const prisma = require('../utils/prisma');

const findAll = async () => {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
};

module.exports = {
  findAll,
};
