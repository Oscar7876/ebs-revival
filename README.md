# 機械人大戰 第一代復刻 — Cloudflare Git 一鍵部署版

以 **THE ENDLESS BATTLE / NET GAME Communications 早期網頁機戰精神**重製的多人持久世界測試版。

目前版本：**v0.5 Git Deploy**

- 全介面臺灣繁中（原本就是英文的正式名稱保留英文）
- 帳號＋密碼登入
- 重新整理維持登入，主動登出才解除
- 第一個註冊帳號自動成為管理員
- 20 款機體
- 武器相剋、速率、攻擊回數、命中、能源、熱量、載重
- 攻擊 CD、過熱、修理
- 離線玩家可被攻擊
- 採礦、殘骸回收、護盾
- WebSocket 即時聊天室與在線狀態
- D1 永久保存玩家資料
- GitHub `main` 更新後可由 Cloudflare Workers Builds 自動部署

## 一鍵部署到 Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Oscar7876/ebs-revival)

或直接開啟：

https://deploy.workers.cloudflare.com/?url=https://github.com/Oscar7876/ebs-revival

Cloudflare 會依 `wrangler.jsonc` 自動準備 Worker、D1、Durable Objects 與 Static Assets。`package.json` 的部署指令會先套用 D1 migrations，再部署 Worker。

### 第一次部署後

1. 打開 Cloudflare 產生的 `workers.dev` 網址。
2. **先由你自己建立第一個玩家帳號**；第一個帳號會自動成為管理員。
3. 確認可以登入、重新整理維持登入。
4. 再把網址分享給朋友。
5. 管理頁為 `/admin.html`。

## 更新方式

之後只要更新 GitHub `main` branch：

1. Commit / Upload 新檔案。
2. Cloudflare Workers Builds 偵測 Git 更新。
3. 執行部署指令。
4. D1 只套用尚未執行的 migration。
5. 原玩家帳號、密碼雜湊、機體與遊戲進度繼續保留。

**不要刪除正式環境的 D1 database。**

未來新增資料表或欄位時，請新增新的 migration，例如 `migrations/0002_add_armor.sql`，不要回頭改寫已經正式套用的 `0001_init.sql`。

## 專案結構

```text
src/
  index.js       Worker / API / WebSocket / Durable Objects
  catalog.js     20 款機體與武器資料

public/
  index.html
  game.js
  style.css
  admin.html
  admin.js
  assets/mechs/  機體圖

migrations/
  0001_init.sql

wrangler.jsonc
package.json
```

## 免費額度友善設計

這款遊戲刻意避免高頻輪詢：

- CD / 熱量由瀏覽器本機倒數。
- 真正攻擊、採集、升級、購買才呼叫後端。
- 聊天使用 WebSocket。
- 玩家名單只在需要時更新。
- 機體與武器靜態資料直接由程式提供。

目標是在數百名日活玩家階段，盡量維持 Cloudflare Free Plan。
