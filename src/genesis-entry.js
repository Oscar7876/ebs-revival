import stable, { GameWorld, ChatRoom } from './worker.js';
import { GenesisWorld } from './genesis-world.js';
import { publicGenesisMeta } from './genesis-config.js';

export { GameWorld, ChatRoom, GenesisWorld };

const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/api/genesis/meta')return json(publicGenesisMeta());
    if(url.pathname==='/api/genesis/state'){
      if(!env.GENESIS)return json({error:'GenesisWorld 尚未綁定'},503);
      const id=env.GENESIS.idFromName('genesis-world');
      return env.GENESIS.get(id).fetch('https://genesis.internal/state');
    }
    return stable.fetch(request,env,ctx);
  }
};
