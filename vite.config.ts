import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Dev-only: permit sandboxed/remote preview hosts (e.g. *.e2b.app) to load the dev
    // server. This affects the LOCAL DEV SERVER ONLY — it is not a production setting, does
    // not open a network surface in the built artifact, and introduces no provider, socket
    // or credential. `npm run build` output is unaffected.
    allowedHosts: true,
  },
  build: {
    outDir: 'dist-frontend',
    sourcemap: true,
  },
});
