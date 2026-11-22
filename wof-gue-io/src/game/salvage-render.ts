/** Resolution of the cached salvage image in device pixels per world unit.
 * Oversized pieces are drawn as vectors instead of stretching a small bitmap. */
export function salvageSpriteScale(radius: number, zoom: number, dpr: number): number | null {
  const requested = Math.max(0.125, Math.pow(2, Math.ceil(Math.log2(Math.max(0.001, zoom * dpr)))));
  return radius * 3 * requested + 72 <= 1024 ? requested : null;
}
