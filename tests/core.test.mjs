import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConfig,segmentClear,movingDiscsCollide,resolveMoves,simulate,reachableCells,shareMaps} from '../src/core.mjs';
const empty=['.......','.......','.......','.......','.......'];
test('radius and full segment detect thin obstacles and boundary contact',()=>{
 const map=['.....','..#..','.....'];
 assert.equal(segmentClear(map,[.5,1.5],[4.5,1.5],.2),false);
 assert.equal(segmentClear(map,[.5,.5],[4.5,.5],.2),true);
 assert.equal(segmentClear(map,[.1,.5],[1.5,.5],.2),false);
 assert.equal(segmentClear(map,[1.5,.8],[3.5,.8],.2),false);
});
test('continuous relative motion rejects swaps and crossings, accepts parallel moves',()=>{
 assert.equal(movingDiscsCollide([.5,.5],[1.5,.5],[1.5,.5],[.5,.5],.2),true);
 assert.equal(movingDiscsCollide([.5,1.5],[2.5,1.5],[1.5,.5],[1.5,2.5],.2),true);
 assert.equal(movingDiscsCollide([.5,.5],[1.5,.5],[.5,1.5],[1.5,1.5],.45),false);
 assert.equal(movingDiscsCollide([.5,.5],[1.5,.5],[1.5,.5],[1.5,.5],.2),true);
});
test('simultaneous arbitration holds opposing moves and never passes through a stopped robot',()=>{
 const positions=[[1.5,1.5],[2.5,1.5],[3.5,1.5]];
 const result=resolveMoves(empty,positions,[[2.5,1.5],[1.5,1.5],[2.5,1.5]],.25,0);
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.equal(movingDiscsCollide(positions[i],result.positions[i],positions[j],result.positions[j],.25),false);
 assert.ok(result.blocked>=2);
});
test('reachable denominator excludes disconnected cells and includes all start components',()=>{
 const map=['..#..','..#..','..#..'];
 assert.equal(reachableCells(map,[[.5,.5]]).size,6);
 assert.equal(reachableCells(map,[[.5,.5],[3.5,.5]]).size,12);
});
test('map exchange is bounded, local and snapshot based',()=>{
 const world=['.........','.........','.........'];
 const agents=[{position:[.5,1.5],map:new Uint8Array(27),visited:new Uint8Array(27)},{position:[2.5,1.5],map:new Uint8Array(27),visited:new Uint8Array(27)},{position:[4.5,1.5],map:new Uint8Array(27),visited:new Uint8Array(27)}];
 agents[0].map[0]=1;
 shareMaps(world,agents,2.1);
 assert.equal(agents[1].map[0],1);assert.equal(agents[2].map[0],0);
 shareMaps(world,agents,2.1);assert.equal(agents[2].map[0],1);
});
test('configuration rejects invalid shapes, starts, work, seeds and bounds',()=>{
 for(const extra of [{seed:-1},{seed:1.1},{robots:0},{robots:17},{ticks:0},{ticks:1001},{radius:.5},{sensorRadius:0},{communicationRadius:21},{target:0},{dt:Infinity},{policy:'magic'},{starts:[[.5,.5],[.5,.5]],robots:2},{starts:[[.2,.5]]},{unexpected:true}])assert.throws(()=>validateConfig({world:empty,...extra}));
 assert.throws(()=>validateConfig({world:['...','..']}));
 assert.throws(()=>validateConfig({world:['...','..X','...']}));
 assert.throws(()=>validateConfig({world:Array(40).fill('.'.repeat(40)),robots:16,ticks:1000}));
});
test('seeded runs are deterministic and return measured finite metrics',()=>{
 const config={world:empty,robots:3,ticks:70,seed:42};
 const a=simulate(config);const b=simulate(config);
 assert.deepEqual(a,b);assert.equal(a.metrics.collisionCount,0);assert.ok(a.metrics.visitedCoverage>0);assert.ok(a.metrics.visitedCoverage<=1);assert.ok(a.metrics.mappedCoverage>=a.metrics.visitedCoverage);
 assert.equal(a.frames.length,a.metrics.ticks+1);assert.equal(a.metrics.timeSeconds,a.metrics.ticks*a.config.dt);
 assert.equal(a.metrics.reachableCells,35);assert.ok(Number.isFinite(a.metrics.distanceM));
});
test('single robot explores a concave space without cutting through blocked cells',()=>{
 const world=['........','..####..','..#.....','..#.....','..####..','........'];
 const run=simulate({world,robots:1,ticks:300,sensorRadius:2,seed:9,target:.9});
 assert.ok(run.metrics.visitedCoverage>=.9);
 for(let t=1;t<run.frames.length;t++)assert.ok(segmentClear(world,run.frames[t-1].positions[0],run.frames[t].positions[0],run.config.radius));
});
test('all policies use the same reachable denominator and initial state',()=>{
 const common={world:empty,robots:2,ticks:25,seed:4};
 const runs=['gossip','frontier','random'].map(policy=>simulate({...common,policy}));
 for(const run of runs){assert.deepEqual(run.initialPositions,runs[0].initialPositions);assert.equal(run.metrics.reachableCells,35);assert.equal(run.metrics.collisionCount,0);}
});
test('local frontier goals stay stable enough to leave the starting room',async()=>{
 const {SCENARIOS}=await import('../src/scenarios.mjs');
 const run=simulate({world:SCENARIOS.rooms.world,robots:6,ticks:400,seed:1,policy:'gossip'});
 assert.ok(run.metrics.visitedCoverage>.8,`coverage was ${run.metrics.visitedCoverage}`);
});
test('different seeds change initial placement and a robot isolated in one cell stops honestly',()=>{
 const placements=new Set(Array.from({length:10},(_,seed)=>JSON.stringify(simulate({world:empty,robots:2,ticks:1,seed}).initialPositions)));
 assert.ok(placements.size>=3);
 const run=simulate({world:['###','#.#','###'],robots:1,ticks:50,seed:0,target:1});
 assert.equal(run.metrics.visitedCoverage,1);assert.equal(run.metrics.reachableCells,1);assert.equal(run.metrics.ticks,0);assert.equal(run.metrics.timeToTargetSeconds,0);
});
test('communication does not cross an opaque wall or a zero-range gap',()=>{
 const world=['..#..','..#..','..#..'];
 const agents=[{position:[.5,1.5],map:new Uint8Array(15),visited:new Uint8Array(15)},{position:[4.5,1.5],map:new Uint8Array(15),visited:new Uint8Array(15)}];agents[0].map[0]=1;
 assert.equal(shareMaps(world,agents,10),0);assert.equal(agents[1].map[0],0);
 assert.equal(shareMaps(['.....','.....','.....'],agents,0),0);
});
test('zero-range gossip has no hidden coordination compared with independent frontier',async()=>{
 const {SCENARIOS}=await import('../src/scenarios.mjs');
 const common={world:SCENARIOS.rooms.world,robots:6,ticks:200,seed:7,communicationRadius:0};
 const local=simulate({...common,policy:'gossip'}),independent=simulate({...common,policy:'frontier'});
 assert.deepEqual(local.frames,independent.frames);assert.deepEqual(local.metrics,independent.metrics);assert.equal(local.metrics.messages,0);
});
test('rotating priority changes which safe proposal wins a shared destination',()=>{
 const positions=[[1.5,1.5],[3.5,1.5]],proposals=[[2.5,1.5],[2.5,1.5]];
 assert.deepEqual(resolveMoves(empty,positions,proposals,.25,0).positions,[[2.5,1.5],[3.5,1.5]]);
 assert.deepEqual(resolveMoves(empty,positions,proposals,.25,1).positions,[[1.5,1.5],[2.5,1.5]]);
});
test('a large allowed replay remains within frame, position and byte bounds',()=>{
 const run=simulate({world:Array(40).fill('.'.repeat(40)),robots:1,ticks:1000,seed:2,target:1});
 assert.ok(run.frames.length<=1001);assert.ok(run.frames.length*run.config.robots<=16016);assert.ok(new TextEncoder().encode(JSON.stringify(run)).byteLength<=2*1024*1024);
});
test('complete message loss removes map and target sharing without changing local safety',()=>{
 const common={world:empty,robots:3,ticks:60,seed:7,communicationRadius:6};
 const lost=simulate({...common,messageDropRate:1});
 const independent=simulate({...common,policy:'frontier'});
 assert.deepEqual(lost.frames,independent.frames);
 assert.deepEqual(lost.metrics,independent.metrics);
 assert.ok(lost.communication.attempted>0);
 assert.equal(lost.communication.dropped,lost.communication.attempted);
});
test('seeded partial loss is repeatable and zero loss preserves existing behavior',()=>{
 const common={world:empty,robots:3,ticks:60,seed:42};
 const lossy=simulate({...common,messageDropRate:.5});
 assert.deepEqual(lossy,simulate({...common,messageDropRate:.5}));
 assert.ok(lossy.communication.dropped>0);
 assert.ok(lossy.communication.dropped<lossy.communication.attempted);
 assert.equal(lossy.metrics.messages,lossy.communication.attempted-lossy.communication.dropped);
 const reliable=simulate({...common,messageDropRate:0});
 assert.deepEqual(reliable.frames,simulate(common).frames);
 assert.deepEqual(reliable.metrics,simulate(common).metrics);
 for(const messageDropRate of [-.1,1.1,NaN,Infinity,'0.5',null])assert.throws(()=>simulate({...common,messageDropRate}));
});
