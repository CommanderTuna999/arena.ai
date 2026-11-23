import {applyDemoCasings} from '../casing-fx';
import { Game, VISION_MUL, type Bullet, type EProj, type Enemy, type Other, type Puddle, type Ring } from '../engine';
import { computeStats, newSave } from '../data';
import { DEMO_CANNONS } from './pilot-roster';
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
  private cannonKey="";
  constructor() {
    this.game = new Game(newSave(), 'visual-replica');
    this.game.persistent = false;
    this.game.cam.z = 1 / VISION_MUL;
  }
  resize(w: number, h: number, dpr: number) { this.game.resize(w,h,dpr); }
  apply(world: WorldSnapshot, pilots: Pilot[], enemies: EnemyView[], pilotId: string, renderTime = world.time, projectiles?: { bullets: {id:string|number;x:number;y:number}[]; enemyProjectiles: {id:string|number;x:number;y:number}[] }): boolean {
    const me=pilots.find(p=>p.id===pilotId);if(!me)return false;
    const g=this.game;
    g.t=renderTime;
    // Authoritative cosmetic projection only: never touch a real player save.
    const cannonKey=JSON.stringify([me.cannonId,me.levels,me.shieldMax]);
    if (DEMO_CANNONS.includes(me.cannonId) && this.cannonKey!==cannonKey) {
      this.cannonKey=cannonKey;g.save.upgrades.shield=me.shieldMax>0?1:0;g.save.cannon.id=me.cannonId;
      g.save.cannon.lv=structuredClone(me.levels);g.stats=computeStats(g.save);
    }
    g.player.heat=me.heat;g.player.jam=me.jam;g.player.gatAngle=me.gatAngle;g.player.recoil=me.recoil;g.player.muzzleFlash=me.muzzleFlash;g.player.barrelRec=[...me.barrelRec];
    g.chairman=me.chairman ? structuredClone(me.chairman) : null;
    Object.assign(g.player,{x:me.x,y:me.y,a:me.angle,hp:me.hp,shield:me.shield,dead:me.dead});
    g.cam.x=me.x;g.cam.y=me.y;
    g.others=pilots.filter(p=>p.id!==pilotId).map(p=>({id:p.id,name:p.name,x:p.x,y:p.y,a:p.angle,tx:p.x,ty:p.y,ta:p.angle,seen:world.time,dead:p.dead,cannonId:p.cannonId,gatAngle:p.gatAngle,chairman:p.chairman?structuredClone(p.chairman):null,heat:p.heat,jam:p.jam,recoil:p.recoil,muzzleFlash:p.muzzleFlash,barrelRec:[...p.barrelRec],shield:p.shield,shieldMax:p.shieldMax} satisfies Other));
    if (this.previousWorld !== world) {
    this.previousWorld = world;
    applyDemoCasings(g,world.casings ?? []);
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
    const scan=me.revolutionaryScan,scanEnemy=scan ? g.enemies.find(e=>e.id===scan.enemyId) : undefined;
    g.revolutionaryScan=scan&&scanEnemy?{parts:[...scan.parts],elapsed:scan.elapsed,duration:scan.duration,enemy:scanEnemy}:null;
    // Recompute lifetime on every animation frame, not only when a new network
    // snapshot arrives. This is visual only and cannot apply combat damage.
    g.beams=(world.beams ?? []).filter(b=>renderTime>=b.createdAt && renderTime<b.expiresAt)
      .map(b=>({x1:b.x1,y1:b.y1,x2:b.x2,y2:b.y2,color:b.color,width:b.width,mediator:b.mediator,life:Math.min(.12,b.expiresAt-renderTime)}));
    const positions = new Map(enemies.map(e=>[e.id,e]));
    for (const e of g.enemies) {
      const pos=positions.get(e.id); if (!pos) continue;
      e.x=pos.x; e.y=pos.y; e.a=pos.angle; e.dist=Math.hypot(e.x-me.x,e.y-me.y);
    }
    if (projectiles) {
      const bullets = new Map(projectiles.bullets.map(b=>[b.id,b]));
      const shots = new Map(projectiles.enemyProjectiles.map(p=>[p.id,p]));
      for (let i=0;i<world.bullets.length;i++) {
        const position=bullets.get(world.bullets[i].id);
        if (position && g.bullets[i]) {g.bullets[i].x=position.x;g.bullets[i].y=position.y;}
      }
      for (let i=0;i<world.enemyProjectiles.length;i++) {
        const position=shots.get(world.enemyProjectiles[i].id);
        if (position && g.eprojs[i]) {g.eprojs[i].x=position.x;g.eprojs[i].y=position.y;}
      }
    }
    return true;
  }
}
