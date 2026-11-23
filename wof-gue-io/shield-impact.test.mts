import assert from 'node:assert/strict';
import {recordShieldImpact,shieldImpacts,drawShieldImpacts} from './src/game/shield-impact';
import {Game} from './src/game/engine';import {newSave} from './src/game/data';
const owner={};assert.deepEqual(shieldImpacts(owner,0),[]);recordShieldImpact(owner,1,2,1);assert.equal(shieldImpacts(owner,1.1).length,1);assert.equal(shieldImpacts(owner,2).length,0);
for(let i=0;i<20;i++)recordShieldImpact(owner,i,0,3);assert.equal(shieldImpacts(owner,3).length,8);
let strokes=0, fills=0; const ctx:any={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){strokes++},fill(){fills++}};
drawShieldImpacts(ctx,{},0,0,3,8,'#7df9ff');assert.equal(strokes,0,'pristine shield invisible');drawShieldImpacts(ctx,owner,0,0,3,8,'#7df9ff');assert.equal(strokes,56);assert.equal(fills,56);
const g:any=new Game(newSave(),'shield');g.player.x=10000;g.player.y=10000;g.player.shield=100;g.stats.armor=0;g.stats.reactive=0;g.stats.dodge=0;g.hurtPlayer(10,{kbx:1,kby:0});assert.equal(shieldImpacts(g.player,g.t).length,1);assert(g.player.shield<100);
console.log('Shield impact cells stay cosmetic, bounded and fade; idle shields are invisible');
