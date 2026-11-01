const $=s=>document.querySelector(s);
let META=null,STATE=null,timer=null;
const fmt=n=>Number(n||0).toLocaleString('zh-TW');
const pct=(a,b)=>b?Math.max(0,Math.min(100,a/b*100)):0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when=t=>new Date(t).toLocaleString('zh-TW',{hour12:false});

async function api(path){const r=await fetch(path,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||`伺服器錯誤 ${r.status}`);return d;}
function card(label,value,cls=''){return `<div class="gen-card ${cls}"><span>${label}</span><b>${value}</b></div>`;}
function meter(label,value,cap,unit=''){const p=pct(value,cap);return `<div class="eco-row"><div class="eco-head"><span>${label}</span><b>${fmt(value)}${unit} / ${fmt(cap)}${unit}</b></div><div class="meter"><i style="width:${p}%"></i></div><small>${p.toFixed(3)}%</small></div>`;}

function render(){if(!META||!STATE)return;const s=STATE,m=META.world;
  $('#epochName').textContent=s.epochName;
  $('#blockHeight').textContent=`區塊 #${fmt(s.blockHeight)}｜文明 ${s.epoch}`;
  const healthCls=s.health<m.health.redBelow?'danger':s.health<m.health.yellowBelow?'warn':'good';
  $('#statusCards').innerHTML=[
    card('世界健康',`${s.health} / 100`,healthCls),
    card('存活 AI',fmt(s.population)),
    card('累計出生',fmt(s.totalBirths)),
    card('累計死亡',fmt(s.totalDeaths)),
    card('累計戰鬥',fmt(s.totalBattles))
  ].join('');

  $('#economy').innerHTML=
    meter('貨幣已發行',s.issued.currency,s.caps.currency,' G')+
    meter('礦石已發行',s.issued.ore,s.caps.ore)+
    meter('核心已發行',s.issued.core,s.caps.core)+
    `<div class="eco-row"><div class="eco-head"><span>世界金庫</span><b>${fmt(s.treasury.currency)} G / 礦石 ${fmt(s.treasury.ore)} / 核心 ${fmt(s.treasury.core)}</b></div></div>`+
    `<div class="eco-row"><div class="eco-head"><span>永久銷毀</span><b>${fmt(s.burned.currency)} G / 礦石 ${fmt(s.burned.ore)}</b></div></div>`;

  const ranks=s.topNPCs||[];
  $('#ranking').innerHTML=ranks.length?`<table class="rank-table"><thead><tr><th>#</th><th>AI</th><th>人格</th><th>機體</th><th>Lv</th><th>擊破</th></tr></thead><tbody>${ranks.map((n,i)=>`<tr><td>${i+1}</td><td>${esc(n.name)}</td><td>${esc(n.archetypeName)}</td><td>${esc(n.mechName)}</td><td>${n.level}</td><td>${n.kills}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">世界尚無存活 AI。</div>';

  $('#history').innerHTML=(s.history||[]).map(x=>`<div class="event">${esc(x.text)}<time>${when(x.t)}</time></div>`).join('')||'<div class="empty">尚無世界事件。</div>';
  $('#museum').innerHTML=(s.museum||[]).map(x=>`<div class="event"><b>${esc(x.name)}</b><br>區塊 ${fmt(x.blocks)}｜出生 ${fmt(x.totalBirths)}｜死亡 ${fmt(x.totalDeaths)}｜戰鬥 ${fmt(x.totalBattles)}${x.strongest?`<br>最強 AI：${esc(x.strongest.name)}（擊破 ${x.strongest.kills}）`:''}<br>終結：${esc(x.reason)}<time>${when(x.endedAt)}</time></div>`).join('')||'<div class="empty">目前仍是第一個文明，尚未產生滅亡紀錄。</div>';

  const mechs=META.mechs||[];
  $('#mechGrid').innerHTML=mechs.map(x=>`<article class="gen-mech"><div class="gen-art"><img src="${x.art}" alt="${esc(x.name)}"></div><h3>${esc(x.name)}</h3><div class="gen-meta">${esc(x.class)}｜${esc(x.id.toUpperCase())}</div><div class="gen-desc">${esc(x.desc)}</div><div class="mini-stats"><span>耐久 ${x.hp}</span><span>能源 ${x.en}</span><span>攻擊 ${x.atk}</span><span>裝甲 ${x.armor}</span><span>速度 ${x.speed}</span><span>命中 ${x.aim}</span><span>散熱 ${x.cooling}</span><span>載重 ${x.maxLoad}</span></div></article>`).join('');
  tickClock();
}

function tickClock(){clearInterval(timer);const draw=()=>{if(!STATE)return;const ms=Math.max(0,STATE.nextBlockAt-Date.now()),sec=Math.ceil(ms/1000),min=Math.floor(sec/60);$('#nextBlock').textContent=`${String(min).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;if(ms<=0){clearInterval(timer);setTimeout(loadState,1800);}};draw();timer=setInterval(draw,1000);}

async function loadState(){try{STATE=await api('/api/genesis/state');render();}catch(e){$('#epochName').textContent='Genesis 世界讀取失敗：'+e.message;}}
async function init(){try{[META,STATE]=await Promise.all([api('/api/genesis/meta'),api('/api/genesis/state')]);render();}catch(e){$('#epochName').textContent='Genesis 世界啟動失敗：'+e.message;}}
$('#refreshBtn').onclick=loadState;
init();
