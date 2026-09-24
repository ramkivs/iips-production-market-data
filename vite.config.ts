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
    // WUI-RS-05A — DEV/ACCEPTANCE-ONLY API proxy (NON-PRODUCTION).
    // The browser clients call RELATIVE `/api/...` URLs (unchanged). Under the local Vite dev
    // server ONLY, those requests are forwarded to the Research/Sector SNAPSHOT authority started
    // on loopback by `npm run dev:research-sector` (frontend/server/research-sector-dev-server.ts).
    // `server.proxy` is not part of `vite build` output and is deliberately NOT mirrored into
    // `preview`: this is not a production reverse proxy, adds no CORS, rewrites no path, and
    // changes no API contract or browser base URL.
    //
    // R-1 — DEV/ACCEPTANCE-ONLY Executive rule (NON-PRODUCTION). `/api/executive` (exact path,
    // optional query) is forwarded to the EXISTING Executive authority started on loopback by
    // `npm run dev:executive` (frontend/server/executive-dev-server.ts, port 8787). Vite applies
    // the FIRST matching key in declaration order, so this rule MUST stay above the generic
    // `/api` rule; every other `/api/...` path (incl. `/api/executive-*`) still goes to 8788.
    proxy: {
      '^/api/executive(?:\\?.*)?$': {
        target: 'http://127.0.0.1:8787',
      },
      '/api': {
        target: 'http://127.0.0.1:8788',
      },
    },
  },
  build: {
    outDir: 'dist-frontend',
    sourcemap: true,
  },
});
