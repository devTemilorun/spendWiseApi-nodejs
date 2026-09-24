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


import {
  parseFirstBank,
  parseOpay,
  parseKuda,
  parseMoniepoint,
  detectBank,
  parseSms,
} from '../../src/services/smsParser.service';

describe('SMS Parser — FirstBank', () => {
  it('parses a FirstBank debit alert', () => {
    const sms =
      'FirstBank: Your A/C ...1234 has been debited with NGN3,000.00. Available Bal:NGN45,000.00. Desc: USSD/TRANSFER';
    const result = parseFirstBank(sms);

    expect(result.bank).toBe('FirstBank');
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(3000);
    expect(result.parseFailed).toBe(false);
  });

  it('parses a FirstBank credit alert', () => {
    const sms =
      'FirstBank: Your A/C ...1234 has been credited with NGN20,000.00. Desc: SALARY';
    const result = parseFirstBank(sms);

    expect(result.type).toBe('credit');
    expect(result.amount).toBe(20000);
  });
});

describe('SMS Parser — Opay', () => {
  it('parses an Opay debit alert', () => {
    const sms =
      'Opay: Debit Alert! NGN2,500 has been deducted from your wallet for Payment to NETFLIX';
    const result = parseOpay(sms);

    expect(result.bank).toBe('Opay');
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(2500);
    expect(result.parseFailed).toBe(false);
  });

  it('parses an Opay credit alert', () => {
    const sms =
      'Opay: Credit Alert! NGN5,000 has been credited to your wallet from JOHN DOE';
    const result = parseOpay(sms);

    expect(result.type).toBe('credit');
    expect(result.amount).toBe(5000);
  });
});

describe('SMS Parser — Kuda', () => {
  it('parses a Kuda debit alert', () => {
    const sms =
      'Kuda: You spent NGN1,200.00 at UBER at 14:32 on 19-Sep-2026';
    const result = parseKuda(sms);

    expect(result.bank).toBe('Kuda');
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(1200);
    expect(result.merchant).toContain('UBER');
  });

  it('parses a Kuda credit alert', () => {
    const sms = 'Kuda: You received NGN15,000.00 from JANE SMITH';
    const result = parseKuda(sms);

    expect(result.type).toBe('credit');
    expect(result.amount).toBe(15000);
  });
});

describe('SMS Parser — Moniepoint', () => {
  it('parses a Moniepoint debit alert', () => {
    const sms =
      'Moniepoint: A debit of NGN8,000.00 was made on your account. Narration: POS/MARKET SQUARE';
    const result = parseMoniepoint(sms);

    expect(result.bank).toBe('Moniepoint');
    expect(result.type).toBe('debit');
    expect(result.amount).toBe(8000);
    expect(result.parseFailed).toBe(false);
  });

  it('parses a Moniepoint credit alert', () => {
    const sms =
      'Moniepoint: A credit of NGN30,000.00 was made on your account. Narration: TRANSFER';
    const result = parseMoniepoint(sms);

    expect(result.type).toBe('credit');
    expect(result.amount).toBe(30000);
  });
});

describe('detectBank — dispatcher routing', () => {
  it('detects GTB', () => {
    expect(detectBank('GTBank: Debit Amt:NGN1,000')).toBe('GTB');
  });

  it('detects Access', () => {
    expect(detectBank('Access Bank: A debit of NGN500')).toBe('Access');
  });

  it('detects UBA', () => {
    expect(detectBank('UBA: Your account has been debited')).toBe('UBA');
  });

  it('detects FirstBank', () => {
    expect(detectBank('FirstBank: Your A/C has been debited')).toBe('FirstBank');
  });

  it('detects Opay', () => {
    expect(detectBank('Opay: Debit Alert! NGN2,500')).toBe('Opay');
  });

  it('detects Kuda', () => {
    expect(detectBank('Kuda: You spent NGN1,200')).toBe('Kuda');
  });

  it('detects Moniepoint', () => {
    expect(detectBank('Moniepoint: A debit of NGN8,000')).toBe('Moniepoint');
  });

  it('returns null for unknown SMS', () => {
    expect(detectBank('Random message from an unknown sender')).toBeNull();
  });
});

describe('parseSms — full dispatcher', () => {
  it('routes GTB SMS to the GTB parser and returns success', () => {
    const sms =
      'GTBank: Acct:****1234 Debit Amt:NGN4,500.00 on 19-Sep-2026 Desc:USSD/TRANSFER';
    const result = parseSms(sms);

    expect(result.success).toBe(true);
    expect(result.bank).toBe('GTB');
    expect(result.data?.amount).toBe(4500);
  });

  it('routes Opay SMS to the Opay parser', () => {
    const sms =
      'Opay: Debit Alert! NGN2,500 has been deducted from your wallet for Payment to NETFLIX';
    const result = parseSms(sms);

    expect(result.success).toBe(true);
    expect(result.bank).toBe('Opay');
    expect(result.data?.amount).toBe(2500);
  });

  it('returns failure when bank is unknown', () => {
    const result = parseSms('Hello, this is not a bank SMS');

    expect(result.success).toBe(false);
    expect(result.bank).toBeNull();
    expect(result.error).toBeTruthy();
  });
});