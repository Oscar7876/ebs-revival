/* Genesis v0.8.1 UI hotfix: prevent cockpit focus panel from aborting the whole render tree. */
(function(){
  function safeFocusHtml(){
    const a=typeof localActor==='function'?localActor():null;
    const rows=(typeof STATE!=='undefined'&&STATE?.combatFocus)||[];
    if(!rows.length)return '<div class="empty">目前沒有持續交戰目標。攻擊或遭到攻擊後，未擊毀的對象會自動出現在這裡。</div>';
    return `<div class="combat-focus-grid">${rows.map(x=>`<div class="combat-focus-card"><img src="${mechArt(x.mechId)}" alt="${esc(x.mechName)}"><div><b>${esc(x.name)}</b><small class="${x.kind==='revenge'?'revenge':'engage'}">${x.kind==='revenge'?'🔥 復仇目標':'🎯 持續交戰'}</small><div class="target-meta">${esc(x.mechName)}<br>HP ${fmt(x.hp)}/${fmt(x.maxHp)}｜EN ${fmt(x.en)}/${fmt(x.maxEn)}</div></div><button class="v08-repeat" data-id="${x.targetId}" ${a?.attackReady?'':'disabled'}>⚔️ 再次攻擊</button></div>`).join('')}</div>`;
  }
  function safeRenderFocus(){
    const tab=document.querySelector('#tab-cockpit');
    if(!tab)return;
    let panel=tab.querySelector(':scope > .combat-focus-panel');
    if(!panel){
      panel=document.createElement('article');
      panel.className='panel combat-focus-panel';
      panel.innerHTML='<h2>🎯 持續交戰 / 復仇目標</h2><p class="hint">只保留尚未擊毀、尚未完成復仇的對象；方便能源恢復後直接再次出擊。</p><div id="combatFocus"></div>';
      const grid=tab.querySelector(':scope > .cockpit-grid');
      if(grid)grid.insertAdjacentElement('afterend',panel); else tab.appendChild(panel);
    }
    const box=panel.querySelector('#combatFocus');
    if(box)box.innerHTML=safeFocusHtml();
    panel.querySelectorAll('.v08-repeat').forEach(b=>b.onclick=()=>act('attack',{targetId:b.dataset.id},'再次交戰完成',true));
  }
  try{v08RenderFocus=safeRenderFocus;}catch(e){window.v08RenderFocus=safeRenderFocus;}

  window.addEventListener('error',e=>{
    const msg=document.querySelector('#battleMessage')||document.querySelector('#joinMsg');
    if(msg&&/render|insertBefore|NotFoundError/i.test(String(e?.message||''))){
      msg.textContent='介面渲染發生錯誤，已啟用 v0.8.1 容錯模式；請重新整理頁面。';
      msg.style.color='#ffcf70';
    }
  });

  setTimeout(()=>{
    try{if(typeof STATE!=='undefined'&&STATE&&typeof render==='function')render();}catch(e){console.error('Genesis v0.8.1 recovery render failed',e);}
  },0);
})();
