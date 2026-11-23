import assert from 'node:assert/strict';import {Game} from './source/src/game/engine';import {newSave} from './source/src/game/data';import {CombatHarness} from './source/src/game/multiplayer/combat-harness';import {ReplicaView} from './source/src/game/multiplayer/replica-view';import {ExperimentalWorldClient} from './source/src/game/multiplayer/world-client';
const world=new Game(newSave(),'world') as any,h=new CombatHarness(world,4);assert(h.roster.add('a','Alpha'));const p=h.roster.get('a')!;p.player.x=-50000;p.player.y=-65000;
const near=world.makeEnemy(0,0,p.player.x+500,p.player.y,'test',1),far=world.makeEnemy(0,0,p.player.x+20000,p.player.y,'test',2);world.enemies=[near,far];
const view=h.snapshot(3500);assert(view.enemies.some(e=>e.id===near.id));assert(!view.enemies.some(e=>e.id===far.id));assert.equal(h.snapshot().enemies.length,2,'unfiltered actual simulation is unchanged');
const r=new ReplicaView();assert(r.apply(view,view.pilots,view.enemies,'a'));const part=r.game.enemies[0].parts[0], before=JSON.stringify(view);const moved=view.enemies.map(e=>({...e,x:e.x+50}));assert(r.apply(view,view.pilots,moved,'a'));assert.equal(r.game.enemies[0].parts[0],part,'enemy geometry is reused between frames');assert.equal(JSON.stringify(view),before,'rendering does not mutate received snapshots');assert.equal(r.game.enemies[0].x,near.x+50);
let socket:any={readyState:1,send(){},close(){},onopen:null,onmessage:null,onerror:null,onclose:null};const client=new ExperimentalWorldClient(()=>socket,5000,'https://example.com',true);client.connect('wss://example.com/world','ticket');socket.onopen();socket.onmessage({data:JSON.stringify({type:'welcome',pilotId:'a'})});socket.onmessage({data:JSON.stringify({type:'world-snapshot',sequence:1,world:{...view,time:1}})});assert(client.renderSnapshot());const frame=client.sample(1);assert.deepEqual(Object.keys(frame.enemies[0]).sort(),['angle','id','x','y']);assert(client.snapshot()!.enemies[0].parts,'full geometry remains available');client.disconnect();
console.log('Interest filtering, lightweight interpolation and cached replica geometry pass');

// A congested connection drops obsolete snapshots rather than building a queue
// or immediately disconnecting. Persistent congestion remains bounded.
const {PilotTransport}=await import('./source/src/game/multiplayer/pilot-transport');
let sent=0,closed=0;const peer:any={bufferedAmount:0,send(){sent++},close(){closed++}};
const mockRoom:any={join:()=>true,leave(){},advance:()=>1,sharedSnapshot:()=>null,snapshot:()=>[]};
const transport=new PilotTransport(mockRoom,100,3500,0);assert(transport.attach(peer,'a'));
peer.bufferedAmount=101;transport.advance(1000);transport.advance(10000);assert.equal(sent,1);assert.equal(closed,0);
peer.bufferedAmount=0;transport.advance(11000);assert.equal(sent,2,'fresh snapshot after recovery');
peer.bufferedAmount=101;transport.advance(12000);transport.advance(27000);assert.equal(closed,1,'persistent backlog is bounded');
const {packGeometry,unpackGeometry}=await import('./source/src/game/multiplayer/demo-geometry');
const {deflateRawSync}=await import('node:zlib');
const first=packGeometry(view,new Map());const restoredFirst=unpackGeometry(first.world,new Map());assert(restoredFirst);assert.deepEqual(restoredFirst.world,view);
const damaged=structuredClone(view);const changed=damaged.enemies[0].parts[0];changed.hp-=1;changed.maxHp+=10;changed.alive=false;changed.hurt=.5;changed.barT=.2;changed.muzzle+=1;changed.shieldHp-=1;changed.shieldDown=.4;changed.shieldHit=.1;changed.cd=.3;changed.beam=.6;
const second=packGeometry(damaged,first.cache);const wirePart=second.world.enemies[0].parts[0];assert(!('poly' in wirePart));assert(!('links' in wirePart));
const restored=unpackGeometry(second.world,restoredFirst.cache);assert(restored);assert.deepEqual(restored.world,damaged,'dynamic damage changes while geometry survives');
assert.equal(unpackGeometry(second.world,new Map()),null,'missing geometry requires reconnect rather than rendering incorrect data');
const empty=packGeometry({...view,enemies:[]},second.cache);assert.equal(empty.cache.size,0);const reentered=packGeometry(view,empty.cache);assert(reentered.world.enemies[0].parts[0].poly,'enemy re-entry sends geometry again');
const originalBytes=Buffer.byteLength(JSON.stringify(damaged)), compactBytes=Buffer.byteLength(JSON.stringify(second.world));
console.log(`Example snapshot geometry: ${originalBytes} -> ${compactBytes} JSON bytes; deflated ${deflateRawSync(JSON.stringify(damaged)).length} -> ${deflateRawSync(JSON.stringify(second.world)).length} bytes`);
const {SnapshotBuffer}=await import('./source/src/game/multiplayer/snapshot-buffer');
const flat=new SnapshotBuffer<any>(2,true),body={id:'a',x:1,y:2,angle:0};assert(flat.push({sequence:0,time:1,bodies:[body]}));body.x=99;const copy=flat.sample(1);assert.equal(copy[0].x,1);copy[0].x=20;assert.equal(flat.sample(1)[0].x,1);

let wire:any={readyState:1,send(){},close(){},onopen:null,onmessage:null,onerror:null,onclose:null};
const wireClient=new ExperimentalWorldClient(()=>wire,5000,'https://example.com',true);wireClient.connect('wss://example.com/world','ticket');wire.onopen();wire.onmessage({data:JSON.stringify({type:'welcome',pilotId:'a'})});
wire.onmessage({data:JSON.stringify({type:'world-snapshot',sequence:0,geometryCache:1,world:{...first.world,time:1}})});
wire.onmessage({data:JSON.stringify({type:'world-snapshot',sequence:1,geometryCache:1,world:{...second.world,time:2}})});
assert.deepEqual(wireClient.snapshot()!.enemies[0].parts,damaged.enemies[0].parts,'client restores compressed geometry and current damage');wireClient.disconnect();
const idleWorld=new Game(newSave(),'idle'), idle=new CombatHarness(idleWorld,4,false,undefined,undefined,true);idle.step(.03,100);assert.equal(idleWorld.t,0,'empty disposable world does no simulation');
const {DemoPlayback}=await import('./source/src/game/multiplayer/demo-playback');
const playback=new DemoPlayback(.18);let last=-Infinity;
// Late and irregular arrivals used to rewind the interpolation target every time
// the delayed playhead had caught up to a previous server snapshot.
for(const [serverTime,wall] of [[1,0],[1,200],[1.133,201],[1.133,250],[1.3,400],[1.3,500],[1.433,505]] as const){
 const next=playback.sample(serverTime,wall);assert(next>=last,'playback never rewinds');assert(next<=serverTime,'playback never extrapolates');last=next;
}
const {demoInterestRadius,MAX_VIEW_DIMENSION}=await import('./source/src/game/multiplayer/demo-view');
assert.equal(r.game.cam.z,1/1.3,'demo uses main game default no-optics zoom');
for(const [width,height] of [[1920,1080],[3840,2160],[7680,4320],[8192,8192]]) {
 const radius=demoInterestRadius(width,height)!;assert(radius>=Math.hypot(width,height)/(2*r.game.cam.z)+120,'viewport corners and renderer margin are covered');assert(radius<=8000);
}
assert.equal(demoInterestRadius(0,1080),null);assert.equal(demoInterestRadius(MAX_VIEW_DIMENSION+1,100),null);assert.equal(demoInterestRadius(200,NaN),null);
const manyWorld=new Game(newSave(),'world') as any,many=new CombatHarness(manyWorld,2);many.roster.add('a');many.roster.add('b');
const manyA=many.roster.get('a')!,manyB=many.roster.get('b')!;manyA.player.x=-50000;manyA.player.y=-65000;manyB.player.x=-50000;manyB.player.y=-65000;
const aNear=manyWorld.makeEnemy(0,0,-49800,-65000,'near',31),aFar=manyWorld.makeEnemy(0,0,-48000,-65000,'far',32);aNear.radius=aFar.radius=10;manyWorld.enemies=[aNear,aFar];
const interestWorld=many.snapshot();let sharedRadius=0;const roomMock:any={join:()=>true,leave(){},demoLoot:()=>[],advance:()=>1,sharedSnapshot:(radius:number)=>{sharedRadius=radius;return interestWorld},snapshot:()=>[]};
const receivedA:string[]=[],receivedB:string[]=[];const pa:any={bufferedAmount:0,send(s:string){receivedA.push(s)},close(){}},pb:any={bufferedAmount:0,send(s:string){receivedB.push(s)},close(){}};
const variable=new PilotTransport(roomMock,65536,3500);assert(variable.attach(pa,'a'));assert(variable.attach(pb,'b'));assert(variable.setInterestRadius(pa,500));assert(variable.setInterestRadius(pb,2500));assert(!variable.setInterestRadius(pa,8001));assert(!variable.setInterestRadius({} as any,500));variable.advance(1000);
assert.equal(sharedRadius,2500);assert.equal(JSON.parse(receivedA.at(-1)!).world.enemies.length,1);assert.equal(JSON.parse(receivedB.at(-1)!).world.enemies.length,2);
variable.detach(pb);variable.advance(1034);assert.equal(sharedRadius,500,'large disconnected view does not inflate remaining views');
console.log('Main-game default zoom and bounded per-viewport interest coverage verified');
// Projectiles have stable server identities; only their visual positions are
// interpolated, and the authoritative snapshot remains unchanged.
const bullet:any={x:p.player.x+100,y:p.player.y,vx:500,vy:0,kind:0,life:1,dmg:1,pierce:0,hit:[],target:null,crit:false};
const shot:any={x:p.player.x+200,y:p.player.y,vx:100,vy:0,type:'bolt',r:4,hue:0,speed:100,tether:false,src:null};
world.bullets=[bullet];world.eprojs=[shot];world.t=10;const shotA=h.snapshot();bullet.x+=100;shot.x+=40;world.t=11;const shotB=h.snapshot();
assert.equal(shotA.bullets[0].id,shotB.bullets[0].id);assert.equal(shotA.enemyProjectiles[0].id,shotB.enemyProjectiles[0].id);assert.notEqual(shotA.bullets[0].id,shotA.enemyProjectiles[0].id);
let projectileWire:any={readyState:1,send(){},close(){},onopen:null,onmessage:null,onerror:null,onclose:null};const projectileClient=new ExperimentalWorldClient(()=>projectileWire,5000,'https://example.com',true);projectileClient.connect('wss://example.com/world','ticket');projectileWire.onopen();projectileWire.onmessage({data:JSON.stringify({type:'welcome',pilotId:'a'})});
const sendFrame=(sequence:number,world:any)=>projectileWire.onmessage({data:JSON.stringify({type:'world-snapshot',sequence,world})});sendFrame(1,shotA);sendFrame(2,shotB);const inBetween=projectileClient.sample(10.5);assert.equal(inBetween.bullets[0].x,bullet.x-50);assert.equal(inBetween.enemyProjectiles[0].x,shot.x-20);
const originalSnapshot=JSON.stringify(shotB);const smoothed=new ReplicaView();assert(smoothed.apply(shotB,shotB.pilots,shotB.enemies,'a',10.5,inBetween));assert.equal(smoothed.game.bullets[0].x,bullet.x-50);assert.equal(smoothed.game.eprojs[0].x,shot.x-20);assert.equal(JSON.stringify(shotB),originalSnapshot);
const malformed=structuredClone(shotB);malformed.time=12;malformed.bullets.push({...malformed.bullets[0]});sendFrame(3,malformed);assert.equal(projectileClient.snapshot()!.time,11);
world.bullets=[];world.eprojs=[];world.t=12;sendFrame(3,h.snapshot());assert.equal(projectileClient.sample(12).bullets.length,0);world.bullets=[{...bullet}];world.t=13;assert.notEqual(h.snapshot().bullets[0].id,shotA.bullets[0].id);projectileClient.disconnect();
console.log('Multiplayer test projectile motion interpolates without changing combat state');
