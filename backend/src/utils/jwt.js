import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const getAccessSecret = () => process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-jwt-key-change-in-production';

export const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    role: user.role,
    name: user.name,
    plan: user.plan
  };
  return jwt.sign(payload, getAccessSecret(), { expiresIn: '15m' });
};

export const generateRefreshToken = (user) => {
  const payload = { 
    id: user.id,
    jti: crypto.randomUUID()
  };
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: '30d' });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, getAccessSecret());
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getRefreshSecret());
};
