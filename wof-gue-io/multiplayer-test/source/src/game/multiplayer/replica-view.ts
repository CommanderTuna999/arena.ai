import { Game, VISION_MUL, type Bullet, type EProj, type Enemy, type Other, type Puddle, type Ring } from '../engine';
import { newSave } from '../data';
import { SPECIES_LIST } from '../enemies';
import type { CombatHarness } from './combat-harness';

type WorldSnapshot = ReturnType<CombatHarness['snapshot']>;
type Pilot = WorldSnapshot['pilots'][number];
type EnemyView = WorldSnapshot['enemies'][number];

/** Read-only rendering adapter for the experimental multiplayer prototype.
 * This never calls Game.update, mutates saves, simulates damage, spawns a
 * second world or makes client-authoritative combat decisions. It consumes
 * server state and uses the original renderer's visual structures. Not yet
 * connected to the shipped game or a production server. */
export class ReplicaView {
  readonly game: Game;
  private previousWorld: WorldSnapshot | null = null;
  constructor() {
    this.game = new Game(newSave(), 'visual-replica');
    this.game.persistent = false;
    this.game.cam.z = 1 / VISION_MUL;
  }
  resize(w: number, h: number, dpr: number) { this.game.resize(w,h,dpr); }
  apply(world: WorldSnapshot, pilots: Pilot[], enemies: EnemyView[], pilotId: string, renderTime = world.time): boolean {
    const me=pilots.find(p=>p.id===pilotId);if(!me)return false;
    const g=this.game;
    g.t=renderTime;
    Object.assign(g.player,{x:me.x,y:me.y,a:me.angle,hp:me.hp,shield:me.shield,dead:me.dead});
    g.cam.x=me.x;g.cam.y=me.y;
    g.others=pilots.filter(p=>p.id!==pilotId).map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,a:p.angle,tx:p.x,ty:p.y,ta:p.angle,seen:world.time} satisfies Other));
    if (this.previousWorld !== world) {
    this.previousWorld = world;
    g.enemies=[];
    for(const e of world.enemies) {
      const sp=SPECIES_LIST.findIndex(s=>s.id===e.species);if(sp<0)continue;
      const parts=e.parts.map(p=>({...p,poly:[...p.poly],links:[...p.links]}));
      const byId=new Map(parts.map(p=>[p.id,p]));
      const shields=e.shields.flatMap(s=>{const part=byId.get(s.partId);return part?[{...s,part}]:[];});
      // Renderer reads just this visual projection; no references back to the
      // live server or its mutable entities leave the wire snapshot.
      g.enemies.push({...e,sp,spd:SPECIES_LIST[sp],a:e.angle,S:e.size,parts,shields,
        dist:Math.hypot(e.x-me.x,e.y-me.y),dead:false} as unknown as Enemy);
    }
    const byEnemy=new Map(g.enemies.map(e=>[e.id,e]));
    g.bullets=world.bullets.map(b=>({...b} as unknown as Bullet));
    g.eprojs=world.enemyProjectiles.map(p=>({...p,r:p.radius,src:p.srcId===undefined?null:byEnemy.get(p.srcId)??null} as unknown as EProj));
    g.puddles=world.puddles.map(p=>({...p,r:p.radius} as unknown as Puddle));
    g.rings=world.rings.map(r=>({...r,r:r.radius} as unknown as Ring));
    }
    const positions = new Map(enemies.map(e=>[e.id,e]));
    for (const e of g.enemies) {
      const pos=positions.get(e.id); if (!pos) continue;
      e.x=pos.x; e.y=pos.y; e.a=pos.angle; e.dist=Math.hypot(e.x-me.x,e.y-me.y);
    }
    return true;
  }
}
