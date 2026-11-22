import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import WebSocket from 'ws';
const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');
const port=(probe.address() as any).port;await new Promise<void>(r=>probe.close(()=>r()));
const child=spawn(process.execPath,['multiplayer-server/chat-server.mjs'],{env:{...process.env,PORT:String(port),ALLOWED_ORIGINS:'https://wofgue.io'},stdio:['ignore','pipe','pipe']});
const waitType=(socket:WebSocket,type:string)=>new Promise<any>((resolve,reject)=>{
 const timer=setTimeout(()=>{socket.off('message',on);reject(Error(`Timeout ${type}`));},3000);
 const on=(raw:any)=>{const data=JSON.parse(raw.toString());if(data.type===type){clearTimeout(timer);socket.off('message',on);resolve(data);}};
 socket.on('message',on);
});
const clients:WebSocket[]=[];
try {
 await Promise.race([new Promise<void>((resolve,reject)=>{child.stdout!.on('data',d=>{if(String(d).includes('listening'))resolve();});child.once('exit',()=>reject(Error('server exited')));}),new Promise((_,reject)=>setTimeout(()=>reject(Error('startup timeout')),5000))]);
 const a=new WebSocket(`ws://127.0.0.1:${port}/chat`,{origin:'https://wofgue.io'}),b=new WebSocket(`ws://127.0.0.1:${port}/chat`,{origin:'https://wofgue.io'});clients.push(a,b);
 const ah=waitType(a,'history'),bh=waitType(b,'history');assert.equal((await ah).protocol,2);await bh;
 const am=waitType(a,'message'),bm=waitType(b,'message'),ack=waitType(a,'ack');
 a.send(JSON.stringify({type:'chat',clientId:'message-123',name:'Pilot',text:'Lunar Moth found!\nFine'}));
 const msg=(await bm).message;await am;assert.equal((await ack).clientId,'message-123');
 assert.equal(msg.name,'Pilot');assert.equal(msg.text,'Lunar Moth found! Fine');
 let broadcasts=0;const count=()=>broadcasts++;b.on('message',count);
 const retryAck=waitType(a,'ack');a.send(JSON.stringify({type:'chat',clientId:'message-123',name:'Pilot',text:'Lunar Moth found! Fine'}));await retryAck;
 await new Promise(r=>setTimeout(r,100));b.off('message',count);assert.equal(broadcasts,0,'retry does not broadcast a duplicate');
 console.log('Chat server preserves letters, sanitizes control characters, and acknowledges retry IDs');
} finally {for(const c of clients)c.terminate();child.kill();}
