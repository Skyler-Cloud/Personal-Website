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
     if(el.style.getPropertyValue('--hover-gradient'))return;
     const c=shuffled(ink);
     el.style.setProperty('--hover-gradient','linear-gradient(90deg,'+c.slice(0,3).join(',')+')');
   });
   document.querySelectorAll('main a:not(.writing-entry h3 a)').forEach(el=>{
     if(!el.style.getPropertyValue('--hover-color'))el.style.setProperty('--hover-color',shuffled(ink)[0]);
   });
 }
 const key='site-mode-navigation';
 let previous=document.documentElement.dataset.mode, pending=null, transition=null, generation=0, cleanup=0;
 const root=()=>document.documentElement;
 function clear(){
   clearTimeout(cleanup);delete root().dataset.modeMotion;
   document.querySelectorAll('[data-reveal-motion]').forEach(el=>{
     delete el.dataset.revealMotion;
     for(const k of ['--dream-delay','--glitch-a','--glitch-b','--glitch-c','--dream-final'])el.style.removeProperty(k);
   });
 }
 function removeIntent(){try{sessionStorage.removeItem(key)}catch{}}
 // Fallback for browsers which perform a full navigation instead of an Astro swap.
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
 function detect(){
   const next=root().dataset.mode;
   if(next!==previous){pending=next;previous=next;generation++;clear();removeIntent()}
   prepareHover();
 }
 function start(next,token){
   if(token!==generation||next!==root().dataset.mode||reduce.matches)return;
   clear();
   const els=[...document.querySelectorAll('main h1,main .section-head h2,main .writing-entry h3 a,main .writing-entry h3:not(:has(a)),main .mode-nav a,main .bio > p')].slice(0,24);
   for(const el of els){
     const c=shuffled(next==='personal'?bright:ink);
     // Preserve the real computed text color, including the graphite-clipped headings.
     const final=getComputedStyle(el).color;
     el.style.setProperty('--dream-final',final==='rgba(0, 0, 0, 0)'||final==='transparent'?getComputedStyle(root()).getPropertyValue('--heading').trim():final);
     el.style.setProperty('--dream-delay',Math.floor(Math.random()*130)+'ms');
     ['--glitch-a','--glitch-b','--glitch-c'].forEach((k,i)=>el.style.setProperty(k,c[i]));
     el.dataset.revealMotion='';
   }
   root().dataset.modeMotion=next==='personal'?'enter':'exit';
   cleanup=setTimeout(()=>{if(token===generation)clear()},1030);
 }
 function visible(){
   detect();
   if(!pending)return;
   const next=pending, token=generation, vt=transition;pending=null;transition=null;
   // The old/new View Transition snapshots can conceal animations on real DOM.
   // Wait for their completion, then start on the next painted frame.
   const ready=vt?.finished?Promise.resolve(vt.finished).catch(()=>{}):Promise.resolve();
   ready.then(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>start(next,token))));
 }
 document.addEventListener('astro:before-swap',e=>{
   transition=e.viewTransition;
   // Invalidate any scheduled reveal when another navigation replaces its DOM.
   generation++;clear();
 });
 document.addEventListener('astro:after-swap',detect);
 document.addEventListener('astro:page-load',visible);
 document.addEventListener('site:render',visible);
 reduce.addEventListener?.('change',e=>{if(e.matches){pending=null;generation++;clear()}});
 prepareHover();
 const from=consumeIntent();if(from){pending=root().dataset.mode;generation++;visible()}
})();
