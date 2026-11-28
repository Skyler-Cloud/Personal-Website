// Verify the actual Astro output, not the standalone prototype.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { parse } from 'yaml';
import MarkdownIt from 'markdown-it';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import { postModes } from '../packages/core/index.ts';
import { FileRepository } from '../packages/storage/files.ts';
const root = resolve('apps/web/dist');
const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const origin = 'https://build-check.invalid';
const data = await new FileRepository('content', parse).load();
const exists = async p => stat(p).then(s=>s.isFile()).catch(()=>false);
const expected = ['', 'gallery', 'writing', 'academic','personal','academic/papers','academic/writing','personal/writing','personal/gallery', ...data.posts.filter(p=>!p.draft).flatMap(p=>['writing/'+p.id,...postModes(data,p).map(m=>m+'/writing/'+p.id)]), ...data.gallery.flatMap(g=>['gallery/'+g.id,'personal/gallery/'+g.id])];
for (const p of expected) assert.ok(await exists(join(root,p,'index.html')), `Missing page: ${p || '/'}`);
for (const p of data.posts.filter(p=>p.draft)) for(const prefix of ['writing','academic/writing','personal/writing']) assert.ok(!(await exists(join(root,prefix,p.id,'index.html'))),`Draft published: ${p.id}`);
const md = new MarkdownIt({html:false,linkify:true}).use(texmath,{engine:katex,delimiters:'dollars',katexOptions:{throwOnError:true,trust:false,strict:'warn'}});
assert.match(md.render('Inline $x^2$\n\n$$x^2+y^2$$'),/class="katex"/);
assert.doesNotMatch(md.render('<script>alert(1)</script>'),/<script>/);
assert.doesNotMatch(md.render('[bad](javascript:alert(1))'),/href="javascript:/);
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const files=await walk(root);let checked=0;
for(const file of files.filter(p=>p.endsWith('.html'))){const html=await readFile(file,'utf8');const route=relative(root,file).replaceAll('\\','/').replace(/index\.html$/,'');const pageUrl=new URL(base+route,origin);for(const m of html.matchAll(/\b(?:href|src)="([^"#]+)"/g)){const href=m[1].replaceAll('&amp;','&');if(/^(?:mailto:|tel:|data:|https?:|\/\/)/i.test(href))continue;const url=new URL(href,pageUrl);if(url.origin!==origin)continue;assert.ok(url.pathname.startsWith(base),`Link outside deployment base: ${href} in ${route}`);const local=join(root,decodeURIComponent(url.pathname.slice(base.length)));assert.ok(await exists(local)||await exists(join(local,'index.html')),`Broken link: ${href} in ${route}`);checked++;}}
console.log(`Production smoke checks passed: ${expected.length} required pages, ${checked} local links/assets, draft exclusion and math renderer.`);

for(const mode of ['academic','personal']){
  const html=await readFile(join(root,mode,'index.html'),'utf8');
  assert.ok(html.includes('data-mode="'+mode+'"'));
  assert.ok(html.includes('aria-current="true"'));
  assert.ok(!html.includes('theme-toggle'));
}

for(const file of files.filter(p=>p.endsWith('.html'))){
  const html=await readFile(file,'utf8');
  const hasMath=/<span\s+class="katex(?:\s|")/.test(html);
  assert.equal(html.includes('vendor/katex/katex.min.css'),hasMath,'Math CSS should only appear on math pages: '+file);
  assert.ok(html.includes('astro-view-transitions-enabled'),'Missing client router: '+file);
}
const mathCss=await readFile(join(root,'vendor/katex/katex.min.css'),'utf8');
for(const m of mathCss.matchAll(/url\(["']?(fonts\/[^)"']+)["']?\)/g))assert.ok(await exists(join(root,'vendor/katex',m[1])),'Missing KaTeX font: '+m[1]);
const academicHome=await readFile(join(root,'academic/index.html'),'utf8');
assert.match(academicHome,/data-astro-prefetch="viewport"/);

const sourceAssets=resolve('content/assets');
const publishedAssets=join(root,'assets');
const sourcePaths=(await walk(sourceAssets)).map(p=>relative(sourceAssets,p)).sort();
const generatedPdfPaths=data.posts.filter(p=>p.latex&&!p.draft&&p.latexPdf).map(p=>'latex/'+p.id+'.pdf');
const publishedPaths=(await walk(publishedAssets)).map(p=>relative(publishedAssets,p)).sort();
const generatedImages=[];
for(const p of data.posts.filter(p=>p.latex&&!p.draft)){
  const fragment=await readFile(resolve('apps/web/.generated/latex',p.id+'.html'),'utf8');
  assert.ok(fragment.trim(),'Empty LaTeX HTML: '+p.id);
  for(const m of fragment.matchAll(/src="assets\/(latex\/[^"]+)"/g))generatedImages.push(m[1]);
  for(const mode of postModes(data,p)){
    const html=await readFile(join(root,mode,'writing',p.id,'index.html'),'utf8');
    assert.ok(html.includes('class="latex-html"'),'Missing inline LaTeX document: '+p.id);
  }
}
assert.deepEqual(publishedPaths,[...new Set([...sourcePaths,...generatedPdfPaths,...generatedImages])].sort(),'Published assets must match content and generated LaTeX assets');
for(const p of generatedPdfPaths)assert.equal((await readFile(join(publishedAssets,p))).subarray(0,5).toString(),'%PDF-','Invalid generated PDF: '+p);
for(const p of sourcePaths)assert.deepEqual(await readFile(join(publishedAssets,p)),await readFile(join(sourceAssets,p)),'Changed asset bytes: '+p);
console.log('Content asset mirror verified: '+sourcePaths.length+' files');
