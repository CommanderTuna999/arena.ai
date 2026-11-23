import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://wofgue.io'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Event:dom.window.Event,MouseEvent:dom.window.MouseEvent,IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
const React=await import('react');const {render,fireEvent,screen}=await import('@testing-library/react');
const {CannonTree}=await import('./src/components/GameClient');const {Game}=await import('./src/game/engine');const {newSave,CANNONS}=await import('./src/game/data');
const game=new Game(newSave(),'ui');const view=render(React.createElement(CannonTree,{game}));
try {
 assert(screen.getByText('CANNON TREE'));for(const c of CANNONS){const el=screen.getByText(c.name);assert(!el.className.includes('truncate'),`${c.name} must not truncate`);}
 assert(!screen.queryByText(/BRANCH ·/));
 fireEvent.click(screen.getByRole('button',{name:/Stinger.*FITTED/i}));assert(screen.getByText(/BRANCH · STINGER/i));assert(!screen.queryByText('CANNON TREE'));assert(screen.getByRole('button',{name:/BACK TO CANNON TREE/}));
 fireEvent.click(screen.getByRole('button',{name:/BACK TO CANNON TREE/}));game.setAdmin('on',true);game.setAdmin('credits',true);game.setAdmin('components',true);game.save.credits=0;view.rerender(React.createElement(CannonTree,{game}));
 fireEvent.click(screen.getByRole('button',{name:/Scatter MK1.*ADMIN TEST/i}));assert.equal(game.stats.cannonId,'scattermk1');assert(screen.getByText(/Admin test fit/));const build=screen.getByRole('button',{name:'BUILD PERMANENTLY'}) as HTMLButtonElement;assert(!build.disabled);fireEvent.click(build);assert(game.save.cannon.owned.includes('scattermk1'));assert.equal(game.save.credits,0);assert(!screen.queryByText(/Admin test fit/));
 console.log('Full tree, full upgrade page, unshortened labels and free admin purchase verified');
}finally{view.unmount();dom.window.close();}
