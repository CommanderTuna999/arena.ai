import assert from 'node:assert/strict';import { JSDOM } from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://wofgue.io'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
const React=await import('react');const {render,screen,act}=await import('@testing-library/react');const {StorageWarning}=await import('./src/components/StorageWarning');
let view=render(React.createElement(StorageWarning,{count:999}));assert(!screen.queryByRole('status'));view.rerender(React.createElement(StorageWarning,{count:1001}));assert(!screen.queryByRole('status'),'no repeated warnings when inventory grows');view.unmount();
view=render(React.createElement(StorageWarning,{count:1000}));assert(screen.getByRole('status'));await act(async()=>{await new Promise(r=>setTimeout(r,6100));});assert(!screen.queryByRole('status'));view.unmount();
view=render(React.createElement(StorageWarning,{count:1000}));assert(screen.getByRole('status'),'warn again when rejoining');view.unmount();dom.window.close();console.log('Storage warning only appears briefly on entry at the heuristic threshold');
