const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax', // 'none' + secure:true is required for cross-origin frontend (Vercel) <-> backend (Render/Railway)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    
    // Exclude password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.cookie('refreshToken', refreshToken, cookieOptions);
    return sendSuccess(res, { user: userWithoutPassword, accessToken }, 201);
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    await authService.verifyEmail(token);
    return sendSuccess(res, { message: 'Email successfully verified' });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.cookie('refreshToken', refreshToken, cookieOptions);
    return sendSuccess(res, { user: userWithoutPassword, accessToken });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken: oldToken } = req.cookies;
    const { user, accessToken, refreshToken } = await authService.refresh(oldToken);
    
    const { passwordHash, ...userWithoutPassword } = user;
    
    res.cookie('refreshToken', refreshToken, cookieOptions);
    return sendSuccess(res, { user: userWithoutPassword, accessToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken', cookieOptions);
    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    return sendSuccess(res, { message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    return sendSuccess(res, { message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user is populated by requireAuth middleware
    const { passwordHash, ...userWithoutPassword } = req.user;
    return sendSuccess(res, { user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
};
