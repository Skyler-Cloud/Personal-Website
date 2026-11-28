(()=>{'use strict';if(window.__siteFiltersInstalled)return;window.__siteFiltersInstalled=true;document.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('button'):null;if(!b)return;if(!b.matches('[data-filter]'))return;const bar=b.closest('[data-filters]');if(!bar)return;const chosen=b.dataset.filter,kind=bar.dataset.filters;bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(kind==='writing'){document.querySelectorAll('[data-view]').forEach(x=>{x.hidden=x.dataset.view!==chosen});}else{let count=0;document.querySelectorAll('[data-filter-list="gallery"] [data-category]').forEach(x=>{x.hidden=chosen!=='all'&&x.dataset.category!==chosen;if(!x.hidden)count++});const empty=document.querySelector('.empty-state');if(empty)empty.hidden=count!==0;}});})();

(()=>{'use strict';
 if(window.__dreamMotionInstalled)return;window.__dreamMotionInstalled=true;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const bright=['#28b8d6','#d95197','#e9c83a','#50b776','#e86e59','#7959c8'];
 // Strong, saturated colors dark enough for small text on white paper.
 const ink=['#007b96','#a52779','#886100','#167544','#b53b28','#6537bd'];
 const shuffled=colors=>{const c=[...colors];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]]}return c};
 // A different three-color selection for each entry, stable until page navigation.
 function prepareHover(){
   if(document.documentElement.dataset.mode!=='academic')return;
   document.querySelectorAll('.writing-entry h3 a').forEach(el=>{
     if(el.style.getPropertyValue('--hover-bands'))return;
     const c=shuffled(ink).slice(0,3);
     el.style.setProperty('--hover-color',c[Math.floor(Math.random()*3)]);
     el.style.setProperty('--hover-bands','linear-gradient(90deg,'+c[0]+' 0% 33.3333%,'+c[1]+' 33.3333% 66.6667%,'+c[2]+' 66.6667% 100%)');
   });
   document.querySelectorAll('main a:not(.writing-entry h3 a)').forEach(el=>{
     if(!el.style.getPropertyValue('--hover-color'))el.style.setProperty('--hover-color',shuffled(ink)[0]);
   });
 }

 const key='site-mode-navigation';
 const forced=matchMedia('(forced-colors: active)');
 const quiet=()=>reduce.matches||forced.matches;
 const root=()=>document.documentElement;
 let previous=root().dataset.mode, pending=null, transition=null, generation=0, cleanup=0, wakeTimer=0, wakeGuard=0;
 function clearReveal(){
   clearTimeout(cleanup);delete root().dataset.modeMotion;
   document.querySelectorAll('[data-reveal-motion]').forEach(el=>{
     delete el.dataset.revealMotion;
     for(const k of ['--glitch-a','--glitch-b','--glitch-c','--dream-final'])el.style.removeProperty(k);
   });
 }
 function clearWake(){clearTimeout(wakeTimer);clearTimeout(wakeGuard);delete root().dataset.wakePhase}
 function removeIntent(){try{sessionStorage.removeItem(key)}catch{}}
 document.addEventListener('click',event=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const a=event.target instanceof Element?event.target.closest('a[data-mode-target]'):null;
   if(!a||a.target&&a.target!=='_self'||a.dataset.modeTarget===root().dataset.mode)return;
   try{sessionStorage.setItem(key,JSON.stringify({from:root().dataset.mode,to:a.dataset.modeTarget,path:new URL(a.href).pathname,at:Date.now()}))}catch{}
 },true);
 function consumeIntent(){
   try{
     const raw=sessionStorage.getItem(key);removeIntent();
     const i=raw?JSON.parse(raw):null;
     return i&&i.to===root().dataset.mode&&i.path===location.pathname&&Date.now()-i.at<10000&&i.from!==i.to?i.from:null;
   }catch{return null}
 }
 // Astro's loader is awaited before the DOM swap. Fade only after the next
 // page has loaded, so slow requests cannot leave the reader behind a veil.
 document.addEventListener('astro:before-preparation',e=>{
   const token=++generation;pending=null;transition=null;clearReveal();clearWake();
   const from=root().dataset.mode, load=e.loader;
   if(from!=='personal'||quiet())return;
   e.loader=async()=>{
     await load();
     if(token!==generation||quiet()||e.signal?.aborted||e.newDocument?.documentElement.dataset.mode!=='academic')return;
     root().dataset.wakePhase='out';
     // Wait for a paint before timing the 500ms fade.
     await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
     await new Promise(resolve=>setTimeout(resolve,500));
     if(token!==generation||quiet()||e.signal?.aborted){if(token===generation)clearWake();return;}
     root().dataset.wakePhase='hold';
     // Fail open if navigation is canceled or the incoming page never swaps.
     wakeGuard=setTimeout(()=>{if(token===generation)clearWake()},2000);
   };
 });
 document.addEventListener('astro:before-swap',e=>{
   transition=e.viewTransition;
   const next=e.newDocument.documentElement.dataset.mode;
   if(root().dataset.wakePhase==='hold'&&next==='academic'&&!quiet()){
     e.newDocument.documentElement.dataset.wakePhase='hold';
   }else clearWake();
   clearReveal();
 });
 function detect(){
   const next=root().dataset.mode;
   if(next!==previous){pending=next;previous=next;removeIntent()}
   prepareHover();
 }
 function start(next,token){
   if(token!==generation||next!==root().dataset.mode||quiet()){if(token===generation)clearWake();return;}
   if(next==='academic'){
     clearTimeout(wakeGuard);
     root().dataset.wakePhase='in';
     wakeTimer=setTimeout(()=>{if(token===generation)clearWake()},530);
     return;
   }
   clearReveal();
   // Keep the three poses synchronized and restrict them to a few headings,
   // not paragraphs, navigation, photographs, or the full background.
   const c=shuffled(['#b7aed8','#9fc8d3','#d3a8c4','#c9c39b','#9fc6b0']).slice(0,3);
   const els=[...document.querySelectorAll('main h1,main .section-head h2,main .writing-entry h3 a,main .writing-entry h3:not(:has(a))')].slice(0,10);
   for(const el of els){
     const final=getComputedStyle(el).color;
     el.style.setProperty('--dream-final',final==='rgba(0, 0, 0, 0)'||final==='transparent'?getComputedStyle(root()).getPropertyValue('--heading').trim():final);
     ['--glitch-a','--glitch-b','--glitch-c'].forEach((k,i)=>el.style.setProperty(k,c[i]));
     el.dataset.revealMotion='';
   }
   root().dataset.modeMotion='enter';
   cleanup=setTimeout(()=>{if(token===generation)clearReveal()},630);
 }
 function visible(){
   detect();if(!pending)return;
   const next=pending, token=generation, vt=transition;pending=null;transition=null;
   const ready=vt?.finished?Promise.resolve(vt.finished).catch(()=>{}):Promise.resolve();
   ready.then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>start(next,token))));
 }
 document.addEventListener('astro:after-swap',detect);
 document.addEventListener('astro:page-load',visible);
 document.addEventListener('site:render',visible);
 for(const media of [reduce,forced])media.addEventListener?.('change',()=>{if(quiet()){pending=null;generation++;clearReveal();clearWake()}});
 // Full-document fallback can show the incoming half, but cannot control
 // the browser's preceding document swap. Ordinary client navigation has both halves.
 prepareHover();
 const from=consumeIntent();if(from&&!quiet()){pending=root().dataset.mode;generation++;if(pending==='academic')root().dataset.wakePhase='hold';visible()}
})();
