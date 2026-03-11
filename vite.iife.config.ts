import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/global.ts'),
      name: 'formationAnalytics',
      formats: ['iife'],
      fileName: () => 'analytics.iife.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
});
