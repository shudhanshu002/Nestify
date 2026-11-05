import nodemailer from 'nodemailer';

/**
 * Configure Nodemailer Transporter based on environment variables
 */
const getTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  // If host is explicitly specified (e.g. Brevo, Sendgrid, custom host)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass }
    });
  }

  // Default to Gmail service
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

/**
 * Send a branded Email Verification OTP
 * @param {string} toEmail 
 * @param {string} otp 
 * @param {string} name 
 */
export const sendVerificationEmail = async (toEmail, otp, name = 'Resident') => {
  const transporter = getTransporter();

  // If no email credentials configured in .env, simulate in console
  if (!transporter) {
    console.log(`\n===============================================================`);
    console.log(`📧 [NESTIFY EMAIL SIMULATION]`);
    console.log(`   To: ${toEmail}`);
    console.log(`   Recipient: ${name}`);
    console.log(`   🔑 Verification OTP: ${otp}`);
    console.log(`   ⏰ Expires in: 10 minutes`);
    console.log(`   ℹ️ (Configure EMAIL_USER & EMAIL_PASS in backend/.env for real dispatch)`);
    console.log(`===============================================================\n`);
    return { simulated: true, success: true };
  }

  const sender = process.env.EMAIL_FROM || `"Nestify Support" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; margin: 0; padding: 20px; }
        .card { max-width: 500px; margin: 20px auto; background-color: #181818; border: 1px solid #2a2a2a; border-radius: 24px; padding: 36px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .brand { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #E50914; margin-bottom: 20px; }
        .brand span { color: #ffffff; }
        .title { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 10px; }
        .text { font-size: 13px; color: #a3a3a3; line-height: 1.6; margin-bottom: 28px; }
        .otp-box { background: linear-gradient(135deg, rgba(229,9,20,0.1) 0%, rgba(229,9,20,0.02) 100%); border: 2px dashed #E50914; border-radius: 18px; padding: 18px 24px; margin: 24px 0; display: inline-block; }
        .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: 'Courier New', monospace; margin: 0; }
        .footer { font-size: 11px; color: #737373; margin-top: 32px; border-top: 1px solid #2a2a2a; padding-top: 20px; }
        .badge { background-color: #222222; color: #e5e5e5; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; display: inline-block; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">NEST<span>IFY</span></div>
        <div class="badge">SECURITY VERIFICATION</div>
        <h1 class="title">Verify Your Email Address</h1>
        <p class="text">
          Hello ${name || 'there'},<br>
          Thank you for joining Nestify! Use the 6-digit verification code below to verify your email and activate your account.
        </p>

        <div class="otp-box">
          <p class="otp-code">${otp}</p>
        </div>

        <p class="text" style="font-size: 11px; color: #888888; margin-top: 12px;">
          ⏱️ This code expires in <strong>10 minutes</strong>. Never share this code with anyone.
        </p>

        <div class="footer">
          If you did not request this verification, please safely disregard this email.<br>
          &copy; ${new Date().getFullYear()} Nestify Co-Living Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: sender,
      to: toEmail,
      subject: `🔐 ${otp} is your Nestify Email Verification Code`,
      text: `Your Nestify verification code is: ${otp}. It expires in 10 minutes.`,
      html
    });

    console.log(`[EMAIL DISPATCHED] Verification code sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email to ${toEmail}:`, err.message);
    throw new Error(`Failed to deliver verification email: ${err.message}`);
  }
};

