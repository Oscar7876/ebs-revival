import assert from 'node:assert/strict';
import { GenesisWorld } from '../src/genesis-v094.js';

class MockStorage {
  constructor(){ this.map=new Map(); this.alarm=null; }
  async get(k){ return this.map.get(k); }
  async put(k,v){ this.map.set(k,structuredClone(v)); }
  async getAlarm(){ return this.alarm; }
  async setAlarm(v){ this.alarm=v; }
}
class MockCtx {
  constructor(){ this.storage=new MockStorage(); this.ready=Promise.resolve(); }
  blockConcurrencyWhile(fn){ this.ready=Promise.resolve().then(fn); return this.ready; }
}

const ctx=new MockCtx();
const world=new GenesisWorld(ctx,{});
await ctx.ready;

async function call(path, body=null){
  const init={headers:{'x-user-id':'1','x-username':'SmokePilot'}};
  if(body){ init.method='POST'; init.headers['content-type']='application/json'; init.body=JSON.stringify(body); }
  const r=await world.fetch(new Request(`https://genesis.internal${path}`,init));
  const data=await r.json();
  if(!r.ok) throw new Error(`${path} ${r.status}: ${JSON.stringify(data)}`);
  return data;
}

let data=await call('/join',{});
assert.equal(data.ok,true,'join should succeed');
assert.ok(data.state.myActor,'joined actor should exist');

const actor=world.human(1);
actor.money=20000;
actor.ore=200;
actor.data=100;
actor.en=9999;
actor.hp=9999;
actor.cooldownUntil=0;
actor.gatherReadyAt=0;
actor.dungeonReadyAt=0;
await world.save();

data=await call('/action',{action:'gather',mode:'ore'});
assert.equal(data.ok,true,'gather should succeed');
assert.ok(data.state?.myActor,'gather should return state');

actor.gatherReadyAt=0;
actor.en=9999;
actor.hp=9999;
actor.dungeonReadyAt=0;
data=await call('/action',{action:'runDungeon',dungeonId:'patrol'});
assert.equal(data.ok,true,'dungeon should succeed');
assert.ok(typeof data.damage==='number','dungeon should return damage');

actor.money=20000;
actor.ore=200;
data=await call('/action',{action:'buyWeapon',weaponId:'mg'});
assert.equal(data.ok,true,'buyWeapon should succeed');
assert.ok(data.state?.myActor,'buyWeapon should return state');

data=await call('/action',{action:'equipWeapon',weaponId:'mg'});
assert.equal(data.ok,true,'equipWeapon should succeed');
assert.equal(data.state.myActor.weaponId,'mg','equipped weapon should be mg');

const target=(data.state.actors||[]).find(x=>x.id!==data.state.myActor.id && x.type==='ai' && x.alive);
assert.ok(target,'an AI target should exist');
actor.en=9999;
actor.hp=9999;
actor.cooldownUntil=0;
data=await call('/action',{action:'attack',targetId:target.id});
assert.equal(data.ok,true,'attack should succeed');
assert.ok(data.battle,'attack should return battle');

console.log('GENESIS_SMOKE_OK', {
  version:data.state.version,
  actor:data.state.myActor.name,
  weapon:data.state.myActor.weaponId,
  target:target.id
});
