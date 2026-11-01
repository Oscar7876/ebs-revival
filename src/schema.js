const STEPS = [
  {
    name: 'users',
    sql: `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      username_norm TEXT NOT NULL UNIQUE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_iterations INTEGER NOT NULL DEFAULT 12000,
      auth_version INTEGER NOT NULL DEFAULT 1,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`
  },
  {
    name: 'sessions',
    sql: `CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'idx_sessions_user_id',
    sql: `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)`
  },
  {
    name: 'idx_sessions_expires_at',
    sql: `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`
  },
  {
    name: 'players',
    sql: `CREATE TABLE IF NOT EXISTS players (
      user_id INTEGER PRIMARY KEY,
      level INTEGER NOT NULL DEFAULT 1,
      exp INTEGER NOT NULL DEFAULT 0,
      next_exp INTEGER NOT NULL DEFAULT 300,
      rank TEXT NOT NULL DEFAULT 'F',
      money INTEGER NOT NULL DEFAULT 12000,
      ore INTEGER NOT NULL DEFAULT 90,
      wins INTEGER NOT NULL DEFAULT 0,
      losses INTEGER NOT NULL DEFAULT 0,
      nation TEXT NOT NULL DEFAULT '無所屬',
      frame TEXT NOT NULL DEFAULT 'm01',
      owned_mechs TEXT NOT NULL DEFAULT '["m01"]',
      equipped TEXT NOT NULL DEFAULT 'rifle',
      owned_weapons TEXT NOT NULL DEFAULT '["rifle"]',
      upgrades TEXT NOT NULL DEFAULT '{"atk":0,"armor":0,"speed":0,"aim":0,"cooling":0,"maxHp":0,"maxEn":0}',
      current_hp INTEGER NOT NULL DEFAULT 2800,
      current_en INTEGER NOT NULL DEFAULT 160,
      heat REAL NOT NULL DEFAULT 0,
      attack_ready_at INTEGER NOT NULL DEFAULT 0,
      repair_until INTEGER NOT NULL DEFAULT 0,
      shield_until INTEGER NOT NULL DEFAULT 0,
      gather_ready_at INTEGER NOT NULL DEFAULT 0,
      last_tick INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      action_day TEXT NOT NULL DEFAULT '',
      action_count INTEGER NOT NULL DEFAULT 0,
      battle_count INTEGER NOT NULL DEFAULT 0,
      activity_logs TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'battle_events',
    sql: `CREATE TABLE IF NOT EXISTS battle_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at INTEGER NOT NULL,
      attacker_id INTEGER NOT NULL,
      defender_id INTEGER NOT NULL,
      attacker_name TEXT NOT NULL,
      defender_name TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      FOREIGN KEY(attacker_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(defender_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  },
  {
    name: 'idx_battle_events_created_at',
    sql: `CREATE INDEX IF NOT EXISTS idx_battle_events_created_at ON battle_events(created_at)`
  }
];

let ready = false;
let lastError = null;

export async function ensureSchema(env) {
  if (!env?.DB) throw new Error('Cloudflare D1 尚未綁定：找不到 DB binding');
  if (ready) return;

  for (const step of STEPS) {
    try {
      await env.DB.prepare(step.sql).run();
    } catch (error) {
      lastError = {
        step: step.name,
        message: String(error?.message || error)
      };
      throw new Error(`D1 初始化失敗 [${step.name}]：${lastError.message}`);
    }
  }

  const check = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','sessions','players','battle_events') ORDER BY name").all();
  const names = (check.results || []).map(x => x.name);
  if (names.length !== 4) {
    lastError = { step: 'verify', message: `只找到 ${names.length}/4 張必要資料表：${names.join(', ')}` };
    throw new Error(`D1 初始化驗證失敗：${lastError.message}`);
  }

  ready = true;
  lastError = null;
}

export async function health(env) {
  if (!env?.DB) {
    return { ok: false, dbBinding: false, error: '找不到 DB binding' };
  }

  try {
    await ensureSchema(env);
    const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','sessions','players','battle_events') ORDER BY name").all();
    const names = (tables.results || []).map(x => x.name);
    return {
      ok: names.length === 4,
      dbBinding: true,
      tables: names,
      expectedTables: 4,
      initialization: 'ready'
    };
  } catch (error) {
    return {
      ok: false,
      dbBinding: true,
      initialization: 'failed',
      failedStep: lastError?.step || null,
      error: String(error?.message || error)
    };
  }
}
