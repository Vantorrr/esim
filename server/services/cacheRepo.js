const { query } = require('./db');

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS cache_snapshots (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

async function ensureTable() {
  try {
    await query(TABLE_SQL);
    return true;
  } catch (err) {
    console.warn('[CacheRepo] ensureTable failed:', err.message);
    return false;
  }
}

async function getSnapshot(key) {
  try {
    await ensureTable();
    const res = await query('SELECT data, updated_at FROM cache_snapshots WHERE key = $1', [key]);
    if (res.rows.length === 0) return null;
    return { data: res.rows[0].data, updatedAt: new Date(res.rows[0].updated_at) };
  } catch (err) {
    console.warn('[CacheRepo] getSnapshot failed:', err.message);
    return null;
  }
}

async function saveSnapshot(key, data) {
  try {
    await ensureTable();
    await query(
      'INSERT INTO cache_snapshots(key, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()',
      [key, JSON.stringify(data)]
    );
    return true;
  } catch (err) {
    console.warn('[CacheRepo] saveSnapshot failed:', err.message);
    return false;
  }
}

async function deleteSnapshot(key) {
  try {
    await ensureTable();
    await query('DELETE FROM cache_snapshots WHERE key = $1', [key]);
    return true;
  } catch (err) {
    console.warn('[CacheRepo] deleteSnapshot failed:', err.message);
    return false;
  }
}

module.exports = { getSnapshot, saveSnapshot, deleteSnapshot };
