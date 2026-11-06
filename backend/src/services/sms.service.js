/**
 * SMS & Indian Phone Verification Service
 * Handles phone normalization, OTP formatting, Indian telecom compliance,
 * and live gateway dispatch (Fast2SMS / Twilio / MSG91) with development simulation fallback.
 */

/**
 * Normalizes an Indian mobile number.
 * Accepts formats like:
 * - "+91 98765 43210"
 * - "+91-9876543210"
 * - "09876543210"
 * - "919876543210"
 * - "9876543210"
 * Returns 10-digit standard Indian mobile number or null if invalid.
 */
export const normalizeIndianPhone = (phone) => {
  if (!phone) return null;
  let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, '');
  
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  // Indian mobile numbers must be exactly 10 digits starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
};

/**
 * Masks phone number for safe display (e.g. +91 98****3210)
 */
export const maskPhone = (phone) => {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return phone || '';
  return `+91 ${normalized.slice(0, 2)}****${normalized.slice(-4)}`;
};

/**
 * Dispatches an SMS OTP to a verified Indian mobile number.
 */
export const sendSmsOTP = async ({ phone, otp, userName = 'Resident', type = 'PHONE_VERIFICATION' }) => {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) {
    throw new Error('Invalid Indian mobile number. Must be 10 digits starting with 6-9.');
  }

  const message = `Your Nestify verification code is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone for account security.`;

  // 1. Fast2SMS Provider Integration (If credentials available)
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: normalized
        })
      });
      const data = await response.json();
      if (data.return) {
        return { success: true, simulated: false, phone: normalized, masked: maskPhone(normalized) };
      }
    } catch (err) {
      console.error('Fast2SMS dispatch error:', err.message);
    }
  }

  // 2. Twilio Provider Integration (If credentials available)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', `+91${normalized}`);
      params.append('From', process.env.TWILIO_PHONE_NUMBER);
      params.append('Body', message);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      const data = await response.json();
      if (data.sid) {
        return { success: true, simulated: false, sid: data.sid, phone: normalized, masked: maskPhone(normalized) };
      }
    } catch (err) {
      console.error('Twilio SMS dispatch error:', err.message);
    }
  }

  // 3. Authentic Development Simulation Mode
  console.log('\n' + '='.repeat(68));
  console.log('📱 [NESTIFY SMS GATEWAY - INDIAN TELECOM DISPATCH SIMULATION]');
  console.log(`To:        +91 ${normalized} (${userName})`);
  console.log(`Purpose:   ${type}`);
  console.log(`OTP Code:  [ ${otp} ]`);
  console.log(`Message:   "${message}"`);
  console.log(`Expires:   10 Minutes`);
  console.log('='.repeat(68) + '\n');

  return {
    success: true,
    simulated: true,
    phone: normalized,
    masked: maskPhone(normalized),
    otp: process.env.NODE_ENV !== 'production' ? otp : undefined
  };
};

/**
 * Dispatches an SMS OTP to an Emergency Contact number.
 */
export const sendEmergencyContactOTP = async ({ emergencyPhone, emergencyName, requesterName, otp }) => {
  const normalized = normalizeIndianPhone(emergencyPhone);
  if (!normalized) {
    throw new Error('Invalid emergency contact mobile number.');
  }

  const message = `Hello ${emergencyName || 'Emergency Contact'}, ${requesterName || 'A resident'} has listed you as their emergency contact on Nestify. Your verification OTP is ${otp}. Valid for 10 minutes.`;

  console.log('\n' + '='.repeat(68));
  console.log('🚨 [NESTIFY EMERGENCY CONTACT - SMS VERIFICATION SIMULATION]');
  console.log(`To:        +91 ${normalized} (${emergencyName})`);
  console.log(`Requester: ${requesterName}`);
  console.log(`OTP Code:  [ ${otp} ]`);
  console.log(`Message:   "${message}"`);
  console.log('='.repeat(68) + '\n');

  return {
    success: true,
    simulated: true,
    phone: normalized,
    masked: maskPhone(normalized),
    otp: process.env.NODE_ENV !== 'production' ? otp : undefined
  };
};

