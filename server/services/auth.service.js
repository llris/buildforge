const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { AppError, ValidationError, UnauthorizedError, ConflictError } = require('../utils/AppError');
const { env } = require('../config/env');
const { sendMail } = require('./mail');

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
};

const register = async ({ email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Email already in use');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  // Generate verification JWT
  const verificationToken = jwt.sign(
    { userId: user.id, action: 'verify_email' },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  await sendMail({
    to: user.email,
    subject: 'Verify your email - BuildForge',
    template: 'verifyEmail',
    data: { token: verificationToken },
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
};

const verifyEmail = async (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.action !== 'verify_email') {
      throw new Error('Invalid token action');
    }

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { isEmailVerified: true },
    });
    
    return user;
  } catch (err) {
    throw new ValidationError('Invalid or expired verification token');
  }
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new UnauthorizedError('Account is temporarily locked. Please try again later.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    const failedCount = user.failedLoginCount + 1;
    const updateData = { failedLoginCount: failedCount };
    
    if (failedCount >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // lock for 15 mins
    }
    
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    throw new UnauthorizedError('Invalid credentials');
  }

  // Success, reset count
  if (user.failedLoginCount > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new UnauthorizedError('No refresh token provided');
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const tokenRecord = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!tokenRecord || !tokenRecord.user.isActive) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = generateAccessToken(tokenRecord.user);
  const newRefreshToken = await generateRefreshToken(tokenRecord.user.id);

  return { user: tokenRecord.user, accessToken, refreshToken: newRefreshToken };
};

const logout = async (refreshToken) => {
  if (!refreshToken) return;
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Silent success to prevent email enumeration

  // Bind token to password hash so it's one-time use
  const secret = env.JWT_SECRET + user.passwordHash;
  const resetToken = jwt.sign(
    { userId: user.id, action: 'reset_password' },
    secret,
    { expiresIn: '15m' }
  );

  await sendMail({
    to: user.email,
    subject: 'Reset your password - BuildForge',
    template: 'resetPassword',
    data: { token: resetToken },
  });
};

const resetPassword = async ({ token, newPassword }) => {
  const decodedObj = jwt.decode(token);
  if (!decodedObj || !decodedObj.userId) {
    throw new ValidationError('Invalid token');
  }

  const user = await prisma.user.findUnique({ where: { id: decodedObj.userId } });
  if (!user) {
    throw new ValidationError('Invalid token');
  }

  const secret = env.JWT_SECRET + user.passwordHash;
  try {
    jwt.verify(token, secret);
  } catch (err) {
    throw new ValidationError('Invalid or expired reset token');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revokedAt: new Date() },
    })
  ]);
};

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
};
