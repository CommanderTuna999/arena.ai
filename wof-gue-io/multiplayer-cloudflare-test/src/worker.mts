/** Disposable Cloudflare Workers/Durable Objects port of the frozen guest demo.
 * No production routing, accounts, saves, rewards or persistence. */
import {DurableObject} from 'cloudflare:workers';
import {randomBytes,randomUUID} from 'node:crypto';
import client from './generated-client.mts';
import {Game} from '../../multiplayer-test/source/src/game/engine';
import {BASE,newSave} from '../../multiplayer-test/source/src/game/data';
import {CombatHarness} from '../../multiplayer-test/source/src/game/multiplayer/combat-harness';
import {PilotRoom} from '../../multiplayer-test/source/src/game/multiplayer/pilot-room';
import {PilotTransport,type PilotPeer} from '../../multiplayer-test/source/src/game/multiplayer/pilot-transport';
import {TicketAuthority,TicketReplayGuard} from '../../multiplayer-test/source/src/game/multiplayer/ticket';
import {AuthenticatedPilotTransport} from '../../multiplayer-test/source/src/game/multiplayer/authenticated-transport';
import {demoInterestRadius} from '../../multiplayer-test/source/src/game/multiplayer/demo-view';

const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cloudflare multiplayer test</title><style>*{box-sizing:border-box}html,body{margin:0;background:#040b12;color:#c7f9ff;font:14px system-ui;overflow:hidden}canvas{display:block;width:100vw;height:100dvh;cursor:crosshair}#info{position:fixed;top:12px;left:12px;background:#06121def;border:1px solid #3e8294;padding:10px 14px;border-radius:7px;pointer-events:none;max-width:450px}strong{color:#ffe18d}#status{color:#7df9ff}</style></head><body><canvas></canvas><div id="info"><strong>EXPERIMENTAL CLOUDFLARE GUEST DEMO</strong><br>Temporary guests · no saves or progression<br>WASD: move · mouse: aim · hold left click: fire<br>1: Stinger · 2: Peashooter · 3: Workhorse<br>FPS and time between updates are diagnostics, not ping.<br><span id="status">Connecting…</span></div><script src="/demo.js"></script></body></html>`;
const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
function reply(body:string,status=200,type='text/plain; charset=utf-8'){return new Response(body,{status,headers:{...headers,'content-type':type}});}
type Env={DEMO_ROOM:{idFromName(name:string):unknown;get(id:unknown):{fetch(request:Request):Promise<Response>}}};
export default {
  async fetch(req:Request,env:Env):Promise<Response>{
    const url=new URL(req.url);
    if(req.method!=='GET')return reply('Method not allowed',405);
    if(url.pathname==='/' && !url.search)return reply(html,200,'text/html; charset=utf-8');
    if(url.pathname==='/demo.js' && !url.search)return reply(client,200,'application/javascript; charset=utf-8');
    if(!url.search && ['/session','/world','/health'].includes(url.pathname))return env.DEMO_ROOM.get(env.DEMO_ROOM.idFromName('disposable-guest-world')).fetch(req);
    return reply('Not found',404);
  }
};
const CAPACITY=12;
export class DemoRoom extends DurableObject {
  private readonly authority=new TicketAuthority(randomBytes(32).toString('hex'),'visual-demo');
  private readonly world=new Game(newSave(),'world');
  private readonly harness=new CombatHarness(this.world,CAPACITY,true,undefined,undefined,true);
  private readonly room=new PilotRoom(this.world,CAPACITY,60,this.harness);
  private readonly transport=new PilotTransport(this.room,262144,3500,125,true);
  private readonly auth=new AuthenticatedPilotTransport(this.transport,new TicketReplayGuard(this.authority),5000,CAPACITY);
  private readonly peers=new Set<PilotPeer>();
  private readonly rates=new Map<string,{start:number;count:number}>();
  private tick:ReturnType<typeof setInterval>|null=null;
  private healthy=true;
  private count=0;
  private allowSession(key:string,now:number):boolean {
    // Bounded best-effort demo throttling, not a public abuse prevention system.
    for(const [ip,v] of this.rates)if(now-v.start>60000)this.rates.delete(ip);
    if(!this.rates.has(key) && this.rates.size>=1000)return false;
    let state=this.rates.get(key);if(!state || now-state.start>60000){state={start:now,count:0};this.rates.set(key,state);}
    return ++state.count<=180;
  }
  async fetch(req:Request):Promise<Response>{
    const path=new URL(req.url).pathname;
    if(req.method!=='GET')return reply('Method not allowed',405);
    if(path==='/health')return reply(JSON.stringify({ok:this.healthy,experimental:true,build:'cloudflare-arsenal-v1',players:this.room.roster.size}),this.healthy?200:503,'application/json');
    if(path==='/session'){
      if(!this.healthy)return reply('Unavailable',503);
      if(!this.allowSession(req.headers.get('cf-connecting-ip')||'unknown',Date.now()))return reply('Rate limited',429);
      const id=`guest_${randomUUID().replaceAll('-','')}`,name=`Guest${++this.count}`;
      return reply(JSON.stringify({ticket:this.authority.issue({id,name},Date.now())}),200,'application/json');
    }
    if(path!=='/world')return reply('Not found',404);
    let matches=false;try{const origin=new URL(req.headers.get('origin')||'');const requested=new URL(req.url);matches=['http:','https:'].includes(origin.protocol)&&origin.host===requested.host;}catch{}
    if(!matches || req.headers.get('upgrade')?.toLowerCase()!=='websocket' || !this.healthy || this.peers.size>=CAPACITY)return reply('Forbidden',403);
    const pair=new WebSocketPair(),browser=pair[0],socket=pair[1];socket.accept();
    // Workers WebSockets may not expose bufferedAmount; zero is not evidence of
    // a healthy downstream buffer. Load/backpressure behavior needs measurement.
    const peer:PilotPeer={get bufferedAmount(){return Number.isFinite((socket as any).bufferedAmount)?(socket as any).bufferedAmount:0;},send(text){socket.send(text);},close(code,reason){socket.close(code,reason);}};
    this.peers.add(peer);
    if(!this.auth.attach(peer,Date.now())){this.peers.delete(peer);socket.close(1013,'Server busy');return new Response(null,{status:101,webSocket:browser} as any);}
    let joined=false,viewportWindow=0,viewportCount=0;
    socket.addEventListener('message',(event:MessageEvent)=>{
      if(typeof event.data!=='string'){try{socket.close(1003,'Text only');}catch{}return;}
      const text=event.data,now=Date.now();
      if(Buffer.byteLength(text,'utf8')>1024){try{socket.close(1009,'Message too large');}catch{}return;}
      if(joined){let request:any;try{request=JSON.parse(text);}catch{}
        if(request?.type==='viewport'){if(now-viewportWindow>=1000){viewportWindow=now;viewportCount=0;}if(++viewportCount<=10){const radius=demoInterestRadius(request.width,request.height);if(radius!==null)this.transport.setInterestRadius(peer,radius);}return;}}
      let identity:ReturnType<TicketAuthority['verify']>=null;
      if(!joined){try{identity=this.authority.verify(JSON.parse(text).ticket,now);}catch{}}
      const ok=this.auth.receive(peer,text,now);
      if(!joined&&ok&&identity){joined=true;const pilot=this.room.roster.get(identity.id);if(pilot){pilot.player.x=BASE.x+800;pilot.player.y=BASE.y+(this.room.roster.size-1)*140;pilot.cam.x=pilot.player.x;pilot.cam.y=pilot.player.y;}}
    });
    const detach=()=>{this.auth.detach(peer);this.peers.delete(peer);if(!this.peers.size && this.tick){clearInterval(this.tick);this.tick=null;}};
    socket.addEventListener('close',detach);socket.addEventListener('error',detach);
    if(!this.tick)this.tick=setInterval(()=>{if(!this.healthy)return;try{const now=Date.now();this.auth.expire(now);this.transport.advance(now);}catch(error){console.error('Guest simulation stopped',error);this.healthy=false;for(const p of this.peers){try{p.close(1011,'Simulation stopped');}catch{}}if(this.tick)clearInterval(this.tick);this.tick=null;}},1000/30);
    return new Response(null,{status:101,webSocket:browser} as any);
  }
}
