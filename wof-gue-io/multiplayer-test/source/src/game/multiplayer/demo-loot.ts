import {rollComponentTiers} from '../drop-roll';
import type {Enemy} from '../engine';

export type DemoLootItem={name:string;tier:number;kind:string};
type Plan={pilotId:string;partIds:number[]};
/** Bounded, private guest-only encounter history. Not an inventory, pickup,
 * durable reward, account data or an authorization boundary. */
export class DemoLoot {
  private readonly byPilot=new Map<string,DemoLootItem[]>();
  constructor(private readonly rng:()=>number=Math.random){}
  settle(enemy:Enemy,plans:readonly Plan[],dropChance:(pilot:string)=>number|undefined) {
    for(const plan of plans){
      const chance=dropChance(plan.pilotId);if(chance===undefined)continue; // disconnected guests cannot reclaim
      const result=this.byPilot.get(plan.pilotId)??[];
      for(const id of plan.partIds){const part=enemy.parts.find(p=>p.id===id);if(!part)continue;
        for(const tier of rollComponentTiers(enemy.tier,part.kind,!!enemy.spd.boss,chance,1,this.rng))
          result.push({name:`${enemy.spd.name} ${part.name}`,tier,kind:part.kind});
      }
      if(result.length>100)result.splice(0,result.length-100);
      if(result.length)this.byPilot.set(plan.pilotId,result);
    }
  }
  list(pilot:string):DemoLootItem[]{return (this.byPilot.get(pilot)??[]).map(item=>({...item}));}
  remove(pilot:string){this.byPilot.delete(pilot);}
}
