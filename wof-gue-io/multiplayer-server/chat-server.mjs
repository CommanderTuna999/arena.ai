import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

// This service currently hosts chat only. It does not simulate or synchronize combat.
const port = Number(process.env.PORT || 10000);
const allowed = new Set((process.env.ALLOWED_ORIGINS || 'https://wofgue.io,https://www.wofgue.io').split(',').map(s => s.trim()).filter(Boolean));
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('Wofgue chat service is running. Play at https://wofgue.io. This service does not yet host multiplayer combat.');
  }
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    return res.end(JSON.stringify({ ok: true, service: 'chat', multiplayerCombat: false }));
  }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 2048 });
const messages = [];
let seq = 0;
const broadcast = (data) => {
  const encoded = JSON.stringify(data);
  for (const peer of wss.clients) if (peer.readyState === WebSocket.OPEN && peer.bufferedAmount < 65536) peer.send(encoded);
};
server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/chat' || !allowed.has(req.headers.origin || '') || wss.clients.size >= 200) {
    socket.destroy(); return;
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});
wss.on('connection', ws => {
  let last = 0; let alive = true;
  ws.on('pong', () => { alive = true; });
  ws.send(JSON.stringify({ type: 'history', messages }));
  ws.on('message', data => {
    const now = Date.now();
    if (now - last < 1200) return;
    let msg; try { msg = JSON.parse(data.toString()); } catch { return; }
    if (msg?.type !== 'chat' || typeof msg.text !== 'string' || typeof msg.name !== 'string') return;
    const text = msg.text.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 180);
    const name = msg.name.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 16) || 'Pilot';
    if (!text) return;
    last = now;
    const entry = { id: `${seq++}-${randomUUID()}`, name, text, time: now };
    messages.push(entry); if (messages.length > 60) messages.shift();
    broadcast({ type: 'message', message: entry });
  });
  const heartbeat = setInterval(() => {
    if (!alive) { ws.terminate(); return; }
    alive = false; ws.ping();
  }, 30000);
  ws.on('close', () => clearInterval(heartbeat));
  ws.on('error', () => {});
});
server.listen(port, '0.0.0.0', () => console.log(`Chat service listening on ${port}`));
