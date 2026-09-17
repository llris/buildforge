const addressRepo = require('../repositories/address.repository');
const { NotFoundError } = require('../utils/AppError');

const getAddresses = async (userId) => {
  return await addressRepo.findAddressesByUserId(userId);
};

const createAddress = async (userId, data) => {
  return await addressRepo.createAddress({
    ...data,
    userId,
  });
};

const deleteAddress = async (userId, id) => {
  const address = await addressRepo.findAddressById(id);
  if (!address || address.userId !== userId) {
    throw new NotFoundError('Address not found');
  }
  await addressRepo.deleteAddress(id, userId);
  return await getAddresses(userId);
};

const setDefaultAddress = async (userId, id) => {
  const address = await addressRepo.findAddressById(id);
  if (!address || address.userId !== userId) {
    throw new NotFoundError('Address not found');
  }
  await addressRepo.setDefaultAddress(id, userId);
  return await getAddresses(userId);
};

const updateAddress = async (userId, id, data) => {
  const address = await addressRepo.findAddressById(id);
  if (!address || address.userId !== userId) {
    throw new NotFoundError('Address not found');
  }
  await addressRepo.updateAddress(id, userId, data);
  return await getAddresses(userId);
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
