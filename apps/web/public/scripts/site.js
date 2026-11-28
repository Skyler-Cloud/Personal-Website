(()=>{'use strict';if(window.__siteFiltersInstalled)return;window.__siteFiltersInstalled=true;document.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('button'):null;if(!b)return;if(!b.matches('[data-filter]'))return;const bar=b.closest('[data-filters]');if(!bar)return;const chosen=b.dataset.filter,kind=bar.dataset.filters;bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(kind==='writing'){document.querySelectorAll('[data-view]').forEach(x=>{x.hidden=x.dataset.view!==chosen});}else{let count=0;document.querySelectorAll('[data-filter-list="gallery"] [data-category]').forEach(x=>{x.hidden=chosen!=='all'&&x.dataset.category!==chosen;if(!x.hidden)count++});const empty=document.querySelector('.empty-state');if(empty)empty.hidden=count!==0;}});})();


(()=>{'use strict';
 if(window.__dreamMotionV4Installed)return;window.__dreamMotionV4Installed=true;
 const root=()=>document.documentElement;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),forced=matchMedia('(forced-colors: active)');
 const quiet=()=>reduce.matches||forced.matches;
 const ink=['#007b96','#a52779','#886100','#167544','#b53b28','#6537bd'];
 const shuffled=colors=>{const c=[...colors];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]]}return c};
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 function prepareHover(){
   if(root().dataset.mode!=='academic')return;
   document.querySelectorAll('.writing-entry h3 a').forEach(a=>{
     if(a.dataset.hoverPalette)return;
     const c=shuffled(ink).slice(0,3);a.dataset.hoverPalette=c.join(',');a.dataset.hoverIndex='0';
     a.style.setProperty('--hover-color',c[0]);
     a.style.setProperty('--hover-bands','linear-gradient(90deg,'+c[0]+' 0% 33.3333%,'+c[1]+' 33.3333% 66.6667%,'+c[2]+' 66.6667% 100%)');
   });
   document.querySelectorAll('main a:not(.writing-entry h3 a)').forEach(a=>{if(!a.style.getPropertyValue('--hover-color'))a.style.setProperty('--hover-color',pick(ink))});
 }
 // Listen at the title itself, not the wider article: moving off the title
 // into its metadata and back now counts as a new hover, too.
 function titleFrom(t){return t instanceof Element?t.closest('.writing-entry h3 a'):null}
 function cycle(a){
   if(!a||root().dataset.mode!=='academic')return;
   prepareHover();const c=(a.dataset.hoverPalette||'').split(',');if(c.length!==3)return;
   const i=(Number(a.dataset.hoverIndex||0)+1)%3;a.dataset.hoverIndex=String(i);a.style.setProperty('--hover-color',c[i]);
 }
 function entryFrom(t){return t instanceof Element?t.closest('.writing-entry'):null}
 document.addEventListener('PointerEvent' in window?'pointerover':'mouseover',e=>{
   const row=entryFrom(e.target),title=titleFrom(e.target);
   if(row&&(row!==entryFrom(e.relatedTarget)||title&&title!==titleFrom(e.relatedTarget)))cycle(title||row.querySelector('h3 a'));
 });
 document.addEventListener('focusin',e=>{const a=titleFrom(e.target);if(a&&a!==titleFrom(e.relatedTarget)&&!a.matches(':hover'))cycle(a)});
 const NS='http://www.w3.org/2000/svg';
 const mosaic50=[[11,3,2,2],[0,11,2,1],[11,10,5,1],[5,0,6,4],[2,2,2,4],[14,11,2,1],[10,8,1,3],[15,1,1,2],[0,9,2,2],[11,0,5,1],[5,4,6,3],[0,0,5,2],[0,2,2,4],[8,8,1,1]], mosaicExtra=[[11,7,2,3],[11,5,2,2],[5,7,6,1],[4,2,1,4],[13,6,3,4],[11,1,4,2],[0,6,2,3],[8,9,1,2]];
 function ensureMosaic(doc){
   if(doc.querySelector('.dream-mosaic'))return;
   const svg=doc.createElementNS(NS,'svg');svg.setAttribute('class','dream-mosaic');svg.setAttribute('aria-hidden','true');svg.setAttribute('viewBox','0 0 16 12');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('shape-rendering','crispEdges');svg.setAttribute('fill','#151625');
   for(const [tiles,extra] of [[mosaic50,false],[mosaicExtra,true]]){
     const g=doc.createElementNS(NS,'g');if(extra)g.setAttribute('class','mosaic-extra');
     for(const [x,y,w,h] of tiles){const r=doc.createElementNS(NS,'rect');for(const [k,v] of Object.entries({x,y,width:w,height:h}))r.setAttribute(k,String(v));g.append(r)}svg.append(g);
   }
   doc.body.append(svg);
 }
 const accents=['#6635b7','#a52779','#bd3e37','#007e9d','#986300'];
 const pairs=[['#f4c7de','#35254d'],['#e6d4fc','#311b50'],['#f4d779','#342447'],['#63c7dc','#19243f'],['#a74080','#fff6fa'],['#30244b','#f9e9ff'],['transparent','#181421'],['transparent','#a52779']];
 const shadows=['2.5px 0 #28b8d6,-2.5px .5px #d95197','-2.5px -2.5px #28b8d6,2px 2px #7959c8','0 2.5px #28b8d6,0 -2.5px #d95197','2px -1px #e9c83a,-2px 1px #d95197'];
 function prepareWords(doc){
   const main=doc.querySelector('main');if(!main||main.querySelector('.glitch-word'))return;
   const walker=doc.createTreeWalker(main,4);
   const nodes=[];while(walker.nextNode()){
     const n=walker.currentNode,p=n.parentElement;
     if(n.nodeValue.trim()&&p&&!p.closest('svg,math,.katex,script,style,textarea,pre,code,[hidden],.sr-only,[aria-hidden=true]'))nodes.push(n);
   }
   let count=0;
   for(const n of nodes){
     if(count>250)break;
     const f=doc.createDocumentFragment();
     // Small groups of words preserve whitespace and the existing inline layout.
     const parts=n.nodeValue.match(/\s+|[^\s]+(?:[ \t]+[^\s]+){0,2}/g)||[];
     for(const s of parts){
       if(!s.trim()){f.append(doc.createTextNode(s));continue;}
       const span=doc.createElement('span');span.className='glitch-word';span.textContent=s;f.append(span);count++;
     }
     n.replaceWith(f);
   }
   for(const el of main.querySelectorAll('.home-profile,.summary-wash,.rating-wash,.article-body pre,.article-body blockquote,.filters button[aria-pressed=true],.portrait-stage,.dream-scene')){
     el.dataset.glitchBlock='';
   }
 }
 function styleFrame(doc,frame){
   const r=doc.documentElement;ensureMosaic(doc);prepareWords(doc);
   r.style.setProperty('--glitch-base',pick(accents));r.style.setProperty('--glitch-shadow',shadows[frame-1]);
   for(const span of doc.querySelectorAll('.glitch-word')){
     const k=Math.random(),[bg,fg]=pick(pairs);
     span.style.setProperty('--glitch-word-bg',k<.43?bg:'transparent');
     span.style.setProperty('--glitch-word-ink',k<.43?fg:pick(frame===1?accents:['#efb5d7','#f1d475','#63c7dc','#b49af1','#36244d','#a52779']));
     span.style.setProperty('--glitch-word-shadow',k<.43?'none':pick(shadows));
   }
   for(const el of doc.querySelectorAll('[data-glitch-block]')){
     el.style.setProperty('--glitch-block-bg',pick(['#e8d4ed','#e1d4fa','#edc1d7','#51406e','#39304e']));
     el.style.setProperty('--glitch-block-line',pick(accents));
   }
   r.dataset.dreamFrame=String(frame);
 }
 function clearWords(doc){
   for(const n of doc.querySelectorAll('.glitch-word')){const p=n.parentNode;n.replaceWith(doc.createTextNode(n.textContent||''));p?.normalize()}
   for(const el of doc.querySelectorAll('[data-glitch-block]')){delete el.dataset.glitchBlock;el.style.removeProperty('--glitch-block-bg');el.style.removeProperty('--glitch-block-line')}
   doc.documentElement.style.removeProperty('--glitch-base');doc.documentElement.style.removeProperty('--glitch-shadow');
 }
 // Matrix blends each pixel toward navy without removing its alpha.
 function tint(doc,amount){
   let m=doc.getElementById('wake-photo-matrix');
   if(!m){const s=doc.createElementNS(NS,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.position='absolute';const defs=doc.createElementNS(NS,'defs'),f=doc.createElementNS(NS,'filter');f.id='wake-photo-tint';f.setAttribute('color-interpolation-filters','sRGB');m=doc.createElementNS(NS,'feColorMatrix');m.id='wake-photo-matrix';f.append(m);defs.append(f);s.append(defs);doc.body.append(s)}
   const k=1-amount,r=21/255*amount,g=22/255*amount,b=37/255*amount;
   m.setAttribute('values',[k,0,0,0,r,0,k,0,0,g,0,0,k,0,b,0,0,0,1,0].join(' '));
 }
 let previous=root().dataset.mode,pending=null,generation=0,guard=0,finish=0,raf=0;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const painted=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 function clearMotion(){
   clearTimeout(guard);clearTimeout(finish);cancelAnimationFrame(raf);
   delete root().dataset.dreamFrame;delete root().dataset.wakePhase;clearWords(document);
   document.querySelector('.dream-mosaic')?.remove();
   document.getElementById('wake-photo-tint')?.closest('svg')?.remove();
 }
 function tintTween(from,to,token,duration=280){
   cancelAnimationFrame(raf);const t0=performance.now();tint(document,from);
   function tick(now){if(token!==generation||quiet())return;const p=Math.min(1,(now-t0)/duration);tint(document,from+(to-from)*p);if(p<1)raf=requestAnimationFrame(tick)}
   raf=requestAnimationFrame(tick);
 }
 function armGuard(token){clearTimeout(guard);guard=setTimeout(()=>{if(token===generation)clearMotion()},2500)}
 // Preload visible destination images before the effect, bounded so that
 // slow assets never prevent navigation. CSS is shared and already loaded.
 async function prewarm(doc,base){
   const jobs=[...doc.querySelectorAll('main img:not([loading=lazy])')].slice(0,12).map(el=>{
     try{const url=new URL(el.getAttribute('src'),base);if(url.origin!==location.origin)return Promise.resolve();const img=new Image();img.src=url.href;return img.decode?.().catch(()=>{})||Promise.resolve()}catch{return Promise.resolve()}
   });
   await Promise.race([Promise.all(jobs),wait(140)]);
 }
 document.addEventListener('astro:before-preparation',e=>{
   const token=++generation;pending=null;clearMotion();
   const from=root().dataset.mode,load=e.loader;
   if(quiet())return;
   const valid=()=>token===generation&&!quiet()&&!e.signal?.aborted;
   e.signal?.addEventListener('abort',()=>{if(token===generation){generation++;pending=null;clearMotion()}},{once:true});
   e.loader=async()=>{
     await load();const doc=e.newDocument,next=doc?.documentElement.dataset.mode;
     if(!valid()||!next||next===from)return;
     await prewarm(doc,e.to?.href||location.href);if(!valid())return;
     armGuard(token);
     if(from==='academic'&&next==='personal'){
       styleFrame(document,1);styleFrame(doc,2);
       await painted();await wait(200);
     }else if(from==='personal'&&next==='academic'){
       tint(document,0);getComputedStyle(document.body).backgroundColor;
       root().dataset.wakePhase='out';tintTween(0,.2,token);
       tint(doc,.8);doc.documentElement.dataset.wakePhase='hold-in';
       await painted();await wait(280);
       if(valid())root().dataset.wakePhase='hold-out';
     }
     if(!valid()&&token===generation)clearMotion();
   };
 });
 document.addEventListener('astro:before-swap',e=>{
   const next=e.newDocument.documentElement;
   if(!quiet()&&next.dataset.mode!==root().dataset.mode){
     // Native snapshots can add extra crossfade frames. Skip that animation,
     // while retaining Astro's atomic DOM swap and history handling.
     const vt=e.viewTransition;vt?.ready?.catch(()=>{});try{vt?.skipTransition?.()}catch{}
   }else{delete next.dataset.dreamFrame;delete next.dataset.wakePhase;clearMotion()}
 });
 function detect(){
   const next=root().dataset.mode;
   if(next!==previous){pending=next;previous=next}
   prepareHover();
 }
 async function start(next,token){
   if(token!==generation||next!==root().dataset.mode||quiet())return;
   armGuard(token);
   if(next==='academic'){
     if(root().dataset.wakePhase!=='hold-in'){tint(document,.8);root().dataset.wakePhase='hold-in'}
     await painted();if(token!==generation||quiet())return;
     getComputedStyle(document.body).backgroundColor;
     root().dataset.wakePhase='in';tintTween(.8,0,token);
     finish=setTimeout(()=>{if(token===generation)clearMotion()},300);return;
   }
   if(root().dataset.dreamFrame!=='2')styleFrame(document,2);
   await painted();await wait(200);if(token!==generation||quiet())return;
   styleFrame(document,3);
   await painted();await wait(200);if(token===generation)clearMotion();
 }
 function visible(){detect();if(!pending)return;const next=pending,token=generation;pending=null;start(next,token)}
 // Start from the actual newly swapped DOM, not from page-load (which may
 // wait for unrelated assets and add a fourth apparent pose).
 document.addEventListener('astro:after-swap',visible);
 document.addEventListener('astro:page-load',visible);
 document.addEventListener('site:render',visible);
 for(const media of [reduce,forced])media.addEventListener?.('change',()=>{if(quiet()){pending=null;generation++;clearMotion()}});
 prepareHover();
})();
