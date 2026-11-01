import { MECHS } from './catalog.js';

export const GENESIS_WORLD = {
  id: 'genesis-world',
  name: 'Genesis 創世世界',
  version: '0.2',
  blockIntervalMs: 10 * 60 * 1000,
  blocksPerDay: 144,
  npcBirth: {
    baseChance: 0.92,
    comfortPopulation: 150,
    softCap: 300,
    hardCap: 500
  },
  economy: {
    currencyName: 'Genesis G',
    totalCurrencyCap: 100000000,
    totalOreCap: 10000000,
    totalCoreCap: 100000,
    marketFeeRate: 0.02,
    repairBurnRate: 0.06,
    deathBurnRate: 0.25
  },
  emission: {
    currencyPerBlock: 1000,
    orePerBlock: 100,
    corePerBlock: 1,
    halvingEveryBlocks: 1008
  },
  population: {
    seedNPCs: 24,
    actionsPerBlock: 10
  },
  health: {
    yellowBelow: 45,
    redBelow: 20,
    collapseBelow: 5,
    collapseBlocks: 72
  }
};

export const NPC_ARCHETYPES = [
  { id:'aggressive', name:'好戰型' },
  { id:'raider', name:'掠奪型' },
  { id:'merchant', name:'商人型' },
  { id:'guardian', name:'保守型' },
  { id:'revenge', name:'復仇型' },
  { id:'opportunist', name:'機會主義型' }
];

export function rewardAt(blockHeight){
  const era=Math.floor(Math.max(0,blockHeight-1)/GENESIS_WORLD.emission.halvingEveryBlocks);
  return {
    era,
    currency:Math.max(1,Math.floor(GENESIS_WORLD.emission.currencyPerBlock/(2**era))),
    ore:Math.max(1,Math.floor(GENESIS_WORLD.emission.orePerBlock/(2**era))),
    core:Math.max(0,Math.floor(GENESIS_WORLD.emission.corePerBlock/(2**era)))
  };
}

export function spawnChance(population){
  const x=GENESIS_WORLD.npcBirth;
  if(population>=x.hardCap)return 0;
  if(population<=x.comfortPopulation)return x.baseChance;
  if(population>=x.softCap)return 0.10;
  const r=(population-x.comfortPopulation)/(x.softCap-x.comfortPopulation);
  return x.baseChance-r*(x.baseChance-0.10);
}

export function publicGenesisMeta(){
  return {
    world:GENESIS_WORLD,
    archetypes:NPC_ARCHETYPES,
    rewardPreview:[1,1008,2016,3024,4032,8064].map(block=>({block,...rewardAt(block)})),
    spawnPreview:[25,150,225,300,400,500].map(population=>({population,chance:spawnChance(population)})),
    mechs:MECHS
  };
}
