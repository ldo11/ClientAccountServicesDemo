const request = require('supertest');
const { app } = require('../server');

describe('Core Backend API - Controllers & Swagger Documentation', () => {
  test('GET /api-docs should return 200 OK (or 301/200 redirect) for Swagger UI', async () => {
    const res = await request(app).get('/api-docs/');
    expect([200, 301, 302]).toContain(res.status);
  });

  test('GET /api-docs.json should return valid OpenAPI 3.0 specification', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('Charlotte FinTech');
  });

  test('GET /api/health should return UP status and environment info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.db).toBe('CONNECTED');
    expect(res.body.env).toBeDefined();
  });

  test('GET /api/central-bank/ceiling-rate should return 5.5% regulatory ceiling rate', async () => {
    const res = await request(app).get('/api/central-bank/ceiling-rate');
    expect(res.status).toBe(200);
    expect(res.body.ceilingRate).toBe(5.5);
    expect(res.body.currency).toBe('USD');
  });

  test('POST /api/auth/register should reject missing fields with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'missing_fields' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login should reject invalid credentials with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'non_existent_client', password: 'BadPassword123' });
    expect(res.status).toBe(401);
  });

  test('Protected endpoint GET /api/accounts should return 401 without Bearer token', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(401);
  });
});
