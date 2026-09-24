import { ParsedSms, SupportedBank, ParseResult } from '../types/sms.types';

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

// FirstBank
export const parseFirstBank = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    /(?:debited|credited)\s+with\s+NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const fallbackMatch = sms.match(
    /(?:Debit|Credit)\s*:?\s*NGN?([\d,]+(?:\.\d{1,2})?)/i
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
    bank: 'FirstBank',
    date: extractDate(sms),
    parseFailed: amount === null,
    rawSms: sms,
  };
};

// Opay
export const parseOpay = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    /NGN?([\d,]+(?:\.\d{1,2})?)\s+has\s+been\s+(?:deducted|credited)/i
  );

  const fallbackMatch = sms.match(
    /(?:Debit|Credit)\s+Alert!?\s*NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const receivedMatch = sms.match(
    /(?:received|paid|sent)\s+NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const amount = primaryMatch
    ? parseAmount(primaryMatch[1])
    : fallbackMatch
      ? parseAmount(fallbackMatch[1])
      : receivedMatch
        ? parseAmount(receivedMatch[1])
        : null;

  return {
    amount,
    type: detectTransactionType(sms),
    merchant: extractMerchant(sms),
    bank: 'Opay',
    date: extractDate(sms),
    parseFailed: amount === null,
    rawSms: sms,
  };
};

// Kuda
export const parseKuda = (sms: string): ParsedSms => {
  const spentMatch = sms.match(
    /You\s+spent\s+NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const receivedMatch = sms.match(
    /You\s+received\s+NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const debitedMatch = sms.match(
    /NGN?([\d,]+(?:\.\d{1,2})?)\s+was\s+(?:debited|credited)/i
  );

  const amount = spentMatch
    ? parseAmount(spentMatch[1])
    : receivedMatch
      ? parseAmount(receivedMatch[1])
      : debitedMatch
        ? parseAmount(debitedMatch[1])
        : null;

  return {
    amount,
    type: detectTransactionType(sms),
    merchant: extractMerchant(sms),
    bank: 'Kuda',
    date: extractDate(sms),
    parseFailed: amount === null,
    rawSms: sms,
  };
};

// Moniepoint
export const parseMoniepoint = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    /A\s+(?:debit|credit)\s+of\s+NGN?([\d,]+(?:\.\d{1,2})?)/i
  );

  const fallbackMatch = sms.match(
    /(?:Debit|Credit)\s*:?\s*NGN?([\d,]+(?:\.\d{1,2})?)/i
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
    bank: 'Moniepoint',
    date: extractDate(sms),
    parseFailed: amount === null,
    rawSms: sms,
  };
};


// detectBank — identifies the bank from SMS content or sender ID
export const detectBank = (
  sms: string,
  senderId?: string
): SupportedBank | null => {
  const haystack = `${sms} ${senderId ?? ''}`.toUpperCase();

  const rules: Array<{ bank: SupportedBank; patterns: RegExp[] }> = [
    {
      bank: 'GTB',
      patterns: [/GTBANK/i, /\bGTB\b/i, /GUARANTY\s+TRUST/i, /GUARANTY\s+BANK/i],
    },
    {
      bank: 'Access',
      patterns: [/ACCESS\s+BANK/i, /\bACCESSBANK\b/i, /ACCESS\s+DIAMOND/i],
    },
    {
      bank: 'UBA',
      patterns: [/\bUBA\b/i, /UNITED\s+BANK\s+FOR\s+AFRICA/i],
    },
    {
      bank: 'FirstBank',
      patterns: [/FIRST\s*BANK/i, /FIRSTBANK/i, /FIRST\s+BANK\s+OF\s+NIGERIA/i],
    },
    {
      bank: 'Opay',
      patterns: [/\bOPAY\b/i, /OPAY\s+WALLET/i],
    },
    {
      bank: 'Kuda',
      patterns: [/\bKUDA\b/i, /KUDA\s+BANK/i, /KUDA\s+MFB/i],
    },
    {
      bank: 'Moniepoint',
      patterns: [/MONIEPOINT/i, /MONIE\s*POINT/i, /TEAM\s+MONIEPOINT/i],
    },
  ];

  for (const rule of rules) {
    if (rule.patterns.some((p) => p.test(haystack))) {
      return rule.bank;
    }
  }

  return null;
};




// parseSms — main dispatcher
export const parseSms = (sms: string, senderId?: string): ParseResult => {
  const bank = detectBank(sms, senderId);

  if (!bank) {
    return {
      success: false,
      bank: null,
      data: null,
      error: 'Could not detect bank from SMS',
    };
  }

  const parserMap: Record<SupportedBank, (sms: string) => ParsedSms> = {
    GTB: parseGTB,
    Access: parseAccess,
    UBA: parseUBA,
    FirstBank: parseFirstBank,
    Opay: parseOpay,
    Kuda: parseKuda,
    Moniepoint: parseMoniepoint,
  };

  const parser = parserMap[bank];
  const parsed = parser(sms);

  if (parsed.parseFailed || parsed.amount === null) {
    return {
      success: false,
      bank,
      data: parsed,
      error: 'Failed to extract amount from SMS',
    };
  }

  return {
    success: true,
    bank,
    data: parsed,
  };
};