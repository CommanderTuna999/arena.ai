import { COMMON_CORE_RATE, COMMON_UNCOMMON_RATE, KIND_DROP_RATE, type PartKind } from './data';

/** Ultra rolls are independent of ordinary salvage bonuses. */
export const ULTRA_CORE_RATE = 0.10;
export const ULTRA_PART_RATE = 0.02;

/** Base probabilities per eligible part, before salvage upgrades. */
export function baseComponentRates(tier:number, kind:PartKind, boss:boolean): {tier:number; chance:number}[] {
 if (tier===6) return [{tier:5,chance:1},{tier:6,chance:kind==='core'?ULTRA_CORE_RATE:ULTRA_PART_RATE}];
 if (boss) return [{tier:5,chance:1}];
 if (tier===0 && kind==='core') return [{tier:0,chance:COMMON_CORE_RATE}];
 if (tier===0) return [{tier:0,chance:(1-COMMON_UNCOMMON_RATE)*KIND_DROP_RATE[kind]},{tier:1,chance:COMMON_UNCOMMON_RATE}];
 return [{tier,chance:KIND_DROP_RATE[kind]}];
}

/** Roll the existing component rules. RNG is injectable for deterministic
 * tests and independent per-player server rolls. Preserve single-player order
 * and salvage multipliers, including the boss and Ultra overrides. */
export function rollComponentTiers(tier: number, kind: PartKind, boss: boolean, dropChance: number, multiplier = 1, rng: () => number = Math.random): number[] {
  const core = kind === 'core';
  if (tier === 6) return rng() < (core ? ULTRA_CORE_RATE : ULTRA_PART_RATE) ? [5, 6] : [5];
  let chance: number, resultTier: number;
  if (boss) { chance = 1; resultTier = 5; }
  else if (core) { chance = (tier === 0 ? COMMON_CORE_RATE : KIND_DROP_RATE.core) * dropChance * multiplier; resultTier = tier; }
  else if (tier === 0 && rng() < COMMON_UNCOMMON_RATE * dropChance * multiplier) { chance = 1; resultTier = 1; }
  else { chance = KIND_DROP_RATE[kind] * dropChance * multiplier; resultTier = tier; }
  return rng() <= chance ? [resultTier] : [];
}
