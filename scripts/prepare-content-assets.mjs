// Publish author-owned content assets at their existing /assets/ URLs.
// The destination is generated, never a second editable source.
import { cp, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source=fileURLToPath(new URL('../content/assets/',import.meta.url));
const target=fileURLToPath(new URL('../apps/web/public/assets/',import.meta.url));
if(!(await stat(source)).isDirectory()) throw Error('Missing content/assets directory');
await rm(target,{recursive:true,force:true});
await cp(source,target,{recursive:true});
