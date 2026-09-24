import {
  parseGTB,
  parseAccess,
  parseUBA,
} from '../../src/services/smsParser.service';

describe('SMS Parser — GTB', () => {
  it('parses a standard GTB debit alert', () => {
    const sms =
      'GTBank: Acct:****1234 Debit Amt:NGN4,500.00 on 19-Sep-2026 14:32 Desc:USSD/TRANSFER Bal:NGN45,000.00';
    const result = parseGTB(sms);

    expect(result.bank).toBe('GTB');
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(4500);
    expect(result.parseFailed).toBe(false);
    expect(result.merchant).toBeTruthy();
  });

  it('parses a GTB credit alert', () => {
    const sms =
      'GTBank: Acct:****1234 Credit Amt:NGN10,000.00 on 19-Sep-2026 Desc:TRANSFER FROM JOHN DOE';
    const result = parseGTB(sms);

    expect(result.type).toBe('credit');
    expect(result.amount).toBe(10000);
    expect(result.parseFailed).toBe(false);
  });

  it('flags parseFailed when no amount is present', () => {
    const sms = 'GTBank: Welcome to GTBank. Enjoy our services.';
    const result = parseGTB(sms);

    expect(result.amount).toBeNull();
    expect(result.parseFailed).toBe(true);
  });

  it('handles amounts with decimals', () => {
    const sms =
      'GTBank: Debit Amt:NGN1,234.56 on 19-Sep-2026 Desc:POS PURCHASE';
    const result = parseGTB(sms);

    expect(result.amount).toBe(1234.56);
  });
});

describe('SMS Parser — Access', () => {
  it('parses a standard Access debit alert', () => {
    const sms =
      'Access Bank: A debit of NGN7,500.00 occurred on your account on 19-Sep-2026. Desc: POS/MARKET SQUARE. Avail Bal: NGN120,000.00';
    const result = parseAccess(sms);

    expect(result.bank).toBe('Access');
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(7500);
    expect(result.parseFailed).toBe(false);
  });

  it('parses an Access credit alert', () => {
    const sms =
      'Access Bank: A credit of NGN25,000.00 occurred on your account. Desc: TRANSFER FROM JANE DOE';
    const result = parseAccess(sms);

    expect(result.type).toBe('credit');
    expect(result.amount).toBe(25000);
  });
});

describe('SMS Parser — UBA', () => {
  it('parses a standard UBA debit alert', () => {
    const sms =
      'UBA: Your account ****5678 has been debited with NGN12,000.00 on 19-Sep-2026. Desc: ATM WITHDRAWAL. Bal: NGN88,000.00';
    const result = parseUBA(sms);

    expect(result.bank).toBe('UBA');
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(12000);
    expect(result.parseFailed).toBe(false);
  });

  it('parses a UBA credit alert', () => {
    const sms =
      'UBA: Your account ****5678 has been credited with NGN50,000.00. Desc: SALARY PAYMENT';
    const result = parseUBA(sms);

    expect(result.type).toBe('credit');
    expect(result.amount).toBe(50000);
  });

  it('handles UBA format with N instead of NGN', () => {
    const sms =
      'UBA: Your account ****5678 has been debited with N8,500.00. Desc: POS';
    const result = parseUBA(sms);

    expect(result.amount).toBe(8500);
  });
});