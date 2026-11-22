"use client";

import { useEffect, useRef, useState } from 'react';
import type { Game, Toast } from '@/game/engine';

type Message = { id: string; name: string; text: string; time: number; local?: boolean };
const url = process.env.NEXT_PUBLIC_WOF_CHAT_URL || '';

/** Online chat is optional until the separate service is configured. Combat remains local. */
export default function Chat({ game, notices }: { game: Game; notices: Toast[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [unread, setUnread] = useState(0);
  const expandedRef = useRef(false);
  const manuallyCollapsed = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const open = (focus = false) => {
    manuallyCollapsed.current = false; expandedRef.current = true;
    setExpanded(true); setUnread(0);
    if (focus) requestAnimationFrame(() => input.current?.focus());
  };
  const received = (count: number) => {
    if (expandedRef.current || !count) return;
    if (manuallyCollapsed.current) setUnread(n => n + count);
    else { expandedRef.current = true; setExpanded(true); }
  };
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      const target = e.target;
      if (e.defaultPrevented || e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey ||
          (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)))) return;
      if (e.key !== '/' && e.key !== 'Enter') return;
      e.preventDefault(); e.stopPropagation(); game.blur(); open(true);
    };
    window.addEventListener('keydown', shortcut, true);
    return () => window.removeEventListener('keydown', shortcut, true);
  }, [game]);
  const [status, setStatus] = useState<'offline' | 'connecting' | 'online'>('offline');
  const socket = useRef<WebSocket | null>(null);
  const seen = useRef(new Set<number>());
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fresh = notices.filter(n => !seen.current.has(n.id));
    for (const n of fresh) seen.current.add(n.id);
    if (fresh.length) received(fresh.length);
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
          if (data.type === 'message' && typeof data.message?.text === 'string') { received(1); setMessages(prev => [...prev, data.message].slice(-60)); }
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
  if (!expanded) return <button type="button" onClick={() => open(true)} aria-label={`Open chat${unread ? `, ${unread} unread` : ''}`} className="absolute bottom-4 left-4 z-[70] rounded border border-cyan-200/30 bg-[#050e16] px-3 py-2 text-xs font-bold text-cyan-200">CHAT{unread > 0 && <span className="ml-2 rounded-full bg-cyan-300 px-1.5 text-black">{unread}</span>}</button>;
  return <section className="absolute bottom-4 left-4 z-[70] w-[min(22rem,85vw)] rounded border border-cyan-200/30 bg-[#050e16]/95 p-2 text-xs shadow-lg" aria-label="Chat">
    <div className="mb-1 flex justify-between text-[10px] font-bold tracking-widest text-cyan-200/70"><span>CHAT</span><span className="flex items-center gap-2"><span>{status === 'online' ? 'ONLINE' : status === 'connecting' ? 'CONNECTING' : 'OFFLINE'}</span><button type="button" aria-label="Collapse chat" onClick={() => { manuallyCollapsed.current = true; expandedRef.current = false; setExpanded(false); }} className="rounded border border-white/30 px-1 text-white">−</button></span></div>
    <div aria-live="polite" className="h-24 overflow-y-auto break-words text-white/80">
      {messages.map(m => <div key={m.id}><span className={m.local ? 'font-bold text-yellow-200' : 'font-bold text-cyan-200'}>{m.name}: </span>{m.text}</div>)}
      <div ref={end} />
    </div>
    <form onSubmit={submit} className="mt-1 flex gap-1">
      <input ref={input} value={text} onChange={e => setText(e.target.value)} onFocus={() => game.blur()} maxLength={180} disabled={status !== 'online'} placeholder={status === 'online' ? 'Message…' : 'Chat server offline'} aria-label="Chat message" className="min-w-0 flex-1 rounded border border-white/20 bg-black px-2 py-1 text-white disabled:opacity-50" />
      <button type="submit" disabled={status !== 'online' || !text.trim()} className="rounded border border-cyan-300/50 px-2 py-1 text-cyan-200 disabled:opacity-40">SEND</button>
    </form>
  </section>;
}
