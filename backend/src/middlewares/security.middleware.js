import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

// Configuration for reverse proxies (Render, Vercel, Cloudflare)
const proxyValidation = { xForwardedForHeader: false };

/**
 * Global API Rate Limiter (Anti-DDoS)
 * Restricts excessive traffic from a single IP to protect server resources
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: proxyValidation,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Anti-DDoS protection triggered. Please retry in 15 minutes.'
  }
});

/**
 * Strict Auth Rate Limiter (Anti-Brute-Force & Credential Stuffing)
 * Protects login, registration, and OTP endpoints from automated password attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 15, // Limit each IP to 15 authentication attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: proxyValidation,
  message: {
    success: false,
    message: 'Too many authentication attempts. Account access throttled for 15 minutes to protect against brute-force attacks.'
  }
});

/**
 * Sensitive Transaction Limiter (Anti-Spam & Race-Condition Abuse)
 * Protects booking reservations, payments, and stay extensions
 */
export const transactionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isTest ? 10000 : 60, // Limit sensitive state mutations
  standardHeaders: true,
  legacyHeaders: false,
  validate: proxyValidation,
  message: {
    success: false,
    message: 'Too many transaction requests detected. Please wait a moment before trying again.'
  }
});

/**
 * Search & Inventory Query Limiter (Anti-Scraping & DB Saturation)
 */
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isTest ? 10000 : 90, // 90 queries per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: proxyValidation,
  message: {
    success: false,
    message: 'High search volume detected. Please wait a moment before searching again.'
  }
});

/**
 * Chat & Messaging Limiter (Anti-Spam & Flood Protection)
 */
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isTest ? 10000 : 60, // 60 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: proxyValidation,
  message: {
    success: false,
    message: 'You are sending messages too quickly. Please pause for a moment.'
  }
});

/**
 * User Interaction Limiter (Reviews, Visits, Maintenance Tickets)
 */
export const interactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 40,
  standardHeaders: true,
  legacyHeaders: false,
  validate: proxyValidation,
  message: {
    success: false,
    message: 'Action rate limit exceeded. Please wait before submitting more requests.'
  }
});

/**
 * Upload Limiter (Anti-Storage Exhaustion & Bandwidth Flooding)
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: proxyValidation,
  message: {
    success: false,
    message: 'Upload quota reached for this window. Please wait before uploading more files.'
  }
});
