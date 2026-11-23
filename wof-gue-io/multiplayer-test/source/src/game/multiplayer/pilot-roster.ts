import { Game, type PilotPhaseContext } from '../engine';
import { BASE, CANNONS, CANNON_BY_ID, CANNON_TRACK_BY_ID, computeStats, newSave } from '../data';
import {createChairman} from '../chairman';

// Demo-only free loadouts; never grant or modify a real account's equipment.
export const DEMO_CANNONS = CANNONS.map(c=>c.id);
import { InputBuffer } from './input';
import { applyPlayerInput } from './apply-input';

/** Experimental server-owned collection of pilot phases. This is NOT a complete
 * world server: enemy AI, projectiles, damage attribution, rewards, sessions,
 * snapshots and persistence still need multiplayer integration. It is not
 * exposed to production traffic. IDs and saved equipment must eventually come
 * from authenticated server sessions, never from untrusted input frames. */
export class PilotRoster {
  private readonly pilots = new Map<string, PilotPhaseContext>();
  private readonly inputs = new InputBuffer();
  constructor(private readonly world: Game, readonly capacity = 64) {
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 1024) throw new Error('Invalid pilot capacity');
  }
  get size() { return this.pilots.size; }
  add(id: string, verifiedName = 'Pilot'): boolean {
    if (!/^[A-Za-z0-9_.-]{1,32}$/.test(verifiedName) || !id || this.pilots.has(id) || this.pilots.size >= this.capacity) return false;
    // Test/default ship only. This does not accept a client-submitted save.
    const save = newSave(); save.name = verifiedName;
    // Free level-one shield for the disposable demo only, not a real upgrade.
    save.upgrades.shield = 1;
    save.cannon.owned=DEMO_CANNONS.slice();
    const pilot = new Game(save, id);
    this.pilots.set(id, pilot.pilotPhaseContext());
    return true;
  }
  equipDemoCannon(id: string, cannon: unknown): boolean {
    const pilot=this.pilots.get(id);
    if(!pilot || typeof cannon!=='string' || !DEMO_CANNONS.includes(cannon) || pilot.player.dead || Math.hypot(pilot.player.x-BASE.x,pilot.player.y-BASE.y)>=BASE.r+40) return false;
    if(pilot.save.cannon.id===cannon) return true;
    // Only a disposable guest save is changed. The selected pilot's stats and
    // weapon timers are isolated; switching cannot bypass a current cooldown.
    pilot.save.cannon.id=cannon;
    pilot.stats=computeStats(pilot.save);
    Object.assign(pilot.player,{heat:0,jam:0,recoil:0,muzzle:0,muzzleFlash:0,fireCd:Math.max(pilot.player.fireCd,.5)});
    pilot.player.barrelRec=[];pilot.player.fenceShots=0;pilot.player.gatSpin=0;pilot.player.gatAngle=0;pilot.player.charge=0;pilot.player.charging=false;
    pilot.revolutionaryScan=null;pilot.chairman=cannon==='chairman'?createChairman():null;
    Object.assign(pilot.weaponState,{fencerCharge:0,fencerDamage:0,fencerCrit:false});
    return true;
  }
  upgradeDemoCannon(id:string,track:unknown,count:unknown,cannon:unknown):boolean {
    const p=this.pilots.get(id);if(!p || p.stats.cannonId!==cannon || p.player.dead || Math.hypot(p.player.x-BASE.x,p.player.y-BASE.y)>=BASE.r+40 || typeof track!=='string' || !Number.isSafeInteger(count) || (count as number)<1 || (count as number)>30)return false;
    const gun=CANNON_BY_ID[p.stats.cannonId],t=CANNON_TRACK_BY_ID[track];if(!gun || !t || !gun.tracks.includes(t.id))return false;
    const levels=p.save.cannon.lv[gun.id] ??= {};levels[track]=Math.min(t.max,(levels[track]??0)+(count as number));p.stats=computeStats(p.save);return true;
  }
  remove(id: string): boolean { this.inputs.remove(id); return this.pilots.delete(id); }
  receive(id: string, frame: unknown, nowMs: number): boolean {
    return this.pilots.has(id) && this.inputs.receive(id, frame, nowMs);
  }
  /** Internal diagnostic, never an acknowledgement that a frame was applied. */
  receivedSequence(id: string): number { return this.inputs.receivedSequence(id); }
  /** Read-only by convention; intended for the server's future snapshot code,
   * never serialize the save, inputs, or live references to clients. */
  get(id: string): PilotPhaseContext | undefined { return this.pilots.get(id); }
  /** Internal simulation contexts, not a network snapshot. */
  contexts(): readonly PilotPhaseContext[] { return [...this.pilots.values()]; }
  /** Fresh, deliberately minimal public state. No save data or live references
   * leave the simulation, and sequence lets clients reconcile their inputs. */
  snapshot() {
    return Array.from(this.pilots, ([id, pilot]) => ({
      id, name: pilot.save.name || 'Pilot', x: pilot.player.x, y: pilot.player.y,
      angle: pilot.player.a, hp: pilot.player.hp, hpMax:pilot.stats.hull, shield: pilot.player.shield, shieldMax:pilot.stats.shieldMax,
      dead: pilot.player.dead, cannonId:pilot.stats.cannonId, levels:structuredClone(pilot.save.cannon.lv), heat:pilot.player.heat,
      gatAngle:pilot.player.gatAngle, revolutionaryScan:pilot.revolutionaryScan?{parts:[...pilot.revolutionaryScan.parts],elapsed:pilot.revolutionaryScan.elapsed,duration:pilot.revolutionaryScan.duration,enemyId:pilot.revolutionaryScan.enemy.id}:null, chairman:pilot.chairman?{...structuredClone(pilot.chairman),drones:pilot.chairman.drones.map(n=>Number.isFinite(n)?n:1e9)}:null,
      recoil:pilot.player.recoil, jam:pilot.player.jam, muzzleFlash:pilot.player.muzzleFlash, barrelRec:[...pilot.player.barrelRec], inputSequence: this.inputs.sequence(id),
    }));
  }
  step(dt: number, nowMs: number) {
    if (!Number.isFinite(dt) || dt <= 0 || dt > 0.05 || !Number.isFinite(nowMs)) throw new Error('Invalid pilot step');
    for (const [id, pilot] of this.pilots) {
      // World operates temporarily as this pilot so input-to-world aiming uses
      // that pilot's position and camera, then restores the prior context.
      const adapter = { player: pilot.player, cam: pilot.cam, input: pilot.input,
        w: this.world.w, h: this.world.h } as Game;
      const frame = this.inputs.get(id, nowMs);
      const wasFiring=pilot.input.lmb;
      applyPlayerInput(adapter, frame);
      if(frame.fire && !wasFiring)this.world.demoPrimaryPressed(pilot);
      this.world.stepPilotPhase(pilot, dt);
      this.inputs.markApplied(id, frame.seq);
    }
  }
}
