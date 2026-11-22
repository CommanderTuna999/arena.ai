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
