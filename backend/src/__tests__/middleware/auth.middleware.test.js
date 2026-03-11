jest.mock('../../config/jwt');
jest.mock('../../config/redis', () => ({ get: jest.fn() }));
jest.mock('../../config/database', () => ({ query: jest.fn() }));

const { verifyToken } = require('../../config/jwt');
const { get } = require('../../config/redis');
const { query } = require('../../config/database');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth.middleware');

const mockReq = (token) => ({
  headers: { authorization: token ? `Bearer ${token}` : undefined },
});
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe('authMiddleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when no Authorization header', async () => {
    const req = { headers: {} };
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token manquant ou invalide' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when token is blacklisted', async () => {
    get.mockResolvedValue('true');
    const req = mockReq('some-token');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token révoqué' });
  });

  it('should return 401 when user not found in DB', async () => {
    get.mockResolvedValue(null);
    verifyToken.mockReturnValue({ userId: 'user-1' });
    query.mockResolvedValue({ rows: [] });

    const req = mockReq('valid-token');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Utilisateur non trouvé ou désactivé' });
  });

  it('should call next and attach user for valid token', async () => {
    get.mockResolvedValue(null);
    verifyToken.mockReturnValue({ userId: 'user-1' });
    const fakeUser = { id: 'user-1', username: 'sylvain', email: 's@test.com', role: 'user' };
    query.mockResolvedValue({ rows: [fakeUser] });

    const req = mockReq('valid-token');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);

    expect(req.user).toEqual(fakeUser);
    expect(req.token).toBe('valid-token');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 with TOKEN_EXPIRED code when token is expired', async () => {
    get.mockResolvedValue(null);
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    verifyToken.mockImplementation(() => { throw err; });

    const req = mockReq('expired-token');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expiré', code: 'TOKEN_EXPIRED' });
  });

  it('should return 401 for malformed JWT', async () => {
    get.mockResolvedValue(null);
    const err = new Error('invalid token');
    err.name = 'JsonWebTokenError';
    verifyToken.mockImplementation(() => { throw err; });

    const req = mockReq('bad-token');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token invalide' });
  });
});

describe('adminMiddleware', () => {
  it('should return 403 when user is not admin', () => {
    const req = { user: { role: 'user' } };
    const res = mockRes();
    adminMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should call next when user is admin', () => {
    const req = { user: { role: 'admin' } };
    const res = mockRes();
    adminMiddleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
