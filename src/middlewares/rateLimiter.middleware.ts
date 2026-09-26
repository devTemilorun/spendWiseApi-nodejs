import rateLimit from 'express-rate-limit';

export const smsWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many webhook requests' },
});

export const smsParseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many parse requests' },
});

export const bulkImportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many bulk import requests' },
});