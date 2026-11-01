import { GenesisWorld as BaseGenesisWorld } from './genesis-v092.js';

const now=()=>Date.now();
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const NEWCOMER_SHIELD_MS=30*60*1000;
const AI_VICTIM_COOLDOWN_MS=90*1000;

function competitionProfile(humans){
  const n=Math.max(0,humans|0);
  if(n<=1)return{tier:'開荒期',aiHumanFocus:.34,label:'AI 補足真人不足的競爭',note:'真人極少時，AI 獵手會較常鎖定真人，但仍保留新手保護。'};
  if(n<=5)return{tier:'小隊競爭',aiHumanFocus:.42,label:'AI + 真人混合競爭',note:'真人增加後，AI 對真人的關注提高，富有／高勝場玩家更容易成為目標。'};
  if(n<=15)return{tier:'戰區競爭',aiHumanFocus:.48,label:'高競爭戰區',note:'中型真人人口時維持最高 AI 壓力，促進採集、整備與戰鬥循環。'};
  if(n<=30)return{tier:'混合戰區',aiHumanFocus:.38,label:'真人競爭逐漸接手',note:'真人數已足以互相競爭，AI 壓力開始下降。'};
  return{tier:'真人主導',aiHumanFocus:.22,label:'以真人 PvP 為主',note:'真人人口高時降低 AI 騷擾，避免多人世界變成 AI 圍毆。'};
}

function threatScore(a){
  const upgrades=Object.values(a?.upgrades||{}).reduce((s,v)=>s+(Number(v)||0),0);
  return Math.max(1,Math.min(8,
    1+(a?.money||0)/2500+(a?.ore||0)/35+(a?.core||0)*1.25+(a?.wins||0)*.18+upgrades*.07
  ));
}
function weightedHuman(humans){
  if(!humans.length)return null;
  const total=humans.reduce((s,h)=>s+threatScore(h),0),r=Math.random()*total;
  let x=r;
  for(const h of humans){x-=threatScore(h);if(x<=0)return h;}
  return humans[humans.length-1];
}
function shieldRemaining(a,t=now()){
  if(!a?.joinedAt)return 0;
  return Math.max(0,NEWCOMER_SHIELD_MS-(t-a.joinedAt));
}

export class GenesisWorld extends BaseGenesisWorld{
  ensureV093(){
    this.ensureV092?.();
    for(const a of Object.values(this.state.actors||{})){
      a.lastAiAttackedAt??=0;
    }
  }

  attack(a,d){
    this.ensureV093();
    const t=now();
    if(d?.type==='human'){
      const shield=shieldRemaining(d,t);
      if(shield>0)return{ok:false,error:`新進世界保護中，剩餘 ${Math.ceil(shield/60000)} 分鐘`};
      if(a?.type==='ai'&&t-(d.lastAiAttackedAt||0)<AI_VICTIM_COOLDOWN_MS)return{ok:false,error:'AI 威脅冷卻中'};
    }
    const r=super.attack(a,d);
    if(r?.ok&&a?.type==='ai'&&d?.type==='human')d.lastAiAttackedAt=t;
    return r;
  }

  aiAction(a){
    this.ensureV093();
    const t=now();
    const humans=Object.values(this.state.actors||{}).filter(x=>x.type==='human'&&x.alive&&shieldRemaining(x,t)<=0);
    const profile=competitionProfile(humans.length);
    if(humans.length&&Math.random()<profile.aiHumanFocus){
      const target=weightedHuman(humans);
      const oldArchetype=a.archetype;
      if(target){a.archetype='revenge';a.lastTargetId=target.id;}
      try{return super.aiAction(a);}finally{a.archetype=oldArchetype;}
    }
    return super.aiAction(a);
  }

  public(uid=null){
    this.ensureV093();
    const p=super.public(uid);
    p.version='0.9.3';
    const humans=Object.values(this.state.actors||{}).filter(x=>x.type==='human'&&x.alive);
    const profile=competitionProfile(humans.length);
    p.competition={
      humanCount:humans.length,
      tier:profile.tier,
      label:profile.label,
      aiHumanFocusPercent:Math.round(profile.aiHumanFocus*100),
      newcomerShieldMinutes:30,
      victimCooldownSeconds:90,
      note:profile.note,
      targetRule:'AI 鎖定真人時會提高富有、勝場較高、強化較高玩家的權重，避免資源長期無風險集中。',
      futureUnlocks:[
        '真人 5+：可啟用限時稀有採集區與懸賞榜',
        '真人 10+：可啟用排名戰與據點爭奪',
        '真人 20+：可啟用勢力戰與城市控制',
        '真人 30+：AI 壓力下降，世界轉為真人 PvP 主導'
      ]
    };
    if(uid&&this.human(uid)&&p.myActor){
      const a=this.human(uid),left=shieldRemaining(a);
      p.myActor.newcomerShieldRemainingMs=left;
      p.myActor.newcomerShielded=left>0;
    }
    return p;
  }

  async fetch(req){
    const u=new URL(req.url),uid=+req.headers.get('x-user-id')||0;
    this.ensureV093();
    if(u.pathname==='/state')return json(this.public(uid||null));
    return super.fetch(req);
  }
}
