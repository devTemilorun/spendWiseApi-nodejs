//  Normalize amount string to number.
export const parseAmount = (input: string): number | null => {
  if (!input) return null;
  const cleaned = input.replace(/[₦N,ngnNGN\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
};

//   Detect debit vs credit from common keywords.
export const detectTransactionType = (
  text: string
): 'debit' | 'credit' | null => {
  const upper = text.toUpperCase();
  if (/\b(DEBIT|DEBITED|DR|WITHDRAWAL|SPENT|DEDUCTED|PAYMENT TO)\b/.test(upper)) {
    return 'debit';
  }
  if (/\b(CREDIT|CREDITED|CR|DEPOSIT|RECEIVED|REFUND|PAYMENT FROM)\b/.test(upper)) {
    return 'credit';
  }
  return null;
};

//  Extract merchant 

export const extractMerchant = (text: string): string | null => {
  const patterns = [
    /Desc(?:ription)?:\s*([^.\n]+)/i,
    /Narration:\s*([^.\n]+)/i,
    /for Payment to\s+([^.\n]+)/i,
    /\bat\s+([A-Z][A-Z0-9&\-\s]{2,40})(?:\s+at|\s+on|\.|$)/,
    /(?:from|to)\s+([A-Z][A-Z0-9&\-\s]{2,40})(?:\s+at|\s+on|\.|$)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().toUpperCase();
    }
  }
  return null;
};


//   Parse date from common alert formats.

export const extractDate = (text: string): Date => {
  const dashMonthMatch = text.match(
    /(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{2,4})/
  );
  if (dashMonthMatch) {
    const [, day, mon, year] = dashMonthMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const parsed = new Date(`${mon} ${day}, ${fullYear}`);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const numericMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (numericMatch) {
    const [, day, mon, year] = numericMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const parsed = new Date(Number(fullYear), Number(mon) - 1, Number(day));
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
};