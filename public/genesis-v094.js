/* Genesis v0.9.4 hotfix.5: UI compatibility + shop fallback + dungeon UI */
function v094EnsureLegacyDom(){
  // v0.7 shared renderHangar still writes to #weaponGrid. v0.9.3 moved weapons to
  // a dedicated shop, so keep a hidden compatibility host to prevent render()
  // from crashing after every action.
  if(!document.querySelector('#weaponGrid')){
    const panel=document.querySelector('#tab-hangar .panel');
    if(panel){const el=document.createElement('div');el.id='weaponGrid';el.hidden=true;el.setAttribute('aria-hidden','true');panel.appendChild(el);}
  }
}
v094EnsureLegacyDom();

const V094_FALLBACK_WEAPONS=[
  {id:'rifle',name:'光束步槍',typeLabel:'光束',power:680,hits:3,acc:86,speed:82,en:24,heat:15,weight:16,price:0,effect:'均衡型'},
  {id:'mg',name:'90mm 機關槍',typeLabel:'實彈',power:175,hits:12,acc:78,speed:94,en:8,heat:27,weight:11,price:3200,effect:'多段命中'},
  {id:'bazooka',name:'超級火箭砲',typeLabel:'實彈',power:2450,hits:1,acc:68,speed:48,en:18,heat:32,weight:30,price:7200,effect:'破甲特化'},
  {id:'saber',name:'光束軍刀',typeLabel:'近戰',power:1120,hits:2,acc:90,speed:96,en:16,heat:12,weight:8,price:4500,effect:'破盾斬擊'},
  {id:'missile',name:'飛彈莢艙',typeLabel:'飛彈',power:390,hits:6,acc:72,speed:63,en:22,heat:20,weight:22,price:6100,effect:'對重裝加成'},
  {id:'sniper',name:'長程光束狙擊槍',typeLabel:'光束',power:3100,hits:1,acc:96,speed:35,en:54,heat:40,weight:27,price:9800,effect:'精準狙擊'},
  {id:'emp',name:'電磁脈衝干擾器',typeLabel:'電磁脈衝',power:190,hits:3,acc:84,speed:70,en:32,heat:22,weight:18,price:8800,effect:'能源干擾'}
];
function v094FallbackShopItems(){
  const a=STATE?.myActor;if(!a)return[];
  const owned=new Set(Array.isArray(a.ownedWeapons)?a.ownedWeapons:['rifle']);
  const equipped=a.weaponId||a.equipped||'rifle';
  return V094_FALLBACK_WEAPONS.map(w=>{
    const cost={money:w.price,ore:w.price>0?Math.max(2,Math.ceil(w.price/700)):0};
    const isOwned=owned.has(w.id),isEquipped=equipped===w.id;
    return {...w,cost,owned:isOwned,equipped:isEquipped,loadOk:true,affordable:(a.money||0)>=cost.money&&(a.ore||0)>=cost.ore,actionReason:isEquipped?'目前裝備中':isOwned?'可裝備':`需要 ${cost.money} G / 礦石 ${cost.ore}`};
  });
}
function v094ShopItems(){
  const a=STATE?.shopInventory;
  if(Array.isArray(a)&&a.length)return a;
  const b=STATE?.equipmentInventory;
  if(Array.isArray(b)&&b.length)return b;
  return v094FallbackShopItems();
}
function v094RenderShop(){
  const items=v094ShopItems(),host=$('#shopWeaponGrid');if(!host)return;
  const a=STATE?.myActor;
  if(!a){host.innerHTML='<div class="empty">請先加入 Genesis 世界。</div>';return;}
  const summary=$('#shopSummary');if(summary){const owned=items.filter(x=>x.owned).length,aff=items.filter(x=>!x.owned&&x.affordable).length;summary.innerHTML=`<div class="v093-shop-wallet"><div><span>🪙 Genesis G</span><b>${fmt(a.money)}</b></div><div><span>⛏️ 礦石</span><b>${fmt(a.ore)}</b></div><div><span>🎒 已擁有</span><b>${owned}/${items.length}</b></div><div><span>🛒 現在買得起</span><b>${aff}</b></div></div><p class="hint">商品由 Genesis 世界後端同步；若同步暫時失敗，畫面仍會顯示 7 款標準裝備目錄。</p>`;}
  if(!items.length){host.innerHTML='<div class="v094-shop-empty"><b>⚠️ 商店資料尚未同步</b><span>請按「同步商品」，系統會重新取得 Genesis 裝備目錄。</span><button id="v094ReloadShop">🔄 同步商品</button></div>';$('#v094ReloadShop').onclick=()=>load(true);return;}
  host.innerHTML=items.map(w=>`<article class="weapon-card v093-shop-card ${w.equipped?'equipped':''}"><div class="v093-shop-title"><h3>🔫 ${esc(w.name)}</h3><span>${w.equipped?'✅ 使用中':w.owned?'🎒 已擁有':'🛒 商店商品'}</span></div><div class="weapon-price">${w.owned?'已購入':`🪙 ${fmt(w.cost?.money)} G｜⛏️ 礦石 ${fmt(w.cost?.ore)}`}</div><div class="weapon-stats">${esc(w.typeLabel)}｜威力 ${fmt(w.power)} × ${w.hits}<br>🎯 命中 ${w.acc}%｜💨 速度 ${w.speed}｜🔋 EN ${w.en}｜🔥 熱 ${w.heat}<br>⚖️ 載重 ${w.weight}｜${esc(w.effect)}</div>${w.equipped?'<button disabled>✅ 使用中</button>':w.owned?`<button data-v094-equip="${w.id}" ${w.loadOk?'':'disabled'}>${w.loadOk?'🔧 裝備':'⚠️ 機體載重不足'}</button>`:`<button data-v094-buy="${w.id}" ${w.affordable?'':'disabled'}>${w.affordable?'🛒 購買':'🔒 素材不足'}</button>`}<small>${esc(w.actionReason||'')}</small></article>`).join('');
  host.querySelectorAll('[data-v094-buy]').forEach(b=>b.onclick=()=>act('buyWeapon',{weaponId:b.dataset.v094Buy},'🛒 購買成功','#shopMessage'));
  host.querySelectorAll('[data-v094-equip]').forEach(b=>b.onclick=()=>act('equipWeapon',{weaponId:b.dataset.v094Equip},'🔧 裝備完成','#shopMessage'));
}
try{v093RenderShop=v094RenderShop;}catch{}

function v094RewardHtml(d){return (d.rewardText||[]).map(x=>`<span>${esc(x)}</span>`).join('');}
function v094RenderDungeons(){
  const host=$('#dungeonGrid'),a=STATE?.myActor;if(!host)return;
  if(!a){host.innerHTML='<div class="empty">請先加入 Genesis 世界。</div>';return;}
  const list=STATE?.dungeons||[];
  $('#dungeonWallet').innerHTML=`<div class="resource"><span>❤️ HP</span><b>${fmt(a.hp)}/${fmt(a.maxHp)}</b></div><div class="resource"><span>🔋 EN</span><b>${fmt(a.en)}/${fmt(a.maxEn)}</b></div><div class="resource"><span>🧭 挑戰次數</span><b>${fmt(a.dungeonRuns||0)}</b></div><div class="resource"><span>🏆 通關</span><b>${fmt(a.dungeonClears||0)}</b></div>`;
  if(!list.length){host.innerHTML='<div class="empty">副本資料載入中，請按「同步狀態」重新取得副本清單。</div>';return;}
  host.innerHTML=list.map(d=>`<article class="v094-dungeon-card tier-${d.tier}"><div class="v094-dungeon-head"><span>副本 T${d.tier}</span><b>${esc(d.name)}</b></div><p>${esc(d.desc)}</p><div class="v094-dungeon-stats"><span>🎯 成功率 <b>${d.successPercent}%</b></span><span>🔋 EN <b>${fmt(d.enCost)}</b></span><span>❤️ 最低 HP <b>${Math.round(d.hpMinPct*100)}%</b></span><span>💥 預估傷害 <b>${Math.round(d.damageMin*100)}～${Math.round(d.damageMax*100)}%</b></span><span>⏱ 冷卻 <b>${Math.round(d.cooldown/1000)} 秒</b></span><span>✨ 稀有 <b>${esc(d.rare)}</b></span></div><div class="v094-rewards"><b>可能取得</b>${v094RewardHtml(d)}</div><button data-dungeon="${d.id}" ${d.available?'':'disabled'}>${d.available?'🚀 進入副本':'🔒 '+esc(d.reason)}</button></article>`).join('');
  host.querySelectorAll('[data-dungeon]').forEach(b=>b.onclick=()=>v094RunDungeon(b,b.dataset.dungeon));
}
async function v094RunDungeon(btn,id){
  if(btn.disabled)return;const d=(STATE?.dungeons||[]).find(x=>x.id===id),old=btn.textContent;btn.disabled=true;btn.textContent='⏳ 副本作戰中…';msg('#dungeonMessage',`⏳ 正在挑戰「${d?.name||id}」…`,false,true);
  try{const r=await api('/api/genesis/action',{method:'POST',body:JSON.stringify({action:'runDungeon',dungeonId:id})});STATE=r.state;snapshotAt=Date.now();render();const gain=r.reward||{};const loot=[['G',gain.currency],['礦石',gain.ore],['晶體',gain.crystal],['合金',gain.alloy],['資料',gain.data],['核心',gain.core]].filter(([,v])=>v>0).map(([k,v])=>`${k} +${v}`).join(' / ');msg('#dungeonMessage',`${r.success?'✅ 通關':'❌ 挑戰失敗'}｜🔋 EN -${r.enCost}｜❤️ HP -${r.damage}${r.success?`｜🎁 ${loot||'世界儲備不足，未取得資源'}`:''}${r.destroyed?'｜💥 機體重創進入大修':''}`,!r.success);}catch(e){msg('#dungeonMessage',`❌ ${e.message}`,true);}finally{btn.disabled=false;btn.textContent=old;}
}
const v094OldRender=render;
render=function(){v094EnsureLegacyDom();v094OldRender();try{v094RenderShop();v094RenderDungeons();}catch(e){console.error('Genesis v0.9.4 render',e);}};
setTimeout(()=>{try{v094EnsureLegacyDom();if(STATE){v094RenderShop();v094RenderDungeons();}}catch(e){console.error('Genesis v0.9.4 init',e);}},0);
