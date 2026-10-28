import { compareMessageLoss } from '../src/experiments.mjs';
import { SCENARIOS } from '../src/scenarios.mjs';
if(process.argv.length>2)throw Error('This fixed comparison accepts no arguments; redirect stdout to save its JSON report.');
const report=compareMessageLoss({world:SCENARIOS.rooms.world,robots:6,ticks:400,sensorRadius:3,communicationRadius:6,radius:.25,target:.95,dt:1});
process.stdout.write(JSON.stringify({scenario:'rooms',...report},null,2)+'\n');
