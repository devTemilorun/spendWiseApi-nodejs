import crypto from 'crypto';


export const hashSms = (rawSms: string, userId: string): string => {
  const normalized = rawSms.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto
    .createHash('sha256')
    .update(`${normalized}|${userId}`)
    .digest('hex');
};