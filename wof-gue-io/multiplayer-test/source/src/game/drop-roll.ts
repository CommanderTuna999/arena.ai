import { COMMON_CORE_RATE, COMMON_UNCOMMON_RATE, KIND_DROP_RATE, type PartKind } from './data';

/** Roll the existing component rules. RNG is injectable for deterministic
 * tests and independent per-player server rolls. Preserve single-player order
 * and salvage multipliers, including the boss and Ultra overrides. */
export function rollComponentTiers(tier: number, kind: PartKind, boss: boolean, dropChance: number, multiplier = 1, rng: () => number = Math.random): number[] {
  const core = kind === 'core';
  if (tier === 6) return rng() < (core ? 0.10 : 0.02) ? [5, 6] : [5];
  let chance: number, resultTier: number;
  if (boss) { chance = 1; resultTier = 5; }
  else if (core) { chance = (tier === 0 ? COMMON_CORE_RATE : KIND_DROP_RATE.core) * dropChance * multiplier; resultTier = tier; }
  else if (tier === 0 && rng() < COMMON_UNCOMMON_RATE * dropChance * multiplier) { chance = 1; resultTier = 1; }
  else { chance = KIND_DROP_RATE[kind] * dropChance * multiplier; resultTier = tier; }
  return rng() <= chance ? [resultTier] : [];
}
