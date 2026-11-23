/** The actual main-game cannon tree hosted in an isolated guest-only shell.
 * This adapter never calls Game's save or purchase methods; it submits bounded
 * actions to the authoritative disposable server. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import type {Game} from '../../../engine';
import {CANNONS,RARITIES} from '../../../data';
import type {DemoLootItem} from '../../demo-loot';
import {CannonTree} from './cannon-tree';
import {ShipUpgrades} from './ship-upgrades';
import css from './cannon-tree.css';

type PilotView={cannonId:string;levels:Record<string,Record<string,number>>;upgrades:Record<string,number>};
export function createDemoBaseMenu(select:(id:string)=>void,upgrade:(track:string,n:number,cannon:string)=>void,shipUpgrade:(id:string,n:number)=>void,onClose:()=>void) {
  let shadow:ShadowRoot|null=null,root:ReturnType<typeof createRoot>|null=null,view:PilotView|null=null,open=false,last='',tab:'cannon'|'upgrades'|'storage'='cannon',loot:DemoLootItem[]=[];
  const host=document.createElement('div');document.body.appendChild(host);
  function ensure(){if(root)return;shadow=host.attachShadow({mode:'open'});const style=document.createElement('style');style.textContent=css+`\n.overlay{position:fixed;inset:0;z-index:100;background:rgba(2,7,14,.9);color:#d8faff;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,monospace}.panel{width:min(1100px,96vw);height:min(750px,92vh);background:#06131e;border:1px solid #4dd2ff;box-shadow:0 0 24px #157d9a;display:flex;flex-direction:column}.head{display:flex;justify-content:space-between;gap:12px;padding:12px;border-bottom:1px solid #23546b}.head button{cursor:pointer;background:#123241;color:#b9f5ff;border:1px solid #4dd2ff;padding:4px 10px}.scroll{overflow:auto;flex:1;min-height:0}.notice{font-size:11px;color:#bcd3d6;padding:8px 12px}`;shadow.appendChild(style);const target=document.createElement('div');shadow.appendChild(target);root=createRoot(target);}
  function draw(){
    if(!open || !view){root?.render(null);return;}
    ensure();const v=view,levels=v.levels??{};
    const adapter={save:{credits:1e15,upgrades:v.upgrades??{},cannon:{id:v.cannonId,owned:CANNONS.map(c=>c.id),lv:levels}},stats:{cannonId:v.cannonId},admin:{on:true,credits:true,components:true},
      cannonViewLevels:(id:string)=>levels[id]??{},selectCannon:(id:string)=>select(id),buyCannon:(track:string,n:number)=>upgrade(track,n,v.cannonId),buyCannonChassis:()=>null,buy:(id:string,n:number)=>shipUpgrade(id,n)} as unknown as Game;
    root!.render(<div className="overlay"><div className="panel"><div className="head"><span><button onClick={()=>{tab="cannon";draw();}}>CANNON</button> <button onClick={()=>{tab="upgrades";draw();}}>UPGRADES</button> <button onClick={()=>{tab="storage";draw();}}>STORAGE {loot.length}</button></span><button onClick={()=>{open=false;draw();onClose();}}>CLOSE ✕</button></div><div className="notice">Guest test: cannons and supported ship upgrades are free and reset on disconnect.</div><div className="scroll">{tab==='cannon'?<CannonTree game={adapter}/>:tab==='upgrades'?<ShipUpgrades game={adapter}/>:<div style={{padding:12}}><strong>GUEST DROP HISTORY</strong><p>Recent private drops are credited automatically. History resets on disconnect; crafting and pickup are not yet available.</p>{loot.length===0?<p>No drops yet. Defeat enemies to find parts.</p>:<ul>{loot.slice().reverse().map((item,i)=><li key={i} style={{padding:'6px',borderBottom:'1px solid #23546b',color:item.tier===6?'#f2f7ff':RARITIES[item.tier].color}}>{RARITIES[item.tier].name} · {item.name}</li>)}</ul>}</div>}</div></div></div>);
  }
  return {
    isOpen:()=>open,
    setOpen(value:boolean){open=value;last='';draw();},
    update(p:PilotView,items:DemoLootItem[]=[]){view=p;loot=items;const key=JSON.stringify([p.cannonId,p.levels,p.upgrades,items]);if(open && key!==last){last=key;draw();}},
    destroy(){root?.unmount();host.remove();}
  };
}
