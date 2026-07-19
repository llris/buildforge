const prisma = require('../utils/prisma');
const { AppError } = require('../utils/AppError');

const checkDatabaseConnection = async () => {
  try {
    // Perform a simple query to ensure the DB is reachable
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    // Return false instead of throwing so the controller can send 503
    return false;
  }
};

module.exports = {
  checkDatabaseConnection,
};
