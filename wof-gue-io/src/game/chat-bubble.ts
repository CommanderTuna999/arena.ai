/** Local, cosmetic chat bubbles. The global chat service does not identify
 * world entities, so do not attach messages from other senders to a ship by
 * display name. Future multiplayer can feed verified pilot identities here. */
type Bubble = { text: string; started: number };
const bubbles = new WeakMap<object, Bubble>();
export const CHAT_BUBBLE_HOLD_MS = 2000;
export const CHAT_BUBBLE_FADE_MS = 3000;
export function showChatBubble(owner: object, text: string, now = Date.now()): void {
  const clean = text.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 180);
  if (clean && Number.isFinite(now)) bubbles.set(owner, { text: clean, started: now });
}
export function chatBubbleAt(owner: object, now = Date.now()): { text: string; alpha: number; progress: number } | null {
  const bubble = bubbles.get(owner);
  if (!bubble || !Number.isFinite(now)) return null;
  const age = Math.max(0, now - bubble.started), duration = CHAT_BUBBLE_HOLD_MS + CHAT_BUBBLE_FADE_MS;
  if (age >= duration) { bubbles.delete(owner); return null; }
  return { text: bubble.text, alpha: Math.min(1, (duration - age) / CHAT_BUBBLE_FADE_MS), progress: age / duration };
}
/** Wrap on spaces where possible and split long unbroken words safely. */
export function wrapChatBubble(text: string, measure: (text: string) => number, maxWidth: number): string[] {
  const lines: string[] = []; let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const joined = line ? `${line} ${word}` : word;
    if (measure(joined) <= maxWidth) { line = joined; continue; }
    if (line) { lines.push(line); line = ''; }
    for (const char of Array.from(word)) {
      if (line && measure(line + char) > maxWidth) { lines.push(line); line = ''; }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}
/** Called in world space after player and enemy bars. Font, border and offset
 * stay in screen pixels while the anchor follows the player and camera. */
export function drawChatBubble(ctx: CanvasRenderingContext2D, owner: object, x: number, y: number, zoom: number, viewWidth: number, now = Date.now()): void {
  const bubble = chatBubbleAt(owner, now);
  if (!bubble || !Number.isFinite(zoom) || zoom <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1 / zoom, 1 / zoom);
  ctx.globalAlpha = bubble.alpha;
  ctx.font = '600 13px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const maxTextWidth = Math.max(80, Math.min(246, viewWidth - 56));
  const lines = wrapChatBubble(bubble.text, s => ctx.measureText(s).width, maxTextWidth);
  const lineHeight = 18, padX = 13, padY = 10;
  const width = Math.max(56, Math.min(maxTextWidth, Math.max(...lines.map(s => ctx.measureText(s).width))) + padX * 2);
  const height = lines.length * lineHeight + padY * 2;
  const left = -width / 2, bottom = -Math.max(32, 15 * zoom + 18) - bubble.progress * 7;
  const top = bottom - height, right = left + width, cut = 8;
  ctx.shadowColor = 'rgba(80,225,255,0.38)'; ctx.shadowBlur = 12;
  ctx.fillStyle = 'rgba(4,15,25,0.94)'; ctx.strokeStyle = 'rgba(124,239,255,0.85)'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(left + cut, top); ctx.lineTo(right - cut, top); ctx.lineTo(right, top + cut);
  ctx.lineTo(right, bottom - cut); ctx.lineTo(right - cut, bottom); ctx.lineTo(7, bottom);
  ctx.lineTo(0, bottom + 7); ctx.lineTo(-7, bottom); ctx.lineTo(left + cut, bottom);
  ctx.lineTo(left, bottom - cut); ctx.lineTo(left, top + cut); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0; ctx.fillStyle = '#7df9ff'; ctx.fillRect(left + 12, top + 4, Math.min(32, width - 24), 2);
  ctx.fillStyle = '#f2fdff';
  lines.forEach((line, i) => ctx.fillText(line, left + padX, top + padY + lineHeight * (i + 0.5)));
  ctx.restore();
}
