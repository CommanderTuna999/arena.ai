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
 let r=await fetch(base+'/');assert.equal(r.status,200);assert((await r.text()).includes(process.env.DEMO_EXPECT_HEADER||'CLOUDFLARE GUEST DEMO'));r=await fetch(base+'/demo.js');assert.equal(r.status,200);assert((await r.text()).length>1000);assert.equal((await fetch(base+'/health')).status,200);
 await assert.rejects(open(null,'https://untrusted.example'));
 const ticket=await session(),a=await open(ticket),welcomeA=await receive(a,v=>v.type==='welcome');
 const b=await open(await session()),welcomeB=await receive(b,v=>v.type==='welcome');assert.notEqual(welcomeA.pilotId,welcomeB.pilotId);
 const replay=await open(ticket);await new Promise((resolve,reject)=>{replay.once('close',code=>code===1008?resolve():reject(Error('Expected replay rejection: '+code)));setTimeout(()=>reject(Error('replay timeout')),10000);});
 a.send(JSON.stringify({type:'demo-equip',cannon:'peashooter',pilotId:welcomeB.pilotId}));
 b.send(JSON.stringify({type:'demo-equip',cannon:'workhorse'}));
 const shared=await receive(a,v=>v.type==='world-snapshot'&&v.world.pilots.some(p=>p.id===welcomeA.pilotId&&p.cannonId==='peashooter')&&v.world.pilots.some(p=>p.id===welcomeB.pilotId&&p.cannonId==='workhorse'));
 assert(shared.world.pilots.find(p=>p.id===welcomeB.pilotId).cannonId==='workhorse','guest cannot change another pilot');
 assert.deepEqual(shared.world.demoLoot,[],'new guest has private empty history');
 for(const id of [welcomeA.pilotId,welcomeB.pilotId]){const p=shared.world.pilots.find(p=>p.id===id);assert.equal(p.shieldMax,60);assert.equal(p.shield,60);assert.equal(p.hpMax,100);assert(Array.isArray(p.barrelRec));}
 a.send(JSON.stringify({type:'demo-equip',cannon:'skewer'}));
 await receive(a,v=>v.type==='world-snapshot'&&v.world.pilots.some(p=>p.id===welcomeA.pilotId&&p.cannonId==='skewer'));
 a.send(JSON.stringify({type:'demo-upgrade',track:'dmg',count:1,cannon:'skewer'}));
 await receive(a,v=>v.type==='world-snapshot'&&v.world.pilots.some(p=>p.id===welcomeA.pilotId&&p.levels?.skewer?.dmg===1));
 a.send(JSON.stringify({type:'demo-ship-upgrade',upgrade:'hull',count:1,pilotId:welcomeB.pilotId}));
 const upgraded=await receive(b,v=>v.type==='world-snapshot'&&v.world.pilots.some(p=>p.id===welcomeA.pilotId&&p.upgrades?.hull===1));assert.equal(upgraded.world.pilots.find(p=>p.id===welcomeA.pilotId).hpMax,119);assert.equal(upgraded.world.pilots.find(p=>p.id===welcomeB.pilotId).hpMax,100,'cannot upgrade another pilot');
 a.send(JSON.stringify({type:'demo-ship-upgrade',upgrade:'boost',count:1}));
 const boosted=await receive(a,v=>v.type==='world-snapshot'&&v.world.pilots.some(p=>p.id===welcomeA.pilotId&&p.hasBoost));assert.equal(boosted.world.pilots.find(p=>p.id===welcomeA.pilotId).boost,100);assert.equal(boosted.world.pilots.find(p=>p.id===welcomeB.pilotId).hasBoost,false);
 const first=await receive(a,v=>v.type==='world-snapshot'&&v.world.pilots.some(p=>p.id===welcomeB.pilotId));assert(first.world.pilots.some(p=>p.id===welcomeA.pilotId));
 a.send(JSON.stringify({type:'viewport',width:1000,height:700}));a.send(JSON.stringify({type:'input',frame:{seq:1,forward:true,backward:false,left:false,right:false,fire:false,boost:false,aim:0}}));
 const start=first.world.pilots.find(p=>p.id===welcomeA.pilotId);const next=await receive(a,v=>v.type==='world-snapshot'&&v.sequence>first.sequence&&v.world.pilots.some(p=>p.id===welcomeA.pilotId && Math.hypot(p.x-start.x,p.y-start.y)>0.01));assert(next.world.time>first.world.time,'accepted input advances the guest in the shared world');
 const otherSeesBeam=receive(b,v=>v.type==='world-snapshot'&&Array.isArray(v.world.beams)&&v.world.beams.some(beam=>{const p=v.world.pilots.find(p=>p.id===welcomeA.pilotId);return p && Math.hypot(beam.x1-p.x,beam.y1-p.y)<120;}));
 a.send(JSON.stringify({type:'input',frame:{seq:2,forward:false,backward:false,left:false,right:false,fire:true,boost:false,aim:0}}));
 const beamFrame=await otherSeesBeam;assert(beamFrame.world.beams.length>0,'another guest sees the server simulated hitscan');
 const casingFrame=beamFrame.world.casings?.some(c=>c.weapon==='skewer') ? beamFrame : await receive(b,v=>v.type==='world-snapshot'&&v.world.casings?.some(c=>c.weapon==='skewer'));assert(casingFrame.world.casings.some(c=>c.weapon==='skewer'&&c.kind==='shell'),'other guest receives the actual shot casing');
 const health=await (await fetch(base+'/health')).json();assert.equal(health.players,2);
 await Promise.all([close(a),close(b)]);await wait(200);assert.equal((await (await fetch(base+'/health')).json()).players,0);
 console.log('Local demo: HTTP, origin guard, two guest sockets, replay rejection, shared loadouts, hitscan effects, input and cleanup passed');
})().catch(error=>{console.error(error);process.exit(1);});
