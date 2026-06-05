// Using global fetch

export const sendSms = async (phone, message) => {
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.log(`[DEV SMS] To: ${phone} | Message: ${message}`);
    return { success: true, dev: true };
  }

  // Production: MSG91 integration
  // MSG91 API: https://control.msg91.com/api/v5/flow/ or v5/otp
  // Let's call the v5/otp API as requested: https://api.msg91.com/api/v5/otp
  try {
    const apiKey = process.env.OTP_PROVIDER_KEY;
    const senderId = process.env.OTP_SENDER_ID || 'JEETST';
    
    // We can send a request to MSG91
    const response = await fetch(`https://api.msg91.com/api/v5/otp?authkey=${apiKey}&mobile=${phone}&message=${encodeURIComponent(message)}&sender=${senderId}`, {
      method: 'POST'
    });
    
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, error: error.message };
  }
};
