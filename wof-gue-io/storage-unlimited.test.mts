import assert from 'node:assert/strict';
import { Game } from './src/game/engine';
import { migrate, newSave, UPGRADES, type Comp } from './src/game/data';
const comp=(id:string):Comp=>({id,species:'Moth',name:'Moth Wing',kind:'wing',tier:1,poly:[0,0,1,1],area:3,mass:1,hue:10,value:20});
const old=newSave();old.upgrades.cargo=3;old.credits=123;old.inventory=Array.from({length:120},(_,i)=>comp(`component_${i}`));
const migrated=migrate(old);assert.equal(migrated.credits,123+80+136+231);assert.equal(migrated.upgrades.cargo,undefined);
assert.equal(migrate(migrated).credits,migrated.credits);assert(!UPGRADES.some(u=>u.id==='cargo'));
const game=new Game(migrated,'pilot');const oldCredits=game.save.credits;
(game as any).dockComp({c:comp('extra'),x:0,y:0});assert.equal(game.save.inventory.length,121);assert.equal(game.save.credits,oldCredits);
game.save.autoSell=true;(game as any).dockComp({c:comp('sell'),x:0,y:0});assert.equal(game.save.inventory.length,121);assert(game.save.credits>oldCredits);
console.log('Unlimited component storage, explicit auto-sell, and one-time Cargo Bay refunds passed');
// Large saves must not use fetch keepalive's small browser body limit.
let request:RequestInit|undefined;(globalThis as any).fetch=async (_url:string,init:RequestInit)=>{request=init;return {ok:true}};
game.save.inventory=Array.from({length:1000},(_,i)=>comp(`many_${i}`));await game.pushServer();assert.equal(request?.keepalive,false);
let failures=0;(globalThis as any).localStorage={setItem:()=>{failures++;throw Error('quota')}};
game.persist(true);game.persist();assert.equal(failures,2,'failed save stays dirty and retries');
assert.equal(game.toasts.filter(t=>t.msg.includes('Browser save failed')).length,1,'do not repeatedly nag on persistent quota failure');
