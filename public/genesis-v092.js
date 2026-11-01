/* Genesis v0.9.2: 100 world-city 4D battle themes + Genesis-only equipment inventory */
const V092_CITIES=`台北|台灣|neon
東京|日本|neon
首爾|韓國|neon
新加坡|新加坡|tropical
香港|香港|harbor
上海|中國|neon
北京|中國|historic
曼谷|泰國|tropical
吉隆坡|馬來西亞|tropical
雅加達|印尼|tropical
馬尼拉|菲律賓|tropical
河內|越南|historic
胡志明市|越南|tropical
大阪|日本|neon
京都|日本|historic
杜拜|阿聯酋|desert
阿布達比|阿聯酋|desert
杜哈|卡達|desert
利雅德|沙烏地阿拉伯|desert
伊斯坦堡|土耳其|historic
耶路撒冷|以色列|historic
孟買|印度|tropical
新德里|印度|historic
班加羅爾|印度|tech
清奈|印度|tropical
加爾各答|印度|historic
加德滿都|尼泊爾|alpine
可倫坡|斯里蘭卡|tropical
卡拉奇|巴基斯坦|desert
達卡|孟加拉|tropical
巴黎|法國|historic
倫敦|英國|fog
羅馬|義大利|historic
米蘭|義大利|modern
威尼斯|義大利|harbor
佛羅倫斯|義大利|historic
柏林|德國|modern
慕尼黑|德國|alpine
維也納|奧地利|historic
布拉格|捷克|historic
布達佩斯|匈牙利|historic
華沙|波蘭|modern
阿姆斯特丹|荷蘭|harbor
布魯塞爾|比利時|historic
哥本哈根|丹麥|harbor
斯德哥爾摩|瑞典|harbor
奧斯陸|挪威|harbor
赫爾辛基|芬蘭|snow
雷克雅維克|冰島|snow
都柏林|愛爾蘭|fog
里斯本|葡萄牙|coastal
馬德里|西班牙|modern
巴塞隆納|西班牙|coastal
雅典|希臘|historic
蘇黎世|瑞士|alpine
日內瓦|瑞士|alpine
愛丁堡|英國|fog
莫斯科|俄羅斯|snow
聖彼得堡|俄羅斯|snow
基輔|烏克蘭|modern
紐約|美國|megacity
洛杉磯|美國|coastal
舊金山|美國|fog
拉斯維加斯|美國|neon
芝加哥|美國|modern
邁阿密|美國|tropical
波士頓|美國|historic
華盛頓特區|美國|historic
西雅圖|美國|rain
多倫多|加拿大|modern
溫哥華|加拿大|rain
蒙特婁|加拿大|snow
墨西哥城|墨西哥|historic
坎昆|墨西哥|tropical
哈瓦那|古巴|historic
巴拿馬城|巴拿馬|tropical
聖荷西|哥斯大黎加|tropical
聖保羅|巴西|megacity
里約熱內盧|巴西|coastal
布宜諾斯艾利斯|阿根廷|historic
聖地牙哥|智利|alpine
利馬|秘魯|desert
波哥大|哥倫比亞|alpine
麥德林|哥倫比亞|tropical
基多|厄瓜多|alpine
蒙特維多|烏拉圭|coastal
開普敦|南非|coastal
約翰尼斯堡|南非|modern
開羅|埃及|desert
馬拉喀什|摩洛哥|desert
卡薩布蘭卡|摩洛哥|coastal
奈洛比|肯亞|savanna
阿迪斯阿貝巴|衣索比亞|alpine
拉哥斯|奈及利亞|tropical
阿克拉|迦納|tropical
雪梨|澳洲|harbor
墨爾本|澳洲|modern
布里斯本|澳洲|tropical
奧克蘭|紐西蘭|harbor
皇后鎮|紐西蘭|alpine`.split('\n').map((x,i)=>{const [name,country,theme]=x.split('|');return{id:i+1,name,country,theme};});

function v092City(b){const id=Math.max(1,Math.min(100,Number(b?.cityId)||((v09Seed(b?.id)%100)+1)));return V092_CITIES[id-1];}
function v092Weather(city,b){const r=v09Rng(v09Seed(`${b?.id}:${city.id}:weather`)),roll=r();if(city.theme==='snow')return roll<.55?'snow':roll<.8?'fog':'clear';if(city.theme==='desert')return roll<.42?'sand':roll<.65?'sunset':'clear';if(city.theme==='rain'||city.theme==='fog')return roll<.5?city.theme:roll<.75?'rain':'clear';if(city.theme==='tropical')return roll<.42?'rain':roll<.62?'storm':'clear';if(city.theme==='neon'||city.theme==='megacity')return roll<.5?'neon':roll<.72?'rain':'clear';return roll<.18?'rain':roll<.34?'fog':roll<.48?'sunset':'clear';}
function v092Time(b){const r=v09Rng(v09Seed(`${b?.id}:time`))();return r<.42?'night':r<.64?'sunset':r<.82?'dawn':'day';}
function v092LandmarkClass(city){const map={neon:'tower',tropical:'palms',harbor:'bridge',historic:'dome',desert:'spire',alpine:'mountain',tech:'tower',fog:'bridge',modern:'skyline',coastal:'bridge',snow:'spire',megacity:'tower',rain:'skyline',savanna:'dome'};return map[city.theme]||'skyline';}
function v092DecorateCity(b){const field=$('#battleField'),scene=field?.querySelector('.v09-scene');if(!field||!scene)return;const city=v092City(b),weather=v092Weather(city,b),time=v092Time(b);scene.dataset.city=String(city.id);scene.classList.add(`v092-theme-${city.theme}`,`v092-weather-${weather}`,`v092-time-${time}`);let tag=scene.querySelector('.v092-city-tag');if(!tag){tag=document.createElement('div');tag.className='v092-city-tag';scene.appendChild(tag);}tag.innerHTML=`<b>🌐 ${String(city.id).padStart(3,'0')} ${esc(city.name)}</b><span>${esc(city.country)}｜${time==='night'?'夜戰':time==='sunset'?'夕照':time==='dawn'?'黎明':'日間'}｜${weather==='clear'?'晴朗':weather==='rain'?'降雨':weather==='storm'?'雷雨':weather==='fog'?'霧':weather==='snow'?'降雪':weather==='sand'?'沙塵':'霓虹'}</span>`;let lm=scene.querySelector('.v092-landmark');if(!lm){lm=document.createElement('div');scene.appendChild(lm);}lm.className=`v092-landmark ${v092LandmarkClass(city)}`;let wx=scene.querySelector('.v092-weather');if(!wx){wx=document.createElement('div');wx.className='v092-weather';scene.appendChild(wx);for(let i=0;i<24;i++){const p=document.createElement('i');p.style.setProperty('--x',`${(i*37)%100}%`);p.style.setProperty('--d',`${1.2+(i%7)*.17}s`);p.style.setProperty('--delay',`${-(i%11)*.13}s`);wx.appendChild(p);}}$('#battleStageWeapon').textContent=`4D ${city.name}｜${b.attacker.weaponName||''} VS ${b.defender.weaponName||''}`;}
const v092OldPlayBattle=playBattle;
playBattle=function(b){v092OldPlayBattle(b);requestAnimationFrame(()=>v092DecorateCity(b));setTimeout(()=>v092DecorateCity(b),80);};

function v092OwnedEquipment(){const a=STATE?.myActor,items=(STATE?.equipmentInventory||[]).filter(x=>x.owned);if(!a||!items.length)return '<div class="empty">尚無 Genesis 裝備。</div>';return items.map(w=>`<div class="v092-equip-item ${w.equipped?'equipped':''}"><div><b>${w.equipped?'✅':'🔫'} ${esc(w.name)}</b><small>${esc(w.typeLabel)}｜威力 ${fmt(w.power)} × ${w.hits}｜命中 ${w.acc}%｜EN ${w.en}｜載重 ${w.weight}</small></div>${w.equipped?'<span class="v092-equipped">使用中</span>':`<button class="v092-equip-btn" data-equip="${w.id}" ${w.loadOk?'':'disabled'}>${w.loadOk?'裝備':'超載'}</button>`}</div>`).join('');}
const v092OldRenderActor=renderActor;
renderActor=function(){v092OldRenderActor();const host=$('#myActor');if(!host)return;let panel=host.querySelector('.v092-owned-equipment');if(!panel){panel=document.createElement('div');panel.className='v092-owned-equipment';host.appendChild(panel);}panel.innerHTML=`<div class="v092-equip-title"><b>🎒 Genesis 已購裝備</b><span>與主世界裝備庫完全分離</span></div><div class="v092-equip-list">${v092OwnedEquipment()}</div>`;panel.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>act('equipWeapon',{weaponId:b.dataset.equip},'🔧 已更換 Genesis 裝備','#battleMessage'));};

function v092RenderWeaponShop(){const a=STATE?.myActor,items=STATE?.equipmentInventory||[];if(!a||!items.length)return;const host=$('#weaponGrid');if(!host)return;host.innerHTML=items.map(w=>`<article class="weapon-card ${w.equipped?'equipped':''}"><h3>🔫 ${esc(w.name)} ${w.equipped?'✓':''}</h3><div class="weapon-price">${w.owned?'✅ 已擁有':`🪙 ${fmt(w.cost.money)} G｜⛏️ 礦石 ${fmt(w.cost.ore)}`}</div><div class="weapon-stats">${esc(w.typeLabel)}｜威力 ${w.power} × ${w.hits}<br>🎯 ${w.acc}%｜💨 ${w.speed}｜🔋 ${w.en}｜🔥 ${w.heat}<br>⚖️ ${w.weight} / 機體載重 ${mechInfo(a.mechId).maxLoad||'-'}｜${esc(w.effect)}</div>${w.equipped?'<button disabled>✅ 使用中</button>':w.owned?`<button data-shop-equip="${w.id}" ${w.loadOk?'':'disabled'}>${w.loadOk?'🔧 裝備':'⚠️ 超過載重'}</button>`:`<button data-buy="${w.id}" ${w.affordable?'':'disabled'}>${w.affordable?'🛒 購買':'🔒 素材不足'}</button>`}<small>${esc(w.actionReason||'')}</small></article>`).join('');host.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>act('buyWeapon',{weaponId:b.dataset.buy},'🛒 Genesis 裝備購買完成','#battleMessage'));host.querySelectorAll('[data-shop-equip]').forEach(b=>b.onclick=()=>act('equipWeapon',{weaponId:b.dataset.shopEquip},'🔧 Genesis 裝備切換完成','#battleMessage'));}
const v092OldRenderHangar=renderHangar;
renderHangar=function(){v092OldRenderHangar();v092RenderWeaponShop();};

setTimeout(()=>{try{if(STATE){renderActor();v092RenderWeaponShop();}}catch(e){console.error('Genesis v0.9.2 overlay',e);}},0);
