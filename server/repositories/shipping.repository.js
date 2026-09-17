const prisma = require('../utils/prisma');

const getAllShippingZones = async () => {
  return await prisma.shippingZone.findMany({
    orderBy: { fee: 'asc' },
  });
};

const findShippingZoneById = async (id) => {
  return await prisma.shippingZone.findUnique({
    where: { id },
  });
};

const findShippingZoneByRegion = async (region) => {
  return await prisma.shippingZone.findFirst({
    where: {
      region: {
        equals: region,
        mode: 'insensitive',
      },
    },
  });
};

const getAllTaxRules = async () => {
  return await prisma.taxRule.findMany({
    orderBy: { region: 'asc' },
  });
};

const findTaxRuleByRegion = async (region) => {
  return await prisma.taxRule.findFirst({
    where: {
      region: {
        equals: region,
        mode: 'insensitive',
      },
    },
  });
};

module.exports = {
  getAllShippingZones,
  findShippingZoneById,
  findShippingZoneByRegion,
  getAllTaxRules,
  findTaxRuleByRegion,
};
