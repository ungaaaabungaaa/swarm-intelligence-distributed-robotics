const EPS=1e-9;
const DIRECTIONS=[[0,-1],[1,0],[0,1],[-1,0]];
const fail=message=>{throw new Error(message);};
const key=(x,y,width)=>y*width+x;
const centre=(index,width)=>[index%width+.5,Math.floor(index/width)+.5];
const cell=(point,width)=>key(Math.floor(point[0]),Math.floor(point[1]),width);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function integer(value,min,max,name){if(!Number.isInteger(value)||value<min||value>max)fail(`${name} must be an integer from ${min} to ${max}.`);return value;}
function finite(value,min,max,name){if(!Number.isFinite(value)||value<min||value>max)fail(`${name} must be from ${min} to ${max}.`);return value;}
export function validateConfig(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('Configuration must be an object.');
 const allowed=['world','policy','seed','robots','ticks','sensorRadius','communicationRadius','radius','target','dt','starts'];
 if(Object.keys(input).some(name=>!allowed.includes(name)))fail('Unknown configuration field.');
 const world=input.world;
 if(!Array.isArray(world)||world.length<3||world.length>40||typeof world[0]!=='string'||world[0].length<3||world[0].length>40||world.some(row=>typeof row!=='string'||row.length!==world[0].length||!/^[.#]+$/.test(row)))fail('World must be a 3–40 cell rectangle of . and # characters.');
 const config={world:[...world],policy:input.policy??'gossip',seed:integer(input.seed??42,0,4294967295,'seed'),robots:integer(input.robots??6,1,16,'robots'),ticks:integer(input.ticks??400,1,1000,'ticks'),sensorRadius:integer(input.sensorRadius??3,1,8,'sensorRadius'),communicationRadius:finite(input.communicationRadius??6,0,20,'communicationRadius'),radius:finite(input.radius??.25,.1,.45,'radius'),target:finite(input.target??.95,.1,1,'target'),dt:finite(input.dt??1,.1,10,'dt')};
 if(!['random','frontier','gossip'].includes(config.policy))fail('Policy must be random, frontier, or gossip.');
 const width=world[0].length;
 if(config.robots*config.ticks*width*world.length>10000000||config.robots**2*config.ticks*width*world.length>80000000)fail('Configuration exceeds the bounded simulation work limit.');
 const free=[];for(let y=0;y<world.length;y++)for(let x=0;x<width;x++)if(world[y][x]==='.')free.push([x+.5,y+.5]);
 if(free.length<config.robots)fail('There are not enough free cells for the robots.');
 if(input.starts!==undefined){
  if(!Array.isArray(input.starts)||input.starts.length!==config.robots)fail('Starts must contain one centre per robot.');
  config.starts=input.starts.map(point=>{
   if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||point.some(value=>value%1!==.5)||!segmentClear(world,point,point,config.radius))fail('Starts must be valid free cell centres.');
   return [...point];
  });
  for(let i=0;i<config.starts.length;i++)for(let j=0;j<i;j++)if(distance(config.starts[i],config.starts[j])<=2*config.radius+EPS)fail('Robot starts overlap.');
 }else{
  const placement=random((config.seed^0x9e3779b9)>>>0);
  const anchor=free[Math.floor(placement()*free.length)];
  free.sort((a,b)=>distance(a,anchor)-distance(b,anchor)||a[1]-b[1]||a[0]-b[0]);
  const spaced=[];for(const point of free)if(spaced.every(other=>distance(point,other)>=2)){spaced.push(point);if(spaced.length===config.robots)break;}
  if(spaced.length<config.robots)for(const point of free)if(!spaced.includes(point)){spaced.push(point);if(spaced.length===config.robots)break;}
  config.starts=spaced;
 }
 return config;
}
function segmentRectangle(a,b,minX,minY,maxX,maxY){
 let low=0,high=1;
 for(let axis=0;axis<2;axis++){
  const start=a[axis],delta=b[axis]-start,min=axis===0?minX:minY,max=axis===0?maxX:maxY;
  if(Math.abs(delta)<EPS){if(start<min-EPS||start>max+EPS)return false;}
  else{let first=(min-start)/delta,last=(max-start)/delta;if(first>last)[first,last]=[last,first];low=Math.max(low,first);high=Math.min(high,last);if(low>high+EPS)return false;}
 }
 return true;
}
export function segmentClear(world,a,b,radius){
 const width=world[0].length,height=world.length;
 if([...a,...b].some(value=>!Number.isFinite(value))||!Number.isFinite(radius)||radius<=0)return false;
 for(const point of [a,b])if(point[0]<=radius+EPS||point[1]<=radius+EPS||point[0]>=width-radius-EPS||point[1]>=height-radius-EPS)return false;
 const x0=Math.max(0,Math.floor(Math.min(a[0],b[0])-radius)),x1=Math.min(width-1,Math.floor(Math.max(a[0],b[0])+radius));
 const y0=Math.max(0,Math.floor(Math.min(a[1],b[1])-radius)),y1=Math.min(height-1,Math.floor(Math.max(a[1],b[1])+radius));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(world[y][x]==='#'&&segmentRectangle(a,b,x-radius,y-radius,x+1+radius,y+1+radius))return false;
 return true;
}
export function movingDiscsCollide(a,b,c,d,radius){
 const delta=[a[0]-c[0],a[1]-c[1]],velocity=[b[0]-a[0]-d[0]+c[0],b[1]-a[1]-d[1]+c[1]];
 const speed=velocity[0]**2+velocity[1]**2;
 const t=speed<EPS?0:Math.max(0,Math.min(1,-(delta[0]*velocity[0]+delta[1]*velocity[1])/speed));
 return Math.hypot(delta[0]+t*velocity[0],delta[1]+t*velocity[1])<=2*radius+EPS;
}
export function resolveMoves(world,positions,proposals,radius,tick){
 const accepted=positions.map(point=>[...point]);const moving=new Set();let blocked=0;
 const count=positions.length;
 for(let offset=0;offset<count;offset++){
  const i=(tick+offset)%count,next=proposals[i];
  if(distance(next,positions[i])<EPS)continue;
  let safe=segmentClear(world,positions[i],next,radius);
  for(let j=0;j<count&&safe;j++)if(j!==i&&movingDiscsCollide(positions[i],next,positions[j],accepted[j],radius))safe=false;
  if(safe){accepted[i]=[...next];moving.add(i);}else blocked++;
 }
 for(let i=0;i<count;i++)for(let j=0;j<i;j++)if(movingDiscsCollide(positions[i],accepted[i],positions[j],accepted[j],radius))fail('Safety invariant failed: simultaneous paths collide.');
 return {positions:accepted,blocked,moved:moving.size};
}
function adjacent(index,width,height){
 const x=index%width,y=Math.floor(index/width),result=[];
 for(const[dx,dy]of DIRECTIONS){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<width&&ny<height)result.push(key(nx,ny,width));}return result;
}
function neighbors(index,world){return adjacent(index,world[0].length,world.length);}
export function reachableCells(world,starts){
 const width=world[0].length,seen=new Set(starts.map(point=>cell(point,width))),queue=[...seen];
 for(let k=0;k<queue.length;k++)for(const next of neighbors(queue[k],world))if(!seen.has(next)&&world[Math.floor(next/width)][next%width]==='.'){seen.add(next);queue.push(next);}return seen;
}
function rayCells(from,to,width){
 let x0=Math.floor(from[0]),y0=Math.floor(from[1]);const x1=Math.floor(to[0]),y1=Math.floor(to[1]),dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let error=dx+dy;const result=[];
 while(true){result.push(key(x0,y0,width));if(x0===x1&&y0===y1)break;const twice=2*error;if(twice>=dy){error+=dy;x0+=sx;}if(twice<=dx){error+=dx;y0+=sy;}}return result;
}
function visible(world,a,b){const width=world[0].length;return rayCells(a,b,width).every(index=>world[Math.floor(index/width)][index%width]!== '#');}
function scan(world,agent,radius){
 const width=world[0].length,height=world.length,[cx,cy]=agent.position;
 for(let y=Math.max(0,Math.floor(cy)-radius);y<=Math.min(height-1,Math.floor(cy)+radius);y++)for(let x=Math.max(0,Math.floor(cx)-radius);x<=Math.min(width-1,Math.floor(cx)+radius);x++){
  const target=[x+.5,y+.5];if(distance(agent.position,target)>radius+EPS)continue;
  for(const index of rayCells(agent.position,target,width)){const blocked=world[Math.floor(index/width)][index%width]==='#';agent.map[index]=blocked?2:1;if(blocked)break;}
 }
 agent.visited[cell(agent.position,width)]=1;
}
export function shareMaps(world,agents,range){
 const snapshots=agents.map(agent=>({map:agent.map.slice(),visited:agent.visited.slice()}));let messages=0;
 for(let i=0;i<agents.length;i++)for(let j=0;j<agents.length;j++)if(i!==j&&distance(agents[i].position,agents[j].position)<=range+EPS&&visible(world,agents[i].position,agents[j].position)){
  for(let k=0;k<agents[i].map.length;k++){if(snapshots[j].map[k])agents[i].map[k]=snapshots[j].map[k];if(snapshots[j].visited[k])agents[i].visited[k]=1;}messages++;
 }
 return messages;
}
function random(seed){let state=seed>>>0;for(let i=0;i<8;i++)state=(Math.imul(state,1664525)+1013904223)>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function decide(dimensions,agent,peers,sensed,policy){
 const {width,height}=dimensions,start=cell(agent.position,width);
 const neighborsOf=index=>adjacent(index,width,height);
 const occupied=new Set(sensed.map(peer=>cell(peer.position,width)));
 const options=neighborsOf(start).filter(index=>agent.map[index]===1&&!occupied.has(index));
 if(policy==='random'){
  const choices=[start,...options];agent.target=null;return centre(choices[Math.floor(agent.rng()*choices.length)],width);
 }
 if(agent.waitTicks>=3){
  agent.target=null;
  if(options.length)return centre(options[Math.floor(agent.rng()*options.length)],width);
 }
 const parent=new Int32Array(agent.map.length).fill(-1),steps=new Int32Array(agent.map.length);parent[start]=start;const queue=[start];
 for(let k=0;k<queue.length;k++)for(const next of neighborsOf(queue[k]))if(parent[next]===-1&&agent.map[next]===1&&!occupied.has(next)){parent[next]=queue[k];steps[next]=steps[queue[k]]+1;queue.push(next);}
 const gain=index=>neighborsOf(index).filter(next=>agent.map[next]===0).length;
 const reserved=index=>peers.some(peer=>peer.id<agent.id&&peer.target===index);
 let target=agent.target;
 if(target===null||target===start||parent[target]===-1||reserved(target)||(!gain(target)&&agent.visited[target])){
  let best=-Infinity;target=start;
  for(const index of queue){
   if(index===start||reserved(index))continue;
   const unknown=gain(index),unvisited=agent.visited[index]===0;
   if(!unknown&&!unvisited)continue;
   const point=centre(index,width);let penalty=0;
   for(const peer of peers)if(peer.target!==null&&distance(point,centre(peer.target,width))<3)penalty+=16;
   const tie=((Math.imul(index+1,2654435761)^agent.tie)>>>0)/4294967296*.5;
   const score=(unknown?100+unknown*8:0)+(unvisited?5:0)-steps[index]*1.1-penalty+tie;
   if(score>best){best=score;target=index;}
  }
 }
 agent.target=target;
 if(target===start)return [...agent.position];
 let next=target;while(parent[next]!==start)next=parent[next];return centre(next,width);
}
export function simulate(input){
 const config=validateConfig(input),world=config.world,width=world[0].length,size=width*world.length;
 const agents=config.starts.map((position,i)=>({position:[...position],map:new Uint8Array(size),visited:new Uint8Array(size),target:null,id:i,waitTicks:0,tie:(config.seed+Math.imul(i+1,2654435761))>>>0,rng:random((config.seed+Math.imul(i+1,2654435761))>>>0)}));
 const reachable=reachableCells(world,config.starts),seen=new Set(),visited=new Set(),frames=[];
 let distanceM=0,blockedMoves=0,messages=0,stallTicks=0,stallEpisodes=0,ticks=0,timeToTargetSeconds=null,reason='budget';
 function frame(tick){
  const newSeen=[],newVisited=[];
  for(const agent of agents){for(let i=0;i<size;i++)if(agent.map[i]&&!seen.has(i)){seen.add(i);newSeen.push(i);}const index=cell(agent.position,width);if(!visited.has(index)){visited.add(index);newVisited.push(index);}}
  frames.push({tick,positions:agents.map(agent=>[...agent.position]),newSeen,newVisited});
 }
 for(const agent of agents)scan(world,agent,config.sensorRadius);
 frame(0);
 if(visited.size/reachable.size>=config.target){timeToTargetSeconds=0;reason='target';}
 else for(let tick=0;tick<config.ticks;tick++){
  if(config.policy==='gossip')messages+=shareMaps(world,agents,config.communicationRadius);
  const snapshot=agents.map(agent=>({position:[...agent.position],target:agent.target,id:agent.id}));
  const proposals=agents.map((agent,i)=>{
   const peers=config.policy==='gossip'?snapshot.filter((peer,j)=>j!==i&&distance(agent.position,peer.position)<=config.communicationRadius+EPS&&visible(world,agent.position,peer.position)):[];
   const sensed=snapshot.filter((peer,j)=>j!==i&&distance(agent.position,peer.position)<=config.sensorRadius+EPS&&visible(world,agent.position,peer.position));
   return decide({width,height:world.length},agent,peers,sensed,config.policy);
  });
  const positions=agents.map(agent=>agent.position);
  const result=resolveMoves(world,positions,proposals,config.radius,tick);blockedMoves+=result.blocked;
  for(let i=0;i<agents.length;i++){const moved=distance(agents[i].position,result.positions[i]);distanceM+=moved;agents[i].waitTicks=moved>EPS?0:agents[i].waitTicks+1;agents[i].position=result.positions[i];scan(world,agents[i],config.sensorRadius);}
  ticks=tick+1;frame(ticks);
  stallTicks=result.moved?0:stallTicks+1;if(stallTicks===20)stallEpisodes++;
  if(visited.size/reachable.size>=config.target){timeToTargetSeconds=ticks*config.dt;reason='target';break;}
  if(stallTicks>=40){reason='stalled';break;}
 }
 const mapped=[...reachable].filter(index=>seen.has(index)).length;
 const report={schemaVersion:1,config,world:[...world],initialPositions:config.starts.map(point=>[...point]),frames,metrics:{reachableCells:reachable.size,visitedCells:visited.size,mappedFreeCells:mapped,visitedCoverage:visited.size/reachable.size,mappedCoverage:mapped/reachable.size,ticks,timeSeconds:ticks*config.dt,timeToTargetSeconds,distanceM,blockedMoves,collisionCount:0,stallEpisodes,messages,termination:reason}};
 if(frames.length>1001||frames.length*agents.length>16016||new TextEncoder().encode(JSON.stringify(report)).byteLength>2*1024*1024)fail('Replay exceeds its bounded output limit.');
 return report;
}
