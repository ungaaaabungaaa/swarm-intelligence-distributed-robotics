import {SCENARIOS,POLICIES} from './scenarios.mjs';
import {reachableCells} from './core.mjs';
const $=selector=>document.querySelector(selector),form=$('#config-form'),canvas=$('#map'),context=canvas.getContext('2d');
const colours=['#286a67','#b65835','#5b69a3','#92603d','#7a548e','#668149','#36769a','#8d4e67'];
let report=null,frameIndex=-1,seen=new Set(),visited=new Set(),reachable=new Set(),worker=null,requestId=0,playing=false,lastTime=0,animation=null;
function element(tag,text){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;}
function stop(){playing=false;cancelAnimationFrame(animation);$('#play').textContent='▶';$('#play').setAttribute('aria-label','Play replay');}
function controls(enabled){for(const id of ['play','step','scrub','export'])$(`#${id}`).disabled=!enabled;}
function showError(text){$('#error').textContent=text;$('#error').hidden=false;}
function run(event){
 event?.preventDefault();if(!form.reportValidity())return;
 stop();worker?.terminate();const token=++requestId;const values=new FormData(form),scenario=values.get('scenario');
 if(!Object.hasOwn(SCENARIOS,scenario)){showError('Choose a supported environment.');return;}
 const config={world:SCENARIOS[scenario].world,policy:values.get('policy')};
 for(const field of ['robots','seed','ticks','communicationRadius','sensorRadius','radius','target','dt'])config[field]=Number(values.get(field));
 $('#error').hidden=true;$('#loading').hidden=false;$('#run').disabled=true;$('#cancel').hidden=false;$('#run-state').textContent='Computing';controls(false);
 try{
  worker=new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
  worker.addEventListener('message',event=>{
   if(token!==requestId)return;worker.terminate();worker=null;$('#loading').hidden=true;$('#run').disabled=false;$('#cancel').hidden=true;
   if(!event.data.ok){showError(event.data.error);$('#run-state').textContent='Input rejected';return;}
   report=event.data.report;report.scenario=scenario;frameIndex=-1;seen=new Set();visited=new Set();reachable=reachableCells(report.world,report.initialPositions);
   $('#run-title').textContent=`${SCENARIOS[scenario].name} · ${POLICIES[report.config.policy]}`;$('#scrub').max=String(report.frames.length-1);controls(true);applyFrame(0);$('#run-state').textContent='Replay ready';
   const metrics=report.metrics;
   $('#summary').textContent=`Full run: ${(metrics.visitedCoverage*100).toFixed(1)}% visited in ${metrics.ticks} ticks. ${metrics.blockedMoves} blocked proposals, ${metrics.stallEpisodes} prolonged no-motion stalls, ${metrics.collisionCount} accepted-motion collisions. Stopped: ${metrics.termination}. Safety uses the centralized simulator shield.`;
  });
  worker.addEventListener('error',()=>{if(token!==requestId)return;worker?.terminate();worker=null;$('#loading').hidden=true;$('#run').disabled=false;$('#cancel').hidden=true;$('#run-state').textContent='Run failed';showError('The simulation worker could not run. Check that this app is served from HTTP(S), not opened as a file.');});
  worker.postMessage(config);
 }catch(error){$('#loading').hidden=true;$('#run').disabled=false;$('#cancel').hidden=true;showError(error.message);$('#run-state').textContent='Run failed';}
}
function applyFrame(index){
 if(!report)return;
 index=Math.max(0,Math.min(report.frames.length-1,index));
 if(index<frameIndex){seen=new Set();visited=new Set();frameIndex=-1;}
 for(let i=frameIndex+1;i<=index;i++){for(const cell of report.frames[i].newSeen)seen.add(cell);for(const cell of report.frames[i].newVisited)visited.add(cell);}
 frameIndex=index;$('#scrub').value=String(index);$('#tick-label').textContent=`${index} / ${report.frames.length-1}`;
 $('#visited-metric').textContent=`${(visited.size/reachable.size*100).toFixed(1)}%`;$('#visited-count').textContent=`${visited.size} / ${reachable.size} reachable centres`;
 let mapped=0;for(const cell of seen)if(reachable.has(cell))mapped++;
 $('#mapped-metric').textContent=`${(mapped/reachable.size*100).toFixed(1)}%`;$('#time-metric').textContent=`${(index*report.config.dt).toFixed(1)} s`;$('#time-count').textContent=`Tick ${index}`;
 const table=element('table'),head=element('thead'),header=element('tr');for(const label of ['Robot','X (m)','Y (m)'])header.append(element('th',label));head.append(header);table.append(head);const body=element('tbody');
 report.frames[index].positions.forEach((point,i)=>{const row=element('tr');row.append(element('td',String(i+1)),element('td',point[0].toFixed(1)),element('td',point[1].toFixed(1)));body.append(row);});table.append(body);$('#robot-positions').replaceChildren(table);draw();
}
function draw(){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));context.setTransform(dpr,0,0,dpr,0,0);
 const world=report?.world??SCENARIOS[form.elements.scenario.value].world,width=world[0].length,height=world.length,padding=14,cellSize=Math.min((rect.width-padding*2)/width,(rect.height-padding*2)/height),left=(rect.width-cellSize*width)/2,top=(rect.height-cellSize*height)/2;
 context.fillStyle='#eef1ef';context.fillRect(0,0,rect.width,rect.height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const index=y*width+x,known=seen.has(index)||$('#ground-truth').checked;
  context.fillStyle=!known?'#dce2df':world[y][x]==='#'?'#354346':visited.has(index)?'#b9d7c5':'#ffffff';context.fillRect(left+x*cellSize+.4,top+y*cellSize+.4,cellSize-.8,cellSize-.8);
 }
 if(!report||frameIndex<0)return;
 if($('#trails').checked){
  for(let robot=0;robot<report.config.robots;robot++){context.strokeStyle=colours[robot%colours.length];context.globalAlpha=.35;context.lineWidth=1.3;context.beginPath();for(let tick=Math.max(0,frameIndex-100);tick<=frameIndex;tick++){const point=report.frames[tick].positions[robot];const x=left+point[0]*cellSize,y=top+point[1]*cellSize;if(tick===Math.max(0,frameIndex-100))context.moveTo(x,y);else context.lineTo(x,y);}context.stroke();}context.globalAlpha=1;
 }
 report.frames[frameIndex].positions.forEach((point,i)=>{
  const x=left+point[0]*cellSize,y=top+point[1]*cellSize;
  context.fillStyle=colours[i%colours.length];context.beginPath();context.arc(x,y,report.config.radius*cellSize,0,Math.PI*2);context.fill();context.strokeStyle='#ffffff';context.lineWidth=1;context.stroke();
  if(cellSize>=18){context.font='10px Arial';context.fillStyle='#17282b';context.textAlign='center';context.textBaseline='bottom';context.fillText(String(i+1),x,y-report.config.radius*cellSize-2);}
 });
}
function animate(time){
 if(!playing||!report)return;const period=1000/Number($('#speed').value);
 if(time-lastTime>=period){const steps=Math.max(1,Math.floor((time-lastTime)/period));lastTime=time;applyFrame(frameIndex+steps);if(frameIndex===report.frames.length-1){stop();$('#run-state').textContent='Replay finished';return;}}
 animation=requestAnimationFrame(animate);
}
$('#play').addEventListener('click',()=>{if(playing){stop();$('#run-state').textContent='Paused';return;}if(frameIndex>=report.frames.length-1)applyFrame(0);playing=true;lastTime=performance.now();$('#play').textContent='Ⅱ';$('#play').setAttribute('aria-label','Pause replay');$('#run-state').textContent='Playing';animation=requestAnimationFrame(animate);});
$('#step').addEventListener('click',()=>{stop();applyFrame(frameIndex+1);$('#run-state').textContent=frameIndex===report.frames.length-1?'Replay finished':'Paused';});
$('#scrub').addEventListener('input',event=>{stop();applyFrame(Number(event.target.value));$('#run-state').textContent='Paused';});
$('#cancel').addEventListener('click',()=>{++requestId;worker?.terminate();worker=null;$('#loading').hidden=true;$('#run').disabled=false;$('#cancel').hidden=true;$('#run-state').textContent='Cancelled';controls(Boolean(report));});
$('#ground-truth').addEventListener('change',draw);$('#trails').addEventListener('change',draw);
$('#export').addEventListener('click',()=>{if(!report)return;const blob=new Blob([JSON.stringify(report)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob),link=element('a');link.href=url;link.download=`swarm-${report.scenario}-${report.config.policy}-seed-${report.config.seed}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
form.elements.scenario.addEventListener('change',()=>{$('#scenario-description').textContent=SCENARIOS[form.elements.scenario.value].description;});
form.addEventListener('submit',run);
$('#scenario-description').textContent=SCENARIOS.warehouse.description;
new ResizeObserver(draw).observe(canvas);
run();
