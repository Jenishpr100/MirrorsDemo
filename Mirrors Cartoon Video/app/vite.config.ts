import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: { host: '127.0.0.1', port: 5173, hmr: process.env.MIRRORS_NO_HMR ? false : undefined, fs: { allow: [path.resolve(import.meta.dirname, '..')] } },
  build: { target: 'esnext', assetsInlineLimit: 0 },
});
