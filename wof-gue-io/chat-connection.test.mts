import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import WebSocket from 'ws';
const probe=createServer(); probe.listen(0,'127.0.0.1'); await once(probe,'listening');
const port=(probe.address() as any).port; await new Promise<void>(r=>probe.close(()=>r()));
const child=spawn(process.execPath,['multiplayer-server/chat-server.mjs'],{env:{...process.env,PORT:String(port),ALLOWED_ORIGINS:''},stdio:['ignore','pipe','pipe']});
try {
 await Promise.race([new Promise<void>((resolve,reject)=>{child.stdout!.on('data',d=>{if(String(d).includes('listening'))resolve();});child.once('exit',()=>reject(Error('server exited')));}),new Promise((_,reject)=>setTimeout(()=>reject(Error('startup timeout')),5000))]);
 const health=await fetch(`http://127.0.0.1:${port}/health`).then(r=>r.json()) as any;
 for(const origin of ['https://wofgue.io','https://www.wofgue.io','https://wof-gue-io.vercel.app','https://wofgueio-overlux.vercel.app']) {
   assert(health.allowedOrigins.includes(origin)); const ws=new WebSocket(`ws://127.0.0.1:${port}/chat`,{origin});
   await once(ws,'message'); ws.close();
 }
 const wrong=new WebSocket(`ws://127.0.0.1:${port}/chat`,{origin:'https://attacker.vercel.app'});
 const status=await new Promise<number>((resolve,reject)=>{wrong.once('unexpected-response',(_req,res)=>{resolve(res.statusCode!);res.resume();wrong.terminate();});wrong.on('error',()=>{});setTimeout(()=>reject(Error('upgrade timeout')),3000);});
 assert.equal(status,403);
 const ui=readFileSync('src/components/Chat.tsx','utf8');
 assert(ui.includes("if (!attempted) setStatus('connecting')")); assert(ui.includes('OFFLINE · RETRYING'));
 console.log('Chat origin allowlist, rejection and stable retry checks passed');
} finally {child.kill();}
