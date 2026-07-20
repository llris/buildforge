const { getTransporter } = require('./transporter');
const templates = require('./templates');
const { env } = require('../../config/env');
const logger = require('../../utils/logger');
const nodemailer = require('nodemailer');

/**
 * Sends an email using the configured transport.
 * @param {Object} options - { to, subject, template, data }
 */
const sendMail = async ({ to, subject, template, data }) => {
  try {
    const transporter = await getTransporter();
    const html = templates[template](data);

    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });

    logger.info(`Email sent: ${info.messageId}`);
    
    // Log Ethereal preview URL if using Ethereal
    if (env.SMTP_HOST.includes('ethereal')) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error.message} - Not blocking request`);
    // throw error; // Commented out to prevent blocking registration with invalid dev SMTP credentials
  }
};

module.exports = {
  sendMail,
};
