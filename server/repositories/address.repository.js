const prisma = require('../utils/prisma');

const findAddressesByUserId = async (userId) => {
  return await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
};

const findAddressById = async (id) => {
  return await prisma.address.findUnique({
    where: { id },
  });
};

const createAddress = async (data) => {
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: data.userId },
      data: { isDefault: false },
    });
  } else {
    // If user has no existing addresses, make this the default
    const count = await prisma.address.count({ where: { userId: data.userId } });
    if (count === 0) {
      data.isDefault = true;
    }
  }

  return await prisma.address.create({
    data,
  });
};

const deleteAddress = async (id, userId) => {
  return await prisma.address.delete({
    where: { id, userId },
  });
};

const setDefaultAddress = async (id, userId) => {
  await prisma.address.updateMany({
    where: { userId },
    data: { isDefault: false },
  });

  return await prisma.address.update({
    where: { id, userId },
    data: { isDefault: true },
  });
};

const updateAddress = async (id, userId, data) => {
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  return await prisma.address.update({
    where: { id, userId },
    data,
  });
};

module.exports = {
  findAddressesByUserId,
  findAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
