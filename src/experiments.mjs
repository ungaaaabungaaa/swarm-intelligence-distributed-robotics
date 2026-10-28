import { simulate } from './core.mjs';
export function compareMessageLoss(config,options={}){
 if(!config||typeof config!=='object'||Array.isArray(config)||['seed','messageDropRate'].some(key=>Object.hasOwn(config,key))||(config.policy!==undefined&&config.policy!=='gossip'))throw Error('Comparison needs common gossip settings without seed or messageDropRate.');
 if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).some(key=>!['seeds','rates'].includes(key)))throw Error('Unknown comparison settings.');
 const seeds=options.seeds??[1,2,3,4,5,6,7,8,9,10],rates=options.rates??[0,.25,.5,.75,1];
 if(!Array.isArray(seeds)||seeds.length<1||seeds.length>10||!Array.from(seeds).every(seed=>Number.isInteger(seed)&&seed>=0&&seed<=4294967295)||new Set(seeds).size!==seeds.length)throw Error('Choose 1–10 unique uint32 seeds.');
 if(!Array.isArray(rates)||rates.length<1||rates.length>5||!Array.from(rates).every(rate=>Number.isFinite(rate)&&rate>=0&&rate<=1)||new Set(rates).size!==rates.length)throw Error('Choose 1–5 unique loss rates from 0 to 1.');
 const rows=[];
 for(const rate of rates)for(const seed of seeds){
  const run=simulate({...config,policy:'gossip',seed,messageDropRate:rate});
  rows.push({rate,seed,metrics:run.metrics,communication:run.communication});
 }
 const summary=rates.map(rate=>{
  const group=rows.filter(row=>row.rate===rate),mean=field=>group.reduce((sum,row)=>sum+row.metrics[field],0)/group.length;
  return {rate,runs:group.length,visitedMean:mean('visitedCoverage'),mappedMean:mean('mappedCoverage'),targetReached:group.filter(row=>row.metrics.timeToTargetSeconds!==null).length,stallEpisodes:group.reduce((sum,row)=>sum+row.metrics.stallEpisodes,0),collisionCount:group.reduce((sum,row)=>sum+row.metrics.collisionCount,0)};
 });
 return {schemaVersion:1,settings:structuredClone(config),seeds:[...seeds],rates:[...rates],rows,summary,assumption:'Seeded independent directed packet loss; perfect local sensing and centralized simulation collision shield. Not physical radio or robot validation.'};
}
