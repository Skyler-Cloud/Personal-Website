(()=>{'use strict';if(window.__siteFiltersInstalled)return;window.__siteFiltersInstalled=true;document.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('button'):null;if(!b)return;if(!b.matches('[data-filter]'))return;const bar=b.closest('[data-filters]');if(!bar)return;const chosen=b.dataset.filter,kind=bar.dataset.filters;bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(kind==='writing'){document.querySelectorAll('[data-view]').forEach(x=>{x.hidden=x.dataset.view!==chosen});}else{let count=0;document.querySelectorAll('[data-filter-list="gallery"] [data-category]').forEach(x=>{x.hidden=chosen!=='all'&&x.dataset.category!==chosen;if(!x.hidden)count++});const empty=document.querySelector('.empty-state');if(empty)empty.hidden=count!==0;}});})();


(()=>{'use strict';
 if(window.__dreamMotionV6Installed)return;window.__dreamMotionV6Installed=true;
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
 const mosaic50=[[11,3,2,2],[0,11,2,1],[11,10,5,1],[5,0,6,4],[2,2,2,4],[14,11,2,1],[10,8,1,3],[15,1,1,2],[0,9,2,2],[11,0,5,1],[5,4,6,3],[0,0,5,2],[0,2,2,4],[8,8,1,1]];
 function ensureMosaic(doc){
   if(doc.querySelector('.dream-mosaic'))return;
   const svg=doc.createElementNS(NS,'svg');svg.setAttribute('class','dream-mosaic');svg.setAttribute('aria-hidden','true');svg.setAttribute('viewBox','0 0 16 12');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('shape-rendering','crispEdges');svg.setAttribute('fill','#151625');
   for(const [tiles,extra] of [[mosaic50,false]]){
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

 // Two quadratic-like curves: accelerate into the cut, decelerate after it.
 const WAKE_MS=300, DREAM_MS=200, IN_CURVE='cubic-bezier(.55,.085,.68,.53)', OUT_CURVE='cubic-bezier(.25,.46,.45,.94)';
 const props=['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','fill','stroke','opacity','filter'];
 const pastel=['#e9c0db','#d7c5f0','#c3d3ee','#e2d1f3'];
 const shadowInk=['#5e3659','#51406f','#3b496b','#694157'];
 const parseColor=v=>{
   if(/^#[0-9a-f]{6}$/i.test(v))return [1,3,5].map(i=>parseInt(v.slice(i,i+2),16)).concat(1);
   const m=v.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);
   return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null;
 };
 function blend(a,b,t){const x=parseColor(a),y=parseColor(b);if(!x||!y)return b;
   return 'rgba('+x.slice(0,3).map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+','+(x[3]+(y[3]-x[3])*t).toFixed(4)+')';
 }
 // Snapshot actual computed colors, including inline MathML/SVG colors.
 // Keep traversal in DOM order and ignore non-painted nodes/definitions.
 function capture(){
   const main=document.querySelector('main'),els=[root(),document.body,...(main?[main,...main.querySelectorAll('*')]:[])];
   const result=new Map();
   for(const el of els){
     if(el.closest('[hidden],.sr-only,script,style,defs,clipPath,mask,.dream-mosaic')||!el.getClientRects().length)continue;
     const st=getComputedStyle(el);if(st.display==='none'||st.visibility==='hidden')continue;
     const a={};for(const p of props){
       if(p==='fill'||p==='stroke'){if(!(el instanceof SVGElement))continue}
       if(p.startsWith('border')){const side=p.slice(6,-5);if(parseFloat(st['border'+side+'Width'])===0)continue}
       if(p==='outlineColor'&&st.outlineStyle==='none')continue;
       if(p==='filter'&&!el.matches('img:not(.portrait),.dream-layer--art,.character-slot'))continue;
       if(p==='opacity'&&!el.matches('img:not(.portrait),.dream-layer,.character-slot,.dream-caption,.meta,.section-link,.contact,.summary'))continue;
       a[p]=st[p];
     }
     result.set(el,a);
   }
   return result;
 }

 let wakeAnimations=[],restoreNative=null,flip=null;
 function cancelWake(){for(const a of wakeAnimations){try{a.cancel()}catch{}}wakeAnimations=[]}
 function animateWake(from,to,incoming){
   cancelWake();let i=0;
   for(const [el,target] of to){
     const original=from.get(el);if(!original)continue;
     const canvas=el===root()||el===document.body;
     const k=i++,delay=canvas?0:(k*17%37),tail=canvas?0:(k*13%32);
     const duration=WAKE_MS-delay-tail;
     const f={},t={},mid={};
     for(const key of Object.keys(target)){
       if(original[key]===undefined||original[key]===target[key])continue;
       f[key]=original[key];t[key]=target[key];
       const c=parseColor(blend(f[key],t[key],.5));
       if(!canvas&&c&&c[3]>.01){
         const tint=(incoming?shadowInk:pastel)[k%4];
         mid[key]=blend(blend(f[key],t[key],.5),tint,.06+((k*7)%5)*.02);
       }else mid[key]=parseColor(f[key])&&parseColor(t[key])?blend(f[key],t[key],.5):f[key];
     }
     if(!Object.keys(f).length)continue;
     // Endpoints are exact, only midpoints and timing are perturbed.
     try{wakeAnimations.push(el.animate([f,{...mid,offset:.5},t],{delay,duration,easing:incoming?OUT_CURVE:IN_CURVE,fill:'both'}))}catch{}
   }
 }
 function removeFlip(){
   if(flip){for(const animation of flip.animations)try{animation.cancel()}catch{};flip.layer.remove();flip=null}
   document.querySelectorAll('.portrait-flip-layer').forEach(el=>el.remove());
   delete root().dataset.portraitFlip;
 }
 function place(layer,r){Object.assign(layer.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'})}
 function createFlip(doc,kind,destURL){
   const src=document.querySelector('.portrait-stage .portrait'),dst=doc.querySelector('.portrait-stage .portrait');
   if(!src||!dst||!src.complete||!src.naturalWidth||!src.getClientRects().length)return;
   let destination;try{destination=new URL(dst.getAttribute('src'),destURL).href}catch{return}
   const r=src.getBoundingClientRect();if(r.width<1||r.height<1||r.bottom<0||r.top>innerHeight)return;
   const layer=document.createElement('div');layer.className='portrait-flip-layer';layer.dataset.kind=kind;layer.setAttribute('aria-hidden','true');layer.setAttribute('data-astro-transition-persist','portrait-mode-flip');
   place(layer,r);
   const widths=kind==='dream'?[.25,.34,.18,.23]:[1];
   let start=0;
   const pieces=[];
   for(const width of widths){
     const piece=document.createElement('div');piece.className='portrait-flip-piece';Object.assign(piece.style,{left:(start*100)+'%',width:(width*100)+'%'});
     for(const [idx,url] of [src.currentSrc||src.src,destination].entries()){
       const face=document.createElement('div');face.className='portrait-flip-face'+(idx?' portrait-flip-back':'');
       // Background is sized to the whole photo, then each slice shows
       // the appropriate region. Use a full-card image inside a clipped face.
       const image=document.createElement('img');image.src=url;image.alt='';image.draggable=false;
       Object.assign(image.style,{position:'absolute',width:(100/width)+'%',maxWidth:'none',height:'100%',left:(-start/width*100)+'%',top:'0',objectFit:'cover',objectPosition:'center',filter:(idx?doc.documentElement.dataset.mode:root().dataset.mode)==='academic'?'grayscale(1)':'none'});
       face.style.overflow='hidden';face.append(image);piece.append(face);
     }
     layer.append(piece);pieces.push(piece);start+=width;
   }
   document.body.append(layer);
   const marker=doc.createElement('div');marker.className='portrait-flip-layer';marker.setAttribute('data-astro-transition-persist','portrait-mode-flip');marker.setAttribute('aria-hidden','true');doc.body.append(marker);
   root().dataset.portraitFlip='true';doc.documentElement.dataset.portraitFlip='true';
   flip={layer,pieces,kind,rect:r,animations:[]};
   for(const [i,piece] of pieces.entries()){
     const deg=kind==='dream'?[105,78,94,65][i]:90;
     const delay=kind==='dream'?[0,25,8,38][i]:0;
     flip.animations.push(piece.animate([{transform:'rotateY(0deg)'},{transform:'rotateY('+deg+'deg)'}],{duration:(kind==='dream'?DREAM_MS:WAKE_MS)-delay,delay,easing:kind==='dream'?'steps(2,end)':IN_CURVE,fill:'both'}));
   }
 }
 function continueFlip(){
   if(!flip)return;
   const dst=document.querySelector('.portrait-stage .portrait');
   if(!dst){removeFlip();return}
   const {layer,rect,kind,pieces}=flip;
   if(!layer.isConnected){document.querySelector('.portrait-flip-layer')?.remove();document.body.append(layer)}
   root().dataset.portraitFlip='true';
   const end=dst.getBoundingClientRect(),duration=kind==='dream'?DREAM_MS:WAKE_MS;
   flip.animations.push(layer.animate([{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'},{left:end.left+'px',top:end.top+'px',width:end.width+'px',height:end.height+'px'}],{duration,easing:OUT_CURVE,fill:'both'}));
   for(const [i,piece] of pieces.entries()){
     const deg=kind==='dream'?[105,78,94,65][i]:90;
     flip.animations.push(piece.animate([{transform:'rotateY('+deg+'deg)'},{transform:'rotateY(180deg)'}],{duration,easing:kind==='dream'?'steps(2,end)':OUT_CURVE,fill:'both'}));
   }
 }
 // Astro 5.18.2 starts the native view transition after its awaited loader.
 // Skip its visual snapshot immediately when that *one* wake swap is
 // requested, rather than waiting for before-swap. Restore the native API
 // immediately, or on cancellation/timeout; retain Astro's own DOM/history.
 function skipNextNative(token){
   if(typeof document.startViewTransition!=='function')return;
   restoreNative?.();
   const original=document.startViewTransition,own=Object.getOwnPropertyDescriptor(document,'startViewTransition');
   let restored=false;
   const restore=()=>{if(restored)return;restored=true;try{
     if(document.startViewTransition===once){if(own)Object.defineProperty(document,'startViewTransition',own);else delete document.startViewTransition}
   }catch{}if(restoreNative===restore)restoreNative=null};
   function once(...args){restore();const vt=original.apply(this,args);
     if(token===generation){vt.ready?.catch(()=>{});try{vt.skipTransition()}catch{}}
     return vt;
   }
   try{document.startViewTransition=once;if(document.startViewTransition===once)restoreNative=restore}catch{}
 }
 let previous=root().dataset.mode,pending=null,generation=0,guard=0,finish=0;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const painted=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 function clearMotion(){
   clearTimeout(guard);clearTimeout(finish);restoreNative?.();cancelWake();removeFlip();
   delete root().dataset.dreamFrame;delete root().dataset.wakePhase;clearWords(document);
   document.querySelector('.dream-mosaic')?.remove();
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
       createFlip(doc,'dream',e.to?.href||location.href);
       await wait(DREAM_MS);if(valid())skipNextNative(token);
     }else if(from==='personal'&&next==='academic'){
       // All loading is finished before the animation begins. Set target
       // styles and install starting keyframes in the same JS turn.
       const before=capture();
       root().dataset.wakePhase='out';
       const end=capture();animateWake(before,end,false);
       doc.documentElement.dataset.wakePhase='hold-in';
       createFlip(doc,'wake',e.to?.href||location.href);
       await wait(WAKE_MS);
       if(valid())skipNextNative(token)
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
   }else{delete next.dataset.dreamFrame;delete next.dataset.wakePhase;delete next.dataset.portraitFlip;clearMotion()}
 });
 function detect(){
   const next=root().dataset.mode;
   if(next!==previous){pending=next;previous=next}
   prepareHover();
 }
 async function start(next,token){
   if(token!==generation||next!==root().dataset.mode||quiet())return;
   armGuard(token);continueFlip();
   if(next==='academic'){
     // Do not wait for page-load, a timer, or another animation frame:
     // compute the incoming start/end and begin easing before the next paint.
     cancelWake();
     if(root().dataset.wakePhase!=='hold-in')root().dataset.wakePhase='hold-in';
     const from=capture();
     root().dataset.wakePhase='in';
     const to=capture();animateWake(from,to,true);
     finish=setTimeout(()=>{if(token===generation)clearMotion()},WAKE_MS+20);return;
   }
   if(root().dataset.dreamFrame!=='2')styleFrame(document,2);
   await wait(DREAM_MS);if(token===generation)clearMotion();
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
