import { GenesisWorld as BaseGenesisWorld } from './genesis-v093.js';
import { mechById } from './catalog.js';

const now=()=>Date.now();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

const DUNGEONS=[
  {id:'patrol',name:'外環巡邏線',tier:1,desc:'低風險巡邏任務，適合補充 Genesis G、礦石與少量戰術資料。',enPct:.18,hpMinPct:.30,damageMin:.025,damageMax:.055,cooldown:45_000,baseSuccess:.96,reward:{currency:[35,80],ore:[1,4],data:[0,2]}},rare:'小量戰術資料'},
  {id:'ruins',name:'都市廢墟搜索',tier:2,desc:'深入崩毀都市搜索機體殘骸，合金產出較高。',enPct:.25,hpMinPct:.38,damageMin:.045,damageMax:.09,cooldown:70_000,baseSuccess:.90,reward:{currency:[45,100],ore:[2,5],alloy:[0,2],data:[0,3]}},rare:'稀有合金'},
  {id:'depot',name:'敵軍軍火庫',tier:3,desc:'突破守備系統奪取軍需，收益提高但機體損耗更明顯。',enPct:.34,hpMinPct:.46,damageMin:.065,damageMax:.125,cooldown:100_000,baseSuccess:.82,reward:{currency:[70,145],ore:[3,7],alloy:[1,3],data:[1,4]}},rare:'合金／戰術資料'},
  {id:'storm',name:'能源風暴帶',tier:4,desc:'穿越高能粒子風暴採集晶體，能源消耗與受損風險都很高。',enPct:.44,hpMinPct:.55,damageMin:.085,damageMax:.16,cooldown:140_000,baseSuccess:.74,reward:{currency:[60,130],crystal:[4,10],data:[1,4],core:[0,1,.08]}},rare:'8% 機率核心'},
  {id:'fortress',name:'失落軍事要塞',tier:5,desc:'高階戰鬥副本，適合取得合金、資料與大量 Genesis G。',enPct:.56,hpMinPct:.64,damageMin:.12,damageMax:.22,cooldown:190_000,baseSuccess:.66,reward:{currency:[120,240],ore:[4,9],alloy:[2,5],data:[3,8],core:[0,1,.13]}},rare:'13% 機率核心'},
  {id:'corezone',name:'Genesis 核心禁區',tier:6,desc:'最高風險區域。需要良好機體狀態與強化，成功時可取得多種高階資源。',enPct:.70,hpMinPct:.76,damageMin:.18,damageMax:.32,cooldown:300_000,baseSuccess:.56,reward:{currency:[170,340],ore:[6,12],crystal:[5,12],alloy:[3,7],data:[5,11],core:[0,1,.25]}},rare:'25% 機率核心'}
];

function ensureDungeonActor(a){
  if(!a)return;
  a.dungeonReadyAt??=0;
  a.dungeonRuns??=0;
  a.dungeonClears??=0;
  a.lastDungeonResult??=null;
}
function dungeonStats(a){
  const m=mechById(a?.mechId);
  const u=a?.upgrades||{};
  const up=Object.values(u).reduce((s,v)=>s+(Number(v)||0),0);
  return {m,up,hpRatio:m?clamp((a.hp||0)/m.hp,0,1):0,enRatio:m?clamp((a.en||0)/m.en,0,1):0};
}
function rewardRangeText(key,v){
  const label={currency:'Genesis G',ore:'礦石',crystal:'能源晶體',alloy:'稀有合金',data:'戰術資料',core:'核心'}[key]||key;
  if(v.length===3)return `${label} ${Math.round((v[2]||0)*100)}% 機率`;
  return `${label} ${v[0]}～${v[1]}`;
}

export class GenesisWorld extends BaseGenesisWorld{
  ensureV094(){
    this.ensureV093?.();
    for(const a of Object.values(this.state.actors||{}))ensureDungeonActor(a);
  }

  shopView(a){
    const list=this.equipmentView?.(a)||[];
    return Array.isArray(list)?list:[];
  }

  dungeonView(a){
    ensureDungeonActor(a);
    const t=now(),{m,up,hpRatio}=dungeonStats(a);
    return DUNGEONS.map(d=>{
      const enCost=m?Math.ceil(m.en*d.enPct):0;
      const cd=Math.max(0,(a.dungeonReadyAt||0)-t);
      const success=clamp(d.baseSuccess+Math.min(.12,up*.004)+Math.max(0,hpRatio-.5)*.06,.35,.98);
      let reason='可進入副本';
      if(!a.alive)reason='機體正在大修';
      else if(cd>0)reason=`副本整備冷卻 ${Math.ceil(cd/1000)} 秒`;
      else if(m&&a.hp<m.hp*d.hpMinPct)reason=`HP 至少需要 ${Math.round(d.hpMinPct*100)}%`;
      else if(a.en<enCost)reason=`EN 不足，需要 ${enCost}`;
      return {...d,enCost,successPercent:Math.round(success*100),available:reason==='可進入副本',reason,rewardText:Object.entries(d.reward).map(([k,v])=>rewardRangeText(k,v))};
    });
  }

  rollReward(def){
    const out={currency:0,ore:0,crystal:0,alloy:0,data:0,core:0};
    for(const [k,v] of Object.entries(def.reward)){
      let n=0;
      if(v.length===3){if(Math.random()<v[2])n=v[1];}
      else n=Math.floor(v[0]+Math.random()*(v[1]-v[0]+1));
      if(n>0)out[k]=this.take(k,n);
    }
    return out;
  }

  runDungeon(a,id){
    this.ensureV094();ensureDungeonActor(a);
    const d=DUNGEONS.find(x=>x.id===id);if(!d)return{ok:false,error:'找不到此副本'};
    const view=this.dungeonView(a).find(x=>x.id===id);if(!view?.available)return{ok:false,error:view?.reason||'目前無法進入副本'};
    const {m,up,hpRatio}=dungeonStats(a),t=now();
    a.en=Math.max(0,a.en-view.enCost);
    a.dungeonReadyAt=t+d.cooldown;
    a.dungeonRuns++;
    const armorMitigation=Math.min(.35,(m?.armor||0)/240+(a.upgrades?.armor||0)*.012);
    const rawPct=d.damageMin+Math.random()*(d.damageMax-d.damageMin);
    const damage=Math.max(1,Math.round((m?.hp||1000)*rawPct*(1-armorMitigation)));
    a.hp=Math.max(0,a.hp-damage);a.lastAttackedAt=t;
    const successChance=clamp(d.baseSuccess+Math.min(.12,up*.004)+Math.max(0,hpRatio-.5)*.06,.35,.98);
    const success=a.hp>0&&Math.random()<successChance;
    let reward={currency:0,ore:0,crystal:0,alloy:0,data:0,core:0};
    if(success){
      reward=this.rollReward(d);
      for(const [k,v] of Object.entries(reward)){const prop=k==='currency'?'money':k;a[prop]=(a[prop]||0)+v;}
      a.dungeonClears++;
    }
    if(a.hp<=0){a.alive=false;a.destroyedUntil=t+10*60*1000;a.hp=0;}
    a.lastUpdate=t;
    const result={id:d.id,name:d.name,t,success,damage,enCost:view.enCost,reward,successChance:Math.round(successChance*100),destroyed:!a.alive};
    a.lastDungeonResult=result;
    const rewardText=Object.entries(reward).filter(([,v])=>v>0).map(([k,v])=>`${({currency:'G',ore:'礦石',crystal:'晶體',alloy:'合金',data:'資料',core:'核心'})[k]} ${v}`).join(' / ');
    this.event(`${a.name} 挑戰「${d.name}」${success?'成功':'失敗'}，消耗 EN ${view.enCost}、承受 ${damage} 傷害${success?`，取得 ${rewardText||'少量物資'}`:''}${!a.alive?'，機體遭到重創進入大修':''}。`,{kind:'dungeon',actorId:a.id,dungeonId:d.id,success});
    return{ok:true,...result};
  }

  public(uid=null){
    this.ensureV094();
    const p=super.public(uid);p.version='0.9.4';
    if(uid&&this.human(uid)&&p.myActor){
      const a=this.human(uid);ensureDungeonActor(a);
      const shop=this.shopView(a);
      p.equipmentInventory=shop;
      p.shopInventory=shop;
      p.dungeons=this.dungeonView(a);
      p.myActor.dungeonRuns=a.dungeonRuns;
      p.myActor.dungeonClears=a.dungeonClears;
      p.myActor.dungeonReadyAt=a.dungeonReadyAt;
      p.myActor.lastDungeonResult=a.lastDungeonResult;
    }else{
      p.shopInventory=[];p.dungeons=[];
    }
    return p;
  }

  async fetch(req){
    const u=new URL(req.url),uid=+req.headers.get('x-user-id')||0;
    this.ensureV094();
    if(u.pathname==='/action'&&req.method==='POST'&&uid){
      const body=await req.clone().json().catch(()=>({}));
      if(body.action==='runDungeon'){
        const a=this.human(uid);if(!a)return json({error:'請先加入 Genesis 世界'},400);
        const snap=super.public(uid)?.myActor;if(snap){a.hp=snap.hp;a.en=snap.en;a.lastUpdate=now();}
        const result=this.runDungeon(a,String(body.dungeonId||''));
        if(!result.ok)return json({error:result.error},400);
        await this.save();
        return json({...result,state:this.public(uid)});
      }
    }
    return super.fetch(req);
  }
}
