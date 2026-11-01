/**
 * REG-06 admission — package-export admission and public API contract (2026-11-01).
 *
 * Before admission, Operator Drop was reachable only through the internal
 * `src/index.ts` barrel, which is not an export-map admission. This test pins
 * the admission itself: the `./operator-drop` subpath exists in the export map,
 * its declared targets are actually emitted by the package build, and the
 * published surface is exactly the authorized one — no more, no less.
 *
 * It reads the *built* package, so a source-only change that never reaches
 * `dist/package` cannot pass.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const MANIFEST_PATH = resolve(ROOT, 'package.json');

const EXPECTED_EXPORTS = ['./portfolio-ui', './pit', './d114-non-production', './operator-drop'];

/** The exact public surface of the `./operator-drop` subpath. */
const EXPECTED_OPERATOR_DROP_SURFACE = [
  'DurablePointInTimeStore',
  'OperatorDropIngestionService',
  'OperatorDropParser',
  'OperatorDropProductRuntime',
  'PitDurableStoreError',
  'PitReadService',
  'PitSnapshotConflictError',
  'computeSnapshotDigest',
  'resolveDropSecurityIdentity',
];

/** The `./pit` subpath gained durable persistence at REG-06 admission. */
const EXPECTED_PIT_SURFACE = [
  'DurablePointInTimeStore',
  'PitDurableStoreError',
  'PitReadService',
  'PitSnapshotConflictError',
  'PointInTimeStore',
  'computeSnapshotDigest',
];

function manifest(): { exports: Record<string, { types: string; import: string }> } {
  assert.ok(existsSync(MANIFEST_PATH), 'package.json must exist');
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

async function importBuilt(subpath: './operator-drop' | './pit'): Promise<Record<string, unknown>> {
  const entry = manifest().exports[subpath];
  const runtimePath = resolve(ROOT, entry.import);
  assert.ok(existsSync(runtimePath), `${subpath} runtime target is missing: ${entry.import}`);
  return (await import(pathToFileURL(runtimePath).href)) as Record<string, unknown>;
}

/** Value exports only: TypeScript types leave no runtime key. */
function valueExports(mod: Record<string, unknown>): string[] {
  return Object.keys(mod).sort();
}

describe('REG-06 package-export admission', () => {
  it('declares the exact authorized export map, including ./operator-drop', () => {
    const exports = manifest().exports;
    assert.deepEqual(Object.keys(exports), EXPECTED_EXPORTS);

    const drop = exports['./operator-drop'];
    assert.equal(drop.import, './dist/package/src/operator_drop/package.js');
    assert.equal(drop.types, './dist/package/src/operator_drop/package.d.ts');
  });

  it('emits both the runtime and the declarations for every subpath', () => {
    for (const subpath of EXPECTED_EXPORTS) {
      const entry = manifest().exports[subpath]!;
      assert.ok(existsSync(resolve(ROOT, entry.import)), `${subpath} runtime target missing: ${entry.import}`);
      assert.ok(existsSync(resolve(ROOT, entry.types)), `${subpath} declaration target missing: ${entry.types}`);
    }
  });

  it('emits the Operator Drop module into the published package tree', () => {
    // This is the concrete fact that was absent before admission: the module was
    // not part of the package build at all.
    for (const file of ['package.js', 'package.d.ts', 'parser.js', 'drop_ingestion.js', 'product_runtime.js']) {
      const p = resolve(ROOT, 'dist/package/src/operator_drop', file);
      assert.ok(existsSync(p), `dist/package/src/operator_drop/${file} must be emitted`);
    }
  });

  it('publishes exactly the authorized ./operator-drop surface', async () => {
    const mod = await importBuilt('./operator-drop');
    assert.deepEqual(valueExports(mod), EXPECTED_OPERATOR_DROP_SURFACE);
  });

  it('publishes the durable PIT store through ./pit as well', async () => {
    const mod = await importBuilt('./pit');
    const actual = valueExports(mod);
    for (const symbol of EXPECTED_PIT_SURFACE) {
      assert.ok(actual.includes(symbol), `./pit must export ${symbol}`);
    }
  });

  it('exposes working constructors and functions, not just names', async () => {
    const drop = await importBuilt('./operator-drop');
    assert.equal(typeof drop.OperatorDropProductRuntime, 'function');
    assert.equal(typeof drop.OperatorDropIngestionService, 'function');
    assert.equal(typeof drop.DurablePointInTimeStore, 'function');
    assert.equal(typeof drop.resolveDropSecurityIdentity, 'function');

    // The identity resolver is the reused series-qualified component; exercising
    // it through the public surface proves the wiring, not just the export.
    const resolver = drop.resolveDropSecurityIdentity as (r: unknown) => { identity: unknown };
    const good = resolver({ isin: 'INE123456789', series: 'EQ' });
    assert.ok(good.identity, 'a valid isin+series must resolve through the public surface');
    const bad = resolver({ companyId: 'INFY' });
    assert.equal(bad.identity, null, 'an identity-less record must not resolve');
  });

  it('keeps IPC and provisioning out of the admitted public surface', async () => {
    const drop = await importBuilt('./operator-drop');
    const pit = await importBuilt('./pit');
    const surface = [...valueExports(drop), ...valueExports(pit)].join(',');

    for (const forbidden of ['listenIpc', 'createConnectionHandler', 'gateAPrimeProvisioning', 'persistBrokerImport', 'ensureMigrations']) {
      assert.equal(surface.includes(forbidden), false, `${forbidden} must not be publicly exported`);
    }
  });
});
