/**
 * IIPS — Executive certified authority: DEV/ACCEPTANCE-ONLY launcher (R-1, NON-PRODUCTION).
 *
 * ══ AUTHORITY ════════════════════════════════════════════════════════════════════════════════
 *  WUI-RS-05D-D3 (docs/WUI_RS_05D_D3_EXECUTIVE_404_FORENSIC.md) established that `/api/executive`
 *  returned 404 in dev because the single `/api` proxy targets the Research/Sector authority on
 *  8788 and the existing Executive server (`createExecutiveServer`, port 8787) was never started.
 *  R-1 authorises exactly:
 *    1. this tracked startup mechanism for the EXISTING Executive authority on 127.0.0.1:8787;
 *    2. a `dev:executive` npm script;
 *    3. a dev-server-only Vite proxy rule `/api/executive` → `http://127.0.0.1:8787`, placed
 *       before the generic `/api` → 8788 rule (vite.config.ts).
 *
 * ══ WHAT THIS FILE DOES — AND DOES NOT ═══════════════════════════════════════════════════════
 *  It calls the ALREADY-EXISTING `createExecutiveServer(8787)` and `.listen(...)` on the LOOPBACK
 *  interface (127.0.0.1) only. It adds no route, no handler, no header, no authentication, no
 *  PIT/asOf behaviour and no response transformation: the Executive transport, its certified
 *  computation and its payload are used verbatim. It is not a production server and claims no
 *  production certification.
 *
 * ══ USAGE (Windows `npm.cmd` and POSIX `npm` alike) ══════════════════════════════════════════
 *    npm run dev:research-sector      (terminal 1 — Research/Sector authority on 127.0.0.1:8788)
 *    npm run dev:executive            (terminal 2 — Executive authority on 127.0.0.1:8787)
 *    npm run dev                      (terminal 3 — Vite on :5173; /api/executive → 8787, /api/* → 8788)
 */
import type http from 'node:http';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createExecutiveServer } from './executive-transport.js';

/** The intended Executive authority port (the existing `createExecutiveServer` default). */
export const EXECUTIVE_DEV_PORT = 8787;

/** Loopback only: the unauthenticated authority must not be exposed beyond local dev/acceptance. */
export const EXECUTIVE_DEV_HOST = '127.0.0.1';

/**
 * Start the existing Executive authority on loopback. Resolves once listening; rejects on a bind
 * failure (e.g. EADDRINUSE) — nothing is retried on another port or interface.
 */
export function startExecutiveDevServer(
  port: number = EXECUTIVE_DEV_PORT,
  host: string = EXECUTIVE_DEV_HOST,
): Promise<http.Server> {
  const server = createExecutiveServer(port);
  return new Promise((resolvePromise, rejectPromise) => {
    const onError = (err: Error): void => {
      server.off('listening', onListening);
      rejectPromise(err);
    };
    const onListening = (): void => {
      server.off('error', onError);
      resolvePromise(server);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

/** True only when this module is the process entry point (not when imported by a test). */
function isEntryPoint(): boolean {
  const entry = process.argv[1];
  if (typeof entry !== 'string') return false;
  const self = resolvePath(fileURLToPath(import.meta.url));
  const main = resolvePath(entry);
  // Windows paths are case-insensitive (drive letter casing may differ between npm.cmd and node).
  return process.platform === 'win32' ? self.toLowerCase() === main.toLowerCase() : self === main;
}

if (isEntryPoint()) {
  startExecutiveDevServer().then(
    (server) => {
      console.log(
        `[executive] NON-PRODUCTION Executive authority listening on http://${EXECUTIVE_DEV_HOST}:${EXECUTIVE_DEV_PORT} ` +
          '(dev/acceptance only; unauthenticated; no production claim)',
      );
      const shutdown = (): void => {
        server.close(() => process.exit(0));
      };
      process.once('SIGINT', shutdown);
      process.once('SIGTERM', shutdown);
    },
    (err: unknown) => {
      console.error(`[executive] failed to start on ${EXECUTIVE_DEV_HOST}:${EXECUTIVE_DEV_PORT}: ${String(err)}`);
      process.exit(1);
    },
  );
}
