import {readFile,mkdir,copyFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),output=join(root,'dist');
const benchmark=await readFile(join(root,'docs/results/benchmark.json'));
const metadata=JSON.parse(await readFile(join(root,'docs/results/figures-metadata.json'),'utf8'));
if(metadata.benchmarkSha256!==createHash('sha256').update(benchmark).digest('hex'))throw Error('Benchmark changed: regenerate its scientific figure before building.');
await rm(output,{recursive:true,force:true});
const files=['index.html','src/app.mjs','src/core.mjs','src/scenarios.mjs','src/worker.mjs','src/styles.css','docs/results/coverage.png','docs/results/benchmark.csv'];
for(const file of files){await mkdir(dirname(join(output,file)),{recursive:true});await copyFile(join(root,file),join(output,file));}
process.stdout.write(`Built ${files.length} public lab files in dist/.\n`);
