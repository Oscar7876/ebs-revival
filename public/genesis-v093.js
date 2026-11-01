/* Genesis v0.9.3: competition pressure + dedicated equipment shop */
function v093CompetitionHtml(){
  const c=STATE?.competition,a=STATE?.myActor;
  if(!c||!a)return'';
  const shield=a.newcomerShielded?`<span class="v093-shield">🛡️ 新手保護 ${Math.max(1,Math.ceil((a.newcomerShieldRemainingMs||0)/60000))} 分</span>`:'<span class="v093-danger">⚔️ 已進入可被攻擊狀態</span>';
  return `<section class="v093-competition"><div class="v093-comp-head"><b>🎯 世界競爭密度｜${esc(c.tier)}</b>${shield}</div><div class="v093-comp-grid"><div><span>👤 真人</span><b>${fmt(c.humanCount)}</b></div><div><span>🤖 AI 對真人關注</span><b>${fmt(c.aiHumanFocusPercent)}%</b></div><div><span>🛡️ 新進保護</span><b>${fmt(c.newcomerShieldMinutes)} 分</b></div><div><span>⏱️ 同人 AI 威脅冷卻</span><b>${fmt(c.victimCooldownSeconds)} 秒</b></div></div><p>${esc(c.label)}。${esc(c.note)}</p><small>${esc(c.targetRule)}</small></section>`;
}
const v093OldRenderActor=renderActor;
renderActor=function(){v093OldRenderActor();const host=$('#myActor');if(!host)return;let box=host.querySelector('.v093-comp-wrap');if(!box){box=document.createElement('div');box.className='v093-comp-wrap';host.appendChild(box);}box.innerHTML=v093CompetitionHtml();};

function v093ShopSummary(){const a=STATE?.myActor,items=STATE?.equipmentInventory||[];if(!a)return;const host=$('#shopSummary');if(!host)return;const owned=items.filter(x=>x.owned).length,aff=items.filter(x=>!x.owned&&x.affordable).length;host.innerHTML=`<div class="v093-shop-wallet"><div><span>🪙 Genesis G</span><b>${fmt(a.money)}</b></div><div><span>⛏️ 礦石</span><b>${fmt(a.ore)}</b></div><div><span>🎒 已擁有</span><b>${owned}/${items.length}</b></div><div><span>🛒 現在買得起</span><b>${aff}</b></div></div><p class="hint">商店只使用 Genesis 資源；購買後永久加入 Genesis 裝備庫，不影響主世界裝備。</p>`;}
function v093RenderShop(){
  const items=STATE?.equipmentInventory||[],host=$('#shopWeaponGrid');if(!host)return;
  v093ShopSummary();
  host.innerHTML=items.map(w=>`<article class="weapon-card v093-shop-card ${w.equipped?'equipped':''}"><div class="v093-shop-title"><h3>🔫 ${esc(w.name)}</h3><span>${w.equipped?'✅ 使用中':w.owned?'🎒 已擁有':'🛒 商店商品'}</span></div><div class="weapon-price">${w.owned?'已購入':`🪙 ${fmt(w.cost.money)} G｜⛏️ 礦石 ${fmt(w.cost.ore)}`}</div><div class="weapon-stats">${esc(w.typeLabel)}｜威力 ${fmt(w.power)} × ${w.hits}<br>🎯 命中 ${w.acc}%｜💨 速度 ${w.speed}｜🔋 EN ${w.en}｜🔥 熱 ${w.heat}<br>⚖️ 載重 ${w.weight}｜${esc(w.effect)}</div>${w.equipped?'<button disabled>✅ 使用中</button>':w.owned?`<button data-v093-equip="${w.id}" ${w.loadOk?'':'disabled'}>${w.loadOk?'🔧 裝備':'⚠️ 機體載重不足'}</button>`:`<button data-v093-buy="${w.id}" ${w.affordable?'':'disabled'}>${w.affordable?'🛒 購買':'🔒 素材不足'}</button>`}<small>${esc(w.actionReason||'')}</small></article>`).join('');
  host.querySelectorAll('[data-v093-buy]').forEach(b=>b.onclick=()=>act('buyWeapon',{weaponId:b.dataset.v093Buy},'🛒 購買成功','#shopMessage'));
  host.querySelectorAll('[data-v093-equip]').forEach(b=>b.onclick=()=>act('equipWeapon',{weaponId:b.dataset.v093Equip},'🔧 裝備完成','#shopMessage'));
}
const v093OldRender=render;
render=function(){v093OldRender();try{v093RenderShop();}catch(e){console.error('Genesis v0.9.3 shop',e);}};
setTimeout(()=>{try{if(STATE){v093RenderShop();renderActor();}}catch(e){console.error('Genesis v0.9.3 init',e);}},0);
