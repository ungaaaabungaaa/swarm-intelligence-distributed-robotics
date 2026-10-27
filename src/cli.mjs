#!/usr/bin/env node
import {writeFile} from 'node:fs/promises';
import {simulate} from './core.mjs';
import {SCENARIOS,POLICIES} from './scenarios.mjs';
const help=`Swarm exploration lab\n\nnode src/cli.mjs run [options]\n\n  --scenario warehouse|concave|rooms  (warehouse)\n  --policy gossip|frontier|random     (gossip)\n  --seed INTEGER                     (42)\n  --robots INTEGER                   (6)\n  --ticks INTEGER                    (400)\n  --sensor INTEGER                   (3 cells)\n  --communication NUMBER             (6 m)\n  --radius NUMBER                    (0.25 m)\n  --target NUMBER                    (0.95 visited fraction)\n  --dt NUMBER                        (1 second)\n  --out NEW_FILE                     Write full replay; refuses overwrite\n  --json                             Print metrics as JSON\n\nOffline simulation only. Local maps; centralized simulator safety shield.\n`;
try{
 const args=process.argv.slice(2);
 if(!args.length||args.includes('--help'))process.stdout.write(help);
 else{
  if(args.shift()!=='run')throw Error('Expected run. Use --help for commands.');
  const options={};const config={};const numeric={seed:'seed',robots:'robots',ticks:'ticks',sensor:'sensorRadius',communication:'communicationRadius',radius:'radius',target:'target',dt:'dt'};
  const seen=new Set();
  while(args.length){const flag=args.shift();if(!flag.startsWith('--')||seen.has(flag))throw Error('Unknown or repeated option.');seen.add(flag);const key=flag.slice(2);if(key==='json'){options.json=true;continue;}if(!['scenario','policy','out',...Object.keys(numeric)].includes(key))throw Error(`Unknown option ${flag}.`);const value=args.shift();if(value===undefined||value.startsWith('--'))throw Error(`Missing value for ${flag}.`);if(Object.hasOwn(numeric,key)){if(value.trim()===''||!Number.isFinite(Number(value)))throw Error(`Invalid number for ${flag}.`);config[numeric[key]]=Number(value);}else options[key]=value;}
  const scenario=options.scenario??'warehouse';if(!Object.hasOwn(SCENARIOS,scenario))throw Error('Unknown scenario.');
  const report=simulate({...config,world:SCENARIOS[scenario].world,policy:options.policy??'gossip'});
  if(options.out)await writeFile(options.out,JSON.stringify(report)+'\n',{flag:'wx'});
  if(options.json)process.stdout.write(JSON.stringify({schemaVersion:1,scenario,policy:report.config.policy,...report.metrics})+'\n');
  else{process.stdout.write(`${SCENARIOS[scenario].name} · ${POLICIES[report.config.policy]}\nVisited ${(report.metrics.visitedCoverage*100).toFixed(1)}% · mapped ${(report.metrics.mappedCoverage*100).toFixed(1)}%\n${report.metrics.ticks} ticks · ${report.metrics.distanceM.toFixed(1)} m · ${report.metrics.blockedMoves} blocked proposals · ${report.metrics.stallEpisodes} prolonged stalls\n${report.metrics.termination}; accepted-motion collisions: ${report.metrics.collisionCount}\n`);if(options.out)process.stdout.write('Replay saved to the requested new file.\n');}
 }
}catch(error){process.stderr.write(`Error: ${error.code==='EEXIST'?'Output already exists; choose a new file.':error.message}\n`);process.exitCode=1;}
