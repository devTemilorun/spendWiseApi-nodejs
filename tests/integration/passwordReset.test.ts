import request from 'supertest';
import app from '../../src/app';

describe('Password Reset — integration', () => {
  const validUser = {
    name: 'Reset User',
    email: 'reset@example.com',
    password: 'secret123',
  };

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser);
  });

  describe('POST /api/auth/forgot-password', () => {
    it('returns devToken in non-production', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validUser.email });

      expect(res.status).toBe(200);
      expect(res.body.data.devToken).toBeDefined();
      expect(res.body.data.devToken.length).toBeGreaterThan(20);
    });

    it('returns success even for unknown email (no enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.data.devToken).toBeUndefined();
    });

    it('rejects invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('resets the password with a valid token', async () => {
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validUser.email });

      const token = forgotRes.body.data.devToken;

      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, newPassword: 'newsecret456' });

      expect(resetRes.status).toBe(200);

      // Old password no longer works
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(oldLogin.status).toBe(401);

      // New password works
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'newsecret456' });
      expect(newLogin.status).toBe(200);
    });

    it('rejects an invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'a'.repeat(64), newPassword: 'newsecret456' });
      expect(res.status).toBe(400);
    });

    it('rejects reused token (already consumed)', async () => {
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validUser.email });
      const token = forgotRes.body.data.devToken;

      await request(app)
        .post('/api/auth/reset-password')
        .send({ token, newPassword: 'firstnew456' });

      const reused = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, newPassword: 'secondnew789' });

      expect(reused.status).toBe(400);
    });

    it('rejects short new password', async () => {
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: validUser.email });
      const token = forgotRes.body.data.devToken;

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, newPassword: '123' });
      expect(res.status).toBe(400);
    });
  });
});

