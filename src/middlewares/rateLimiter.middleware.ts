import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';


const userOrIpKey = (req: Request): string => {
  const userId = (req as Request & { user?: { userId: string } }).user?.userId;
  if (userId) return `u:${userId}`;
  return `ip:${ipKeyGenerator(req.ip ?? '')}`;
};

export const smsParseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,  
  message: { success: false, message: 'Too many parse requests' },

});

export const bulkImportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
    message: { success: false, message: 'Too many bulk import requests' },

});

export const smsWebhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many webhook requests' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, 
  message: {
    success: false,
    message: 'Too many attempts. Try again in 15 minutes.',
  },
});