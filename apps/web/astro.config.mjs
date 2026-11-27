import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({output:'static', prefetch:{prefetchAll:false,defaultStrategy:'hover'}, trailingSlash:'always', build:{format:'directory'}, site:process.env.SITE_URL || undefined, base:process.env.BASE_PATH || '/', vite:{server:{fs:{allow:[fileURLToPath(new URL('../..',import.meta.url))]}}}});
