/**
 * GROUP 1 / GATE 2 — ENGINE REGISTRY READ-ONLY WIRING: exact-addition baseline helper (test support only).
 *
 * Gate 2 ADDS lines to four existing B1 files and changes nothing else in them. Earlier gates pinned
 * those files by SHA-256. Rather than re-pinning (which would silently accept any edit), the prior
 * suites keep their ORIGINAL pins and compare them against the file with ONLY these exact Gate 2
 * blocks removed. `preGate2` THROWS unless every block is present exactly once, so both facts hold:
 * the Gate 2 wiring is present verbatim, and nothing else in those files changed.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export const GATE2_ADDITIONS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "frontend/server/research-sector-transport.ts": Object.freeze([
    "// GROUP 1 / GATE 2 ENGINE REGISTRY (read-only wiring): the recovered certified 10-engine registry\n// (iips-review-recovered @ 286f3da, E2E-030 10-ENGINE LTS scope; recovered to B1 by Gate 1 e1fa323).\n// ONLY listEngines() is used. EngineApiAdapter.execute() is dormant donor code:\n// PRESENT / NOT EXPOSED / NOT ROUTED / NOT CALLED / NOT AUTHORIZED.\nimport { EngineApiAdapter } from '../../iips-platform/src/integration/EngineApiAdapter.js';\n",
    "    // GROUP 1 / GATE 2: GET /api/engines \u2014 the recovered certified registry, serialized as-is\n    // (donor semantics: `engineApi.listEngines()`). GET only: every other method is refused 405\n    // above; no /api/engines/:id/execute route exists (falls through to 404). B1 does NOT inherit\n    // E2E-030 certification \u2014 this is wiring only.\n    if (path === '/api/engines') {\n      return Object.freeze({ status: 200 as const, body: new EngineApiAdapter().listEngines() });\n    }\n",
  ]),
  "frontend/src/app/routes.ts": Object.freeze([
    "  // Group 1 / Gate 2: recovered certified 10-engine Engine Registry (read-only).\n  researchEngines: '/research/engines',\n",
  ]),
  "frontend/src/app/navigation.ts": Object.freeze([
    "      // GROUP 1 / GATE 2: donor nav entry (286f3da, label/path verbatim) for the recovered certified\n      // 10-engine Engine Registry, read-only over GET /api/engines on 8788 -> `partial` (never\n      // `implemented`: B1 does not inherit E2E-030; Windows/browser qualification is a separate gate).\n      { label: 'Engines', path: '/research/engines', minRole: 'viewer', status: 'partial' },\n",
  ]),
  "frontend/src/app/App.tsx": Object.freeze([
    "// GROUP 1 / GATE 2: the recovered certified 10-engine Engine Registry (Gate 1 e1fa323, donor\n// 286f3da) mounted at /research/engines, reading ONLY GET /api/engines over HTTP (no server import,\n// no execution caller).\nimport { EngineRegistry } from '../features/engines/EngineRegistry.js';\n",
    "        <Route path={ROUTES.researchEngines} element={<EngineRegistry />} />\n",
  ]),
});

/**
 * GATE B (b1-three-engine-a1-adoption-2026-09-25-001, RAMKI Decision 4 baseline re-pin): the stale
 * present-tense "10-engine" wording inside four Gate 2 comment lines was updated to
 * "13 registered engines after Gate B adoption". GATE2_ADDITIONS above stays VERBATIM (historical
 * Gate 2 text). `preGate2` first reverses EXACTLY these line replacements — each Gate B line must
 * occur exactly once or it THROWS — then removes the Gate 2 blocks, so every earlier SHA-256 pin
 * is still compared unchanged and any other edit to these files still fails.
 * Entries are [gateBLine, gate2Line].
 */
export const GATEB_COMMENT_UPDATES: Readonly<Record<string, ReadonlyArray<readonly [string, string]>>> = Object.freeze({
  "frontend/server/research-sector-transport.ts": Object.freeze([
    Object.freeze([
      "// GROUP 1 / GATE 2 ENGINE REGISTRY (read-only wiring): 13 registered engines after Gate B adoption\n",
      "// GROUP 1 / GATE 2 ENGINE REGISTRY (read-only wiring): the recovered certified 10-engine registry\n",
    ] as const),
  ]),
  "frontend/src/app/routes.ts": Object.freeze([
    Object.freeze([
      "  // Group 1 / Gate 2: Engine Registry (read-only), 13 registered engines after Gate B adoption.\n",
      "  // Group 1 / Gate 2: recovered certified 10-engine Engine Registry (read-only).\n",
    ] as const),
  ]),
  "frontend/src/app/navigation.ts": Object.freeze([
    Object.freeze([
      "      // GROUP 1 / GATE 2: donor nav entry (286f3da, label/path verbatim) for the recovered\n      // Engine Registry (13 registered engines after Gate B adoption), read-only over GET /api/engines on 8788 -> `partial` (never\n",
      "      // GROUP 1 / GATE 2: donor nav entry (286f3da, label/path verbatim) for the recovered certified\n      // 10-engine Engine Registry, read-only over GET /api/engines on 8788 -> `partial` (never\n",
    ] as const),
  ]),
  "frontend/src/app/App.tsx": Object.freeze([
    Object.freeze([
      "// GROUP 1 / GATE 2: the Engine Registry, 13 registered engines after Gate B adoption (Gate 1 e1fa323, donor\n",
      "// GROUP 1 / GATE 2: the recovered certified 10-engine Engine Registry (Gate 1 e1fa323, donor\n",
    ] as const),
  ]),
});

/** Reverse exactly the Gate B comment updates in `content` of `rel` (no-op for other files). */
export function preGateB(rel: string, content: string): string {
  const updates = GATEB_COMMENT_UPDATES[rel];
  if (updates === undefined) return content;
  let out = content;
  for (const [gateB, gate2] of updates) {
    const first = out.indexOf(gateB);
    if (first === -1) throw new Error(`Gate B comment update missing from ${rel}: ${gateB.split('\n')[0]}`);
    if (out.indexOf(gateB, first + 1) !== -1) throw new Error(`Gate B comment update duplicated in ${rel}`);
    out = out.slice(0, first) + gate2 + out.slice(first + gateB.length);
  }
  return out;
}

/**
 * Remove exactly the Gate 2 blocks from `content` of `rel` (no-op for files Gate 2 did not touch),
 * after reversing exactly the Gate B comment updates (`preGateB`).
 */
export function preGate2(rel: string, content: string): string {
  const blocks = GATE2_ADDITIONS[rel];
  if (blocks === undefined) return content;
  let out = preGateB(rel, content);
  for (const block of blocks) {
    const first = out.indexOf(block);
    if (first === -1) throw new Error(`Gate 2 addition missing from ${rel}: ${block.split('\n')[0]}`);
    if (out.indexOf(block, first + 1) !== -1) throw new Error(`Gate 2 addition duplicated in ${rel}`);
    out = out.slice(0, first) + out.slice(first + block.length);
  }
  return out;
}

/** SHA-256 of `rel` (relative to `root`) with ONLY the Gate 2 additions removed. */
export function preGate2Sha(root: string, rel: string): string {
  return createHash('sha256').update(preGate2(rel, readFileSync(resolve(root, rel), 'utf8'))).digest('hex');
}
