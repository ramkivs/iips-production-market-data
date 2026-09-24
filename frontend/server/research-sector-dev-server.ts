/**
 * IIPS — Research & Sector SNAPSHOT authorities: DEV/ACCEPTANCE-ONLY launcher (WUI-RS-05A).
 *
 * ══ AUTHORITY ════════════════════════════════════════════════════════════════════════════════
 *  WUI-RS-04 classified the runtime as NO_EXISTING_SUPPORTED_TOPOLOGY_FOUND. WUI-RS-05A
 *  authorises exactly two NON-PRODUCTION additions:
 *    1. a dev/acceptance-only Vite proxy  `/api/*` → `http://127.0.0.1:8788`  (vite.config.ts);
 *    2. this tracked startup mechanism for the Research/Sector authority on port 8788.
 *
 * ══ WHAT THIS FILE DOES — AND DOES NOT ═══════════════════════════════════════════════════════
 *  It calls the ALREADY-ACCEPTED `createResearchSectorServer(8788)` and `.listen(...)` on the
 *  LOOPBACK interface (127.0.0.1) only. It adds no route, no handler, no header, no CORS, no
 *  authentication, no PIT/asOf behaviour and no response transformation: the authority module
 *  and its four SNAPSHOT response contracts are used verbatim. It is not a production server
 *  and claims no certification.
 *
 * ══ USAGE (Windows `npm.cmd` and POSIX `npm` alike) ══════════════════════════════════════════
 *    npm run dev:research-sector      (terminal 1 — authority on 127.0.0.1:8788)
 *    npm run dev                      (terminal 2 — Vite on :5173, proxies /api/* → 8788)
 */
import type http from 'node:http';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createResearchSectorServer } from './research-sector-transport.js';

/** The intended Research/Sector authority port (the accepted `createResearchSectorServer` default). */
export const RESEARCH_SECTOR_DEV_PORT = 8788;

/** Loopback only: the unauthenticated authority must not be exposed beyond local dev/acceptance. */
export const RESEARCH_SECTOR_DEV_HOST = '127.0.0.1';

/**
 * Start the Research/Sector SNAPSHOT authority on loopback. Resolves once listening; rejects on
 * a bind failure (e.g. EADDRINUSE) — nothing is retried on another port or interface.
 */
export function startResearchSectorDevServer(
  port: number = RESEARCH_SECTOR_DEV_PORT,
  host: string = RESEARCH_SECTOR_DEV_HOST,
): Promise<http.Server> {
  const server = createResearchSectorServer(port);
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
  startResearchSectorDevServer().then(
    (server) => {
      console.log(
        `[research-sector] NON-PRODUCTION SNAPSHOT authorities listening on http://${RESEARCH_SECTOR_DEV_HOST}:${RESEARCH_SECTOR_DEV_PORT} ` +
          '(dev/acceptance only; unauthenticated; no certification claimed)',
      );
      const shutdown = (): void => {
        server.close(() => process.exit(0));
      };
      process.once('SIGINT', shutdown);
      process.once('SIGTERM', shutdown);
    },
    (err: unknown) => {
      console.error(`[research-sector] failed to start on ${RESEARCH_SECTOR_DEV_HOST}:${RESEARCH_SECTOR_DEV_PORT}: ${String(err)}`);
      process.exit(1);
    },
  );
}
