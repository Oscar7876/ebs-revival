import app, { GameWorld, ChatRoom } from './index.js';
import { MECHS, WEAPONS } from './catalog.js';
import { ensureSchema, health } from './schema.js';

export { GameWorld, ChatRoom };

const te = new TextEncoder();
const PBKDF2_ITERATIONS = 12000;
const SESSION_MS = 365 * 24 * 60 * 60 * 1000;

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extraHeaders
  }
});

const norm = (s) => String(s || '').trim().normalize('NFKC').toLocaleLowerCase('zh-TW');

function b64(bytes) {
  let s = '';
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function unb64(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

function randomBytes(n = 32) {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}

async function sha256(text) {
  const out = await crypto.subtle.digest('SHA-256', te.encode(text));
  return b64(new Uint8Array(out));
}

async function derivePassword(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', te.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt,
    iterations
  }, key, 256);
  return new Uint8Array(bits);
}

async function makePassword(password) {
  const salt = randomBytes(16);
  return {
    salt: b64(salt),
    hash: b64(await derivePassword(password, salt, PBKDF2_ITERATIONS)),
    iterations: PBKDF2_ITERATIONS
  };
}

async function verifyPassword(password, row) {
  const actual = b64(await derivePassword(password, unb64(row.password_salt), Number(row.password_iterations) || PBKDF2_ITERATIONS));
  const expected = String(row.password_hash || '');
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function sessionCookie(token) {
  return `ebs_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
}

async function createSession(env, userId) {
  const token = b64(randomBytes(32));
  const tokenHash = await sha256(token);
  const t = Date.now();
  await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)')
    .bind(tokenHash, userId, t, t + SESSION_MS).run();
  return token;
}

function parseJSON(text, fallback) {
  try { return JSON.parse(text); } catch { return fallback; }
}

function stateFromRow(r) {
  return {
    level: r.level,
    exp: r.exp,
    nextExp: r.next_exp,
    rank: r.rank,
    money: r.money,
    ore: r.ore,
    wins: r.wins,
    losses: r.losses,
    nation: r.nation,
    frame: r.frame,
    ownedMechs: parseJSON(r.owned_mechs, ['m01']),
    equipped: r.equipped,
    ownedWeapons: parseJSON(r.owned_weapons, ['rifle']),
    upgrades: parseJSON(r.upgrades, { atk:0, armor:0, speed:0, aim:0, cooling:0, maxHp:0, maxEn:0 }),
    currentHp: r.current_hp,
    currentEn: r.current_en,
    heat: r.heat,
    attackReadyAt: r.attack_ready_at,
    repairUntil: r.repair_until,
    shieldUntil: r.shield_until,
    gatherReadyAt: r.gather_ready_at,
    lastTick: r.last_tick,
    lastSeen: r.last_seen,
    actionDay: r.action_day,
    actionCount: r.action_count,
    battleCount: r.battle_count,
    logs: parseJSON(r.activity_logs, []),
    updatedAt: r.updated_at
  };
}

async function register(env, request) {
  const body = await request.json().catch(() => ({}));
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (username.length < 2 || username.length > 16) return json({ error: '名稱需為 2～16 個字元' }, 400);
  if (password.length < 6 || password.length > 72) return json({ error: '密碼需為 6～72 個字元' }, 400);

  const existing = await env.DB.prepare('SELECT id FROM users WHERE username_norm=?').bind(norm(username)).first();
  if (existing) return json({ error: '此名稱已被使用' }, 409);

  const pw = await makePassword(password);
  const t = Date.now();
  const result = await env.DB.prepare(`
    INSERT INTO users(username,username_norm,password_salt,password_hash,password_iterations,is_admin,created_at,updated_at)
    VALUES(?,?,?,?,?,CASE WHEN NOT EXISTS(SELECT 1 FROM users) THEN 1 ELSE 0 END,?,?)
  `).bind(username, norm(username), pw.salt, pw.hash, pw.iterations, t, t).run();

  const userId = Number(result.meta.last_row_id);
  const firstLog = JSON.stringify([{ t, text: '系統：帳號建立完成。歡迎進入戰場。' }]);
  await env.DB.prepare('INSERT INTO players(user_id,last_tick,last_seen,action_day,activity_logs,updated_at) VALUES(?,?,?,?,?,?)')
    .bind(userId, t, t, new Date().toISOString().slice(0, 10), firstLog, t).run();

  const user = await env.DB.prepare('SELECT id,username,is_admin FROM users WHERE id=?').bind(userId).first();
  const player = await env.DB.prepare('SELECT * FROM players WHERE user_id=?').bind(userId).first();
  const token = await createSession(env, userId);

  return json({
    ok: true,
    user: { id: userId, username: user.username, isAdmin: Number(user.is_admin) === 1 },
    state: stateFromRow(player),
    catalog: { mechs: MECHS, weapons: WEAPONS }
  }, 201, { 'Set-Cookie': sessionCookie(token) });
}

async function login(env, request) {
  const body = await request.json().catch(() => ({}));
  const user = await env.DB.prepare('SELECT * FROM users WHERE username_norm=?').bind(norm(body.username)).first();
  if (!user) return json({ error: '名稱或密碼錯誤' }, 401);

  const ok = await verifyPassword(String(body.password || ''), user);
  if (!ok) return json({ error: '名稱或密碼錯誤' }, 401);

  const player = await env.DB.prepare('SELECT * FROM players WHERE user_id=?').bind(user.id).first();
  if (!player) return json({ error: '玩家資料不存在' }, 500);

  const token = await createSession(env, user.id);
  return json({
    ok: true,
    user: { id: user.id, username: user.username, isAdmin: Number(user.is_admin) === 1 },
    state: stateFromRow(player),
    catalog: { mechs: MECHS, weapons: WEAPONS }
  }, 200, { 'Set-Cookie': sessionCookie(token) });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      const result = await health(env);
      return json(result, result.ok ? 200 : 503);
    }

    if (url.pathname.startsWith('/api/') || url.pathname === '/ws') {
      try {
        await ensureSchema(env);
      } catch (error) {
        return json({
          error: '資料庫尚未完成初始化',
          detail: String(error?.message || error),
          hint: '請檢查 Cloudflare Worker 的 D1 binding 名稱是否為 DB。'
        }, 503);
      }
    }

    try {
      if (url.pathname === '/api/register' && request.method === 'POST') return await register(env, request);
      if (url.pathname === '/api/login' && request.method === 'POST') return await login(env, request);
      return await app.fetch(request, env, ctx);
    } catch (error) {
      console.error('EBS Worker error:', error);
      return json({
        error: '伺服器處理失敗',
        detail: String(error?.message || error)
      }, 500);
    }
  }
};
