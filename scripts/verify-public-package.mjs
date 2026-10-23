#!/usr/bin/env node
/** Pack -> isolated install -> runtime/declaration/browser-closure verification. */
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as viteBuild } from 'vite';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const expectedExports = ['./portfolio-ui', './pit', './d114-non-production'];
const IRR_PIN = '98cd56a9a568f431ea31d5515e515a1b6cbb91ba';
const IRR_IMPORTERS = [
  'frontend/server/pit/ipdPitReadAdapter.ts',
  'frontend/server/pit/nonProductionPitStore.ts',
  'frontend/server/pit/nonProductionRuntimePitStore.ts',
  'frontend/server/pit/pitD114RuntimeIntegration.test.ts',
  'frontend/server/pit/pitRuntimeIntegration.test.ts',
];
const IRR_SUPPORT_FILES = [
  'frontend/server/pit/pitReadBoundary.ts',
  'frontend/server/pit/pitReadContract.ts',
  'frontend/server/pit/pitReadPort.ts',
];

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
  });
  if (result.error || result.status !== 0) {
    throw new Error(
      `Command failed (${result.status ?? 'spawn error'}): ${command} ${args.join(' ')}\n` +
        `${result.stdout ?? ''}\n${result.stderr ?? ''}\n${result.error ?? ''}`,
    );
  }
  return result.stdout.trim();
}

/**
 * Compile the five verbatim IRR package importers at the verified read-only
 * commit. Only the unrelated IRR HTTP server/vitest dependencies are compile
 * stubs; the three production composition modules and adapter are executed.
 */
function verifyActualIrrConsumers(consumer, temporary, tsc) {
  let source = process.env.IPD_IRR_READONLY;
  if (source) {
    source = resolve(source);
    const actual = run('git', ['-C', source, 'rev-parse', 'HEAD'], temporary);
    check(actual === IRR_PIN, `IRR read-only source is ${actual}, expected ${IRR_PIN}`);
  } else {
    source = join(temporary, 'irr-readonly');
    run('git', ['init', '--quiet', source], temporary);
    run('git', ['-C', source, 'remote', 'add', 'origin', 'https://github.com/ramkivs/iips-review-recovered.git'], temporary);
    run('git', ['-C', source, 'fetch', '--quiet', '--depth', '1', 'origin', IRR_PIN], temporary);
    run('git', ['-C', source, 'checkout', '--quiet', '--detach', 'FETCH_HEAD'], temporary);
  }

  const irrRoot = join(consumer, 'irr');
  for (const relative of [...IRR_IMPORTERS, ...IRR_SUPPORT_FILES]) {
    const destination = join(irrRoot, relative);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(source, relative), destination);
    check(readFileSync(destination, 'utf8') === readFileSync(join(source, relative), 'utf8'), `IRR copy differs: ${relative}`);
  }

  // Compile-only substitutes for unrelated IRR composition/test infrastructure.
  // No IPD package import is stubbed or rewritten in any consumer file.
  writeFileSync(join(irrRoot, 'frontend/server/executive-transport.ts'),
    "import type { Server } from 'node:http';\nexport declare const server: Server;\n");
  writeFileSync(join(irrRoot, 'frontend/server/pit-transport.ts'),
    "export const PIT_MARKET_DATA_ROUTE = '/api/pit/market-data';\n");
  writeFileSync(join(irrRoot, 'vitest.d.ts'), `
declare module 'vitest' {
  export const describe: (name: string, body: () => unknown) => void;
  export const it: (name: string, body: () => unknown) => void;
  export const expect: any;
  export const beforeAll: (body: () => unknown) => void;
  export const afterAll: (body: () => unknown) => void;
}
`);

  const allFiles = [...IRR_IMPORTERS, ...IRR_SUPPORT_FILES].map((file) => `./irr/${file}`);
  const compilerOptions = {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    lib: ['ES2022', 'DOM'],
    types: ['node'],
    rootDir: '.',
    strict: true,
    skipLibCheck: false,
    forceConsistentCasingInFileNames: true,
  };
  writeFileSync(join(consumer, 'tsconfig.irr.json'), JSON.stringify({
    compilerOptions: { ...compilerOptions, noEmit: true },
    files: [...allFiles, './irr/vitest.d.ts'],
  }, null, 2));

  console.log(`[package-consumer] compiling five verbatim IRR importers at ${IRR_PIN}`);
  run(process.execPath, [tsc, '-p', join(consumer, 'tsconfig.irr.json'), '--pretty', 'false'], consumer);

  const runtimeModules = IRR_IMPORTERS.filter((file) => !file.endsWith('.test.ts'));
  writeFileSync(join(consumer, 'tsconfig.irr-runtime.json'), JSON.stringify({
    compilerOptions: {
      ...compilerOptions,
      outDir: './compiled-irr',
      declaration: false,
      sourceMap: false,
    },
    files: runtimeModules.map((file) => `./irr/${file}`),
  }, null, 2));
  run(process.execPath, [tsc, '-p', join(consumer, 'tsconfig.irr-runtime.json'), '--pretty', 'false'], consumer);

  writeFileSync(join(consumer, 'irr-runtime.mjs'), `
import { createNonProductionPitStore, NON_PRODUCTION_BL, T3 } from './compiled-irr/irr/frontend/server/pit/nonProductionPitStore.js';
import { createNonProductionRuntimePitStore } from './compiled-irr/irr/frontend/server/pit/nonProductionRuntimePitStore.js';
import { createIpdPitReadPort } from './compiled-irr/irr/frontend/server/pit/ipdPitReadAdapter.js';
import { NON_PRODUCTION_D114_EQ, NON_PRODUCTION_D114_VINTAGE_3 } from 'iips-production-market-data/d114-non-production';
function check(value, message) { if (!value) throw new Error(message); }
const fixtureStore = createNonProductionPitStore();
check(fixtureStore.getRecordCount() === 8, 'verbatim IRR fixture population must contain 8 records');
const runtimeStore = createNonProductionRuntimePitStore();
check(runtimeStore.getRecordCount() === 20, 'verbatim IRR combined population must contain 20 records');
const port = createIpdPitReadPort(runtimeStore);
const d114 = await port.queryAsOf({ securityId: NON_PRODUCTION_D114_EQ, domain: 'D01_QUOTES', asOf: NON_PRODUCTION_D114_VINTAGE_3 });
check(d114.found && d114.payload.ltp === 4125.6, 'verbatim IRR adapter did not resolve the D114 payload');
const fixture = await port.queryAsOf({ securityId: NON_PRODUCTION_BL, domain: 'D01_QUOTES', asOf: T3 });
check(fixture.found && fixture.payload.lastTradedPrice === 518.9, 'verbatim IRR adapter did not preserve the fixture series');
const invalid = await port.queryAsOf({ securityId: 'NOT-AN-ISIN', domain: 'D01_QUOTES', asOf: T3 });
check(!invalid.found && invalid.reason === 'INVALID_IDENTITY', 'verbatim IRR adapter changed a typed miss');
console.log(JSON.stringify({ result: 'PASS', fixtureRecords: 8, combinedRecords: 20, d114ResolvedAsOf: d114.resolvedAsOf, invalidReason: invalid.reason }));
`);
  console.log('[package-consumer] executing verbatim IRR production composition and adapter');
  const runtime = JSON.parse(run(process.execPath, [join(consumer, 'irr-runtime.mjs')], consumer));
  check(runtime.result === 'PASS', 'verbatim IRR runtime composition failed');
  return {
    sourceCommit: IRR_PIN,
    importerFiles: IRR_IMPORTERS,
    verbatimCopies: true,
    packageImportsRewritten: false,
    typecheck: 'PASS',
    productionModuleRuntime: runtime,
    routeIntegrationTests: 'TYPECHECK_ONLY_NOT_IRR_E2E',
  };
}

const temporary = mkdtempSync(join(tmpdir(), 'ipd-cap02-public-package-'));
let succeeded = false;
try {
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  check(JSON.stringify(Object.keys(manifest.exports ?? {})) === JSON.stringify(expectedExports), 'export map is not the exact authorized map');
  for (const subpath of expectedExports) {
    const entry = manifest.exports[subpath];
    check(existsSync(join(repoRoot, entry.import)), `${subpath} runtime target is missing`);
    check(existsSync(join(repoRoot, entry.types)), `${subpath} declaration target is missing`);
  }

  console.log('[package-consumer] packing built artifacts');
  const packOutput = run(npm, ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], repoRoot);
  const pack = JSON.parse(packOutput)[0];
  check(pack && Array.isArray(pack.files), 'npm pack returned no inspectable file list');
  for (const file of pack.files) {
    check(file.path === 'package.json' || file.path.startsWith('dist/package/'), `unexpected packed file: ${file.path}`);
  }
  for (const subpath of expectedExports) {
    const entry = manifest.exports[subpath];
    for (const target of [entry.import, entry.types]) {
      const normalized = target.replace(/^\.\//, '');
      check(pack.files.some((file) => file.path === normalized), `${subpath} target absent from pack: ${normalized}`);
    }
  }
  const tarball = isAbsolute(pack.filename) ? pack.filename : join(temporary, pack.filename);
  check(existsSync(tarball), `packed tarball missing: ${tarball}`);

  const consumer = join(temporary, 'consumer');
  mkdirSync(consumer, { recursive: true });
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }, null, 2));
  copyFileSync(join(repoRoot, 'scripts/public-package-consumer.mts'), join(consumer, 'index.mts'));
  writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      lib: ['ES2022', 'DOM'],
      types: ['node', 'react', 'react-dom'],
      rootDir: '.',
      outDir: './compiled',
      strict: true,
      noUncheckedIndexedAccess: true,
      exactOptionalPropertyTypes: true,
      skipLibCheck: false,
      forceConsistentCasingInFileNames: true,
    },
    files: ['./index.mts'],
  }, null, 2));

  console.log('[package-consumer] installing tarball into isolated consumer');
  run(npm, [
    'install', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', '--save=false',
    tarball,
    'react@18.3.1',
    'react-dom@18.3.1',
    '@types/node@22.13.9',
    '@types/react@18.3.31',
    '@types/react-dom@18.3.7',
  ], consumer);

  const installedRoot = join(consumer, 'node_modules/iips-production-market-data');
  const installedManifest = JSON.parse(readFileSync(join(installedRoot, 'package.json'), 'utf8'));
  check(JSON.stringify(Object.keys(installedManifest.exports)) === JSON.stringify(expectedExports), 'installed export map differs');
  for (const subpath of expectedExports) {
    const entry = installedManifest.exports[subpath];
    check(existsSync(join(installedRoot, entry.import)), `${subpath} installed runtime missing`);
    check(existsSync(join(installedRoot, entry.types)), `${subpath} installed declarations missing`);
  }

  const tsc = join(repoRoot, 'node_modules/typescript/bin/tsc');
  console.log('[package-consumer] TypeScript resolution and declaration validation');
  run(process.execPath, [tsc, '-p', join(consumer, 'tsconfig.json'), '--noEmit', '--pretty', 'false'], consumer);
  console.log('[package-consumer] compiling executable consumer');
  run(process.execPath, [tsc, '-p', join(consumer, 'tsconfig.json'), '--pretty', 'false'], consumer);
  console.log('[package-consumer] runtime public-subpath consumer');
  const runtimeOutput = run(process.execPath, [join(consumer, 'compiled/index.mjs')], consumer);
  const runtime = JSON.parse(runtimeOutput);
  check(runtime.runtime === 'PASS' && runtime.declarations === 'PASS', 'consumer runtime did not pass');
  const irrConsumers = verifyActualIrrConsumers(consumer, temporary, tsc);

  console.log('[package-consumer] browser bundle and boundary scan');
  const browser = await viteBuild({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: {
        entry: join(installedRoot, installedManifest.exports['./portfolio-ui'].import),
        formats: ['es'],
        fileName: 'portfolio-ui-consumer',
      },
      rolldownOptions: {
        external: [/^react($|\/)/, /^react-dom($|\/)/],
      },
    },
  });
  const outputs = Array.isArray(browser) ? browser.flatMap((output) => output.output ?? []) : browser.output ?? [];
  const browserText = outputs.filter((output) => output.type === 'chunk').map((output) => output.code).join('\n');
  check(browserText.length > 0, 'browser bundle did not produce executable output');
  const forbidden = [
    'node:net', 'node:sqlite', 'node:fs', 'node:http', 'node:path', 'node:crypto',
    'createConnection', 'DatabaseSync', 'listenIpc', 'persistBrokerImport',
    'WRITE_NOT_AUTHORIZED', 'src/ipc/', 'src/persistence/', 'PitReadService',
    'HistoricalPitIngestionLoader', 'NON_PRODUCTION_D114',
  ];
  const hits = forbidden.filter((needle) => browserText.includes(needle));
  check(hits.length === 0, `browser closure contains forbidden entries: ${hits.join(', ')}`);
  check(browserText.length > 100_000, 'browser bundle is unexpectedly empty');

  console.log(JSON.stringify({
    result: 'PASS',
    pack: {
      files: pack.entryCount ?? pack.files.length,
      packedBytes: pack.size,
      unpackedBytes: pack.unpackedSize,
      shasum: pack.shasum,
    },
    exports: installedManifest.exports,
    runtime,
    irrConsumers,
    browser: {
      platform: 'browser',
      bytes: browserText.length,
      forbiddenHits: hits,
    },
    typecheck: {
      strict: true,
      skipLibCheck: false,
      result: 'PASS',
    },
  }, null, 2));
  succeeded = true;
} catch (error) {
  console.error(`[package-consumer] FAIL: ${error instanceof Error ? error.message : String(error)}`);
  console.error(`[package-consumer] preserved temporary evidence: ${temporary}`);
  process.exitCode = 1;
} finally {
  if (succeeded && process.env.IPD_PACKAGE_CONSUMER_KEEP !== '1') {
    rmSync(temporary, { recursive: true, force: true });
  } else if (succeeded) {
    console.log(`[package-consumer] preserved temporary evidence: ${temporary}`);
  }
}
