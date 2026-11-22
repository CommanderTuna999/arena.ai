import assert from 'node:assert/strict';import {drawBarrierTerrain} from './src/game/render';import {MAP_GRID,MAP_CELL,MAP_RADIUS,circleWalkable} from './src/game/world';
let tile:[number,number]|undefined;
for(let y=1;y<MAP_GRID.length-1&&!tile;y++)for(let x=1;x<MAP_GRID.length-1;x++)if(MAP_GRID[y][x]==='0'&&MAP_GRID[y][x-1]==='1'){tile=[x,y];break}
assert(tile);const [x,y]=tile;const lines:number[][]=[];let start:number[]=[];const strokes:any[]=[];const fills:any[]=[];
const ctx:any={save(){},restore(){},beginPath(){},moveTo(a:number,b:number){start=[a,b]},lineTo(a:number,b:number){lines.push([...start,a,b])},stroke(){strokes.push([this.strokeStyle,this.lineWidth])},fillRect(...p:number[]){fills.push([this.fillStyle,...p])}};
drawBarrierTerrain(ctx,x,x,y,y,1,0);const left=x*MAP_CELL-MAP_RADIUS,top=y*MAP_CELL-MAP_RADIUS;
assert(lines.some(p=>p[0]===left&&p[1]===top&&p[2]===left&&p[3]===top+MAP_CELL),'glow follows actual tile boundary');
assert(circleWalkable(left-50,top+MAP_CELL/2,15));assert(!circleWalkable(left-5,top+MAP_CELL/2,15));
assert.equal(strokes.length,3);assert(strokes.every(p=>p[0].startsWith('rgba(255,')));assert.equal(fills[0][0],'#210a12');
console.log('Red barrier edges match walkable terrain boundaries');
