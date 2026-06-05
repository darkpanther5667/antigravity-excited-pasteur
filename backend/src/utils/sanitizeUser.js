export const sanitizeUser = (user) => {
  if (!user) return null;
  const { 
    passwordHash, otpCode, otpExpiresAt, 
    refreshToken, resetToken, resetTokenExpiry,
    ...safe 
  } = user;
  return safe;
};
