/* Genesis v0.9.4: shop hardening + dungeon UI */
function v094ShopItems(){
  const a=STATE?.shopInventory;
  if(Array.isArray(a)&&a.length)return a;
  const b=STATE?.equipmentInventory;
  return Array.isArray(b)?b:[];
}
function v094RenderShop(){
  const items=v094ShopItems(),host=$('#shopWeaponGrid');if(!host)return;
  const a=STATE?.myActor;
  if(!a){host.innerHTML='<div class="empty">請先加入 Genesis 世界。</div>';return;}
  const summary=$('#shopSummary');if(summary){const owned=items.filter(x=>x.owned).length,aff=items.filter(x=>!x.owned&&x.affordable).length;summary.innerHTML=`<div class="v093-shop-wallet"><div><span>🪙 Genesis G</span><b>${fmt(a.money)}</b></div><div><span>⛏️ 礦石</span><b>${fmt(a.ore)}</b></div><div><span>🎒 已擁有</span><b>${owned}/${items.length||7}</b></div><div><span>🛒 現在買得起</span><b>${aff}</b></div></div><p class="hint">商品由 Genesis 世界後端即時回傳；購買只消耗 Genesis G 與礦石。</p>`;}
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
  if(!list.length){host.innerHTML='<div class="empty">副本資料載入中，請同步狀態。</div>';return;}
  host.innerHTML=list.map(d=>`<article class="v094-dungeon-card tier-${d.tier}"><div class="v094-dungeon-head"><span>副本 T${d.tier}</span><b>${esc(d.name)}</b></div><p>${esc(d.desc)}</p><div class="v094-dungeon-stats"><span>🎯 成功率 <b>${d.successPercent}%</b></span><span>🔋 EN <b>${fmt(d.enCost)}</b></span><span>❤️ 最低 HP <b>${Math.round(d.hpMinPct*100)}%</b></span><span>💥 預估傷害 <b>${Math.round(d.damageMin*100)}～${Math.round(d.damageMax*100)}%</b></span><span>⏱ 冷卻 <b>${Math.round(d.cooldown/1000)} 秒</b></span><span>✨ 稀有 <b>${esc(d.rare)}</b></span></div><div class="v094-rewards"><b>可能取得</b>${v094RewardHtml(d)}</div><button data-dungeon="${d.id}" ${d.available?'':'disabled'}>${d.available?'🚀 進入副本':'🔒 '+esc(d.reason)}</button></article>`).join('');
  host.querySelectorAll('[data-dungeon]').forEach(b=>b.onclick=()=>v094RunDungeon(b,b.dataset.dungeon));
}
async function v094RunDungeon(btn,id){
  if(btn.disabled)return;const d=(STATE?.dungeons||[]).find(x=>x.id===id),old=btn.textContent;btn.disabled=true;btn.textContent='⏳ 副本作戰中…';msg('#dungeonMessage',`⏳ 正在挑戰「${d?.name||id}」…`,false,true);
  try{const r=await api('/api/genesis/action',{method:'POST',body:JSON.stringify({action:'runDungeon',dungeonId:id})});STATE=r.state;snapshotAt=Date.now();render();const gain=r.reward||{};const loot=[['G',gain.currency],['礦石',gain.ore],['晶體',gain.crystal],['合金',gain.alloy],['資料',gain.data],['核心',gain.core]].filter(([,v])=>v>0).map(([k,v])=>`${k} +${v}`).join(' / ');msg('#dungeonMessage',`${r.success?'✅ 通關':'❌ 挑戰失敗'}｜🔋 EN -${r.enCost}｜❤️ HP -${r.damage}${r.success?`｜🎁 ${loot||'世界儲備不足，未取得資源'}`:''}${r.destroyed?'｜💥 機體重創進入大修':''}`,!r.success);}catch(e){msg('#dungeonMessage',`❌ ${e.message}`,true);}finally{btn.disabled=false;btn.textContent=old;}
}
const v094OldRender=render;
render=function(){v094OldRender();try{v094RenderShop();v094RenderDungeons();}catch(e){console.error('Genesis v0.9.4 render',e);}};
setTimeout(()=>{try{if(STATE){v094RenderShop();v094RenderDungeons();}}catch(e){console.error('Genesis v0.9.4 init',e);}},0);
