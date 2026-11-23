/** Round, layered kinetic projectiles. Draw with solid shapes rather than
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
  const radius = b.crit ? 5.5 : 4.5;
  ctx.shadowBlur = 8;
  ctx.shadowColor = b.crit ? '#ffe777' : '#ffb22f';
  ctx.fillStyle = b.crit ? '#ffe875' : '#f5a623';
  ctx.beginPath(); ctx.arc(b.x, b.y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = b.crit ? '#fffbe3' : '#ffe6a0';
  ctx.beginPath(); ctx.arc(b.x-radius*.24, b.y-radius*.27, radius*.48, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(b.x-radius*.32, b.y-radius*.36, radius*.16, 0, Math.PI * 2); ctx.fill();
}
