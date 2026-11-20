"use client";

import { useEffect, useRef } from "react";

/*
 * Animated title-screen backdrop: the same 100u/500u neon grid the game draws,
 * plus small geometric insects drifting slowly across the dark. Purely
 * cosmetic — pointer-events are off and nothing is interactive.
 */

type Bug = {
  x: number; y: number; vx: number; vy: number;
  s: number; rot: number; spin: number; hue: number;
  kind: number; phase: number; wob: number;
};

const HUES = [190, 190, 285, 330, 150, 45];
const GRID = 92;

function makeBug(w: number, h: number, spread: boolean): Bug {
  const s = 7 + Math.random() * 15;
  return {
    x: spread ? Math.random() * w : -60 - Math.random() * 120,
    y: Math.random() * h,
    vx: (16 + Math.random() * 34) * (Math.random() < 0.25 ? -1 : 1),
    vy: (Math.random() - 0.5) * 10,
    s,
    rot: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.35,
    hue: HUES[Math.floor(Math.random() * HUES.length)],
    kind: Math.floor(Math.random() * 4),
    phase: Math.random() * Math.PI * 2,
    wob: 0.5 + Math.random() * 1.2,
  };
}

function poly(ctx: CanvasRenderingContext2D, pts: number[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}

function drawBug(ctx: CanvasRenderingContext2D, b: Bug, t: number) {
  const pulse = 0.55 + 0.45 * Math.sin(t * 1.4 + b.phase);
  const alpha = 0.1 + pulse * 0.16;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(b.rot);
  ctx.scale(b.s / 16, b.s / 16);
  const col = `hsla(${b.hue}, 100%, 65%, ${alpha})`;
  ctx.strokeStyle = col;
  ctx.fillStyle = `hsla(${b.hue}, 100%, 60%, ${alpha * 0.35})`;
  ctx.lineWidth = 1.1;
  ctx.lineJoin = "round";
  ctx.shadowColor = col;
  ctx.shadowBlur = 6;

  if (b.kind === 0) {
    // beetle: hex body, head, three legs a side
    poly(ctx, [-10, -7, 2, -9, 11, -4, 11, 4, 2, 9, -10, 7, -13, 0]);
    ctx.fill(); ctx.stroke();
    poly(ctx, [-19, -5, -12, -3, -12, 3, -19, 5]);
    ctx.stroke();
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-6 + i * 6, -8); ctx.lineTo(-9 + i * 6, -16);
      ctx.moveTo(-6 + i * 6, 8); ctx.lineTo(-9 + i * 6, 16);
      ctx.stroke();
    }
  } else if (b.kind === 1) {
    // moth: slim body, two swept wings
    poly(ctx, [-3, -14, 8, -4, 2, 2, -4, 0]);
    ctx.stroke();
    poly(ctx, [-3, 14, 8, 4, 2, -2, -4, 0]);
    ctx.stroke();
    poly(ctx, [-14, -3, 4, -2, 4, 2, -14, 3]);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, 0); ctx.lineTo(-22, -3);
    ctx.moveTo(-14, 0); ctx.lineTo(-22, 3);
    ctx.stroke();
  } else if (b.kind === 2) {
    // centipede: a chain of segments with tick legs
    for (let i = 0; i < 6; i++) {
      const x = -14 + i * 5.5;
      ctx.beginPath();
      ctx.arc(x, Math.sin(t * 3 + b.phase + i * 0.6) * 1.6, 3.2 - i * 0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, -2.5); ctx.lineTo(x - 2, -7);
      ctx.moveTo(x, 2.5); ctx.lineTo(x - 2, 7);
      ctx.stroke();
    }
  } else {
    // mantis: triangle body, long forearms, trailing legs
    poly(ctx, [-12, 0, 8, -7, 14, 0, 8, 7]);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, -2); ctx.lineTo(22, -12); ctx.lineTo(19, -3);
    ctx.moveTo(12, 2); ctx.lineTo(22, 12); ctx.lineTo(19, 3);
    ctx.moveTo(-9, -4); ctx.lineTo(-19, -9);
    ctx.moveTo(-9, 4); ctx.lineTo(-19, 9);
    ctx.stroke();
  }
  ctx.restore();
}

export default function Backdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    let bugs: Bug[] = [];
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      const want = Math.max(7, Math.min(20, Math.round((w * h) / 105000)));
      while (bugs.length < want) bugs.push(makeBug(w, h, true));
      if (bugs.length > want) bugs = bugs.slice(0, want);
    };

    const drawGrid = () => {
      const ox = (t * 7) % GRID;
      const oy = (t * 4) % GRID;
      ctx.lineWidth = 1;
      ctx.strokeStyle = "hsla(190,100%,60%,0.055)";
      ctx.beginPath();
      for (let x = -GRID + ox; x < w + GRID; x += GRID) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = -GRID + oy; y < h + GRID; y += GRID) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      const major = GRID * 5;
      const mx = (t * 7) % major;
      const my = (t * 4) % major;
      ctx.strokeStyle = "hsla(190,100%,62%,0.16)";
      ctx.shadowColor = "hsla(190,100%,60%,0.5)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let x = -major + mx; x < w + major; x += major) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = -major + my; y < h + major; y += major) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const vignette = () => {
      const r = Math.max(w, h) * 0.78;
      const g = ctx.createRadialGradient(w / 2, h * 0.45, r * 0.15, w / 2, h * 0.45, r);
      g.addColorStop(0, "rgba(4,5,12,0)");
      g.addColorStop(0.65, "rgba(4,5,12,0.35)");
      g.addColorStop(1, "rgba(4,5,12,0.92)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#04050c";
      ctx.fillRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.72);
      glow.addColorStop(0, "rgba(77,255,210,0.09)");
      glow.addColorStop(0.45, "rgba(60,140,255,0.04)");
      glow.addColorStop(1, "rgba(4,5,12,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      drawGrid();

      for (const b of bugs) {
        b.x += b.vx * dt;
        b.y += (b.vy + Math.sin(t * b.wob + b.phase) * 9) * dt;
        b.rot += b.spin * dt;
        if (b.vx > 0 && b.x > w + 90) { b.x = -90; b.y = Math.random() * h; }
        if (b.vx < 0 && b.x < -90) { b.x = w + 90; b.y = Math.random() * h; }
        if (b.y < -90) b.y = h + 90;
        if (b.y > h + 90) b.y = -90;
        drawBug(ctx, b, t);
      }

      vignette();
      if (!reduced) raf = requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
