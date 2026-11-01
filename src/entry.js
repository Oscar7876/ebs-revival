import worker, { GameWorld, ChatRoom } from './index.js';
import { ensureSchema, health } from './schema.js';

export { GameWorld, ChatRoom };

const json = (data, status = 200) => new Response(JSON.stringify(data, null, 2), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  }
});

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      const result = await health(env);
      return json(result, result.ok ? 200 : 503);
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        await ensureSchema(env);
      } catch (error) {
        return json({
          error: '資料庫尚未完成初始化',
          detail: String(error?.message || error),
          hint: '請檢查 Cloudflare Worker 的 D1 binding 是否名為 DB。'
        }, 503);
      }
    }

    try {
      return await worker.fetch(request, env, ctx);
    } catch (error) {
      console.error('Worker runtime error', error);
      return json({
        error: '伺服器執行錯誤',
        detail: String(error?.message || error)
      }, 500);
    }
  }
};
