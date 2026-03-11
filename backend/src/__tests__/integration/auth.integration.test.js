const request = require('supertest');
const app = require('../../app');

jest.mock('../../config/database', () => ({ query: jest.fn() }));
jest.mock('../../config/redis', () => ({ get: jest.fn(), set: jest.fn(), del: jest.fn() }));
jest.mock('../../config/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

const { query } = require('../../config/database');
const { get } = require('../../config/redis');
const { verifyToken } = require('../../config/jwt');
const bcrypt = require('bcryptjs');

beforeEach(() => jest.clearAllMocks());

describe('POST /api/auth/register', () => {
  it('should register a new user with valid data', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 'u1', username: 'sylvain', email: 'sylvain@test.com', role: 'user', created_at: new Date() }],
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'sylvain', email: 'sylvain@test.com', password: 'Password1' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token', 'mock-access-token');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('should return 422 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'sylvain', email: 'not-an-email', password: 'Password1' });
    expect(res.status).toBe(422);
  });

  it('should return 422 for weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'sylvain', email: 'sylvain@test.com', password: 'weak' });
    expect(res.status).toBe(422);
  });

  it('should return 422 for short username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'sylvain@test.com', password: 'Password1' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const user = { id: 'u1', email: 'sylvain@test.com', password_hash: 'hashed', role: 'user', is_active: true };
    query
      .mockResolvedValueOnce({ rows: [user] })
      .mockResolvedValueOnce({ rows: [] });
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sylvain@test.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should return 401 for invalid credentials', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Password1' });
    expect(res.status).toBe(401);
  });

  it('should return 422 for missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Password1' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/auth/me', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should return user when authenticated', async () => {
    get.mockResolvedValue(null);
    verifyToken.mockReturnValue({ userId: 'u1' });
    query.mockResolvedValue({ rows: [{ id: 'u1', username: 'sylvain', email: 's@test.com', role: 'user' }] });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.user).toHaveProperty('username', 'sylvain');
  });
});

describe('GET /health', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});

describe('Unknown routes', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
