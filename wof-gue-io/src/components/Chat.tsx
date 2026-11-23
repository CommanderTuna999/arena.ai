"use client";

import { useEffect, useRef, useState } from 'react';
import type { Game, Toast } from '@/game/engine';
import { ChatOutbox, type QueuedChatMessage } from '@/game/chat-outbox';
import { showChatBubble } from '@/game/chat-bubble';

type Message = { id: string; name: string; text: string; time: number; local?: boolean; clientId?: string };
// This is a public endpoint, not a credential. The fallback also configures
// preview/static builds where a production-only Vercel variable is absent.
const url = process.env.NEXT_PUBLIC_WOF_CHAT_URL || 'wss://wofgue-io.onrender.com/chat';
const messageId = () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID() : `chat_${Date.now()}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
const storage = () => { try { return window.localStorage; } catch { return null; } };
const OWN_MESSAGE_KEY = 'wof-chat-own-ids-v1';
const readOwnIds = (): string[] => {
  try {
    const ids: unknown = JSON.parse(storage()?.getItem(OWN_MESSAGE_KEY) || '[]');
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{8,100}$/.test(id)).slice(-200) : [];
  } catch { return []; }
};

/** Chat is independent of the unfinished multiplayer combat simulation. */
export default function Chat({ game, notices }: { game: Game; notices: Toast[] }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<QueuedChatMessage[]>([]);
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [faded, setFaded] = useState(false);
  const [unread, setUnread] = useState(0);
  const [queueError, setQueueError] = useState('');
  const expandedRef = useRef(false), manuallyCollapsed = useRef(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outbox = useRef<ChatOutbox | null>(null);
  const input = useRef<HTMLInputElement>(null), end = useRef<HTMLDivElement>(null);
  const socket = useRef<WebSocket | null>(null);
  const seen = useRef(new Set<number>());
  const ownIds = useRef(new Set<string>());
  const [status, setStatus] = useState<'offline' | 'connecting' | 'online' | 'updating'>('offline');
  const wake = () => {
    setFaded(false);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => setFaded(true), 5000);
  };
  const open = (focus = false) => {
    manuallyCollapsed.current = false; expandedRef.current = true;
    setExpanded(true); setUnread(0); wake();
    if (focus) requestAnimationFrame(() => input.current?.focus());
  };
  const received = (count: number) => {
    if (!count) return;
    if (expandedRef.current) { wake(); return; }
    if (manuallyCollapsed.current) setUnread(n => n + count);
    else { expandedRef.current = true; setExpanded(true); wake(); }
  };
  useEffect(() => {
    // Canvas mousedown prevents the browser's normal focus change. Blur in the
    // capture phase before that happens, without cancelling the click itself.
    const leaveInput = (event: PointerEvent) => {
      if (input.current && event.target !== input.current && document.activeElement === input.current) input.current.blur();
    };
    document.addEventListener('pointerdown', leaveInput, true);
    return () => document.removeEventListener('pointerdown', leaveInput, true);
  }, []);
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      const target = e.target;
      if (e.defaultPrevented || e.repeat || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey ||
          (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)))) return;
      if (e.key !== '/' && e.key !== 'Enter') return;
      e.preventDefault(); e.stopPropagation(); game.blur();
      open(true);
    };
    window.addEventListener('keydown', shortcut, true);
    return () => window.removeEventListener('keydown', shortcut, true);
  }, [game]);
  useEffect(() => {
    const fresh = notices.filter(n => !seen.current.has(n.id));
    for (const n of fresh) seen.current.add(n.id);
    if (fresh.length) {
      received(fresh.length);
      setMessages(prev => [...prev, ...fresh.map(n => ({ id: `local-${n.id}`, name: 'Local event', text: n.msg, time: Date.now(), local: true }))].slice(-60));
    }
  }, [notices]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages, pending]);
  useEffect(() => {
    const queue = new ChatOutbox(storage()); outbox.current = queue; setPending(queue.list());
    ownIds.current = new Set([...readOwnIds(), ...queue.list().map(m => m.id)]);
    let closed = false, attempted = false, ready = false, protocol = 1, lastSend = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let inFlight: { id: string; at: number } | null = null;
    const acknowledge = (id: string) => {
      const found = queue.acknowledge(id);
      if (found) { setPending(queue.list()); setQueueError(''); }
      if (inFlight?.id === id) inFlight = null;
    };
    const pump = () => {
      const ws = socket.current, now = Date.now(), first = queue.list()[0];
      if (!ready || protocol !== 2 || !ws || ws.readyState !== WebSocket.OPEN || !first || now - lastSend < 1300) return;
      if (inFlight && inFlight.id === first.id && now - inFlight.at < 4000) return;
      try {
        ws.send(JSON.stringify({ type: 'chat', clientId: first.id, name: first.name, text: first.text }));
        inFlight = { id: first.id, at: now }; lastSend = now;
      } catch { /* leave it queued for the next connection */ }
    };
    const interval = setInterval(pump, 500);
    const connect = () => {
      if (closed) return;
      if (!attempted) setStatus('connecting');
      attempted = true; ready = false; protocol = 1; inFlight = null;
      let ws: WebSocket;
      try { ws = new WebSocket(url); } catch { setStatus('offline'); retry = setTimeout(connect, 5000); return; }
      socket.current = ws;
      ws.onopen = () => { if (!closed) setStatus('online'); };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'history' && Array.isArray(data.messages)) {
            protocol = data.protocol === 2 ? 2 : 1; ready = true; if (protocol !== 2) setStatus('updating');
            for (const message of data.messages) if (typeof message?.clientId === 'string') acknowledge(message.clientId);
            setMessages(prev => [...prev.filter(m => m.local), ...data.messages].slice(-60));
            pump();
          }
          if (data.type === 'message' && typeof data.message?.text === 'string' && typeof data.message?.id === 'string') {
            const incoming = data.message as Message;
            const current = queue.list()[0];
            // Protocol 1 servers do not return client IDs; only treat a matching
            // echo as delivered while this connection has that message in flight.
            if (incoming.clientId) acknowledge(incoming.clientId);
            else if (protocol === 1 && current && inFlight?.id === current.id && incoming.name === current.name && incoming.text === current.text) acknowledge(current.id);
            received(1);
            setMessages(prev => prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming].slice(-60));
          }
          if (data.type === 'ack' && typeof data.clientId === 'string') {
            const delivered = queue.list().find(m => m.id === data.clientId);
            acknowledge(data.clientId);
            if (delivered) setMessages(prev => [...prev, { ...delivered, clientId: delivered.id, id: `sent-${delivered.id}` }].slice(-60));
          }
        } catch { /* Ignore malformed frames. */ }
      };
      ws.onclose = () => { if (!closed) { ready = false; setStatus('offline'); retry = setTimeout(connect, 3000); } };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { closed = true; ready = false; clearInterval(interval); if (retry) clearTimeout(retry); if (fadeTimer.current) clearTimeout(fadeTimer.current); socket.current?.close(); socket.current = null; outbox.current = null; };
  }, []);
  const submit = (e: React.SyntheticEvent, close = false) => {
    e.preventDefault(); const clean = text.trim(); if (!clean) { if (close) input.current?.blur(); return; }
    const queue = outbox.current ?? (outbox.current = new ChatOutbox(storage()));
    const id = messageId();
    if (!queue.enqueue(id, game.save.name || 'Pilot', clean, Date.now())) { setQueueError('Queue full; wait for messages to send.'); return; }
    showChatBubble(game, queue.list().find(m => m.id === id)!.text);
    ownIds.current.add(id);
    while (ownIds.current.size > 200) ownIds.current.delete(ownIds.current.values().next().value!);
    try { storage()?.setItem(OWN_MESSAGE_KEY, JSON.stringify([...ownIds.current])); } catch { /* memory-only when storage is blocked */ }
    setPending(queue.list()); setText(''); setQueueError(''); wake();
  };
  if (!expanded) return <button type="button" onClick={() => open(true)} aria-label={`Open chat${unread ? `, ${unread} unread` : ''}`} className="absolute bottom-4 left-4 z-[70] rounded border border-cyan-200/30 bg-[#050e16] px-3 py-2 text-xs font-bold text-cyan-200">CHAT{unread > 0 && <span className="ml-2 rounded-full bg-cyan-300 px-1.5 text-black">{unread}</span>}</button>;
  return <section className="pointer-events-none absolute bottom-4 left-4 z-[70] w-[min(22rem,85vw)] text-xs" aria-label="Chat">
    <div aria-hidden={faded} onMouseMove={wake} onFocus={wake} className={`rounded-t border border-cyan-200/30 bg-[#050e16]/95 p-2 shadow-lg transition-opacity duration-500 ${faded ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'}`}>
      <div className="mb-1 flex justify-between text-[10px] font-bold tracking-widest text-cyan-200/70"><span>CHAT</span><span className="flex items-center gap-2"><span title={status === 'offline' ? 'Connection failed; retrying. Check the website address and network.' : undefined}>{status === 'online' ? 'ONLINE' : status === 'connecting' ? 'CONNECTING' : status === 'updating' ? 'SERVER UPDATE NEEDED' : 'OFFLINE · RETRYING'}</span><button type="button" aria-label="Collapse chat" tabIndex={faded ? -1 : 0} onClick={() => { manuallyCollapsed.current = true; expandedRef.current = false; setExpanded(false); }} className="rounded border border-white/30 px-1 text-white">−</button></span></div>
      <div aria-live="polite" className="h-24 overflow-y-auto break-words text-white/80">
        {messages.map(m => {
          const own = !!m.clientId && ownIds.current.has(m.clientId);
          return <div key={m.id} data-chat-owner={own ? 'self' : m.local ? 'event' : 'other'} className={own ? 'text-white' : undefined}><span className={m.local ? 'font-bold text-yellow-200' : own ? 'font-bold text-white' : 'font-bold text-cyan-200'}>{m.name}: </span>{m.text}</div>;
        })}
        {pending.map(m => <div key={`queued-${m.id}`} data-chat-owner="self" className="text-white"><span className="font-bold text-white">{m.name}: </span>{m.text} <span className="text-yellow-200/80">(queued)</span></div>)}
        <div ref={end} />
      </div>
    </div>
    <form onSubmit={e => submit(e)} onMouseMove={wake} onFocus={wake} className="pointer-events-auto flex gap-1 rounded-b border border-cyan-200/30 bg-[#050e16]/95 p-2">
      <input ref={input} value={text} onChange={e => { setText(e.target.value); setQueueError(''); wake(); }} onFocus={() => { game.blur(); wake(); }} maxLength={180} placeholder="Press enter or / to open chat" onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit(e, true); }} aria-label="Chat message" className="min-w-0 flex-1 rounded border border-white/20 bg-black px-2 py-1 text-white" />
      <button type="submit" disabled={!text.trim()} className="rounded border border-cyan-300/50 px-2 py-1 text-cyan-200 disabled:opacity-40">SEND</button>
    </form>
    {queueError && <p role="alert" className="pointer-events-auto rounded bg-[#050e16] px-2 text-yellow-200">{queueError}</p>}
  </section>;
}
