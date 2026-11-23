import { ParsedSms, SupportedBank, ParseResult } from '../types/sms.types';

import {
  parseAmount,
  detectTransactionType,
  extractMerchant,
  extractDate,
} from '../utils/smsHelpers';

// ---------- Regex helpers ----------
// All amount captures follow the same pattern:
//   NGN 14,200.00   NGN14,200.00   N14,200.00   ₦14,200.00
// → (?:NGN|N|₦)?\s*([\d,]+(?:\.\d{1,2})?)
// The `\s*` after the currency token is what was missing everywhere.

const AMOUNT_TAIL = String.raw`(?:NGN|N|₦)?\s*([\d,]+(?:\.\d{1,2})?)`;

// ---------- GTB ----------
export const parseGTB = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    new RegExp(`(?:Debit|Credit)\\s+Amt\\s*:?\\s*${AMOUNT_TAIL}`, 'i')
  );

  const fallbackMatch = sms.match(
    new RegExp(`(?:Amt|Amount)\\s*:?\\s*${AMOUNT_TAIL}`, 'i')
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

// ---------- Access ----------
export const parseAccess = (sms: string): ParsedSms => {
  const amountMatch = sms.match(
    new RegExp(`(?:debit|credit)\\s+of\\s+${AMOUNT_TAIL}`, 'i')
  );

  const alertMatch = sms.match(
    new RegExp(`(?:Debit|Credit)\\s+Alert\\s*:?\\s*${AMOUNT_TAIL}`, 'i')
  );

  // "Acct: XXXX ... Amt: NGN 15,000.00 Dr" — Access signature without the bank name
  const bareAmtMatch = sms.match(
    new RegExp(`(?:Amt|Amount)\\s*:?\\s*${AMOUNT_TAIL}`, 'i')
  );

  const amount = amountMatch
    ? parseAmount(amountMatch[1])
    : alertMatch
      ? parseAmount(alertMatch[1])
      : bareAmtMatch
        ? parseAmount(bareAmtMatch[1])
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

// ---------- UBA ----------
export const parseUBA = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    new RegExp(`(?:debited|credited)\\s+with\\s+${AMOUNT_TAIL}`, 'i')
  );

  const fallbackMatch = sms.match(
    new RegExp(`(?:Debit|Credit)\\s*:?\\s*${AMOUNT_TAIL}`, 'i')
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

// ---------- FirstBank ----------
export const parseFirstBank = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    new RegExp(`(?:debited|credited)\\s+with\\s+${AMOUNT_TAIL}`, 'i')
  );

  const fallbackMatch = sms.match(
    new RegExp(`(?:Debit|Credit)\\s*:?\\s*${AMOUNT_TAIL}`, 'i')
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

// ---------- Opay ----------
export const parseOpay = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    new RegExp(`${AMOUNT_TAIL}\\s+has\\s+been\\s+(?:deducted|credited)`, 'i')
  );

  const fallbackMatch = sms.match(
    new RegExp(`(?:Debit|Credit)\\s+Alert!?\\s*:?\\s*${AMOUNT_TAIL}`, 'i')
  );

  const receivedMatch = sms.match(
    new RegExp(`(?:received|paid|sent)\\s+${AMOUNT_TAIL}`, 'i')
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

// ---------- Kuda ----------
export const parseKuda = (sms: string): ParsedSms => {
  const spentMatch = sms.match(
    new RegExp(`You\\s+spent\\s+${AMOUNT_TAIL}`, 'i')
  );

  const receivedMatch = sms.match(
    new RegExp(`You\\s+received\\s+${AMOUNT_TAIL}`, 'i')
  );

  const debitedMatch = sms.match(
    new RegExp(`${AMOUNT_TAIL}\\s+was\\s+(?:debited|credited)`, 'i')
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

// ---------- Moniepoint ----------
export const parseMoniepoint = (sms: string): ParsedSms => {
  const primaryMatch = sms.match(
    new RegExp(`A\\s+(?:debit|credit)\\s+of\\s+${AMOUNT_TAIL}`, 'i')
  );

  const fallbackMatch = sms.match(
    new RegExp(`(?:Debit|Credit)\\s*:?\\s*${AMOUNT_TAIL}`, 'i')
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

// ---------- detectBank ----------
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
      patterns: [
        /ACCESS\s+BANK/i,
        /\bACCESSBANK\b/i,
        /ACCESS\s+DIAMOND/i,
        /\bACCESS\b/i, // SMS that starts with "Access:"
      ],
    },
    {
      bank: 'UBA',
      patterns: [/\bUBA\b/i, /UNITED\s+BANK\s+FOR\s+AFRICA/i],
    },
    {
      bank: 'FirstBank',
      patterns: [/FIRST\s*BANK/i, /FIRSTBANK/i, /FIRST\s+BANK\s+OF\s+NIGERIA/i, /\bFBN\b/i],
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

  // Fallback heuristics for SMS that don't print the bank name:
  // "Acct: XXXX ... Amt: NGN 15,000.00 Dr" — Access signature
  if (/\bAC(?:CT)?\s*[:.]?\s*\d/i.test(haystack) && /\bDR\b/i.test(haystack)) {
    return 'Access';
  }

  return null;
};

// ---------- parseSms ----------
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