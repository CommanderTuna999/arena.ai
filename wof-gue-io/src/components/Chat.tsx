"use client";

import { useEffect, useRef, useState } from 'react';
import type { Game, Toast } from '@/game/engine';

type Message = { id: string; name: string; text: string; time: number; local?: boolean };
const url = process.env.NEXT_PUBLIC_WOF_CHAT_URL || '';

/** Online chat is optional until the separate service is configured. Combat remains local. */
export default function Chat({ game, notices }: { game: Game; notices: Toast[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'offline' | 'connecting' | 'online'>('offline');
  const socket = useRef<WebSocket | null>(null);
  const seen = useRef(new Set<number>());
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fresh = notices.filter(n => !seen.current.has(n.id));
    for (const n of fresh) seen.current.add(n.id);
    if (fresh.length) setMessages(prev => [...prev, ...fresh.map(n => ({ id: `local-${n.id}`, name: 'Local event', text: n.msg, time: Date.now(), local: true }))].slice(-60));
  }, [notices]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages]);
  useEffect(() => {
    if (!url) return;
    let closed = false, timer: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      if (closed) return;
      setStatus('connecting');
      let ws: WebSocket;
      try { ws = new WebSocket(url); } catch { setStatus('offline'); return; }
      socket.current = ws;
      ws.onopen = () => setStatus('online');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'history' && Array.isArray(data.messages)) setMessages(prev => [...prev.filter(m => m.local), ...data.messages].slice(-60));
          if (data.type === 'message' && typeof data.message?.text === 'string') setMessages(prev => [...prev, data.message].slice(-60));
        } catch { /* Ignore malformed frames. */ }
      };
      ws.onclose = () => { if (!closed) { setStatus('offline'); timer = setTimeout(connect, 3000); } };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { closed = true; if (timer) clearTimeout(timer); socket.current?.close(); socket.current = null; };
  }, []);
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); const clean = text.trim();
    if (!clean || socket.current?.readyState !== WebSocket.OPEN) return;
    socket.current.send(JSON.stringify({ type: 'chat', text: clean.slice(0, 180), name: game.save.name || 'Pilot' }));
    setText('');
  };
  return <section className="absolute bottom-4 left-4 z-[70] w-[min(22rem,85vw)] rounded border border-cyan-200/30 bg-[#050e16]/95 p-2 text-xs shadow-lg" aria-label="Chat">
    <div className="mb-1 flex justify-between text-[10px] font-bold tracking-widest text-cyan-200/70"><span>CHAT</span><span>{status === 'online' ? 'ONLINE' : status === 'connecting' ? 'CONNECTING' : 'OFFLINE'}</span></div>
    <div aria-live="polite" className="h-24 overflow-y-auto break-words text-white/80">
      {messages.map(m => <div key={m.id}><span className={m.local ? 'font-bold text-yellow-200' : 'font-bold text-cyan-200'}>{m.name}: </span>{m.text}</div>)}
      <div ref={end} />
    </div>
    <form onSubmit={submit} className="mt-1 flex gap-1">
      <input value={text} onChange={e => setText(e.target.value)} onFocus={() => game.blur()} maxLength={180} disabled={status !== 'online'} placeholder={status === 'online' ? 'Message…' : 'Chat server offline'} aria-label="Chat message" className="min-w-0 flex-1 rounded border border-white/20 bg-black px-2 py-1 text-white disabled:opacity-50" />
      <button type="submit" disabled={status !== 'online' || !text.trim()} className="rounded border border-cyan-300/50 px-2 py-1 text-cyan-200 disabled:opacity-40">SEND</button>
    </form>
  </section>;
}
