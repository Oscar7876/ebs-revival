import stable, { GameWorld, ChatRoom } from './worker.js';

// Genesis 公版世界全面停用：保留原有程式與 Durable Object SQLite 資料。
// 不載入舊 GenesisWorld 邏輯，避免在暫停期間觸發世界區塊、AI、採集等行為。
export { GameWorld, ChatRoom };

const OFFLINE = { ok: false, active: false, code: 'GENESIS_DISABLED', error: 'Genesis 公版創世世界已暫停開放，所有 Genesis 服務均已停止。' };
const HEADERS = { 'cache-control': 'no-store, max-age=0', 'x-robots-tag': 'noindex, nofollow', 'x-genesis-status': 'offline' };
const offlineApi = () => new Response(JSON.stringify(OFFLINE), {
  status: 503,
  headers: { ...HEADERS, 'content-type': 'application/json; charset=utf-8' }
});
const OFFLINE_HTML = "<!doctype html>\n<html lang=\"zh-Hant-TW\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<meta name=\"robots\" content=\"noindex,nofollow\">\n<title>Genesis 公版創世世界｜暫停開放</title>\n<style>\n:root{color-scheme:dark}*{box-sizing:border-box}\nbody{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1422;color:#edf4fa;font-family:system-ui,-apple-system,\"Microsoft JhengHei\",sans-serif;padding:24px}\nmain{width:min(100%,570px);border:1px solid #365168;border-radius:20px;background:#172539;padding:38px 30px;text-align:center}\nmark{display:inline-block;background:#344b63;color:#eaf2fb;padding:6px 14px;border-radius:20px}\nh1{font-size:clamp(25px,5vw,35px);margin:20px 0 15px}p{line-height:1.9;color:#c5d4e1}\na{display:inline-block;margin-top:15px;color:#a6e8fa;text-decoration:none;border:1px solid #6b93a6;border-radius:8px;padding:11px 20px}\n</style>\n</head>\n<body>\n<main>\n<mark>⏸ 暫停服務</mark>\n<h1>Genesis 公版創世世界</h1>\n<p>目前已暫停開放。登入、採集、副本、裝備、戰鬥、聊天室與相關 API 均不提供 Genesis 服務。</p>\n<p>遊戲程式與既有玩家資料已保留，未進行重置。</p>\n<a href=\"/\">返回主世界</a>\n</main>\n</body>\n</html>\n";
const offlinePage = () => new Response(OFFLINE_HTML, {
  status: 503,
  headers: { ...HEADERS, 'content-type': 'text/html; charset=utf-8' }
});

// 保持相同 class 名稱 / Durable Object binding，避免刪除或搬移既有儲存。
// 初始化時取消既存 alarm；若已排定的 alarm 仍送達，也只取消，絕不 tick。
export class GenesisWorld {
  constructor(ctx) {
    this.ctx = ctx;
    ctx.blockConcurrencyWhile(async () => {
      await ctx.storage.deleteAlarm();
    });
  }
  async alarm() {
    await this.ctx.storage.deleteAlarm();
  }
  async fetch() {
    await this.ctx.storage.deleteAlarm();
    return offlineApi();
  }
}

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === '/api/genesis' || path.startsWith('/api/genesis/')) return offlineApi();
    if (path === '/genesis' || path.startsWith('/genesis/')) return offlinePage();
    if (path.startsWith('/genesis')) return offlinePage();
    return stable.fetch(request, env, ctx);
  }
};
