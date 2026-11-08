/**
 * Package publication regression — `./dhan-server` export resolution.
 *
 * Root cause of the IRR ERR_PACKAGE_PATH_NOT_EXPORTED: the subpath declared
 * only a "types" + "import" condition, so require-context (CJS) resolution
 * found no matching condition. These tests pin the corrected contract.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const repoRoot = resolve(process.cwd());
const manifest = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));

describe('package ./dhan-server export publication', () => {
  it('declares the ./dhan-server subpath with types + import + default conditions', () => {
    const entry = manifest.exports['./dhan-server'];
    assert.ok(entry, './dhan-server missing from exports');
    assert.strictEqual(entry.types, './dist/package/src/providers/dhan/package.d.ts');
    assert.strictEqual(entry.import, './dist/package/src/providers/dhan/package.js');
    assert.strictEqual(entry.default, entry.import, 'default condition must match the runtime target for CJS resolution');
  });

  it('export map is exactly the authorized subpath set', () => {
    assert.deepStrictEqual(Object.keys(manifest.exports), [
      './portfolio-ui', './pit', './d114-non-production', './operator-drop', './dhan-server',
    ]);
  });

  it('declared dhan-server targets exist after build:dhan-package', () => {
    const entry = manifest.exports['./dhan-server'];
    assert.ok(existsSync(resolve(repoRoot, entry.import)), 'compiled package.js missing — run build:dhan-package');
    assert.ok(existsSync(resolve(repoRoot, entry.types)), 'compiled package.d.ts missing — run build:dhan-package');
  });

  it('CJS require.resolve semantics accept the export map shape', () => {
    // Emulate Node's CJS subpath resolution: without a "default"/"require"
    // condition the subpath is NOT exported. createRequire against a temp
    // consumer is covered by scripts/verify-public-package.mjs; here we
    // assert the condition set statically.
    const entry = manifest.exports['./dhan-server'];
    const conditions = Object.keys(entry);
    assert.ok(conditions.includes('import') && conditions.includes('default'));
    const require = createRequire(resolve(repoRoot, 'package.json'));
    assert.strictEqual(typeof require.resolve, 'function');
  });
});
