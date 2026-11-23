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

describe('Transaction — integration', () => {
  it('creates a manual transaction', async () => {
    const token = await registerUser('a@example.com');
    const res = await request(app)
      .post('/api/transactions/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 4500,
        type: 'debit',
        bank: 'GTB',
        merchant: 'SPAR',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(4500);
  });

  it('user A never sees user B transactions (cross-user isolation)', async () => {
    const tokenA = await registerUser('a@example.com');
    const tokenB = await registerUser('b@example.com');

    // Create 2 transactions for A
    await request(app)
      .post('/api/transactions/manual')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 100, type: 'debit', merchant: 'A1' });
    await request(app)
      .post('/api/transactions/manual')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 200, type: 'debit', merchant: 'A2' });

    // Create 1 for B
    await request(app)
      .post('/api/transactions/manual')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 999, type: 'debit', merchant: 'B1' });

    const listA = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`);
    const listB = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(listA.body.data.items.length).toBe(2);
    expect(listB.body.data.items.length).toBe(1);
    expect(listA.body.data.items.every((t: any) => t.merchant !== 'B1')).toBe(true);
    expect(listB.body.data.items.every((t: any) => t.merchant !== 'A1')).toBe(true);
  });

  it('user B cannot fetch, update, or delete user A transaction', async () => {
    const tokenA = await registerUser('a@example.com');
    const tokenB = await registerUser('b@example.com');

    const created = await request(app)
      .post('/api/transactions/manual')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 100, type: 'debit', merchant: 'A1' });

    const id = created.body.data._id;

    const getRes = await request(app)
      .get(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(getRes.status).toBe(404);

    const putRes = await request(app)
      .put(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 9999 });
    expect(putRes.status).toBe(404);

    const delRes = await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(delRes.status).toBe(404);
  });
});