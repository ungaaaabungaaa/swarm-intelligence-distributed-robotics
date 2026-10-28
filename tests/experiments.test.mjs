import test from 'node:test';
import assert from 'node:assert/strict';
import { compareMessageLoss } from '../src/experiments.mjs';
import { simulate } from '../src/core.mjs';
const config={world:['.......','.......','.......','.......','.......'],robots:3,ticks:30};
test('loss comparison preserves every paired seed/rate result and honest denominators',()=>{
 const report=compareMessageLoss(config,{seeds:[1,2],rates:[0,.5,1]});
 assert.equal(report.rows.length,6);
 assert.deepEqual(report,compareMessageLoss(config,{seeds:[1,2],rates:[0,.5,1]}));
 for(const row of report.rows){
  const actual=simulate({...config,seed:row.seed,messageDropRate:row.rate});
  assert.deepEqual(row.metrics,actual.metrics);
  assert.deepEqual(row.communication,actual.communication);
 }
 for(const summary of report.summary){
  const rows=report.rows.filter(row=>row.rate===summary.rate);
  assert.equal(summary.runs,2);
  assert.equal(summary.targetReached,rows.filter(row=>row.metrics.timeToTargetSeconds!==null).length);
  assert.equal(summary.visitedMean,rows.reduce((sum,row)=>sum+row.metrics.visitedCoverage,0)/2);
  assert.equal(summary.stallEpisodes,rows.reduce((sum,row)=>sum+row.metrics.stallEpisodes,0));
  assert.equal(summary.collisionCount,0);
 }
 assert.ok(report.rows.filter(row=>row.rate===1).every(row=>row.metrics.messages===0));
});
test('comparison rejects ambiguous, duplicate and unbounded experiment settings',()=>{
 for(const options of [{seeds:[]},{seeds:[1,1]},{seeds:[-1]},{seeds:Array.from({length:11},(_,i)=>i)},{rates:[]},{rates:[0,0]},{rates:[-1]},{rates:[NaN]},{rates:[1.1]},{seed:[1]},null,[]])
  assert.throws(()=>compareMessageLoss(config,options));
 assert.throws(()=>compareMessageLoss({...config,policy:'frontier'}));
 assert.throws(()=>compareMessageLoss({...config,seed:4}));
 assert.throws(()=>compareMessageLoss({...config,messageDropRate:.2}));
});
