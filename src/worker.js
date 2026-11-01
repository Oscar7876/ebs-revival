import app, { GameWorld, ChatRoom } from './index.js';
import { ensureSchema, health } from './schema.js';

export { GameWorld, ChatRoom };

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

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
      return await app.fetch(req, env, ctx);
    } catch (error) {
      console.error('EBS Worker error:', error);
      return json({
        error: '伺服器處理失敗',
        detail: String(error?.message || error)
      }, 500);
    }
  }
};
