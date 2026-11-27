// Copy KaTeX's pinned package assets without a CDN or runtime dependency.
import { mkdir, copyFile, cp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const src=dirname(require.resolve('katex/dist/katex.min.css'));
const dest=fileURLToPath(new URL('../apps/web/public/vendor/katex/',import.meta.url));
await mkdir(dest,{recursive:true});
await copyFile(join(src,'katex.min.css'),join(dest,'katex.min.css'));
await cp(join(src,'fonts'),join(dest,'fonts'),{recursive:true});
