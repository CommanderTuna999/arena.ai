import { VISION_MUL } from '../engine';
/** Demo uses the main game's default no-optics zoom. CSS viewport dimensions,
 * not device pixels, determine which world entities can be visible. */
export const MAX_VIEW_DIMENSION = 8192;
export function demoInterestRadius(width: number, height: number): number | null {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > MAX_VIEW_DIMENSION || height > MAX_VIEW_DIMENSION) return null;
  // Cover screen corners plus render culling margin; entity radius is added
  // separately by interest filtering. Keep the client request bounded.
  return Math.ceil(Math.hypot(width, height) * VISION_MUL / 2 + 320);
}
