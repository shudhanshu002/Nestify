/**
 * SMS & Indian Telecom Verification Service
 * Multi-Provider Real-Time SMS Gateway with Automatic Fallback & Dev Simulation.
 * Supported Providers:
 * 1. Fast2SMS (India's most popular free-tier OTP provider) -> FAST2SMS_API_KEY
 * 2. 2Factor.in (Dedicated Indian OTP Gateway) -> TWOFACTOR_API_KEY
 * 3. Twilio (Global Telecom Leader) -> TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 * 4. Textlocal (India Transactional SMS) -> TEXTLOCAL_API_KEY
 */

/**
 * Normalizes an Indian mobile number.
 * Accepts formats: "+91 98765 43210", "+91-9876543210", "09876543210", "919876543210", "9876543210"
 * Returns 10-digit Indian standard mobile number or null if invalid.
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
 * Dispatches an SMS OTP in real-time across configured telecom gateways.
 */
export const sendSmsOTP = async ({ phone, otp, userName = 'Resident', type = 'PHONE_VERIFICATION' }) => {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) {
    throw new Error('Invalid Indian mobile number. Must be 10 digits starting with 6-9.');
  }

  const message = `Your Nestify verification code is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone for account security.`;
  let lastError = null;

  // ----------------------------------------------------
  // 1. FAST2SMS GATEWAY (Recommended for India)
  // Free sign up at https://www.fast2sms.com -> Dev API
  // ----------------------------------------------------
  if (process.env.FAST2SMS_API_KEY) {
    try {
      // First attempt: OTP Route (high priority on telecom DLT)
      const otpResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: normalized
        })
      });
      const otpData = await otpResponse.json();

      if (otpData.return) {
        console.log(`[SMS SUCCESS] Real-time OTP delivered to +91${normalized} via Fast2SMS (OTP Route). ReqID: ${otpData.request_id || ''}`);
        return { 
          success: true, 
          simulated: false, 
          provider: 'Fast2SMS', 
          phone: normalized, 
          masked: maskPhone(normalized) 
        };
      }

      if (otpData.status_code === 996 || (otpData.message && typeof otpData.message === 'string' && otpData.message.includes('website verification'))) {
        lastError = 'Fast2SMS requires 1-time Website Verification: Log in to fast2sms.com -> "OTP Message" menu -> complete Website Verification to activate live SMS delivery, or use WhatsApp OTP.';
      } else {
        lastError = Array.isArray(otpData.message) ? otpData.message[0] : (otpData.message || 'Fast2SMS OTP route rejected message');
      }

      // Second attempt: Quick SMS route ('q') if OTP route required DLT
      const quickResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          language: 'english',
          flash: 0,
          numbers: normalized
        })
      });
      const quickData = await quickResponse.json();
      if (quickData.return) {
        console.log(`[SMS SUCCESS] Real-time message delivered to +91${normalized} via Fast2SMS (Quick Route)`);
        return { 
          success: true, 
          simulated: false, 
          provider: 'Fast2SMS', 
          phone: normalized, 
          masked: maskPhone(normalized) 
        };
      }
      console.warn('Fast2SMS returned notice:', otpData.message || quickData.message);
    } catch (err) {
      console.error('Fast2SMS dispatch error:', err.message);
      if (!lastError) lastError = err.message;
    }
  }

  // ----------------------------------------------------
  // 2. 2FACTOR.IN GATEWAY (Specialized Indian OTP API)
  // Free credits at https://2factor.in
  // ----------------------------------------------------
  if (process.env.TWOFACTOR_API_KEY) {
    try {
      const apiKey = process.env.TWOFACTOR_API_KEY.trim();
      const url = `https://2factor.in/API/V1/${apiKey}/SMS/${normalized}/${otp}/Nestify`;
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();

      if (data.Status === 'Success') {
        console.log(`[SMS SUCCESS] Real-time OTP delivered to +91${normalized} via 2Factor.in Session: ${data.Details}`);
        return { 
          success: true, 
          simulated: false, 
          provider: '2Factor', 
          phone: normalized, 
          masked: maskPhone(normalized) 
        };
      }
      console.warn('2Factor.in returned status:', data.Status, data.Details);
    } catch (err) {
      console.error('2Factor.in dispatch error:', err.message);
    }
  }

  // ----------------------------------------------------
  // 3. TWILIO TELECOM GATEWAY (Global Standard)
  // Free trial at https://twilio.com
  // ----------------------------------------------------
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID.trim();
      const token = process.env.TWILIO_AUTH_TOKEN.trim();
      const fromNumber = process.env.TWILIO_PHONE_NUMBER.trim();

      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', `+91${normalized}`);
      params.append('From', fromNumber);
      params.append('Body', message);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      const data = await response.json();

      if (data.sid) {
        console.log(`[SMS SUCCESS] Real-time OTP dispatched to +91${normalized} via Twilio SID: ${data.sid}`);
        return { 
          success: true, 
          simulated: false, 
          provider: 'Twilio', 
          sid: data.sid, 
          phone: normalized, 
          masked: maskPhone(normalized) 
        };
      }
      console.warn('Twilio SMS error:', data.message || data.code);
    } catch (err) {
      console.error('Twilio SMS dispatch error:', err.message);
    }
  }

  // ----------------------------------------------------
  // 4. TEXTBEE GATEWAY (Free SMS Gateway - 300 SMS/mo)
  // Free sign up at https://textbee.dev
  // ----------------------------------------------------
  if (process.env.TEXTBEE_API_KEY && process.env.TEXTBEE_DEVICE_ID) {
    try {
      const apiKey = process.env.TEXTBEE_API_KEY.trim();
      const deviceId = process.env.TEXTBEE_DEVICE_ID.trim();
      const response = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients: [`+91${normalized}`],
          message: message
        })
      });
      const data = await response.json();
      if (data.success || data.data) {
        console.log(`[SMS SUCCESS] Real-time OTP delivered to +91${normalized} via Textbee.dev`);
        return {
          success: true,
          simulated: false,
          provider: 'Textbee',
          phone: normalized,
          masked: maskPhone(normalized)
        };
      }
      console.warn('Textbee returned notice:', data.message || data.error);
    } catch (err) {
      console.error('Textbee dispatch error:', err.message);
    }
  }

  // ----------------------------------------------------
  // 5. MSG91 GATEWAY (India's Leading Developer SMS Provider)
  // Free trial credits at https://msg91.com
  // ----------------------------------------------------
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    try {
      const authKey = process.env.MSG91_AUTH_KEY.trim();
      const templateId = process.env.MSG91_TEMPLATE_ID.trim();
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=91${normalized}&authkey=${authKey}&otp=${otp}`;
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();
      if (data.type === 'success') {
        console.log(`[SMS SUCCESS] Real-time OTP delivered to +91${normalized} via MSG91`);
        return {
          success: true,
          simulated: false,
          provider: 'MSG91',
          phone: normalized,
          masked: maskPhone(normalized)
        };
      }
      console.warn('MSG91 returned status:', data.message || data.type);
    } catch (err) {
      console.error('MSG91 dispatch error:', err.message);
    }
  }

  // If user configured real SMS gateway and it failed to deliver, alert with exact reason
  if (process.env.NODE_ENV !== 'test' && (process.env.FAST2SMS_API_KEY || process.env.TWOFACTOR_API_KEY || process.env.TWILIO_ACCOUNT_SID || process.env.TEXTBEE_API_KEY || process.env.MSG91_AUTH_KEY)) {
    throw new Error(lastError || 'Real SMS could not be dispatched. Please use WhatsApp OTP (free & instant delivery) or check SMS gateway credentials.');
  }

  // ----------------------------------------------------
  // 4. DEVELOPMENT SIMULATION FALLBACK
  // Triggered only during automated testing or when no gateway keys are set
  // ----------------------------------------------------
  console.log('\n' + '='.repeat(68));
  console.log('📱 [NESTIFY SMS GATEWAY - SIMULATION MODE]');
  console.log(`To:        +91 ${normalized} (${userName})`);
  console.log(`Purpose:   ${type}`);
  console.log(`OTP Code:  [ ${otp} ]`);
  console.log(`Message:   "${message}"`);
  console.log(`Note:      Attach FAST2SMS_API_KEY or TWOFACTOR_API_KEY in .env for real SMS`);
  console.log('='.repeat(68) + '\n');

  return {
    success: true,
    simulated: true,
    provider: 'Local-Simulation',
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

  // 1. Fast2SMS
  if (process.env.FAST2SMS_API_KEY) {
    try {
      // First attempt: OTP Route
      const otpRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: normalized
        })
      });
      const otpData = await otpRes.json();
      if (otpData.return) {
        return { 
          success: true, 
          simulated: false, 
          provider: 'Fast2SMS', 
          phone: normalized, 
          masked: maskPhone(normalized) 
        };
      }

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          language: 'english',
          flash: 0,
          numbers: normalized
        })
      });
      const data = await response.json();
      if (data.return) {
        return { 
          success: true, 
          simulated: false, 
          provider: 'Fast2SMS', 
          phone: normalized, 
          masked: maskPhone(normalized) 
        };
      }
    } catch (err) {
      console.error('Fast2SMS emergency dispatch error:', err.message);
    }
  }

  // 2. 2Factor
  if (process.env.TWOFACTOR_API_KEY) {
    try {
      const url = `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY.trim()}/SMS/${normalized}/${otp}/Nestify`;
      const response = await fetch(url, { method: 'GET' });
      const data = await response.json();
      if (data.Status === 'Success') {
        return { 
          success: true, 
          simulated: false, 
          provider: '2Factor', 
          phone: normalized, 
          masked: maskPhone(normalized) 
        };
      }
    } catch (err) {
      console.error('2Factor emergency dispatch error:', err.message);
    }
  }

  // 3. Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID.trim();
      const token = process.env.TWILIO_AUTH_TOKEN.trim();
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', `+91${normalized}`);
      params.append('From', process.env.TWILIO_PHONE_NUMBER.trim());
      params.append('Body', message);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      const data = await response.json();
      if (data.sid) {
        return { 
          success: true, 
          simulated: false, 
          provider: 'Twilio', 
          phone: normalized, 
          masked: maskPhone(normalized) 
        };
      }
    } catch (err) {
      console.error('Twilio emergency SMS error:', err.message);
    }
  }

  // Fallback Simulation
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
    provider: 'Local-Simulation',
    phone: normalized,
    masked: maskPhone(normalized),
    otp: process.env.NODE_ENV !== 'production' ? otp : undefined
  };
};
