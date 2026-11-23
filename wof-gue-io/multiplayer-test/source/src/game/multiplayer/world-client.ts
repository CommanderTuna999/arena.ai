import { parseInput, type PlayerInput } from './input';
import {CANNON_BY_ID} from '../data';
import { SnapshotBuffer, type RenderBody } from './snapshot-buffer';
import { unpackGeometry, type Geometry } from './demo-geometry';

type Body = RenderBody & { [key: string]: unknown };
type View = { time: number; pilots: Body[]; enemies: Body[]; [key: string]: unknown };
type WireSocket = Pick<WebSocket, 'readyState' | 'send' | 'close' | 'onopen' | 'onmessage' | 'onerror' | 'onclose'>;
type SocketFactory = (url: string) => WireSocket;
export type WorldClientState = 'idle' | 'connecting' | 'authenticating' | 'online' | 'closed';

/** Experimental authenticated client for the loopback test service only.
 * Never use in the shipped game: public TLS service, account ticket issuance,
 * complete snapshots, interpolation/rendering integration, reconnection,
 * secure saves and authoritative combat remain unfinished. */
export class ExperimentalWorldClient {
  state: WorldClientState = 'idle';
  pilotId: string | null = null;
  private socket: WireSocket | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastSequence = -1;
  private inputSequence = -1;
  private latestView: View | null = null;
  private geometry: Geometry = new Map();
  private readonly pilotFrames: SnapshotBuffer<Body>;
  private readonly enemyFrames: SnapshotBuffer<Body>;
  private readonly bulletFrames = new SnapshotBuffer<Body>(32,true);
  private readonly projectileFrames = new SnapshotBuffer<Body>(32,true);
  constructor(private readonly factory: SocketFactory = url => new WebSocket(url), private readonly timeoutMs = 5000, private readonly demoOrigin?: string, private readonly compactHistory = false) {
    this.pilotFrames = new SnapshotBuffer<Body>(32, compactHistory);
    this.enemyFrames = new SnapshotBuffer<Body>(32, compactHistory);
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw new Error('Invalid handshake timeout');
  }
  connect(url: string, ticket: string): void {
    if (this.state !== 'idle' || typeof ticket !== 'string' || ticket.length < 1 || ticket.length > 1024) throw new Error('Invalid connection');
    const endpoint = new URL(url);
    // Only loopback is permitted in this prototype, even if an attacker can
    // influence configuration. The real deployment needs an audited TLS URL.
    const loopback = endpoint.protocol === 'ws:' && ['127.0.0.1','localhost','[::1]'].includes(endpoint.hostname);
    const socketOrigin = `${endpoint.protocol === 'wss:' ? 'https:' : 'http:'}//${endpoint.host}`;
    const sameOriginDemo = !!this.demoOrigin && socketOrigin === this.demoOrigin && ['ws:', 'wss:'].includes(endpoint.protocol);
    if ((!loopback && !sameOriginDemo) || endpoint.username || endpoint.password || endpoint.pathname !== '/world' || endpoint.search || endpoint.hash) throw new Error('Experimental client requires loopback or same-origin demo');
    this.state = 'connecting';
    let socket: WireSocket;
    try { socket = this.factory(url); } catch (error) { this.state = 'closed'; throw error; }
    this.socket = socket;
    this.timer = setTimeout(() => this.disconnect(), this.timeoutMs);
    socket.onopen = () => {
      if (this.socket !== socket || this.state !== 'connecting') return;
      this.state = 'authenticating';
      try { socket.send(JSON.stringify({ type:'authenticate', ticket })); } catch { this.disconnect(); }
    };
    socket.onmessage = event => {
      if (this.socket !== socket || typeof event.data !== 'string' || event.data.length > 2_000_000) return;
      let data: any; try { data=JSON.parse(event.data); } catch { return; }
      if (this.state === 'authenticating' && data?.type === 'welcome' && typeof data.pilotId === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(data.pilotId)) {
        this.pilotId=data.pilotId; this.state='online'; if (this.timer) clearTimeout(this.timer); this.timer=null; return;
      }
      if (this.state !== 'online' || data?.type !== 'world-snapshot' || !Number.isSafeInteger(data.sequence) || data.sequence <= this.lastSequence || !data.world || typeof data.world !== 'object') return;
      const unpacked = data.geometryCache === 1 ? unpackGeometry(data.world, this.geometry) : null;
      if (data.geometryCache === 1 && !unpacked) { this.disconnect(); return; }
      const world=(unpacked?.world ?? data.world) as View;
      if (!Array.isArray(world.pilots) || !Array.isArray(world.enemies) || !world.pilots.some(p=>p?.id===this.pilotId)) return;
      // Only bounded, finite visual beam data can enter the canvas renderer.
      if (world.beams !== undefined && (!Array.isArray(world.beams) || world.beams.length>512 || world.beams.some((b:any)=>!b || !Number.isSafeInteger(b.id) || b.id<1 || ![b.x1,b.y1,b.x2,b.y2,b.createdAt,b.expiresAt].every(Number.isFinite) || b.expiresAt<=b.createdAt || b.expiresAt-b.createdAt>1 || (b.color!==undefined && (typeof b.color!=='string' || b.color.length>80)) || (b.width!==undefined && (!Number.isFinite(b.width) || b.width<=0 || b.width>1000))))) return;
      // Validate both sets before mutating either history: a malformed snapshot
      // must not advance the stream or create inconsistent animation buffers.
      const compact = (b: Body): Body => ({id:b.id, x:b.x, y:b.y, angle:b.angle});
      const pilots={sequence:data.sequence,time:world.time,bodies:this.compactHistory ? world.pilots.map(compact) : world.pilots};
      const enemies={sequence:data.sequence,time:world.time,bodies:this.compactHistory ? world.enemies.map(compact) : world.enemies};
      const projectileBody = (v: any): Body => ({id:v?.id,x:v?.x,y:v?.y,angle:0});
      if (!Array.isArray(world.bullets) || !Array.isArray(world.enemyProjectiles)) return;
      const bullets={sequence:data.sequence,time:world.time,bodies:world.bullets.map(projectileBody)};
      const shots={sequence:data.sequence,time:world.time,bodies:world.enemyProjectiles.map(projectileBody)};
      if (!SnapshotBuffer.valid(pilots) || !SnapshotBuffer.valid(enemies) || !SnapshotBuffer.valid(bullets) || !SnapshotBuffer.valid(shots)) return;
      if (this.latestView && world.time <= this.latestView.time) return;
      if (!this.pilotFrames.push(pilots) || !this.enemyFrames.push(enemies) || !this.bulletFrames.push(bullets) || !this.projectileFrames.push(shots)) { this.disconnect(); return; }
      if (unpacked) this.geometry = unpacked.cache;
      this.lastSequence=data.sequence; this.latestView=this.compactHistory ? world : structuredClone(world);
    };
    socket.onerror = () => this.disconnect();
    socket.onclose = () => { if (this.socket === socket) this.disconnect(); };
  }
  /** Demo-only selection; actual equipment always comes from server snapshots. */
  equipDemoCannon(cannon: string): boolean {
    if (this.state !== 'online' || !this.socket || this.socket.readyState !== 1 || !Object.hasOwn(CANNON_BY_ID,cannon)) return false;
    try {this.socket.send(JSON.stringify({type:'demo-equip',cannon}));return true;} catch {this.disconnect();return false;}
  }
  upgradeDemoCannon(track:string,count:number,cannon:string):boolean {
    if(this.state!=='online'||!this.socket||this.socket.readyState!==1||typeof track!=='string'||!Object.hasOwn(CANNON_BY_ID,cannon)||!Number.isSafeInteger(count)||count<1||count>30)return false;
    try{this.socket.send(JSON.stringify({type:'demo-upgrade',track,count,cannon}));return true;}catch{this.disconnect();return false;}
  }
  sendViewport(width: number, height: number): boolean {
    if (this.state !== 'online' || !this.socket || this.socket.readyState !== 1 ||
        !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || width > 8192 || height > 8192) return false;
    try { this.socket.send(JSON.stringify({type:'viewport',width,height})); return true; } catch { this.disconnect(); return false; }
  }
  sendInput(frame: unknown): boolean {
    if (this.state !== 'online' || !this.socket || this.socket.readyState !== 1) return false;
    const input: PlayerInput | null = parseInput(frame,this.inputSequence);
    if (!input) return false;
    try { this.socket.send(JSON.stringify({ type:'input',frame:input })); this.inputSequence=input.seq; return true; } catch { this.disconnect(); return false; }
  }
  /** Read-only reference for the isolated renderer. Do not mutate it; no
   * per-frame copy of megabytes of static enemy geometry. */
  renderSnapshot(): Readonly<View> | null { return this.latestView; }
  snapshot(): View | null { return this.latestView ? structuredClone(this.latestView) : null; }
  sample(time: number): { pilots: Body[]; enemies: Body[]; bullets: Body[]; enemyProjectiles: Body[] } { return { pilots:this.pilotFrames.sample(time), enemies:this.enemyFrames.sample(time), bullets:this.bulletFrames.sample(time), enemyProjectiles:this.projectileFrames.sample(time) }; }
  disconnect(): void {
    if (this.timer) clearTimeout(this.timer); this.timer=null;
    const socket=this.socket; this.socket=null; this.state='closed';
    if (socket) { socket.onopen=null; socket.onmessage=null; socket.onerror=null; socket.onclose=null; try { socket.close(); } catch {} }
  }
}
