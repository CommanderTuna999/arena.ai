/** Ephemeral disposable visual prototype only — NOT the public game server.
 * Guest sessions, no accounts or progression, no real security audit, and
 * incomplete combat. Never import into production routes or attach real saves. */
import http from 'node:http';
import {readFileSync} from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { buildSync } from 'esbuild';
import { WebSocketServer } from 'ws';
import { Game } from '../../../engine';
import { BASE, newSave } from '../../../data';
import { CombatHarness } from '../../combat-harness';
import { PilotRoom } from '../../pilot-room';
import { PilotTransport } from '../../pilot-transport';
import { TicketAuthority, TicketReplayGuard } from '../../ticket';
import { AuthenticatedPilotTransport } from '../../authenticated-transport';
import { demoInterestRadius } from '../../demo-view';

const port=Number(process.env.PORT || 3001), capacity=12;
if(!Number.isSafeInteger(port)||port<1||port>65535) throw Error('Invalid port');
const secret=randomBytes(32).toString('hex'), authority=new TicketAuthority(secret,'visual-demo');
const world=new Game(newSave(),'world');
const harness=new CombatHarness(world,capacity,true,undefined,undefined,true),room=new PilotRoom(world,capacity,60,harness);
const transport=new PilotTransport(room,262144,3500,125,true),auth=new AuthenticatedPilotTransport(transport,new TicketReplayGuard(authority),5000,capacity);
const javascript=process.env.DEMO_CLIENT_BUNDLE ? readFileSync(process.env.DEMO_CLIENT_BUNDLE) : buildSync({entryPoints:['src/game/multiplayer/testing/demo/client.ts'],bundle:true,write:false,platform:'browser',format:'iife',target:'es2020',minify:false,logLevel:'silent'}).outputFiles[0].contents;
let healthy=true, totalSessions=0;
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Multiplayer visual prototype</title><style>*{box-sizing:border-box}html,body{margin:0;background:#040b12;color:#c7f9ff;font:14px system-ui;overflow:hidden}canvas{display:block;width:100vw;height:100dvh;cursor:crosshair}#info{position:fixed;top:12px;left:12px;background:#06121deF;border:1px solid #3e8294;padding:10px 14px;border-radius:7px;pointer-events:none;max-width:450px}strong{color:#ffe18d}#status{color:#7df9ff}</style></head><body><canvas></canvas><div id="info"><strong>EXPERIMENTAL SHARED-WORLD DEMO</strong><br>Temporary guest pilots · no saves or progression<br>WASD: move · mouse: aim · hold left click: fire<br>1: Stinger · 2: Peashooter · 3: Workhorse<br>FPS and time between updates are diagnostics, not ping.<br><span id="status">Connecting…</span></div><script src="/demo.js"></script></body></html>`;
const sessions=new Map<string,{start:number,count:number}>();
function allowSession(req:http.IncomingMessage) {
  const key=req.socket.remoteAddress||'unknown',now=Date.now();let r=sessions.get(key);
  if(!r||now-r.start>60000){r={start:now,count:0};sessions.set(key,r);}
  if(sessions.size>1000)for(const [k,v] of sessions)if(now-v.start>60000)sessions.delete(k);
  return ++r.count<=180;
}
const server=http.createServer((req,res)=>{
  res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');
  if(req.method==='GET' && req.url==='/') {res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end(html);return;}
  if(req.method==='GET' && req.url==='/demo.js') {res.writeHead(200,{'content-type':'application/javascript; charset=utf-8'});res.end(javascript);return;}
  if(req.method==='GET' && req.url==='/session' && healthy && allowSession(req)) {
    const id=`guest_${randomUUID().replaceAll('-','')}`,name=`Guest${++totalSessions}`;
    res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ticket:authority.issue({id,name},Date.now())}));return;
  }
  if(req.method==='GET' && req.url==='/health'){res.writeHead(healthy?200:503,{'content-type':'application/json'});res.end(JSON.stringify({ok:healthy,experimental:true,build:'guest-arsenal-v1',players:room.roster.size}));return;}
  res.writeHead(404);res.end();
});
const sockets=new WebSocketServer({noServer:true,maxPayload:1024,perMessageDeflate:{threshold:1024,serverNoContextTakeover:true,clientNoContextTakeover:true,zlibDeflateOptions:{level:1},concurrencyLimit:1}});
server.on('upgrade',(req,socket,head)=>{
  let matches=false;
  try {const origin=new URL(req.headers.origin||'');matches=['http:','https:'].includes(origin.protocol)&&origin.host===req.headers.host;} catch {}
  if(req.url!=='/world'||!matches||sockets.clients.size>=capacity||!healthy){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');return;}
  sockets.handleUpgrade(req,socket,head,ws=>sockets.emit('connection',ws,req));
});
sockets.on('connection',ws=>{
  if(!auth.attach(ws,Date.now())){ws.close(1013,'Server busy');return;}
  let alive=true;ws.on('pong',()=>{alive=true});
  const heartbeat=setInterval(()=>{if(!alive){ws.terminate();return;}alive=false;ws.ping();},30000);
  let joined=false, viewportWindow=0, viewportCount=0;
  ws.on('message',(data,binary)=>{
    if(binary){ws.close(1003,'Text only');return;}
    const text=data.toString(), now=Date.now();
    if (joined) {
      let request: any; try { request=JSON.parse(text); } catch {}
      if (request?.type === 'viewport') {
        if (now-viewportWindow >= 1000) { viewportWindow=now; viewportCount=0; }
        if (++viewportCount <= 10) {
          const radius=demoInterestRadius(request.width,request.height);
          if (radius !== null) transport.setInterestRadius(ws,radius);
        }
        return;
      }
    }
    let identity: ReturnType<TicketAuthority['verify']> = null;
    if(!joined) {try {const request=JSON.parse(text);identity=authority.verify(request.ticket,now);} catch {}}
    const ok=auth.receive(ws,text,now);
    if(!joined&&ok&&identity){
      joined=true;const pilot=room.roster.get(identity.id);
      // Spawn outside the safe no-fire circle, spaced so new pilots can see
      // each other and fire immediately in this disposable visual test.
      if(pilot){pilot.player.x=BASE.x+800;pilot.player.y=BASE.y+(room.roster.size-1)*140;pilot.cam.x=pilot.player.x;pilot.cam.y=pilot.player.y;}
    }
  });
  ws.on('close',()=>{clearInterval(heartbeat);auth.detach(ws);});ws.on('error',()=>{});
});
const tick=setInterval(()=>{if(!healthy)return;try{const now=Date.now();auth.expire(now);transport.advance(now);}catch(error){console.error('Prototype simulation stopped:',error);healthy=false;for(const peer of sockets.clients)peer.close(1011,'Simulation stopped');}},1000/30);
server.listen(port,'0.0.0.0',()=>console.log(`Experimental shared-world demo listening on ${port}`));
function shutdown(){clearInterval(tick);for(const peer of sockets.clients)peer.terminate();sockets.close();server.close();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
