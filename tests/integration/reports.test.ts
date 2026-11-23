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

const createTx = (token: string, payload: Record<string, unknown>) =>
  request(app)
    .post('/api/transactions/manual')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

describe('Reports — integration', () => {
  let token: string;

  beforeEach(async () => {
    token = await registerUser('reports@example.com');

    await createTx(token, {
      amount: 5000,
      type: 'debit',
      merchant: 'SPAR',
      category: 'groceries',
      date: '2026-09-05',
    });
    await createTx(token, {
      amount: 3000,
      type: 'debit',
      merchant: 'UBER',
      category: 'transport',
      date: '2026-09-10',
    });
    await createTx(token, {
      amount: 20000,
      type: 'credit',
      merchant: 'SALARY',
      category: 'other',
      date: '2026-09-01',
    });
  });

  describe('GET /api/reports/monthly', () => {
    it('returns a combined report', async () => {
      const res = await request(app)
        .get('/api/reports/monthly?month=2026-09')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.month).toBe('2026-09');
      expect(res.body.data.summary.totalSpent).toBe(8000);
      expect(res.body.data.summary.totalEarned).toBe(20000);
      expect(res.body.data.categoryBreakdown.length).toBe(2);
      expect(res.body.data.topMerchants.length).toBeLessThanOrEqual(3);
      expect(res.body.data.generatedAt).toBeDefined();
    });

    it('rejects invalid month format', async () => {
      const res = await request(app)
        .get('/api/reports/monthly?month=2026')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/reports/export/csv', () => {
    it('returns CSV with correct headers and content', async () => {
      const res = await request(app)
        .get('/api/reports/export/csv?startDate=2026-09-01&endDate=2026-09-30')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment; filename=/);

      const lines = res.text.split('\n');
      expect(lines[0]).toBe('date,merchant,category,type,amount,bank,channel');
      expect(lines.length).toBeGreaterThanOrEqual(4); // header + 3 rows
    });

    it('filters CSV by category', async () => {
      const res = await request(app)
        .get('/api/reports/export/csv?category=groceries')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const lines = res.text.split('\n').filter(Boolean);
      // header + 1 row
      expect(lines.length).toBe(2);
      expect(lines[1]).toContain('groceries');
      expect(lines[1]).toContain('SPAR');
    });

    it('exports empty CSV when no transactions match filters', async () => {
      const res = await request(app)
        .get('/api/reports/export/csv?startDate=2020-01-01&endDate=2020-01-31')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const lines = res.text.split('\n').filter(Boolean);
      expect(lines.length).toBe(1); // header only
    });
  });
});