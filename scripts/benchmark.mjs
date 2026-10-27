import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {simulate} from '../src/core.mjs';
import {SCENARIOS} from '../src/scenarios.mjs';
const destination=fileURLToPath(new URL('../docs/results/',import.meta.url));
const rows=[];
for(const[scenario,definition]of Object.entries(SCENARIOS))for(let seed=1;seed<=10;seed++)for(const policy of ['gossip','frontier','random']){
 const result=simulate({world:definition.world,policy,seed,robots:6,ticks:400,sensorRadius:3,communicationRadius:6,radius:.25,target:.95,dt:1});
 rows.push({scenario,seed,policy,...result.metrics});
}
const summary=[];
for(const scenario of Object.keys(SCENARIOS))for(const policy of ['gossip','frontier','random']){
 const group=rows.filter(row=>row.scenario===scenario&&row.policy===policy);
 const mean=field=>group.reduce((sum,row)=>sum+row[field],0)/group.length;
 const sd=field=>Math.sqrt(group.reduce((sum,row)=>sum+(row[field]-mean(field))**2,0)/(group.length-1));
 const successful=group.filter(row=>row.timeToTargetSeconds!==null);
 summary.push({scenario,policy,runs:group.length,visitedMean:mean('visitedCoverage'),visitedSampleSd:sd('visitedCoverage'),mappedMean:mean('mappedCoverage'),targetReached:successful.length,meanTimeSuccessful:successful.length?successful.reduce((sum,row)=>sum+row.timeToTargetSeconds,0)/successful.length:null,blockedMean:mean('blockedMoves'),stallEpisodes:group.reduce((sum,row)=>sum+row.stallEpisodes,0),collisionCount:group.reduce((sum,row)=>sum+row.collisionCount,0)});
}
const output=JSON.stringify({schemaVersion:1,seeds:[1,2,3,4,5,6,7,8,9,10],settings:{robots:6,ticks:400,sensorRadius:3,communicationRadius:6,radius:.25,target:.95,dt:1},rows,summary},null,2)+'\n';
if(process.argv.includes('--check')){if(await readFile(join(destination,'benchmark.json'),'utf8')!==output)throw Error('Checked-in benchmark differs from the reproduced results.');process.stdout.write('All 90 deterministic benchmark runs exactly match the checked-in JSON.\n');}
else{
 await mkdir(destination,{recursive:true});await writeFile(join(destination,'benchmark.json'),output);
 const keys=Object.keys(rows[0]);await writeFile(join(destination,'benchmark.csv'),keys.join(',')+'\n'+rows.map(row=>keys.map(field=>row[field]===null?'':row[field]).join(',')).join('\n')+'\n');
 process.stdout.write(JSON.stringify(summary,null,2)+'\n');
}
