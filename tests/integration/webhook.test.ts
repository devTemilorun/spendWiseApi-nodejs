import request from 'supertest';
import app from '../../src/app';
import { env } from '../../src/config/env';

const FORWARDING_NUMBER = '08099990000';

const setupUserWithNumber = async (email: string) => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test',
    email,
    password: 'secret123',
  });
  const token = res.body.data.accessToken as string;

  await request(app)
    .put('/api/users/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ smsForwardingNumber: FORWARDING_NUMBER });

  return token;
};

const postWebhook = (payload: Record<string, unknown>, secret?: string) => {
  const req = request(app).post('/api/sms/webhook').send(payload);
  if (secret) req.set('x-webhook-secret', secret);
  return req;
};

describe('SMS Webhook — integration', () => {
  let token: string;

  beforeEach(async () => {
    token = await setupUserWithNumber('wh@example.com');
  });

  it('rejects requests with missing or wrong shared secret', async () => {
    const noSecret = await postWebhook({
      from: 'GTBank',
      to: FORWARDING_NUMBER,
      text: 'GTBank: Debit Amt:NGN1,000.00 Desc:POS/SPAR',
    });
    expect(noSecret.status).toBe(401);

    const wrongSecret = await postWebhook(
      {
        from: 'GTBank',
        to: FORWARDING_NUMBER,
        text: 'GTBank: Debit Amt:NGN1,000.00 Desc:POS/SPAR',
      },
      'nope'
    );
    expect(wrongSecret.status).toBe(401);
  });

  it('returns 200 with ignored status when payload is malformed', async () => {
    const res = await postWebhook(
      { from: 'GTBank' }, // missing "to" and "text"
      env.SMS_WEBHOOK_SECRET
    );
    expect(res.status).toBe(200);
    expect(res.body.status).toBeUndefined();
  });

  it('returns 200 with ignored status when no user owns the number', async () => {
    const res = await postWebhook(
      {
        from: 'GTBank',
        to: '08000000000', // not registered
        text: 'GTBank: Debit Amt:NGN1,000.00 Desc:POS/SPAR',
      },
      env.SMS_WEBHOOK_SECRET
    );
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ignored');
  });

  it('parses and saves a valid SMS', async () => {
    const res = await postWebhook(
      {
        from: 'GTBank',
        to: FORWARDING_NUMBER,
        text:
          'GTBank: Acct:****1234 Debit Amt:NGN4,500.00 on 19-Sep-2026 Desc:POS/SPAR SHOPRITE',
      },
      env.SMS_WEBHOOK_SECRET
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('saved');
    expect(res.body.transactionId).toBeDefined();

    // Verify transaction exists for the user
    const listRes = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.items.length).toBe(1);
    expect(listRes.body.data.items[0].amount).toBe(4500);
    expect(listRes.body.data.items[0].channel).toBe('webhook');
    expect(listRes.body.data.items[0].category).toBe('groceries');
  });

  it('detects duplicate SMS via hash', async () => {
    const payload = {
      from: 'GTBank',
      to: FORWARDING_NUMBER,
      text:
        'GTBank: Acct:****1234 Debit Amt:NGN4,500.00 on 19-Sep-2026 Desc:POS/SPAR',
    };

    const first = await postWebhook(payload, env.SMS_WEBHOOK_SECRET);
    expect(first.body.status).toBe('saved');

    const second = await postWebhook(payload, env.SMS_WEBHOOK_SECRET);
    expect(second.status).toBe(200);
    expect(second.body.status).toBe('duplicate');

    // Only one transaction persisted
    const listRes = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.items.length).toBe(1);
  });

  it('returns 200 with parse_failed status for non-bank SMS', async () => {
    const res = await postWebhook(
      {
        from: 'Unknown',
        to: FORWARDING_NUMBER,
        text: 'Hello, this is not a bank alert at all',
      },
      env.SMS_WEBHOOK_SECRET
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('parse_failed');
  });
});