import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
  },
  server: {
    host: true, // 相当于 host: '0.0.0.0'
    port: parseInt(process.env.PORT || '8080'),
  },
  preview: {
    host: true, // 必须开启，否则云端无法外部访问
    port: parseInt(process.env.PORT || '8080'),
  }
});