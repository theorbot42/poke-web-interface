const { Pool } = require('pg');

let pool;

const connectDatabase = async () => {
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'poke_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test connection
  const client = await pool.connect();
  await client.query('SELECT NOW()');
  client.release();

  return pool;
};

const getPool = () => {
  if (!pool) throw new Error('Database not initialized. Call connectDatabase() first.');
  return pool;
};

const query = async (text, params) => {
  const start = Date.now();
  const res = await getPool().query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production') {
    console.log('Executed query:', { text, duration, rows: res.rowCount });
  }
  return res;
};

module.exports = { connectDatabase, getPool, query };
