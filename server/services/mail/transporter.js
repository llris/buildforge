const nodemailer = require('nodemailer');
const { env } = require('../../config/env');
const logger = require('../../utils/logger');

let transporterInstance = null;

const getTransporter = async () => {
  if (transporterInstance) {
    return transporterInstance;
  }

  let user = env.SMTP_USER;
  let pass = env.SMTP_PASS;

  // Auto-generate Ethereal account if credentials are not provided
  if (!user || !pass) {
    logger.info('No SMTP credentials found. Generating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    user = testAccount.user;
    pass = testAccount.pass;
    logger.info(`Generated Ethereal account: ${user}`);
  }

  transporterInstance = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  return transporterInstance;
};

module.exports = { getTransporter };
