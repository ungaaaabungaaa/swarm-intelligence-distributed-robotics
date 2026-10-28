import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile),cli=fileURLToPath(new URL('../src/cli.mjs',import.meta.url));
const run=args=>exec(process.execPath,[cli,...args],{timeout:10000,maxBuffer:1024*1024});
test('CLI prints real metrics, exports a replay and refuses to overwrite',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'swarm-cli-'));try{
 const path=join(dir,'run.json');const result=await run(['run','--scenario','rooms','--robots','3','--ticks','50','--seed','2','--out',path,'--json']);
 const metrics=JSON.parse(result.stdout),report=JSON.parse(await readFile(path,'utf8'));assert.equal(metrics.visitedCoverage,report.metrics.visitedCoverage);assert.equal(metrics.ticks,report.frames.length-1);
 await assert.rejects(run(['run','--out',path]),error=>/already exists/.test(error.stderr));
 assert.equal(JSON.parse(await readFile(path,'utf8')).metrics.visitedCoverage,metrics.visitedCoverage);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('CLI rejects unknown and malformed options without a report',async()=>{
 for(const args of [['fly'],['run','--wat','1'],['run','--seed'],['run','--seed','NaN'],['run','--seed','1','--seed','2'],['run','--scenario','missing'],['run','--robots','100'],['run','--policy','__proto__']])await assert.rejects(run(args));
 assert.match((await run(['--help'])).stdout,/centralized simulator safety/);
});
test('CLI loss option exports the configured experiment and packet counters',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'swarm-loss-'));try{
  const path=join(dir,'loss.json');
  await run(['run','--robots','3','--ticks','20','--message-loss','1','--out',path,'--json']);
  const report=JSON.parse(await readFile(path,'utf8'));
  assert.equal(report.config.messageDropRate,1);
  assert.ok(report.communication.attempted>0);
  assert.equal(report.communication.dropped,report.communication.attempted);
  assert.equal(report.metrics.messages,0);
  await assert.rejects(run(['run','--message-loss','1.1']));
 }finally{await rm(dir,{recursive:true,force:true});}
});
