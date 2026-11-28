(()=>{'use strict';if(window.__siteFiltersInstalled)return;window.__siteFiltersInstalled=true;document.addEventListener('click',e=>{const b=e.target instanceof Element?e.target.closest('button'):null;if(!b)return;if(!b.matches('[data-filter]'))return;const bar=b.closest('[data-filters]');if(!bar)return;const chosen=b.dataset.filter,kind=bar.dataset.filters;bar.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(kind==='writing'){document.querySelectorAll('[data-view]').forEach(x=>{x.hidden=x.dataset.view!==chosen});}else{let count=0;document.querySelectorAll('[data-filter-list="gallery"] [data-category]').forEach(x=>{x.hidden=chosen!=='all'&&x.dataset.category!==chosen;if(!x.hidden)count++});const empty=document.querySelector('.empty-state');if(empty)empty.hidden=count!==0;}});})();

(()=>{'use strict';
 if(window.__dreamMotionInstalled)return;window.__dreamMotionInstalled=true;
 let previous=document.documentElement.dataset.mode, generation=0, cleanup;
 const palette=['#28b8d6','#d95197','#e9c83a','#50b776','#e86e59','#7959c8'];
 const clear=()=>{clearTimeout(cleanup);delete document.documentElement.dataset.modeMotion;document.querySelectorAll('[data-reveal-motion]').forEach(el=>{delete el.dataset.revealMotion;for(const k of ['--dream-delay','--glitch-a','--glitch-b','--glitch-c'])el.style.removeProperty(k);});};
 function reveal(){
   const root=document.documentElement,next=root.dataset.mode;
   if(next===previous){if(!root.dataset.modeMotion)clear();return;}
   previous=next;clear();const token=++generation;
   if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const els=[...document.querySelectorAll('main h1,main .section-head h2,main .writing-entry h3 a,main .writing-entry h3:not(:has(a)),main .mode-nav a,main .bio > p')].slice(0,24);
   for(const el of els){
     const c=[...palette];for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]]}
     el.style.setProperty('--dream-delay',Math.floor(Math.random()*130)+'ms');
     ['--glitch-a','--glitch-b','--glitch-c'].forEach((k,i)=>el.style.setProperty(k,c[i]));el.dataset.revealMotion='';
   }
   root.dataset.modeMotion=next==='personal'?'enter':'exit';
   cleanup=setTimeout(()=>{if(token===generation)clear()},1020);
 }
 // Astro swaps the document before this event; hash preview emits site:render.
 document.addEventListener('astro:after-swap',reveal);
 document.addEventListener('site:render',reveal);
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{if(e.matches)clear()});
})();
