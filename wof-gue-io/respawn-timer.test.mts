import assert from 'node:assert/strict';
import { Game } from './src/game/engine';
import { newSave } from './src/game/data';
const game=new Game(newSave(),'respawn') as any;
game.admin.sandbox=true; game.baseLost=true;
function die(){game.killPlayer();assert.equal(game.player.respawn,3);}
die();game.update(.4);assert(Math.abs(game.player.respawn-2.6)<1e-9);assert(game.player.dead);assert(game.t<=.05+1e-9,'world still uses capped physics time');
game.update(5);assert(!game.player.dead,'background time completes the countdown on next frame');assert.equal(game.player.respawn,0);assert.equal(game.player.hp,game.stats.hull);
die();game.paused=true;game.update(10);assert.equal(game.player.respawn,3,'explicit pause does not tick countdown');game.paused=false;game.update(1);assert.equal(game.player.respawn,2);
console.log('Respawn catches up elapsed frame time without fast-forwarding the world or explicit pause');
