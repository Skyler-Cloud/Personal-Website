import {readFileSync} from 'node:fs';
export function tokenCSS(root:URL){
  const t=JSON.parse(readFileSync(root,'utf8'));
  const vars=(o:Record<string,string>)=>Object.entries(o).map(([k,v])=>{if(!/^[a-z-]+$/.test(k)||!/^#[0-9a-f]{6}$/i.test(v))throw Error('Invalid design token '+k);return '--'+k+':'+v+';'}).join('');
  const font=(s:string)=>{if(!/^[\w -]+$/.test(s))throw Error('Invalid font name');return JSON.stringify(s)};
  const weight=(v:unknown)=>{if(typeof v!=='number'||!Number.isInteger(v)||v<100||v>900)throw Error('Invalid font weight');return v};
  const style=(v:unknown)=>{if(v!=='normal'&&v!=='italic')throw Error('Invalid font style');return v};
  return ['personal','academic'].map(m=>{const {colors,fonts}=t[m];return (m==='personal'?':root':'html[data-mode=academic]')+'{'+vars(colors)+'--font-heading:'+font(fonts.heading)+';--font-body:'+font(fonts.body)+';--heading-weight:'+weight(fonts.headingWeight)+';--heading-style:'+style(fonts.headingStyle)+';--entry-weight:'+weight(fonts.entryWeight)+';--entry-style:'+style(fonts.entryStyle)+';--heading-fallback:'+(m==='academic'?'serif':'system-ui')+';}'}).join('');
}
