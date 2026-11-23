import request from 'supertest';
import app from '../../src/app';

const registerUser = async (email: string) => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email,
    password: 'secret123',
  });
  return res.body.data.accessToken as string;
};

describe('Users — integration', () => {
  describe('GET /api/users/me', () => {
    it('returns the authenticated user profile', async () => {
      const token = await registerUser('me@example.com');
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('me@example.com');
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.refreshTokenHash).toBeUndefined();
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('updates name, phone, and monthlyIncome', async () => {
      const token = await registerUser('update@example.com');

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          phone: '08099998888',
          monthlyIncome: 500000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
      expect(res.body.data.phone).toBe('08099998888');
      expect(res.body.data.monthlyIncome).toBe(500000);
    });

    it('rejects invalid payload', async () => {
      const token = await registerUser('bad@example.com');
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ monthlyIncome: -100 });

      expect(res.status).toBe(400);
    });

    it('rejects duplicate smsForwardingNumber', async () => {
      const tokenA = await registerUser('a@example.com');
      const tokenB = await registerUser('b@example.com');

      await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ smsForwardingNumber: '08011111111' });

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ smsForwardingNumber: '08011111111' });

      expect(res.status).toBe(409);
    });
  });

  describe('Bank linking', () => {
    it('links and unlinks a bank', async () => {
      const token = await registerUser('bank@example.com');

      const linkRes = await request(app)
        .post('/api/users/link-bank')
        .set('Authorization', `Bearer ${token}`)
        .send({ bank: 'GTB' });

      expect(linkRes.status).toBe(200);
      expect(linkRes.body.data.linkedBanks).toContain('GTB');

      const unlinkRes = await request(app)
        .delete('/api/users/link-bank/GTB')
        .set('Authorization', `Bearer ${token}`);

      expect(unlinkRes.status).toBe(200);
      expect(unlinkRes.body.data.linkedBanks).not.toContain('GTB');
    });

    it('is idempotent when linking same bank twice', async () => {
      const token = await registerUser('idem@example.com');

      await request(app)
        .post('/api/users/link-bank')
        .set('Authorization', `Bearer ${token}`)
        .send({ bank: 'GTB' });
      const res = await request(app)
        .post('/api/users/link-bank')
        .set('Authorization', `Bearer ${token}`)
        .send({ bank: 'GTB' });

      expect(res.status).toBe(200);
      expect(
        res.body.data.linkedBanks.filter((b: string) => b === 'GTB').length
      ).toBe(1);
    });
  });

  describe('DELETE /api/users/me', () => {
    it('deletes the user and all their data', async () => {
      const token = await registerUser('delete@example.com');

      // Create some data first
      await request(app)
        .post('/api/transactions/manual')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1000, type: 'debit', merchant: 'TEST' });
      await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({ category: 'groceries', monthlyLimit: 5000, month: '2026-09' });

      const delRes = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${token}`);
      expect(delRes.status).toBe(200);

      // Token should no longer work — user is gone
      const afterRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);
      expect(afterRes.status).toBe(401);
    });
  });
});