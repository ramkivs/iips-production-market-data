/**
 * Institutional Investment Platform System (IIPS)
 * Test Suite: CAP-02 Increment A — `./portfolio-ui` package export surface
 *
 * Governed under: `IIPS-V3-CAP02-IPD-EXPORT-IMPLEMENTATION-ACT-2026-10-23-01`
 *   (IPD `evidence/cross-repository/IIPS_V3_CAP02_INCREMENT_A_PACKAGE_EXPORT_IMPLEMENTATION_ACT_2026-10-23.md`)
 * Upstream: CAP-02 U0 decision (IPD-owned components, IRR host, reuse by governed package export),
 *   composition act §2.1 (exact Increment A file set).
 * Execution Mode: NON_PRODUCTION / LOCAL_FIXTURE_AND_OFFLINE_DEV — UNCHANGED.
 *
 * WHAT THIS SUITE PROVES
 *   T-PKG-1  the required public exports resolve from the entry point, with the expected kinds;
 *   T-PKG-2  every exported value is the SAME object the in-repo component uses (no second copy);
 *   T-PKG-3  the source import closure is browser-safe: no Node builtin, no `src/ipc/**`,
 *            no `src/persistence/**`, no write path, no IRR dependency;
 *   T-PKG-4  the package manifest resolves to the built artifacts on disk, and the BUILT closure is
 *            browser-safe too (the published artifact, not only the sources);
 *   T-PKG-5  privileged persistence / IPC internals are not exposed by the surface;
 *   T-PKG-6  write denial is untouched: the browser surface cannot reach the gate, and the gate
 *            source still refuses before mutation;
 *   T-PKG-7  no hidden dependency on IRR source files;
 *   T-PKG-8  truthfulness: the exported port is SESSION_ONLY and its status descriptor cannot
 *            render a durable commit, and the exported guard still refuses unresolved identity.
 *
 * WHAT THIS SUITE IS NOT
 *   It is NOT a UI-to-IPC integration test, NOT evidence of a durable commit, NOT a Gate 4
 *   qualification result and NOT a Gate 5 admission. It proves that a package surface exists and
 *   that it cannot reach the privileged side of the repository. Operational writes remain refused
 *   with `WRITE_NOT_AUTHORIZED` by the unchanged gate.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import * as pkg from '../src/ui/portfolio_ui_package.js';
import * as modalModule from '../frontend/src/features/portfolio/BrokerImportModal.js';
import * as portModule from '../frontend/src/features/portfolio/portfolioStorePort.js';
import * as storeModule from '../frontend/src/features/portfolio/portfolio-store.js';
import * as viewModelModule from '../frontend/src/features/portfolio/import/ui-broker-import-view-model.js';
import * as ingressModule from '../frontend/src/features/portfolio/import/broker-import-ingress.js';
import * as mapperModule from '../frontend/src/features/portfolio/import/broker-holdings-mapper.js';
import * as detectorModule from '../frontend/src/features/portfolio/import/broker-format-detector.js';
import * as adaptersModule from '../frontend/src/features/portfolio/import/adapters/index.js';
import * as securityMasterModule from '../src/identity/security_master.js';
import * as fixtureMasterModule from '../src/identity/governed_fixture_master.js';
import * as quarantineModule from '../src/identity/quarantine.js';

/* ------------------------------------------------------------------ *
 * Repository coordinates
 * ------------------------------------------------------------------ */

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENTRY_SOURCE = 'src/ui/portfolio_ui_package.ts';
const PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  exports?: Record<string, { types?: string; import?: string }>;
  files?: string[];
  scripts?: Record<string, string>;
};

const toPosix = (value: string): string => value.split(sep).join('/');
const relPath = (absolute: string): string => toPosix(relative(REPO_ROOT, absolute));

/** Node builtins that must never appear in a browser-facing import graph. */
const NODE_BUILTIN_SPECIFIERS = new Set([
  'node:crypto', 'node:fs', 'node:fs/promises', 'node:net', 'node:http', 'node:https',
  'node:path', 'node:os', 'node:sqlite', 'node:url', 'node:child_process', 'node:process',
  'buffer', 'crypto', 'fs', 'fs/promises', 'net', 'http', 'https', 'path', 'os', 'sqlite',
  'child_process', 'process', 'util', 'stream', 'events', 'url', 'vm', 'worker_threads',
]);

/** Directories whose modules are privileged (server/Node-only) and must stay out of the closure. */
const PRIVILEGED_PREFIXES = [
  'src/ipc/',
  'src/persistence/',
  'src/d114/',
  'src/security/',
  'scripts/',
  'tests/',
];

/** Files that reach Node builtins from a browser-safe area (checked explicitly, not by directory). */
const PRIVILEGED_FILES = new Set([
  'src/d114/evidence_handoff.ts',
  'src/security/scanner.ts',
]);

/* ------------------------------------------------------------------ *
 * Static import-graph walker (source tree and built artifacts)
 * ------------------------------------------------------------------ */

interface Graph {
  readonly files: readonly string[];
  readonly external: readonly string[];
  readonly unresolved: readonly string[];
  readonly specifiersByFile: ReadonlyMap<string, readonly string[]>;
}

function readImportSpecifiers(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const specifiers: string[] = [];
  const fromRe = /(?:^|\n)[ \t]*(?:import|export)\b[^;]*?\bfrom\s*['"]([^'"]+)['"]/g;
  const bareRe = /(?:^|\n)[ \t]*import\s*['"]([^'"]+)['"]/g;
  for (const re of [fromRe, bareRe]) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(source)) !== null) specifiers.push(match[1]);
  }
  return specifiers;
}

function resolveSourceSpecifier(fromFile: string, specifier: string): string | null {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [base];
  if (base.endsWith('.js')) {
    const stem = base.slice(0, -'.js'.length);
    candidates.push(`${stem}.ts`, `${stem}.tsx`, `${stem}.d.ts`);
  }
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function resolveBuiltSpecifier(fromFile: string, specifier: string): string | null {
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [base, `${base}.js`];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function walkGraph(entry: string, resolver: (from: string, specifier: string) => string | null): Graph {
  const seen = new Set<string>();
  const external = new Set<string>();
  const unresolved: string[] = [];
  const specifiersByFile = new Map<string, readonly string[]>();
  const stack: string[] = [entry];

  while (stack.length > 0) {
    const file = stack.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    const specifiers = readImportSpecifiers(file);
    specifiersByFile.set(file, specifiers);
    for (const specifier of specifiers) {
      if (specifier.startsWith('.')) {
        const target = resolver(file, specifier);
        if (target) stack.push(target);
        else unresolved.push(`${relPath(file)} -> ${specifier}`);
      } else {
        external.add(specifier);
      }
    }
  }

  return {
    files: [...seen].map(relPath).sort(),
    external: [...external].sort(),
    unresolved: unresolved.sort(),
    specifiersByFile,
  };
}

/* ------------------------------------------------------------------ *
 * Expected surface — the symbols the selected IRR-hosted composition imports
 * ------------------------------------------------------------------ */

const REQUIRED_VALUE_EXPORTS: ReadonlyArray<string> = [
  // mountable component
  'BrokerImportModal',
  'DEFAULT_ALLOW_NON_PRODUCTION_BYPASS',
  // port seam
  'SessionPortfolioStorePort',
  'getDefaultPortfolioStorePort',
  'resetDefaultPortfolioStorePort',
  'evaluatePortSaveGuard',
  'findCallerSuppliedIdentityKeys',
  'CALLER_SUPPLIED_IDENTITY_KEYS',
  'describePersistenceStatus',
  // portfolio domain the component requires
  'PortfolioStore',
  'getDefaultPortfolioStore',
  'resetDefaultPortfolioStore',
  // import pipeline
  'BrokerImportIngressOrchestrator',
  'mapBrokerOutputToUserHoldings',
  'BrokerFormatDetector',
  'ZerodhaHoldingsAdapter',
  'DhanHoldingsAdapter',
  'GrowwHoldingsAdapter',
  'PortfolioBrokerImportController',
  // identity authority
  'SecurityMaster',
  'getGovernedBroadSecurityMaster',
  'IdentityAmbiguityError',
];

/** Value symbols that must be byte-identical to their authoritative module's export. */
const IDENTITY_CHECKS: ReadonlyArray<{
  name: string;
  module: Record<string, unknown>;
}> = [
  { name: 'BrokerImportModal', module: modalModule as unknown as Record<string, unknown> },
  { name: 'DEFAULT_ALLOW_NON_PRODUCTION_BYPASS', module: modalModule as unknown as Record<string, unknown> },
  { name: 'PortfolioStore', module: storeModule as unknown as Record<string, unknown> },
  { name: 'SessionPortfolioStorePort', module: portModule as unknown as Record<string, unknown> },
  { name: 'describePersistenceStatus', module: portModule as unknown as Record<string, unknown> },
  { name: 'evaluatePortSaveGuard', module: portModule as unknown as Record<string, unknown> },
  { name: 'findCallerSuppliedIdentityKeys', module: portModule as unknown as Record<string, unknown> },
  { name: 'CALLER_SUPPLIED_IDENTITY_KEYS', module: portModule as unknown as Record<string, unknown> },
  { name: 'PortfolioBrokerImportController', module: viewModelModule as unknown as Record<string, unknown> },
  { name: 'BrokerImportIngressOrchestrator', module: ingressModule as unknown as Record<string, unknown> },
  { name: 'mapBrokerOutputToUserHoldings', module: mapperModule as unknown as Record<string, unknown> },
  { name: 'BrokerFormatDetector', module: detectorModule as unknown as Record<string, unknown> },
  { name: 'ZerodhaHoldingsAdapter', module: adaptersModule as unknown as Record<string, unknown> },
  { name: 'DhanHoldingsAdapter', module: adaptersModule as unknown as Record<string, unknown> },
  { name: 'GrowwHoldingsAdapter', module: adaptersModule as unknown as Record<string, unknown> },
  { name: 'SecurityMaster', module: securityMasterModule as unknown as Record<string, unknown> },
  { name: 'getGovernedBroadSecurityMaster', module: fixtureMasterModule as unknown as Record<string, unknown> },
  { name: 'IdentityAmbiguityError', module: quarantineModule as unknown as Record<string, unknown> },
];

/** Privileged internals that must never appear on the public surface. */
const FORBIDDEN_EXPORT_NAMES: ReadonlyArray<string> = [
  'DurablePortfolioStore',
  'DurablePortfolioStorePort',
  'persistBrokerImport',
  'evaluateBrokerImportIdentityGate',
  'mapBrokerImportHoldings',
  'computeBrokerImportProvenance',
  'openDatabase',
  'closeDatabase',
  'ensureMigrations',
  'provisionBinding',
  'IPC_WRITE_OPERATIONS',
  'IPC_READ_OPERATIONS',
  'IPC_REFUSED_WIRE_KEYS',
  'findRefusedWireKeys',
  'dispatchRequest',
  'WRITE_NOT_AUTHORIZED',
];

/* ================================================================== *
 * T-PKG-1 — required exports resolve from the entry point
 * ================================================================== */

describe('CAP-02 Increment A — T-PKG-1: required exports resolve from the package entry point', () => {
  it('exports every symbol the selected composition imports, with a usable kind', () => {
    for (const name of REQUIRED_VALUE_EXPORTS) {
      const value = (pkg as unknown as Record<string, unknown>)[name];
      assert.notEqual(value, undefined, `missing required export: ${name}`);
      const kind = typeof value;
      assert.ok(
        kind === 'function' || kind === 'object' || kind === 'boolean' || kind === 'string',
        `${name} has an unusable runtime kind: ${kind}`,
      );
    }
  });

  it('exposes the component as a mountable React component function', () => {
    assert.equal(typeof pkg.BrokerImportModal, 'function');
    assert.equal(typeof pkg.PortfolioBrokerImportController, 'function');
    assert.equal(typeof pkg.BrokerImportIngressOrchestrator.executeIngress, 'function');
  });

  it('exposes the port seam and the truthful durability descriptor', () => {
    assert.equal(typeof pkg.getDefaultPortfolioStorePort, 'function');
    assert.equal(typeof pkg.describePersistenceStatus, 'function');
    assert.equal(typeof pkg.evaluatePortSaveGuard, 'function');
    assert.ok(Array.isArray(pkg.CALLER_SUPPLIED_IDENTITY_KEYS));
    assert.ok(pkg.CALLER_SUPPLIED_IDENTITY_KEYS.includes('owner'));
    assert.ok(pkg.CALLER_SUPPLIED_IDENTITY_KEYS.includes('tenantId'));
  });
});

/* ================================================================== *
 * T-PKG-2 — single authority: exported objects ARE the source objects
 * ================================================================== */

describe('CAP-02 Increment A — T-PKG-2: exported symbols are the in-repo objects (no second implementation)', () => {
  it('every value export is reference-identical to its authoritative module export', () => {
    for (const { name, module } of IDENTITY_CHECKS) {
      assert.notEqual(module[name], undefined, `authoritative module no longer exports ${name}`);
      assert.equal(
        (pkg as unknown as Record<string, unknown>)[name],
        module[name],
        `${name} is not the same object as the authoritative module export — the surface must not fork it`,
      );
    }
  });

  it('does not define a second SecurityMaster, store, port or ingress implementation', () => {
    const master = pkg.getGovernedBroadSecurityMaster();
    assert.ok(master instanceof pkg.SecurityMaster);
    assert.ok(master instanceof securityMasterModule.SecurityMaster);

    const store = new pkg.PortfolioStore();
    assert.ok(store instanceof storeModule.PortfolioStore);

    const port = pkg.getDefaultPortfolioStorePort();
    assert.ok(port instanceof pkg.SessionPortfolioStorePort);
    assert.ok(port instanceof portModule.SessionPortfolioStorePort);
  });
});

/* ================================================================== *
 * T-PKG-3 — the source closure is browser-safe and unprivileged
 * ================================================================== */

describe('CAP-02 Increment A — T-PKG-3: source import closure is browser-safe', () => {
  const graph = walkGraph(resolve(REPO_ROOT, ENTRY_SOURCE), resolveSourceSpecifier);

  it('resolves every relative import in the closure (no dangling subpath)', () => {
    assert.deepEqual(graph.unresolved, [], 'the entry point closure has unresolved imports');
    assert.ok(graph.files.length > 0);
  });

  it('imports no Node builtin anywhere in the closure', () => {
    const offenders: string[] = [];
    for (const [file, specifiers] of graph.specifiersByFile) {
      for (const specifier of specifiers) {
        const bare = specifier.replace(/^node:/, '');
        if (NODE_BUILTIN_SPECIFIERS.has(specifier) || NODE_BUILTIN_SPECIFIERS.has(bare)) {
          offenders.push(`${relPath(file)} -> ${specifier}`);
        }
        if (specifier.startsWith('node:')) offenders.push(`${relPath(file)} -> ${specifier}`);
      }
    }
    assert.deepEqual(offenders, [], 'browser-facing closure imports a Node builtin');
  });

  it('imports no privileged module: IPC, persistence, durable store, migrations, binding, gate', () => {
    const offenders = graph.files.filter(
      (file) => PRIVILEGED_PREFIXES.some((prefix) => file.startsWith(prefix)) || PRIVILEGED_FILES.has(file),
    );
    assert.deepEqual(offenders, [], 'privileged module reachable from a browser-facing import');
  });

  it('has exactly one external dependency: react', () => {
    assert.deepEqual(graph.external, ['react']);
  });

  it('every guarded Buffer reference is behind a typeof check (no unguarded Node global)', () => {
    const unguarded: string[] = [];
    for (const file of graph.files) {
      const source = readFileSync(resolve(REPO_ROOT, file), 'utf8');
      for (const line of source.split('\n')) {
        if (!/\bBuffer\b/.test(line)) continue;
        if (/typeof\s+Buffer\s*!==\s*'undefined'/.test(line)) continue;
        if (/^\s*\*/.test(line) || /^\s*\/\//.test(line)) continue; // documentation comment
        if (/Buffer\s*\|/.test(line) || /Uint8Array|ArrayBuffer/.test(line)) continue; // type position
        unguarded.push(`${file}: ${line.trim()}`);
      }
    }
    assert.deepEqual(unguarded, [], 'unguarded Buffer use in a browser-facing closure');
  });
});

/* ================================================================== *
 * T-PKG-4 — the package manifest resolves to the built artifacts
 * ================================================================== */

describe('CAP-02 Increment A — T-PKG-4: package manifest and built artifacts', () => {
  const exportEntry = PACKAGE_JSON.exports?.['./portfolio-ui'];
  const builtEntry = resolve(REPO_ROOT, exportEntry?.import ?? '');
  const builtTypes = resolve(REPO_ROOT, exportEntry?.types ?? '');

  it('declares exactly the authorized public subpaths', () => {
    // REG-06 admission (2026-11-01) added ./operator-drop. The assertion still
    // pins the map exactly, so any further subpath must be admitted explicitly.
    assert.deepEqual(Object.keys(PACKAGE_JSON.exports ?? {}), [
      './portfolio-ui',
      './pit',
      './d114-non-production',
      './operator-drop',
    ]);
  });

  it('publishes only the built package directory', () => {
    assert.deepEqual(PACKAGE_JSON.files, ['dist/package']);
  });

  it('maps ./portfolio-ui to the emitted entry point for both runtime and types', () => {
    assert.equal(exportEntry?.import, './dist/package/src/ui/portfolio_ui_package.js');
    assert.equal(exportEntry?.types, './dist/package/src/ui/portfolio_ui_package.d.ts');
    assert.equal(relPath(builtEntry), 'dist/package/src/ui/portfolio_ui_package.js');
    assert.equal(relPath(builtTypes), 'dist/package/src/ui/portfolio_ui_package.d.ts');
  });

  it('has a build script that produces the package artifacts', () => {
    assert.equal(
      PACKAGE_JSON.scripts?.['build:portfolio-ui-package'],
      'tsc -p tsconfig.portfolio-ui-package.json',
    );
    assert.ok(
      (PACKAGE_JSON.scripts?.build ?? '').includes('build:portfolio-ui-package'),
      'the production build must emit the package artifacts the exports map points at',
    );
  });

  it('the declared artifacts exist on disk after the build', () => {
    assert.ok(existsSync(builtEntry), `missing built entry point: ${relPath(builtEntry)} (run npm run build)`);
    assert.ok(existsSync(builtTypes), `missing built declarations: ${relPath(builtTypes)}`);
    const built = readFileSync(builtEntry, 'utf8');
    assert.ok(built.includes('export'), 'the built entry point exports nothing');
  });

  it('the BUILT import closure is browser-safe too', () => {
    const builtGraph = walkGraph(builtEntry, resolveBuiltSpecifier);
    assert.deepEqual(builtGraph.unresolved, [], 'the built closure has unresolved imports');
    const offenders = builtGraph.files.filter((file) => {
      if (PRIVILEGED_PREFIXES.some((prefix) => file.startsWith(prefix))) return true;
      const source = readFileSync(resolve(REPO_ROOT, file), 'utf8');
      return /from\s*['"]node:|require\(\s*['"]node:/.test(source);
    });
    assert.deepEqual(offenders, [], 'the published artifact reaches a Node-only or privileged module');
  });

  it('the built entry point loads and exposes the same public names', async () => {
    const built = (await import(pathToFileURL(builtEntry).href)) as Record<string, unknown>;
    for (const name of REQUIRED_VALUE_EXPORTS) {
      assert.notEqual(built[name], undefined, `built artifact does not export ${name}`);
    }
    assert.equal(typeof built.BrokerImportModal, 'function');
  });
});

/* ================================================================== *
 * T-PKG-5 — privileged persistence internals are not exposed
 * ================================================================== */

describe('CAP-02 Increment A — T-PKG-5: no privileged persistence/IPC internals on the surface', () => {
  it('exposes none of the forbidden privileged symbols', () => {
    const surface = Object.keys(pkg as unknown as Record<string, unknown>);
    for (const name of FORBIDDEN_EXPORT_NAMES) {
      assert.ok(!surface.includes(name), `privileged symbol exposed: ${name}`);
    }
  });

  it('does not expose SQLite, migration, binding or wire-contract machinery by any name', () => {
    const surface = Object.keys(pkg as unknown as Record<string, unknown>);
    const suspicious = surface.filter((name) =>
      /(^|_)(sqlite|SQLite|Database|Migration|migrations|Binding|binding|IPC|Ipc|dispatch|Dispatch)/.test(name),
    );
    assert.deepEqual(suspicious, [], 'surface exposes persistence/IPC machinery');
  });

  it('the port declaration and the descriptor stay durability-honest', () => {
    const port = pkg.getDefaultPortfolioStorePort();
    assert.equal(port.durability, 'SESSION_ONLY');
    assert.equal(port.durable, false);
  });
});

/* ================================================================== *
 * T-PKG-6 — write denial untouched and unreachable from the browser surface
 * ================================================================== */

describe('CAP-02 Increment A — T-PKG-6: write denial unchanged', () => {
  it('the browser-facing surface cannot reach the IPC dispatch gate at all', () => {
    const graph = walkGraph(resolve(REPO_ROOT, ENTRY_SOURCE), resolveSourceSpecifier);
    for (const file of graph.files) {
      assert.ok(!file.startsWith('src/ipc/'), `browser closure reaches the IPC layer: ${file}`);
    }
  });

  it('the gate still refuses every write before mutation (source unchanged by this act)', () => {
    const dispatch = readFileSync(resolve(REPO_ROOT, 'src/ipc/dispatch.ts'), 'utf8');
    assert.ok(
      dispatch.includes("'WRITE_NOT_AUTHORIZED'"),
      'the Gate E W-1 refusal is no longer present in the dispatch path',
    );
    const gateIndex = dispatch.indexOf('IPC_WRITE_OPERATIONS as readonly string[]');
    assert.ok(gateIndex >= 0, 'the write-set gate is no longer present in the dispatch path');
    const gateBlock = dispatch.slice(gateIndex, gateIndex + 500);
    assert.ok(
      gateBlock.includes("'WRITE_NOT_AUTHORIZED'") && /return;/.test(gateBlock),
      'the write set is no longer refused before dispatch',
    );
    assert.ok(
      gateBlock.indexOf("'WRITE_NOT_AUTHORIZED'") < gateBlock.indexOf('switch (envelope.op)'),
      'the refusal must precede operation dispatch',
    );
    const protocol = readFileSync(resolve(REPO_ROOT, 'src/ipc/protocol.ts'), 'utf8');
    assert.ok(protocol.includes("'portfolio.save'"), 'contract v1 write set changed');
    assert.ok(protocol.includes('IPC_REFUSED_WIRE_KEYS'), 'the C7 caller-authority refusal list changed');
  });

  it('exposes no write operation and no durable-port factory', () => {
    const surface = Object.keys(pkg as unknown as Record<string, unknown>);
    assert.ok(!surface.some((name) => /^save[A-Z]|write[A-Z]|commit/i.test(name)));
  });
});

/* ================================================================== *
 * T-PKG-7 — no hidden dependency on the IRR repository
 * ================================================================== */

describe('CAP-02 Increment A — T-PKG-7: no hidden IRR dependency', () => {
  const graph = walkGraph(resolve(REPO_ROOT, ENTRY_SOURCE), resolveSourceSpecifier);

  it('every closure file lives inside this repository', () => {
    for (const file of graph.files) {
      assert.ok(!isAbsolute(file), `absolute path in closure: ${file}`);
      assert.ok(!file.startsWith('..'), `closure escapes the repository: ${file}`);
      assert.ok(existsSync(resolve(REPO_ROOT, file)), `closure file missing: ${file}`);
    }
  });

  it('imports no IRR package, path or sibling checkout', () => {
    const offenders: string[] = [];
    for (const [file, specifiers] of graph.specifiersByFile) {
      for (const specifier of specifiers) {
        if (/iips-review-recovered|review-recovered|\/irr\/|\.\.\/irr/i.test(specifier)) {
          offenders.push(`${relPath(file)} -> ${specifier}`);
        }
      }
    }
    assert.deepEqual(offenders, []);
  });

  it('re-exports no IPD application shell or workspace surface', () => {
    const surface = Object.keys(pkg as unknown as Record<string, unknown>);
    for (const name of ['App', 'AppShell', 'PortfolioWorkspace', 'Sidebar', 'TopBar']) {
      assert.ok(!surface.includes(name), `application shell symbol exported: ${name}`);
    }
  });
});

/* ================================================================== *
 * T-PKG-8 — truthful durability and identity refusal through the surface
 * ================================================================== */

describe('CAP-02 Increment A — T-PKG-8: durability truth and identity refusal survive the surface', () => {
  it('a session-only save status can never be described as durable', () => {
    const empty = pkg.describePersistenceStatus({ isSaved: false, durable: false });
    assert.equal(empty.state, 'EMPTY');
    assert.equal(empty.isDurable, false);

    const session = pkg.describePersistenceStatus({ isSaved: true, durable: false, lastUpdated: '2026-10-23T00:00:00.000Z' });
    assert.equal(session.state, 'SESSION_ONLY');
    assert.equal(session.isDurable, false);
    assert.ok(!/COMMITTED/.test(session.label), 'a session-only save must not read as COMMITTED');
    assert.ok(/SESSION ONLY/i.test(session.label));
  });

  it('the port guard still refuses holdings with no canonical identity', () => {
    const guard = pkg.evaluatePortSaveGuard([
      { symbol: 'RELIANCE', companyId: 'C-RELIANCE', identityStatus: 'RESOLVED' } as never,
    ]);
    assert.equal(guard.saveable, true);

    const refused = pkg.evaluatePortSaveGuard([
      { symbol: 'RELIANCE', companyId: '', identityStatus: 'UNRESOLVED' } as never,
    ]);
    assert.equal(refused.saveable, false);
    assert.equal(refused.refusedHoldings.length, 1);
  });

  it('caller-supplied identity keys are still detected through the exported helper', () => {
    assert.deepEqual(pkg.findCallerSuppliedIdentityKeys({ holdings: [], ownerId: 'x' }), ['ownerId']);
    assert.deepEqual(pkg.findCallerSuppliedIdentityKeys({ holdings: [] }), []);
  });
});
