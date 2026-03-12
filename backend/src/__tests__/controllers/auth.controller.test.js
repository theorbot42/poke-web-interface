jest.mock('../../config/database', () => ({ query: jest.fn() }));
jest.mock('../../config/redis', () => ({ set: jest.fn(), get: jest.fn(), del: jest.fn() }));
jest.mock('../../config/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

const { query } = require('../../config/database');
const { set, get, del } = require('../../config/redis');
const { verifyRefreshToken } = require('../../config/jwt');
const bcrypt = require('bcryptjs');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateMe,
  changePassword,
} = require('../../controllers/auth.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const next = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('auth.controller — register', () => {
  it('should register a new user and return 201 with tokens', async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // no existing user
      .mockResolvedValueOnce({
        rows: [{ id: 'u1', username: 'sylvain', email: 's@test.com', role: 'user', created_at: new Date() }],
      });
    set.mockResolvedValue(true);

    const req = { body: { username: 'sylvain', email: 's@test.com', password: 'Password1' } };
    const res = mockRes();
    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'mock-access-token', refreshToken: 'mock-refresh-token' })
    );
  });

  it('should return 409 when email or username already exists', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'existing' }] });
    const req = { body: { username: 'sylvain', email: 's@test.com', password: 'Password1' } };
    const res = mockRes();
    await register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('auth.controller — login', () => {
  it('should login successfully and return tokens', async () => {
    const user = { id: 'u1', email: 's@test.com', password_hash: 'hashed', role: 'user', is_active: true };
    query
      .mockResolvedValueOnce({ rows: [user] })
      .mockResolvedValueOnce({ rows: [] }); // update last_login
    bcrypt.compare.mockResolvedValue(true);

    const req = { body: { email: 's@test.com', password: 'Password1' } };
    const res = mockRes();
    await login(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'mock-access-token' })
    );
    // password_hash must not appear in response
    const call = res.json.mock.calls[0][0];
    expect(call.user).not.toHaveProperty('password_hash');
  });

  it('should return 401 for non-existent user', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const req = { body: { email: 'noone@test.com', password: 'Password1' } };
    const res = mockRes();
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 401 for wrong password', async () => {
    const user = { id: 'u1', email: 's@test.com', password_hash: 'hashed', role: 'user' };
    query.mockResolvedValueOnce({ rows: [user] });
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { email: 's@test.com', password: 'WrongPass' } };
    const res = mockRes();
    await login(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('auth.controller — refreshToken', () => {
  it('should issue new tokens with valid refresh token', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 'u1' });
    get.mockResolvedValue('old-refresh-token');
    query.mockResolvedValue({ rows: [{ id: 'u1', username: 'sylvain', email: 's@test.com', role: 'user' }] });

    const req = { body: { refreshToken: 'old-refresh-token' } };
    const res = mockRes();
    await refreshToken(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'mock-access-token', refreshToken: 'mock-refresh-token' })
    );
  });

  it('should return 400 if no refresh token provided', async () => {
    const req = { body: {} };
    const res = mockRes();
    await refreshToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 401 if stored refresh token does not match', async () => {
    verifyRefreshToken.mockReturnValue({ userId: 'u1' });
    get.mockResolvedValue('different-token');
    const req = { body: { refreshToken: 'old-refresh-token' } };
    const res = mockRes();
    await refreshToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('auth.controller — logout', () => {
  it('should blacklist token and delete refresh entry', async () => {
    set.mockResolvedValue(true);
    del.mockResolvedValue(true);
    const req = { token: 'access-token', user: { id: 'u1' } };
    const res = mockRes();
    await logout(req, res, next);
    expect(set).toHaveBeenCalledWith('blacklist:access-token', true, expect.any(Number));
    expect(del).toHaveBeenCalledWith('refresh:u1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Déconnexion réussie' });
  });
});

describe('auth.controller — getMe', () => {
  it('should return the authenticated user', async () => {
    const req = { user: { id: 'u1', username: 'sylvain' } };
    const res = mockRes();
    await getMe(req, res);
    expect(res.json).toHaveBeenCalledWith({ user: req.user });
  });
});

describe('auth.controller — updateMe', () => {
  it('should update username and return updated user', async () => {
    const updated = { id: 'u1', username: 'new_name', email: 's@test.com', role: 'user' };
    query.mockResolvedValue({ rows: [updated] });
    const req = { body: { username: 'new_name' }, user: { id: 'u1' } };
    const res = mockRes();
    await updateMe(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ user: updated });
  });
});

describe('auth.controller — changePassword', () => {
  it('should change password successfully', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ password_hash: 'old-hash' }] })
      .mockResolvedValueOnce({ rows: [] });
    bcrypt.compare.mockResolvedValue(true);
    del.mockResolvedValue(true);

    const req = { body: { currentPassword: 'OldPass1', newPassword: 'NewPass1' }, user: { id: 'u1' } };
    const res = mockRes();
    await changePassword(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ message: 'Mot de passe modifié avec succès' });
  });

  it('should return 400 for wrong current password', async () => {
    query.mockResolvedValueOnce({ rows: [{ password_hash: 'old-hash' }] });
    bcrypt.compare.mockResolvedValue(false);
    const req = { body: { currentPassword: 'WrongOld', newPassword: 'NewPass1' }, user: { id: 'u1' } };
    const res = mockRes();
    await changePassword(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
