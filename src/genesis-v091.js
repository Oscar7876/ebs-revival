import { GenesisWorld as BaseGenesisWorld } from './genesis-v09.js';

const now=()=>Date.now();
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const PASSIVE_GRACE=5*60*1000;
const DAILY_PASSIVE_HOURS=6;

function dayKey(t=now()){return new Date(t).toISOString().slice(0,10);}
function weightedHours(raw){const h=Math.max(0,Math.min(6,raw));return Math.min(h,2)+Math.min(Math.max(h-2,0),2)*.6+Math.min(Math.max(h-4,0),2)*.3;}
function ensure091Actor(a,t=now()){
  if(!a)return a;
  a.attackedCount??=0;
  a.defenseSuccesses??=0;
  a.lastActiveAt??=a.joinedAt||t;
  a.lastPassiveAt??=a.joinedAt||t;
  a.lastPassiveGain??={money:0,ore:0,data:0,at:0};
  if(a.passiveDay!==dayKey(t)){a.passiveDay=dayKey(t);a.passiveHoursToday=0;}
  a.passiveHoursToday??=0;
  return a;
}

export class GenesisWorld extends BaseGenesisWorld{
  ensureV091(t=now()){for(const a of Object.values(this.state.actors||{}))ensure091Actor(a,t);}

  settlePassive(a,t=now()){
    if(!a||a.type!=='human')return null;
    ensure091Actor(a,t);
    if(a.passiveDay!==dayKey(t)){a.passiveDay=dayKey(t);a.passiveHoursToday=0;}
    const start=Math.max(a.lastPassiveAt||0,(a.lastActiveAt||0)+PASSIVE_GRACE);
    const elapsedHours=Math.max(0,(t-start)/36e5);
    if(elapsedHours<1/6)return null;
    const remaining=Math.max(0,DAILY_PASSIVE_HOURS-(a.passiveHoursToday||0));
    if(remaining<=0){a.lastPassiveAt=t;return null;}
    const rawHours=Math.min(elapsedHours,remaining,DAILY_PASSIVE_HOURS);
    const h=weightedHours(rawHours),r=this.state.reserve||{};
    const rf=Math.max(.15,Math.min(1,((r.currency||0)/25000+(r.ore||0)/2500+(r.data||0)/900)/3));
    const hf=Math.max(.35,Math.min(1,(this.state.health||100)/70));
    const f=rf*hf;
    const money=this.take('currency',16*h*f),ore=this.take('ore',1.15*h*f),data=this.take('data',.35*h*f);
    a.money=(a.money||0)+money;a.ore=(a.ore||0)+ore;a.data=(a.data||0)+data;
    a.passiveHoursToday=+(a.passiveHoursToday+rawHours).toFixed(3);
    a.lastPassiveAt=t;
    a.lastPassiveGain={money,ore,data,at:t,rawHours:+rawHours.toFixed(2),dailyUsed:+a.passiveHoursToday.toFixed(2)};
    if(money||ore||data)this.event(`🌙 ${a.name} 領取離線補給 G${money} / 礦${ore} / 資料${data}（今日已計 ${a.passiveHoursToday.toFixed(1)}/${DAILY_PASSIVE_HOURS} 小時）。`,{kind:'passive',actorId:a.id});
    return a.lastPassiveGain;
  }

  markOnline(a,t=now()){if(!a)return;ensure091Actor(a,t);a.lastActiveAt=t;a.lastPassiveAt=t;}

  attack(a,d){
    this.ensureV091();
    const defenderHuman=d?.type==='human';
    const r=super.attack(a,d);
    if(!r?.ok)return r;
    if(r.battle){
      r.battle.cityId=1+Math.floor(Math.random()*100);
      r.battle.cityVersion='v091';
    }
    if(defenderHuman){
      ensure091Actor(d);
      d.attackedCount=(d.attackedCount||0)+1;
      if(d.alive)d.defenseSuccesses=(d.defenseSuccesses||0)+1;
    }
    return r;
  }

  public(uid=null){
    this.ensureV091();
    const p=super.public(uid);
    p.version='0.9.1';
    p.rules.resourceIsolation='主世界與 Genesis 僅共用登入身分；貨幣、礦石、裝備資源與戰績完全分離。';
    p.rules.passiveDailyCapHours=DAILY_PASSIVE_HOURS;
    if(uid&&this.human(uid)&&p.myActor){
      const a=this.human(uid);ensure091Actor(a);
      p.myActor.attackedCount=a.attackedCount||0;
      p.myActor.defenseSuccesses=a.defenseSuccesses||0;
      p.passive={...(p.passive||{}),dailyCapHours:DAILY_PASSIVE_HOURS,dailyUsedHours:+(a.passiveHoursToday||0).toFixed(2),principle:'每段離線時間只結算一次；在線刷新會中止待機累積；每日最多計 6 小時。'};
    }
    return p;
  }

  async fetch(req){
    const u=new URL(req.url),uid=+req.headers.get('x-user-id')||0;
    this.ensureV091();
    if(u.pathname==='/state'){
      if(uid){const a=this.human(uid);if(a){this.settlePassive(a);this.markOnline(a);}}
      await this.save();
      return json(this.public(uid||null));
    }
    return super.fetch(req);
  }
}
