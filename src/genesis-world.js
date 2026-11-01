import { MECHS } from './catalog.js';
import { GENESIS_WORLD, NPC_ARCHETYPES, rewardAt, spawnChance } from './genesis-config.js';

const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const round=n=>Math.round(n*100)/100;
const nextBoundary=()=>Math.ceil(Date.now()/GENESIS_WORLD.blockIntervalMs)*GENESIS_WORLD.blockIntervalMs;

function npcName(serial){return `AI-${String(serial).padStart(4,'0')}`;}
function mech(id){return MECHS.find(x=>x.id===id)||MECHS[0];}

function newNPC(serial,block,treasury){
  const m=pick(MECHS), archetype=pick(NPC_ARCHETYPES);
  const money=Math.min(treasury.currency,300+Math.floor(Math.random()*301));
  const ore=Math.min(treasury.ore,6+Math.floor(Math.random()*10));
  treasury.currency-=money; treasury.ore-=ore;
  return {
    id:`npc-${serial}`,
    name:npcName(serial),
    bornBlock:block,
    ageBlocks:0,
    archetype:archetype.id,
    archetypeName:archetype.name,
    mechId:m.id,
    mechName:m.name,
    hp:m.hp,
    maxHp:m.hp,
    level:1,
    exp:0,
    money,
    ore,
    kills:0,
    losses:0,
    lastEnemy:null,
    status:'存活'
  };
}

function initialState(){
  const t=Date.now();
  const s={
    epoch:1,
    epochName:'WORLD I — Genesis',
    createdAt:t,
    blockHeight:0,
    nextBlockAt:nextBoundary(),
    lastBlockAt:0,
    npcSerial:0,
    npcs:[],
    deadCount:0,
    treasury:{currency:18000,ore:1500,core:20},
    issued:{currency:18000,ore:1500,core:20},
    burned:{currency:0,ore:0,core:0},
    health:100,
    lowHealthStreak:0,
    totalBattles:0,
    totalBirths:0,
    totalDeaths:0,
    history:[],
    museum:[]
  };
  for(let i=0;i<GENESIS_WORLD.population.seedNPCs;i++){
    s.npcSerial++; s.npcs.push(newNPC(s.npcSerial,0,s.treasury)); s.totalBirths++;
  }
  s.history.push({t,text:`${s.epochName} 創世完成，${s.npcs.length} 名 AI 駕駛員甦醒。`});
  return s;
}

function addHistory(s,text){
  s.history.unshift({t:Date.now(),text});
  s.history=s.history.slice(0,80);
}

function distributeEmission(s,reward){
  const ec=GENESIS_WORLD.economy;
  const c=Math.min(reward.currency,ec.totalCurrencyCap-s.issued.currency);
  const o=Math.min(reward.ore,ec.totalOreCap-s.issued.ore);
  const k=Math.min(reward.core,ec.totalCoreCap-s.issued.core);
  s.issued.currency+=c; s.issued.ore+=o; s.issued.core+=k;
  s.treasury.currency+=c; s.treasury.ore+=o; s.treasury.core+=k;
  return {currency:c,ore:o,core:k};
}

function maybeBirth(s){
  const chance=spawnChance(s.npcs.length);
  if(Math.random()>=chance)return null;
  s.npcSerial++;
  const n=newNPC(s.npcSerial,s.blockHeight,s.treasury);
  s.npcs.push(n); s.totalBirths++;
  addHistory(s,`${n.name} 出生，選擇 ${n.mechName}，人格為「${n.archetypeName}」。`);
  return n;
}

function repair(s,n){
  if(n.hp>=n.maxHp*.72)return false;
  const cost=Math.min(n.money,Math.max(20,Math.round((n.maxHp-n.hp)*0.09)));
  if(cost<=0)return false;
  const burn=Math.ceil(cost*GENESIS_WORLD.economy.repairBurnRate);
  const returnToTreasury=cost-burn;
  n.money-=cost; s.burned.currency+=burn; s.treasury.currency+=returnToTreasury;
  n.hp=Math.min(n.maxHp,n.hp+Math.round(n.maxHp*(.30+Math.random()*.25)));
  addHistory(s,`${n.name} 花費 ${cost} G 進行維修。`);
  return true;
}

function harvest(s,n){
  const gainC=Math.min(s.treasury.currency,30+Math.floor(Math.random()*91));
  const gainO=Math.min(s.treasury.ore,1+Math.floor(Math.random()*6));
  if(gainC<=0&&gainO<=0)return false;
  s.treasury.currency-=gainC; s.treasury.ore-=gainO;
  n.money+=gainC; n.ore+=gainO;
  if(Math.random()<.12&&s.treasury.core>0){s.treasury.core--; n.core=(n.core||0)+1;}
  return true;
}

function combatPower(n){
  const m=mech(n.mechId);
  return (m.atk*1.35+m.armor+m.speed*.85+m.aim*.75)*(1+(n.level-1)*.035)*(n.hp/n.maxHp);
}

function fight(s,a,d){
  const ap=combatPower(a)*(0.82+Math.random()*.38);
  const dp=combatPower(d)*(0.82+Math.random()*.38);
  const am=mech(a.mechId), dm=mech(d.mechId);
  const dmgToD=Math.max(80,Math.round((am.atk*18+a.level*20)*(0.8+Math.random()*.5)*(100/(100+dm.armor))));
  const dmgToA=Math.max(55,Math.round((dm.atk*14+d.level*16)*(0.8+Math.random()*.5)*(100/(100+am.armor))));
  d.hp=Math.max(0,d.hp-dmgToD); a.hp=Math.max(0,a.hp-dmgToA);
  a.lastEnemy=d.id; d.lastEnemy=a.id; s.totalBattles++;
  let winner=ap>=dp?a:d, loser=winner===a?d:a;
  if(d.hp===0) {winner=a;loser=d;}
  if(a.hp===0) {winner=d;loser=a;}
  winner.kills++;
  winner.exp+=25+Math.floor(Math.random()*31);
  if(winner.exp>=100+winner.level*40){winner.exp=0;winner.level++;}
  if(loser.hp<=0){
    const lootMoney=Math.floor(loser.money*.60), burnMoney=Math.floor(loser.money*.25), recycleMoney=loser.money-lootMoney-burnMoney;
    const lootOre=Math.floor(loser.ore*.55), burnOre=Math.floor(loser.ore*.20), recycleOre=loser.ore-lootOre-burnOre;
    winner.money+=lootMoney; winner.ore+=lootOre;
    s.burned.currency+=burnMoney; s.burned.ore+=burnOre;
    s.treasury.currency+=recycleMoney; s.treasury.ore+=recycleOre;
    loser.status='死亡'; loser.losses++; s.totalDeaths++; s.deadCount++;
    addHistory(s,`${winner.name} 擊破 ${loser.name}；部分資源遭永久銷毀。`);
    return loser.id;
  }
  addHistory(s,`${a.name} 與 ${d.name} 交戰，${winner.name} 取得優勢。`);
  return null;
}

function actNPC(s,n){
  n.ageBlocks++;
  if((n.archetype==='guardian'||n.archetype==='merchant')&&repair(s,n))return;
  if(n.hp<n.maxHp*.35&&repair(s,n))return;
  if(n.archetype==='merchant'||Math.random()<.28){harvest(s,n);return;}
  const targets=s.npcs.filter(x=>x.id!==n.id&&x.status==='存活');
  if(!targets.length){harvest(s,n);return;}
  let d=null;
  if(n.archetype==='revenge'&&n.lastEnemy)d=targets.find(x=>x.id===n.lastEnemy)||null;
  if(n.archetype==='raider')d=[...targets].sort((x,y)=>(y.money+y.ore*20)-(x.money+x.ore*20))[0];
  if(n.archetype==='opportunist')d=[...targets].sort((x,y)=>(x.hp/x.maxHp)-(y.hp/y.maxHp))[0];
  if(!d)d=pick(targets);
  return fight(s,n,d);
}

function wealthConcentration(s){
  const values=s.npcs.map(n=>Math.max(0,n.money)).sort((a,b)=>b-a);
  const total=values.reduce((a,b)=>a+b,0)+s.treasury.currency;
  if(!total)return 1;
  return values.slice(0,10).reduce((a,b)=>a+b,0)/total;
}

function updateHealth(s,activity){
  const pop=s.npcs.length;
  const concentration=wealthConcentration(s);
  const currencyRemaining=(GENESIS_WORLD.economy.totalCurrencyCap-s.issued.currency)/GENESIS_WORLD.economy.totalCurrencyCap;
  let h=100;
  if(pop<10)h-=45; else if(pop<30)h-=20;
  if(concentration>.90)h-=40; else if(concentration>.75)h-=20; else if(concentration>.60)h-=8;
  if(activity===0)h-=20;
  if(currencyRemaining<.01&&s.treasury.currency<1000)h-=18;
  s.health=clamp(Math.round(h),0,100);
  if(s.health<GENESIS_WORLD.health.collapseBelow)s.lowHealthStreak++;else s.lowHealthStreak=0;
}

function collapseAndRebirth(s){
  const top=[...s.npcs].sort((a,b)=>(b.kills*100+b.level)-(a.kills*100+a.level))[0];
  s.museum.unshift({
    epoch:s.epoch,
    name:s.epochName,
    endedAt:Date.now(),
    blocks:s.blockHeight,
    totalBirths:s.totalBirths,
    totalDeaths:s.totalDeaths,
    totalBattles:s.totalBattles,
    strongest:top?{name:top.name,kills:top.kills,level:top.level,mechName:top.mechName}:null,
    reason:'世界健康度長期低於崩塌門檻'
  });
  s.museum=s.museum.slice(0,20);
  const oldEpoch=s.epoch;
  const fresh=initialState();
  fresh.epoch=oldEpoch+1;
  fresh.epochName=`WORLD ${fresh.epoch} — Rebirth`;
  fresh.museum=s.museum;
  addHistory(fresh,`WORLD ${oldEpoch} 文明終結；WORLD ${fresh.epoch} 已重新創世。`);
  return fresh;
}

function publicState(s){
  const top=[...s.npcs].sort((a,b)=>(b.kills*100+b.level)-(a.kills*100+a.level)).slice(0,12);
  return {
    epoch:s.epoch,epochName:s.epochName,createdAt:s.createdAt,blockHeight:s.blockHeight,nextBlockAt:s.nextBlockAt,lastBlockAt:s.lastBlockAt,
    population:s.npcs.length,deadCount:s.deadCount,health:s.health,lowHealthStreak:s.lowHealthStreak,
    treasury:s.treasury,issued:s.issued,burned:s.burned,totalBattles:s.totalBattles,totalBirths:s.totalBirths,totalDeaths:s.totalDeaths,
    topNPCs:top,history:s.history.slice(0,30),museum:s.museum.slice(0,10),
    caps:{currency:GENESIS_WORLD.economy.totalCurrencyCap,ore:GENESIS_WORLD.economy.totalOreCap,core:GENESIS_WORLD.economy.totalCoreCap}
  };
}

export class GenesisWorld{
  constructor(ctx,env){
    this.ctx=ctx;this.env=env;this.state=null;
    ctx.blockConcurrencyWhile(async()=>{
      this.state=await ctx.storage.get('world');
      if(!this.state){this.state=initialState();await ctx.storage.put('world',this.state);}
      const alarm=await ctx.storage.getAlarm();
      if(alarm===null){this.state.nextBlockAt=nextBoundary();await ctx.storage.put('world',this.state);await ctx.storage.setAlarm(this.state.nextBlockAt);}
    });
  }
  async fetch(req){
    const p=new URL(req.url).pathname;
    if(p==='/state')return json(publicState(this.state));
    return json({error:'找不到 Genesis API'},404);
  }
  async alarm(){
    let s=this.state||await this.ctx.storage.get('world')||initialState();
    s.blockHeight++;
    s.lastBlockAt=Date.now();
    const reward=rewardAt(s.blockHeight), emitted=distributeEmission(s,reward);
    maybeBirth(s);
    let activity=0; const dead=new Set();
    const actors=[...s.npcs].sort(()=>Math.random()-.5).slice(0,GENESIS_WORLD.population.actionsPerBlock);
    for(const n of actors){if(dead.has(n.id)||n.status!=='存活')continue;const killed=actNPC(s,n);activity++;if(killed)dead.add(killed);}
    if(dead.size)s.npcs=s.npcs.filter(n=>!dead.has(n.id));
    updateHealth(s,activity);
    addHistory(s,`區塊 #${s.blockHeight} 完成：發行 ${emitted.currency} G / 礦石 ${emitted.ore} / 核心 ${emitted.core}；人口 ${s.npcs.length}；健康 ${s.health}。`);
    if(s.lowHealthStreak>=GENESIS_WORLD.health.collapseBlocks)s=collapseAndRebirth(s);
    s.nextBlockAt=Date.now()+GENESIS_WORLD.blockIntervalMs;
    this.state=s;
    await this.ctx.storage.put('world',s);
    await this.ctx.storage.setAlarm(s.nextBlockAt);
  }
}
