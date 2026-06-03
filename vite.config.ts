import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    minify: 'terser',
  },
  server: {
    port: 3000
  }
});