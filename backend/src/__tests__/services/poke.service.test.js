const axios = require('axios');

jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

const redis = require('../../config/redis');

// We need to reset modules so the mock axios is used in pokeClient
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return mockAxios;
});

const pokeService = require('../../services/poke.service');

describe('PokeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a message to Poke and return content', async () => {
      axios.post.mockResolvedValue({
        data: { response: 'Hello from Poke', metadata: { tokens: 42 } },
      });

      const result = await pokeService.sendMessage('Hello', []);

      expect(axios.post).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          message: 'Hello',
          context: [],
        })
      );
      expect(result).toEqual({
        content: 'Hello from Poke',
        metadata: { tokens: 42 },
      });
    });

    it('should map context messages correctly', async () => {
      axios.post.mockResolvedValue({
        data: { message: 'response text' },
      });

      const context = [
        { role: 'user', content: 'first', created_at: new Date() },
        { role: 'assistant', content: 'second', created_at: new Date() },
      ];

      const result = await pokeService.sendMessage('test', context);

      expect(axios.post).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          context: [
            { role: 'user', content: 'first' },
            { role: 'assistant', content: 'second' },
          ],
        })
      );
      expect(result.content).toBe('response text');
    });

    it('should fall back to data.content if response and message are absent', async () => {
      axios.post.mockResolvedValue({ data: { content: 'fallback' } });
      const result = await pokeService.sendMessage('test', []);
      expect(result.content).toBe('fallback');
    });

    it('should return empty metadata when absent in response', async () => {
      axios.post.mockResolvedValue({ data: { response: 'ok' } });
      const result = await pokeService.sendMessage('test', []);
      expect(result.metadata).toEqual({});
    });

    it('should propagate axios errors', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));
      await expect(pokeService.sendMessage('test', [])).rejects.toThrow('Network error');
    });
  });

  describe('getStatus', () => {
    it('should return cached status when available', async () => {
      redis.get.mockResolvedValue({ online: true, status: 'OK' });
      const result = await pokeService.getStatus();
      expect(result).toEqual({ online: true, status: 'OK' });
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should fetch status from Poke and cache it when not in cache', async () => {
      redis.get.mockResolvedValue(null);
      axios.get.mockResolvedValue({ data: { status: 'OK' } });

      const result = await pokeService.getStatus();

      expect(axios.get).toHaveBeenCalledWith('/health');
      expect(redis.set).toHaveBeenCalledWith('poke:status', { online: true, status: 'OK' }, 30);
      expect(result).toEqual({ online: true, status: 'OK' });
    });
  });

  describe('getCapabilities', () => {
    it('should return cached capabilities when available', async () => {
      redis.get.mockResolvedValue({ tools: ['email', 'calendar'] });
      const result = await pokeService.getCapabilities();
      expect(result).toEqual({ tools: ['email', 'calendar'] });
      expect(axios.get).not.toHaveBeenCalled();
    });

    it('should fetch capabilities from Poke and cache for 5 minutes', async () => {
      redis.get.mockResolvedValue(null);
      axios.get.mockResolvedValue({ data: { tools: ['email'] } });

      await pokeService.getCapabilities();

      expect(axios.get).toHaveBeenCalledWith('/api/capabilities');
      expect(redis.set).toHaveBeenCalledWith('poke:capabilities', { tools: ['email'] }, 300);
    });
  });
});
