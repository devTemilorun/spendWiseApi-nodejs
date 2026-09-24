export type SupportedBank =
  | 'GTB'
  | 'Access'
  | 'UBA'
  | 'FirstBank'
  | 'Opay'
  | 'Kuda'
  | 'Moniepoint';

export interface ParsedSms {
  amount: number | null;
  type: 'debit' | 'credit' | null;
  merchant: string | null;
  bank: SupportedBank | null;
  date: Date | null;
  parseFailed: boolean;
  rawSms: string;
}

export interface ParseResult {
  success: boolean;
  bank: SupportedBank | null;
  data: ParsedSms | null;
  error?: string;
}