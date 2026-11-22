/** Messages composed offline stay on this device until the chat server echoes
 * them. This is not multiplayer or a guarantee of delivery: users can clear
 * browser storage, and a server restart can forget already-seen message IDs. */
export type QueuedChatMessage = { id: string; name: string; text: string; time: number };
export const CHAT_QUEUE_KEY = 'wof-chat-outbox-v1';
export const CHAT_QUEUE_LIMIT = 50;
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const safe = (s: string, n: number) => s.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
function valid(v: unknown): v is QueuedChatMessage {
  if (!v || typeof v !== 'object') return false;
  const x=v as QueuedChatMessage;
  return typeof x.id==='string' && /^[a-zA-Z0-9_-]{8,100}$/.test(x.id) &&
    typeof x.name==='string' && x.name.length>0 && x.name.length<=16 &&
    typeof x.text==='string' && x.text.length>0 && x.text.length<=180 &&
    Number.isFinite(x.time);
}
export class ChatOutbox {
  private messages: QueuedChatMessage[] = [];
  constructor(private readonly storage: StorageLike | null) {
    try {
      const parsed: unknown = JSON.parse(storage?.getItem(CHAT_QUEUE_KEY) || '[]');
      if (Array.isArray(parsed)) {
        const seen = new Set<string>();
        this.messages = parsed.filter(valid).filter(m => {if (seen.has(m.id)) return false; seen.add(m.id); return true;}).slice(-CHAT_QUEUE_LIMIT);
      }
    } catch { /* Storage may be blocked or corrupted; keep a memory-only queue. */ }
  }
  list(): QueuedChatMessage[] { return this.messages.map(m=>({...m})); }
  enqueue(id: string, name: string, text: string, time: number): boolean {
    const message={id,name:safe(name,16)||'Pilot',text:safe(text,180),time};
    if (!valid(message) || this.messages.length>=CHAT_QUEUE_LIMIT || this.messages.some(m=>m.id===id)) return false;
    this.messages.push(message);this.persist();return true;
  }
  acknowledge(id: string): boolean {
    const index=this.messages.findIndex(m=>m.id===id);if(index<0)return false;
    this.messages.splice(index,1);this.persist();return true;
  }
  private persist() { try { this.storage?.setItem(CHAT_QUEUE_KEY,JSON.stringify(this.messages)); } catch { /* memory-only */ } }
}
