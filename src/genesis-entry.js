import stable, { GameWorld, ChatRoom } from './worker.js';
import { GenesisWorld } from './genesis-v092.js';
import { publicGenesisMeta } from './genesis-config.js';

export { GameWorld, ChatRoom, GenesisWorld };

const te=new TextEncoder();
const json=(x,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
function b64(bytes){let s='';for(const x of bytes)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');}
async function sha256(text){return b64(new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(text))));}
async function currentUser(env,request){const m=(request.headers.get('cookie')||'').match(/(?:^|;\s*)ebs_session=([^;]+)/);if(!m)return null;const hash=await sha256(decodeURIComponent(m[1]));const row=await env.DB.prepare('SELECT u.id,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(hash,Date.now()).first();return row?{id:+row.id,username:row.username}:null;}
async function genesisRequest(request,env,path,method='GET'){if(!env.GENESIS)return json({error:'GenesisWorld 尚未綁定'},503);const user=await currentUser(env,request);const headers=new Headers({'content-type':'application/json'});if(user){headers.set('x-user-id',String(user.id));headers.set('x-username',user.username);}const init={method,headers};if(method!=='GET')init.body=await request.text();const id=env.GENESIS.idFromName('genesis-world');return env.GENESIS.get(id).fetch(`https://genesis.internal${path}`,init);}
export default {async fetch(request,env,ctx){const url=new URL(request.url);if(url.pathname==='/api/genesis/meta')return json(publicGenesisMeta());if(url.pathname==='/api/genesis/state')return genesisRequest(request,env,'/state');if(url.pathname==='/api/genesis/join'&&request.method==='POST')return genesisRequest(request,env,'/join','POST');if(url.pathname==='/api/genesis/action'&&request.method==='POST')return genesisRequest(request,env,'/action','POST');return stable.fetch(request,env,ctx);}};
