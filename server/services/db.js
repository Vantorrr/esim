const { Pool } = require('pg');

let pool;

function createPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[DB] DATABASE_URL not set; DB features disabled');
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
    });

    return pool;
  } catch (err) {
    console.error('[DB] Failed to create pool:', err.message);
    return null;
  }
}

async function query(text, params) {
  const p = createPool();
  if (!p) throw new Error('DB not configured');
  const client = await p.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

module.exports = { createPool, query };
