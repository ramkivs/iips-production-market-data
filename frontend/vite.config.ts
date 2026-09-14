import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Program v3.0 Phase 3 — Vite config for the application shell.
// Presentation-only. No platform/engine logic here.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy the v3.0 executive transport (runs the certified platform in-process).
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
} as Parameters<typeof defineConfig>[0]);
