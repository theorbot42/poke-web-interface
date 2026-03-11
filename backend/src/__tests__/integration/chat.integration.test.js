const request = require('supertest');
const app = require('../../app');

jest.mock('../../config/database', () => ({ query: jest.fn() }));
jest.mock('../../config/redis', () => ({ get: jest.fn(), set: jest.fn(), del: jest.fn() }));
jest.mock('../../config/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh'),
  verifyToken: jest.fn().mockReturnValue({ userId: 'u1' }),
  verifyRefreshToken: jest.fn(),
}));
jest.mock('../../services/poke.service', () => ({
  sendMessage: jest.fn().mockResolvedValue({ content: 'Poke says hi', metadata: {} }),
}));

const { query } = require('../../config/database');
const { get } = require('../../config/redis');

const AUTH_TOKEN = 'Bearer mock-token';
const SESSION_ID = '550e8400-e29b-41d4-a716-446655440000';
const mockUser = { id: 'u1', username: 'sylvain', email: 's@test.com', role: 'user' };

beforeEach(() => {
  jest.clearAllMocks();
  // Default: token not blacklisted, user found
  get.mockResolvedValue(null);
  query.mockResolvedValue({ rows: [mockUser] });
});

describe('GET /api/chat/sessions', () => {
  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/chat/sessions');
    expect(res.status).toBe(401);
  });

  it('should return sessions list when authenticated', async () => {
    query
      .mockResolvedValueOnce({ rows: [mockUser] }) // auth middleware
      .mockResolvedValueOnce({ rows: [{ id: SESSION_ID, title: 'Test', message_count: 2 }] });

    const res = await request(app)
      .get('/api/chat/sessions')
      .set('Authorization', AUTH_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessions');
  });
});

describe('POST /api/chat/sessions', () => {
  it('should create a new session', async () => {
    const newSession = { id: SESSION_ID, title: 'My chat', user_id: 'u1' };
    query
      .mockResolvedValueOnce({ rows: [mockUser] }) // auth
      .mockResolvedValueOnce({ rows: [newSession] }); // insert

    const res = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', AUTH_TOKEN)
      .send({ title: 'My chat' });

    expect(res.status).toBe(201);
    expect(res.body.session.title).toBe('My chat');
  });

  it('should use default title if none provided', async () => {
    const newSession = { id: SESSION_ID, title: 'Nouvelle conversation', user_id: 'u1' };
    query
      .mockResolvedValueOnce({ rows: [mockUser] })
      .mockResolvedValueOnce({ rows: [newSession] });

    const res = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', AUTH_TOKEN)
      .send({});

    expect(res.status).toBe(201);
  });
});

describe('GET /api/chat/sessions/:sessionId', () => {
  it('should return 404 for non-existent session', async () => {
    query
      .mockResolvedValueOnce({ rows: [mockUser] }) // auth
      .mockResolvedValueOnce({ rows: [] }); // session not found

    const res = await request(app)
      .get(`/api/chat/sessions/${SESSION_ID}`)
      .set('Authorization', AUTH_TOKEN);

    expect(res.status).toBe(404);
  });

  it('should return session details', async () => {
    const session = { id: SESSION_ID, title: 'Test', user_id: 'u1' };
    query
      .mockResolvedValueOnce({ rows: [mockUser] })
      .mockResolvedValueOnce({ rows: [session] });

    const res = await request(app)
      .get(`/api/chat/sessions/${SESSION_ID}`)
      .set('Authorization', AUTH_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.session.id).toBe(SESSION_ID);
  });
});

describe('POST /api/chat/sessions/:sessionId/messages', () => {
  it('should send a message and return both user and assistant messages', async () => {
    const session = { id: SESSION_ID, title: 'Chat', user_id: 'u1' };
    const userMsg = { id: 'msg1', role: 'user', content: 'Hello', session_id: SESSION_ID };
    const assistantMsg = { id: 'msg2', role: 'assistant', content: 'Poke says hi', session_id: SESSION_ID };

    query
      .mockResolvedValueOnce({ rows: [mockUser] })   // auth
      .mockResolvedValueOnce({ rows: [session] })    // session check
      .mockResolvedValueOnce({ rows: [userMsg] })    // insert user msg
      .mockResolvedValueOnce({ rows: [] })           // context messages
      .mockResolvedValueOnce({ rows: [assistantMsg] }) // insert assistant msg
      .mockResolvedValueOnce({ rows: [] });          // update session

    const res = await request(app)
      .post(`/api/chat/sessions/${SESSION_ID}/messages`)
      .set('Authorization', AUTH_TOKEN)
      .send({ content: 'Hello' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('userMessage');
    expect(res.body).toHaveProperty('assistantMessage');
    expect(res.body.assistantMessage.content).toBe('Poke says hi');
  });

  it('should return 422 for empty message', async () => {
    query.mockResolvedValueOnce({ rows: [mockUser] });

    const res = await request(app)
      .post(`/api/chat/sessions/${SESSION_ID}/messages`)
      .set('Authorization', AUTH_TOKEN)
      .send({ content: '' });

    expect(res.status).toBe(422);
  });
});
