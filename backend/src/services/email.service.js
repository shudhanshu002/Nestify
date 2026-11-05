import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, '../assets/nestify-wordmark.png');

/**
 * Configure Nodemailer Transporter based on environment variables
 */
const getTransporter = () => {
  const user = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  // Strip spaces from password (common when copying 16-character Gmail App Passwords)
  const pass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  // If custom SMTP host is specified (e.g. Brevo, SendGrid, Hostinger, AWS SES)
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Default to standard Gmail service
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
};

/**
 * Generates an authentic, enterprise-grade HTML email template for Nestify OTP verification.
 * Follows email-client best practices (table-based layout, inline CSS, high contrast, responsive).
 */
const buildVerificationEmailHtml = ({ name, otp, toEmail, hasLogo }) => {
  const currentYear = new Date().getFullYear();
  const safeName = name ? String(name).trim() : 'Resident';

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Verify your Nestify Account</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

  <!-- Hidden Preview Text (Preheader) -->
  <div style="display: none; font-size: 1px; color: #0b0c10; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your Nestify verification code is ${otp}. Valid for 10 minutes.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0c10; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #14161f; border: 1px solid #232738; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);">
          
          <!-- Top Accent Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #E50914 0%, #ff3b30 50%, #E50914 100%);"></td>
          </tr>

          <!-- Header / Brand Section -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px 32px;">
              ${
                hasLogo
                  ? `<img src="cid:nestifyLogo" alt="Nestify" width="180" style="display: block; width: 180px; max-width: 180px; height: auto; border: 0; outline: none; margin: 0 auto;" />`
                  : `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                          NEST<span style="color: #E50914;">IFY</span>
                        </td>
                      </tr>
                    </table>`
              }
              <div style="margin-top: 14px;">
                <span style="display: inline-block; background-color: rgba(229, 9, 20, 0.12); border: 1px solid rgba(229, 9, 20, 0.35); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #ff5252; text-transform: uppercase;">
                  Identity &amp; Security Service
                </span>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 36px 20px 36px; text-align: left;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; text-align: center;">
                Confirm Your Email Address
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9da3af; text-align: center;">
                Hello <strong style="color: #ffffff;">${safeName}</strong>,<br />
                Welcome to Nestify! To finalize your registration and safeguard your account, please enter the single-use verification code below.
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0d12; border: 1px solid #232738; border-radius: 14px; margin: 10px 0 24px 0;">
                <tr>
                  <td align="center" style="padding: 24px 16px;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #737887; text-transform: uppercase; margin-bottom: 8px;">
                      Verification Code
                    </div>
                    <div style="font-family: 'SF Pro Display', -apple-system, 'SF Mono', Consolas, 'Roboto Mono', 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; margin: 4px 0 10px 0; padding-left: 10px;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; font-weight: 600; color: #f59e0b;">
                      &#9201; Valid for 10 minutes &bull; Single-use only
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Callout Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 255, 255, 0.02); border-left: 3px solid #E50914; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 14px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #888e9f;">
                      <strong style="color: #d1d5db;">Security Advisory:</strong> Nestify will never call or message you asking for this OTP, your password, or personal financial details. If you did not make this request, please safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Account Details Summary -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #101117; border: 1px solid #1e2230; border-radius: 10px; margin-bottom: 12px; font-size: 12px; color: #9da3af;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #1a1d29; color: #717688; width: 40%;">Account Email:</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #1a1d29; color: #e5e7eb; font-weight: 500;">${toEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #717688;">Timestamp:</td>
                  <td style="padding: 10px 14px; color: #e5e7eb; font-weight: 500;">${new Date().toUTCString()}</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Subtle Divider -->
          <tr>
            <td style="padding: 0 36px;">
              <div style="border-top: 1px solid #1f2231; height: 1px; width: 100%;"></div>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td align="center" style="padding: 24px 32px 32px 32px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                Need assistance? Contact our team at
                <a href="mailto:support@nestify.in" style="color: #ff4b4b; text-decoration: none; font-weight: 500;">support@nestify.in</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #4b5262; line-height: 1.6;">
                &copy; ${currentYear} Nestify Technologies Inc. All rights reserved.<br />
                Smart Co-Living Platform &bull; Redefining Modern Living Spaces.<br />
                This is an automated system notification. Please do not reply directly.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
};

/**
 * Generates an authentic, enterprise-grade HTML email template for Nestify Password Reset.
 */
const buildPasswordResetEmailHtml = ({ name, otp, toEmail, hasLogo }) => {
  const currentYear = new Date().getFullYear();
  const safeName = name ? String(name).trim() : 'Resident';

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Reset Your Nestify Password</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">

  <!-- Hidden Preview Text (Preheader) -->
  <div style="display: none; font-size: 1px; color: #0b0c10; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Your password reset code is ${otp}. Valid for 10 minutes.
    &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0c10; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #14161f; border: 1px solid #232738; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);">
          
          <!-- Top Accent Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #E50914 0%, #ff3b30 50%, #E50914 100%);"></td>
          </tr>

          <!-- Header / Brand Section -->
          <tr>
            <td align="center" style="padding: 36px 32px 20px 32px;">
              ${
                hasLogo
                  ? `<img src="cid:nestifyLogo" alt="Nestify" width="180" style="display: block; width: 180px; max-width: 180px; height: auto; border: 0; outline: none; margin: 0 auto;" />`
                  : `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">
                          NEST<span style="color: #E50914;">IFY</span>
                        </td>
                      </tr>
                    </table>`
              }
              <div style="margin-top: 14px;">
                <span style="display: inline-block; background-color: rgba(229, 9, 20, 0.12); border: 1px solid rgba(229, 9, 20, 0.35); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #ff5252; text-transform: uppercase;">
                  Account Recovery &amp; Security
                </span>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 36px 20px 36px; text-align: left;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; text-align: center;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #9da3af; text-align: center;">
                Hello <strong style="color: #ffffff;">${safeName}</strong>,<br />
                We received a request to reset the password for your Nestify account. Enter the 6-digit verification code below to set up a new password.
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0c0d12; border: 1px solid #232738; border-radius: 14px; margin: 10px 0 24px 0;">
                <tr>
                  <td align="center" style="padding: 24px 16px;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #737887; text-transform: uppercase; margin-bottom: 8px;">
                      Password Reset Code
                    </div>
                    <div style="font-family: 'SF Pro Display', -apple-system, 'SF Mono', Consolas, 'Roboto Mono', 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; margin: 4px 0 10px 0; padding-left: 10px;">
                      ${otp}
                    </div>
                    <div style="font-size: 12px; font-weight: 600; color: #f59e0b;">
                      &#9201; Valid for 10 minutes &bull; Single-use only
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Callout Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 255, 255, 0.02); border-left: 3px solid #E50914; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 14px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #888e9f;">
                      <strong style="color: #d1d5db;">Did not request this?</strong> If you did not initiate this password reset, someone may have entered your email by mistake. Your account password remains unchanged and safe.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Account Details Summary -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #101117; border: 1px solid #1e2230; border-radius: 10px; margin-bottom: 12px; font-size: 12px; color: #9da3af;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #1a1d29; color: #717688; width: 40%;">Account Email:</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #1a1d29; color: #e5e7eb; font-weight: 500;">${toEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; color: #717688;">Timestamp:</td>
                  <td style="padding: 10px 14px; color: #e5e7eb; font-weight: 500;">${new Date().toUTCString()}</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Subtle Divider -->
          <tr>
            <td style="padding: 0 36px;">
              <div style="border-top: 1px solid #1f2231; height: 1px; width: 100%;"></div>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td align="center" style="padding: 24px 32px 32px 32px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                Need assistance? Contact our team at
                <a href="mailto:support@nestify.in" style="color: #ff4b4b; text-decoration: none; font-weight: 500;">support@nestify.in</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #4b5262; line-height: 1.6;">
                &copy; ${currentYear} Nestify Technologies Inc. All rights reserved.<br />
                Smart Co-Living Platform &bull; Redefining Modern Living Spaces.<br />
                This is an automated system notification. Please do not reply directly.
              </p>
            </td>
          </tr>

        </table>
        <!-- End Main Card -->
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
};

/**
 * Send a branded Email Verification OTP directly to the user's inbox
 * @param {string} toEmail 
 * @param {string} otp 
 * @param {string} name 
 */
export const sendVerificationEmail = async (toEmail, otp, name = 'Resident') => {
  const transporter = getTransporter();

  if (!transporter) {
    console.error(`[EMAIL ERROR] EMAIL_USER and EMAIL_PASS are not configured in backend/.env`);
    throw new Error('Email delivery service is not configured. Please add EMAIL_USER and EMAIL_PASS to your backend/.env file.');
  }

  const senderUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const sender = process.env.EMAIL_FROM || `"Nestify" <${senderUser}>`;

  const hasLogo = fs.existsSync(logoPath);
  const html = buildVerificationEmailHtml({ name, otp, toEmail, hasLogo });

  const attachments = [];
  if (hasLogo) {
    attachments.push({
      filename: 'nestify-logo.png',
      path: logoPath,
      cid: 'nestifyLogo'
    });
  }

  try {
    const info = await transporter.sendMail({
      from: sender,
      to: toEmail,
      subject: `🔐 ${otp} is your Nestify verification code`,
      text: `Hello ${name},\n\nYour Nestify verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nNestify Team`,
      html,
      attachments
    });

    console.log(`[EMAIL DISPATCHED] Verification code sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send email to ${toEmail}:`, err.message);
    throw new Error(`Email delivery failed: ${err.message}`);
  }
};

/**
 * Send a branded Password Reset OTP directly to the user's inbox
 * @param {string} toEmail 
 * @param {string} otp 
 * @param {string} name 
 */
export const sendPasswordResetEmail = async (toEmail, otp, name = 'Resident') => {
  const transporter = getTransporter();

  if (!transporter) {
    console.error(`[EMAIL ERROR] EMAIL_USER and EMAIL_PASS are not configured in backend/.env`);
    throw new Error('Email delivery service is not configured. Please add EMAIL_USER and EMAIL_PASS to your backend/.env file.');
  }

  const senderUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const sender = process.env.EMAIL_FROM || `"Nestify" <${senderUser}>`;

  const hasLogo = fs.existsSync(logoPath);
  const html = buildPasswordResetEmailHtml({ name, otp, toEmail, hasLogo });

  const attachments = [];
  if (hasLogo) {
    attachments.push({
      filename: 'nestify-logo.png',
      path: logoPath,
      cid: 'nestifyLogo'
    });
  }

  try {
    const info = await transporter.sendMail({
      from: sender,
      to: toEmail,
      subject: `🔐 ${otp} is your Nestify password reset code`,
      text: `Hello ${name},\n\nYour Nestify password reset code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please safely ignore this message.\n\nBest regards,\nNestify Security Team`,
      html,
      attachments
    });

    console.log(`[EMAIL DISPATCHED] Password reset code sent to ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL ERROR] Failed to send password reset email to ${toEmail}:`, err.message);
    throw new Error(`Email delivery failed: ${err.message}`);
  }
};
