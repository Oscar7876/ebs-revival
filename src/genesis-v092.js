import { GenesisWorld as BaseGenesisWorld } from './genesis-v091.js';
import { WEAPONS, weaponById, mechById } from './catalog.js';

const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const now=()=>Date.now();

function equipmentCost(w){
  if(!w||w.price<=0)return {money:0,ore:0};
  return {money:w.price,ore:Math.max(2,Math.ceil(w.price/700))};
}
function ensureEquipment(a){
  if(!a)return;
  const legacy=weaponById(a.weaponId)?.id||'rifle';
  if(!Array.isArray(a.ownedWeapons)||!a.ownedWeapons.length)a.ownedWeapons=['rifle',legacy];
  if(!a.ownedWeapons.includes('rifle'))a.ownedWeapons.unshift('rifle');
  if(!a.ownedWeapons.includes(legacy))a.ownedWeapons.push(legacy);
  a.ownedWeapons=[...new Set(a.ownedWeapons.filter(id=>weaponById(id)))];
  if(!a.ownedWeapons.includes(a.weaponId))a.weaponId=a.ownedWeapons[0]||'rifle';
}

export class GenesisWorld extends BaseGenesisWorld{
  // v0.9.2 起 Genesis 裝備與主世界完全分離；既有裝備只在第一次轉換時保留為 Genesis 既有資產。
  async syncHumanWeapon(){ return; }

  ensureV092(){
    this.ensureV091?.();
    for(const a of Object.values(this.state.actors||{}))if(a.type==='human')ensureEquipment(a);
  }

  equipmentView(a){
    ensureEquipment(a);
    const m=mechById(a.mechId);
    return WEAPONS.map(w=>{
      const cost=equipmentCost(w),owned=a.ownedWeapons.includes(w.id),equipped=a.weaponId===w.id;
      const loadOk=!m||w.weight<=m.maxLoad;
      const affordable=(a.money||0)>=cost.money&&(a.ore||0)>=cost.ore;
      return {...w,owned,equipped,cost,loadOk,affordable,
        actionReason:equipped?'目前裝備中':owned?(loadOk?'可裝備':'超過目前機體載重'):(affordable?'可購買':`需要 ${cost.money} G / 礦石 ${cost.ore}`)};
    });
  }

  public(uid=null){
    this.ensureV092();
    const p=super.public(uid);
    p.version='0.9.2';
    p.cityBattle={count:100,principle:'每場戰鬥隨機抽取 100 個世界知名都市主題之一；同一場回放固定同一都市。'};
    p.rules.resourceIsolation='主世界與 Genesis 僅共用登入身分；Genesis G、礦石、裝備庫、強化與戰績全部獨立。';
    if(uid&&this.human(uid)&&p.myActor){
      const a=this.human(uid);ensureEquipment(a);
      p.myActor.ownedWeapons=[...a.ownedWeapons];
      p.equipmentInventory=this.equipmentView(a);
    }
    return p;
  }

  async fetch(req){
    const u=new URL(req.url),uid=+req.headers.get('x-user-id')||0;
    this.ensureV092();
    if(u.pathname==='/action'&&req.method==='POST'&&uid){
      const body=await req.clone().json().catch(()=>({}));
      if(body.action==='buyWeapon'||body.action==='equipWeapon'){
        const a=this.human(uid);if(!a)return json({error:'請先加入 Genesis 世界'},400);
        ensureEquipment(a);
        const w=weaponById(body.weaponId);if(!w)return json({error:'找不到此裝備'},400);
        const m=mechById(a.mechId);
        if(body.action==='buyWeapon'){
          if(a.ownedWeapons.includes(w.id))return json({error:'已擁有此裝備'},400);
          const cost=equipmentCost(w);
          if((a.money||0)<cost.money||(a.ore||0)<cost.ore)return json({error:`素材不足：需要 ${cost.money} Genesis G / 礦石 ${cost.ore}`},400);
          a.money-=cost.money;a.ore-=cost.ore;a.ownedWeapons.push(w.id);
          this.event(`🛒 ${a.name} 於 Genesis 裝備工坊取得「${w.name}」，消耗 G${cost.money} / 礦石${cost.ore}。`,{kind:'equipment',actorId:a.id,weaponId:w.id});
        }else{
          if(!a.ownedWeapons.includes(w.id))return json({error:'尚未擁有此裝備'},400);
          if(m&&w.weight>m.maxLoad)return json({error:`載重不足：${w.weight} > ${m.maxLoad}`},400);
          a.weaponId=w.id;
          a.cooldownUntil=Math.max(a.cooldownUntil||0,now()+2500);
          this.event(`🔧 ${a.name} 更換 Genesis 裝備為「${w.name}」。`,{kind:'equipment',actorId:a.id,weaponId:w.id});
        }
        await this.save();
        return json({ok:true,state:this.public(uid),equipment:this.equipmentView(a)});
      }
    }
    return super.fetch(req);
  }
}
