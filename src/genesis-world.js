import { MECHS, mechById } from './catalog.js';

const BLOCK_MS=10*60*1000;
const CAP={currency:100000000,ore:10000000,core:100000};
const HALVING_BLOCKS=1008,START_AI=24,COMFORT_POP=150,SOFT_CAP=300,HARD_CAP=500;
const now=()=>Date.now(),clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),pick=a=>a[Math.floor(Math.random()*a.length)];
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const ARCHETYPES=[['aggressive','好戰型'],['raider','掠奪型'],['merchant','商人型'],['guardian','保守型'],['revenge','復仇型'],['opportunist','機會主義型']];
const DAMAGE_TYPES=[
  {id:'thruster',label:'推進器受損',speed:.84},
  {id:'targeting',label:'瞄準模組受損',aim:.84},
  {id:'cooling',label:'散熱系統受損',regen:.70},
  {id:'armor',label:'裝甲破裂',incoming:1.15}
];
function mech(id){return mechById(id)||MECHS[0];}
function statusInfo(a,t=now()){const s=a.damageStatus;if(!s||!s.until||s.until<=t){if(s)a.damageStatus=null;return null;}return s;}
function effective(a,t=now()){
  const m=mech(a.mechId),s=statusInfo(a,t),out={...m,incoming:1,regen:1};
  if(s){const d=DAMAGE_TYPES.find(x=>x.id===s.type);if(d?.speed)out.speed*=d.speed;if(d?.aim)out.aim*=d.aim;if(d?.regen)out.regen*=d.regen;if(d?.incoming)out.incoming*=d.incoming;}
  return out;
}
function enRegenFor(a){const m=effective(a);return +((0.42+m.cooling*.018+m.en/1100)*m.regen).toFixed(3);}
function hpRegenFor(a){const m=effective(a);return +((0.035+m.cooling*.0022)*(m.regen>.99?1:.72)).toFixed(3);}
function atkNeed(a){return Math.ceil(mech(a.mechId).en*.5);}
function counterNeed(a){return Math.ceil(mech(a.mechId).en*.35);}
function restoreCost(a){const m=mech(a.mechId);return Math.max(120,Math.ceil(Math.max(0,m.hp-a.hp)*.18+Math.max(0,m.en-a.en)*3.2+(statusInfo(a)?180:0)));}
function rewardAt(block){const era=Math.floor(Math.max(0,block-1)/HALVING_BLOCKS);return{era,currency:Math.max(1,Math.floor(1000/2**era)),ore:Math.max(1,Math.floor(100/2**era)),core:Math.max(0,Math.floor(1/2**era))};}
function spawnChance(pop){if(pop>=HARD_CAP)return 0;if(pop<=COMFORT_POP)return .92;if(pop>=SOFT_CAP)return .10;return .92-((pop-COMFORT_POP)/(SOFT_CAP-COMFORT_POP))*.82;}
function newAI(seq,t=now()){const m=pick(MECHS),[archetype,archetypeName]=pick(ARCHETYPES);return{id:`A:${seq}`,type:'ai',name:`AI-${String(seq).padStart(4,'0')}`,archetype,archetypeName,mechId:m.id,hp:m.hp,en:m.en,money:120+Math.floor(Math.random()*180),ore:Math.floor(Math.random()*5),core:0,wins:0,losses:0,alive:true,destroyedUntil:0,cooldownUntil:0,lastUpdate:t,lastAttackedAt:0,lastTargetId:null,bornBlock:0,damageStatus:null};}
function newHuman(uid,name,t=now()){const m=MECHS[0];return{id:`H:${uid}`,userId:uid,type:'human',name,archetype:'human',archetypeName:'真人駕駛員',mechId:m.id,hp:m.hp,en:m.en,money:500,ore:0,core:0,wins:0,losses:0,alive:true,destroyedUntil:0,cooldownUntil:0,lastUpdate:t,lastAttackedAt:0,lastTargetId:null,joinedAt:t,damageStatus:null};}
function recover(a,t=now()){
  const base=mech(a.mechId),dt=Math.max(0,(t-(a.lastUpdate||t))/1000);statusInfo(a,t);
  if(!a.alive){if(a.type==='human'&&a.destroyedUntil&&t>=a.destroyedUntil){a.alive=true;a.destroyedUntil=0;a.hp=Math.max(1,Math.round(base.hp*.3));a.en=Math.round(base.en*.5);a.damageStatus=null;}a.lastUpdate=t;return a;}
  a.en=clamp((a.en||0)+dt*enRegenFor(a),0,base.en);
  if(t-(a.lastAttackedAt||0)>30000)a.hp=clamp((a.hp||1)+dt*hpRegenFor(a),1,base.hp);
  a.lastUpdate=t;return a;
}
function applyDamageStatus(a,damage,t=now()){
  if(!a.alive)return null;const max=mech(a.mechId).hp,ratio=damage/max,chance=clamp(.08+ratio*.7,.08,.38);
  if(Math.random()>=chance)return null;const d=pick(DAMAGE_TYPES);a.damageStatus={type:d.id,label:d.label,until:t+20*60*1000};return a.damageStatus;
}
function destroyActor(s,victim,killer,t=now()){
  if(!victim.alive)return 0;victim.alive=false;victim.losses=(victim.losses||0)+1;killer.wins=(killer.wins||0)+1;victim.damageStatus=null;
  const loot=Math.min(victim.money||0,Math.floor(80+Math.random()*180));victim.money-=loot;killer.money=(killer.money||0)+loot;
  if(victim.type==='ai'){const recycle=Math.floor((victim.money||0)*.35);s.reserve.currency+=recycle;victim.money-=recycle;}else victim.destroyedUntil=t+10*60*1000;
  return loot;
}
function view(a){if(!a)return null;const x=structuredClone(a),base=mech(x.mechId);recover(x);const st=statusInfo(x);return{id:x.id,type:x.type,name:x.name,archetypeName:x.archetypeName,mechId:x.mechId,mechName:base.name,mechClass:base.class,art:base.art,hp:Math.round(x.hp),maxHp:base.hp,en:Math.round(x.en),maxEn:base.en,energyRegenPerSec:enRegenFor(x),hpRegenPerSec:hpRegenFor(x),attackAtEnergy:atkNeed(x),counterAtEnergy:counterNeed(x),attackReady:x.alive&&x.en>=atkNeed(x)&&x.cooldownUntil<=now(),emergencyCost:restoreCost(x),money:Math.floor(x.money),ore:Math.floor(x.ore),core:Math.floor(x.core),wins:x.wins,losses:x.losses,alive:x.alive,destroyedUntil:x.destroyedUntil,cooldownUntil:x.cooldownUntil,damageStatus:st?{...st,remainingMs:Math.max(0,st.until-now())}:null};}
function health(s){const actors=Object.values(s.actors).filter(a=>a.alive),pop=clamp(actors.length/80*100,0,100),reserve=clamp((s.reserve.currency/25000+s.reserve.ore/2500)*25,0,100),all=Object.values(s.actors),cir=all.reduce((z,a)=>z+(a.money||0),0),rich=all.map(a=>a.money||0).sort((a,b)=>b-a).slice(0,10).reduce((a,b)=>a+b,0),eq=clamp(100-(cir?rich/cir:0)*80,0,100);return Math.round(pop*.35+reserve*.35+eq*.30);}
function initialState(){const t=now(),s={version:4,epoch:1,block:0,createdAt:t,nextBlockAt:t+BLOCK_MS,seq:START_AI+1,reserve:{currency:25000,ore:2500,core:24},emitted:{currency:25000,ore:2500,core:24},burned:{currency:0,ore:0,core:0},health:100,lowHealthBlocks:0,actors:{},events:[],museum:[]};for(let i=1;i<=START_AI;i++){const a=newAI(i,t);s.actors[a.id]=a;}s.events.push({t,block:0,text:'WORLD I Genesis 公版世界啟動，24 名 AI 駕駛員甦醒。',kind:'epoch'});return s;}
export class GenesisWorld{
  constructor(ctx,env){this.ctx=ctx;this.env=env;this.state=null;ctx.blockConcurrencyWhile(()=>this.load());}
  async load(){this.state=await this.ctx.storage.get('world-public-v3');if(!this.state){this.state=initialState();await this.save();await this.ctx.storage.setAlarm(this.state.nextBlockAt);}else{this.state.version=4;for(const a of Object.values(this.state.actors||{})){if(a.damageStatus===undefined)a.damageStatus=null;}if(await this.ctx.storage.getAlarm()===null)await this.ctx.storage.setAlarm(this.state.nextBlockAt||now()+BLOCK_MS);}}
  async save(){this.state.health=health(this.state);await this.ctx.storage.put('world-public-v3',this.state);}
  event(text,data={}){this.state.events.unshift({t:now(),block:this.state.block,text,...data});this.state.events=this.state.events.slice(0,100);}
  emit(){const r=rewardAt(this.state.block);for(const k of ['currency','ore','core']){const x=Math.max(0,Math.min(CAP[k]-this.state.emitted[k],r[k]));this.state.emitted[k]+=x;this.state.reserve[k]+=x;}return r;}
  mine(a){const g=Math.min(this.state.reserve.currency,30+Math.floor(Math.random()*71)),o=Math.min(this.state.reserve.ore,1+Math.floor(Math.random()*5));this.state.reserve.currency-=g;this.state.reserve.ore-=o;a.money+=g;a.ore+=o;return{g,o};}
  attack(a,d){
    const t=now();recover(a,t);recover(d,t);const am=effective(a,t),dm=effective(d,t),need=atkNeed(a);
    if(!a.alive)return{ok:false,error:'機體正在大修'};if(a.cooldownUntil>t)return{ok:false,error:'武裝冷卻中'};if(a.en<need)return{ok:false,error:`能源需恢復至 50%（${need}/${mech(a.mechId).en}）`};if(!d.alive)return{ok:false,error:'目標已被擊毀'};
    a.en=Math.max(0,a.en-need);a.cooldownUntil=t+12000;a.lastTargetId=d.id;d.lastAttackedAt=t;
    const hitChance=clamp(.55+(am.aim-dm.speed)*.006,.20,.90),hit=Math.random()<hitChance;
    let dmg=0,destroyed=false,loot=0,defStatus=null,countered=false,counterHit=false,counterDmg=0,attackerDestroyed=false,attStatus=null;
    if(hit){const raw=(170+am.atk*8)*(.90+Math.random()*.20);dmg=Math.max(1,Math.round(raw*(100/(100+dm.armor*1.8))*dm.incoming));d.hp=Math.max(0,d.hp-dmg);if(d.hp<=0){destroyed=true;loot=destroyActor(this.state,d,a,t);}else defStatus=applyDamageStatus(d,dmg,t);}
    if(!destroyed&&d.alive){
      recover(d,t);const cm=effective(d,t),cNeed=counterNeed(d),canCounter=d.en>=cNeed&&d.cooldownUntil<=t;
      let counterChance=.50+(!hit?.20:0)+(d.archetype==='aggressive'?.10:0)-(d.archetype==='guardian'?.10:0);counterChance=clamp(counterChance,.25,.80);
      if(canCounter&&Math.random()<counterChance){countered=true;d.en=Math.max(0,d.en-cNeed);d.cooldownUntil=t+9000;const cHitChance=clamp(.50+(cm.aim-am.speed)*.005,.25,.85);counterHit=Math.random()<cHitChance;if(counterHit){const raw=(130+cm.atk*6.5)*(.90+Math.random()*.20)*(.70+Math.random()*.15);counterDmg=Math.max(1,Math.round(raw*(100/(100+am.armor*1.8))*am.incoming));a.lastAttackedAt=t;a.hp=Math.max(0,a.hp-counterDmg);if(a.hp<=0){attackerDestroyed=true;destroyActor(this.state,a,d,t);}else attStatus=applyDamageStatus(a,counterDmg,t);}}
    }
    const attackText=hit?`${a.name} 命中 ${d.name}，造成 ${dmg} 傷害${destroyed?'並擊毀目標':''}`:`${a.name} 攻擊 ${d.name} 失敗，攻擊落空`;
    const counterText=countered?(counterHit?`；${d.name} 反擊命中，造成 ${counterDmg} 傷害${attackerDestroyed?'並反擊擊毀 '+a.name:''}`:`；${d.name} 嘗試反擊但未命中`):'';
    const statusText=`${defStatus?`；${d.name} ${defStatus.label}`:''}${attStatus?`；${a.name} ${attStatus.label}`:''}`;
    this.event(`${attackText}${counterText}${statusText}。`,{kind:'battle',attackerId:a.id,defenderId:d.id,hit,dmg,destroyed,countered,counterHit,counterDmg,attackerDestroyed});
    return{ok:true,hit,hitChance:+hitChance.toFixed(3),dmg,destroyed,loot,countered,counterHit,counterDmg,attackerDestroyed,defenderStatus:defStatus,attackerStatus:attStatus};
  }
  aiTurn(a){recover(a);if(!a.alive)return;const targets=Object.values(this.state.actors).filter(x=>x.id!==a.id&&x.alive),can=a.en>=atkNeed(a)&&a.cooldownUntil<=now(),bias=a.archetype==='aggressive'?.78:a.archetype==='raider'?.62:a.archetype==='revenge'?.68:a.archetype==='guardian'?.28:a.archetype==='merchant'?.18:.48;if(can&&targets.length&&Math.random()<bias){let d=a.archetype==='revenge'&&a.lastTargetId?this.state.actors[a.lastTargetId]:null;if(!d||!d.alive)d=pick(targets);this.attack(a,d);}else if(this.state.reserve.currency>0||this.state.reserve.ore>0)this.mine(a);}
  spawn(){const count=Object.values(this.state.actors).filter(a=>a.type==='ai'&&a.alive).length;if(Math.random()>spawnChance(count))return;const a=newAI(this.state.seq++);a.bornBlock=this.state.block;this.state.actors[a.id]=a;this.event(`${a.name} 在 Block #${this.state.block} 誕生，駕駛 ${mech(a.mechId).name}。`,{kind:'birth',actorId:a.id});}
  collapse(){this.state.health=health(this.state);this.state.lowHealthBlocks=this.state.health<5?this.state.lowHealthBlocks+1:0;if(this.state.lowHealthBlocks<72)return;const summary={epoch:this.state.epoch,endedAt:now(),blocks:this.state.block,health:this.state.health,reason:'世界健康度連續 72 區塊低於 5'};const humans=Object.values(this.state.actors).filter(a=>a.type==='human').map(a=>({userId:a.userId,name:a.name})),museum=[summary,...this.state.museum].slice(0,20),epoch=this.state.epoch+1;this.state=initialState();this.state.epoch=epoch;this.state.museum=museum;for(const h of humans)this.state.actors[`H:${h.userId}`]=newHuman(h.userId,h.name);this.event(`WORLD ${epoch} 已完成創世重啟。`,{kind:'epoch'});}
  async tick(){this.state.block++;const r=this.emit();this.spawn();for(const a of Object.values(this.state.actors).filter(a=>a.type==='ai'&&a.alive))this.aiTurn(a);this.collapse();this.state.nextBlockAt=now()+BLOCK_MS;if(this.state.block%6===0)this.event(`Block #${this.state.block} 完成。Era ${r.era}，區塊釋出 ${r.currency} G / ${r.ore} 礦石。`,{kind:'block'});await this.save();await this.ctx.storage.setAlarm(this.state.nextBlockAt);}
  async alarm(){await this.tick();}
  human(uid){return this.state.actors[`H:${uid}`]||null;}
  public(uid=null){const actors=Object.values(this.state.actors),living=actors.filter(a=>a.alive),r=rewardAt(Math.max(1,this.state.block));return{epoch:this.state.epoch,epochName:`WORLD ${this.state.epoch} — ${this.state.epoch===1?'Genesis':'Rebirth'}`,blockHeight:this.state.block,nextBlockAt:this.state.nextBlockAt,health:this.state.health,reserve:this.state.reserve,issued:this.state.emitted,burned:this.state.burned,era:r.era,currentBlockReward:r,population:{total:actors.length,living:living.length,ai:living.filter(a=>a.type==='ai').length,human:living.filter(a=>a.type==='human').length},myActor:uid?view(this.human(uid)):null,actors:living.slice(0,120).map(view),events:this.state.events.slice(0,40),museum:this.state.museum,rules:{blockMinutes:10,attackEnergyPercent:50,counterEnergyPercent:35,humanRepairMinutes:10,damageStatusMinutes:20,hardPopulationCap:HARD_CAP,currencyCap:CAP.currency,oreCap:CAP.ore,coreCap:CAP.core,halvingEveryBlocks:HALVING_BLOCKS},mechs:MECHS.map(m=>({...m,energyRegenPerSec:+((0.42+m.cooling*.018+m.en/1100)).toFixed(3),hpRegenPerSec:+((0.035+m.cooling*.0022)).toFixed(3),attackAtEnergy:Math.ceil(m.en*.5)}))};}
  async fetch(req){const u=new URL(req.url),uid=+req.headers.get('x-user-id')||0,username=req.headers.get('x-username')||'';if(u.pathname==='/state')return json(this.public(uid||null));if(u.pathname==='/join'&&req.method==='POST'){if(!uid)return json({error:'請先登入主帳號'},401);let a=this.human(uid);if(!a){a=newHuman(uid,username);this.state.actors[a.id]=a;this.state.emitted.currency=Math.min(CAP.currency,this.state.emitted.currency+500);this.event(`${username} 進入 Genesis 世界。`,{kind:'join',actorId:a.id});await this.save();}return json({ok:true,state:this.public(uid)});}if(u.pathname==='/action'&&req.method==='POST'){if(!uid)return json({error:'請先登入主帳號'},401);const a=this.human(uid);if(!a)return json({error:'請先加入 Genesis 世界'},400);recover(a);const b=await req.json().catch(()=>({}));if(b.action==='mine'){if(a.cooldownUntil>now())return json({error:'行動冷卻中'},400);const x=this.mine(a);a.cooldownUntil=now()+30000;this.event(`${a.name} 採集取得 ${x.g} G / ${x.o} 礦石。`,{kind:'mine',actorId:a.id});}else if(b.action==='attack'){const d=this.state.actors[String(b.targetId||'')];if(!d||d.id===a.id)return json({error:'無效目標'},400);const r=this.attack(a,d);if(!r.ok)return json({error:r.error},400);await this.save();return json({ok:true,result:r,state:this.public(uid)});}else if(b.action==='restore'){const cost=restoreCost(a);if(a.money<cost)return json({error:`資金不足，需要 ${cost} G`},400);a.money-=cost;this.state.burned.currency+=cost;const m=mech(a.mechId);a.alive=true;a.destroyedUntil=0;a.hp=m.hp;a.en=m.en;a.damageStatus=null;a.lastUpdate=now();this.event(`${a.name} 支付 ${cost} G 進行緊急整備。`,{kind:'restore',actorId:a.id});}else if(b.action==='selectMech'){const m=mech(String(b.mechId||''));a.mechId=m.id;a.hp=m.hp;a.en=m.en;a.lastUpdate=now();}else return json({error:'未知操作'},400);await this.save();return json({ok:true,state:this.public(uid)});}return json({error:'找不到 Genesis API'},404);}
}
