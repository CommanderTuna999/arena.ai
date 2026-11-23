/** Scatter energy orbs. Draw with solid shapes rather than
 * allocating gradients per projectile; visual radius does not alter collision. */
export function drawKineticOrb(ctx: CanvasRenderingContext2D, b: {x:number; y:number; crit:boolean; visual?:'scatter-orb'}): void {
  if (b.visual === 'scatter-orb') {
    // Like enemy energy orbs: large translucent coloured shell and luminous
    // centre, without a gradient allocation per pellet or collision changes.
    const radius = b.crit ? 18 : 16;
    ctx.shadowColor = b.crit ? '#ffe36b' : '#ff9d4d'; ctx.shadowBlur = 18;
    ctx.fillStyle = b.crit ? '#ffda55' : '#ff9b39'; ctx.globalAlpha = 0.42;
    ctx.beginPath(); ctx.arc(b.x, b.y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = b.crit ? '#fffde1' : '#fff3d7';
    ctx.beginPath(); ctx.arc(b.x, b.y, radius * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    return;
  }
}
