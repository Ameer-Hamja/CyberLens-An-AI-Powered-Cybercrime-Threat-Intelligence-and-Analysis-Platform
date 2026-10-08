import {build} from 'vite';import tailwind from '@tailwindcss/vite';import {resolve} from 'node:path';
await build({configFile:false,plugins:[tailwind()],build:{emptyOutDir:false,target:'es2022',lib:{entry:resolve('src/content.ts'),name:'CyberLensContent',formats:['iife'],fileName:()=> 'content.js'},outDir:'dist'}});
