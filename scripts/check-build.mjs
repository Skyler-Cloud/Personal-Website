// Verify the actual Astro output, not the standalone prototype.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { parse } from 'yaml';
import MarkdownIt from 'markdown-it';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import { FileRepository } from '../packages/storage/files.ts';
const root = resolve('apps/web/dist');
const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const origin = 'https://build-check.invalid';
const data = await new FileRepository('content', parse, 'apps/web/public').load();
const exists = async p => stat(p).then(s=>s.isFile()).catch(()=>false);
const expected = ['', 'gallery', 'writing', ...data.posts.filter(p=>!p.draft).map(p=>'writing/'+p.id), ...data.gallery.map(g=>'gallery/'+g.id)];
for (const p of expected) assert.ok(await exists(join(root,p,'index.html')), `Missing page: ${p || '/'}`);
for (const p of data.posts.filter(p=>p.draft)) assert.ok(!(await exists(join(root,'writing',p.id,'index.html'))),`Draft published: ${p.id}`);
const md = new MarkdownIt({html:false,linkify:true}).use(texmath,{engine:katex,delimiters:'dollars',katexOptions:{throwOnError:true,trust:false,strict:'warn'}});
assert.match(md.render('Inline $x^2$\n\n$$x^2+y^2$$'),/class="katex"/);
assert.doesNotMatch(md.render('<script>alert(1)</script>'),/<script>/);
assert.doesNotMatch(md.render('[bad](javascript:alert(1))'),/href="javascript:/);
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const files=await walk(root);let checked=0;
for(const file of files.filter(p=>p.endsWith('.html'))){const html=await readFile(file,'utf8');const route=relative(root,file).replaceAll('\\','/').replace(/index\.html$/,'');const pageUrl=new URL(base+route,origin);for(const m of html.matchAll(/\b(?:href|src)="([^"#]+)"/g)){const href=m[1].replaceAll('&amp;','&');if(/^(?:mailto:|tel:|data:|https?:|\/\/)/i.test(href))continue;const url=new URL(href,pageUrl);if(url.origin!==origin)continue;assert.ok(url.pathname.startsWith(base),`Link outside deployment base: ${href} in ${route}`);const local=join(root,decodeURIComponent(url.pathname.slice(base.length)));assert.ok(await exists(local)||await exists(join(local,'index.html')),`Broken link: ${href} in ${route}`);checked++;}}
console.log(`Production smoke checks passed: ${expected.length} required pages, ${checked} local links/assets, draft exclusion and math renderer.`);
