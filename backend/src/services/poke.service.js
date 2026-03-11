const axios = require('axios');
const { get, set } = require('../config/redis');

const POKE_BASE_URL = process.env.POKE_BASE_URL || 'http://localhost:8080';
const POKE_API_KEY = process.env.POKE_API_KEY || '';
const POKE_TIMEOUT = parseInt(process.env.POKE_TIMEOUT) || 30000;

const pokeClient = axios.create({
  baseURL: POKE_BASE_URL,
  timeout: POKE_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    ...(POKE_API_KEY && { 'Authorization': `Bearer ${POKE_API_KEY}` })
  }
});

pokeClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Poke service error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    throw error;
  }
);

const sendMessage = async (content, context = []) => {
  const payload = {
    message: content,
    context: context.map(msg => ({ role: msg.role, content: msg.content })),
    timestamp: new Date().toISOString()
  };

  const response = await pokeClient.post('/api/chat', payload);
  return {
    content: response.data.response || response.data.message || response.data.content,
    metadata: response.data.metadata || {}
  };
};

const getStatus = async () => {
  const cached = await get('poke:status');
  if (cached) return cached;

  const response = await pokeClient.get('/health');
  const status = { online: true, ...response.data };
  await set('poke:status', status, 30);
  return status;
};

const getCapabilities = async () => {
  const cached = await get('poke:capabilities');
  if (cached) return cached;

  const response = await pokeClient.get('/api/capabilities');
  await set('poke:capabilities', response.data, 300);
  return response.data;
};

module.exports = { sendMessage, getStatus, getCapabilities };
