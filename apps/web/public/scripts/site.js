(()=>{'use strict';if(window.__siteFiltersInstalled)return;window.__siteFiltersInstalled=true;document.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('button'):null;if(!b)return;if(!b.matches('[data-filter]'))return;const bar=b.closest('[data-filters]');if(!bar)return;const chosen=b.dataset.filter,kind=bar.dataset.filters;bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(kind==='writing'){document.querySelectorAll('[data-view]').forEach(x=>{x.hidden=x.dataset.view!==chosen});}else{let count=0;document.querySelectorAll('[data-filter-list="gallery"] [data-category]').forEach(x=>{x.hidden=chosen!=='all'&&x.dataset.category!==chosen;if(!x.hidden)count++});const empty=document.querySelector('.empty-state');if(empty)empty.hidden=count!==0;}});})();

(()=>{'use strict';
 if(window.__dreamMotionInstalled)return;window.__dreamMotionInstalled=true;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 // Strong, saturated colors dark enough for small text on white paper.
 const ink=['#007b96','#a52779','#886100','#167544','#b53b28','#6537bd'];
 const shuffled=colors=>{const c=[...colors];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]]}return c};
 // Keep three ink colors per entry; choose a different title ink on each new hover.
 function prepareHover(){
   if(document.documentElement.dataset.mode!=='academic')return;
   document.querySelectorAll('.writing-entry h3 a').forEach(el=>{
     if(el.style.getPropertyValue('--hover-bands'))return;
     const c=shuffled(ink).slice(0,3);
     el.dataset.hoverPalette=c.join(',');
     el.style.setProperty('--hover-color',c[Math.floor(Math.random()*3)]);
     el.style.setProperty('--hover-bands','linear-gradient(90deg,'+c[0]+' 0% 33.3333%,'+c[1]+' 33.3333% 66.6667%,'+c[2]+' 66.6667% 100%)');
   });
   document.querySelectorAll('main a:not(.writing-entry h3 a)').forEach(el=>{
     if(!el.style.getPropertyValue('--hover-color'))el.style.setProperty('--hover-color',shuffled(ink)[0]);
   });
 }


 // Pointerover bubbles, including after Astro replaces the body. Only a real
 // entry boundary counts, not moving between its title and metadata.
 function cycleInk(entry){
   const a=entry?.querySelector('h3 a');if(!a)return;
   prepareHover();
   const palette=(a.dataset.hoverPalette||'').split(',').filter(Boolean);
   const next=palette.filter(c=>c!==a.style.getPropertyValue('--hover-color'));
   if(next.length)a.style.setProperty('--hover-color',next[Math.floor(Math.random()*next.length)]);
 }
 function entryFrom(target){return target instanceof Element?target.closest('.writing-entry'):null}
 document.addEventListener('pointerover',e=>{
   if(document.documentElement.dataset.mode!=='academic'||e.pointerType==='touch')return;
   const entry=entryFrom(e.target);if(entry&&entry!==entryFrom(e.relatedTarget))cycleInk(entry);
 });
 document.addEventListener('focusin',e=>{
   if(document.documentElement.dataset.mode!=='academic')return;
   const entry=entryFrom(e.target);if(entry&&entry!==entryFrom(e.relatedTarget)&&!entry.matches(':hover'))cycleInk(entry);
 });
 const key='site-mode-navigation',forced=matchMedia('(forced-colors: active)');
 const quiet=()=>reduce.matches||forced.matches;
 const root=()=>document.documentElement;
 let previous=root().dataset.mode,pending=null,transition=null,generation=0,guard=0,finish=0;
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const painted=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 function clearMotion(){
   clearTimeout(guard);clearTimeout(finish);
   delete root().dataset.dreamFrame;delete root().dataset.wakePhase;
 }
 function removeIntent(){try{sessionStorage.removeItem(key)}catch{}}
 document.addEventListener('click',event=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const a=event.target instanceof Element?event.target.closest('a[data-mode-target]'):null;
   if(!a||a.target&&a.target!=='_self'||a.dataset.modeTarget===root().dataset.mode)return;
   try{sessionStorage.setItem(key,JSON.stringify({from:root().dataset.mode,to:a.dataset.modeTarget,path:new URL(a.href).pathname,at:Date.now()}))}catch{}
 },true);
 function consumeIntent(){
   try{const raw=sessionStorage.getItem(key);removeIntent();const i=raw?JSON.parse(raw):null;
     return i&&i.to===root().dataset.mode&&i.path===location.pathname&&Date.now()-i.at<10000&&i.from!==i.to?i.from:null;
   }catch{return null}
 }
 function armGuard(token){clearTimeout(guard);guard=setTimeout(()=>{if(token===generation)clearMotion()},2500)}
 // Delay the swap only after Astro has successfully loaded the target page.
 // If navigation is superseded or motion is disabled, abandon the old effect.
 document.addEventListener('astro:before-preparation',e=>{
   const token=++generation;pending=null;transition=null;clearMotion();
   const from=root().dataset.mode,load=e.loader;
   if(quiet())return;
   const valid=()=>token===generation&&!quiet()&&!e.signal?.aborted;
   e.signal?.addEventListener('abort',()=>{if(token===generation){generation++;pending=null;clearMotion()}},{once:true});
   e.loader=async()=>{
     await load();
     const next=e.newDocument?.documentElement.dataset.mode;
     if(!valid()||!next||next===from)return;
     if(from==='academic'&&next==='personal'){
       root().dataset.dreamFrame='1';armGuard(token);
       await painted();await wait(200);
     }else if(from==='personal'&&next==='academic'){
       // Force the old palette to be resolved before activating transitions.
       getComputedStyle(document.body).backgroundColor;
       root().dataset.wakePhase='out';armGuard(token);
       await painted();await wait(500);
       if(valid())root().dataset.wakePhase='hold';
     }
     if(!valid()&&token===generation)clearMotion();
   };
 });
 document.addEventListener('astro:before-swap',e=>{
   transition=e.viewTransition;
   const next=e.newDocument.documentElement;
   if(!quiet()&&root().dataset.dreamFrame==='1'&&next.dataset.mode==='personal'){
     next.dataset.dreamFrame='2';
   }else if(!quiet()&&root().dataset.wakePhase==='hold'&&next.dataset.mode==='academic'){
     next.dataset.wakePhase='hold';
   }else clearMotion();
 });
 function detect(){
   const next=root().dataset.mode;
   if(next!==previous){pending=next;previous=next;removeIntent()}
   prepareHover();
 }
 async function start(next,token){
   if(token!==generation||next!==root().dataset.mode||quiet())return;
   armGuard(token);
   if(next==='academic'){
     // The incoming DOM starts at the identical midpoint palette. Resolve
     // that state before enabling the transition to its own normal tokens.
     root().dataset.wakePhase='hold';
     await painted();
     if(token!==generation||quiet())return;
     getComputedStyle(document.body).backgroundColor;
     root().dataset.wakePhase='in';
     finish=setTimeout(()=>{if(token===generation)clearMotion()},520);
     return;
   }
   root().dataset.dreamFrame='2';
   await painted();await wait(200);
   if(token!==generation||quiet())return;
   root().dataset.dreamFrame='3';
   await painted();await wait(200);
   if(token===generation)clearMotion();
 }
 function visible(){
   detect();if(!pending)return;
   const next=pending,token=generation,vt=transition;pending=null;transition=null;
   const ready=vt?.finished?Promise.resolve(vt.finished).catch(()=>{}):Promise.resolve();
   ready.then(()=>start(next,token));
 }
 document.addEventListener('astro:after-swap',detect);
 document.addEventListener('astro:page-load',visible);
 document.addEventListener('site:render',visible);
 for(const media of [reduce,forced])media.addEventListener?.('change',()=>{if(quiet()){pending=null;generation++;clearMotion()}});
 prepareHover();
 const from=consumeIntent();
 if(from&&!quiet()){pending=root().dataset.mode;generation++;visible()}
})();
