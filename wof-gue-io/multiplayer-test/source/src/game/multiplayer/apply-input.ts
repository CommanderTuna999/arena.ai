import type { Game } from '../engine';
import type { PlayerInput } from './input';

/** Translate a validated server input to the existing player controls.
 * Never accepts coordinates, damage, health or equipment from the frame.
 * This adapter is not connected to the live game yet. */
export function applyPlayerInput(game: Game, input: Readonly<PlayerInput>): void {
  const keys = game.input.keys;
  keys.clear();
  if (input.forward) keys.add('KeyW');
  if (input.backward) keys.add('KeyS');
  if (input.left) keys.add('KeyA');
  if (input.right) keys.add('KeyD');
  if (input.boost) keys.add('ShiftLeft');
  game.input.lmb = input.fire;
  // mouseWorld() uses camera space; choose an aim point relative to the pilot.
  const distance = 1000;
  game.input.mx = game.w / 2 + (game.player.x + Math.cos(input.aim) * distance - game.cam.x) * game.cam.z;
  game.input.my = game.h / 2 + (game.player.y + Math.sin(input.aim) * distance - game.cam.y) * game.cam.z;
}
