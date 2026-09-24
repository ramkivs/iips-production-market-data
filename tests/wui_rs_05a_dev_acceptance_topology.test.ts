/**
 * Test Suite: WUI-RS-05A — NON-PRODUCTION Research/Sector SNAPSHOT runtime topology.
 *
 * Authorised scope (exactly two additions):
 *   1. DEV/ACCEPTANCE-ONLY Vite proxy: browser-relative `/api/*` → `http://127.0.0.1:8788`.
 *   2. Tracked startup of `createResearchSectorServer(8788)` + `.listen(...)` on loopback
 *      (`frontend/server/research-sector-dev-server.ts`, `npm run dev:research-sector`).
 *
 * What is asserted:
 *   T-01  the authority starts on the intended port (8788), loopback-bound only;
 *   T-02  all four existing SNAPSHOT endpoints respond over HTTP with the UNCHANGED contract
 *         (status + JSON body identical to `handleResearchSectorRequest`), plus health;
 *   T-03  the launcher adds no header, CORS or route and fails closed on a busy port;
 *   T-04  vite.config.ts carries exactly the intended dev-server proxy (and no preview proxy);
 *   T-05  a real Vite dev server forwards relative `/api/...` to the authority end-to-end;
 *   T-06  the four browser clients remain relative `/api` clients (no base URL, no 8788);
 *   T-07  the npm startup script is Windows-compatible (no Unix-only syntax) and scoped;
 *   T-08  the authority module still exports the same contract surface and is not imported
 *         by the browser graph.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  startResearchSectorDevServer,
  RESEARCH_SECTOR_DEV_PORT,
  RESEARCH_SECTOR_DEV_HOST,
} from '../frontend/server/research-sector-dev-server.js';
import { handleResearchSectorRequest } from '../frontend/server/research-sector-transport.js';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const stripComments = (s: string): string => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** The four existing SNAPSHOT authorities (contract unchanged). */
const ENDPOINTS = [
  '/api/company/Banking',
  '/api/decision-matrix',
  '/api/evidence/Banking',
  '/api/replay/Banking',
] as const;

function close(server: http.Server | undefined): Promise<void> {
  return new Promise((r) => (server && server.listening ? server.close(() => r()) : r()));
}

describe('WUI-RS-05A — Research/Sector authority on the intended port', () => {
  let server: http.Server | undefined;

  before(async () => {
    server = await startResearchSectorDevServer();
  });
  after(async () => {
    await close(server);
  });

  it('T-01: the authority listens on 127.0.0.1:8788 (loopback only)', () => {
    assert.strictEqual(RESEARCH_SECTOR_DEV_PORT, 8788);
    assert.strictEqual(RESEARCH_SECTOR_DEV_HOST, '127.0.0.1');
    assert.ok(server?.listening, 'the authority must be listening');
    const addr = server!.address() as AddressInfo;
    assert.strictEqual(addr.port, 8788, 'intended port');
    assert.strictEqual(addr.address, '127.0.0.1', 'must not bind beyond loopback');
  });

  it('T-02: all four SNAPSHOT endpoints respond with the unchanged contract (+ health)', async () => {
    for (const path of ENDPOINTS) {
      const res = await fetch(`http://127.0.0.1:8788${path}`);
      const expected = handleResearchSectorRequest(path, 'GET');
      assert.strictEqual(expected.status, 200, `${path} handler baseline`);
      assert.strictEqual(res.status, 200, `${path} HTTP status`);
      assert.match(res.headers.get('content-type') ?? '', /^application\/json/, `${path} content type`);
      assert.deepStrictEqual(await res.json(), JSON.parse(JSON.stringify(expected.body)), `${path} body is the unchanged contract`);
    }
    const health = await fetch('http://127.0.0.1:8788/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(((await health.json()) as { status: string }).status, 'ok');
  });

  it('T-03a: SNAPSHOT refusal semantics are preserved over HTTP (asOf → 400, unknown → 404)', async () => {
    assert.strictEqual((await fetch('http://127.0.0.1:8788/api/company/Banking?asOf=2026-01-01')).status, 400);
    assert.strictEqual((await fetch('http://127.0.0.1:8788/api/company/NoSuchSector')).status, 404);
  });

  it('T-03b: no CORS or extra header is introduced by the launcher', async () => {
    const res = await fetch('http://127.0.0.1:8788/api/decision-matrix');
    assert.strictEqual(res.headers.get('access-control-allow-origin'), null, 'no CORS workaround');
    assert.strictEqual(res.headers.get('x-iips-authentication'), 'NONE (non-production, unauthenticated development transport)');
    assert.strictEqual(res.headers.get('x-iips-certification'), 'NONE CLAIMED');
  });

  it('T-03c: a busy port fails closed — no silent fallback to another port', async () => {
    await assert.rejects(startResearchSectorDevServer(), (e: NodeJS.ErrnoException) => e.code === 'EADDRINUSE');
  });
});

describe('WUI-RS-05A — launcher source boundaries', () => {
  const src = read('frontend/server/research-sector-dev-server.ts');
  const code = stripComments(src);

  it('T-03d: the launcher only calls createResearchSectorServer + listen (no handlers, CORS, auth, PIT)', () => {
    const imports = [...src.matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(imports, ['node:http', 'node:path', 'node:url', './research-sector-transport.js']);
    assert.match(code, /createResearchSectorServer\(port\)/);
    assert.match(code, /server\.listen\(port, host\)/);
    for (const banned of ['setHeader', 'Access-Control', 'createServer(', 'handleResearchSectorRequest',
      'guardRead', 'asOf', 'process.env', '0.0.0.0', 'fetch(']) {
      assert.strictEqual(code.includes(banned), false, `launcher must not contain ${banned}`);
    }
  });
});

describe('WUI-RS-05A — Vite dev/acceptance proxy', () => {
  const cfg = read('vite.config.ts');
  const cfgCode = stripComments(cfg);

  it('T-04: vite.config.ts proxies /api to http://127.0.0.1:8788 under `server` only', () => {
    assert.match(cfgCode, /server:\s*\{[\s\S]*proxy:\s*\{\s*'\/api':\s*\{\s*target:\s*'http:\/\/127\.0\.0\.1:8788',?\s*\},?\s*\}/);
    assert.strictEqual((cfgCode.match(/proxy:/g) ?? []).length, 1, 'exactly one proxy block');
    assert.strictEqual(/preview\s*:/.test(cfgCode), false, 'no preview (production-like) proxy');
    assert.strictEqual(/rewrite|changeOrigin|Access-Control|cors/i.test(cfgCode), false, 'no rewrite/CORS semantics');
    assert.strictEqual((cfgCode.match(/https?:\/\//g) ?? []).length, 1, 'the only target is the loopback authority');
    assert.match(cfg, /DEV\/ACCEPTANCE-ONLY/, 'the proxy is explicitly labelled dev/acceptance-only');
  });

  it('T-05: a real Vite dev server forwards relative /api/... to the authority end-to-end', async () => {
    const { createServer } = await import('vite');
    const authority = await startResearchSectorDevServer();
    const vite = await createServer({
      configFile: resolve(ROOT, 'vite.config.ts'),
      root: ROOT,
      logLevel: 'silent',
      server: { port: 0, host: '127.0.0.1', strictPort: false, hmr: false, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    try {
      await vite.listen();
      const port = (vite.httpServer!.address() as AddressInfo).port;
      for (const path of ENDPOINTS) {
        const res = await fetch(`http://127.0.0.1:${port}${path}`);
        assert.strictEqual(res.status, 200, `${path} via the Vite proxy`);
        assert.deepStrictEqual(await res.json(), JSON.parse(JSON.stringify(handleResearchSectorRequest(path).body)), `${path} proxied body`);
      }
    } finally {
      await vite.close();
      await close(authority);
    }
  });
});

describe('WUI-RS-05A — browser clients and contracts unchanged', () => {
  const CLIENTS: Record<string, RegExp> = {
    'frontend/src/api/company.ts': /authFetch\(`\$\{baseUrl\}\/api\/company\/\$\{encodeURIComponent\(sector\)\}`\)/,
    'frontend/src/api/decisionMatrix.ts': /authFetch\(`\$\{baseUrl\}\/api\/decision-matrix`\)/,
    'frontend/src/api/evidence.ts': /authFetch\(`\$\{baseUrl\}\/api\/evidence\/\$\{encodeURIComponent\(sector\)\}`\)/,
    'frontend/src/api/replay.ts': /authFetch\(`\$\{baseUrl\}\/api\/replay\/\$\{encodeURIComponent\(sector\)\}`\)/,
  };

  it('T-06: the four clients remain relative /api clients (default baseUrl empty, no absolute URL)', () => {
    for (const [file, call] of Object.entries(CLIENTS)) {
      const code = stripComments(read(file));
      assert.match(code, call, `${file} must call a relative /api path`);
      assert.match(code, /baseUrl = ''/, `${file} default base URL must stay empty`);
      assert.strictEqual(/https?:\/\/|8788|127\.0\.0\.1|localhost/.test(code), false, `${file} must not hardcode a host`);
    }
  });

  it('T-06b: no browser file references the authority port or loopback host', () => {
    const walk = (rel: string): string[] =>
      readdirSync(resolve(ROOT, rel), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(`${rel}/${e.name}`) : /\.(ts|tsx)$/.test(e.name) ? [`${rel}/${e.name}`] : []);
    for (const f of walk('frontend/src')) {
      const code = stripComments(read(f));
      assert.strictEqual(/8788|127\.0\.0\.1/.test(code), false, `${f} must not reference the dev authority`);
      assert.strictEqual(/research-sector-dev-server/.test(code), false, `${f} must not import the launcher`);
      assert.strictEqual(/from 'node:/.test(code), false, `${f} must not import a node: builtin`);
    }
  });

  it('T-07: the npm startup script is Windows-compatible and dev-scoped', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const script = pkg.scripts['dev:research-sector'];
    assert.ok(script, 'dev:research-sector script must exist');
    assert.ok(script.endsWith('node dist/frontend/server/research-sector-dev-server.js'), 'launches the tracked launcher');
    // Unix-only constructs that break under npm.cmd / cmd.exe.
    for (const unixOnly of [/(^|\s)cp\s/, /(^|\s)rm\s/, /(^|\s)mkdir\s+-p/, /(^|\s)export\s/, /^\s*[A-Z_]+=\S+\s/, /\s&\s*$/, /;/, /\$\(/, /`/]) {
      assert.strictEqual(unixOnly.test(script), false, `script must not use Unix-only syntax ${unixOnly}`);
    }
    assert.strictEqual(pkg.scripts['dev'], 'vite', 'existing dev script unchanged');
    assert.strictEqual(pkg.scripts['build'], 'npm run build:tsc && vite build', 'existing build script unchanged');
    for (const s of Object.values(pkg.scripts)) {
      if (s !== script) assert.strictEqual(s.includes('research-sector-dev-server'), false, 'launcher is not wired into build/test/production scripts');
    }
  });

  it('T-08: the authority module still exports the same contract surface', async () => {
    const mod = await import('../frontend/server/research-sector-transport.js');
    for (const name of ['computeCertifiedCompany', 'computeCertifiedDecisionMatrix', 'computeCertifiedEvidence',
      'computeCertifiedReplay', 'handleResearchSectorRequest', 'createResearchSectorServer']) {
      assert.strictEqual(typeof (mod as Record<string, unknown>)[name], 'function', `${name} exported`);
    }
    const s = mod.createResearchSectorServer(RESEARCH_SECTOR_DEV_PORT);
    assert.strictEqual(s.listening, false, 'createResearchSectorServer still does not self-listen');
  });
});
