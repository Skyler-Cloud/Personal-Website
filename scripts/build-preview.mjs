import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {parse} from 'yaml';
import {FileRepository} from '../packages/storage/files.ts';
import {renderPages,escape,renderFooter} from '../packages/frontend/render.ts';
import {tokenCSS} from '../packages/frontend/tokens.ts';
const root=fileURLToPath(new URL('..',import.meta.url)),pub=join(root,'apps/web/public'),out=join(root,'preview-output');
const data=await new FileRepository(join(root,'content'),parse).load();
const markdown=s=>execFileSync('python',[join(root,'scripts/preview-markdown.py')],{input:s,encoding:'utf8'});
const css=tokenCSS(new URL('../design/tokens.json',import.meta.url))+'\n'+await readFile(join(pub,'styles/site.css'),'utf8');
const js=await readFile(join(pub,'scripts/site.js'),'utf8');

const fonts='';
const foot=p=>renderFooter({base:'/',mode:p.mode,markdown:s=>s});
const head=(title,description,mode='academic')=>`<!doctype html><html lang="en" data-mode="${mode}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}">${fonts}<style>${css}</style></head><body><a class="skip-link" href="#main">Skip to content</a><main id="main">`;
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(pub, out,{recursive:true,filter:src=>src!==join(pub,'assets')});await cp(join(root,'content/assets'),join(out,'assets'),{recursive:true});
const latexJobs=data.posts.filter(p=>p.latex&&!p.draft).map(p=>({id:p.id,source:p.latex,main:p.latexMain,engine:p.latexEngine||'pdflatex',pdf:!!p.latexPdf}));
const fragments=join(root,'apps/web/.generated/offline-latex');await rm(fragments,{recursive:true,force:true});
if(latexJobs.length)execFileSync('python3',[join(root,'scripts/compile-latex.py'),join(root,'content/latex'),join(out,'assets/latex'),fragments],{input:JSON.stringify(latexJobs),stdio:['pipe','inherit','inherit']});
const latexHtml=new Map();for(const j of latexJobs)latexHtml.set(j.id,(await readFile(join(fragments,j.id+'.html'),'utf8')).replace(/src="assets\/latex\//g,'src="/assets/latex/'));
const pages=renderPages(data,{base:'/',markdown,latex:id=>latexHtml.get(id)??''});
for(const p of pages){const prefix='../'.repeat(p.path?p.path.split('/').length:0)||'./';const html=(p.html+foot(p)).replace(/href="\/([^\"]*)"/g,(_,v)=>`href="${prefix+v}${v.startsWith("assets/")?"":"index.html"}"`).replace(/src="\/([^\"]*)"/g,(_,v)=>`src="${prefix+v}"`);const dir=join(out,p.path);await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),head(p.title,p.description,p.mode)+html+`</main><script>${js}</script></body></html>`)}
const assetMap=new Map();const mime={'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif'};for(const path of [data.site.personal.portrait,data.site.academic.portrait,...data.gallery.map(g=>g.image)]){const type=mime[extname(path).toLowerCase()];if(!type)throw Error('Unsupported preview image '+path);assetMap.set('/'+path,'data:'+type+';base64,'+(await readFile(join(root,'content',path))).toString('base64'));}
const inline=s=>s.replace(/src="(\/assets\/[^\"]+)"/g,(m,p)=>assetMap.has(p)?`src="${assetMap.get(p)}"`:m).replace(/href="\/([^\"]*)" data-route="([^\"]*)"/g,(_,path,route)=>`href="#/${route}" data-route="${route}"`);
const packed=JSON.stringify(Object.fromEntries(pages.map(p=>[p.path,{title:p.title,mode:p.mode,html:inline(p.html+foot(p))}]))).replace(/</g,'\\u003c');
const router=`const pages=${packed};function render(){const path=location.hash.startsWith('#/')?location.hash.slice(2):'';const p=pages[path]||pages[''];document.getElementById('main').innerHTML=p.html;document.title=p.title;document.documentElement.dataset.mode=p.mode;document.dispatchEvent(new Event('site:render'));window.scrollTo(0,0);}window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#/'))render()});render();`;
await writeFile(join(out,'preview.html'),head(data.site.name,data.site.academic.description)+`</main><script>${js}</script><script>${router}</script></body></html>`);
console.log('Built '+pages.length+' pages and single-file preview');
