import { GenesisWorld as BaseGenesisWorld } from './genesis-v08.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const GATHER_GUIDE={
  ore:{tier:'I',main:['Genesis G','礦石'],bonus:[],role:'低風險基礎收入'},
  crystal:{tier:'II',main:['能源晶體'],bonus:['Genesis G'],role:'能源型強化素材'},
  salvage:{tier:'II',main:['稀有合金','礦石'],bonus:['戰術資料'],role:'裝備與機體素材'},
  data:{tier:'I',main:['戰術資料'],bonus:['Genesis G'],role:'瞄準、散熱、採集強化'},
  deep:{tier:'III',main:['礦石','能源晶體'],bonus:['核心'],role:'高風險稀有資源'},
  asteroid:{tier:'III',main:['礦石','稀有合金'],bonus:[],role:'大量結構素材'},
  reactor:{tier:'III',main:['能源晶體'],bonus:['戰術資料','核心'],role:'高能源消耗、高價值'},
  convoy:{tier:'II',main:['Genesis G','戰術資料'],bonus:[],role:'穩定貨幣與資料'},
  ruins:{tier:'II',main:['Genesis G','稀有合金'],bonus:['戰術資料'],role:'混合型搜刮'},
  anomaly:{tier:'IV',main:['能源晶體','戰術資料'],bonus:['核心'],role:'最高風險、最高稀有度'}
};

function healthBreakdown(state){
  const actors=Object.values(state.actors||{}),living=actors.filter(a=>a.alive);
  const populationScore=clamp(living.length/80*100,0,100);
  const r=state.reserve||{};
  const reserveScore=clamp(((r.currency||0)/25000+(r.ore||0)/2500+(r.crystal||0)/700)*18,0,100);
  const circulation=actors.reduce((z,a)=>z+(a.money||0),0);
  const top10=actors.map(a=>a.money||0).sort((a,b)=>b-a).slice(0,10).reduce((a,b)=>a+b,0);
  const equalityScore=clamp(100-(circulation?top10/circulation:0)*80,0,100);
  const total=Math.round(populationScore*.35+reserveScore*.35+equalityScore*.30);
  const status=total>=75?'健康':total>=50?'穩定':total>=25?'壓力':'危急';
  return {
    total,status,
    components:[
      {id:'population',label:'人口活力',score:+populationScore.toFixed(1),weight:.35,contribution:+(populationScore*.35).toFixed(1),meaning:'存活角色越接近 80 名，文明活動度越高；80 名以上此項封頂。'},
      {id:'reserve',label:'世界儲備',score:+reserveScore.toFixed(1),weight:.35,contribution:+(reserveScore*.35).toFixed(1),meaning:'主要看世界尚可流通的 Genesis G、礦石、能源晶體；資源枯竭會快速拉低分數。'},
      {id:'equality',label:'財富分散',score:+equalityScore.toFixed(1),weight:.30,contribution:+(equalityScore*.30).toFixed(1),meaning:'前 10 名佔有流通貨幣越高，分數越低，用來監測財富過度集中。'}
    ],
    formula:'健康度 = 人口活力×35% + 世界儲備×35% + 財富分散×30%',
    collapseRule:'健康度低於 5 且連續 72 個世界區塊，才會觸發文明崩塌。',
    interpretation:['75–100：健康','50–74：穩定','25–49：壓力','0–24：危急']
  };
}

export class GenesisWorld extends BaseGenesisWorld{
  public(uid=null){
    const p=super.public(uid);
    p.version='0.9';
    p.healthBreakdown=healthBreakdown(this.state);
    p.gatherModes=(p.gatherModes||[]).map(g=>({...g,guide:GATHER_GUIDE[g.id]||{tier:'I',main:[],bonus:[],role:''}}));
    p.rules.healthFormula=p.healthBreakdown.formula;
    return p;
  }
}
