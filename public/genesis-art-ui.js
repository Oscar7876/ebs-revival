(()=>{
  const ids=Array.from({length:20},(_,i)=>`m${String(i+1).padStart(2,'0')}`);
  const nameToId={
    '先鋒原型一號':'m01','巨砲堡壘型':'m02','紫電偵察型':'m03','烈紅近戰型':'m04','暴雨飛彈型':'m05',
    '影披狙擊型':'m06','皇旗指揮型':'m07','黃鋼回收型':'m08','深海兩棲型':'m09','靜默干擾型':'m10',
    '蒼槍突擊型':'m11','夜幕匿蹤型':'m12','砂塵火砲型':'m13','天翔變形型':'m14','白羽醫療型':'m15',
    '城塞防衛型':'m16','雙刃決鬥型':'m17','光炮攻城型':'m18','鷹眼無人機型':'m19','熔岩重擊型':'m20'
  };
  if(!window.GENESIS_SPRITE)return;

  const style=document.createElement('style');
  style.textContent=`
    .mech-sprite{display:block;flex:0 0 auto;background-image:url('${window.GENESIS_SPRITE}');background-repeat:no-repeat;background-color:#080d12;border-radius:6px}
    .gen-art .mech-sprite{width:145px;height:145px;background-size:725px 580px}
    #myActor .mech-sprite{width:168px;height:168px;background-size:840px 672px;margin:0 auto 10px}
    .chooseMechBtn{width:100%;margin-top:10px;min-height:42px}
    .chooseMechBtn.current{opacity:.62;cursor:default}
    .mech-choice-note{font-size:11px;color:#8fb3c1;margin-top:7px;line-height:1.45}
    .target-art{width:54px;height:54px;background-size:270px 216px;margin-right:10px;border:1px solid #29495d}
    .target{align-items:center}
  `;
  document.head.appendChild(style);

  function sprite(id,size){
    const index=Math.max(0,ids.indexOf(id));
    const col=index%5,row=Math.floor(index/5);
    const d=document.createElement('div');
    d.className='mech-sprite';
    d.setAttribute('role','img');
    d.setAttribute('aria-label',id.toUpperCase());
    d.style.width=`${size}px`;d.style.height=`${size}px`;
    d.style.backgroundSize=`${size*5}px ${size*4}px`;
    d.style.backgroundPosition=`-${col*size}px -${row*size}px`;
    return d;
  }

  function cardId(card){
    const meta=card.querySelector('.gen-meta')?.textContent||'';
    const m=meta.match(/M(\d{2})/i);
    return m?`m${m[1]}`:null;
  }

  function currentMechName(){
    return document.querySelector('#myActor .gen-meta')?.textContent?.split('｜')[0]?.trim()||'';
  }

  async function choose(id,button){
    const label=cardId(button.closest('.gen-mech'))?.toUpperCase()||id.toUpperCase();
    if(!confirm(`確定進入 Genesis 機庫選擇 ${label}？\n\n第一次正式選擇免費；之後更換會依機體價格收取整備費，並保留目前 HP／EN 比例。`))return;
    const old=button.textContent;button.disabled=true;button.textContent='整備中…';
    try{
      const r=await fetch('/api/genesis/action',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({action:'selectMech',mechId:id})});
      let d={};try{d=await r.json();}catch{}
      if(!r.ok)throw new Error(d.error||`伺服器錯誤 ${r.status}`);
      alert(d.free?`已免費選擇初始機體。`:`機體更換完成，整備費 ${Number(d.cost||0).toLocaleString('zh-TW')} G 已永久銷毀。`);
      location.reload();
    }catch(e){
      alert(e.message);button.disabled=false;button.textContent=old;
    }
  }

  function enhanceMechCards(){
    const current=currentMechName();
    document.querySelectorAll('.gen-mech').forEach(card=>{
      const id=cardId(card);if(!id)return;
      const art=card.querySelector('.gen-art');
      if(art&&!art.querySelector('.mech-sprite')){art.innerHTML='';art.appendChild(sprite(id,145));}
      if(!card.querySelector('.chooseMechBtn')){
        const name=card.querySelector('h3')?.textContent?.trim()||'';
        const btn=document.createElement('button');btn.type='button';btn.className='chooseMechBtn';
        const isCurrent=name&&name===current;
        btn.textContent=isCurrent?'目前駕駛':'選擇此機體';
        if(isCurrent){btn.disabled=true;btn.classList.add('current');}
        else btn.addEventListener('click',()=>choose(id,btn));
        card.appendChild(btn);
        const note=document.createElement('div');note.className='mech-choice-note';note.textContent='首次選擇免費；之後更換需 Genesis G 整備費，HP／EN 不會因換機補滿。';card.appendChild(note);
      }
    });
  }

  function enhanceActor(){
    const img=document.querySelector('#myActor .actor-card img');if(!img)return;
    const id=nameToId[img.alt];if(!id)return;
    img.replaceWith(sprite(id,168));
  }

  function enhanceTargets(){
    document.querySelectorAll('#targets .target').forEach(row=>{
      if(row.querySelector('.target-art'))return;
      const meta=row.querySelector('.target-meta')?.textContent||'';
      const mechName=meta.split('｜')[0]?.trim();const id=nameToId[mechName];if(!id)return;
      const art=sprite(id,54);art.classList.add('target-art');row.insertBefore(art,row.firstChild);
    });
  }

  let queued=false;
  function enhance(){queued=false;enhanceMechCards();enhanceActor();enhanceTargets();}
  const obs=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(enhance);});
  obs.observe(document.body,{childList:true,subtree:true});
  enhance();
})();
