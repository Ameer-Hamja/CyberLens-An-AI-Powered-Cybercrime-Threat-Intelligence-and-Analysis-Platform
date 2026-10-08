import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { resolve } from 'node:path';
export default defineConfig({plugins:[react(),tailwind()],build:{target:'es2022',rollupOptions:{input:{popup:resolve('popup.html'),options:resolve('options.html'),sidepanel:resolve('sidepanel.html'),report:resolve('report.html'),background:resolve('src/background.ts')},output:{entryFileNames:'[name].js',chunkFileNames:'assets/[name]-[hash].js'}}}});
