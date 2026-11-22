import assert from 'node:assert/strict';import {WebSocket} from 'ws';import {once} from 'node:events';import {spawn,spawnSync} from 'node:child_process';import {existsSync} from 'node:fs';import {createServer} from 'node:net';
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=(probe.address() as any).port;await new Promise<void>(r=>probe.close(()=>r()));
const base=`http://127.0.0.1:${port}`,origin=base;const clients:WebSocket[]=[];
// The deployed demo is the isolated snapshot, not the unfinished workspace prototype.
const bundled=process.env.DEMO_SOURCE !== '1' || !existsSync('src/game/multiplayer/testing/demo/server.ts');
if(bundled && !existsSync('multiplayer-test/dist/server.cjs')) { const built=spawnSync('node',['multiplayer-test/build.cjs'],{stdio:'inherit'}); assert.equal(built.status,0,'build isolated multiplayer test'); }
const child=spawn(bundled ? 'node' : 'node_modules/.bin/tsx',bundled ? ['multiplayer-test/start.cjs'] : ['src/game/multiplayer/testing/demo/server.ts'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
child.stderr!.on('data',d=>process.stderr.write(d));
await Promise.race([new Promise<void>((resolve,reject)=>{child.stdout!.on('data',d=>{if(String(d).includes('listening'))resolve();});child.on('exit',()=>reject(Error('demo server exited')));}),new Promise((_,reject)=>setTimeout(()=>reject(Error('demo server startup timeout')),10000))]);
const {unpackGeometry}=await import('./multiplayer-test/source/src/game/multiplayer/demo-geometry');
const decoded = new WeakMap<WebSocket, any>();
function until(socket:WebSocket,fn:(v:any)=>boolean,timeout=10000){return new Promise<any>((resolve,reject)=>{const t=setTimeout(()=>{socket.off('message',on);reject(Error('timeout waiting for demo snapshot'));},timeout);function on(raw:any){const rawMessage=JSON.parse(raw.toString());const msg=rawMessage.type==='world-snapshot' ? decoded.get(socket) : rawMessage;if(msg && fn(msg)){clearTimeout(t);socket.off('message',on);resolve(msg);}}socket.on('message',on);});}
async function join(){const response=await fetch(`${base}/session`);assert(response.ok);const {ticket}=await response.json() as any;const ws=new WebSocket(`ws://127.0.0.1:${port}/world`,{origin});clients.push(ws);let cache:any=new Map();ws.on('message',raw=>{const m=JSON.parse(raw.toString());if(m.type==='world-snapshot'){if(m.geometryCache===1){const result=unpackGeometry(m.world,cache);assert(result,'ordered demo geometry must be complete');cache=result.cache;m.world=result.world;}decoded.set(ws,m);}});await once(ws,'open');const welcome=until(ws,m=>m.type==='welcome');ws.send(JSON.stringify({type:'authenticate',ticket}));const id=(await welcome).pilotId;return {ws,id};}
try{
 const one=await join(),two=await join();
 const hasWorld=(m:any)=>m.type==='world-snapshot'&&m.world.pilots.length===2&&m.world.enemies.length>0;
 const [a,b]=await Promise.all([until(one.ws,hasWorld),until(two.ws,hasWorld)]);
 assert(one.ws.extensions.includes('permessage-deflate'),'snapshot compression negotiated');
 // The server accepts bounded viewport updates on an authenticated connection,
 // ignores invalid dimensions, and continues sending snapshots.
 one.ws.send(JSON.stringify({type:'viewport',width:1e9,height:1000}));
 one.ws.send(JSON.stringify({type:'viewport',width:1920,height:1080}));
 await until(one.ws,m=>m.type==='world-snapshot'&&m.sequence>a.sequence);assert.equal(one.ws.readyState,WebSocket.OPEN);
 assert(a.world.pilots.some((p:any)=>p.id===two.id));assert(b.world.pilots.some((p:any)=>p.id===one.id));
 const enemy=a.world.enemies[0];assert(enemy.parts.length>0&&enemy.parts.some((p:any)=>p.poly.length>=6),'enemy body geometry transmitted');
 const bullets=until(two.ws,m=>m.type==='world-snapshot'&&m.world.bullets.length>0);
 one.ws.send(JSON.stringify({type:'input',frame:{seq:0,forward:false,backward:false,left:false,right:false,fire:true,boost:false,aim:0}}));
 const shot=await bullets;assert(shot.world.bullets.length>0,'other player sees server simulated bullets');
 const bad=new WebSocket(`ws://127.0.0.1:${port}/world`,{origin:'https://malicious.example'});bad.on('error',()=>{});const code=await new Promise<number>(resolve=>bad.once('unexpected-response',(_req,res)=>{resolve(res.statusCode!);res.resume();bad.terminate();}));assert.equal(code,403);
 // Exercise the actual browser bundle against the same server, with a canvas
 // spy (jsdom has no pixel renderer). This covers loading, WS URL construction,
 // frames and paint calls; it is not a screenshot or real-browser test.
 const {JSDOM}=await import('jsdom');const script=await fetch(`${base}/demo.js`).then(r=>r.text());
 const dom=new JSDOM('<canvas></canvas><span id="status"></span>',{url:base,runScripts:'outside-only',pretendToBeVisual:true});
 const win=dom.window;let polygons=0, clears=0;let browserError:unknown=null;win.addEventListener('error',e=>{browserError=e.error;e.preventDefault();});
 const paint=new Proxy({closePath(){polygons++},clearRect(){clears++},createRadialGradient(){return {addColorStop(){}}},createLinearGradient(){return {addColorStop(){}}}}, {get:(target,key)=>key in target?(target as any)[key]:()=>{},set:(target,key,value)=>{(target as any)[key]=value;return true;}});
 (win.HTMLCanvasElement.prototype as any).getContext=()=>paint;
 (win as any).fetch=(url:string,options:any)=>fetch(new URL(url,base),options);
 (win as any).structuredClone=structuredClone;
 let browserSocket:WebSocket;let browserConnections=0;
 (win as any).WebSocket=function(url:string){browserConnections++;return browserSocket=new WebSocket(url,{origin})};
 win.eval(script);
 await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{clearInterval(check);reject(Error('browser demo did not render: '+String(browserError)+' status='+win.document.querySelector('#status')?.textContent));},7000);const check=setInterval(()=>{const text=win.document.querySelector('#status')?.textContent||'';if(text.includes('3 pilots') && polygons>2){clearTimeout(timer);clearInterval(check);resolve();}},20)});
 assert(polygons>2,'actual demo canvas calls draw for ships and enemy polygons');assert.equal(browserError,null,'original game renderer should finish without throwing');
 const beforeDisconnectPolygons=polygons, beforeDisconnectClears=clears;
 browserSocket!.terminate();
 await new Promise(resolve=>setTimeout(resolve,250));
 assert(polygons>beforeDisconnectPolygons,'last scene keeps painting while disconnected');
 assert.equal(clears,beforeDisconnectClears,'disconnect does not flash a blank canvas');
 await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{clearInterval(check);reject(Error('browser did not reconnect: '+win.document.querySelector('#status')?.textContent));},12000);const check=setInterval(()=>{if(browserConnections>=2 && (win.document.querySelector('#status')?.textContent||'').includes('3 pilots')){clearTimeout(timer);clearInterval(check);resolve();}},50)});
 assert(browserConnections>=2,'browser reconnects with a fresh guest session');
 win.dispatchEvent(new win.Event('pagehide'));win.close();
 console.log('Two demo clients share enemies, player positions and fired projectiles; browser bundle paints; cross-origin socket rejected');
}finally{for(const ws of clients)ws.terminate();child.kill();}
