// Run against `npm run dev`, never a live website. Exercises actual local
// workerd HTTP and WebSocket traffic, not a benchmark of Cloudflare's network.
const assert=require('node:assert/strict');const WebSocket=require('ws');
const base=process.env.DEMO_TEST_URL||'http://127.0.0.1:8787';const origin=new URL(base).origin;const wsUrl=base.replace(/^http/,'ws')+'/world';
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
async function session(){const r=await fetch(base+'/session');assert.equal(r.status,200);return (await r.json()).ticket;}
function open(ticket,customOrigin=origin){return new Promise((resolve,reject)=>{const ws=new WebSocket(wsUrl,{origin:customOrigin});const timer=setTimeout(()=>reject(Error('open timeout')),10000);ws.on('open',()=>{clearTimeout(timer);if(ticket)ws.send(JSON.stringify({type:'authenticate',ticket}));resolve(ws);});ws.on('error',reject);});}
function receive(ws,condition,ms=15000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{cleanup();reject(Error('message timeout'));},ms);function cleanup(){clearTimeout(timer);ws.off('message',msg);ws.off('close',closed);}function msg(data){let v;try{v=JSON.parse(data);}catch{return;}if(condition(v)){cleanup();resolve(v);}}function closed(code,reason){cleanup();reject(Error(`closed ${code} ${reason}`));}ws.on('message',msg);ws.on('close',closed);});}
function close(ws){return new Promise(resolve=>{if(ws.readyState===WebSocket.CLOSED)return resolve();ws.once('close',resolve);ws.close();});}
(async()=>{
 let r=await fetch(base+'/');assert.equal(r.status,200);assert((await r.text()).includes('CLOUDFLARE GUEST DEMO'));r=await fetch(base+'/demo.js');assert.equal(r.status,200);assert((await r.text()).length>1000);assert.equal((await fetch(base+'/health')).status,200);
 await assert.rejects(open(null,'https://untrusted.example'));
 const ticket=await session(),a=await open(ticket),welcomeA=await receive(a,v=>v.type==='welcome');
 const b=await open(await session()),welcomeB=await receive(b,v=>v.type==='welcome');assert.notEqual(welcomeA.pilotId,welcomeB.pilotId);
 const replay=await open(ticket);await new Promise((resolve,reject)=>{replay.once('close',code=>code===1008?resolve():reject(Error('Expected replay rejection: '+code)));setTimeout(()=>reject(Error('replay timeout')),10000);});
 const first=await receive(a,v=>v.type==='world-snapshot'&&v.world.pilots.some(p=>p.id===welcomeB.pilotId));assert(first.world.pilots.some(p=>p.id===welcomeA.pilotId));
 a.send(JSON.stringify({type:'viewport',width:1000,height:700}));a.send(JSON.stringify({type:'input',frame:{seq:1,forward:true,backward:false,left:false,right:false,fire:false,boost:false,aim:0}}));
 const start=first.world.pilots.find(p=>p.id===welcomeA.pilotId);const next=await receive(a,v=>v.type==='world-snapshot'&&v.sequence>first.sequence&&v.world.pilots.some(p=>p.id===welcomeA.pilotId && Math.hypot(p.x-start.x,p.y-start.y)>0.01));assert(next.world.time>first.world.time,'accepted input advances the guest in the shared world');
 const health=await (await fetch(base+'/health')).json();assert.equal(health.players,2);
 await Promise.all([close(a),close(b)]);await wait(200);assert.equal((await (await fetch(base+'/health')).json()).players,0);
 console.log('Local workerd: HTTP, origin guard, two guest sockets, replay rejection, shared snapshots, input and cleanup passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
