import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const dom=new JSDOM('<html><body></body></html>',{url:'https://wofgue.io'});Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,HTMLElement:dom.window.HTMLElement,Event:dom.window.Event,MouseEvent:dom.window.MouseEvent,requestAnimationFrame:(cb:FrameRequestCallback)=>setTimeout(()=>cb(0),0),IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});(dom.window.HTMLElement.prototype as any).scrollIntoView=()=>{};
class Socket {static OPEN=1;readyState=0;onopen=null;onclose=null;onerror=null;onmessage=null;constructor(_:string){}close(){}};(globalThis as any).WebSocket=Socket;
const React=await import('react');const {render,screen,fireEvent}=await import('@testing-library/react');const Chat=(await import('./src/components/Chat')).default;
const game:any={pid:'pilot',save:{name:'Pilot'},admin:{on:false},blur(){},setAdmin(_:string,on:boolean){this.admin.on=on;}};
const app=render(React.createElement(Chat,{game,notices:[]}));try{
 fireEvent.click(screen.getByRole('button',{name:'Open chat'}));const input=screen.getByLabelText('Chat message');fireEvent.change(input,{target:{value:'/op'}});fireEvent.click(screen.getByRole('button',{name:'SEND'}));assert(screen.getByRole('dialog'));assert(screen.getByText('Enter tester ID'));
 fireEvent.change(screen.getByLabelText('Tester ID'),{target:{value:'incorrect'}});fireEvent.click(screen.getByText('VERIFY'));assert(screen.getByRole('alert'));assert.equal(game.admin.on,false);
 fireEvent.change(screen.getByLabelText('Tester ID'),{target:{value:'1123581321345589'}});fireEvent.click(screen.getByText('VERIFY'));assert.equal(game.admin.on,true);assert.equal(screen.queryByRole('dialog'),null);
 fireEvent.change(input,{target:{value:'/unop'}});fireEvent.click(screen.getByRole('button',{name:'SEND'}));assert.equal(game.admin.on,false);
 fireEvent.change(input,{target:{value:'/op'}});fireEvent.click(screen.getByRole('button',{name:'SEND'}));assert.equal(game.admin.on,true);assert.equal(screen.queryByRole('dialog'),null);
}finally{app.unmount();dom.window.close();}console.log('Chat tester-ID dialog, verify, unop and re-op passed');
