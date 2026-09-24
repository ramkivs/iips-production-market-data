/**
 * Test Suite: R-1 — NON-PRODUCTION Executive dev/acceptance topology repair.
 *
 * Root cause (WUI-RS-05D-D3): the single dev proxy `/api` → 8788 sent `/api/executive` to the
 * Research/Sector authority (no such route → 404) and the existing Executive server
 * (`createExecutiveServer`, 8787) was never started.
 *
 * Authorised scope (exactly three additions):
 *   1. `frontend/server/executive-dev-server.ts` — starts the EXISTING `createExecutiveServer(8787)`
 *      on loopback; no new route/handler/header/computation;
 *   2. `npm run dev:executive` (Windows `npm.cmd` compatible);
 *   3. a dev-server-only Vite proxy rule `/api/executive` → `http://127.0.0.1:8787`, declared
 *      BEFORE the generic `/api` → `http://127.0.0.1:8788` rule.
 *
 * What is asserted:
 *   R1-01  the Executive authority listens on 127.0.0.1:8787 and serves the UNCHANGED certified
 *          payload (identical to `computeCertifiedExecutive()`), plus health;
 *   R1-02  a busy port fails closed (no fallback port/interface);
 *   R1-03  the launcher only calls `createExecutiveServer` + `listen` (no handlers/auth/PIT/compute);
 *   R1-04  the resolved Vite config routes `/api/executive` → 8787 first and every other `/api/...`
 *          (incl. `/api/executive-*`) → 8788, under `server` only (no preview/build proxy);
 *   R1-05  a real Vite dev server routes `/api/executive` to 8787 and Company / Decision Matrix /
 *          Evidence / Replay / health to 8788 end-to-end, with unchanged bodies;
 *   R1-06  the npm script is Windows-compatible, dev-scoped and not wired into build/test;
 *   R1-07  no production configuration changed: build output settings unchanged, the browser
 *          Executive client stays a relative `/api/executive` client, no browser file references
 *          8787 or the launcher;
 *   R1-08  the existing Executive transport is reused (same exports, does not self-listen).
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { startExecutiveDevServer, EXECUTIVE_DEV_PORT, EXECUTIVE_DEV_HOST } from '../frontend/server/executive-dev-server.js';
import { startResearchSectorDevServer } from '../frontend/server/research-sector-dev-server.js';
import { computeCertifiedExecutive } from '../frontend/server/executive-transport.js';
import { handleResearchSectorRequest } from '../frontend/server/research-sector-transport.js';

const ROOT = process.cwd();
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const stripComments = (s: string): string => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const json = (v: unknown): unknown => JSON.parse(JSON.stringify(v));

/** Existing Research/Sector SNAPSHOT authorities that must stay on 8788 (contract unchanged). */
const RESEARCH_ENDPOINTS = [
  '/api/company/Banking',
  '/api/decision-matrix',
  '/api/evidence/Banking',
  '/api/replay/Banking',
] as const;

function close(server: http.Server | undefined): Promise<void> {
  return new Promise((r) => (server && server.listening ? server.close(() => r()) : r()));
}

describe('R-1 — Executive authority on the intended port', () => {
  let server: http.Server | undefined;

  before(async () => {
    server = await startExecutiveDevServer();
  });
  after(async () => {
    await close(server);
  });

  it('R1-01a: the authority listens on 127.0.0.1:8787 (loopback only)', () => {
    assert.strictEqual(EXECUTIVE_DEV_PORT, 8787);
    assert.strictEqual(EXECUTIVE_DEV_HOST, '127.0.0.1');
    assert.ok(server?.listening, 'the authority must be listening');
    const addr = server!.address() as AddressInfo;
    assert.strictEqual(addr.port, 8787, 'intended port');
    assert.strictEqual(addr.address, '127.0.0.1', 'must not bind beyond loopback');
  });

  it('R1-01b: /api/executive serves the unchanged certified payload (+ health)', async () => {
    const res = await fetch('http://127.0.0.1:8787/api/executive');
    assert.strictEqual(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /^application\/json/);
    assert.deepStrictEqual(await res.json(), json(computeCertifiedExecutive()), 'payload is computeCertifiedExecutive() verbatim');
    const health = await fetch('http://127.0.0.1:8787/api/health');
    assert.strictEqual(health.status, 200);
    assert.deepStrictEqual(await health.json(), { status: 'ok', transport: 'program-v3.0 executive' });
  });

  it('R1-02: a busy port fails closed — no silent fallback to another port', async () => {
    await assert.rejects(startExecutiveDevServer(), (e: NodeJS.ErrnoException) => e.code === 'EADDRINUSE');
  });
});

describe('R-1 — launcher source boundaries', () => {
  const src = read('frontend/server/executive-dev-server.ts');
  const code = stripComments(src);

  it('R1-03: the launcher only calls createExecutiveServer + listen', () => {
    const imports = [...src.matchAll(/^import .*from '([^']+)';$/gm)].map((m) => m[1]!);
    assert.deepStrictEqual(imports, ['node:http', 'node:path', 'node:url', './executive-transport.js']);
    assert.match(code, /createExecutiveServer\(port\)/);
    assert.match(code, /server\.listen\(port, host\)/);
    for (const banned of ['setHeader', 'Access-Control', 'createServer(', 'computeCertified', 'guardRead',
      'authorize', 'asOf', 'process.env', '0.0.0.0', 'fetch(', '8788']) {
      assert.strictEqual(code.includes(banned), false, `launcher must not contain ${banned}`);
    }
  });
});

describe('R-1 — Vite dev/acceptance proxy precedence', () => {
  it('R1-04: /api/executive → 8787 is declared first; every other /api path → 8788', async () => {
    const { loadConfigFromFile } = await import('vite');
    const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, resolve(ROOT, 'vite.config.ts'), ROOT, 'silent');
    const cfg = loaded!.config;
    const proxy = cfg.server!.proxy as Record<string, { target: string }>;
    const keys = Object.keys(proxy);
    assert.deepStrictEqual(keys, ['^/api/executive(?:\\?.*)?$', '/api'], 'Executive rule precedes the generic rule; nothing else');
    assert.strictEqual(proxy[keys[0]!]!.target, 'http://127.0.0.1:8787');
    assert.strictEqual(proxy['/api']!.target, 'http://127.0.0.1:8788', 'generic rule unchanged');
    for (const k of keys) assert.deepStrictEqual(Object.keys(proxy[k]!), ['target'], `${k}: no rewrite/changeOrigin/headers`);

    // Emulate Vite's first-match semantics (createProxyContextMatcher: '^' → RegExp, else prefix).
    const route = (url: string): string | undefined => {
      const hit = keys.find((k) => (k.startsWith('^') ? new RegExp(k).test(url) : url.startsWith(k)));
      return hit === undefined ? undefined : proxy[hit]!.target;
    };
    assert.strictEqual(route('/api/executive'), 'http://127.0.0.1:8787');
    assert.strictEqual(route('/api/executive?x=1'), 'http://127.0.0.1:8787');
    for (const url of [...RESEARCH_ENDPOINTS, '/api/health', '/api/executive-summary', '/api/executive/extra', '/api/executives']) {
      assert.strictEqual(route(url), 'http://127.0.0.1:8788', `${url} stays on the Research/Sector authority`);
    }
    assert.strictEqual(route('/executive'), undefined, 'non-/api paths are not proxied');

    assert.strictEqual(cfg.preview?.proxy, undefined, 'no preview (production-like) proxy');
    assert.strictEqual((cfg as { proxy?: unknown }).proxy, undefined, 'no top-level proxy');
  });

  it('R1-05: a real Vite dev server routes Executive → 8787 and Research/Sector → 8788 end-to-end', async () => {
    const { createServer } = await import('vite');
    const executive = await startExecutiveDevServer();
    const research = await startResearchSectorDevServer();
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
      const base = `http://127.0.0.1:${port}`;

      const exec = await fetch(`${base}/api/executive`);
      assert.strictEqual(exec.status, 200, '/api/executive no longer 404 via the Vite proxy');
      assert.deepStrictEqual(await exec.json(), json(computeCertifiedExecutive()), 'proxied Executive payload unchanged');

      for (const path of RESEARCH_ENDPOINTS) {
        const res = await fetch(`${base}${path}`);
        assert.strictEqual(res.status, 200, `${path} via the Vite proxy`);
        assert.strictEqual(res.headers.get('x-iips-certification'), 'NONE CLAIMED', `${path} answered by 8788`);
        assert.deepStrictEqual(await res.json(), json(handleResearchSectorRequest(path).body), `${path} proxied body unchanged`);
      }

      const health = await fetch(`${base}/api/health`);
      assert.strictEqual(health.headers.get('x-iips-certification'), 'NONE CLAIMED', 'generic /api/health still answered by 8788');

      const near = await fetch(`${base}/api/executive-summary`);
      assert.strictEqual(near.status, 404);
      assert.strictEqual(near.headers.get('x-iips-certification'), 'NONE CLAIMED', 'prefix look-alikes are NOT captured by the Executive rule');
      await near.arrayBuffer();
    } finally {
      await vite.close();
      await close(research);
      await close(executive);
    }
  });
});

describe('R-1 — scripts, production configuration and browser boundary', () => {
  it('R1-06: dev:executive is Windows-compatible, dev-scoped and not wired into build/test', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const script = pkg.scripts['dev:executive'];
    assert.ok(script, 'dev:executive script must exist');
    assert.ok(script.endsWith('node dist/frontend/server/executive-dev-server.js'), 'launches the tracked launcher');
    for (const unixOnly of [/(^|\s)cp\s/, /(^|\s)rm\s/, /(^|\s)mkdir\s+-p/, /(^|\s)export\s/, /^\s*[A-Z_]+=\S+\s/, /\s&\s*$/, /;/, /\$\(/, /`/]) {
      assert.strictEqual(unixOnly.test(script), false, `script must not use Unix-only syntax ${unixOnly}`);
    }
    assert.strictEqual(pkg.scripts['dev'], 'vite', 'existing dev script unchanged');
    assert.strictEqual(pkg.scripts['build'], 'npm run build:tsc && vite build', 'existing build script unchanged');
    assert.strictEqual(pkg.scripts['test'], 'node --test dist/tests/*.test.js', 'existing test script unchanged');
    for (const [name, s] of Object.entries(pkg.scripts)) {
      if (name !== 'dev:executive') assert.strictEqual(s.includes('executive-dev-server'), false, `${name} must not launch the Executive dev server`);
    }
  });

  it('R1-07: no production configuration changed; browser client stays relative', () => {
    const cfg = stripComments(read('vite.config.ts'));
    assert.match(cfg, /build:\s*\{\s*outDir:\s*'dist-frontend',\s*sourcemap:\s*true,?\s*\}/, 'build output settings unchanged');
    assert.strictEqual(/preview\s*:/.test(cfg), false, 'no preview proxy');

    const client = stripComments(read('frontend/src/api/executive.ts'));
    assert.match(client, /authFetch\(`\$\{baseUrl\}\/api\/executive`\)/, 'Executive client calls the relative /api/executive path');
    assert.match(client, /baseUrl = ''/, 'default base URL stays empty');
    assert.strictEqual(/https?:\/\/|8787|127\.0\.0\.1|localhost/.test(client), false, 'client hardcodes no host');

    const walk = (rel: string): string[] =>
      readdirSync(resolve(ROOT, rel), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(`${rel}/${e.name}`) : /\.(ts|tsx)$/.test(e.name) ? [`${rel}/${e.name}`] : []);
    for (const f of walk('frontend/src')) {
      const code = stripComments(read(f));
      assert.strictEqual(/8787/.test(code), false, `${f} must not reference the Executive dev authority port`);
      assert.strictEqual(/from '[^']*(executive-dev-server|executive-transport)[^']*'|import\(\s*'[^']*(executive-dev-server|executive-transport)/.test(code), false, `${f} must not import server modules`);
    }
  });

  it('R1-08: the existing Executive transport is reused unchanged in surface', async () => {
    const mod = await import('../frontend/server/executive-transport.js');
    for (const name of ['computeCertifiedExecutive', 'computeCertifiedPlatform', 'createExecutiveServer']) {
      assert.strictEqual(typeof (mod as Record<string, unknown>)[name], 'function', `${name} exported`);
    }
    const s = mod.createExecutiveServer(EXECUTIVE_DEV_PORT);
    assert.strictEqual(s.listening, false, 'createExecutiveServer still does not self-listen');
    const src = stripComments(read('frontend/server/executive-transport.ts'));
    assert.match(src, /req\.url === '\/api\/executive'/, 'transport route unchanged');
    assert.match(src, /computeCertifiedExecutive\(\)/, 'payload still computed by the certified engine');
  });
});
