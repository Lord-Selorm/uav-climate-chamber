import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2020',
  },
  server: {
    port: 8000,
    open: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
});
