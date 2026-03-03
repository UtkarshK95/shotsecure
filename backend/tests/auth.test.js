const request = require('supertest');
const app     = require('../app');
const db      = require('./helpers/db');

beforeAll(db.connect);
afterEach(db.clearDB);
afterAll(db.disconnect);

const AUTH = 'Bearer admin-token';

describe('POST /api/login', () => {
  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('admin-token');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 for unknown username', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'hacker', password: 'password' });

    expect(res.status).toBe(401);
  });
});

describe('Auth middleware', () => {
  it('rejects requests with no Authorization header', async () => {
    const res = await request(app).get('/api/students');
    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid token', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', 'Bearer wrong-token');
    expect(res.status).toBe(401);
  });

  it('allows requests with the correct token', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', AUTH);
    expect(res.status).toBe(200);
  });
});

describe('GET /health', () => {
  it('returns ok (no auth required)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
