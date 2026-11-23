import assert from 'node:assert/strict';
import {Game} from './src/game/engine';import {newSave} from './src/game/data';import {runAdminCommand} from './src/game/admin-commands';
const g:any=new Game(newSave(),'spawn');g.resize(1280,720,1);g.admin.on=true;g.player.x=5000;g.player.y=5000;g.cam.x=5000;g.cam.y=5000;
// World is full of distant neutral residents: admin spawns reclaim one slot.
const far=g.makeEnemy(0,0,50000,50000,'world',1);far.aggro=false;g.enemies=Array(420).fill(far);
const result=runAdminCommand(g,'/spawn mantis common',()=>{});assert.match(result,/Spawned/);assert.equal(g.enemies.length,420);assert.equal(g.enemies.at(-1).chunk,'sandbox');
const e=g.enemies.at(-1);assert(e.dist<2500,'spawn placed near the pilot');
g.enemies=Array(420).fill({...far,aggro:true});assert.match(runAdminCommand(g,'/spawn mantis common',()=>{}),/Spawn limit reached/);
console.log('Spawn reserves distant slots and reports an actual failure at capacity');
