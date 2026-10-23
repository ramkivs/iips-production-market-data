/**
 * CAP-02 Gate 4 Limb A — guarded test-summary parsing matrix.
 *
 * The fixture runner copies the bounded guard into a temporary repository so
 * the tests exercise its real stale-build, missing-build, zero-test and child
 * exit protections without changing the repository's compiled test inventory.
 */
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// The pure helper is JavaScript by design; its runtime contract is covered by this matrix.
// The ../../ path resolves from dist/tests back to the authoritative repository root after tsc.
// @ts-expect-error no declaration file is needed for the bounded .mjs helper
import { parseTestSummary } from '../../scripts/test-summary-parser.mjs';

const repositoryRoot = process.cwd();

describe('CAP-02 Gate 4 Limb A summary parser', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
    roots.length = 0;
  });

  it('accepts TAP summary with LF line endings', () => {
    assert.deepEqual(parseTestSummary('# tests 9\n# pass 9\n'), { executed: 9, passed: 9 });
  });

  it('accepts TAP summary with CRLF line endings', () => {
    assert.deepEqual(parseTestSummary('# tests 9\r\n# pass 9\r\n'), { executed: 9, passed: 9 });
  });

  it('accepts the Node spec reporter summary with LF line endings', () => {
    assert.deepEqual(parseTestSummary('ℹ tests 9\nℹ pass 9\n'), { executed: 9, passed: 9 });
  });

  it('accepts the Node spec reporter summary with CRLF line endings', () => {
    assert.deepEqual(parseTestSummary('ℹ tests 9\r\nℹ pass 9\r\n'), { executed: 9, passed: 9 });
  });

  it('returns zero for a zero-count summary so the wrapper rejects it', () => {
    assert.deepEqual(parseTestSummary('# tests 0\n# pass 0\n'), { executed: 0, passed: 0 });
  });

  it('fails closed for a missing or malformed count', () => {
    assert.deepEqual(parseTestSummary('all output but no summary\n'), { executed: null, passed: null });
    assert.deepEqual(parseTestSummary('# tests many\n# pass 2\n'), { executed: null, passed: 2 });
    assert.deepEqual(parseTestSummary('# tests -1\n# pass -1\n'), { executed: null, passed: null });
  });

  function makeFixture(): string {
    const root = mkdtempSync(join(tmpdir(), 'cap02-g4-summary-'));
    roots.push(root);
    mkdirSync(join(root, 'scripts'), { recursive: true });
    mkdirSync(join(root, 'tests'), { recursive: true });
    mkdirSync(join(root, 'dist', 'tests'), { recursive: true });
    copyFileSync(join(repositoryRoot, 'scripts', 'run-tests.mjs'), join(root, 'scripts', 'run-tests.mjs'));
    copyFileSync(
      join(repositoryRoot, 'scripts', 'test-summary-parser.mjs'),
      join(root, 'scripts', 'test-summary-parser.mjs'),
    );
    return root;
  }

  function runFixture(root: string): ReturnType<typeof spawnSync> {
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    return spawnSync(process.execPath, [join(root, 'scripts', 'run-tests.mjs')], {
      cwd: root,
      env,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    });
  }

  it('propagates a non-zero child test exit after a valid non-zero summary', () => {
    const root = makeFixture();
    writeFileSync(join(root, 'tests', 'fixture.test.ts'), '// source fixture\n');
    writeFileSync(
      join(root, 'dist', 'tests', 'fixture.test.js'),
      "import { test } from 'node:test'; test('intentional failure', () => { throw new Error('fixture failure'); });\n",
    );
    const result = runFixture(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /runner exit code/);
  });

  it('rejects a missing compiled counterpart before invoking the child runner', () => {
    const root = makeFixture();
    writeFileSync(join(root, 'tests', 'baseline.test.ts'), '// baseline source fixture\n');
    writeFileSync(join(root, 'tests', 'fixture.test.ts'), '// source fixture with no compiled counterpart\n');
    writeFileSync(
      join(root, 'dist', 'tests', 'baseline.test.js'),
      "import { test } from 'node:test'; test('baseline', () => {});\n",
    );
    const result = runFixture(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /no compiled counterpart/);
  });

  it('rejects a stale compiled counterpart before invoking the child runner', () => {
    const root = makeFixture();
    const source = join(root, 'tests', 'fixture.test.ts');
    const compiled = join(root, 'dist', 'tests', 'fixture.test.js');
    writeFileSync(source, '// newer source fixture\n');
    writeFileSync(compiled, "import { test } from 'node:test'; test('fixture', () => {});\n");
    const old = new Date(Date.now() - 60_000);
    utimesSync(compiled, old, old);
    const future = new Date(Date.now() + 60_000);
    utimesSync(source, future, future);
    const result = runFixture(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /build is stale/);
  });

  it('retains the zero-test fail-closed guard for a valid zero summary', () => {
    const source = readFileSync(join(repositoryRoot, 'scripts', 'run-tests.mjs'), 'utf8');
    assert.deepEqual(parseTestSummary('# tests 0\n# pass 0\n'), { executed: 0, passed: 0 });
    assert.match(source, /if \(executed === 0\)/);
  });
});
