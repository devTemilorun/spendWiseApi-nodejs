import request from 'supertest';
import app from '../../src/app';

const registerUser = async (email: string) => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test',
    email,
    password: 'secret123',
  });
  return res.body.data.accessToken as string;
};

const bulkImport = (token: string, smsMessages: string[]) =>
  request(app)
    .post('/api/transactions/bulk')
    .set('Authorization', `Bearer ${token}`)
    .send({ smsMessages });

describe('Bulk Import — integration', () => {
  let token: string;

  beforeEach(async () => {
    token = await registerUser('bulk@example.com');
  });

  it('imports multiple valid SMS in one call', async () => {
    const res = await bulkImport(token, [
      'GTBank: Acct:****1234 Debit Amt:NGN1,500.00 on 19-Sep-2026 Desc:POS/SPAR',
      'Access Bank: A debit of NGN2,500.00 occurred on 18-Sep-2026. Desc: POS/UBER',
      'UBA: Your account ****5678 has been debited with NGN3,000.00 on 17-Sep-2026. Desc: ATM WITHDRAWAL',
    ]);

    expect(res.status).toBe(201);
    expect(res.body.data.imported).toBe(3);
    expect(res.body.data.duplicates).toBe(0);
    expect(res.body.data.failed).toBe(0);
  });

  it('skips duplicates and continues processing the rest', async () => {
    const firstSms =
      'GTBank: Acct:****1234 Debit Amt:NGN1,500.00 on 19-Sep-2026 Desc:POS/SPAR';

    // First import
    await bulkImport(token, [firstSms]);

    // Second import — contains the same SMS + a new one
    const res = await bulkImport(token, [
      firstSms,
      'UBA: Your account ****5678 has been debited with NGN500.00 Desc:POS',
    ]);

    expect(res.status).toBe(201);
    expect(res.body.data.imported).toBe(1);
    expect(res.body.data.duplicates).toBe(1);
  });

  it('marks unparseable SMS as failed and still imports valid ones', async () => {
    const res = await bulkImport(token, [
      'GTBank: Acct:****1234 Debit Amt:NGN1,500.00 on 19-Sep-2026 Desc:POS/SPAR',
      'Hello this is not a bank alert',
    ]);

    expect(res.status).toBe(201);
    expect(res.body.data.imported).toBe(1);
    expect(res.body.data.failed).toBe(1);
    expect(res.body.data.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'imported' }),
        expect.objectContaining({ status: 'failed' }),
      ])
    );
  });

  it('rejects empty arrays', async () => {
    const res = await bulkImport(token, []);
    expect(res.status).toBe(400);
  });

  it('rejects arrays over 100 items', async () => {
    const smsMessages = Array.from({ length: 101 }, () =>
      'GTBank: Debit Amt:NGN100.00 Desc:TEST'
    );
    const res = await bulkImport(token, smsMessages);
    expect(res.status).toBe(400);
  });

  it('scopes imports to the authenticated user only', async () => {
    const tokenB = await registerUser('other@example.com');

    await bulkImport(token, [
      'GTBank: Debit Amt:NGN1,500.00 Desc:POS/SPAR',
    ]);

    const listB = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(listB.body.data.items.length).toBe(0);
  });
});