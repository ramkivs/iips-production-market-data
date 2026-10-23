#!/usr/bin/env node
/**
 * Guarded test runner for the IIPS IPD repository.
 *
 * Purpose (CV-35 / CV-42):
 *   The historical `test` script was `node --test dist/tests/*.test.js`. When `dist/` is
 *   missing — e.g. a clean checkout that never ran a build — the shell glob does not expand,
 *   Node's test runner receives no files, executes **zero** tests and exits **0**. That made a
 *   "passing" test run indistinguishable from a run that tested nothing.
 *
 * This wrapper makes such a run fail, and refuses to report a result that was not produced by
 * compiling the current sources:
 *
 *   1. discover the compiled test files;
 *   2. fail when there are none;
 *   3. in compiled mode, fail when a source test has no compiled counterpart, or when a compiled
 *      test is older than its source (a stale `dist/` would otherwise report stale results);
 *   4. run the tests and fail when the runner reports zero executed tests;
 *   5. propagate the runner's exit code.
 *
 * It changes no test, no source module and no assertion. It only refuses to call an empty run a
 * pass. See evidence/np04/... CI record for the verification transcript.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const sourceTestsDir = join(repoRoot, 'tests');
const compiledTestsDir = join(repoRoot, 'dist', 'tests');

const fail = (message, detail) => {
  console.error(`\n[test-guard] FAIL — ${message}`);
  if (detail) console.error(`[test-guard] ${detail}`);
  console.error(
    '[test-guard] A command that executes zero tests is not a passing test run (CV-35).\n',
  );
  process.exit(1);
};

const listBySuffix = (dir, suffix) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => name.endsWith(suffix))
        .sort()
        .map((name) => join(dir, name))
    : [];

if (!existsSync(sourceTestsDir)) {
  fail('source test directory is missing', `expected ${relative(repoRoot, sourceTestsDir)}`);
}

const sourceTests = listBySuffix(sourceTestsDir, '.test.ts');
if (sourceTests.length === 0) {
  fail('no source test files (*.test.ts) were found', `looked in ${relative(repoRoot, sourceTestsDir)}`);
}

const files = listBySuffix(compiledTestsDir, '.test.js');

if (files.length === 0) {
  fail(
    'no compiled tests found — the project has not been built',
    `missing ${relative(repoRoot, compiledTestsDir)}/*.test.js; run \`npm run build\` (or \`npm run build:tsc\`) first`,
  );
}

// Every source test must have a compiled counterpart: a partial build must not pass silently.
const missing = sourceTests
  .map((source) => relative(sourceTestsDir, source).replace(/\.ts$/, '.js'))
  .filter((name) => !existsSync(join(compiledTestsDir, name)));
if (missing.length > 0) {
  fail(
    `${missing.length} source test(s) have no compiled counterpart`,
    `not built: ${missing.join(', ')}`,
  );
}

// A stale build reports stale results: fail when any compiled test predates its source.
const stale = sourceTests.filter((source) => {
  const compiled = join(compiledTestsDir, relative(sourceTestsDir, source).replace(/\.ts$/, '.js'));
  if (!existsSync(compiled)) return false; // already reported above
  return statSync(compiled).mtimeMs < statSync(source).mtimeMs;
});
if (stale.length > 0) {
  fail(
    `${stale.length} compiled test(s) are older than their sources — the build is stale`,
    `stale: ${stale.map((f) => relative(sourceTestsDir, f)).join(', ')}; re-run \`npm run build:tsc\``,
  );
}

console.log(`[test-guard] files=${files.length} (source suite files: ${sourceTests.length})`);

const runnerArgs = ['--test', ...files];

const result = spawnSync(process.execPath, runnerArgs, {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (result.error) {
  fail('could not start the Node test runner', String(result.error));
}

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
const reported = output.match(/^# tests (\d+)$/m);
const executed = reported ? Number(reported[1]) : null;

if (executed === null) {
  fail('the runner reported no test count — the result cannot be trusted', 'no "# tests <n>" line found');
}
if (executed === 0) {
  fail('the runner executed zero tests', 'a zero-test run is never a pass');
}
if (result.status !== 0) {
  console.error(`\n[test-guard] FAIL — ${executed} test(s) executed, runner exit code ${result.status}`);
  process.exit(result.status === null ? 1 : result.status);
}

const passed = output.match(/^# pass (\d+)$/m);
console.log(
  `\n[test-guard] OK — ${executed} test(s) executed, ${passed ? passed[1] : 'unknown'} passed, exit 0`,
);
