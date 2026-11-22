import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://wofgue.io'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Event:dom.window.Event,MouseEvent:dom.window.MouseEvent,requestAnimationFrame:(cb:FrameRequestCallback)=>setTimeout(()=>cb(0),0),IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
(dom.window.HTMLElement.prototype as any).scrollIntoView=()=>{};
class Socket {
 static OPEN=1;static instances:Socket[]=[];readyState=0;sent:string[]=[];
 onopen:(()=>void)|null=null;onclose:(()=>void)|null=null;onerror:(()=>void)|null=null;onmessage:((e:{data:string})=>void)|null=null;
 constructor(readonly url:string){Socket.instances.push(this)}
 send(data:string){this.sent.push(data)} close(){this.readyState=3}
 open(){this.readyState=1;this.onopen?.()} message(data:unknown){this.onmessage?.({data:JSON.stringify(data)})} drop(){this.readyState=3;this.onclose?.()}
}
(globalThis as any).WebSocket=Socket;
const React=await import('react');const {render,fireEvent,screen,act}=await import('@testing-library/react');
const Chat=(await import('./src/components/Chat')).default;
const game={save:{name:'Pilot'},blur:()=>{}} as any;
const mounted=render(React.createElement(Chat,{game,notices:[]}));
try {
 assert(Socket.instances[0].url==='wss://wofgue-io.onrender.com/chat','fallback configures chat when env is absent');
 fireEvent.click(screen.getByRole('button',{name:'Open chat'}));
 await act(async()=>Socket.instances[0].drop());
 const input=screen.getByRole('textbox',{name:'Chat message'}) as HTMLInputElement;
 assert(!input.disabled);assert.equal(input.placeholder,'Press enter or / to open chat');
 input.focus(); assert.equal(dom.window.document.activeElement,input);
 fireEvent.pointerDown(input);assert.equal(dom.window.document.activeElement,input,'clicking the field keeps focus');
 fireEvent.pointerDown(dom.window.document.body);assert.notEqual(dom.window.document.activeElement,input,'clicking outside chat releases focus');
 input.focus();fireEvent.pointerDown(screen.getByRole('button',{name:'SEND'}));assert.notEqual(dom.window.document.activeElement,input,'clicking send releases focus');
 fireEvent.change(input,{target:{value:'Offline hello'}});
 fireEvent.click(screen.getByRole('button',{name:'SEND'}));
 assert(screen.getByText('(queued)'));assert.equal(input.value,'');assert.equal(mounted.container.querySelector('[data-chat-owner=self]')?.textContent?.includes('Offline hello'),true);
 assert(dom.window.localStorage.getItem('wof-chat-outbox-v1')?.includes('Offline hello'));
 await act(async()=>{await new Promise(r=>setTimeout(r,5200));});
 const header=mounted.container.querySelector('[aria-hidden="true"]');assert(header,'chat body fades after inactivity');
 assert(!input.disabled);assert(screen.getByRole('button',{name:'SEND'}));
 // The automatic retry creates a new socket. Its history triggers outbox send.
 const ws=Socket.instances.at(-1)!;
 await act(async()=>{ws.open();ws.message({type:'history',messages:[]});});
 assert.equal(ws.sent.length,0,'old server cannot receive or corrupt queued messages');
 assert(screen.getByText('SERVER UPDATE NEEDED'));
 await act(async()=>ws.message({type:'history',messages:[],protocol:2}));
 assert.equal(ws.sent.length,1);const sent=JSON.parse(ws.sent[0]);assert.equal(sent.text,'Offline hello');
 await act(async()=>ws.message({type:'message',message:{id:'server-1',clientId:sent.clientId,name:'Pilot',text:'Offline hello',time:1}}));
 assert(!screen.queryByText('(queued)'));assert.equal(screen.getByText('Offline hello').getAttribute('data-chat-owner'),'self');
 assert(!mounted.container.querySelector('[aria-hidden="true"]'),'new message reveals expanded chat');
 assert.equal(JSON.parse(dom.window.localStorage.getItem('wof-chat-outbox-v1')!).length,0);
 await act(async()=>ws.message({type:'message',message:{id:'different',clientId:'other-client-id',name:'Pilot',text:'same name',time:1}}));
 assert.equal(screen.getByText('same name').getAttribute('data-chat-owner'),'other','matching names do not impersonate own messages');
 await act(async()=>ws.message({type:'history',messages:[{id:'server-1',clientId:sent.clientId,name:'Pilot',text:'Offline hello',time:1}],protocol:2}));
 assert.equal(screen.getByText('Offline hello').getAttribute('data-chat-owner'),'self','history keeps own colour');
 assert(screen.getByText('Offline hello').className.includes('text-white'));
 input.focus(); fireEvent.keyDown(input,{key:'Enter',code:'Enter'}); assert(screen.getByRole('button',{name:'Open chat'}),'Enter with empty input closes chat');
 fireEvent.keyDown(window,{key:'/',code:'Slash'}); await act(async()=>{await new Promise(r=>setTimeout(r,5));});
 const reopened=screen.getByRole('textbox',{name:'Chat message'});fireEvent.change(reopened,{target:{value:'Enter sends and closes'}});fireEvent.keyDown(reopened,{key:'Enter',code:'Enter'});assert(screen.getByRole('button',{name:'Open chat'}));
 fireEvent.click(screen.getByRole('button',{name:'Open chat'}));
 fireEvent.click(screen.getByRole('button',{name:'Collapse chat'}));
 await act(async()=>ws.message({type:'message',message:{id:'server-2',name:'Other',text:'hello',time:2}}));
 assert(screen.getByRole('button',{name:'Open chat, 1 unread'}),'collapsed chat stays collapsed');
 console.log('Offline send, reconnect delivery, idle fade and new-message wake passed');
} finally {mounted.unmount();dom.window.close();}
