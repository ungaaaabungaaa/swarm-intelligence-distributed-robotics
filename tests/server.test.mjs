import test from 'node:test';
import assert from 'node:assert/strict';
import {createAppServer} from '../scripts/serve.mjs';
import {request} from 'node:http';
const server=createAppServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
test.after(()=>new Promise(resolve=>server.close(resolve)));
test('local lab serves only fixed public assets with worker and privacy policy',async()=>{
 const response=await fetch(base);assert.equal(response.status,200);assert.match(await response.text(),/Swarm Field Lab/);assert.match(response.headers.get('content-security-policy'),/worker-src 'self'/);assert.match(response.headers.get('content-security-policy'),/connect-src 'none'/);
 assert.equal((await fetch(`${base}/src/worker.mjs`)).status,200);assert.equal((await fetch(base,{method:'HEAD'})).status,200);
});
test('server rejects private files, invalid paths, wrong methods and hostile hosts',async()=>{
 for(const path of ['/.git/config','/package.json','/src/cli.mjs','/docs/contract.md','/%E0%A4%A'])assert.equal((await fetch(base+path)).status,404);
 assert.equal((await fetch(base,{method:'POST'})).status,405);
 const status=await new Promise((resolve,reject)=>{const req=request(base,{headers:{host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});assert.equal(status,403);
});
