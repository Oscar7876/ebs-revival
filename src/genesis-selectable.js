import { GenesisWorld as BaseGenesisWorld } from './genesis-world.js';
import { mechById } from './catalog.js';

const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

export class GenesisWorld extends BaseGenesisWorld {
  async fetch(req){
    const url=new URL(req.url);
    if(url.pathname==='/action'&&req.method==='POST'){
      const body=await req.clone().json().catch(()=>({}));
      if(body.action==='selectMech'){
        const uid=Number(req.headers.get('x-user-id'))||0;
        if(!uid)return json({error:'請先登入主帳號'},401);
        const actor=this.human(uid);
        if(!actor)return json({error:'請先加入 Genesis 世界'},400);
        const target=mechById(String(body.mechId||''));
        if(!target)return json({error:'找不到此機體'},400);
        const t=Date.now();
        if(!actor.alive)return json({error:'機體正在大修，無法進行機庫整備'},400);
        if((actor.hangarReadyAt||0)>t)return json({error:`機庫整備中，剩餘 ${Math.ceil((actor.hangarReadyAt-t)/1000)} 秒`},400);
        if((actor.lastAttackedAt||0)>t-30000)return json({error:'剛遭受攻擊，請脫離戰鬥 30 秒後再更換機體'},400);
        if((actor.cooldownUntil||0)>t)return json({error:'武裝仍在冷卻，暫時不能更換機體'},400);
        if(actor.mechId===target.id)return json({error:'目前已經駕駛這台機體'},400);

        const current=this.public(uid).myActor;
        const hpRatio=current?.maxHp?Math.max(0.01,current.hp/current.maxHp):1;
        const enRatio=current?.maxEn?Math.max(0,current.en/current.maxEn):1;
        const firstChoice=!actor.mechChosenOnce;
        const cost=firstChoice?0:Math.max(100,Math.ceil((target.price||1000)*0.08));
        if(actor.money<cost)return json({error:`Genesis G 不足，更換 ${target.name} 需要 ${cost} G`},400);

        actor.money-=cost;
        if(cost>0)this.state.burned.currency+=cost;
        actor.mechId=target.id;
        actor.hp=Math.max(1,Math.round(target.hp*hpRatio));
        actor.en=Math.round(target.en*enRatio);
        actor.mechChosenOnce=true;
        actor.hangarReadyAt=t+180000;
        actor.lastUpdate=t;
        this.event(`${actor.name} 進入機庫，${firstChoice?'免費選擇初始機體':'支付 '+cost+' G 整備'}：${target.name}。`,{kind:'hangar',actorId:actor.id,mechId:target.id,cost});
        await this.save();
        return json({ok:true,cost,free:firstChoice,state:this.public(uid)});
      }
    }
    return super.fetch(req);
  }
}
