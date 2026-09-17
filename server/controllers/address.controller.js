const addressService = require('../services/address.service');
const shippingRepo = require('../repositories/shipping.repository');
const { sendSuccess } = require('../utils/response');

const getAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.getAddresses(req.user.id);
    return sendSuccess(res, addresses);
  } catch (err) {
    next(err);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const address = await addressService.createAddress(req.user.id, req.body);
    return sendSuccess(res, address, 201);
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const addresses = await addressService.deleteAddress(req.user.id, req.params.id);
    return sendSuccess(res, addresses);
  } catch (err) {
    next(err);
  }
};

const setDefaultAddress = async (req, res, next) => {
  try {
    const addresses = await addressService.setDefaultAddress(req.user.id, req.params.id);
    return sendSuccess(res, addresses);
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const addresses = await addressService.updateAddress(req.user.id, req.params.id, req.body);
    return sendSuccess(res, addresses);
  } catch (err) {
    next(err);
  }
};

const getShippingZones = async (req, res, next) => {
  try {
    const zones = await shippingRepo.getAllShippingZones();
    return sendSuccess(res, zones);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getShippingZones,
};
