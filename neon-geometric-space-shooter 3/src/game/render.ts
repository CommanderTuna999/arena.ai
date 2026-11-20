import { TAU, clamp, fmtNum } from "./math";
import { BASE, CAT_NAME, KIND_CAT, RARITIES, SHIP_R, WEAPON_RANGE, WEAPON_TINT, WORLD_R, ZONE_EDGES } from "./data";
import { N_ROPE, type Enemy, type Game, type LComp } from "./engine";

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
    ctx.shadowColor = col; ctx.shadowBlur = 12;
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
    }
    ctx.shadowBlur = 0;
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
    drawShipShape(ctx, "#ff7ad9", 0.85, z);
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

  /* ---- particles ---- */
  for (const q of g.particles) {
    if (q.x < vx0 || q.x > vx1 || q.y < vy0 || q.y > vy1) continue;
    const a = clamp(q.life / q.max, 0, 1);
    ctx.globalAlpha = a;
    ctx.strokeStyle = q.color; ctx.fillStyle = q.color;
    ctx.lineWidth = 1.5 / z;
    const s = q.size * (0.4 + 0.6 * a);
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
  ctx.setLineDash([24 / z, 24 / z]);
  ctx.strokeStyle = "rgba(90,255,170,0.2)"; ctx.lineWidth = 3 / z;
  ctx.beginPath(); ctx.arc(x, y, safe, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);
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
  // pylons
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i / 6) * TAU;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    hexPath(ctx, px, py, 26, t * 0.4 * (i % 2 ? 1 : -1));
    ctx.fillStyle = "rgba(10,40,50,0.95)"; ctx.fill();
    ctx.strokeStyle = "#7df9ff"; ctx.lineWidth = 3 / z; ctx.stroke();
    hexPath(ctx, px, py, 10, 0);
    ctx.fillStyle = "#4dffd2"; ctx.fill();
    // light spokes
    ctx.strokeStyle = "rgba(125,249,255,0.25)"; ctx.lineWidth = 1.5 / z;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
  }
  // minimal nest sigil: a hex with three cells, no lettering
  hexPath(ctx, x, y, 30, 0);
  ctx.strokeStyle = "rgba(125,249,255,0.85)"; ctx.lineWidth = 3 / z; ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i / 3) * TAU;
    hexPath(ctx, x + Math.cos(a) * 12, y + Math.sin(a) * 12, 6, a);
    ctx.fillStyle = "rgba(255,225,77,0.75)"; ctx.fill();
  }
  void g;
}

function drawComp(g: Game, ctx: CanvasRenderingContext2D, c: LComp, z: number, t: number) {
  const col = RARITIES[c.c.tier].color;
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

function drawShipShape(ctx: CanvasRenderingContext2D, color: string, alpha: number, z: number) {
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color; ctx.shadowBlur = 14;
  ctx.fillStyle = "rgba(10,30,45,0.92)"; ctx.strokeStyle = color; ctx.lineWidth = 2.2 / Math.max(z, 0.6);
  ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(21, 0); ctx.lineTo(-12, -13); ctx.lineTo(-6, 0); ctx.lineTo(-12, 13); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-3, -4); ctx.lineTo(-3, 4); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
}

function drawPlayer(g: Game, ctx: CanvasRenderingContext2D, z: number, t: number) {
  const p = g.player, st = g.stats;
  ctx.save();
  ctx.translate(p.x, p.y); ctx.rotate(p.a);
  const sp = Math.hypot(p.vx, p.vy);
  if (sp > 30) {
    const len = 8 + clamp(sp / 40, 0, 20) * (p.boosting ? 2 : 1) + Math.random() * 4;
    ctx.fillStyle = p.boosting ? "rgba(255,170,60,0.9)" : "rgba(125,249,255,0.7)";
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-8 - len, 0); ctx.lineTo(-8, 5); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
  }
  drawShipShape(ctx, p.flash > 0 ? "#ff6b81" : "#7df9ff", 1, z);
  // turrets
  st.weapons.forEach((w, i) => {
    const side = i === 1 ? -1 : 1;
    ctx.fillStyle = w.rid === "pulse" ? "#7dffb4" : w.rid === "missile" ? "#ffb04d" : w.rid === "lance" ? "#e5a8ff" : "#ff9d6e";
    ctx.beginPath(); ctx.arc(2, 12 * side, 3.5, 0, TAU); ctx.fill();
  });
  ctx.restore();
  if (st.shieldMax > 0 && p.shield > 0) {
    const f = p.shield / st.shieldMax;
    ctx.strokeStyle = `rgba(110,230,255,${0.2 + 0.5 * f})`; ctx.lineWidth = 2 / z; ctx.shadowColor = "#7df9ff"; ctx.shadowBlur = 10;
    hexPath(ctx, p.x, p.y, SHIP_R + 14, t * 0.8);
    ctx.stroke(); ctx.fillStyle = `rgba(110,230,255,${0.04 + 0.06 * f})`; ctx.fill(); ctx.shadowBlur = 0;
  }
  if (p.barrier > 0 && p.barrierMax > 0) {
    const f = p.barrier / p.barrierMax;
    ctx.strokeStyle = `rgba(120,220,255,${0.35 + 0.5 * f})`; ctx.lineWidth = 4 / z; ctx.shadowColor = "#4dd2ff"; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(p.x, p.y, SHIP_R + 22 + 3 * Math.sin(t * 8), 0, TAU); ctx.stroke();
    ctx.fillStyle = `rgba(120,220,255,${0.05 + 0.08 * f})`; ctx.fill(); ctx.shadowBlur = 0;
  }
  if (p.overT > 0) {
    ctx.strokeStyle = "rgba(255,225,77,0.7)"; ctx.lineWidth = 2 / z;
    ctx.beginPath(); ctx.arc(p.x, p.y, SHIP_R + 18, 0, TAU); ctx.stroke();
  }
  if (p.tpT > 0) {
    const f = 1 - p.tpT / Math.max(0.1, st.tpTime);
    ctx.strokeStyle = "#c77dff"; ctx.lineWidth = 3 / z; ctx.shadowColor = "#c77dff"; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(p.x, p.y, 34 + 10 * Math.sin(t * 10), -Math.PI / 2, -Math.PI / 2 + TAU * f); ctx.stroke(); ctx.shadowBlur = 0;
  }
}

function drawEnemy(g: Game, ctx: CanvasRenderingContext2D, e: Enemy, z: number, t: number) {
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
  const big = e.radius * z > 60;
  for (const idx of e.order) {
    const p = e.parts[idx];
    if (!p.alive) continue;
    const gr = p.g >= 0 ? e.groups[p.g] : null;
    if (gr && gr.ang !== 0) { ctx.save(); ctx.translate(gr.px, gr.py); ctx.rotate(gr.ang); ctx.translate(-gr.px, -gr.py); }
    const bo = bend(e, p);
    if (bo !== 0) { ctx.save(); ctx.translate(0, bo); }
    polyPath(ctx, p.poly);
    const hf = p.hp / p.maxHp;
    const hurt = p.hurt > 0;
    ctx.globalAlpha = 0.62 + 0.38 * hf;
    ctx.fillStyle = hurt ? "rgba(255,255,255,0.85)" : p.fill;
    ctx.fill();
    if (p.glow) { ctx.shadowColor = p.stroke; ctx.shadowBlur = p.kind === "core" ? 22 : 12; }
    else if (big && p.r * z > 14) { ctx.save(); ctx.globalAlpha = 0.12; ctx.strokeStyle = p.stroke; ctx.lineWidth = lw * 3.2; ctx.stroke(); ctx.restore(); }
    ctx.strokeStyle = hurt ? "#ffffff" : p.stroke;
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

  // armour plating: solid grey layers wrapped around every part outline
  if (e.shells.length) {
    for (let si = e.shells.length - 1; si >= 0; si--) {
      const f = clamp(e.shells[si].hp / Math.max(1, e.shells[si].max), 0, 1);
      const hit = e.shellHit > 0 ? 0.25 : 0;
      const grow = 3 + si * 4.5;
      ctx.fillStyle = `rgba(138,148,162,${0.3 + 0.2 * f + hit * 0.3})`;
      ctx.strokeStyle = `rgba(208,216,226,${0.55 + 0.3 * f + hit})`;
      ctx.lineWidth = 2.6 / z;
      ctx.shadowColor = "#c3ccd6"; ctx.shadowBlur = si === e.shells.length - 1 ? 8 : 0;
      for (const idx of e.order) {
        const p = e.parts[idx];
        if (!p.alive) continue;
        const gr = p.g >= 0 ? e.groups[p.g] : null;
        if (gr && gr.ang !== 0) { ctx.save(); ctx.translate(gr.px, gr.py); ctx.rotate(gr.ang); ctx.translate(-gr.px, -gr.py); }
        const bo = bend(e, p);
        if (bo !== 0) { ctx.save(); ctx.translate(0, bo); }
        const k = 1 + grow / Math.max(1, p.r);
        ctx.beginPath();
        for (let i = 0; i < p.poly.length; i += 2) {
          const vx = p.cx + (p.poly[i] - p.cx) * k;
          const vy = p.cy + (p.poly[i + 1] - p.cy) * k;
          if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (bo !== 0) ctx.restore();
        if (gr && gr.ang !== 0) ctx.restore();
      }
      ctx.shadowBlur = 0;
    }
  }

  // status auras
  if (e.slowT > 0) {
    ctx.strokeStyle = "rgba(255,122,217,0.55)"; ctx.lineWidth = 2 / z;
    ctx.setLineDash([10 / z, 8 / z]); ctx.lineDashOffset = t * 30 / z;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 14, 0, TAU); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
  }
  if (e.melt > 0.05) {
    ctx.strokeStyle = `rgba(120,255,90,${0.15 + 0.35 * Math.min(1, e.melt)})`; ctx.lineWidth = 3 / z;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 6, 0, TAU); ctx.stroke();
  }
  if (e.stun > 0) {
    ctx.strokeStyle = "rgba(255,225,77,0.5)"; ctx.lineWidth = 2 / z;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 20, 0, TAU); ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const an = t * 4 + (k / 3) * TAU;
      ctx.beginPath(); ctx.moveTo(e.x + Math.cos(an) * (e.radius + 12), e.y + Math.sin(an) * (e.radius + 12));
      ctx.lineTo(e.x + Math.cos(an) * (e.radius + 20), e.y + Math.sin(an) * (e.radius + 20)); ctx.stroke();
    }
  }

  // shields
  for (const s of e.shields) {
    const p = s.part;
    const f = p.shieldHp / p.shieldMax;
    const hit = p.shieldHit > 2.8 ? 1 : 0;
    hexPath(ctx, s.x, s.y, s.r, t * 0.3);
    ctx.fillStyle = `rgba(70,210,255,${0.05 + 0.08 * f + hit * 0.12})`; ctx.fill();
    ctx.strokeStyle = `rgba(125,240,255,${0.35 + 0.5 * f})`; ctx.lineWidth = (2 + hit * 3) / z;
    ctx.shadowColor = "#7df9ff"; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
    hexPath(ctx, s.x, s.y, s.r * 0.92, -t * 0.3);
    ctx.strokeStyle = "rgba(125,240,255,0.18)"; ctx.lineWidth = 1 / z; ctx.stroke();
  }
}

function drawBars(g: Game, ctx: CanvasRenderingContext2D, e: Enemy, z: number) {
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
  ctx.save(); ctx.translate(cx + p.x * k, cy + p.y * k); ctx.rotate(p.a);
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3.5, -3.5); ctx.lineTo(-3.5, 3.5); ctx.closePath(); ctx.fill();
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
