import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import db from '../models/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} from '../utils/jwt.js';
import { sendSms } from '../utils/sms.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

const hashTokenForStorage = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Password validation regex: min 8 chars, at least 1 uppercase, 1 number, 1 special char
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",./<>?]).{8,}$/;

// Zod schema for registration
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email('Invalid email format'),
  phone: z.string().length(10, 'Phone must be exactly 10 digits').regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  password: z.string().regex(passwordRegex, 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character')
});

// Zod schema for password reset
const resetPasswordSchema = z.object({
  phone: z.string().length(10),
  reset_token: z.string().min(1),
  new_password: z.string().regex(passwordRegex, 'Password must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character')
});

/**
 * POST /api/v1/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0].message, 400);
    }

    const { name, email, phone, password } = parsed.data;

    // Check unique email
    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return sendError(res, 'Email already registered', 400);
    }

    // Check unique phone
    const existingPhone = await db.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return sendError(res, 'Phone number already registered', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: 'STUDENT',
        plan: 'FREE',
        otpVerified: false,
        isActive: true
      }
    });

    // Auto-trigger OTP send to phone (run internally)
    await triggerSendOtp(user);

    return sendSuccess(res, {
      user_id: user.id,
      message: 'Registration successful. OTP sent to your mobile number.'
    }, 201);

  } catch (error) {
    next(error);
  }
};

/**
 * Helper to trigger OTP generation and sending
 */
const triggerSendOtp = async (user) => {
  // Generate 6 digit OTP
  const rawOtp = String(Math.floor(100000 + Math.random() * 900000));
  
  // Hash OTP
  const otpCode = await bcrypt.hash(rawOtp, 10); // saltRounds: 10 for OTP
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Update user with OTP
  await db.user.update({
    where: { id: user.id },
    data: {
      otpCode,
      otpExpiresAt,
      otpVerified: false
    }
  });

  // Send OTP
  await sendSms(user.phone, `Your OTP is ${rawOtp}`);
};

/**
 * POST /api/v1/auth/send-otp
 */
export const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return sendError(res, 'Phone number is required', 400);
    }

    const user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user.otpVerified) {
      return sendError(res, 'Phone already verified', 400);
    }

    await triggerSendOtp(user);

    return sendSuccess(res, { message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/verify-otp
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return sendError(res, 'Phone and OTP are required', 400);
    }

    const user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check expiry
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return sendError(res, 'OTP expired', 400);
    }

    if (!user.otpCode) {
      return sendError(res, 'Invalid OTP', 400);
    }

    // Match OTP
    let isMatch = await bcrypt.compare(otp, user.otpCode);

    // Dev bypass: "000000" always works in non-production
    if (!isMatch && process.env.NODE_ENV !== 'production' && otp === '000000') {
      isMatch = true;
    }

    if (!isMatch) {
      return sendError(res, 'Invalid OTP', 400);
    }

    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken(user);

    const hashedRefreshToken = await bcrypt.hash(hashTokenForStorage(refresh_token), BCRYPT_SALT_ROUNDS);

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        otpVerified: true,
        otpCode: null,
        otpExpiresAt: null,
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date()
      }
    });

    return sendSuccess(res, {
      access_token,
      refresh_token,
      user: sanitizeUser(updatedUser)
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return sendError(res, 'Identifier and password are required', 400);
    }

    let user;
    if (identifier.includes('@')) {
      user = await db.user.findUnique({ where: { email: identifier } });
    } else {
      user = await db.user.findUnique({ where: { phone: identifier } });
    }

    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    if (!user.otpVerified) {
      return sendError(res, 'Please verify your phone number first', 403);
    }

    if (!user.isActive) {
      return sendError(res, 'Account suspended', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    const access_token = generateAccessToken(user);
    const refresh_token = generateRefreshToken(user);

    const hashedRefreshToken = await bcrypt.hash(hashTokenForStorage(refresh_token), BCRYPT_SALT_ROUNDS);

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date()
      }
    });

    return sendSuccess(res, {
      access_token,
      refresh_token,
      user: sanitizeUser(updatedUser)
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return sendError(res, 'Refresh token is required', 400);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refresh_token);
    } catch (err) {
      return sendError(res, 'Invalid refresh token', 401);
    }

    const user = await db.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.refreshToken) {
      return sendError(res, 'Invalid refresh token', 401);
    }
    const hashedInput = hashTokenForStorage(refresh_token);
    const isMatch = await bcrypt.compare(hashedInput, user.refreshToken);
    if (!isMatch) {
      return sendError(res, 'Invalid refresh token', 401);
    }

    // Generate rotated tokens
    const access_token = generateAccessToken(user);
    const new_refresh_token = generateRefreshToken(user);

    const hashedRefreshToken = await bcrypt.hash(hashTokenForStorage(new_refresh_token), BCRYPT_SALT_ROUNDS);

    await db.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken
      }
    });

    return sendSuccess(res, {
      access_token,
      refresh_token: new_refresh_token
    });

  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    await db.user.update({
      where: { id: req.user.id },
      data: {
        refreshToken: null
      }
    });

    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return sendError(res, 'Phone is required', 400);
    }

    const user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      // Silently return success to prevent enumeration
      return sendSuccess(res, { message: 'Reset instructions sent' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const resetToken = await bcrypt.hash(rawToken, 10);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send reset instructions (console logs in dev)
    await sendSms(phone, `Your JEE Platform password reset code: ${rawToken}`);

    return sendSuccess(res, { message: 'Reset instructions sent' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, parsed.error.errors[0].message, 400);
    }

    const { phone, reset_token, new_password } = parsed.data;

    const user = await db.user.findUnique({ where: { phone } });
    if (!user || !user.resetToken || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return sendError(res, 'Token expired or invalid', 400);
    }

    const isMatch = await bcrypt.compare(reset_token, user.resetToken);
    if (!isMatch) {
      return sendError(res, 'Token expired or invalid', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, BCRYPT_SALT_ROUNDS);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null // Invalidate existing login sessions
      }
    });

    return sendSuccess(res, { message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await db.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    return sendSuccess(res, sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/dev-token
 */
export const devToken = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).send('Not Found');
    }

    const { role, sub } = req.body;
    if (!role || !['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return sendError(res, 'Invalid or missing role parameter. Must be ADMIN, TEACHER, or STUDENT', 400);
    }

    const payload = {
      id: sub ? `dev-${role.toLowerCase()}-id-${sub}` : `dev-${role.toLowerCase()}-id`,
      role,
      name: sub ? `Dev ${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()} ${sub}` : `Dev ${role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}`
    };

    // Auto-create dev user in database to support requirePlan check
    const existing = await db.user.findUnique({ where: { id: payload.id } });
    if (!existing) {
      await db.user.create({
        data: {
          id: payload.id,
          name: payload.name,
          email: `${payload.id}@test.com`,
          phone: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          passwordHash: 'dummyhash',
          role: role,
          plan: 'FREE'
        }
      });
    }

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
      { expiresIn: '24h' }
    );

    return sendSuccess(res, { token });
  } catch (error) {
    next(error);
  }
};
