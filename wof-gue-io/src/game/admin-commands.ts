import { BASE, RARITIES } from './data';
import { SPECIES_LIST } from './enemies';
import type { Game } from './engine';
import { localAdminState, setLocalAdmin } from './local-admin';

/** Changes the current pilot's saved unlocks, including Ultra entries. */
export function adminBestiary(game:Game,action:'fill'|'clear'):string {
  if(!game.admin.on)return 'Enable local admin mode in the panel first.';
  if(action!=='fill' && action!=='clear')return 'Usage: /bestiary fill or /bestiary clear.';
  game.save.bestiary=action==='fill' ? Object.fromEntries(SPECIES_LIST.map(s=>[s.id,RARITIES.length-1])) : {};
  game.markDirty();
  return action==='fill' ? 'Bestiary filled.' : 'Bestiary cleared.';
}

/** Local test commands. This is not authentication or a multiplayer authority. */
export function adminNumber(text:string, allowSuffix=false):number | null {
  if (/^inf(?:inity)?$/i.test(text)) return Infinity;
  const match=text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))([kmbt]?)$/i);
  if(!match || (!allowSuffix && match[2]))return null;
  const n=Number(match[1])*({k:1e3,m:1e6,b:1e9,t:1e12}[match[2].toLowerCase()] ?? 1);
  return Number.isFinite(n)?n:null;
}
export function spawnSuggestions(text:string):string[] {
  const m=text.match(/^\/spawn(?:\s+(.*))?$/i);if(!m)return [];
  const q=(m[1]??'').trim().toLowerCase();
  return SPECIES_LIST.filter(s=>s.name.toLowerCase().includes(q)||s.id.toLowerCase().includes(q)).slice(0,8).map(s=>`/spawn ${s.name} `);
}
export function runAdminCommand(game:Game,text:string,openPanel:()=>void,requestVerification:()=>void=()=>{}):string {
  const parts=text.trim().split(/\s+/), cmd=parts[0].toLowerCase();
  if(cmd==='/help' && parts.length===1){openPanel();return 'Admin panel opened.';}
  if(cmd==='/op'||cmd==='/unop'){
    if(parts.length!==1)return 'Only your own browser-local admin can be changed.';
    if(cmd==='/op'&&!localAdminState(game.pid)?.verified){requestVerification();return 'Enter the tester ID to enable local admin.';}
    if(!setLocalAdmin(game.pid,cmd==='/op'))return 'Browser storage is unavailable; local admin could not be saved.';
    game.setAdmin('on',cmd==='/op');return cmd==='/op'?'Browser-local admin enabled.':'Browser-local admin disabled.';
  }
  if(!game.admin.on)return 'Enable local admin mode in the panel first.';
  if(cmd==='/bestiary') {
    const action=parts[1]?.toLowerCase();
    if(parts.length!==2 || (action!=='fill' && action!=='clear'))return 'Usage: /bestiary fill or /bestiary clear.';
    return adminBestiary(game,action);
  }
  if(cmd==='/tp' && parts.length===1){openPanel();return 'Choose a destination on the admin map.';}
  if(cmd==='/home' && parts.length===1){game.adminTeleport(BASE.x,BASE.y-180);return 'Teleported to base.';}
  if(cmd==='/testmap' && parts.length===1){if(!game.admin.sandbox)game.adminTestRange(true);return 'Testing map ready.';}
  if((cmd==='/health'||cmd==='/damage') && parts.length===2){
    const n=adminNumber(parts[1]);if(n===null||n<=0||n>1e12&&n!==Infinity)return 'Enter a positive multiplier (up to 1 trillion) or inf.';
    game.adminMultiplier(cmd==='/health'?'health':'damage',n);return `${cmd.slice(1)} multiplier: ${n===Infinity?'infinite':n}.`;
  }
  if(cmd==='/cr'){
    if(parts.length!==2)return 'Usage: /cr amount (other-player credits are not available yet).';
    const n=adminNumber(parts[1],true);
    if(n===Infinity){game.setAdmin('credits',true);return 'Infinite credit purchases enabled (saved credit balance remains finite).';}
    if(n===null||!Number.isFinite(n)||!Number.isFinite(n+game.save.credits)||Math.abs(n+game.save.credits)>Number.MAX_SAFE_INTEGER||n+game.save.credits<0)return 'Credits must leave a non-negative, safe balance; use k, m, b or t.';
    game.adminCredits(n);return `Credits: ${game.save.credits}.`;
  }
  if(cmd==='/spawn' && parts.length>=3){
    const rarity=parts.at(-1)!.toLowerCase(), name=parts.slice(1,-1).join(' ').toLowerCase();
    const tier=RARITIES.findIndex(r=>r.id.toLowerCase()===rarity||r.name.toLowerCase()===rarity);
    const species=SPECIES_LIST.findIndex(s=>s.id.toLowerCase()===name||s.name.toLowerCase()===name);
    if(species<0||tier<0)return 'Usage: /spawn enemy rarity. Select an enemy suggestion and enter a rarity.';
    const made=game.adminSpawn(species,tier,1);return made ? `Spawned ${RARITIES[tier].name} ${SPECIES_LIST[species].name}.` : 'Spawn limit reached. Try /testmap or clear enemies in the panel.';
  }
  return 'Unknown command or invalid arguments. Use /help for the admin panel.';
}
