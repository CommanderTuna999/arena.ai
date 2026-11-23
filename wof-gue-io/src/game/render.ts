import { scanPartIndex, scanHighlight, scanFlashDuration, type TargetScan } from "./target-scan";
import { CHAIRMAN_SHIELD_MAX, chairmanDronePosition, chairmanHaloCenter } from "./chairman";
import { plateHitIntensity } from "./plate-impact";
import { drawCasings } from "./casing-fx";
import { drawShieldImpacts } from "./shield-impact";
import { drawKineticOrb } from "./projectile-render";
import { drawChatBubble } from "./chat-bubble";
import { salvageSpriteScale } from "./salvage-render";
import { MAP_GRID, MAP_CELL, MAP_RADIUS } from "./world";
import { TAU, clamp, fmtNum } from "./math";
import { BASE, CANNON_BY_ID, CANNONS, CAT_NAME, KIND_CAT, RARITIES, SHIP_R, W_SLOTS, WEAPON_RANGE, WEAPON_TINT, WORLD_R } from "./data";
import { N_ROPE, legHealthy, plateGrow, type Enemy, type Game, type LComp } from "./engine";

function bend(e: Enemy, p: { seg: number }) {
  if (!e.bend || p.seg < 0) return 0;
  return e.bend.amp * Math.sin(e.walk * e.bend.speed - p.seg * e.bend.k);
}

function pw(e: Enemy, p: { cx: number; cy: number; g: number; seg: number }): [number, number] {
  let x = p.cx, y = p.cy;
  if (p.g >= 0) {
    const g = e.groups[p.g];
    const c = Math.cos(g.ang), s = Math.sin(g.ang);
    const dx = x - g.px, dy = y - g.py;
    x = g.px + dx * c - dy * s; y = g.py + dx * s + dy * c;
  }
  y += bend(e, p);
  const ca = Math.cos(e.a), sa = Math.sin(e.a);
  return [e.x + x * ca - y * sa, e.y + x * sa + y * ca];
}

function polyPath(ctx: CanvasRenderingContext2D, poly: number[]) {
  ctx.beginPath();
  ctx.moveTo(poly[0], poly[1]);
  for (let i = 2; i < poly.length; i += 2) ctx.lineTo(poly[i], poly[i + 1]);
  ctx.closePath();
}
function hexPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = rot + (i / 6) * TAU;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Paint only visible blocked tiles and their exposed collision edges. The map
 * itself remains unchanged: the glowing rim is exactly on the walkable boundary. */
export function drawBarrierTerrain(ctx: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number, z: number, t: number) {
  const edges: [number, number, number, number][] = [];
  ctx.save();
  ctx.fillStyle = "#210a12";
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (MAP_GRID[y][x] !== "0") continue;
    const left = x * MAP_CELL - MAP_RADIUS, top = y * MAP_CELL - MAP_RADIUS;
    const right = left + MAP_CELL, bottom = top + MAP_CELL;
    ctx.fillRect(left, top, MAP_CELL + 1, MAP_CELL + 1);
    if (MAP_GRID[y - 1]?.[x] === "1") edges.push([left, top, right, top]);
    if (MAP_GRID[y + 1]?.[x] === "1") edges.push([left, bottom, right, bottom]);
    if (MAP_GRID[y]?.[x - 1] === "1") edges.push([left, top, left, bottom]);
    if (MAP_GRID[y]?.[x + 1] === "1") edges.push([right, top, right, bottom]);
  }
  if (edges.length) {
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of edges) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    // Layered strokes avoid expensive per-tile blur and scale consistently on screen.
    const pulse = 0.8 + 0.2 * Math.sin(t * 1.7);
    ctx.strokeStyle = `rgba(255, 30, 55, ${0.15 * pulse})`; ctx.lineWidth = 22 / z; ctx.stroke();
    ctx.strokeStyle = `rgba(255, 45, 62, ${0.38 * pulse})`; ctx.lineWidth = 9 / z; ctx.stroke();
    ctx.strokeStyle = `rgba(255, 130, 135, ${0.9 * pulse})`; ctx.lineWidth = 2.5 / z; ctx.stroke();
  }
  ctx.restore();
}

export function render(g: Game, ctx: CanvasRenderingContext2D) {
  const { w, h, dpr, cam } = g;
  const z = cam.z;
  const t = g.t;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#04050c";
  ctx.fillRect(0, 0, w, h);

  const sx = (Math.random() - 0.5) * g.shake, sy = (Math.random() - 0.5) * g.shake;
  const cx = cam.x + sx, cy = cam.y + sy;
  ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (w / 2 - cx * z), dpr * (h / 2 - cy * z));
  const vx0 = cx - w / 2 / z - 120, vx1 = cx + w / 2 / z + 120, vy0 = cy - h / 2 / z - 120, vy1 = cy + h / 2 / z + 120;
  const hue = g.tintHue;

  /* ---- grid ---- */
  ctx.lineWidth = 1 / z;
  if (z > 0.22) {
    ctx.strokeStyle = `hsla(${hue},100%,60%,0.08)`;
    ctx.beginPath();
    for (let x = Math.floor(vx0 / 100) * 100; x < vx1; x += 100) { if (x % 500 === 0) continue; ctx.moveTo(x, vy0); ctx.lineTo(x, vy1); }
    for (let y = Math.floor(vy0 / 100) * 100; y < vy1; y += 100) { if (y % 500 === 0) continue; ctx.moveTo(vx0, y); ctx.lineTo(vx1, y); }
    ctx.stroke();
  }
  ctx.strokeStyle = `hsla(${hue},100%,62%,0.22)`;
  ctx.lineWidth = 1.6 / z;
  ctx.beginPath();
  for (let x = Math.floor(vx0 / 500) * 500; x < vx1; x += 500) { ctx.moveTo(x, vy0); ctx.lineTo(x, vy1); }
  for (let y = Math.floor(vy0 / 500) * 500; y < vy1; y += 500) { ctx.moveTo(vx0, y); ctx.lineTo(vx1, y); }
  ctx.stroke();

  // The barrier follows the same tile boundaries used by collision.
  const x0 = Math.max(0, Math.floor((vx0 + MAP_RADIUS) / MAP_CELL));
  const x1 = Math.min(MAP_GRID.length - 1, Math.floor((vx1 + MAP_RADIUS) / MAP_CELL));
  const y0 = Math.max(0, Math.floor((vy0 + MAP_RADIUS) / MAP_CELL));
  const y1 = Math.min(MAP_GRID.length - 1, Math.floor((vy1 + MAP_RADIUS) / MAP_CELL));
  drawBarrierTerrain(ctx, x0, x1, y0, y1, z, t);
  ctx.strokeStyle = "#ff3d73"; ctx.lineWidth = 4 / z;
  ctx.strokeRect(-MAP_RADIUS, -MAP_RADIUS, MAP_RADIUS * 2, MAP_RADIUS * 2);

  drawBase(g, ctx, z, t);

  /* ---- weapon range overlay (settings → showRanges) ---- */
  if (g.save.showRanges && !g.player.dead) {
    const px = g.player.x, py = g.player.y;
    const seen = new Set<string>();
    for (const w of g.stats.weapons) {
      if (!w.rid || seen.has(w.rid)) continue;
      seen.add(w.rid);
      const rr = WEAPON_RANGE[w.rid] ?? 600;
      const col = WEAPON_TINT[w.rid] ?? "#7df9ff";
      ctx.fillStyle = col + "0d";
      ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill();
      ctx.strokeStyle = col + "59";
      ctx.lineWidth = 1.6 / z;
      ctx.setLineDash([16 / z, 14 / z]);
      ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* ---- puddles & spider-web zones ---- */
  for (const q of g.puddles) {
    if (q.x + q.r < vx0 || q.x - q.r > vx1 || q.y + q.r < vy0 || q.y - q.r > vy1) continue;
    if (q.web) {
      /* a landed spider web: a translucent silken sheet with radial strands
       * and a sticky overlay, expanding as it forms */
      const grow = q.arm > 0 ? 0.3 : clamp(q.life / 1.5, 0, 1);
      const a = clamp(grow, 0, 1);
      ctx.globalAlpha = 0.5 * a;
      ctx.fillStyle = `hsla(${q.hue},60%,96%,${0.5 * a})`;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r * a, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = `hsla(${q.hue},70%,80%,${0.7 * a})`;
      ctx.lineWidth = 1.4 / z;
      /* radial strands from the centre out to the rim */
      const strands = 12;
      for (let k = 0; k < strands; k++) {
        const ang = (k / strands) * TAU + t * 0.15;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x + Math.cos(ang) * q.r * a, q.y + Math.sin(ang) * q.r * a);
        ctx.stroke();
      }
      /* concentric silk rings */
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath(); ctx.arc(q.x, q.y, (q.r * a) * (k / 3), 0, TAU); ctx.stroke();
      }
      /* a sticky pulsing glow to signal the slow + poison */
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 4);
      ctx.strokeStyle = `hsla(${q.hue},90%,65%,1)`;
      ctx.lineWidth = 3 / z;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r * a, 0, TAU); ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }
    if (q.arm > 0) {
      ctx.strokeStyle = `hsla(${q.hue},100%,60%,${0.4 + 0.3 * Math.sin(t * 20)})`;
      ctx.lineWidth = 2 / z; ctx.setLineDash([10 / z, 8 / z]);
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    } else {
      const a = clamp(q.life / 1.2, 0, 1);
      const gr = ctx.createRadialGradient(q.x, q.y, q.r * 0.1, q.x, q.y, q.r);
      gr.addColorStop(0, `hsla(${q.hue},100%,60%,${0.1 * a})`);
      gr.addColorStop(1, `hsla(${q.hue},100%,55%,${0.34 * a})`);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = `hsla(${q.hue},100%,65%,${0.7 * a})`;
      ctx.lineWidth = 2 / z; ctx.stroke();
    }
  }

  /* ---- gravity wells ---- */
  for (const wl of g.wells) {
    const f = clamp(wl.life / wl.max, 0, 1);
    const gr = ctx.createRadialGradient(wl.x, wl.y, 4, wl.x, wl.y, wl.r);
    gr.addColorStop(0, `rgba(196,92,255,${0.35 * f})`);
    gr.addColorStop(0.6, `rgba(120,40,220,${0.12 * f})`);
    gr.addColorStop(1, "rgba(20,0,40,0)");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(wl.x, wl.y, wl.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(196,92,255,${0.8 * f})`; ctx.lineWidth = 3 / z;
    ctx.setLineDash([14 / z, 10 / z]); ctx.lineDashOffset = -t * 60 / z;
    ctx.beginPath(); ctx.arc(wl.x, wl.y, wl.r * (0.4 + 0.6 * (1 - f)), 0, TAU); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    for (let k = 0; k < 5; k++) {
      const a = t * 2.4 + (k / 5) * TAU;
      const rr = wl.r * (0.25 + 0.65 * ((t * 0.5 + k / 5) % 1));
      ctx.strokeStyle = `rgba(220,150,255,${0.5 * f})`; ctx.lineWidth = 2 / z;
      ctx.beginPath(); ctx.moveTo(wl.x + Math.cos(a) * rr, wl.y + Math.sin(a) * rr); ctx.lineTo(wl.x + Math.cos(a) * (rr + 26), wl.y + Math.sin(a) * (rr + 26)); ctx.stroke();
    }
  }

  /* ---- loose components ---- */
  const hoveredComp = g.save.showCompInfo && !g.player.dead ? g.compUnderCursor() : null;
  for (const c of g.comps) {
    if (c.x + c.r < vx0 || c.x - c.r > vx1 || c.y + c.r < vy0 || c.y - c.r > vy1) continue;
    drawComp(g, ctx, c, z, t);
    if (c === hoveredComp) {
      ctx.strokeStyle = RARITIES[c.c.tier].color;
      ctx.lineWidth = 2.2 / z;
      ctx.setLineDash([7 / z, 6 / z]);
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 10, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // These components have already been awarded; their flight is cosmetic only.
  for (const flight of g.magnetFlights) {
    const c = flight.comp;
    if (c.x + c.r < vx0 || c.x - c.r > vx1 || c.y + c.r < vy0 || c.y - c.r > vy1) continue;
    drawComp(g, ctx, c, z, t);
    ctx.strokeStyle = `rgba(255,225,77,${0.3 * flight.life / flight.max})`;
    ctx.lineWidth = 1.2 / z; ctx.setLineDash([8 / z, 10 / z]); ctx.lineDashOffset = -t * 40 / z;
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(g.player.x, g.player.y); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
  }

  /* credit coins are HUD animation; see drawCreditFlights() */

  /* ---- magnet field ---- */
  if (g.stats.magnet > 0) {
    ctx.strokeStyle = "rgba(255,225,77,0.05)"; ctx.lineWidth = 1 / z;
    ctx.beginPath(); ctx.arc(g.player.x, g.player.y, g.stats.magnetRange, 0, TAU); ctx.stroke();
  }

  /* ---- mines ---- */
  for (const m of g.mines) {
    const armed = m.arm <= 0;
    const pulse = 0.5 + 0.5 * Math.sin(t * (armed ? 9 : 4) + m.x);
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(t * 0.8);
    hexPath(ctx, 0, 0, 11, 0);
    ctx.fillStyle = armed ? "rgba(255,120,60,0.35)" : "rgba(120,120,120,0.25)"; ctx.fill();
    ctx.strokeStyle = armed ? `rgba(255,170,80,${0.5 + 0.5 * pulse})` : "rgba(160,160,160,0.5)";
    ctx.lineWidth = 2 / z; ctx.shadowColor = "#ffb04d"; ctx.shadowBlur = armed ? 12 : 0;
    ctx.stroke(); ctx.shadowBlur = 0;
    ctx.restore();
    if (armed) { ctx.strokeStyle = `rgba(255,140,80,${0.16 + 0.1 * pulse})`; ctx.lineWidth = 1 / z; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.stroke(); }
  }

  /* ---- ropes (under ship, over comps) ---- */
  for (const hp of g.harpoons) if (hp.state !== 0) drawRope(g, ctx, hp, z);

  /* ---- enemies ---- */
  for (const e of g.enemies) {
    if (e.x + e.radius < vx0 || e.x - e.radius > vx1 || e.y + e.radius < vy0 || e.y - e.radius > vy1) continue;
    drawEnemy(g, ctx, e, z, t);
  }

  /* ---- open domains: the moth's dark moon arena (a JJK-style void) ---- */
  for (const e of g.enemies) {
    if (e.domainT <= 0) continue;
    const phase = clamp(1 - e.domainT / (e.act?.def.dur ?? 180), 0, 1);
    const R = e.radius * (2.4 + phase * 3.0);
    ctx.save();
    /* a black void: the world inside the domain is swallowed into a deep
     * purple-black disc, so the player feels the arena close off around them */
    ctx.fillStyle = `hsla(${e.spd.hue},70%,7%,${0.82 + 0.12 * phase})`;
    ctx.beginPath(); ctx.arc(e.x, e.y, R, 0, TAU); ctx.fill();
    /* a pulsing glowing rim at the domain's edge */
    ctx.strokeStyle = `hsla(${e.spd.hue},100%,62%,${0.45 + 0.45 * phase})`;
    ctx.lineWidth = 6 / z; ctx.shadowColor = `hsl(${e.spd.hue} 100% 65%)`; ctx.shadowBlur = 26;
    ctx.beginPath(); ctx.arc(e.x, e.y, R, 0, TAU); ctx.stroke();
    ctx.shadowBlur = 0;
    /* the moon: a huge glowing orb with a watchful face, swelling with the
     * phase - it is the domain's heart and it is always watching */
    const mr = e.radius * (1.1 + phase * 1.5);
    const my = e.y - e.radius * (2.4 + phase * 1.8);
    const mg = ctx.createRadialGradient(e.x, my, mr * 0.1, e.x, my, mr * 1.15);
    mg.addColorStop(0, `hsla(${e.spd.hue},100%,86%,${0.95})`);
    mg.addColorStop(0.55, `hsla(${e.spd.hue},90%,58%,${0.7})`);
    mg.addColorStop(0.85, `hsla(${e.spd.hue},80%,34%,${0.5})`);
    mg.addColorStop(1, `hsla(${e.spd.hue},80%,20%,0)`);
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(e.x, my, mr * 1.15, 0, TAU); ctx.fill();
    /* the moon's face: two glowing eyes that open wider as the phase climbs */
    const eyeR = mr * (0.1 + 0.06 * phase);
    const eyeY = my + mr * 0.05;
    const open = 0.4 + 0.6 * phase;
    for (const ex of [-mr * 0.34, mr * 0.34]) {
      ctx.fillStyle = `hsla(${e.spd.hue},100%,92%,${0.95})`;
      ctx.shadowColor = `hsl(${e.spd.hue} 100% 80%)`; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.ellipse(e.x + ex, eyeY, eyeR, eyeR * open, 0, 0, TAU); ctx.fill();
    }
    ctx.shadowBlur = 0;
    /* craters across the moon's face */
    ctx.fillStyle = `hsla(${e.spd.hue},40%,22%,${0.5 + 0.3 * phase})`;
    for (let i = 0; i < 5; i++) {
      const ca = i * 1.25 + 0.4;
      ctx.beginPath(); ctx.arc(e.x + Math.cos(ca) * mr * 0.5, my + Math.sin(ca) * mr * 0.4, mr * (0.12 + 0.04 * i), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---- active beam abilities: persistent rotating lasers ---- */
  for (const e of g.enemies) {
    const a = e.act;
    if (!a || a.def.type !== "beam" || !a.fired) continue;
    const spin = a.spin ?? 0;
    const beamAng = a.beamAng ?? [];
    const n = beamAng.length;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const ang = e.a + (beamAng[i] ?? 0) + spin;
      const bx = e.x + Math.cos(ang) * e.radius * 0.5, by = e.y + Math.sin(ang) * e.radius * 0.5;
      const col = `hsl(${e.spd.hue} 100% 65%)`;
      const ex = bx + Math.cos(ang) * 1100, ey = by + Math.sin(ang) * 1100;
      /* a thick laser: a wide glowing body with a hot white core */
      ctx.strokeStyle = col; ctx.lineWidth = 16 / z;
      ctx.shadowColor = col; ctx.shadowBlur = 40;
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = `hsl(${e.spd.hue} 100% 50%)`; ctx.lineWidth = 22 / z; ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.globalAlpha = 0.95; ctx.shadowBlur = 20;
      ctx.strokeStyle = `hsl(${e.spd.hue} 100% 92%)`; ctx.lineWidth = 5 / z;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      /* a bright muzzle node where each beam originates */
      ctx.globalAlpha = 1; ctx.shadowBlur = 24;
      ctx.fillStyle = `hsl(${e.spd.hue} 100% 85%)`;
      ctx.beginPath(); ctx.arc(bx, by, 10 / z, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---- scorpion tail-sting: the stinger extends and lashes at the ship ---- */
  for (const e of g.enemies) {
    const a = e.act;
    if (!a || a.def.type !== "sting") continue;
    /* the tail uncoils: a venom-glowing stinger needle from the scorpion's
     * rear toward the player, extending through the wind-up then snapping in */
    const prog = a.ph === 0 ? a.t / Math.max(0.001, a.def.wind) : 1;
    const reach = SHIP_R + 60 + 340 * clamp(prog, 0, 1);
    const ang = Math.atan2(g.player.y - e.y, g.player.x - e.x);
    const tx = e.x + Math.cos(ang + Math.PI) * e.radius * 0.6;
    const ty = e.y + Math.sin(ang + Math.PI) * e.radius * 0.6;
    const ex = tx + Math.cos(ang) * reach, ey = ty + Math.sin(ang) * reach;
    ctx.save();
    ctx.strokeStyle = `rgba(190,255,120,${0.55 + 0.35 * Math.sin(t * 40)})`;
    ctx.shadowColor = "rgba(190,255,120,0.95)"; ctx.shadowBlur = 18;
    ctx.lineWidth = 6 / z; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(ex, ey); ctx.stroke();
    /* the venom drop at the tip */
    ctx.fillStyle = "rgba(160,255,90,0.95)";
    ctx.beginPath(); ctx.arc(ex, ey, 7 / z, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // The grab sting connects to the living stinger itself, rather than
  // appearing as an unrelated line from the middle of the scorpion.
  for (const e of g.enemies) {
    const a = e.act;
    if (e.spd.id !== "scorpion" || e.tier < 3 || a?.def.type !== "grab" || a.ph !== 1 || a.t < 0.6 || a.t > 0.95 || g.player.pull?.e !== e) continue;
    const stinger = e.parts.find(p => p.name === "Stinger" && p.alive);
    if (!stinger) continue;
    const [sx, sy] = pw(e, stinger);
    ctx.save(); ctx.strokeStyle = "rgba(190,255,120,0.9)"; ctx.lineWidth = Math.max(3 / z, e.S * 0.08);
    ctx.lineCap = "round"; ctx.shadowColor = "#baff78"; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(g.player.x, g.player.y); ctx.stroke(); ctx.restore();
  }

  /* ---- debris ---- */
  for (const d of g.debris) {
    ctx.save();
    ctx.translate(d.x, d.y); ctx.rotate(d.rot);
    ctx.globalAlpha = clamp(d.life / d.max + 0.1, 0, 1);
    ctx.lineWidth = 1.6 / z; ctx.lineJoin = "round";
    for (const pc of d.pieces) { polyPath(ctx, pc.poly); ctx.fillStyle = pc.fill; ctx.fill(); ctx.strokeStyle = pc.stroke; ctx.stroke(); }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  /* ---- pull / grab tether ---- */
  const pl = g.player;
  if (pl.pull) {
    /* a grabbed ship is pinned: a thick glowing tether down the middle with a
     * pulsing core, so the hold reads as a real restraint rather than a thin
     * line. Hooks keep the dashed pull look. */
    const pinned = pl.pull.e.act?.def.type === "grab" && pl.pull.e.act?.ph === 1;
    const tether = pl.pull.e.x - pl.x, tetherY = pl.pull.e.y - pl.y;
    const tx = Math.hypot(tether, tetherY) || 1;
    if (pinned && (pl.pull.e.spd.id === "scorpion" || pl.pull.e.spd.id === "spider" || pl.pull.e.spd.id === "dragonfly")) {
      // The actual animated pincers or fangs surround the ship; no fake tether.
    } else if (pinned) {
      ctx.strokeStyle = `rgba(255,90,110,0.9)`; ctx.lineWidth = 7 / z;
      ctx.shadowColor = "rgba(255,90,110,0.9)"; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.moveTo(pl.x, pl.y); ctx.lineTo(pl.pull.e.x, pl.pull.e.y); ctx.stroke();
      ctx.strokeStyle = "rgba(255,200,210,0.95)"; ctx.lineWidth = 2 / z; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(pl.x, pl.y); ctx.lineTo(pl.pull.e.x, pl.pull.e.y); ctx.stroke();
      /* restraint rings around the ship */
      ctx.shadowBlur = 0;
      const pulse = 0.5 + 0.5 * Math.sin(t * 16);
      ctx.strokeStyle = `rgba(255,120,140,${0.4 + 0.4 * pulse})`; ctx.lineWidth = 3 / z;
      ctx.beginPath(); ctx.arc(pl.x, pl.y, SHIP_R + 6, 0, TAU); ctx.stroke();

    } else {
      ctx.strokeStyle = "rgba(255,140,80,0.8)"; ctx.lineWidth = 3 / z; ctx.setLineDash([12 / z, 8 / z]);
      ctx.beginPath(); ctx.moveTo(pl.x, pl.y); ctx.lineTo(pl.pull.e.x, pl.pull.e.y); ctx.stroke(); ctx.setLineDash([]);
    }
    void tx;
  }

  /* ---- enemy projectiles ---- */
  for (const pr of g.eprojs) {
    if (pr.x < vx0 || pr.x > vx1 || pr.y < vy0 || pr.y > vy1) continue;
    /* a tethered web trail runs a silken string back to the spider, so the
     * volley reads as a web being cast rather than loose pellets */
    if (pr.tether && pr.src) {
      ctx.strokeStyle = `hsla(${pr.hue},80%,80%,0.7)`;
      ctx.lineWidth = 2 / z; ctx.setLineDash([8 / z, 6 / z]);
      ctx.beginPath(); ctx.moveTo(pr.x, pr.y); ctx.lineTo(pr.src.x, pr.src.y); ctx.stroke(); ctx.setLineDash([]);
    }
    const col = pr.type === "missile" ? `hsl(${pr.hue},100%,68%)` : `hsl(${pr.hue},100%,68%)`;
    ctx.shadowColor = col; ctx.shadowBlur = pr.r * z > 2 ? 12 : 0;
    ctx.fillStyle = col; ctx.strokeStyle = col;
    ctx.lineWidth = 2 / z;
    const ang = Math.atan2(pr.vy, pr.vx);
    switch (pr.type) {
      case "missile": {
        /* a fast purple dart with a streaming trail behind it */
        const tl = Math.min(160, (pr.speed ?? 600) * 0.16);
        ctx.globalAlpha = 0.45; ctx.lineWidth = Math.max(1.5, pr.r * 0.5) / z;
        ctx.beginPath(); ctx.moveTo(pr.x, pr.y); ctx.lineTo(pr.x - Math.cos(ang) * tl, pr.y - Math.sin(ang) * tl); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(pr.r * 1.6, 0); ctx.lineTo(-pr.r, -pr.r * 0.7); ctx.lineTo(-pr.r * 0.4, 0); ctx.lineTo(-pr.r, pr.r * 0.7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(pr.r * 0.5, 0, pr.r * 0.32, 0, TAU); ctx.fill();
        ctx.restore(); break;
      }
      case "orb": case "bolt": {
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, TAU); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r * 0.55, 0, TAU); ctx.fillStyle = "#fff"; ctx.fill(); break;
      }
      case "web": { hexPath(ctx, pr.x, pr.y, pr.r, t * 6); ctx.stroke(); hexPath(ctx, pr.x, pr.y, pr.r * 0.5, -t * 6); ctx.stroke(); break; }
      case "wave": {
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(ang);
        ctx.lineWidth = Math.max(3, pr.r * 0.35) / z * z;
        ctx.beginPath(); ctx.arc(-pr.r * 0.6, 0, pr.r * 1.2, -1.0, 1.0); ctx.stroke();
        ctx.restore(); break;
      }
      case "hook": {
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(0, -7); ctx.lineTo(-8, 0); ctx.lineTo(0, 7); ctx.closePath(); ctx.fill();
        ctx.restore(); break;
      }
      case "glob": {
        const s = pr.r * (1 + 0.15 * Math.sin(t * 18));
        ctx.beginPath(); ctx.arc(pr.x, pr.y, s, 0, TAU); ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1; break;
      }
      case "pellet": {
        /* shotgun slug: fat, soft-edged, visibly slow */
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, TAU); ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r * 0.6, 0, TAU); ctx.fillStyle = "#fff6e0"; ctx.fill(); break;
      }
      case "slug": {
        /* heavy cannon shell: long forged dart with a hot core */
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(pr.r * 2.2, 0); ctx.lineTo(pr.r * 0.4, -pr.r * 0.85); ctx.lineTo(-pr.r * 1.6, -pr.r * 0.5);
        ctx.lineTo(-pr.r * 1.9, 0); ctx.lineTo(-pr.r * 1.6, pr.r * 0.5); ctx.lineTo(pr.r * 0.4, pr.r * 0.85);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#fff1d6";
        ctx.beginPath(); ctx.moveTo(pr.r * 1.7, 0); ctx.lineTo(pr.r * 0.2, -pr.r * 0.32); ctx.lineTo(-pr.r * 1.1, 0); ctx.lineTo(pr.r * 0.2, pr.r * 0.32); ctx.closePath(); ctx.fill();
        ctx.restore(); break;
      }
      case "laser": {
        /* energy lance: a stretched bar of light trailing the shot */
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(ang);
        const L = Math.max(26, pr.r * 7);
        ctx.lineWidth = Math.max(2, pr.r * 1.1);
        ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.globalAlpha = 1; ctx.strokeStyle = "#e8ffff"; ctx.lineWidth = Math.max(1, pr.r * 0.5);
        ctx.beginPath(); ctx.moveTo(-L * 0.9, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, pr.r * 0.7, 0, TAU); ctx.fillStyle = "#ffffff"; ctx.fill();
        ctx.restore(); break;
      }
    }
    ctx.shadowBlur = 0;
  }

  /* ---- base siege shells ---- */
  for (const s of g.baseShots) {
    if (s.x < vx0 || s.x > vx1 || s.y < vy0 || s.y > vy1) continue;
    const ang = Math.atan2(s.vy, s.vx);
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(ang);
    ctx.strokeStyle = "rgba(255,150,70,0.30)"; ctx.lineWidth = 9 / z;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-74, 0); ctx.stroke();
    ctx.strokeStyle = "rgba(255,225,150,0.55)"; ctx.lineWidth = 3 / z;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-96, 0); ctx.stroke();
    ctx.shadowColor = "#ffd24d"; ctx.shadowBlur = 20;
    ctx.fillStyle = "#ffe9a6";
    ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-8, -8); ctx.lineTo(-2, 0); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fffdf2";
    ctx.beginPath(); ctx.arc(4, 0, 4.5, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /* ---- point-defence tracers ---- */
  for (const b of g.baseBolts) {
    if (b.x < vx0 || b.x > vx1 || b.y < vy0 || b.y > vy1) continue;
    const ang = Math.atan2(b.vy, b.vx);
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ang);
    ctx.strokeStyle = "rgba(125,249,255,0.45)"; ctx.lineWidth = 2.5 / z;
    ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-2, 0); ctx.stroke();
    ctx.fillStyle = "#d8feff"; ctx.shadowColor = "#7df9ff"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /* ---- player bullets & beams ---- */
  ctx.lineCap = "round";
  for (const b of g.bullets) {
    if (b.kind === 1 || b.kind === 3 || b.kind === 4) {
      const col = b.kind === 3 ? "#ffd24d" : b.kind === 4 ? "#ff7ad9" : "#ffb04d";
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, -5); ctx.lineTo(-3, 0); ctx.lineTo(-7, 5); ctx.closePath(); ctx.fill();
      if (b.kind === 3) {
        ctx.beginPath(); ctx.arc(-10, 0, 3.5, 0, TAU); ctx.fill();
      }
      if (b.kind === 4) {
        ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-30, 0); ctx.strokeStyle = "#ff7ad9"; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore(); ctx.shadowBlur = 0;
      continue;
    }
    const el = b.elem ?? "kinetic";
    const col = b.crit ? "#ffe14d" : el === "energy" ? "#7df9ff" : el === "corrosive" ? "#9dff6a" : el === "thermal" ? "#ff8ad6" : el === "shock" ? "#c77dff" : el === "explosive" ? "#ff9d4d" : "#ffd24d";
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 10;
    if (el === "corrosive") {
      ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(b.x - b.vx * 0.012, b.y - b.vy * 0.012, 2.4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    } else if (el === "shock") {
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.008 + 4, b.y - b.vy * 0.008 - 4);
      ctx.lineTo(b.x - b.vx * 0.016 - 3, b.y - b.vy * 0.016 + 3);
      ctx.lineTo(b.x - b.vx * 0.026, b.y - b.vy * 0.026);
      ctx.stroke();
    } else if (el === "energy") {
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02); ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(b.x, b.y, 2.2, 0, TAU); ctx.fill();
    } else if (el === "thermal") {
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03); ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.045, b.y - b.vy * 0.045); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (b.boom) {
      /* The Stinger's bolt: a fat round slug with a tail, not a tracer. The tail
       * is drawn as a few tapering segments so it reads as motion smear and stays
       * cheap: no gradients, no per-bullet allocations. */
      const sp = Math.hypot(b.vx, b.vy) || 1;
      const ux = b.vx / sp, uy = b.vy / sp;
      const r = b.crit ? 6.4 : 5.4;
      ctx.lineCap = "round";
      for (let k = 1; k <= 4; k++) {
        const a = 1 - k / 5;
        const seg = 9 + k * 7;
        ctx.globalAlpha = a * 0.55;
        ctx.lineWidth = r * (1.5 - k * 0.26);
        ctx.beginPath();
        ctx.moveTo(b.x - ux * (seg - 8), b.y - uy * (seg - 8));
        ctx.lineTo(b.x - ux * seg, b.y - uy * seg);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = "#fff8d6";
      ctx.beginPath(); ctx.arc(b.x - ux * r * 0.25, b.y - uy * r * 0.25, r * 0.45, 0, TAU); ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "rgba(255,248,214,0.8)";
      ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, TAU); ctx.stroke();
    } else if (b.visual === "scatter-orb") {
      drawKineticOrb(ctx, b);
    } else {
      ctx.lineWidth = (b.crit ? 4 : 3);
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.022, b.y - b.vy * 0.022); ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
  for (const bm of g.beams) {
    if (bm.mediator) {
      // Hard-edged concentric rails read as an energy beam, without a blurry glow.
      ctx.save(); ctx.globalAlpha = clamp(bm.life / 0.06, 0, 1); ctx.shadowBlur = 0; ctx.lineCap = "butt";
      const line = (color: string, width: number) => {
        ctx.strokeStyle = color; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
      };
      const width = bm.width ?? 24;
      line("#6e46c8", width * 1.2); line("#c99bff", width * 0.78); line("#f7ecff", width * 0.3);
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(bm.x1, bm.y1, width * 0.38, 0, TAU); ctx.fill();
      ctx.restore(); continue;
    }
    const c = bm.color ?? "#baffff";
    ctx.globalAlpha = clamp(bm.life / 0.12, 0, 1);
    ctx.strokeStyle = c; ctx.lineWidth = bm.width ?? 5; ctx.shadowColor = c; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.shadowBlur = 0;

  // Targeting sweep is cosmetic; the committed shot uses the moving core's
  // current world position. Sweep the living body's full bounds, then flash
  // once over the core just before firing.
  const scan = g.revolutionaryScan;
  if (scan && !scan.enemy.dead) {
    const e = scan.enemy, core = e.parts[e.coreId];
    drawScanHighlights(ctx, e, scan, z);
    const index = scanPartIndex(scan);
    const part = index < 0 ? core : (e.parts[scan.parts[index]] ?? core);
    const [x, y] = pw(e, part);
    const p = g.player, mz = g.stats.muzzles[p.muzzle % g.stats.muzzles.length] ?? {x: 14, y: 0};
    const c = Math.cos(p.a), si = Math.sin(p.a);
    const mx = p.x + c * mz.x - si * mz.y, my = p.y + si * mz.x + c * mz.y;
    const flash = scan.elapsed >= scan.duration - scanFlashDuration(scan);
    ctx.save(); ctx.strokeStyle = flash ? "#ff9ba2" : "#ff3348";
    ctx.globalAlpha = flash ? 0.95 : 0.65; ctx.lineWidth = (flash ? 2.5 : 1) / z;
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = flash ? "#fff0f0" : "#ff3348";
    ctx.beginPath(); ctx.arc(x, y, (flash ? 6 : 2.5) / z, 0, TAU); ctx.fill();
    if (flash) { ctx.strokeStyle = "#ff243a"; ctx.lineWidth = 2 / z; ctx.beginPath(); ctx.arc(x, y, (10 + 5 * (scan.elapsed - (scan.duration - scanFlashDuration(scan))) / scanFlashDuration(scan)) / z, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }

  /* ---- rings ---- */
  for (const r of g.rings) {
    const a = clamp(1 - r.r / r.max, 0, 1);
    ctx.globalAlpha = a;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = (r.hurts ? 10 : 4) / z * (r.hurts ? 1 : 1);
    ctx.shadowColor = r.color; ctx.shadowBlur = r.hurts ? 18 : 8;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;

  /* ---- other players ---- */
  for (const o of g.others) {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a);
    drawShipShape(ctx, "#ff7ad9", 0.85, z, t);
    ctx.restore();
    ctx.fillStyle = "rgba(255,170,230,0.9)";
    ctx.font = `${12 / z}px ui-monospace, monospace`; ctx.textAlign = "center";
    ctx.fillText(o.name, o.x, o.y - 30);
  }

  /* ---- drones ---- */
  if (!pl.dead) {
    for (const d of g.drones) {
      const dx = pl.x + Math.cos(d.a) * d.r, dy = pl.y + Math.sin(d.a) * d.r;
      ctx.save(); ctx.translate(dx, dy); ctx.rotate(d.a + Math.PI / 2);
      ctx.fillStyle = "rgba(125,255,212,0.18)"; ctx.strokeStyle = "#7dffb4"; ctx.lineWidth = 2 / z;
      ctx.shadowColor = "#7dffb4"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, 6); ctx.lineTo(-5, -6); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.restore();
      ctx.strokeStyle = "rgba(125,255,212,0.18)"; ctx.lineWidth = 1 / z;
      ctx.beginPath(); ctx.moveTo(pl.x, pl.y); ctx.lineTo(dx, dy); ctx.stroke();
    }
  }

  /* ---- lock-on ---- */
  if (g.lock) {
    const [lx, ly] = pw(g.lock.e, g.lock.part);
    const r = Math.max(18, g.lock.part.r * 0.9);
    const a = 0.55 + 0.45 * Math.sin(t * 8);
    ctx.strokeStyle = `rgba(255,176,77,${a})`; ctx.lineWidth = 2.5 / z; ctx.shadowColor = "#ffb04d"; ctx.shadowBlur = 12;
    for (let k = 0; k < 4; k++) {
      const an = (k / 4) * TAU + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(lx + Math.cos(an) * r, ly + Math.sin(an) * r);
      ctx.lineTo(lx + Math.cos(an) * (r + 10), ly + Math.sin(an) * (r + 10));
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(lx, ly, r + 4, 0, TAU); ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  /* ---- player ---- */
  if (!pl.dead) { drawPlayer(g, ctx, z, t); if (g.stats.cannonId === "chairman") drawChairman(g, ctx, z, t); }

  /* ---- particles ----
   * Small sparks are point sprites: one fillRect each, no path construction.
   * At far zoom that is the whole effect budget; close-up particles keep their
   * triangles/diamonds/hexes. Styles are cached because a burst shares a colour
   * across dozens of particles, and setting strokeStyle/fillStyle is not free. */
  ctx.lineWidth = 1.5 / z;
  let lastStroke = "", lastFill = "";
  for (const q of g.particles) {
    if (q.x < vx0 || q.x > vx1 || q.y < vy0 || q.y > vy1) continue;
    const a = q.life / q.max;
    if (a <= 0.05) continue;
    const s = q.size * (0.4 + 0.6 * a);
    const screen = s * z;
    ctx.globalAlpha = a;
    if (screen < 2.5 || z < 0.16) {
      const px = Math.max(1, screen);
      if (q.color !== lastFill) { ctx.fillStyle = q.color; lastFill = q.color; }
      ctx.fillRect(q.x - px / 2 / z, q.y - px / 2 / z, px / z, px / z);
      continue;
    }
    if (q.color !== lastStroke) { ctx.strokeStyle = q.color; lastStroke = q.color; }
    if (q.fill && q.color !== lastFill) { ctx.fillStyle = q.color; lastFill = q.color; }
    ctx.beginPath();
    switch (q.shape) {
      case 0: for (let i = 0; i < 3; i++) { const an = q.rot + (i / 3) * TAU; const px = q.x + Math.cos(an) * s, py = q.y + Math.sin(an) * s; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); break;
      case 1: for (let i = 0; i < 4; i++) { const an = q.rot + (i / 4) * TAU + Math.PI / 4; const px = q.x + Math.cos(an) * s, py = q.y + Math.sin(an) * s; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); break;
      case 2: for (let i = 0; i < 6; i++) { const an = q.rot + (i / 6) * TAU; const px = q.x + Math.cos(an) * s, py = q.y + Math.sin(an) * s; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); } ctx.closePath(); break;
      case 3: ctx.moveTo(q.x - Math.cos(q.rot) * s * 1.6, q.y - Math.sin(q.rot) * s * 1.6); ctx.lineTo(q.x + Math.cos(q.rot) * s * 1.6, q.y + Math.sin(q.rot) * s * 1.6); break;
      default: ctx.arc(q.x, q.y, s * 0.7, 0, TAU);
    }
    if (q.shape === 3) ctx.stroke();
    else if (q.fill) { ctx.globalAlpha = a * 0.55; ctx.fill(); ctx.globalAlpha = a; ctx.stroke(); }
    else ctx.stroke();
  }
  ctx.globalAlpha = 1;

  drawCasings(ctx, g, t);

  /* ---- enemy bars (drawn last, in world space) ---- */
  for (const e of g.enemies) {
    if (e.x + e.radius < vx0 || e.x - e.radius > vx1 || e.y + e.radius < vy0 || e.y - e.radius > vy1) continue;
    drawBars(g, ctx, e, z);
  }

  if (!pl.dead) drawChatBubble(ctx, g, pl.x, pl.y, z, w);

  /* ---- screen space HUD in canvas ---- */
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawCreditFlights(g, ctx);
  drawMinimap(g, ctx);
  drawBaseArrow(g, ctx);
  drawUltraHud(g, ctx);
  /* heat vignette: a hot gun bleeds a warm glow in from the edges of the
   * screen, climbing from a faint amber at the mid-ramp to a hard red-orange
   * ring at the top, and a slow pulse when it is jammed and cooling */
  drawHeatVignette(g, ctx);
  // A brief screen-wide red flash accompanies each Revolutionary beam.
  const redFlash = g.beams.reduce((v, b) => b.color === "#ff263b" ? Math.max(v, b.life) : v, 0);
  if (redFlash > 0) { ctx.save(); ctx.globalAlpha = 0.32 * clamp(redFlash / 0.12, 0, 1); ctx.fillStyle = "#ff1024"; ctx.fillRect(0, 0, w, h); ctx.restore(); }

  if (hoveredComp) drawCompTooltip(g, ctx, hoveredComp);
  const sunFlash = g.stats.cannonId === "chairman" ? g.chairman?.flash ?? 0 : 0;
  if (sunFlash > 0) { ctx.save(); ctx.globalAlpha = clamp(sunFlash / .34, 0, 1); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.restore(); }
  drawCutscene(g, ctx);
}

/** Paint actual animated part polygons on top of the body so scanning is
 * visible even through overlapping armour and at low zoom. */
function drawScanHighlights(ctx:CanvasRenderingContext2D,e:Enemy,scan:TargetScan,z:number) {
  ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.a);ctx.lineJoin="round";
  const active=scanPartIndex(scan);
  const ids=active<0?[e.coreId]:scan.parts.slice(Math.max(0,active-3),active+1);
  ids.forEach((id,j)=>{
    const part=e.parts[id];if(!part?.alive)return;
    const index=active<0?-1:Math.max(0,active-3)+j;
    const alpha=active<0?1:scanHighlight(scan,index);
    if(alpha<=0)return;
    ctx.save();const group=part.g>=0?e.groups[part.g]:null;
    if(group && group.ang!==0){ctx.translate(group.px,group.py);ctx.rotate(group.ang);ctx.translate(-group.px,-group.py);}
    const bo=bend(e,part);if(bo)ctx.translate(0,bo);
    polyPath(ctx,part.poly);ctx.fillStyle=`rgba(255,24,46,${.36*alpha})`;ctx.fill();
    ctx.strokeStyle=`rgba(255,90,100,${.95*alpha})`;ctx.lineWidth=2.5/z;ctx.stroke();ctx.restore();
  });
  ctx.restore();
}

/** Chairman: orbiting drone turrets and a red
 * sun. Effects are bounded to the drone cap; no per-frame particles needed. */
function drawChairman(g:Game, ctx:CanvasRenderingContext2D, z:number, t:number) {
  const s=g.chairman, p=g.player; if(!s)return;
  const charge=clamp(s.charge,0,1), n=s.drones.length;
  const points=s.drones.map((_,i)=>chairmanDronePosition(s,i,p.x,p.y));
  ctx.save();ctx.lineCap="round";
  // Slim separate meter exposes the dome's finite capacity.
  ctx.fillStyle="rgba(25,0,8,.8)";ctx.fillRect(p.x-35,p.y+62,70,4);
  ctx.fillStyle="#ff344a";ctx.fillRect(p.x-35,p.y+62,70*clamp(s.shield/CHAIRMAN_SHIELD_MAX,0,1),4);
  // A transparent red dome is independent of the player's existing shield.
  if(s.shield>0) {
    const f=clamp(s.shield/CHAIRMAN_SHIELD_MAX,0,1),rad=54;
    ctx.fillStyle=`rgba(255,52,74,${.025+.035*f})`;ctx.beginPath();ctx.arc(p.x,p.y,rad,0,TAU);ctx.fill();
    ctx.strokeStyle=`rgba(255,52,74,${.24+.38*f})`;ctx.lineWidth=2/z;ctx.beginPath();ctx.arc(p.x,p.y,rad,0,TAU);ctx.stroke();
  }
  // The gathered drones form interlocking physical plates, illuminating one
  // at a time as each drone finishes charging. The armour remains until Q.
  if(s.armourActive) {
    const integrity=s.armourMax===Infinity ? (s.armour===Infinity?1:0) : clamp(s.armour/Math.max(1,s.armourMax),0,1);
    for(let i=0;i<n;i++) {
      const a=i*TAU/n-Math.PI/2, half=TAU/n*.47, inner=62, outer=76;
      const ready=s.drones[i]<=0;
      ctx.beginPath();ctx.moveTo(p.x+Math.cos(a-half)*inner,p.y+Math.sin(a-half)*inner);
      ctx.lineTo(p.x+Math.cos(a-half*.78)*outer,p.y+Math.sin(a-half*.78)*outer);
      ctx.lineTo(p.x+Math.cos(a+half*.78)*outer,p.y+Math.sin(a+half*.78)*outer);
      ctx.lineTo(p.x+Math.cos(a+half)*inner,p.y+Math.sin(a+half)*inner);ctx.closePath();
      ctx.fillStyle=integrity>0 ? `rgba(45,10,20,${.3+integrity*.55})` : "rgba(16,12,16,.35)";
      ctx.strokeStyle=ready?"#ff6676":"#71313c";ctx.lineWidth=(ready?2:1)/z;
      if(ready){ctx.shadowColor="#ff344a";ctx.shadowBlur=12;}ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    }
  }
  if(charge>0) for(let i=0;i<n;i++) {
    const [x,y]=points[i];ctx.strokeStyle=`rgba(255,${Math.round(45+charge*150)},${Math.round(55+charge*150)},${.2+charge*.7})`;
    ctx.lineWidth=(1+charge*3)/z;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(p.x,p.y);ctx.stroke();
  }
  if(!s.armourActive) for(let i=0;i<n;i++) {
    const [x,y]=points[i], firing=(s.fireGlow[i] ?? 0)>0, lit=firing || charge>0 || s.drones[i]<=0, pulse=.8+.2*Math.sin(t*5+i);
    if(firing){const glow=ctx.createRadialGradient(x,y,0,x,y,42);glow.addColorStop(0,"rgba(255,255,255,.98)");glow.addColorStop(.2,"rgba(255,115,125,.95)");glow.addColorStop(.5,"rgba(255,35,60,.55)");glow.addColorStop(1,"rgba(255,35,60,0)");ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,42,0,TAU);ctx.fill();}
    const [hx,hy]=chairmanHaloCenter(s,i%3,p.x,p.y);
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(y-hy,x-hx));
    ctx.globalAlpha=lit?1:.35;ctx.fillStyle=lit?"#3f0715":"#190b11";ctx.strokeStyle=lit?"#ff364c":"#74303b";ctx.lineWidth=1.5/z;
    if(lit){ctx.shadowColor="#ff1d42";ctx.shadowBlur=firing?45:10+charge*20;}
    ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(3,-5);ctx.lineTo(-7,-5);ctx.lineTo(-11,0);ctx.lineTo(-7,5);ctx.lineTo(3,5);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;ctx.fillStyle=firing?"#ffffff":lit?`rgba(255,${Math.round(80+charge*150)},${Math.round(90+charge*150)},${pulse})`:"#521520";
    ctx.beginPath();ctx.arc(0,0,3.4,0,TAU);ctx.fill();ctx.restore();
  }
  // The sun shines at full intensity when ready, and dims during reload.
  const sunReady=s.reload<=0;
  const r=22+charge*12;
  const sun=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*2.5);
  sun.addColorStop(0,sunReady?"#fff5ed":"#ef5764");sun.addColorStop(.14,sunReady?"#ff8a80":"#a4152a");sun.addColorStop(.35,"#8d1024");sun.addColorStop(1,"rgba(255,12,48,0)");
  ctx.fillStyle=sun;ctx.beginPath();ctx.arc(p.x,p.y,r*2.5,0,TAU);ctx.fill();
  ctx.fillStyle="#390815";ctx.strokeStyle=`rgba(255,70,85,${.6+charge*.4})`;ctx.lineWidth=2/z;
  ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.stroke();
  for(let i=0;i<10;i++) {const a=i*TAU/10+s.phase*.3;ctx.strokeStyle=`rgba(255,70,80,${.4+charge*.5})`;ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*r*.8,p.y+Math.sin(a)*r*.8);ctx.lineTo(p.x+Math.cos(a)*r*(1.2+charge*.3),p.y+Math.sin(a)*r*(1.2+charge*.3));ctx.stroke();}
  const center=ctx.createRadialGradient(p.x-4,p.y-4,0,p.x,p.y,r*.75);center.addColorStop(0,sunReady?"#fff":"#ff727c");center.addColorStop(.45,sunReady?"#ff6760":"#a7162c");center.addColorStop(1,"#4a0917");ctx.fillStyle=center;ctx.beginPath();ctx.arc(p.x,p.y,r*.75,0,TAU);ctx.fill();
  if(s.scan) {
    const e=g.enemies.find(e=>e.id===s.scan!.enemyId&&!e.dead), drone=points[s.scan.drone];
    if(e && drone) {
      drawScanHighlights(ctx,e,s.scan,z);
      const scanTime=s.scan.duration-scanFlashDuration(s.scan);
      const flash=s.scan.elapsed>=scanTime;
      const index=scanPartIndex(s.scan);
      const q=index<0?e.parts[e.coreId]:e.parts[s.scan.parts[index]];
      if(q){const [x,y]=pw(e,q);ctx.strokeStyle=flash?"#ffe4e4":"#ff3349";ctx.globalAlpha=flash?1:.8;ctx.lineWidth=(flash?2:1)/z;ctx.beginPath();ctx.moveTo(drone[0],drone[1]);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=flash?"#fff":"#ff3349";ctx.beginPath();ctx.arc(x,y,(flash?6:3)/z,0,TAU);ctx.fill();}
    }
  }
  ctx.restore();
}

/** Screen-space Ultra encounter bars and legible black announcements. */
function drawUltraHud(g: Game, ctx: CanvasRenderingContext2D) {
  const z = g.cam.z;
  const visible = g.enemies.filter(e => !e.dead && e.tier === 6 &&
    Math.abs(e.x - g.cam.x) <= g.w / (2 * z) + e.radius &&
    Math.abs(e.y - g.cam.y) <= g.h / (2 * z) + e.radius).slice(0, 3);
  ctx.save(); ctx.textAlign = "center";
  visible.forEach((e, i) => {
    const w = Math.min(620, g.w * 0.7), x = (g.w - w) / 2, y = 24 + i * 80;
    let hull = 0, hullMax = 0, armor = 0, armorMax = 0;
    for (const p of e.parts) {
      if (p.kind === "armor") { armorMax += p.maxHp; if (p.alive) armor += p.hp; }
      else { hullMax += p.maxHp; if (p.alive) hull += p.hp; }
    }
    for (const shell of e.shells) armor += shell.hp;
    armorMax += e.shellMaxTotal;
    const f = clamp(hull / Math.max(1, hullMax), 0, 1), a = clamp(armor / Math.max(1, armorMax), 0, 1);
    ctx.shadowColor = "#a665ff"; ctx.shadowBlur = 12;
    ctx.fillStyle = "#090611"; ctx.strokeStyle = "#d8b4ff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 18, y); ctx.lineTo(x + w - 18, y); ctx.lineTo(x + w, y + 18); ctx.lineTo(x + w - 18, y + 36); ctx.lineTo(x + 18, y + 36); ctx.lineTo(x, y + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.fillStyle = "#51317b"; ctx.fillRect(x + 4, y + 4, (w - 8) * f, 28);
    ctx.strokeStyle = "rgba(216,180,255,.4)"; ctx.lineWidth = 1;
    for (let j = 0; j < 12; j++) { const px = x + (j + 1) * w / 13; ctx.beginPath(); ctx.moveTo(px - 10, y + 34); ctx.lineTo(px + 10, y + 2); ctx.stroke(); }
    ctx.restore(); ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.font = "bold 16px ui-monospace, monospace"; ctx.fillText(e.spd.name.toUpperCase(), x + w / 2, y + 23);
    ctx.fillStyle = "#1b1427"; ctx.fillRect(x + 25, y + 40, w - 50, 7);
    ctx.fillStyle = "#cbb6e7"; ctx.fillRect(x + 25, y + 40, (w - 50) * a, 7);
    ctx.lineWidth = 3; ctx.strokeStyle = "#e0e0e0"; ctx.fillStyle = "#000000"; ctx.font = "bold 14px ui-monospace, monospace";
    ctx.strokeText("ULTRA", x + w / 2, y + 63); ctx.fillText("ULTRA", x + w / 2, y + 63);
  });
  ctx.restore();
}

/** the moth's domain-expansion cutscene: a hard violet flash, a slow push-in
 *  on the moth, and the domain's name streaking across the screen */
function drawCutscene(g: Game, ctx: CanvasRenderingContext2D) {
  const cs = g.cutscene;
  if (!cs) return;
  const k = 1 - cs.t / cs.dur;            /* 0 → 1 across the cutscene */
  const w = g.w, h = g.h;
  ctx.save();
  /* a violet flash that fades, then a slow push-in on the moth */
  ctx.globalAlpha = clamp(1 - k * 1.6, 0, 1) * 0.55;
  ctx.fillStyle = `hsl(${cs.hue} 100% 70%)`;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  /* the domain name, streaking in and holding */
  const inA = clamp(k * 3 - 1, 0, 1);
  const outA = clamp(1 - k * 2.4, 0, 1);
  const a = Math.min(inA, outA);
  ctx.globalAlpha = a;
  ctx.textAlign = "center";
  const fs = Math.round(46 * (g.dpr ?? 1));
  ctx.font = `900 ${fs}px ui-monospace, monospace`;
  ctx.shadowColor = `hsl(${cs.hue} 100% 65%)`; ctx.shadowBlur = 30;
  ctx.fillStyle = `hsl(${cs.hue} 100% 88%)`;
  ctx.fillText("DOMAIN EXPANSION", w / 2, h * 0.42);
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  ctx.restore();
}

/** The cannon's heat, drawn as a screen-edge glow so the player feels the gun
 *  cooking before it jams. Nothing when cold; a warm ring that climbs with the
 *  ramp; a pulsing red-orange when it is jammed and cooling. */
function drawHeatVignette(g: Game, ctx: CanvasRenderingContext2D) {
  const heat = g.player.heat;
  const jam = g.player.jam;
  const overheat = g.stats.overheat;
  /* only a chassis that can actually overheat shows the screen edge: the heat
   * gauge is internal to every gun (it feeds damage and spread), but the
   * vignette is the overheat warning and stays off for guns that never jam */
  if ((overheat || 0) <= 0) return;
  const max = Math.max(0.001, overheat || 1);
  if (heat <= 0.02 && jam <= 0) return;
  const { w, h } = g;
  const edge = Math.max(w, h) * 0.5;
  const cx = w / 2, cy = h / 2;
  const ramp = clamp(heat, 0, 1);
  /* a jammed gun runs hotter than the ramp while it cools, so the vignette
   * stays lit through the whole cool-down */
  const lvl = Math.max(ramp, jam > 0 ? clamp(jam / max, 0, 1) : 0);
  const pulse = jam > 0 ? 0.75 + 0.25 * Math.sin(g.t * 12) : 1;
  const a = (0.12 + 0.55 * lvl) * pulse;
  const grad = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.32, cx, cy, edge);
  const r = Math.round(255), gg = Math.round(150 - 90 * lvl), bb = Math.round(60 - 40 * lvl);
  grad.addColorStop(0, `rgba(${r},${gg},${bb},0)`);
  grad.addColorStop(0.72, `rgba(${r},${gg},${bb},${a * 0.45})`);
  grad.addColorStop(1, `rgba(${r},${Math.round(90 - 40 * lvl)},${Math.round(30 - 20 * lvl)},${a})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/* Credit coins: each one is thrown from the broken part in world space and then
 * arcs across the screen into the HUD counter, paying out when it lands. Drawn
 * in screen space so the coin keeps a constant, crisp size at any zoom. */
function drawCreditFlights(g: Game, ctx: CanvasRenderingContext2D) {
  if (!g.creditDrops.length) return;
  const z = g.cam.z;
  const hx = g.creditHud.x, hy = g.creditHud.y;
  ctx.save();
  for (const c of g.creditDrops) {
    const age = c.max - c.life;
    const p = clamp((age - c.delay) / c.dur, 0, 1);
    const e = p * p * (3 - 2 * p);
    const sx = (c.x - g.cam.x) * z + g.w / 2;
    const sy = (c.y - g.cam.y) * z + g.h / 2;
    const lift = Math.sin(Math.PI * e) * (60 + 40 * Math.min(1, Math.hypot(hx - sx, hy - sy) / 600));
    const x = sx + (hx - sx) * e;
    const y = sy + (hy - sy) * e - lift;
    /* heavier coins start bigger and finish bigger, so a fat break reads at a
     * glance without throwing more chips into the air */
    const weight = 0.72 + 0.46 * Math.min(2.2, Math.log10(1 + c.value));
    const s = (1.05 - 0.25 * e) * weight;
    ctx.globalAlpha = p < 0.1 ? p / 0.1 : 1 - Math.max(0, (p - 0.88) / 0.12) * 0.7;
    /* speed streak behind the coin */
    if (e > 0.12) {
      const e0 = e - 0.07;
      const bx = sx + (hx - sx) * e0;
      const by = sy + (hy - sy) * e0 - Math.sin(Math.PI * e0) * lift;
      ctx.strokeStyle = "rgba(255,210,77,0.28)";
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(x, y); ctx.stroke();
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.rotate(c.spin * 0.35);
    /* neon hexagon chip with a square hole, matching the HUD counter icon */
    const hex = (r: number, rot: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = rot + (i / 6) * TAU;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };
    ctx.fillStyle = "#ffd24d";
    ctx.shadowColor = "#ffd24d"; ctx.shadowBlur = 10;
    hex(5.2, 0); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#05070c";
    ctx.fillRect(-1.5, -1.5, 3, 3);
    ctx.strokeStyle = "rgba(125,249,255,0.95)"; ctx.lineWidth = 0.85;
    hex(5.2, 0); ctx.stroke();
    ctx.strokeStyle = "rgba(255,248,207,0.75)"; ctx.lineWidth = 0.6;
    ctx.strokeRect(-1.5, -1.5, 3, 3);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

/* Hover card for loose components: name, rarity/category, value and mass.
 * Drawn in screen space so the text stays crisp at every zoom level. */
function drawCompTooltip(g: Game, ctx: CanvasRenderingContext2D, c: LComp) {
  const col = c.c.tier === 6 ? "#dddddd" : RARITIES[c.c.tier].color;
  const bw = 216, bh = 84;
  let x = g.input.mx + 18, y = g.input.my + 18;
  if (x + bw > g.w - 8) x = g.input.mx - bw - 18;
  if (y + bh > g.h - 8) y = g.input.my - bh - 18;
  x = clamp(x, 8, Math.max(8, g.w - bw - 8));
  y = clamp(y, 8, Math.max(8, g.h - bh - 8));
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = "rgba(4,6,14,0.94)";
  ctx.fillRect(x, y, bw, bh);
  ctx.strokeStyle = col + "aa"; ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, bw - 1.5, bh - 1.5);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, 3, bh);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 13px ui-monospace, monospace";
  ctx.fillStyle = "#e8fbff";
  ctx.fillText(c.c.name, x + 12, y + 21);
  ctx.font = "10px ui-monospace, monospace";
  ctx.fillStyle = col;
  ctx.fillText(`${RARITIES[c.c.tier].name} · ${CAT_NAME[KIND_CAT[c.c.kind]]}`, x + 12, y + 38);
  ctx.fillStyle = "#ffe14d";
  ctx.fillText(`◈ ${fmtNum(c.c.value)} CR`, x + 12, y + 57);
  ctx.fillStyle = "rgba(200,235,255,0.7)";
  ctx.fillText(`⚖ ${c.c.mass.toFixed(1)}`, x + 112, y + 57);
  ctx.fillStyle = "rgba(200,235,255,0.4)";
  ctx.fillText(c.c.species, x + 12, y + 73);
  ctx.restore();
}

function drawBase(g: Game, ctx: CanvasRenderingContext2D, z: number, t: number) {
  const { x, y, r, dock, safe } = BASE;
  const lost = g.baseLost;
  ctx.setLineDash([24 / z, 24 / z]);
  ctx.strokeStyle = "rgba(90,255,170,0.2)"; ctx.lineWidth = 3 / z;
  ctx.beginPath(); ctx.arc(x, y, safe, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);
  /* siege-cannon reach and the wider defence-alert ring */
  if (!lost && Math.hypot(g.player.x - x, g.player.y - y) < BASE.aggroR * 2.4) {
    ctx.setLineDash([14 / z, 22 / z]);
    ctx.lineDashOffset = -t * 24 / z;
    ctx.strokeStyle = "rgba(255,176,77,0.20)"; ctx.lineWidth = 2.5 / z;
    ctx.beginPath(); ctx.arc(x, y, BASE.turretR, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "rgba(255,107,61,0.10)"; ctx.lineWidth = 1.8 / z;
    ctx.beginPath(); ctx.arc(x, y, BASE.aggroR, 0, TAU); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
  }
  const gr = ctx.createRadialGradient(x, y, 20, x, y, r);
  gr.addColorStop(0, "rgba(40,255,200,0.22)");
  gr.addColorStop(1, "rgba(40,160,255,0.05)");
  hexPath(ctx, x, y, r, Math.PI / 6);
  ctx.fillStyle = gr; ctx.fill();
  ctx.shadowColor = "#4dffd2"; ctx.shadowBlur = 24;
  ctx.strokeStyle = "#4dffd2"; ctx.lineWidth = 5 / z;
  ctx.stroke();
  ctx.shadowBlur = 0;
  hexPath(ctx, x, y, r * 0.78, Math.PI / 6);
  ctx.strokeStyle = "rgba(125,249,255,0.55)"; ctx.lineWidth = 2 / z; ctx.stroke();
  // dock zone
  ctx.setLineDash([18 / z, 14 / z]);
  ctx.lineDashOffset = -t * 30 / z;
  hexPath(ctx, x, y, dock, t * 0.15);
  ctx.strokeStyle = "rgba(255,225,77,0.85)"; ctx.lineWidth = 3 / z; ctx.stroke();
  ctx.setLineDash([]); ctx.lineDashOffset = 0;
  hexPath(ctx, x, y, dock * 0.55, -t * 0.3);
  ctx.strokeStyle = "rgba(255,225,77,0.4)"; ctx.lineWidth = 2 / z; ctx.stroke();
  // six hex pylons, each carrying a small rotating point-defence turret
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i / 6) * TAU;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    const T = g.miniTurrets[i];
    const alive = !lost && (!T || T.alive);
    hexPath(ctx, px, py, 26, t * 0.4 * (i % 2 ? 1 : -1));
    ctx.fillStyle = alive ? "rgba(10,40,50,0.95)" : "rgba(26,12,10,0.95)"; ctx.fill();
    ctx.strokeStyle = alive ? "#7df9ff" : "rgba(255,90,60,0.55)";
    ctx.lineWidth = 3 / z; ctx.stroke();
    if (alive) {
      hexPath(ctx, px, py, 10, 0);
      ctx.fillStyle = "#4dffd2"; ctx.fill();
    } else {
      ctx.strokeStyle = `rgba(255,${110 + 40 * Math.sin(t * 7 + i)},60,0.55)`;
      ctx.lineWidth = 2 / z;
      ctx.beginPath(); ctx.arc(px, py, 8, 0.4, 2.2); ctx.stroke();
    }
    // light spokes
    ctx.strokeStyle = "rgba(125,249,255,0.25)"; ctx.lineWidth = 1.5 / z;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
    if (alive && T) {
      ctx.save();
      ctx.translate(px, py); ctx.rotate(T.a);
      const kick = T.recoil * 5;
      ctx.fillStyle = "#0a1a22"; ctx.strokeStyle = "#9dfcff"; ctx.lineWidth = 2 / z;
      ctx.beginPath();
      ctx.moveTo(7 - kick, -6); ctx.lineTo(34 - kick, -3.2); ctx.lineTo(34 - kick, 3.2); ctx.lineTo(7 - kick, 6); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(255,210,120,0.65)"; ctx.lineWidth = 1.4 / z;
      ctx.beginPath(); ctx.moveTo(10 - kick, 0); ctx.lineTo(31 - kick, 0); ctx.stroke();
      if (T.flash > 0) {
        const f = clamp(T.flash / 0.09, 0, 1);
        ctx.fillStyle = `rgba(190,255,255,${0.8 * f})`;
        ctx.beginPath(); ctx.arc(36 - kick, 0, 5 + 5 * f, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }
  // minimal base sigil: a hex with three cells, no lettering
  hexPath(ctx, x, y, 30, 0);
  ctx.strokeStyle = "rgba(125,249,255,0.85)"; ctx.lineWidth = 3 / z; ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i / 3) * TAU;
    hexPath(ctx, x + Math.cos(a) * 12, y + Math.sin(a) * 12, 6, a);
    ctx.fillStyle = "rgba(255,225,77,0.75)"; ctx.fill();
  }
  if (lost) {
    /* gutted wreck: dark plates, embers, no cannon */
    hexPath(ctx, x, y, r * 0.9, Math.PI / 6);
    ctx.fillStyle = "rgba(20,10,8,0.92)"; ctx.fill();
    ctx.strokeStyle = "rgba(255,90,60,0.55)"; ctx.lineWidth = 4 / z; ctx.stroke();
    ctx.strokeStyle = `rgba(255,120,60,${0.25 + 0.25 * Math.sin(t * 9)})`; ctx.lineWidth = 2 / z;
    for (let i = 0; i < 7; i++) {
      const a = i * 2.3 + 0.4, r0 = r * 0.18, r1 = r * (0.5 + (i % 3) * 0.16);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
      ctx.lineTo(x + Math.cos(a + 0.22) * r1, y + Math.sin(a + 0.22) * r1);
      ctx.lineTo(x + Math.cos(a + 0.1) * r1 * 0.8, y + Math.sin(a + 0.1) * r1 * 0.8);
      ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const a = t * 1.4 + i * 1.7;
      ctx.fillStyle = `rgba(255,${120 + i * 15},60,${0.25 + 0.3 * Math.abs(Math.sin(t * 3 + i))})`;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, 3 + (i % 2) * 2, 0, TAU); ctx.fill();
    }
  } else {
    drawTurret(g, ctx, z, t, x, y);
    /* integrity ring: full teal → amber → red */
    const frac = clamp(g.baseHp / Math.max(1, g.baseMaxHp), 0, 1);
    const col = frac > 0.5 ? "#4dffd2" : frac > 0.25 ? "#ffd24d" : "#ff4d6d";
    ctx.lineWidth = 9 / z;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.arc(x, y, r + 20, 0, TAU); ctx.stroke();
    ctx.strokeStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r + 20, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.stroke();
    if (g.baseFlash > 0) {
      ctx.globalAlpha = clamp(g.baseFlash / 0.22, 0, 1) * 0.45;
      ctx.fillStyle = "#ff9d6e";
      hexPath(ctx, x, y, r, Math.PI / 6); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  void g;
}

/* Heavy siege cannon on the base. The barrel physically kicks back on every
 * shot, the mount glows hotter as it charges, and the muzzle flash is huge. */
function drawTurret(g: Game, ctx: CanvasRenderingContext2D, z: number, t: number, x: number, y: number) {
  const T = g.turret;
  const powered = !g.baseLost && g.basePowerT > 0;
  const online = powered && !!T.target;
  const recoil = T.recoil * 36;
  const charge = online ? clamp(1 - T.cd / 7, 0, 1) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(T.a);
  ctx.globalAlpha = powered ? (online ? 1 : 0.6) : 0.26;
  // shadow / mount
  ctx.fillStyle = "rgba(4,10,16,0.95)";
  hexPath(ctx, 0, 0, 46, 0); ctx.fill();
  ctx.strokeStyle = "rgba(125,249,255,0.7)"; ctx.lineWidth = 3 / z;
  hexPath(ctx, 0, 0, 46, 0); ctx.stroke();
  // charge arc / idle power ring
  if (powered) {
    ctx.strokeStyle = `rgba(255,${176 - 60 * charge},${77 + 90 * (1 - charge)},${0.45 + 0.45 * charge})`;
    ctx.lineWidth = 4 / z;
    ctx.beginPath(); ctx.arc(0, 0, 38, -Math.PI / 2, -Math.PI / 2 + TAU * (online ? charge : 1)); ctx.stroke();
    if (!online) {
      ctx.strokeStyle = "rgba(255,210,120,0.18)"; ctx.lineWidth = 1.5 / z;
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.stroke();
    }
  }
  // barrel
  const back = 18 - recoil, tip = 164 - recoil;
  ctx.fillStyle = "#0a1622";
  ctx.strokeStyle = "#7df9ff";
  ctx.lineWidth = 2.5 / z;
  ctx.beginPath();
  ctx.moveTo(back, -19); ctx.lineTo(tip, -12); ctx.lineTo(tip, 12); ctx.lineTo(back, 19); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // hot inner line
  ctx.strokeStyle = `rgba(255,${140 + 90 * charge},80,${0.3 + 0.6 * charge})`;
  ctx.lineWidth = 3 / z;
  ctx.beginPath(); ctx.moveTo(back + 12, 0); ctx.lineTo(tip - 8, 0); ctx.stroke();
  // muzzle brake
  ctx.fillStyle = "#122434"; ctx.strokeStyle = "#9dfcff"; ctx.lineWidth = 2 / z;
  ctx.fillRect(tip - 4, -17, 18, 34); ctx.strokeRect(tip - 4, -17, 18, 34);
  // recoil rails / venting
  ctx.strokeStyle = "rgba(157,180,201,0.5)"; ctx.lineWidth = 1.5 / z;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(8 - recoil * 0.5, -26 - i * 5); ctx.lineTo(26 - recoil * 0.5, -26 - i * 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8 - recoil * 0.5, 26 + i * 5); ctx.lineTo(26 - recoil * 0.5, 26 + i * 5); ctx.stroke();
  }
  // muzzle flash
  if (T.flash > 0) {
    const f = clamp(T.flash / 0.24, 0, 1);
    const mx = tip + 22;
    const gr = ctx.createRadialGradient(mx, 0, 2, mx, 0, 70 * f + 20);
    gr.addColorStop(0, `rgba(255,255,240,${0.9 * f})`);
    gr.addColorStop(0.35, `rgba(255,210,77,${0.7 * f})`);
    gr.addColorStop(1, "rgba(255,110,60,0)");
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(mx, 0, 70 * f + 20, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,240,200,${0.8 * f})`; ctx.lineWidth = 3 / z;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + Math.random() * 0.3;
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx + Math.cos(a) * (46 + 30 * f), Math.sin(a) * (46 + 30 * f)); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // turret base glow (world space, unrotated)
  ctx.strokeStyle = powered ? `rgba(255,176,77,${0.16 + 0.25 * T.recoil})` : "rgba(120,140,155,0.14)";
  ctx.lineWidth = 2 / z;
  ctx.beginPath(); ctx.arc(x, y, 52 + 10 * T.recoil, 0, TAU); ctx.stroke();
  void t;
}

// The expensive clipped hatch and glow are rasterized once per piece and zoom
// bucket. Animation and interaction overlays remain live; WeakMap permits GC.
const compSprites = new WeakMap<LComp, { canvas: HTMLCanvasElement; scale: number; extent: number }>();
function drawComp(g: Game, ctx: CanvasRenderingContext2D, c: LComp, z: number, t: number) {
  const ultra = c.c.tier === 6;
  const col = ultra ? "#d1d1d1" : RARITIES[c.c.tier].color;
  /* Far zoom: a clipped, hatched, glowing outline per component is far more
   * expensive than it is legible. Show a compact rarity-coloured pip instead. */
  if (z < 0.12) {
    const r = Math.max(4, c.r * 0.35);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = col + "44"; ctx.strokeStyle = col; ctx.lineWidth = 1.2 / z;
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }
  const pulse = 0.5 + 0.5 * Math.sin(t * 3 + c.id);
  const scale = salvageSpriteScale(c.r, z, g.dpr);
  if (scale === null) {
    // Never magnify a small bitmap to screen-filling size. Drawing the original
    // geometry directly keeps even enormous pieces crisp without huge canvases.
    compSprites.delete(c);
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
    drawCompSprite(ctx, c, z);
    ctx.restore();
  } else {
    let sprite = compSprites.get(c);
    if (!sprite || sprite.scale !== scale) {
      const extent = c.r * 1.5 + 36 / scale;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = Math.ceil(extent * 2 * scale);
      const spriteCtx = canvas.getContext("2d");
      if (spriteCtx) {
        spriteCtx.setTransform(scale, 0, 0, scale, canvas.width / 2, canvas.height / 2);
        drawCompSprite(spriteCtx, c, scale);
        sprite = { canvas, scale, extent: canvas.width / (2 * scale) };
        compSprites.set(c, sprite);
      }
    }
    if (sprite) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
      ctx.drawImage(sprite.canvas, -sprite.extent, -sprite.extent, sprite.extent * 2, sprite.extent * 2);
      ctx.restore();
    }
  }
  // marker ring
  ctx.strokeStyle = col; ctx.globalAlpha = 0.25 + 0.25 * pulse; ctx.lineWidth = 1.5 / z;
  ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 8 + pulse * 4, 0, TAU); ctx.stroke();
  ctx.globalAlpha = 1;
  if (g.holdComp === c && g.input.rHold > 0) {
    ctx.strokeStyle = "#ff5d73"; ctx.lineWidth = 4 / z;
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 16, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(g.input.rHold / 0.6, 0, 1)); ctx.stroke();
  }
  if (c.stress > 0.05) {
    ctx.strokeStyle = `rgba(255,70,90,${0.4 + 0.5 * Math.sin(t * 30)})`; ctx.lineWidth = 3 / z;
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 4, 0, TAU * c.stress); ctx.stroke();
  }
}

function drawCompSprite(ctx: CanvasRenderingContext2D, c: LComp, z: number) {
  const ultra = c.c.tier === 6;
  const col = ultra ? "#d1d1d1" : RARITIES[c.c.tier].color;
  ctx.save();

  ctx.lineJoin = "round";
  polyPath(ctx, c.c.poly);
  if (ultra) {
    const grad = ctx.createLinearGradient(-c.r, -c.r, c.r, c.r);
    grad.addColorStop(0, "#303030"); grad.addColorStop(0.35, "#080808"); grad.addColorStop(1, "#000000");
    ctx.fillStyle = grad; ctx.fill();
  } else {
    ctx.fillStyle = col + "26"; ctx.fill();
    ctx.save(); ctx.clip(); ctx.strokeStyle = col + "55"; ctx.lineWidth = 1 / z; ctx.beginPath();
    for (let d = -c.r * 2; d < c.r * 2; d += Math.max(6, c.r * 0.22)) { ctx.moveTo(d, -c.r * 2); ctx.lineTo(d + c.r * 2, c.r * 2); }
    ctx.stroke(); ctx.restore();
  }
  ctx.shadowColor = col; ctx.shadowBlur = ultra ? 0 : 14;
  ctx.strokeStyle = col; ctx.lineWidth = 2.2 / z;
  polyPath(ctx, c.c.poly); ctx.stroke();
  ctx.shadowBlur = 0;
  if (!ultra) {
  ctx.setLineDash([5 / z, 5 / z]);
  ctx.save(); ctx.scale(0.8, 0.8);
  polyPath(ctx, c.c.poly);
  ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1 / z; ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);
  }
  ctx.restore();

}

function drawRope(g: Game, ctx: CanvasRenderingContext2D, h: { state: number; nodes: { x: number; y: number }[]; comp: LComp | null; taut: number; hp: number; maxHp: number; hx: number; hy: number; ang: number }, z: number) {
  const n = h.nodes;
  let load = 0;
  if (h.comp) load = clamp(h.comp.c.mass / (Math.max(1, h.comp.hooks.length) * g.stats.hStr), 0, 1.5);
  const heat = clamp(Math.max(load > 0.7 ? (load - 0.7) / 0.6 : 0, h.comp ? h.comp.stress : 0) * (0.3 + 0.7 * h.taut), 0, 1);
  const r = Math.round(125 + 130 * heat), gg = Math.round(249 - 170 * heat), b = Math.round(255 - 150 * heat);
  const col = `rgb(${r},${gg},${b})`;
  const frac = h.hp / h.maxHp;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const draw = () => {
    ctx.beginPath();
    ctx.moveTo(n[0].x, n[0].y);
    for (let i = 1; i < N_ROPE - 1; i++) {
      const mx = (n[i].x + n[i + 1].x) / 2, my = (n[i].y + n[i + 1].y) / 2;
      ctx.quadraticCurveTo(n[i].x, n[i].y, mx, my);
    }
    ctx.lineTo(n[N_ROPE - 1].x, n[N_ROPE - 1].y);
  };
  ctx.globalAlpha = 0.25; ctx.strokeStyle = col; ctx.lineWidth = 7 / z + h.taut * 3; draw(); ctx.stroke();
  ctx.globalAlpha = 0.5 + 0.5 * frac; ctx.shadowColor = col; ctx.shadowBlur = 10;
  ctx.lineWidth = 2.6 / z; draw(); ctx.stroke();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1 / z; ctx.globalAlpha = 0.6; draw(); ctx.stroke(); ctx.globalAlpha = 1;
  // hook head
  const a = h.state === 2 && h.comp ? Math.atan2(n[N_ROPE - 1].y - n[N_ROPE - 3].y, n[N_ROPE - 1].x - n[N_ROPE - 3].x) : Math.atan2(n[N_ROPE - 1].y - n[N_ROPE - 2].y, n[N_ROPE - 1].x - n[N_ROPE - 2].x);
  ctx.save(); ctx.translate(h.hx, h.hy); ctx.rotate(h.state === 1 ? h.ang : a);
  ctx.fillStyle = "#e9ffff"; ctx.strokeStyle = col; ctx.lineWidth = 2 / z; ctx.shadowColor = col; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-4, -8); ctx.lineTo(-1, 0); ctx.lineTo(-4, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-9, -12); ctx.moveTo(-3, 9); ctx.lineTo(-9, 12); ctx.stroke();
  ctx.restore(); ctx.shadowBlur = 0;
}

/* The fitted chassis, drawn barrel-forward from the same look data the CANNON
 * tree icon uses. Recoil slides the whole gun back into its mount on every
 * trigger, heat tints the shroud and puts a glow in the bore, and the barrel
 * that actually fired flashes. Silhouettes differ per gun: fat bolt thrower,
 * long lance, three stubby spigots, or a genuine twin. */
function drawCannon(g: Game, ctx: CanvasRenderingContext2D, z: number, t: number) {
  const p = g.player, st = g.stats;
  const c = CANNON_BY_ID[st.cannonId] ?? CANNONS[0];
  const look = c.look;
  const rec = p.recoil * p.recoil;                     // fast out, settles in
  const back = rec * look.len * 0.3;
  const heat = p.heat;
  const trim = `hsl(${look.hue} 92% ${58 + 10 * heat}%)`;
  const steel = "#0a1723";
  const edge = `hsl(${look.hue} 70% 46%)`;
  const bore = look.bore;
  const mz = st.muzzles;

  /* breech block, bolted to the hull's nose */
  ctx.fillStyle = steel; ctx.strokeStyle = `hsla(${look.hue} 70% 60% / 0.5)`; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6 - back, -bore - 2.2); ctx.lineTo(11 - back, -bore - 3.4);
  ctx.lineTo(11 - back, bore + 3.4); ctx.lineTo(6 - back, bore + 2.2); ctx.closePath();
  ctx.fill(); ctx.stroke();

  /* each barrel slides on its own spring: a twin throws one, then the other */
  const own = (i: number) => p.barrelRec[i] ?? 0;
  const barrel = (y: number, w: number, len: number, alpha: number, spring = 0) => {
    const b = back + spring * look.len * 0.24;
    const charge = c.id === "revolutionary" ? 1 - clamp(spring, 0, 1) : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = steel;
    ctx.strokeStyle = c.id === "revolutionary" ? `hsl(0 75% ${10 + 36 * charge}%)` : edge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(9 - b, y - w, Math.max(1, len - 9), w * 2);
    ctx.fill(); ctx.stroke();
    /* energy seam down the barrel: this is what heats up */
    ctx.strokeStyle = heat > 0.05 ? `hsl(${Math.max(6, 40 - 34 * heat)} 100% ${62 + 8 * heat}%)` : trim;
    ctx.globalAlpha = alpha * (c.id === "revolutionary" ? 0.08 + 0.92 * charge : 0.55 + 0.45 * heat);
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(11 - b, y); ctx.lineTo(len - b - 2, y); ctx.stroke();
    ctx.globalAlpha = alpha;
    /* muzzle ring */
    ctx.strokeStyle = c.id === "revolutionary" ? `hsla(0 90% ${15 + 63 * charge}% / 0.9)` : `hsla(${look.hue} 90% 78% / 0.9)`;
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(len - b, y, 1.4, w + 0.6, 0, 0, TAU); ctx.stroke();
  };

  if (c.rotary) {
    // A rotating cluster: each bore and its own recoil spring follows the
    // same rotation used for the actual firing muzzle.
    mz.forEach((m, i) => barrel(Math.sin((st.cannonId === "gatler" ? p.gatAngle : t * 10) + i * TAU / mz.length) * 5.5, bore * 0.55, m.x, 1, own(i)));
  } else if (look.style === "spray") {
    /* three stubby spigots: a hose, not a rifle */
    barrel(-3.4, bore * 0.62, look.len - 2, 0.95, own(0));
    barrel(0, bore * 0.7, look.len, 1, own(0));
    barrel(3.4, bore * 0.62, look.len - 2, 0.95, own(0));
  } else if (look.style === "lance") {
    /* long slim tube with a cooling shroud and two coils */
    ctx.fillStyle = "rgba(120,200,235,0.10)";
    ctx.strokeStyle = `hsla(${look.hue} 80% 70% / 0.45)`;
    ctx.beginPath(); ctx.rect(11 - back, -bore - 2.6, look.len - 16, (bore + 2.6) * 2); ctx.fill(); ctx.stroke();
    if (c.id === "revolutionary" && mz.length > 1) mz.forEach((m, i) => barrel(m.y, bore * 0.65, look.len, 1, own(i)));
    else barrel(0, bore, look.len, 1, own(0));
    for (let k = 0; k < 2; k++) {
      const x = 18 + k * 7 - back;
      ctx.strokeStyle = trim; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, -bore - 2.2); ctx.lineTo(x, bore + 2.2); ctx.stroke();
    }
  } else if (look.style === "twin") {
    /* two real barrels on two real springs, alternating shot by shot */
    mz.forEach((m, i) => barrel(m.y, bore * 0.72, look.len, 1, own(i)));
    /* shared yoke across both barrels */
    ctx.strokeStyle = `hsla(${look.hue} 70% 62% / 0.6)`; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(13 - back, mz[0].y); ctx.lineTo(13 - back, mz[mz.length - 1].y); ctx.stroke();
  } else {
    /* bolt: one fat barrel with a flared muzzle brake */
    barrel(0, bore, look.len, 1, own(0));
    ctx.fillStyle = steel; ctx.strokeStyle = edge; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(look.len - back - 4, -bore - 2.4); ctx.lineTo(look.len - back + 0.5, -bore - 3.6);
    ctx.lineTo(look.len - back + 0.5, bore + 3.6); ctx.lineTo(look.len - back - 4, bore + 2.4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  /* heat: as the bore climbs the barrel runs through a real heat ramp — a dull
   * red glow, then orange, then a hard white-hot core — with heat distortion
   * rising off it and heat bloom at the muzzle. Near the top the whole mount
   * shudders and the barrel starts to glow through the shroud. */
  if (heat > 0.06) {
    /* the barrel's own heat colour, stepped through the ramp */
    const hr = clamp((heat - 0.06) / 0.94, 0, 1);
    const hcol = `rgb(255,${Math.round(120 - 80 * hr)},${Math.round(40 - 35 * hr)})`;
    /* 1. heat bloom at the muzzle, growing with the ramp */
    const tip = look.len - back;
    const gr = 4 + 14 * hr;
    const grad = ctx.createRadialGradient(tip, 0, 0.5, tip, 0, gr);
    grad.addColorStop(0, `rgba(255,${Math.round(200 - 90 * hr)},${Math.round(120 - 80 * hr)},${0.25 + 0.65 * hr})`);
    grad.addColorStop(0.55, `rgba(255,${Math.round(150 - 60 * hr)},80,${0.15 + 0.45 * hr})`);
    grad.addColorStop(1, "rgba(255,120,40,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(tip, 0, gr, 0, TAU); ctx.fill();

    /* 2. the barrel glows along its whole length: a warm inner line that climbs
     * to white-hot and bleeds a soft halo around the bore */
    const haloR = bore + 3 + 6 * hr;
    const halo = ctx.createRadialGradient(tip * 0.55, 0, 0.5, tip * 0.55, 0, haloR);
    halo.addColorStop(0, `rgba(255,${Math.round(160 - 90 * hr)},${Math.round(90 - 60 * hr)},${0.2 + 0.45 * hr})`);
    halo.addColorStop(1, "rgba(255,120,40,0)");
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.ellipse(tip * 0.55, 0, tip * 0.5, haloR, 0, 0, TAU); ctx.fill();

    /* 3. heat shimmer: rising distortion wisps off the hot barrel. They scale
     * with the ramp and tick with time so the hot gun visibly sweats heat */
    const wisps = Math.round(2 + 5 * hr);
    for (let k = 0; k < wisps; k++) {
      const ph = ((t * (0.5 + 0.6 * hr) + k / wisps) % 1);
      const sx = (10 + (tip - 10) * (0.2 + 0.7 * ph)) - back;
      const sy = -(bore + 3) - 10 * ph - 4 * Math.sin(t * 6 + k);
      const sr = 1.5 + 4.5 * hr * (1 - ph * 0.5);
      ctx.globalAlpha = (1 - ph) * (0.18 + 0.35 * hr);
      ctx.fillStyle = `rgba(255,${Math.round(180 - 80 * hr)},${Math.round(120 - 70 * hr)},1)`;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* 4. near the top the mount shudders: the barrel shakes on its spring and
     * the whole bore pulses hard white, the last warning before the jam */
    if (hr > 0.8) {
      const shud = Math.sin(t * 30) * (hr - 0.8) * 6;
      const sg = ctx.createRadialGradient(tip * 0.6, 0, 0.5, tip * 0.6, 0, bore + 8);
      sg.addColorStop(0, `rgba(255,255,255,${0.4 + 0.5 * (hr - 0.8) * 5})`);
      sg.addColorStop(1, "rgba(255,200,140,0)");
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.ellipse(tip * 0.6 + shud, 0, tip * 0.45, bore + 8, 0, 0, TAU); ctx.fill();
    }
    void hcol;
  }

  /* a jammed gun is a kettle: red-hot shroud, hissing steam out of the vents,
   * and no flash at all until the timer runs out */
  if (p.jam > 0) {
    const j = st.overheat > 0 ? clamp(p.jam / st.overheat, 0, 1) : 0;
    const pulse = 0.55 + 0.45 * Math.sin(t * 22);
    ctx.globalAlpha = 0.55 * j;
    ctx.fillStyle = `rgba(255,${Math.round(70 + 90 * (1 - j))},60,1)`;
    ctx.beginPath();
    ctx.ellipse(look.len * 0.62 - back, 0, look.len * 0.3, bore + 4.5, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    for (let k = 0; k < 3; k++) {
      const ph = ((t * 0.9 + k / 3) % 1);
      const sx = look.len * (0.35 + 0.5 * ph) - back;
      const sy = (k % 2 ? 1 : -1) * (bore + 2 + 9 * ph);
      ctx.globalAlpha = (1 - ph) * 0.5 * pulse;
      ctx.fillStyle = "#ffd9c2";
      ctx.beginPath(); ctx.arc(sx, sy, 1.6 + 3.4 * ph, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* flash on whichever barrel actually fired — one at a time on a twin */
  if (p.muzzleFlash > 0) {
    mz.forEach((m, i) => {
      const f = Math.min(1, own(i));
      if (f < 0.2) return;
      const len = 6 + 12 * f;
      const tip = look.len - back - f * look.len * 0.24;
      ctx.fillStyle = `rgba(255,${240 - 40 * (1 - f)},${200 - 80 * (1 - f)},${0.55 + 0.45 * f})`;
      ctx.shadowColor = trim; ctx.shadowBlur = 12 * f;
      ctx.beginPath();
      ctx.moveTo(tip, m.y - 2.6 * f); ctx.lineTo(tip + len, m.y);
      ctx.lineTo(tip, m.y + 2.6 * f); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tip + 1, m.y); ctx.lineTo(tip + len * 0.6, m.y); ctx.stroke();
      ctx.shadowBlur = 0;
    });
  }
  void z; void t;
}

function drawShipShape(ctx: CanvasRenderingContext2D, color: string, alpha: number, z: number, t = 0) {
  const lw = 1.4 / Math.max(z, 0.6);
  const seam = "rgba(150,215,240,0.22)";
  const hot = "rgba(214,250,255,0.78)";
  const pr = 0.62 + 0.38 * Math.sin(t * 4.4);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  /* ---- gravity halo ---- */
  const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 31);
  halo.addColorStop(0, `rgba(125,249,255,${0.10 + 0.06 * pr})`);
  halo.addColorStop(0.65, "rgba(125,249,255,0.035)");
  halo.addColorStop(1, "rgba(125,249,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(0, 0, 31, 0, TAU); ctx.fill();

  /* ---- three gimbal arms with pumping piston rods ---- */
  const armA = t * 0.18 + Math.PI / 3;
  for (let k = 0; k < 3; k++) {
    const reach = 18 + Math.sin(t * 2.2 + k * 2.1) * 1.5;
    ctx.save();
    ctx.rotate(armA + (k / 3) * TAU);
    ctx.beginPath();
    ctx.moveTo(5.5, -2.4); ctx.lineTo(reach - 2, -1.2); ctx.lineTo(reach + 1.5, 0);
    ctx.lineTo(reach - 2, 1.2); ctx.lineTo(5.5, 2.4); ctx.closePath();
    ctx.fillStyle = "#07131e"; ctx.fill();
    ctx.strokeStyle = "rgba(125,249,255,0.45)"; ctx.lineWidth = lw; ctx.stroke();
    ctx.strokeStyle = `rgba(125,249,255,${0.35 + 0.3 * pr})`;
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(reach - 4, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(reach, 0, 3, 0, TAU);
    ctx.fillStyle = "#081621"; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.2 * lw; ctx.stroke();
    ctx.fillStyle = hot; ctx.beginPath(); ctx.arc(reach, 0, 0.9, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---- counter-rotating inner armour ring ---- */
  const midA = -t * 0.6;
  for (let k = 0; k < 3; k++) {
    const a0 = midA + (k / 3) * TAU + 0.14, a1 = a0 + TAU / 3 - 0.28;
    ctx.beginPath(); ctx.arc(0, 0, 17.4, a0, a1);
    ctx.strokeStyle = "#0d2838"; ctx.lineWidth = 5.2 * lw; ctx.stroke();
    ctx.strokeStyle = color; ctx.globalAlpha = alpha * 0.78; ctx.lineWidth = 1.4 * lw; ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.arc(0, 0, 15.1, a0 + 0.08, a1 - 0.08);
    ctx.strokeStyle = seam; ctx.lineWidth = lw; ctx.stroke();
    for (const a of [a0, a1]) {
      ctx.fillStyle = hot;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 17.4, Math.sin(a) * 17.4, 0.9, 0, TAU); ctx.fill();
    }
  }

  /* ---- outer segmented orbit ring ---- */
  const outA = t * 0.52;
  for (let i = 0; i < 8; i++) {
    const a0 = outA + (i / 8) * TAU + 0.045, a1 = a0 + TAU / 8 - 0.09;
    ctx.beginPath(); ctx.arc(0, 0, 23, a0, a1);
    ctx.strokeStyle = i % 2 ? "rgba(125,249,255,0.78)" : "rgba(95,190,225,0.42)";
    ctx.lineWidth = (i % 2 ? 2.8 : 1.8) * lw; ctx.stroke();
    const ba = a0 + 0.02;
    ctx.strokeStyle = i % 2 ? color : seam;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ba) * 23, Math.sin(ba) * 23);
    ctx.lineTo(Math.cos(ba) * 25.8, Math.sin(ba) * 25.8);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(125,249,255,0.13)"; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.arc(0, 0, 23, 0, TAU); ctx.stroke();

  /* ---- orbiting sensor motes ---- */
  const satA = t * 0.9;
  for (let k = 0; k < 3; k++) {
    const a = satA + (k / 3) * TAU;
    const rr = 26.6 + Math.sin(t * 1.7 + k * 1.9) * 1.2;
    ctx.strokeStyle = `rgba(125,249,255,${0.18 + 0.12 * pr})`;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 23, Math.sin(a) * 23); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); ctx.stroke();
    ctx.fillStyle = hot; ctx.shadowColor = color; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1.9, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(125,249,255,0.55)"; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 3.2, 0, TAU); ctx.stroke();
  }

  /* ---- fast inner gyro ring ---- */
  const inA = t * 1.15;
  for (let k = 0; k < 4; k++) {
    const a0 = inA + (k / 4) * TAU + 0.1, a1 = a0 + TAU / 4 - 0.2;
    ctx.beginPath(); ctx.arc(0, 0, 12, a0, a1);
    ctx.strokeStyle = k % 2 ? "rgba(125,249,255,0.55)" : "rgba(125,249,255,0.22)";
    ctx.lineWidth = (k % 2 ? 2.2 : 1.2) * lw; ctx.stroke();
  }

  /* ---- core housing ---- */
  const cg = ctx.createRadialGradient(-2, -2, 1, 0, 0, 10);
  cg.addColorStop(0, "#173a4c"); cg.addColorStop(0.6, "#0a1a26"); cg.addColorStop(1, "#040d15");
  hexPath(ctx, 0, 0, 9.6, Math.PI / 6);
  ctx.fillStyle = cg; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2 * lw;
  ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
  hexPath(ctx, 0, 0, 7.6, Math.PI / 6);
  ctx.strokeStyle = seam; ctx.lineWidth = lw; ctx.stroke();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + Math.PI / 8;
    ctx.fillStyle = "rgba(190,235,255,0.45)";
    ctx.beginPath(); ctx.arc(Math.cos(a) * 11.2, Math.sin(a) * 11.2, 0.55, 0, TAU); ctx.fill();
  }
  /* four vents that breathe with the core */
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + Math.PI / 4;
    ctx.save(); ctx.rotate(a);
    ctx.fillStyle = "#020a12";
    ctx.beginPath(); ctx.roundRect(7.2, -1.7, 2.6, 3.4, 0.6); ctx.fill();
    ctx.fillStyle = `rgba(125,249,255,${0.25 + 0.35 * pr})`;
    ctx.beginPath(); ctx.rect(7.8, -0.9, 1.5, 1.8); ctx.fill();
    ctx.restore();
  }

  /* ---- forward iris: the construct's "face" ---- */
  ctx.beginPath(); ctx.arc(2.6, 0, 5.4, 0, TAU);
  ctx.fillStyle = "#03101a"; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.3 * lw; ctx.stroke();
  const ig = ctx.createRadialGradient(2.6, 0, 0.4, 2.6, 0, 5);
  ig.addColorStop(0, "#ffffff");
  ig.addColorStop(0.35, color);
  ig.addColorStop(1, "rgba(6,20,30,0)");
  ctx.fillStyle = ig;
  ctx.beginPath(); ctx.arc(2.6, 0, 4.8, 0, TAU); ctx.fill();
  ctx.fillStyle = hot;
  ctx.beginPath(); ctx.roundRect(4.7, -2.4, 1.9, 4.8, 0.95); ctx.fill();
  ctx.strokeStyle = `rgba(125,249,255,${0.3 + 0.3 * pr})`;
  ctx.beginPath(); ctx.arc(2.6, 0, 7.2, -0.85 + t * 1.1, 0.85 + t * 1.1); ctx.stroke();

  /* ---- running lights on the outer ring ---- */
  for (const a of [outA, outA + Math.PI]) {
    ctx.fillStyle = "#7dffb4"; ctx.shadowColor = "#7dffb4"; ctx.shadowBlur = 5;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 25.8, Math.sin(a) * 25.8, 0.9, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
  }

  /* ---- top highlight ---- */
  ctx.strokeStyle = hot; ctx.globalAlpha = alpha * 0.5; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.arc(0, 0, 9.6, -1.9, -1.2); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

const WEAPON_ART: Record<string, { color: string; kind: "gun" | "pod" | "beam" | "special" }> = {
  pulse: { color: "#7dffb4", kind: "gun" },
  scatter: { color: "#ffd24d", kind: "gun" },
  hmg: { color: "#ffb04d", kind: "gun" },
  flak: { color: "#ff9d6e", kind: "gun" },
  missile: { color: "#ff7a5c", kind: "pod" },
  homing: { color: "#ff5cf0", kind: "pod" },
  cluster: { color: "#ff9d4d", kind: "pod" },
  mines: { color: "#c3ccd6", kind: "pod" },
  lance: { color: "#7df9ff", kind: "beam" },
  bypass: { color: "#b7ff7d", kind: "beam" },
  rail: { color: "#ffe9a6", kind: "beam" },
  cutter: { color: "#ff8ad6", kind: "beam" },
  chain: { color: "#c77dff", kind: "special" },
  emp: { color: "#8ad8ff", kind: "special" },
  gravity: { color: "#b18cff", kind: "special" },
  sonic: { color: "#c0ffff", kind: "special" },
  acid: { color: "#9dff6a", kind: "special" },
  venom: { color: "#7dffb4", kind: "special" },
  drones: { color: "#7dffb4", kind: "pod" },
};

const SHIELD_ART: Record<string, string> = {
  deflector: "#7df9ff", absorber: "#45ff8a", reflector: "#c45cff", kinetic: "#ffd24d", phase: "#ff7ad9",
  ward: "#8ad8ff", shell: "#ffb04d", overcharge: "#ffe14d", nullfield: "#9dff6a", prismatic: "#e5a8ff",
};

const ARMOR_ART: Record<string, string> = {
  plating: "#c3ccd6", reactive: "#ffb04d", thorn: "#ff7a5c", chitin: "#7dffb4", carapace: "#ffe14d",
  nanoweave: "#9dff6a", ablative: "#8ad8ff", titan: "#c45cff", exoskeleton: "#ff9d6e", venomguard: "#7dffb4", scalemail: "#ffd24d",
};

function equipped(g: Game, slot: "shield" | "armor" | "optics" | "utility") {
  const id = g.save.equip[slot];
  return id ? g.save.crafted.find((c) => c.id === id) ?? null : null;
}

/** Physical weapon hardware mounted on the hull, one silhouette per weapon. */
function drawWeaponMount(ctx: CanvasRenderingContext2D, rid: string, x: number, y: number, flip: number, aim: number, t: number, i: number) {
  const art = WEAPON_ART[rid] ?? { color: "#ff9d6e", kind: "gun" as const };
  const c = art.color;
  const pulse = 0.55 + 0.45 * Math.sin(t * 3 + i * 2);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(aim);
  ctx.scale(1, flip);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = c;
  ctx.fillStyle = "rgba(8,16,26,0.95)";
  ctx.shadowColor = c;
  ctx.shadowBlur = 7;
  if (art.kind === "beam") {
    const long = rid === "rail" ? 19 : rid === "lance" ? 12 : 9;
    ctx.beginPath(); ctx.roundRect(-3, -2.1, long, 4.2, 1.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c; ctx.globalAlpha = 0.35 + 0.4 * pulse;
    ctx.beginPath(); ctx.rect(long - 2, -1, 3, 2); ctx.fill();
    ctx.globalAlpha = 1;
    if (rid === "cutter") { ctx.beginPath(); ctx.moveTo(long, -4); ctx.lineTo(long + 5, 0); ctx.lineTo(long, 4); ctx.stroke(); }
  } else if (art.kind === "pod") {
    ctx.beginPath(); ctx.roundRect(-3, -4.2, 9, 8.4, 1.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = c;
    for (let k = -1; k <= 1; k += 2) { ctx.globalAlpha = 0.55 + 0.35 * pulse; ctx.beginPath(); ctx.arc(7, k * 2.2, 1.1, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
  } else if (art.kind === "special") {
    ctx.beginPath(); ctx.arc(-1, 0, 4.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (rid === "chain") { ctx.moveTo(2, -3); ctx.lineTo(6, 0); ctx.lineTo(3, 0); ctx.lineTo(7, 3.5); }
    else if (rid === "emp") { ctx.arc(1, 0, 5.5, -0.9, 0.9); }
    else if (rid === "acid" || rid === "venom") { ctx.moveTo(3, -2.4); ctx.lineTo(8, -1.2); ctx.lineTo(8, 1.2); ctx.lineTo(3, 2.4); }
    else { ctx.arc(0, 0, 6.4, 0, TAU); }
    ctx.stroke();
  } else {
    const barrels = rid === "hmg" || rid === "scatter" ? 3 : rid === "flak" ? 2 : 1;
    const len = rid === "scatter" ? 6 : 10;
    if (barrels === 1) {
      ctx.beginPath(); ctx.roundRect(-3, -1, len, 2, 1); ctx.fill(); ctx.stroke();
      ctx.fillStyle = c; ctx.globalAlpha = 0.4 + 0.4 * pulse;
      ctx.beginPath(); ctx.arc(len - 2, 0, 1, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      /* one armoured housing with individual barrel ports, so a triple mount
       * still reads as three barrels instead of a single slab */
      const hh = barrels === 3 ? 6.2 : 4.6;
      ctx.beginPath(); ctx.roundRect(-3, -hh / 2, len, hh, 1.4); ctx.fill(); ctx.stroke();
      for (let b = 0; b < barrels; b++) {
        const oy = (b - (barrels - 1) / 2) * (hh - 1.4) / Math.max(1, barrels - 1 || 1);
        ctx.fillStyle = "#020a12";
        ctx.beginPath(); ctx.roundRect(len - 2.4, oy - 0.55, 3, 1.1, 0.5); ctx.fill();
        ctx.fillStyle = c; ctx.globalAlpha = 0.45 + 0.4 * pulse;
        ctx.beginPath(); ctx.arc(len - 0.2, oy, 0.55, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

/** Armour shows up as curved plates bolted onto the construct's ring. */
function drawArmorVisual(ctx: CanvasRenderingContext2D, rid: string, eff: number, t: number) {
  const c = ARMOR_ART[rid] ?? "#c3ccd6";
  const thick = rid === "titan" ? 4.4 : rid === "carapace" ? 3.8 : 2.6;
  const n = eff > 1.2 ? 4 : 3;
  const rot = t * 0.38;
  ctx.save();
  ctx.strokeStyle = c;
  ctx.fillStyle = c + "22";
  ctx.lineWidth = thick;
  ctx.shadowColor = c; ctx.shadowBlur = 6;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * TAU + 0.16, a1 = a0 + TAU / n - 0.32;
    ctx.beginPath(); ctx.arc(0, 0, 18.9, a0, a1); ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.arc(0, 0, 16.9, a0 + 0.07, a1 - 0.07);
    ctx.lineWidth = 1.1; ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = c;
    for (const a of [a0, a1]) {
      ctx.beginPath(); ctx.arc(Math.cos(a) * 18.9, Math.sin(a) * 18.9, 1.15, 0, TAU); ctx.fill();
    }
  }
  /* collar of reactive plates around the core */
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t * 2.2);
  for (let k = 0; k < 6; k++) {
    const a0 = -t * 0.5 + (k / 6) * TAU + 0.1, a1 = a0 + TAU / 6 - 0.2;
    ctx.beginPath(); ctx.arc(0, 0, 11.1, a0, a1); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawPlayer(g: Game, ctx: CanvasRenderingContext2D, z: number, t: number) {
  if (g.fencerCharge > 0) {
    const p = g.player, progress = 1 - g.fencerCharge / 0.4;
    const x = p.x + Math.cos(p.a) * 42, y = p.y + Math.sin(p.a) * 42;
    ctx.save(); ctx.shadowColor = "#c4a6ff"; ctx.shadowBlur = 20 + 30 * progress;
    ctx.fillStyle = "#e9d5ff"; ctx.beginPath(); ctx.arc(x, y, 5 + progress * 14, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#b487ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 24 - 12 * progress, 0, TAU); ctx.stroke(); ctx.restore();
  }

  const p = g.player, st = g.stats;
  ctx.save();
  ctx.translate(p.x, p.y); ctx.rotate(p.a);
  /* directional ion wash: the construct drifts, it does not have a bow */
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > 30) {
    const back = Math.atan2(-p.vy, -p.vx) - p.a;
    const len = 7 + clamp(sp / 40, 0, 20) * (p.boosting ? 1.8 : 1) + Math.random() * 3;
    ctx.save(); ctx.rotate(back);
    ctx.fillStyle = p.boosting ? "rgba(255,170,60,0.85)" : "rgba(125,249,255,0.6)";
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 13;
    ctx.beginPath(); ctx.moveTo(16, -4.4); ctx.lineTo(16 + len, 0); ctx.lineTo(16, 4.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(232,255,255,0.75)";
    ctx.beginPath(); ctx.moveTo(16, -1.8); ctx.lineTo(16 + len * 0.58, 0); ctx.lineTo(16, 1.8); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;
  }
  drawShipShape(ctx, p.flash > 0 ? "#ff6b81" : "#7df9ff", 1, z, t);
  drawCannon(g, ctx, z, t);
  if (st.cannonId === "mediator" && p.charging && p.charge > 0) {
    // Converging segmented rings and orbiting sparks build into a sharp core.
    const q = clamp(p.charge, 0, 1), mx = st.muzzles[0]?.x ?? 44;
    ctx.save(); ctx.translate(mx, 0); ctx.shadowBlur = 0;
    const radius = 21 + 13 * (1 - q);
    ctx.lineWidth = 2 + q * 2; ctx.strokeStyle = "#bc92ff";
    for (let i = 0; i < 3; i++) {
      const a = t * 3 + i * TAU / 3;
      ctx.beginPath(); ctx.arc(0, 0, radius, a, a + 0.8 + q * 0.8); ctx.stroke();
      ctx.fillStyle = "#f6eaff"; ctx.beginPath(); ctx.arc(Math.cos(-t * 4 + i * TAU / 3) * radius, Math.sin(-t * 4 + i * TAU / 3) * radius, 2.5 + q * 2, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = "#8254dd"; ctx.beginPath(); ctx.arc(0, 0, 7 + q * 11, 0, TAU); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 2 + q * 6, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---- fitted hardware ---- */
  const armor = equipped(g, "armor");
  if (armor) drawArmorVisual(ctx, armor.rid, armor.eff, t);
  st.weapons.slice(0, 3).forEach((w, i) => {
    const slot = W_SLOTS[i] ?? { x: 0, y: 0, rest: 0 };
    const aim = p.wAim[i] ?? slot.rest;
    /* rotating hex hardpoint socket under each barrel */
    ctx.save(); ctx.translate(slot.x, slot.y);
    ctx.fillStyle = "#07131d"; ctx.strokeStyle = "rgba(125,249,255,0.4)"; ctx.lineWidth = 1.1;
    hexPath(ctx, 0, 0, 4.4, 0); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(125,249,255,0.22)";
    ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU); ctx.stroke();
    ctx.restore();
    drawWeaponMount(ctx, w.rid, slot.x, slot.y, slot.y < 0 ? -1 : 1, aim, t, i);
  });
  // shield emitters sit on the gimbal joints
  const shield = equipped(g, "shield");
  if (shield) {
    const sc = SHIELD_ART[shield.rid] ?? "#7df9ff";
    ctx.fillStyle = sc; ctx.shadowColor = sc; ctx.shadowBlur = 8;
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 3 + (k / 3) * TAU;
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3 + k * 2);
      ctx.beginPath(); ctx.arc(Math.cos(a) * 19.8, Math.sin(a) * 19.8, 1.8, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  // optics sensor + utility pod ride the outer ring
  if (equipped(g, "optics")) {
    ctx.strokeStyle = "#9dff6a"; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(23.8, 0, 2.6, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(26.4, 0); ctx.lineTo(29, 0); ctx.stroke();
  }
  if (equipped(g, "utility")) {
    ctx.fillStyle = "#c0a8ff"; ctx.shadowColor = "#c0a8ff"; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(-21.5, 0, 2, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  }
  ctx.restore();

  // The shield is invisible until struck; impacts reveal local honeycomb cells.
 drawShieldImpacts(ctx, p, p.x, p.y, t, 8, st.cannonId === "chairman" ? "#ff344a" : shield ? SHIELD_ART[shield.rid] ?? "#7df9ff" : "#7df9ff");
  if (p.barrier > 0 && p.barrierMax > 0) {
    const f = p.barrier / p.barrierMax;
    ctx.strokeStyle = `rgba(120,220,255,${0.35 + 0.5 * f})`; ctx.lineWidth = 4 / z; ctx.shadowColor = "#4dd2ff"; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(p.x, p.y, SHIP_R + 30 + 3 * Math.sin(t * 8), 0, TAU); ctx.stroke();
    ctx.fillStyle = `rgba(120,220,255,${0.05 + 0.08 * f})`; ctx.fill(); ctx.shadowBlur = 0;
  }
  if (p.overT > 0) {
    ctx.strokeStyle = "rgba(255,225,77,0.7)"; ctx.lineWidth = 2 / z;
    ctx.beginPath(); ctx.arc(p.x, p.y, SHIP_R + 26, 0, TAU); ctx.stroke();
  }
  if (p.tpT > 0) {
    const f = 1 - p.tpT / Math.max(0.1, st.tpTime);
    ctx.strokeStyle = "#c77dff"; ctx.lineWidth = 3 / z; ctx.shadowColor = "#c77dff"; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(p.x, p.y, 34 + 10 * Math.sin(t * 10), -Math.PI / 2, -Math.PI / 2 + TAU * f); ctx.stroke(); ctx.shadowBlur = 0;
  }
}

/** appendages stay species-coloured: plating only wraps the solid body */
const PLATE_KINDS = new Set(["segment", "armor"]);

function drawEnemy(g: Game, ctx: CanvasRenderingContext2D, e: Enemy, z: number, t: number) {
  const sr = e.radius * z;
  const simple = sr < 26 || z < 0.35;
  // telegraphs
  if (e.act && e.act.ph === 0 && e.act.t < e.act.def.wind + 0.01) {
    const d = e.act.def;
    const f = e.act.t / d.wind;
    const pulse = 0.5 + 0.5 * Math.sin(t * 18);
    if (d.type === "charge") {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
      const len = Math.max(300, (d.speed ?? 600) * (d.dur ?? 0.5));
      ctx.fillStyle = `rgba(255,60,80,${0.07 + 0.12 * f})`;
      ctx.fillRect(0, -e.radius * 0.35, len, e.radius * 0.7);
      ctx.strokeStyle = `rgba(255,90,100,${0.4 + 0.4 * f})`; ctx.lineWidth = 2 / z; ctx.setLineDash([14 / z, 10 / z]);
      ctx.strokeRect(0, -e.radius * 0.35, len, e.radius * 0.7); ctx.setLineDash([]);
      ctx.restore();
    } else if (d.type === "ring" || d.type === "nova") {
      ctx.strokeStyle = `rgba(255,120,90,${0.25 + 0.5 * f})`; ctx.lineWidth = 4 / z;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * (0.4 + 0.7 * f), 0, TAU); ctx.stroke();
    } else if (d.type === "grab") {
      /* a target reticle snaps onto the ship, then a glowing arc sweeps in
       * around the enemy as it winds up to lunge and pin */
      const tx = g.player.x, ty = g.player.y;
      ctx.strokeStyle = `rgba(255,80,90,${0.35 + 0.5 * f})`; ctx.lineWidth = 3 / z;
      ctx.beginPath(); ctx.arc(tx, ty, (e.radius + SHIP_R) * (0.5 + 0.5 * f), 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(255,110,120,${0.25 + 0.4 * f})`; ctx.lineWidth = 5 / z;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * (0.6 + 0.6 * f), e.a - 0.6, e.a + 0.6); ctx.stroke();
      ctx.setLineDash([10 / z, 6 / z]);
      ctx.strokeStyle = `rgba(255,140,150,${0.5 * f})`; ctx.lineWidth = 2 / z;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.setLineDash([]);
    } else if (d.type === "beam") {
      /* wind-up: a pulsing warning ring, then preview arcs where the beams
       * will sweep from */
      ctx.strokeStyle = `rgba(255,150,60,${0.2 + 0.45 * f})`; ctx.lineWidth = 4 / z;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * (0.8 + 0.5 * f), 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(255,180,90,${0.3 + 0.5 * f * pulse})`; ctx.lineWidth = 2 / z;
      for (let k = 0; k < (d.beams ?? 4); k++) {
        const ang = e.a + (k / (d.beams ?? 4)) * TAU;
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(ang) * e.radius * 0.5, e.y + Math.sin(ang) * e.radius * 0.5);
        ctx.lineTo(e.x + Math.cos(ang) * 420, e.y + Math.sin(ang) * 420);
        ctx.stroke();
      }
    } else if (d.type === "domain") {
      /* a dark moon swells above the moth as it opens its domain */
      const mr = e.radius * (1.2 + 1.6 * f);
      ctx.fillStyle = `rgba(80,70,180,${0.12 + 0.22 * f})`;
      ctx.beginPath(); ctx.arc(e.x, e.y - e.radius * (1.6 + 1.2 * f), mr, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(170,150,255,${0.4 + 0.5 * f})`; ctx.lineWidth = 4 / z;
      ctx.beginPath(); ctx.arc(e.x, e.y - e.radius * (1.6 + 1.2 * f), mr, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(150,130,240,${0.25 + 0.4 * f})`; ctx.lineWidth = 2 / z;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * (1.4 + 1.0 * f), 0, TAU); ctx.stroke();
    } else if (d.type === "shoot" || d.type === "spit") {
      /* a small aiming marker at the muzzle while it winds up to fire */
      const mx = e.x + Math.cos(e.a) * e.spd.muzzle * e.S, my = e.y + Math.sin(e.a) * e.spd.muzzle * e.S;
      ctx.strokeStyle = `rgba(255,200,90,${0.3 + 0.5 * f})`; ctx.lineWidth = 2 / z;
      ctx.beginPath(); ctx.arc(mx, my, 6 + 6 * f, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx - Math.cos(e.a) * 14, my - Math.sin(e.a) * 14);
      ctx.lineTo(mx + Math.cos(e.a) * 14, my + Math.sin(e.a) * 14);
      ctx.moveTo(mx - Math.sin(e.a) * 14, my + Math.cos(e.a) * 14);
      ctx.lineTo(mx + Math.sin(e.a) * 14, my - Math.cos(e.a) * 14); ctx.stroke();
    } else if (d.type === "pull") {
      /* a hooked line + destination marker while it winds up to pull */
      const tx = g.player.x, ty = g.player.y;
      ctx.strokeStyle = `rgba(255,120,200,${0.25 + 0.45 * f})`; ctx.lineWidth = 2 / z;
      ctx.setLineDash([12 / z, 8 / z]);
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(255,150,220,${0.4 + 0.5 * f})`; ctx.lineWidth = 3 / z;
      ctx.beginPath(); ctx.arc(tx, ty, 10 + 8 * f, 0, TAU); ctx.stroke();
    }
  }
  ctx.save();
  ctx.translate(e.x, e.y); ctx.rotate(e.a);
  ctx.lineJoin = "round";
  const lw = 1.7 / z;
  const big = !simple && sr > 60;
  const drawOrder = e.order;
  /* ---- physical plating ----
   * Solid steel slabs bolted around every body plate: a dark underlay for thickness,
   * a filled top face and a bright rim, plus one faint ridge per extra layer. It is
   * drawn in its own pass so the slabs sit under the whole body rather than painting
   * over whatever limbs happen to come later in the draw order. */
  const shellN = e.shells.length;
  const showPlate = shellN > 0;
  const plateMin = e.radius * 0.05;
  if (showPlate) {
    const top = e.shells[shellN - 1];
    const f = clamp(top.hp / Math.max(1, top.max), 0, 1);
    /* Neutral steel, not a species-tinted stroke: the slabs have to read as a
     * separate physical object bolted onto the body. */
    const steel = (l: number, a = 1) => `hsla(${e.spd.hue},9%,${l}%,${a})`;
    const under = steel(5, 0.92);
    const fill = steel(19 + 11 * f, 0.97);
    const lip = steel(36 + 14 * f, 0.95);
    const rimW = 2.6 / (3 * z);
    /* The old plating was a 4-19u rim; the slabs now stand ~10x thicker, and
     * their width tracks the size of the plate they are bolted to. */
    const platePath = (p: { poly: number[]; cx: number; cy: number; r: number }, g: number) => {
      const k = 1 + g / Math.max(1, p.r);
      ctx.beginPath();
      for (let i = 0; i < p.poly.length; i += 2) {
        const vx = p.cx + (p.poly[i] - p.cx) * k;
        const vy = p.cy + (p.poly[i + 1] - p.cy) * k;
        if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
    };
    const legPlate = e.legPlate;
    for (const idx of drawOrder) {
      const p = e.parts[idx];
      if (!p.alive || p.r <= plateMin) continue;
      /* legendary legs get 1 slab layer, mythical legs 2; the body keeps its own count */
      const layersHere = p.kind === "leg" ? legPlate : shellN;
      if (!layersHere || (!PLATE_KINDS.has(p.kind) && p.kind !== "leg")) continue;
      const grow = plateGrow(p.r, layersHere);
      const grp = p.g >= 0 ? e.groups[p.g] : null;
      const gs = !!(grp && grp.ang !== 0);
      if (grp && gs) { ctx.save(); ctx.translate(grp.px, grp.py); ctx.rotate(grp.ang); ctx.translate(-grp.px, -grp.py); }
      const bo = bend(e, p);
      const bs = bo !== 0;
      if (bs) { ctx.save(); ctx.translate(0, bo); }
      /* dark underlay reads as thickness / a shadow gap around the slab */
      platePath(p, grow + grow * 0.3);
      ctx.fillStyle = under; ctx.fill();
      /* solid top face */
      platePath(p, grow);
      ctx.fillStyle = fill; ctx.fill();
      /* lighter lip just inside the outer edge gives the slab a bevel */
      platePath(p, grow * 0.84);
      ctx.strokeStyle = lip; ctx.lineWidth = Math.max(2 / 3, grow * 0.22) / z; ctx.stroke();
      /* bright outer rim */
      ctx.strokeStyle = steel(62, 0.75 + 0.2 * f + 0.25 * plateHitIntensity(p, t)); ctx.lineWidth = rimW; ctx.stroke();
      /* one ridge per extra layer, so four bolted layers read as four */
      if (layersHere > 1) {
        for (let i = 1; i < layersHere; i++) {
          ctx.globalAlpha = 0.65;
          platePath(p, grow * (1 - i / (layersHere + 0.4)));
          ctx.strokeStyle = lip; ctx.lineWidth = Math.max(0.4, grow * 0.1) / z; ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      if (bs) ctx.restore();
      if (gs) ctx.restore();
    }
  }
  for (const idx of drawOrder) {
    const p = e.parts[idx];
    if (!p.alive) continue;
    const gr = p.g >= 0 ? e.groups[p.g] : null;
    if (gr && gr.ang !== 0) { ctx.save(); ctx.translate(gr.px, gr.py); ctx.rotate(gr.ang); ctx.translate(-gr.px, -gr.py); }
    const bo = bend(e, p);
    if (bo !== 0) { ctx.save(); ctx.translate(0, bo); }
    polyPath(ctx, p.poly);
    const hf = p.hp / p.maxHp;
    const hurt = p.hurt > 0;
    /* a crippled leg is dead weight: dim, desaturated and no longer swinging */
    const crippled = p.kind === "leg" && !legHealthy(p);
    ctx.globalAlpha = (0.62 + 0.38 * hf) * (crippled ? 0.5 : 1);
    ctx.fillStyle = hurt ? "rgba(255,255,255,0.85)" : p.fill;
    ctx.fill();
    /* Canvas blur cost explodes with the area it covers. Keep the glow only
     * on small on-screen pieces; large parts get a cheap echo stroke instead. */
    const prs = p.r * z;
    if (!simple && p.glow && prs > 10 && prs < 34) {
      ctx.shadowColor = p.stroke;
      ctx.shadowBlur = p.kind === "core" ? 22 : 12;
    }
    else if (big && p.r * z > 14) { ctx.save(); ctx.globalAlpha = 0.12; ctx.strokeStyle = p.stroke; ctx.lineWidth = lw * 3.2; ctx.stroke(); ctx.restore(); }
    ctx.strokeStyle = hurt ? "#ffffff" : crippled ? "#6a5d4d" : p.stroke;
    ctx.lineWidth = lw * (p.kind === "core" ? 1.6 : 1);
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (p.kind === "core") {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r * 0.35, 0, TAU); ctx.fill();
    }
    if (p.kind === "shield" || p.kind === "weapon") {
      ctx.globalAlpha = 0.9; ctx.fillStyle = p.kind === "shield" ? "#7df9ff" : "#ff7a5c";
      ctx.beginPath(); ctx.arc(p.cx, p.cy, p.r * 0.25, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (bo !== 0) ctx.restore();
    if (gr && gr.ang !== 0) ctx.restore();
  }
  ctx.restore();

  // status auras
  if (!simple && sr > 30 && e.slowT > 0) {
    ctx.strokeStyle = "rgba(255,122,217,0.55)"; ctx.lineWidth = 2 / z;
    ctx.setLineDash([10 / z, 8 / z]); ctx.lineDashOffset = t * 30 / z;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 14, 0, TAU); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
  }
  if (!simple && sr > 30 && e.melt > 0.05) {
    ctx.strokeStyle = `rgba(120,255,90,${0.15 + 0.35 * Math.min(1, e.melt)})`; ctx.lineWidth = 3 / z;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 6, 0, TAU); ctx.stroke();
  }
  if (!simple && sr > 30 && e.stun > 0) {
    ctx.strokeStyle = "rgba(255,225,77,0.5)"; ctx.lineWidth = 2 / z;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 20, 0, TAU); ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const an = t * 4 + (k / 3) * TAU;
      ctx.beginPath(); ctx.moveTo(e.x + Math.cos(an) * (e.radius + 12), e.y + Math.sin(an) * (e.radius + 12));
      ctx.lineTo(e.x + Math.cos(an) * (e.radius + 20), e.y + Math.sin(an) * (e.radius + 20)); ctx.stroke();
    }
  }

  // the moth's heal-shield bubble: a pulsing purple dome that shields and feeds it
  if (!simple && sr > 30 && e.buffT > 0 && e.buffMax > 0) {
    const bf = clamp(e.buffHp / Math.max(1, e.buffMax), 0, 1);
    const br = e.radius * 1.5 + Math.sin(t * 6) * 4;
    ctx.save();
    ctx.globalAlpha = 0.18 + 0.22 * bf;
    ctx.fillStyle = `hsl(${e.spd.hue} 100% 60%)`;
    ctx.beginPath(); ctx.arc(e.x, e.y, br, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.5 + 0.4 * bf;
    ctx.strokeStyle = `hsl(${e.spd.hue} 100% 75%)`; ctx.lineWidth = 2.5 / z;
    ctx.shadowColor = `hsl(${e.spd.hue} 100% 70%)`; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(e.x, e.y, br, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  // Collision geometry stays active even when its visual surface is invisible.
 drawShieldImpacts(ctx, e, e.x, e.y, t, clamp(e.S * 0.15, 8, 20), "#7df9ff");
}

function drawBars(g: Game, ctx: CanvasRenderingContext2D, e: Enemy, z: number) {
  if (z < 0.1) return;
  if (e.radius * z < 10 && e.barT <= 0) return;
  const showMain = e.barT > 0 || (e.aggro && e.dist < 1000);
  for (const p of e.parts) {
    if (!p.alive || p.barT <= 0 || p.hp >= p.maxHp) continue;
    const [wx, wy] = pw(e, p);
    const bw = clamp(p.r * 1.3, 24 / z, 90 / z), bh = 3.5 / z;
    const x = wx - bw / 2, y = wy - Math.min(p.r * 0.5, 14 / z) - 4 / z;
    const f = clamp(p.hp / p.maxHp, 0, 1);
    ctx.globalAlpha = clamp(p.barT / 1.2, 0, 1);
    ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(x - 1 / z, y - 1 / z, bw + 2 / z, bh + 2 / z);
    ctx.fillStyle = p.kind === "core" ? "#ffffff" : p.kind === "armor" ? "#ffd24d" : f > 0.5 ? "#5dff9a" : f > 0.25 ? "#ffd24d" : "#ff5d73";
    ctx.fillRect(x, y, bw * f, bh);
  }
  ctx.globalAlpha = 1;
  if (showMain) {
    const integ = g.integrity(e);
    const bw = clamp(e.radius * 1.5, 110 / z, 800 / z), bh = 8 / z;
    const x = e.x - bw / 2, y = e.y - Math.min(e.radius, 260) - 30 / z;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(x - 2 / z, y - 2 / z, bw + 4 / z, bh + 4 / z);
    const grd = ctx.createLinearGradient(x, 0, x + bw, 0);
    grd.addColorStop(0, "#ff3d73"); grd.addColorStop(0.5, "#ffd24d"); grd.addColorStop(1, "#4dffb4");
    ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = grd; ctx.fillRect(x, y, bw * integ, bh);
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1 / z; ctx.strokeRect(x, y, bw, bh);
    if (e.shells.length) {
      const pr = 3.4 / z;
      for (let i = 0; i < e.shells.length; i++) {
        const sx = x + (i + 0.5) * (bw / Math.max(1, e.shells.length));
        const sf = clamp(e.shells[i].hp / Math.max(1, e.shells[i].max), 0, 1);
        ctx.beginPath(); ctx.arc(sx, y + bh + 6 / z, pr, 0, TAU);
        ctx.fillStyle = `rgba(176,188,200,${0.35 + 0.5 * sf})`; ctx.fill();
      }
    }
  }
}

let minimapTerrain: HTMLCanvasElement | null = null;
function terrainMap(): HTMLCanvasElement {
  if (minimapTerrain) return minimapTerrain;
  const image = document.createElement("canvas");
  image.width = image.height = MAP_GRID.length;
  const c = image.getContext("2d")!;
  for (let y = 0; y < MAP_GRID.length; y++) for (let x = 0; x < MAP_GRID.length; x++) {
    if (MAP_GRID[y][x] !== "1") continue;
    c.fillStyle = "rgba(165,185,200,0.55)";
    c.fillRect(x, y, 1, 1);
  }
  return minimapTerrain = image;
}
function drawMinimap(g: Game, ctx: CanvasRenderingContext2D) {
  const small = Math.min(170, g.w * 0.28, g.h * 0.28);
  const large = Math.max(small, Math.min(g.w * 0.74, g.h * 0.72, 700));
  const targetSize = g.mapMode === 1 ? large : small;
  const targetX = g.mapMode === 1 ? g.w / 2 : g.w - small / 2 - 14;
  const targetY = g.mapMode === 1 ? g.h / 2 : small / 2 + 14;
  const targetScale = g.mapMode === 2 ? 4 : 1;
  const targetFocusX = g.mapMode === 2 ? g.player.x : 0;
  const targetFocusY = g.mapMode === 2 ? g.player.y : 0;
  const a = g.mapAnimation, now = performance.now();
  if (!a.last) { a.size = targetSize; a.x = targetX; a.y = targetY; a.scale = targetScale; a.focusX = targetFocusX; a.focusY = targetFocusY; }
  const blend = 1 - Math.exp(-Math.min(0.1, (now - (a.last || now)) / 1000) * 10);
  a.last = now;
  a.size += (targetSize - a.size) * blend; a.x += (targetX - a.x) * blend; a.y += (targetY - a.y) * blend;
  a.scale += (targetScale - a.scale) * blend;
  a.focusX += (targetFocusX - a.focusX) * blend; a.focusY += (targetFocusY - a.focusY) * blend;
  const S = a.size, cx = a.x, cy = a.y, R = S / 2, k = R * a.scale / WORLD_R;
  const x = (worldX: number) => cx + (worldX - a.focusX) * k;
  const y = (worldY: number) => cy + (worldY - a.focusY) * k;
  ctx.save();
  ctx.beginPath(); ctx.rect(cx - R, cy - R, S, S); ctx.clip();
  ctx.fillStyle = "rgba(4,8,20,0.9)"; ctx.fillRect(cx - R, cy - R, S, S);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(terrainMap(), x(-MAP_RADIUS), y(-MAP_RADIUS), 2 * MAP_RADIUS * k, 2 * MAP_RADIUS * k);
  ctx.imageSmoothingEnabled = true;
  hexPath(ctx, x(BASE.x), y(BASE.y), 4.5, 0);
  ctx.fillStyle = "#4dffd2"; ctx.fill();
  for (const o of g.others) { ctx.fillStyle = "#ff7ad9"; ctx.beginPath(); ctx.arc(x(o.x), y(o.y), 2.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = "#58ff77"; ctx.beginPath(); ctx.arc(x(g.player.x), y(g.player.y), 3, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.strokeStyle = "rgba(125,249,255,0.7)"; ctx.lineWidth = 2;
  ctx.strokeRect(cx - R, cy - R, S, S); ctx.restore();
}

function drawBaseArrow(g: Game, ctx: CanvasRenderingContext2D) {
  const p = g.player;
  const dx = BASE.x - p.x, dy = BASE.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 1400 || p.dead) return;
  const a = Math.atan2(dy, dx);
  const rr = Math.min(g.w, g.h) / 2 - 46;
  const x = g.w / 2 + Math.cos(a) * rr, y = g.h / 2 + Math.sin(a) * rr;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = "rgba(77,255,210,0.85)"; ctx.shadowColor = "#4dffd2"; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-4, 0); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = "rgba(77,255,210,0.85)"; ctx.font = "11px ui-monospace, monospace"; ctx.textAlign = "center";
  ctx.fillText(`BASE ${(d / 1000).toFixed(1)}k`, x - Math.cos(a) * 26, y - Math.sin(a) * 26 + 4);
}
