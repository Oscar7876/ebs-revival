import { GenesisWorld as BaseGenesisWorld } from './genesis-v061.js';
import { MECHS, mechById } from './catalog.js';

const now=()=>Date.now();
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const mech=id=>mechById(id)||MECHS[0];

const GATHER_V07={
  ore:{name:'⛏️ 礦區採掘',cooldown:30000,enPct:0,risk:.03,desc:'穩定取得 Genesis G 與礦石'},
  crystal:{name:'🔋 能源晶體掃描',cooldown:45000,enPct:.15,risk:.08,desc:'消耗能源搜尋高純度能源晶體'},
  salvage:{name:'🧰 戰場殘骸回收',cooldown:50000,enPct:.08,risk:.18,desc:'回收合金、礦石與戰術資料'},
  data:{name:'📡 戰術資料探勘',cooldown:35000,enPct:.10,risk:.04,desc:'取得強化與情報用途的戰術資料'},
  deep:{name:'🪨 深層核心勘探',cooldown:90000,enPct:.25,risk:.22,desc:'高風險，低機率取得世界核心'},
  asteroid:{name:'☄️ 小行星帶採掘',cooldown:70000,enPct:.20,risk:.15,desc:'礦石與稀有合金產量高'},
  reactor:{name:'⚛️ 廢棄反應爐拆解',cooldown:80000,enPct:.30,risk:.24,desc:'能源晶體為主，極低機率取得核心'},
  convoy:{name:'🚚 補給線護送',cooldown:60000,enPct:.12,risk:.10,desc:'取得 Genesis G 與戰術資料'},
  ruins:{name:'🏙️ 都市廢墟搜索',cooldown:55000,enPct:.10,risk:.16,desc:'混合取得 G、合金與資料'},
  anomaly:{name:'🌀 異常訊號探索',cooldown:100000,enPct:.35,risk:.28,desc:'高風險取得晶體、資料與核心'}
};
const RES_LABEL={money:'Genesis G',ore:'礦石',crystal:'能源晶體',alloy:'稀有合金',data:'戰術資料',core:'核心'};
const LOOT_POLICY={money:{burn:.40,winner:.15},ore:{burn:.35,winner:.15},crystal:{burn:.35,winner:.15},alloy:{burn:.35,winner:.15},data:{burn:.35,winner:.15},core:{burn:.30,winner:.10}};
function ensureEconomy(a){for(const k of ['money','ore','crystal','alloy','data','core'])a[k]??=0;return a;}
function ensureSocialState(s){s.social??={friends:{}};s.social.friends??={};return s.social;}
function resText(x){return Object.entries(x).filter(([,v])=>v>0).map(([k,v])=>`${RES_LABEL[k]||k} ${v}`).join(' / ');}

export class GenesisWorld extends BaseGenesisWorld{
  ensureSocial(){return ensureSocialState(this.state);}
  touchPresence(uid){const a=this.human(uid);if(a)a.lastPresenceAt=now();}
  collapse(){const social=structuredClone(this.state.social||{friends:{}}),old=this.state.epoch;super.collapse();if(this.state.epoch!==old)this.state.social=social;}

  gather(a,mode='ore'){
    ensureEconomy(a);const g=GATHER_V07[mode]||GATHER_V07.ore,t=now(),m=mech(a.mechId);
    if(!a.alive)return{ok:false,error:'機體正在大修'};
    if(a.gatherReadyAt>t)return{ok:false,error:`採集系統冷卻中，剩餘 ${Math.ceil((a.gatherReadyAt-t)/1000)} 秒`};
    const enCost=Math.ceil(m.en*g.enPct);if(a.en<enCost)return{ok:false,error:`能源不足，需要 ${enCost} EN`};
    a.en-=enCost;a.gatherReadyAt=t+g.cooldown;const bonus=1+(a.upgrades?.mining||0)*.10;
    const gain={money:0,ore:0,crystal:0,alloy:0,data:0,core:0};const take=(k,n)=>this.take(k==='money'?'currency':k,n*bonus);
    if(mode==='ore'){gain.money=take('money',25+Math.random()*55);gain.ore=take('ore',2+Math.random()*6);}
    if(mode==='crystal'){gain.money=take('money',10+Math.random()*30);gain.crystal=take('crystal',1+Math.random()*5);}
    if(mode==='salvage'){gain.ore=take('ore',1+Math.random()*4);gain.alloy=take('alloy',1+Math.random()*4);if(Math.random()<.16)gain.data=take('data',1+Math.random()*3);}
    if(mode==='data'){gain.money=take('money',8+Math.random()*20);gain.data=take('data',3+Math.random()*9);}
    if(mode==='deep'){gain.ore=take('ore',3+Math.random()*8);gain.crystal=take('crystal',2+Math.random()*6);if(Math.random()<.10)gain.core=take('core',1);}
    if(mode==='asteroid'){gain.ore=take('ore',6+Math.random()*12);gain.alloy=take('alloy',2+Math.random()*7);}
    if(mode==='reactor'){gain.crystal=take('crystal',5+Math.random()*10);gain.data=take('data',1+Math.random()*4);if(Math.random()<.06)gain.core=take('core',1);}
    if(mode==='convoy'){gain.money=take('money',55+Math.random()*90);gain.data=take('data',2+Math.random()*5);}
    if(mode==='ruins'){gain.money=take('money',20+Math.random()*60);gain.alloy=take('alloy',1+Math.random()*5);gain.data=take('data',1+Math.random()*4);}
    if(mode==='anomaly'){gain.crystal=take('crystal',3+Math.random()*9);gain.data=take('data',4+Math.random()*11);if(Math.random()<.14)gain.core=take('core',1);}
    for(const [k,v] of Object.entries(gain))a[k]=(a[k]||0)+Math.floor(v);
    let riskDamage=0;if(Math.random()<g.risk)riskDamage=this.damageFromRisk(a,.025+Math.random()*.09);
    this.event(`${a.name} 完成「${g.name}」，取得 ${resText(gain)||'少量殘存物資'}${riskDamage?`，環境損傷 ${riskDamage}`:''}。`,{kind:'gather',actorId:a.id,mode});
    return{ok:true,mode,name:g.name,gain,riskDamage,cooldown:g.cooldown};
  }

  destroy(winner,loser,t){
    ensureEconomy(winner);ensureEconomy(loser);loser.losses=(loser.losses||0)+1;winner.wins=(winner.wins||0)+1;
    const burned={},transferred={},retained={};
    for(const k of Object.keys(LOOT_POLICY)){
      const held=Math.max(0,Math.floor(loser[k]||0)),p=LOOT_POLICY[k],burn=Math.floor(held*p.burn),give=Math.floor(held*p.winner),remain=Math.max(0,held-burn-give);
      loser[k]=remain;winner[k]=(winner[k]||0)+give;burned[k]=burn;transferred[k]=give;retained[k]=remain;
      const bk=k==='money'?'currency':k;this.state.burned[bk]=(this.state.burned[bk]||0)+burn;
    }
    if(loser.type==='human'){loser.alive=false;loser.destroyedUntil=t+10*60*1000;}else{loser.alive=false;loser.destroyedUntil=0;}
    this._lootBreakdown={winnerId:winner.id,loserId:loser.id,burned,transferred,retained,policy:LOOT_POLICY};return transferred.money||0;
  }

  attack(a,d){this._lootBreakdown=null;const result=super.attack(a,d);if(result?.ok&&result.battle&&this._lootBreakdown){result.battle.lootBreakdown=structuredClone(this._lootBreakdown);const w=this.state.actors[this._lootBreakdown.winnerId],l=this.state.actors[this._lootBreakdown.loserId];this.event(`⚖️ 擊毀共識：${w?.name||'勝者'}取得 ${resText(this._lootBreakdown.transferred)||'0'}；世界永久銷毀 ${resText(this._lootBreakdown.burned)||'0'}；${l?.name||'敗者'}保留剩餘資產。`,{kind:'burn',battleId:result.battle.id});}return result;}

  public(uid=null){
    this.ensureSocial();const p=super.public(uid);p.version='0.7';p.gatherModes=Object.entries(GATHER_V07).map(([id,x])=>({id,...x}));
    p.lootPolicy={money:'銷毀 40%｜勝者 15%｜敗者保留 45%',materials:'銷毀 35%｜勝者 15%｜敗者保留 50%',core:'銷毀 30%｜勝者 10%｜敗者保留 60%',principle:'所有戰利品只從敗者既有資產轉移；銷毀部分永久退出流通，不因戰鬥增發。'};
    const humans=Object.values(this.state.actors||{}).filter(a=>a.type==='human').map(a=>({id:a.id,userId:a.userId,name:a.name,mechId:a.mechId,mechName:mech(a.mechId).name,lastPresenceAt:a.lastPresenceAt||0,alive:a.alive}));
    const friendIds=(this.state.social.friends[String(uid)]||[]).map(Number);p.social={friendUserIds:friendIds,humans};p.rules.cityBattleVariants=100;return p;
  }

  async fetch(req){
    const u=new URL(req.url),uid=+req.headers.get('x-user-id')||0;if(uid){this.touchPresence(uid);this.ensureSocial();}
    if(u.pathname==='/state'){await this.save();return json(this.public(uid||null));}
    if(u.pathname==='/action'&&req.method==='POST'){
      const body=await req.clone().json().catch(()=>({}));
      if(body.action==='addFriend'||body.action==='removeFriend'){
        if(!uid)return json({error:'請先登入主帳號'},401);const me=this.human(uid);if(!me)return json({error:'請先加入 Genesis 世界'},400);
        const social=this.ensureSocial(),key=String(uid),set=new Set((social.friends[key]||[]).map(Number));
        if(body.action==='addFriend'){const target=this.state.actors[String(body.targetId||'')];if(!target||target.type!=='human'||target.userId===uid)return json({error:'無效好友目標'},400);set.add(Number(target.userId));this.event(`🤝 ${me.name} 與 ${target.name} 建立好友連結。`,{kind:'friend'});}else set.delete(Number(body.userId));
        social.friends[key]=[...set].slice(0,100);await this.save();return json({ok:true,state:this.public(uid)});
      }
    }
    const res=await super.fetch(req);if(uid){this.touchPresence(uid);await this.save();}return res;
  }
}
