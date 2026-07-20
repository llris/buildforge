const { env } = require('../../config/env');

const verifyEmail = (data) => `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Welcome to BuildForge!</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="${env.CLIENT_URL}/verify-email?token=${data.token}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
    <p>If you did not create an account, no further action is required.</p>
  </div>
`;

const resetPassword = (data) => `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Reset Your Password</h2>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="${env.CLIENT_URL}/reset-password?token=${data.token}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
  </div>
`;

module.exports = {
  verifyEmail,
  resetPassword,
};
