const $=s=>document.querySelector(s);
const fmt=n=>Number(n||0).toLocaleString('zh-TW');
const pct=(n,d)=>d?Math.min(999,n/d*100):0;
const level=p=>p>=90?'danger':p>=70?'warning':'good';
const bar=(label,value,limit,unit='')=>{const p=pct(value,limit),c=level(p);return `<div class="section-box"><div style="display:flex;justify-content:space-between;gap:12px;align-items:end"><div><h3 style="margin:0 0 6px">${label}</h3><b>${fmt(Math.round(value))}${unit}</b> / ${fmt(limit)}${unit}</div><b class="${c}">${p.toFixed(2)}%</b></div><div style="height:10px;background:#111;border:1px solid #555;margin-top:10px"><div style="height:100%;width:${Math.min(100,p)}%;background:${p>=90?'#ff5d5d':p>=70?'#ffd24d':'#69ff8b'}"></div></div></div>`};

async function load(){
  $('#adminMsg').textContent='讀取中…';
  const r=await fetch('/api/admin/usage',{credentials:'same-origin'});let d={};try{d=await r.json();}catch{}
  if(!r.ok){$('#adminMsg').textContent=d.error||'讀取失敗，請先登入管理員帳號。';return;}
  $('#adminMsg').textContent=`最後更新：${new Date().toLocaleString('zh-TW',{hour12:false})}`;

  const LIMITS={worker:100000,d1Read:5000000,d1Write:100000,doReq:100000,d1StorageGB:5};
  const active=Math.max(0,Number(d.active24h||0));
  const actions=Math.max(0,Number(d.recordedActions||0));
  const battles=Math.max(0,Number(d.battles||0));
  const estWrite=Math.max(0,Number(d.estimatedGameD1Writes||0));
  const perActiveActions=active?actions/active:0;
  const perActiveWrites=active?estWrite/active:0;

  // 不額外寫資料庫計數，Workers 請求只能做規劃估算。
  // recordedActions 不含登入、/api/me、玩家名單與管理頁查詢，因此加固定 overhead。
  const estWorkerToday=actions + active*10;
  const perActiveWorker=active?estWorkerToday/active:0;
  const projections=[100,300,500].map(users=>({
    users,
    actions:perActiveActions*users,
    writes:perActiveWrites*users,
    worker:perActiveWorker*users
  }));

  const projectionRows=projections.map(x=>{
    const wp=pct(x.worker,LIMITS.worker),dp=pct(x.writes,LIMITS.d1Write);
    const worst=Math.max(wp,dp);const tag=worst>=90?'🔴 高風險':worst>=70?'🟡 接近警戒':'🟢 安全';
    return `<tr><td>${fmt(x.users)}</td><td>${fmt(Math.round(x.actions))}</td><td>${fmt(Math.round(x.worker))} <span class="small">(${wp.toFixed(1)}%)</span></td><td>${fmt(Math.round(x.writes))} <span class="small">(${dp.toFixed(1)}%)</span></td><td>${tag}</td></tr>`;
  }).join('');

  $('#usage').innerHTML=`
    <h2>今日成本監控（UTC ${d.dayUtc}）</h2>
    <div class="quota-grid">
      <div class="quota-card"><span>總帳號</span><br><b>${fmt(d.totalUsers)}</b></div>
      <div class="quota-card"><span>24 小時活躍</span><br><b>${fmt(active)}</b></div>
      <div class="quota-card"><span>今日遊戲操作</span><br><b>${fmt(actions)}</b></div>
      <div class="quota-card"><span>今日戰鬥</span><br><b>${fmt(battles)}</b></div>
    </div>

    ${bar('D1 寫入－遊戲內估算',estWrite,LIMITS.d1Write,' 列')}
    ${bar('Workers 動態請求－規劃估算',estWorkerToday,LIMITS.worker,' 次')}

    <div class="section-box">
      <h3>依目前玩家強度推估</h3>
      <p class="muted">這是容量規劃，不是 Cloudflare 帳單。樣本玩家越多、跑越久，推估會越有參考價值。</p>
      <table class="target-table"><thead><tr><th>每日活躍玩家</th><th>遊戲操作</th><th>Workers 規劃估算</th><th>D1 寫入估算</th><th>判斷</th></tr></thead><tbody>${projectionRows}</tbody></table>
      <p>目前每位 24h 活躍玩家：約 <b>${perActiveActions.toFixed(1)}</b> 次遊戲操作、<b>${perActiveWrites.toFixed(1)}</b> 列 D1 寫入；Workers 規劃值約 <b>${perActiveWorker.toFixed(1)}</b> 次／人／日。</p>
    </div>

    <div class="section-box">
      <h3>Cloudflare 免費額度基準</h3>
      <table class="target-table"><tbody>
        <tr><td>Workers 動態請求</td><td><b>${fmt(LIMITS.worker)} / 日</b></td></tr>
        <tr><td>D1 Rows Read</td><td><b>${fmt(LIMITS.d1Read)} / 日</b></td></tr>
        <tr><td>D1 Rows Written</td><td><b>${fmt(LIMITS.d1Write)} / 日</b></td></tr>
        <tr><td>D1 儲存</td><td><b>${LIMITS.d1StorageGB} GB</b></td></tr>
        <tr><td>Durable Objects Requests</td><td><b>${fmt(LIMITS.doReq)} / 日</b></td></tr>
      </tbody></table>
    </div>

    <div class="notice warning"><b>70% 警戒：</b>開始檢查輪詢、排行榜與聊天頻率。　<b>90% 危險：</b>先限制高頻功能或準備升級方案。　<b>100%：</b>D1 免費列數額度達上限時，資料庫查詢會失敗直到 UTC 午夜重置。</div>
    <div class="section-box"><h3>真正計費數字要看 Cloudflare</h3><p>Workers：ebs-revival → 指標 / Metrics，看 Requests、Errors、CPU Time。<br>D1：D1 → 選擇遊戲資料庫 → Metrics → Row Metrics，看 Rows read / Rows written / Storage。<br>Durable Objects：Durable Objects → ChatRoom / GameWorld → Metrics，看 Requests 與 Duration。</p><p class="muted">管理頁刻意不為每一個 HTTP request 再寫一筆統計資料，否則監控本身就會消耗 D1 寫入額度。</p></div>
    <div class="notice">${d.note||'Cloudflare 實際用量以 Dashboard 為準。'}</div>`;
}

$('#loadBtn').onclick=load;
load();
