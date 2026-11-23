/** Read-only demo HUD, using the same gauges as the main game. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {VitalBar} from './vital-bar';
import {CHAIRMAN_SHIELD_MAX} from '../../../chairman';

type View={hp:number;hpMax:number;shield:number;shieldMax:number;cannonId:string;boost:number;hasBoost:boolean;chairman:null|{shield:number;armourActive:boolean;armour:number;armourMax:number;armourBlend:number;armourDispersing:boolean;reload:number;drones:number[]}};
export function createDemoHud(host:HTMLElement){
 const root=createRoot(host);let last='';
 return {
  update(p:View){
   const c=p.cannonId==='chairman'?p.chairman:null;
   const ready=!!c?.armourActive && c.armourBlend>=1 && !c.armourDispersing && c.reload<=0 && c.drones.every(n=>n<=0);
   const key=JSON.stringify([p.hp,p.hpMax,p.shield,p.shieldMax,p.boost,p.hasBoost,c?.shield,c?.armourActive,c?.armour,c?.armourMax,ready]);if(key===last)return;last=key;
   root.render(<div className="demo-vitals">
     <VitalBar kind="health" label="Health" value={p.hp} max={p.hpMax} color="#b7c2cc" />
     {p.shieldMax>0 && <VitalBar kind="shield" label="Shield" value={p.shield} max={p.shieldMax} color="#4dd2ff" />}
     {c && <VitalBar kind="shield" label="Dome" value={c.shield} max={CHAIRMAN_SHIELD_MAX} color="#ff344a" />}
     {c?.armourActive && c.armourMax>0 && <VitalBar kind="health" label="Drone armour" value={c.armour} max={c.armourMax} color="#ff8290" />}
     {ready && <span role="status" aria-label="Drones ready. Left click to disperse." title="Left click to disperse drones" style={{color:'#ff344a',textShadow:'0 0 6px #ff344a'}}>◈</span>}
     {p.hasBoost && <div role="progressbar" aria-label="Afterburner" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0,Math.min(100,p.boost)))} className="demo-boost"><div style={{width:`${Math.max(0,Math.min(100,p.boost))}%`}} /></div>}
   </div>);
  },
  destroy(){root.unmount();}
 };
}
