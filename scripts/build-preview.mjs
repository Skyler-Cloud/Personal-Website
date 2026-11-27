import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {FileRepository} from '../packages/storage/files.ts';
import {renderPages,escape,renderFooter} from '../packages/frontend/render.ts';
import {tokenCSS} from '../packages/frontend/tokens.ts';
const root=fileURLToPath(new URL('..',import.meta.url)),pub=join(root,'apps/web/public'),out=join(root,'preview-output');
const data=await new FileRepository(join(root,'content'),JSON.parse,pub).load();
const markdown=s=>execFileSync('python',[join(root,'scripts/preview-markdown.py')],{input:s,encoding:'utf8'});
const css=tokenCSS(new URL('../design/tokens.json',import.meta.url))+'\n'+await readFile(join(pub,'styles/site.css'),'utf8');
const js=await readFile(join(pub,'scripts/site.js'),'utf8');
const pages=renderPages(data,{base:'/',markdown});
const fonts='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Play:wght@700&display=swap">';
const foot=p=>renderFooter({base:'/',mode:p.mode,markdown:s=>s});
const head=(title,description,mode='academic')=>`<!doctype html><html lang="en" data-mode="${mode}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}">${fonts}<style>${css}</style></head><body><a class="skip-link" href="#main">Skip to content</a><main id="main">`;
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(pub, out,{recursive:true});
for(const p of pages){const prefix='../'.repeat(p.path?p.path.split('/').length:0)||'./';const html=(p.html+foot(p)).replace(/href="\/([^\"]*)"/g,(_,v)=>`href="${prefix+v}index.html"`).replace(/src="\/([^\"]*)"/g,(_,v)=>`src="${prefix+v}"`);const dir=join(out,p.path);await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),head(p.title,p.description,p.mode)+html+`</main><script>${js}</script></body></html>`)}
const assetMap=new Map();const mime={'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif'};for(const path of [data.site.personal.portrait,data.site.academic.portrait,...data.gallery.map(g=>g.image)]){const type=mime[extname(path).toLowerCase()];if(!type)throw Error('Unsupported preview image '+path);assetMap.set('/'+path,'data:'+type+';base64,'+(await readFile(join(pub,path))).toString('base64'));}
const inline=s=>s.replace(/src="(\/assets\/[^\"]+)"/g,(m,p)=>assetMap.has(p)?`src="${assetMap.get(p)}"`:m).replace(/href="\/([^\"]*)" data-route="([^\"]*)"/g,(_,path,route)=>`href="#/${route}" data-route="${route}"`);
const packed=JSON.stringify(Object.fromEntries(pages.map(p=>[p.path,{title:p.title,mode:p.mode,html:inline(p.html+foot(p))}]))).replace(/</g,'\\u003c');
const router=`const pages=${packed};function render(){const path=location.hash.startsWith('#/')?location.hash.slice(2):'';const p=pages[path]||pages[''];document.getElementById('main').innerHTML=p.html;document.title=p.title;document.documentElement.dataset.mode=p.mode;document.dispatchEvent(new Event('site:render'));window.scrollTo(0,0);}window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#/'))render()});render();`;
await writeFile(join(out,'preview.html'),head(data.site.name,data.site.academic.description)+`</main><script>${js}</script><script>${router}</script></body></html>`);
console.log('Built '+pages.length+' pages and single-file preview');
