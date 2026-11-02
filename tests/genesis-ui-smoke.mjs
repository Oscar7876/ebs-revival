import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../public/genesis-v094.js',import.meta.url),'utf8');
let legacy=null;
const panel={appendChild(el){legacy=el;}};
const document={
  querySelector(sel){
    if(sel==='#weaponGrid') return legacy;
    if(sel==='#tab-hangar .panel') return panel;
    return null;
  },
  createElement(){return {id:'',hidden:false,setAttribute(){}};}
};
const sandbox={
  document,
  STATE:null,
  $:()=>null,
  fmt:v=>String(v??''),
  esc:v=>String(v??''),
  api:async()=>({}),
  act:()=>{},
  render:()=>{},
  v093RenderShop:()=>{},
  setTimeout:fn=>{fn();return 0;},
  console
};
vm.runInNewContext(source,sandbox,{filename:'genesis-v094.js'});
assert.ok(legacy,'v0.9.4 must create the legacy weaponGrid compatibility host');
assert.equal(legacy.id,'weaponGrid');
assert.equal(legacy.hidden,true);
console.log('GENESIS_UI_SMOKE_OK',legacy.id);
