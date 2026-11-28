// Compile only explicitly published LaTeX posts. Source archives are never copied into dist.
import { FileRepository } from '../packages/storage/files.ts';
import { parse } from 'yaml';
import { rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const data=await new FileRepository(root+'content',parse).load();
await rm(root+'apps/web/.generated/latex',{recursive:true,force:true});
const jobs=data.posts.filter(p=>!p.draft&&p.latex).map(p=>({id:p.id,source:p.latex,main:p.latexMain,engine:p.latexEngine||'pdflatex',pdf:!!p.latexPdf}));
if(jobs.length){
  const run=spawnSync('python3',[root+'scripts/compile-latex.py',root+'content/latex',root+'apps/web/public/assets/latex',root+'apps/web/.generated/latex'],{input:JSON.stringify(jobs),encoding:'utf8',maxBuffer:2*1024*1024});
  if(run.stdout)process.stdout.write(run.stdout);
  if(run.stderr)process.stderr.write(run.stderr);
  if(run.error||run.status!==0)throw Error('LaTeX compilation failed: '+(run.error||run.status));
}
