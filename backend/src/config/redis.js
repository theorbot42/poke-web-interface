const { createClient } = require('redis');

let client;

const connectRedis = async () => {
  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
    }
  });

  client.on('error', (err) => console.error('Redis Client Error:', err));
  client.on('connect', () => console.log('Redis connected'));
  client.on('reconnecting', () => console.log('Redis reconnecting...'));

  await client.connect();
  return client;
};

const getClient = () => {
  if (!client) throw new Error('Redis not initialized. Call connectRedis() first.');
  return client;
};

const set = async (key, value, ttlSeconds = 3600) => {
  return getClient().set(key, JSON.stringify(value), { EX: ttlSeconds });
};

const get = async (key) => {
  const data = await getClient().get(key);
  return data ? JSON.parse(data) : null;
};

const del = async (key) => {
  return getClient().del(key);
};

const exists = async (key) => {
  return getClient().exists(key);
};

module.exports = { connectRedis, getClient, set, get, del, exists };
