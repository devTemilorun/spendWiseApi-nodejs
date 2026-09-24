import { ParsedSms, SupportedBank } from '../types/sms.types';
import {
  parseAmount,
  detectTransactionType,
  extractMerchant,
  extractDate,
} from '../utils/smsHelpers';

// GTB
export const parseGTB = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    /(?:Debit|Credit)\s+Amt\s*:?\s*NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const fallbackMatch = sms.match(
    /(?:Amt|Amount)\s*:?\s*NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const amount = primaryMatch
    ? parseAmount(primaryMatch[1])
    : fallbackMatch
      ? parseAmount(fallbackMatch[1])
      : null;

  return {
    amount,
    type: detectTransactionType(sms),
    merchant: extractMerchant(sms),
    bank: 'GTB',
    date: extractDate(sms),
    parseFailed: amount === null,
    rawSms: sms,
  };
};

// Access Bank
export const parseAccess = (sms: string): ParsedSms => {
  const amountMatch = sms.match(
    /(?:debit|credit)\s+of\s+NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const fallbackMatch = sms.match(
    /(?:Debit|Credit)\s+Alert\s*:?\s*NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const amount = amountMatch
    ? parseAmount(amountMatch[1])
    : fallbackMatch
      ? parseAmount(fallbackMatch[1])
      : null;

  return {
    amount,
    type: detectTransactionType(sms),
    merchant: extractMerchant(sms),
    bank: 'Access',
    date: extractDate(sms),
    parseFailed: amount === null,
    rawSms: sms,
  };
};

// UBA 
export const parseUBA = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    /(?:debited|credited)\s+with\s+NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const fallbackMatch = sms.match(
    /(?:debited|credited)\s+with\s+[N₦]([\d,]+(?:\.\d{1,2})?)/i
  );

  const amount = primaryMatch
    ? parseAmount(primaryMatch[1])
    : fallbackMatch
      ? parseAmount(fallbackMatch[1])
      : null;

  return {
    amount,
    type: detectTransactionType(sms),
    merchant: extractMerchant(sms),
    bank: 'UBA',
    date: extractDate(sms),
    parseFailed: amount === null,
    rawSms: sms,
  };
};