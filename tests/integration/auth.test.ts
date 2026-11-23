import request from 'supertest';
import app from '../../src/app';

describe('Auth — integration', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'secret123',
  };

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns tokens', async () => {
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('returns 409 on duplicate email', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app).post('/api/auth/register').send(validUser);
      expect(res.status).toBe(409);
    });

    it('returns 400 on invalid payload', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(validUser);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('returns 401 on wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: validUser.email, password: 'wrong' });
      expect(res.status).toBe(401);
    });
  });

  describe('protected routes', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');
      expect(res.status).toBe(401);
    });

    it('returns 200 with a valid token', async () => {
      const reg = await request(app).post('/api/auth/register').send(validUser);
      const token = reg.body.data.accessToken;
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(validUser.email);
    });
  });
});