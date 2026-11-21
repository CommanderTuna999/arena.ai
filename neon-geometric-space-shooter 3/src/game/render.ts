import { TAU, clamp, fmtNum } from "./math";
import { BASE, CAT_NAME, KIND_CAT, RARITIES, SHIP_R, W_SLOTS, WEAPON_RANGE, WEAPON_TINT, WORLD_R, ZONE_EDGES } from "./data";
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

  /* ---- zone rings & world edge ---- */
  ctx.setLineDash([40 / z, 40 / z]);
  ctx.lineWidth = 3 / z;
  ZONE_EDGES.forEach((r, i) => {
    ctx.strokeStyle = RARITIES[5 - i].color + "40";
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(3,0,8,0.82)";
  ctx.beginPath();
  ctx.rect(vx0 - 2000, vy0 - 2000, vx1 - vx0 + 4000, vy1 - vy0 + 4000);
  ctx.arc(0, 0, WORLD_R, 0, TAU, true);
  ctx.fill("evenodd");
  ctx.strokeStyle = "#ff3d73";
  ctx.lineWidth = 6 / z;
  ctx.shadowColor = "#ff3d73"; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(0, 0, WORLD_R, 0, TAU); ctx.stroke();
  ctx.shadowBlur = 0;

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

  /* ---- puddles ---- */
  for (const q of g.puddles) {
    if (q.x + q.r < vx0 || q.x - q.r > vx1 || q.y + q.r < vy0 || q.y - q.r > vy1) continue;
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

  /* ---- credit motes ---- */
  for (const c of g.creditDrops) {
    if (c.x < vx0 - 10 || c.x > vx1 + 10 || c.y < vy0 - 10 || c.y > vy1 + 10) continue;
    const fade = clamp(c.life / 2.5, 0, 1);
    const bob = Math.sin(t * 4 + c.spin) * 1.4;
    if (z < 0.1) {
      const px = Math.max(1.2, 3.2 * z / 0.1);
      const w = px / z;
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#ffd24d";
      ctx.fillRect(c.x - w / 2, c.y + bob - w / 2, w, w);
      continue;
    }
    ctx.save(); ctx.translate(c.x, c.y + bob); ctx.rotate(c.spin);
    ctx.globalAlpha = fade;
    ctx.fillStyle = "#ffd24d"; ctx.shadowColor = "#ffd24d"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(0, -4.8); ctx.lineTo(3.7, 0); ctx.lineTo(0, 4.8); ctx.lineTo(-3.7, 0); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#3b2704";
    ctx.beginPath(); ctx.moveTo(0, -2.4); ctx.lineTo(1.8, 0); ctx.lineTo(0, 2.4); ctx.lineTo(-1.8, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,245,190,0.85)"; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(0, -4.8); ctx.lineTo(0, 4.8); ctx.stroke();
    if (c.value >= 24) {
      ctx.strokeStyle = "rgba(255,225,120,0.45)"; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(0, 0, 6.2, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  /* ---- magnet field ---- */
  if (g.stats.magnet > 0) {
    const mpl = g.player;
    for (const c of g.comps) {
      if (c.hooks.length || c.c.mass >= 14) continue;
      const d = Math.hypot(c.x - mpl.x, c.y - mpl.y);
      if (d > g.stats.magnetRange) continue;
      ctx.strokeStyle = `rgba(255,225,77,${0.06 + 0.28 * (1 - d / g.stats.magnetRange)})`;
      ctx.lineWidth = 1.2 / z; ctx.setLineDash([8 / z, 10 / z]); ctx.lineDashOffset = -t * 40 / z;
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(mpl.x, mpl.y); ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }
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

  /* ---- pull line ---- */
  const pl = g.player;
  if (pl.pull) {
    ctx.strokeStyle = "rgba(255,140,80,0.8)"; ctx.lineWidth = 3 / z; ctx.setLineDash([12 / z, 8 / z]);
    ctx.beginPath(); ctx.moveTo(pl.x, pl.y); ctx.lineTo(pl.pull.e.x, pl.pull.e.y); ctx.stroke(); ctx.setLineDash([]);
  }

  /* ---- enemy projectiles ---- */
  for (const pr of g.eprojs) {
    if (pr.x < vx0 || pr.x > vx1 || pr.y < vy0 || pr.y > vy1) continue;
    const col = pr.type === "missile" ? "#ffb04d" : `hsl(${pr.hue},100%,68%)`;
    ctx.shadowColor = col; ctx.shadowBlur = pr.r * z > 2 ? 12 : 0;
    ctx.fillStyle = col; ctx.strokeStyle = col;
    ctx.lineWidth = 2 / z;
    const ang = Math.atan2(pr.vy, pr.vx);
    switch (pr.type) {
      case "missile": {
        ctx.save(); ctx.translate(pr.x, pr.y); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(pr.r * 1.4, 0); ctx.lineTo(-pr.r, -pr.r * 0.7); ctx.lineTo(-pr.r * 0.5, 0); ctx.lineTo(-pr.r, pr.r * 0.7); ctx.closePath(); ctx.fill();
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

  /* ---- nest siege shells ---- */
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
    } else {
      ctx.lineWidth = (b.crit ? 4 : 3);
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.022, b.y - b.vy * 0.022); ctx.stroke();
    }
  }
  ctx.shadowBlur = 0;
  for (const bm of g.beams) {
    const c = bm.color ?? "#baffff";
    ctx.globalAlpha = clamp(bm.life / 0.12, 0, 1);
    ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.shadowColor = c; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.moveTo(bm.x1, bm.y1); ctx.lineTo(bm.x2, bm.y2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.shadowBlur = 0;

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
  if (!pl.dead) drawPlayer(g, ctx, z, t);

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

  /* ---- enemy bars (drawn last, in world space) ---- */
  for (const e of g.enemies) {
    if (e.x + e.radius < vx0 || e.x - e.radius > vx1 || e.y + e.radius < vy0 || e.y - e.radius > vy1) continue;
    drawBars(g, ctx, e, z);
  }

  /* ---- screen space HUD in canvas ---- */
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawMinimap(g, ctx);
  drawBaseArrow(g, ctx);
  if (hoveredComp) drawCompTooltip(g, ctx, hoveredComp);
}

/* Hover card for loose components: name, rarity/category, value and mass.
 * Drawn in screen space so the text stays crisp at every zoom level. */
function drawCompTooltip(g: Game, ctx: CanvasRenderingContext2D, c: LComp) {
  const col = RARITIES[c.c.tier].color;
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
  ctx.fillText(`⚖ ${c.c.mass.toFixed(1)} mass`, x + 112, y + 57);
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
  // minimal nest sigil: a hex with three cells, no lettering
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

/* Heavy siege cannon on the nest. The barrel physically kicks back on every
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

function drawComp(g: Game, ctx: CanvasRenderingContext2D, c: LComp, z: number, t: number) {
  const col = RARITIES[c.c.tier].color;
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
  ctx.save();
  ctx.translate(c.x, c.y); ctx.rotate(c.a);
  ctx.lineJoin = "round";
  polyPath(ctx, c.c.poly);
  ctx.fillStyle = col + "26"; ctx.fill();
  // hatch
  ctx.save(); ctx.clip();
  ctx.strokeStyle = col + "55"; ctx.lineWidth = 1 / z;
  ctx.beginPath();
  for (let d = -c.r * 2; d < c.r * 2; d += Math.max(6, c.r * 0.22)) { ctx.moveTo(d, -c.r * 2); ctx.lineTo(d + c.r * 2, c.r * 2); }
  ctx.stroke();
  ctx.restore();
  ctx.shadowColor = col; ctx.shadowBlur = 10 + 8 * pulse;
  ctx.strokeStyle = col; ctx.lineWidth = 2.2 / z;
  polyPath(ctx, c.c.poly); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.setLineDash([5 / z, 5 / z]);
  ctx.save(); ctx.scale(0.8, 0.8);
  polyPath(ctx, c.c.poly);
  ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1 / z; ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);
  ctx.restore();
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

  if (st.shieldMax > 0 && p.shield > 0) {
    const f = p.shield / st.shieldMax;
    const sc = shield ? SHIELD_ART[shield.rid] ?? "#7df9ff" : "#7df9ff";
    ctx.strokeStyle = sc; ctx.globalAlpha = 0.2 + 0.5 * f; ctx.lineWidth = 2 / z;
    ctx.shadowColor = sc; ctx.shadowBlur = 10;
    hexPath(ctx, p.x, p.y, SHIP_R + 20, t * 0.8);
    ctx.stroke(); ctx.fillStyle = sc; ctx.globalAlpha = 0.04 + 0.06 * f; ctx.fill();
    ctx.globalAlpha = 0.5 + 0.35 * Math.sin(t * 4);
    for (const dir of [1, -1]) {
      ctx.beginPath(); ctx.arc(p.x, p.y, SHIP_R + 26, t * dir * 1.1, t * dir * 1.1 + 1.1); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
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
  /* At full optics zoom the viewport holds hundreds of insects; drawing every
   * limb of a four-pixel enemy is invisible work. Far enemies collapse to a
   * single species-coloured mote, and mid-range ones drop their plating and
   * shadows. */
  if (sr < 3) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = `hsl(${e.spd.hue},85%,64%)`;
    ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(1.4, sr * 0.55), 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  /* Fully zoomed out, every insect becomes a cheap species-coloured marker.
   * Drawing 70-part mythical bodies at this scale was the single biggest frame
   * cost, and their overlapping translucent fills turned the centre white. */
  if (z < 0.1) {
    const rr = Math.max(2.5, Math.min(sr * 0.6, 26));
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = `hsl(${e.spd.hue},80%,55%)`;
    ctx.beginPath(); ctx.arc(e.x, e.y, rr, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = `hsl(${e.spd.hue},85%,68%)`;
    ctx.lineWidth = 1.4 / z;
    ctx.stroke();
    ctx.fillStyle = `hsl(${e.spd.hue},100%,82%)`;
    ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(1.2, Math.min(3.5, rr * 0.16)), 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  let detail = sr < 9 ? 2 : sr < 26 ? 1 : 0;
  /* Zooming out is a strategic view: cap detail globally so a screen full of
   * mythical insects costs roughly the same as a screen full of small ones. */
  if (z < 0.35) detail = Math.max(detail, 1);
  const simple = detail > 0;
  // telegraphs
  if (e.act && e.act.ph === 0 && e.act.t < e.act.def.wind + 0.01) {
    const d = e.act.def;
    const f = e.act.t / d.wind;
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
    }
  }
  ctx.save();
  ctx.translate(e.x, e.y); ctx.rotate(e.a);
  ctx.lineJoin = "round";
  const lw = 1.7 / z;
  const big = !simple && sr > 60;
  const stride = Math.max(1, Math.ceil(e.order.length / (detail === 2 ? 7 : 12)));
  const drawOrder = detail === 0
    ? e.order
    : e.order.filter((idx, i) => i % stride === 0 || e.parts[idx].kind === "core" || e.parts[idx].kind === "weapon");
  /* ---- physical plating ----
   * Solid steel slabs bolted around every body plate: a dark underlay for thickness,
   * a filled top face and a bright rim, plus one faint ridge per extra layer. It is
   * drawn in its own pass so the slabs sit under the whole body rather than painting
   * over whatever limbs happen to come later in the draw order. */
  const shellN = e.shells.length;
  const showPlate = !simple && sr > 24 && shellN > 0;
  const plateMin = e.radius * 0.05;
  if (showPlate) {
    const top = e.shells[shellN - 1];
    const f = clamp(top.hp / Math.max(1, top.max), 0, 1);
    const hit = e.shellHit > 0 ? 1 : 0;
    /* Neutral steel, not a species-tinted stroke: the slabs have to read as a
     * separate physical object bolted onto the body. */
    const steel = (l: number, a = 1) => `hsla(${e.spd.hue},9%,${l}%,${a})`;
    const under = steel(5, 0.92);
    const fill = steel(19 + 11 * f, 0.97);
    const lip = steel(36 + 14 * f, 0.95);
    const rim = steel(62, 0.75 + 0.2 * f + 0.25 * hit);
    const rimW = 2.6 / z;
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
      ctx.strokeStyle = lip; ctx.lineWidth = Math.max(2, grow * 0.22) / z; ctx.stroke();
      /* bright outer rim */
      ctx.strokeStyle = rim; ctx.lineWidth = rimW; ctx.stroke();
      /* one ridge per extra layer, so four bolted layers read as four */
      if (layersHere > 1) {
        for (let i = 1; i < layersHere; i++) {
          ctx.globalAlpha = 0.65;
          platePath(p, grow * (1 - i / (layersHere + 0.4)));
          ctx.strokeStyle = lip; ctx.lineWidth = Math.max(1.2, grow * 0.1) / z; ctx.stroke();
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

  // shields: each generator projects one panel, an arc of the hull ring or a bar on it
  for (const s of e.shields) {
    if (s.r * z < 7) continue;
    const p = s.part;
    const f = clamp(p.shieldHp / Math.max(1, p.shieldMax), 0, 1);
    const hit = p.shieldHit > 2.8 ? 1 : 0;
    const blurry = s.r * z > 12 && s.r * z < 60; // shadows on big shapes are expensive
    const c = Math.cos(s.ang), sn = Math.sin(s.ang);
    /* the generator itself, and the beam of energy it throws out to the panel */
    const link = s.r * 0.55;
    ctx.strokeStyle = `rgba(125,240,255,${0.1 + 0.12 * f})`;
    ctx.lineWidth = 1.2 / z;
    ctx.beginPath();
    ctx.moveTo(e.x + c * link, e.y + sn * link);
    ctx.lineTo(e.x + c * s.r, e.y + sn * s.r);
    ctx.stroke();

    ctx.beginPath();
    if (s.bar) {
      const px = -sn, py = c;
      const bx = e.x + c * s.r, by = e.y + sn * s.r;
      ctx.moveTo(bx - px * s.span, by - py * s.span);
      ctx.lineTo(bx + px * s.span, by + py * s.span);
    } else {
      ctx.arc(e.x, e.y, s.r, s.ang - s.span, s.ang + s.span);
    }
    ctx.strokeStyle = `rgba(70,210,255,${0.1 + 0.14 * f + hit * 0.2})`;
    ctx.lineWidth = (s.thick * 1.6 + hit * 4) / 1;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.strokeStyle = `rgba(150,245,255,${0.4 + 0.5 * f})`;
    ctx.lineWidth = (2 + hit * 3) / z;
    if (blurry) { ctx.shadowColor = "#7df9ff"; ctx.shadowBlur = 12; }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineCap = "butt";
  }
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

function drawMinimap(g: Game, ctx: CanvasRenderingContext2D) {
  const S = Math.min(170, g.w * 0.28);
  const cx = g.w - S / 2 - 14, cy = S / 2 + 14;
  const R = S / 2;
  const k = R / WORLD_R;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
  ctx.fillStyle = "rgba(4,8,20,0.8)"; ctx.fillRect(cx - R, cy - R, S, S);
  const edges = [WORLD_R, ...ZONE_EDGES];
  for (let i = 0; i < edges.length; i++) {
    ctx.fillStyle = RARITIES[i].color + "1c";
    ctx.beginPath(); ctx.arc(cx, cy, edges[i] * k, 0, TAU); ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
  for (const r of ZONE_EDGES) { ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, TAU); ctx.stroke(); }
  // enemies
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  for (const e of g.enemies) ctx.fillRect(cx + e.x * k - 0.8, cy + e.y * k - 0.8, 1.6, 1.6);
  // base
  hexPath(ctx, cx + BASE.x * k, cy + BASE.y * k, 4.5, 0);
  ctx.fillStyle = "#4dffd2"; ctx.fill();
  // view box
  const vw = (g.w / g.cam.z) * k, vh = (g.h / g.cam.z) * k;
  ctx.strokeStyle = "rgba(125,249,255,0.5)";
  ctx.strokeRect(cx + g.cam.x * k - vw / 2, cy + g.cam.y * k - vh / 2, vw, vh);
  for (const o of g.others) { ctx.fillStyle = "#ff7ad9"; ctx.beginPath(); ctx.arc(cx + o.x * k, cy + o.y * k, 2.5, 0, TAU); ctx.fill(); }
  const p = g.player;
  ctx.save(); ctx.translate(cx + p.x * k, cy + p.y * k);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, 0, 4.6, 0, TAU); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 1.7, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
  ctx.strokeStyle = "rgba(125,249,255,0.7)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
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
