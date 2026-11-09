/**
 * WhatsApp OTP & Notification Service
 * Dispatches real-time WhatsApp OTP messages across:
 * 1. Fast2SMS WhatsApp API (FAST2SMS_API_KEY, FAST2SMS_WHATSAPP_MESSAGE_ID)
 * 2. Twilio WhatsApp API (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER)
 * 3. Meta Official WhatsApp Cloud API (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID)
 * 4. Direct WhatsApp Deep-Link Fallback (Instant Click-to-Receive via wa.me)
 */

import { normalizeIndianPhone, maskPhone } from './sms.service.js';

export const sendWhatsAppOTP = async ({ phone, otp, userName = 'Resident' }) => {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) {
    throw new Error('Invalid Indian mobile number for WhatsApp delivery.');
  }

  const messageText = `Your Nestify verification code is *${otp}*. Valid for 10 minutes.\n\nUse this code to verify your mobile number. Do not share this OTP with anyone for your account security.`;
  const whatsappDeepLink = `https://wa.me/91${normalized}?text=${encodeURIComponent(`Hello ${userName}, your Nestify verification code is ${otp}. Valid for 10 minutes.`)}`;

  // ----------------------------------------------------
  // 1. ULTRAMSG AUTOMATED WHATSAPP GATEWAY (Primary - Fast & Zero Approval)
  // Free trial instance at https://ultramsg.com
  // ----------------------------------------------------
  if (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN) {
    try {
      const instanceId = process.env.ULTRAMSG_INSTANCE_ID.trim();
      const token = process.env.ULTRAMSG_TOKEN.trim();

      const response = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token,
          to: `+91${normalized}`,
          body: messageText
        })
      });
      const data = await response.json();

      if (data.sent === 'true' || data.sent === true || data.id) {
        console.log(`[ULTRAMSG SUCCESS] Real-time OTP delivered to +91${normalized} via UltraMsg. Message ID: ${data.id}`);
        return {
          success: true,
          simulated: false,
          provider: 'UltraMsg WhatsApp',
          channel: 'WHATSAPP',
          messageId: data.id,
          phone: normalized,
          masked: maskPhone(normalized),
          whatsappDeepLink
        };
      }
      console.warn('UltraMsg WhatsApp notice:', data.error || data.message);
    } catch (err) {
      console.error('UltraMsg WhatsApp dispatch error:', err.message);
    }
  }

  // ----------------------------------------------------
  // 2. FAST2SMS WHATSAPP API (If message_id configured)
  // ----------------------------------------------------
  if (process.env.FAST2SMS_API_KEY && process.env.FAST2SMS_WHATSAPP_MESSAGE_ID) {
    try {
      const messageId = process.env.FAST2SMS_WHATSAPP_MESSAGE_ID.trim();
      const phoneId = process.env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID ? `&phone_number_id=${process.env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID.trim()}` : '';
      const url = `https://www.fast2sms.com/dev/whatsapp?message_id=${messageId}${phoneId}&numbers=${normalized}&variables_values=${otp}`;

      const response = await fetch(url, {
        headers: { 'Authorization': process.env.FAST2SMS_API_KEY.trim() }
      });
      const data = await response.json();

      if (data.status || data.return) {
        console.log(`[WHATSAPP SUCCESS] Delivered to +91${normalized} via Fast2SMS WhatsApp API. ReqID: ${data.request_id || ''}`);
        return {
          success: true,
          simulated: false,
          provider: 'Fast2SMS WhatsApp',
          channel: 'WHATSAPP',
          phone: normalized,
          masked: maskPhone(normalized),
          whatsappDeepLink
        };
      }
      console.warn('Fast2SMS WhatsApp API warning:', data.message || data.errors);
    } catch (err) {
      console.error('Fast2SMS WhatsApp dispatch error:', err.message);
    }
  }

  // ----------------------------------------------------
  // 2. TWILIO WHATSAPP GATEWAY (Global Standard)
  // Sandbox free number: whatsapp:+14155238886
  // ----------------------------------------------------
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID.trim();
      const token = process.env.TWILIO_AUTH_TOKEN.trim();
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER 
        ? (process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') ? process.env.TWILIO_WHATSAPP_NUMBER : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`)
        : 'whatsapp:+14155238886';

      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', `whatsapp:+91${normalized}`);
      params.append('From', fromNumber);
      params.append('Body', `Your Nestify verification code is ${otp}. Valid for 10 minutes.`);

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
        console.log(`[WHATSAPP SUCCESS] Delivered to +91${normalized} via Twilio WhatsApp SID: ${data.sid}`);
        return {
          success: true,
          simulated: false,
          provider: 'Twilio WhatsApp',
          channel: 'WHATSAPP',
          sid: data.sid,
          phone: normalized,
          masked: maskPhone(normalized),
          whatsappDeepLink
        };
      }
      console.warn('Twilio WhatsApp error:', data.message || data.code);
    } catch (err) {
      console.error('Twilio WhatsApp dispatch error:', err.message);
    }
  }

  // ----------------------------------------------------
  // 3. META CLOUD API (Official WhatsApp Cloud Graph API)
  // ----------------------------------------------------
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const token = process.env.WHATSAPP_TOKEN.trim();
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID.trim();

      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${normalized}`,
          type: 'text',
          text: { body: messageText }
        })
      });
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        console.log(`[WHATSAPP SUCCESS] Delivered to +91${normalized} via Meta Cloud API ID: ${data.messages[0].id}`);
        return {
          success: true,
          simulated: false,
          provider: 'Meta WhatsApp Cloud API',
          channel: 'WHATSAPP',
          phone: normalized,
          masked: maskPhone(normalized),
          whatsappDeepLink
        };
      }
      console.warn('Meta WhatsApp API error:', data.error?.message);
    } catch (err) {
      console.error('Meta WhatsApp dispatch error:', err.message);
    }
  }

  // ----------------------------------------------------
  // 5. GREEN-API AUTOMATED WHATSAPP GATEWAY
  // Free trial at https://green-api.com
  // ----------------------------------------------------
  if (process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN) {
    try {
      const id = process.env.GREEN_API_INSTANCE_ID.trim();
      const token = process.env.GREEN_API_TOKEN.trim();

      const response = await fetch(`https://api.green-api.com/waInstance${id}/sendMessage/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `91${normalized}@c.us`,
          message: messageText
        })
      });
      const data = await response.json();

      if (data.idMessage) {
        console.log(`[WHATSAPP SUCCESS] Delivered to +91${normalized} via Green-API ID: ${data.idMessage}`);
        return {
          success: true,
          simulated: false,
          provider: 'Green-API WhatsApp',
          channel: 'WHATSAPP',
          phone: normalized,
          masked: maskPhone(normalized),
          whatsappDeepLink
        };
      }
      console.warn('Green-API WhatsApp error:', data.message);
    } catch (err) {
      console.error('Green-API WhatsApp dispatch error:', err.message);
    }
  }

  // ----------------------------------------------------
  // 6. DEVELOPMENT SIMULATION & CLICK-TO-CHAT FALLBACK
  // ----------------------------------------------------
  console.log('\n' + '='.repeat(68));
  console.log('💬 [NESTIFY WHATSAPP GATEWAY - SIMULATION & DEEP-LINK MODE]');
  console.log(`To:            +91 ${normalized} (${userName})`);
  console.log(`OTP Code:      [ ${otp} ]`);
  console.log(`Message:       "${messageText.replace(/\n/g, ' ')}"`);
  console.log(`Deep Link:     ${whatsappDeepLink}`);
  console.log('='.repeat(68) + '\n');

  return {
    success: true,
    simulated: true,
    provider: 'WhatsApp Simulation / Direct Link',
    channel: 'WHATSAPP',
    phone: normalized,
    masked: maskPhone(normalized),
    whatsappDeepLink,
    otp: process.env.NODE_ENV !== 'production' ? otp : undefined
  };
};

