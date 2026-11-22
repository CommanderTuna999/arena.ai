import { ExperimentalWorldClient } from '../../world-client';
import { ReplicaView } from '../../replica-view';
import { DemoPlayback } from '../../demo-playback';
import { MAX_VIEW_DIMENSION } from '../../demo-view';
import { render } from '../../../render';
const canvas=document.querySelector('canvas')!,ctx=canvas.getContext('2d')!,status=document.querySelector('#status')!;
const replica=new ReplicaView();
let client=new ExperimentalWorldClient(url=>new WebSocket(url),15000,window.location.origin,true);
let stopped=false, connecting=false, retryTimer: ReturnType<typeof setTimeout> | null=null, attempts=0;
let sequence=0,mouseX=innerWidth/2,mouseY=innerHeight/2,fire=false,viewportDirty=true;
let displayClient: ExperimentalWorldClient | null=null, playback=new DemoPlayback();
let frames=0,fps=0,fpsStarted=performance.now(),lastViewTime=-1,lastArrival=0,updateGap=0;
const keys=new Set<string>();
function resize(){viewportDirty=true;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*d);canvas.height=Math.round(innerHeight*d);ctx.setTransform(d,0,0,d,0,0);replica.resize(innerWidth,innerHeight,d);}
window.addEventListener('resize',resize);resize();
window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','Space'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();fire=false;});
canvas.addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY});canvas.addEventListener('mousedown',e=>{if(e.button===0)fire=true});window.addEventListener('mouseup',e=>{if(e.button===0)fire=false});
const send=setInterval(()=>{if(client.state!=='online')return;if(viewportDirty && client.sendViewport(Math.min(MAX_VIEW_DIMENSION,Math.max(1,Math.ceil(innerWidth))),Math.min(MAX_VIEW_DIMENSION,Math.max(1,Math.ceil(innerHeight)))))viewportDirty=false;const aim=Math.atan2(mouseY-innerHeight/2,mouseX-innerWidth/2);client.sendInput({seq:sequence++,forward:keys.has('KeyW'),backward:keys.has('KeyS'),left:keys.has('KeyA'),right:keys.has('KeyD'),boost:keys.has('ShiftLeft'),fire:fire||keys.has('Space'),aim});},50);
function draw(){
 requestAnimationFrame(draw);
 const now=performance.now();frames++;
 if(now-fpsStarted>=1000){fps=Math.round(frames*1000/(now-fpsStarted));frames=0;fpsStarted=now;}
 const current=client.renderSnapshot();
 if(current && displayClient!==client){displayClient=client;playback=new DemoPlayback();lastViewTime=-1;lastArrival=0;updateGap=0;}
 if(current && current.time!==lastViewTime){if(lastArrival)updateGap=Math.round(now-lastArrival);lastArrival=now;lastViewTime=current.time;}
 if(client.state==='closed'){status.textContent='Disconnected — reconnecting…';scheduleReconnect();}
 else if(client.state!=='online' || !current) status.textContent=`${client.state}…`;
 const shown=displayClient, view=shown?.renderSnapshot() as any;
 if(!view || !shown?.pilotId){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#040b12';ctx.fillRect(0,0,canvas.width,canvas.height);return;}
 const renderTime=playback.sample(view.time,now);
 const sampled=shown.sample(renderTime) as any;
 const pilotPositions=new Map(sampled.pilots.map((p:any)=>[p.id,p]));
 const pilots=view.pilots.map((p:any)=>({...p,...pilotPositions.get(p.id) as any}));
 const me=pilots.find((p:any)=>p.id===shown.pilotId);if(!me)return;
 if(client===shown && client.state==='online'){attempts=0;status.textContent=`${sampled.pilots.length} pilot${sampled.pilots.length===1?'':'s'} nearby · ${sampled.enemies.length} enemies · ${fps || "…"} FPS · updates ${updateGap || "…"} ms${innerWidth>MAX_VIEW_DIMENSION||innerHeight>MAX_VIEW_DIMENSION?" · viewport exceeds demo limit":""}`;}
 if(replica.apply(view,pilots,sampled.enemies,shown.pilotId,renderTime,sampled)) render(replica.game,ctx);
}
function scheduleReconnect(){
 if(stopped || connecting || retryTimer)return;
 const delay=Math.min(15000,1000*2**Math.min(attempts++,4));
 retryTimer=setTimeout(()=>{retryTimer=null;void connect();},delay);
}
async function connect(){
 if(stopped||connecting)return;connecting=true;
 try{
  status.textContent='Connecting…';
  const res=await fetch('/session',{cache:'no-store'});if(!res.ok)throw Error('Session unavailable');
  const {ticket}=await res.json();if(stopped)return;
  client=new ExperimentalWorldClient(url=>new WebSocket(url),15000,window.location.origin,true);
  sequence=0;viewportDirty=true;keys.clear();fire=false;
  const url=new URL('/world',location.href);url.protocol=location.protocol==='https:'?'wss:':'ws:';
  client.connect(url.toString(),ticket);
 }catch{status.textContent='Connection unavailable — retrying…';client.disconnect();}
 finally{connecting=false;if(client.state==='closed')scheduleReconnect();}
}
requestAnimationFrame(draw);void connect();
window.addEventListener('pagehide',()=>{stopped=true;if(retryTimer)clearTimeout(retryTimer);clearInterval(send);client.disconnect();});
