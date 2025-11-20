const { query } = require('./db');

async function ensureTable() {
  try {
    await query(
      `
      CREATE TABLE IF NOT EXISTS user_esims (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        package_id TEXT NOT NULL,
        payment_session_id TEXT UNIQUE,
        payment_order_id TEXT,
        payment_status TEXT DEFAULT 'pending',
        amount_rub INTEGER,
        currency TEXT,
        esim_order_id TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_user_esims_telegram
        ON user_esims(telegram_id);
      `
    );
  } catch (e) {
    if (e.message && e.message.includes('DB not configured')) {
      console.warn('[userEsimRepo] DB not configured, skipping ensureTable');
    } else {
      console.error('[userEsimRepo] ensureTable error:', e.message);
    }
    throw e;
  }
}

async function createPending({
  telegramId,
  packageId,
  paymentSessionId,
  paymentOrderId,
  amountRub,
  currency,
}) {
  if (!telegramId || !packageId || !paymentSessionId) return null;
  try {
    await ensureTable();
    const res = await query(
      `
      INSERT INTO user_esims (
        telegram_id,
        package_id,
        payment_session_id,
        payment_order_id,
        amount_rub,
        currency,
        payment_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      ON CONFLICT (payment_session_id)
      DO UPDATE SET
        telegram_id = EXCLUDED.telegram_id,
        package_id = EXCLUDED.package_id,
        payment_order_id = EXCLUDED.payment_order_id,
        amount_rub = EXCLUDED.amount_rub,
        currency = EXCLUDED.currency,
        updated_at = now()
      RETURNING *;
      `,
      [telegramId, packageId, paymentSessionId, paymentOrderId, amountRub || null, currency || 'rub']
    );
    return res.rows[0];
  } catch (e) {
    if (e.message && e.message.includes('DB not configured')) {
      console.warn('[userEsimRepo] DB not configured, skip createPending');
      return null;
    }
    console.error('[userEsimRepo] createPending error:', e.message);
    return null;
  }
}

async function findBySessionId(sessionId) {
  if (!sessionId) return null;
  try {
    await ensureTable();
    const res = await query(
      `SELECT * FROM user_esims WHERE payment_session_id = $1 LIMIT 1;`,
      [sessionId]
    );
    return res.rows[0] || null;
  } catch (e) {
    if (e.message && e.message.includes('DB not configured')) {
      return null;
    }
    console.error('[userEsimRepo] findBySessionId error:', e.message);
    return null;
  }
}

async function markPaidAndAttachEsim(sessionId, esimOrderId, paymentStatus = 'succeeded') {
  if (!sessionId) return null;
  try {
    await ensureTable();
    const res = await query(
      `
      UPDATE user_esims
      SET
        payment_status = $2,
        esim_order_id = COALESCE($3, esim_order_id),
        updated_at = now()
      WHERE payment_session_id = $1
      RETURNING *;
      `,
      [sessionId, paymentStatus, esimOrderId || null]
    );
    return res.rows[0] || null;
  } catch (e) {
    if (e.message && e.message.includes('DB not configured')) {
      return null;
    }
    console.error('[userEsimRepo] markPaidAndAttachEsim error:', e.message);
    return null;
  }
}

async function getByTelegramId(telegramId) {
  if (!telegramId) return [];
  try {
    await ensureTable();
    const res = await query(
      `
      SELECT *
      FROM user_esims
      WHERE telegram_id = $1
      ORDER BY created_at DESC;
      `,
      [telegramId]
    );
    return res.rows || [];
  } catch (e) {
    if (e.message && e.message.includes('DB not configured')) {
      console.warn('[userEsimRepo] DB not configured, getByTelegramId returns []');
      return [];
    }
    console.error('[userEsimRepo] getByTelegramId error:', e.message);
    return [];
  }
}

async function getLastCompletedByTelegramId(telegramId) {
  if (!telegramId) return null;
  try {
    await ensureTable();
    const res = await query(
      `
      SELECT *
      FROM user_esims
      WHERE telegram_id = $1
        AND payment_status = 'succeeded'
      ORDER BY updated_at DESC
      LIMIT 1;
      `,
      [telegramId]
    );
    return res.rows[0] || null;
  } catch (e) {
    if (e.message && e.message.includes('DB not configured')) {
      return null;
    }
    console.error('[userEsimRepo] getLastCompletedByTelegramId error:', e.message);
    return null;
  }
}

module.exports = {
  createPending,
  findBySessionId,
  markPaidAndAttachEsim,
  getByTelegramId,
  getLastCompletedByTelegramId,
};


