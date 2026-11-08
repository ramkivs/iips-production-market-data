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
    // Release artifacts must not embed original source in source maps: dev-only
    // harness code and provider-adjacent modules would otherwise be recoverable
    // from the published .map files. Internal debugging uses the dev server
    // (vite serves maps in dev regardless of this setting) and the unpublished
    // tsc `dist/` output, which keeps sourceMap: true in tsconfig.json.
    sourcemap: false,
  },
});
