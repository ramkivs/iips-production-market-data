/**
 * Direct P1 Local User-Portfolio Provisioning & Verification Tests (IPD).
 *
 * Authority: IIPS-V3-CAP03-PA-BLANKET-WAIVER-ONE-PASS-AUTHORIZATION-2026-11-01-01
 *
 * Covers:
 *   1. Runtime & dependency validation (Node >= 22.13.0, built-in node:sqlite,
 *      ordered migrations 001..004, PA-determined S1 identity constants).
 *   2. Database destination validation (Windows & POSIX path rules, Git-worktree
 *      refusal, symlink target/ancestor refusal, non-file path refusal).
 *   3. Fresh provisioning end-to-end (migrations 001..004, user-portfolio schema,
 *      initial binding/membership/audit records, constraints, indexes, full G3 IPC
 *      server startup + wire v1 `portfolio.list`).
 *   4. Atomic transaction rollback & clean incomplete-file removal on fault.
 *   5. Safe repeat invocation (idempotent read-only verification with byte-for-byte
 *      SHA-256 preservation on both empty and populated user-portfolio databases).
 *   6. Existing-database protection (never overwrites non-SQLite files, 0-byte
 *      files, foreign SQLite databases, partially migrated databases, tampered
 *      databases, or existing stores under --require-fresh).
 *   7. Standalone CLI execution & zero P1-F / preflight / retry / token coupling.
 *   8. Windows PowerShell 5.1 script (`scripts/Invoke-DirectP1Provisioning.ps1`)
 *      lexical/structural syntax, parameter contract, and control-flow constraints.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { startIpcServer } from '../src/ipc/entrypoint.js';
import { IPC_PROTOCOL_VERSION } from '../src/ipc/protocol.js';
import { appendAuditEvent } from '../src/persistence/audit.js';
import { resolveActiveBinding } from '../src/persistence/binding.js';
import { closeDatabase, openDatabase } from '../src/persistence/connection.js';
import {
  DESIGNATED_USER_PORTFOLIO_DB_PATH,
  DIRECT_PROVISIONING_AUTHORITY_ID,
  DirectProvisioningError,
  parseDirectProvisioningArgs,
  provisionUserPortfolioDatabase,
  resolveDesignatedIdentityTriple,
  runDirectProvisioningCli,
  validateDatabaseDestination,
  validateRuntimeAndDependencies,
  verifyUserPortfolioDatabase,
} from '../src/persistence/directP1Provisioning.js';
import {
  GATE3_MIGRATIONS,
  validateStoreAtPath,
} from '../src/persistence/gateAPrimeValidation.js';
import { ensureMigrations } from '../src/persistence/migration_ledger.js';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(THIS_DIR, '..', '..');
const SOURCE_DIRECT_MODULE_PATH = join(
  REPO_ROOT,
  'src',
  'persistence',
  'directP1Provisioning.ts',
);
const COMPILED_DIRECT_CLI_PATH = join(
  REPO_ROOT,
  'dist',
  'src',
  'persistence',
  'directP1Provisioning.js',
);
const POWERSHELL_SCRIPT_PATH = join(
  REPO_ROOT,
  'scripts',
  'Invoke-DirectP1Provisioning.ps1',
);

const FIXED_ISO = '2026-11-01T10:00:00.000Z';

function sha256OfFile(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function removeDirWithRetry(root: string): void {
  closeDatabase();
  const attempts = process.platform === 'win32' ? 12 : 1;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code !== 'EBUSY' && code !== 'EPERM' && code !== 'ENOTEMPTY') throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }
  }
  throw lastError;
}

function withTempWorkspace<T>(fn: (dir: string) => T | Promise<T>): T | Promise<T> {
  const dir = mkdtempSync(join(tmpdir(), 'iips-direct-p1-'));
  try {
    const out = fn(dir);
    if (out instanceof Promise) {
      return out.finally(() => removeDirWithRetry(dir));
    }
    removeDirWithRetry(dir);
    return out;
  } catch (err) {
    removeDirWithRetry(dir);
    throw err;
  }
}

function encodeWireV1Frame(message: Record<string, unknown>): Buffer {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const frame = Buffer.alloc(4 + body.length);
  frame.writeUInt32BE(body.length, 0);
  body.copy(frame, 4);
  return frame;
}

interface PsToken {
  kind:
    | 'comment'
    | 'block_comment'
    | 'single_string'
    | 'double_string'
    | 'variable'
    | 'word'
    | 'punct'
    | 'other';
  value: string;
  line: number;
}

/**
 * Deterministic Windows PowerShell 5.1 lexical scanner & balanced-delimiter
 * structural checker for CI environments without `powershell.exe`.
 */
function analyzePowerShell51Script(source: string): {
  tokens: PsToken[];
  unclosedConstructs: string[];
  topLevelStatements: string[];
} {
  const tokens: PsToken[] = [];
  const unclosedConstructs: string[] = [];
  const delimStack: Array<{ ch: string; expected: string; line: number }> = [];

  let i = 0;
  let line = 1;
  const n = source.length;

  while (i < n) {
    const ch = source[i];

    if (ch === '\n') {
      line += 1;
      i += 1;
      continue;
    }
    if (ch === '\r' || ch === ' ' || ch === '\t') {
      i += 1;
      continue;
    }

    // Block comment <# ... #>
    if (ch === '<' && source[i + 1] === '#') {
      const startLine = line;
      const start = i;
      i += 2;
      let closed = false;
      while (i < n) {
        if (source[i] === '\n') line += 1;
        if (source[i] === '#' && source[i + 1] === '>') {
          i += 2;
          closed = true;
          break;
        }
        i += 1;
      }
      if (!closed) {
        unclosedConstructs.push(`Unclosed <# block comment starting at line ${startLine}`);
      }
      tokens.push({ kind: 'block_comment', value: source.slice(start, i), line: startLine });
      continue;
    }

    // Single-line comment # ...
    if (ch === '#') {
      const startLine = line;
      const start = i;
      while (i < n && source[i] !== '\n') {
        i += 1;
      }
      tokens.push({ kind: 'comment', value: source.slice(start, i), line: startLine });
      continue;
    }

    // Single-quoted literal string '...' ('' escapes embedded ')
    if (ch === "'") {
      const startLine = line;
      const start = i;
      i += 1;
      let closed = false;
      while (i < n) {
        if (source[i] === '\n') line += 1;
        if (source[i] === "'") {
          if (source[i + 1] === "'") {
            i += 2;
            continue;
          }
          i += 1;
          closed = true;
          break;
        }
        i += 1;
      }
      if (!closed) {
        unclosedConstructs.push(`Unclosed single-quoted string starting at line ${startLine}`);
      }
      tokens.push({ kind: 'single_string', value: source.slice(start, i), line: startLine });
      continue;
    }

    // Double-quoted expandable string "..." (` escapes next char)
    if (ch === '"') {
      const startLine = line;
      const start = i;
      i += 1;
      let closed = false;
      while (i < n) {
        if (source[i] === '\n') line += 1;
        if (source[i] === '`') {
          if (i + 1 < n && source[i + 1] === '\n') line += 1;
          i += 2;
          continue;
        }
        if (source[i] === '"') {
          i += 1;
          closed = true;
          break;
        }
        i += 1;
      }
      if (!closed) {
        unclosedConstructs.push(`Unclosed double-quoted string starting at line ${startLine}`);
      }
      tokens.push({ kind: 'double_string', value: source.slice(start, i), line: startLine });
      continue;
    }

    // Delimiters { } ( ) [ ]
    if (ch === '{' || ch === '(' || ch === '[') {
      const expected = ch === '{' ? '}' : ch === '(' ? ')' : ']';
      delimStack.push({ ch, expected, line });
      tokens.push({ kind: 'punct', value: ch, line });
      i += 1;
      continue;
    }
    if (ch === '}' || ch === ')' || ch === ']') {
      const top = delimStack.pop();
      if (!top) {
        unclosedConstructs.push(`Unexpected closing '${ch}' at line ${line}`);
      } else if (top.expected !== ch) {
        unclosedConstructs.push(
          `Mismatched delimiter at line ${line}: expected '${top.expected}' (opened '${top.ch}' at line ${top.line}), got '${ch}'`,
        );
      }
      tokens.push({ kind: 'punct', value: ch, line });
      i += 1;
      continue;
    }

    // PowerShell variable $scope:name or $_
    if (ch === '$') {
      const start = i;
      i += 1;
      while (i < n && /[A-Za-z0-9_:]/.test(source[i])) {
        i += 1;
      }
      tokens.push({ kind: 'variable', value: source.slice(start, i), line });
      continue;
    }

    // Bare word / cmdlet / keyword / parameter (-Foo or Foo-Bar)
    if (/[A-Za-z_]/.test(ch) || (ch === '-' && /[A-Za-z]/.test(source[i + 1] ?? ''))) {
      const start = i;
      i += 1;
      while (i < n && /[A-Za-z0-9_-]/.test(source[i])) {
        i += 1;
      }
      tokens.push({ kind: 'word', value: source.slice(start, i), line });
      continue;
    }

    tokens.push({ kind: 'other', value: ch, line });
    i += 1;
  }

  for (const leftover of delimStack) {
    unclosedConstructs.push(
      `Unclosed '${leftover.ch}' opened at line ${leftover.line}`,
    );
  }

  // Record top-level words outside { }, ( ), [ ]
  const topLevelStatements: string[] = [];
  let depth = 0;
  for (const tok of tokens) {
    if (tok.kind === 'punct' && (tok.value === '{' || tok.value === '(' || tok.value === '[')) {
      depth += 1;
      continue;
    }
    if (tok.kind === 'punct' && (tok.value === '}' || tok.value === ')' || tok.value === ']')) {
      depth -= 1;
      continue;
    }
    if (depth === 0 && tok.kind === 'word') {
      topLevelStatements.push(tok.value);
    }
  }

  return { tokens, unclosedConstructs, topLevelStatements };
}

describe('Direct P1 Provisioning — Runtime & Dependency Validation', () => {
  it('validates supported Node >= 22.13.0, flag-free node:sqlite, migrations 001..004, and S1 identity constants', () => {
    const report = validateRuntimeAndDependencies();
    assert.equal(report.minimumNodeVersion, '22.13.0');
    assert.equal(report.foreignKeysPragmaSupported, true);
    assert.match(report.sqliteVersion, /^\d+\.\d+\.\d+/);
    assert.deepEqual(report.migrationIds, [
      '001_initial_schema',
      '002_audit_event_sequence',
      '003_local_principal_bindings',
      '004_portfolio_contribution_provenance',
    ]);
    assert.equal(report.principalLabel, 'ramki-personal-local');
    assert.equal(report.tenantId, 'ipd-personal-local');
    assert.equal(report.canonicalOwnerId, 'ipd-owner-ramki-personal');
    assert.equal(report.bindingId, 'c5808abaffd072d6401ce63ad86c6ac0');
    assert.equal(report.membershipId, 'd25dcc5370100b00766efc5166f65cf3');
  });

  it('accepts Node 22.16.0 (Windows host target) and Node 24.x without artificial <23 ceiling', () => {
    const winTarget = validateRuntimeAndDependencies({ nodeVersion: '22.16.0' });
    assert.equal(winTarget.nodeVersion, '22.16.0');
    const futureNode = validateRuntimeAndDependencies({ nodeVersion: '24.2.0' });
    assert.equal(futureNode.nodeVersion, '24.2.0');
  });

  it('rejects unsupported Node versions below 22.13.0 with RUNTIME_UNSUPPORTED', () => {
    for (const oldVer of ['18.20.0', '20.11.1', '22.12.9']) {
      assert.throws(
        () => validateRuntimeAndDependencies({ nodeVersion: oldVer }),
        (err: unknown) =>
          err instanceof DirectProvisioningError && err.code === 'RUNTIME_UNSUPPORTED',
      );
    }
  });
});

describe('Direct P1 Provisioning — Destination Path Validation', () => {
  it('accepts designated Windows path C:\\iips-data\\iips\\user-portfolio.sqlite under win32 rules', () => {
    assert.equal(
      DESIGNATED_USER_PORTFOLIO_DB_PATH,
      'C:\\iips-data\\iips\\user-portfolio.sqlite',
    );
    const res = validateDatabaseDestination(DESIGNATED_USER_PORTFOLIO_DB_PATH, {
      platform: 'win32',
    });
    assert.equal(res.storePath, 'C:\\iips-data\\iips\\user-portfolio.sqlite');
    assert.equal(res.parentDirectory, 'C:\\iips-data\\iips');
    assert.equal(res.platform, 'win32');
  });

  it('rejects UNC, named-pipe, drive-relative, URL, traversal, and directory-trailing Windows paths', () => {
    const invalidWinPaths = [
      '',
      '   ',
      ':memory:',
      '\\\\.\\pipe\\iips-user-portfolio-v1',
      '\\\\server\\share\\user-portfolio.sqlite',
      'C:user-portfolio.sqlite',
      'relative\\user-portfolio.sqlite',
      'C:\\iips-data\\..\\user-portfolio.sqlite',
      'C:\\iips-data\\iips\\',
      'file:///C:/iips-data/iips/user-portfolio.sqlite',
      'C:\\iips-data\\bad|name.sqlite',
    ];
    for (const bad of invalidWinPaths) {
      assert.throws(
        () => validateDatabaseDestination(bad, { platform: 'win32' }),
        (err: unknown) =>
          err instanceof DirectProvisioningError && err.code === 'STORE_PATH_INVALID',
        `Expected STORE_PATH_INVALID for "${bad}"`,
      );
    }
  });

  it('rejects store destinations inside any Git worktree', () => {
    const insideRepoPath = join(REPO_ROOT, 'tmp-illegal-user-portfolio.sqlite');
    assert.throws(
      () => validateDatabaseDestination(insideRepoPath),
      (err: unknown) =>
        err instanceof DirectProvisioningError &&
        err.code === 'STORE_PATH_IN_GIT_WORKTREE',
    );
    assert.equal(existsSync(insideRepoPath), false);
  });

  it('rejects symbolic-link targets, symbolic-link ancestors, file ancestors, and existing directories', () =>
    withTempWorkspace((dir) => {
      const realSubdir = join(dir, 'real-dir');
      mkdirSync(realSubdir, { recursive: true });
      const realTarget = join(realSubdir, 'real.sqlite');
      writeFileSync(realTarget, 'placeholder');

      const symlinkTarget = join(dir, 'symlink-db.sqlite');
      symlinkSync(realTarget, symlinkTarget);
      assert.throws(
        () => validateDatabaseDestination(symlinkTarget),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'STORE_PATH_SYMLINK_UNSUPPORTED',
      );

      const symlinkDir = join(dir, 'symlink-dir');
      symlinkSync(realSubdir, symlinkDir);
      assert.throws(
        () => validateDatabaseDestination(join(symlinkDir, 'nested.sqlite')),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'STORE_PATH_SYMLINK_UNSUPPORTED',
      );

      const fileAsParent = join(dir, 'plain-file');
      writeFileSync(fileAsParent, 'not-a-dir');
      assert.throws(
        () => validateDatabaseDestination(join(fileAsParent, 'nested.sqlite')),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'STORE_PARENT_NOT_DIRECTORY',
      );

      assert.throws(
        () => validateDatabaseDestination(realSubdir),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'EXISTING_PATH_NOT_REGULAR_FILE',
      );
    }));
});

describe('Direct P1 Provisioning — Fresh Provisioning, Schema, Constraints & IPC Compatibility', () => {
  it('initializes migrations 001..004, user-portfolio schema, initial binding/membership/audit records, and passes all verifiers', () =>
    withTempWorkspace((dir) => {
      const storePath = join(dir, 'iips-data', 'iips', 'user-portfolio.sqlite');
      const identity = resolveDesignatedIdentityTriple();
      const result = provisionUserPortfolioDatabase({
        storePath,
        now: () => FIXED_ISO,
      });

      assert.equal(result.ok, true);
      assert.equal(result.status, 'PROVISIONED');
      assert.equal(result.authorityId, DIRECT_PROVISIONING_AUTHORITY_ID);
      assert.equal(result.storePath, storePath);
      assert.equal(result.storeExistedBefore, false);
      assert.equal(result.mutated, true);
      assert.ok(result.fileSizeBytes > 0);
      assert.equal(result.fileSha256, sha256OfFile(storePath));

      // All 9 DP-V1..DP-V9 checks pass
      assert.equal(result.checks.length, 9);
      for (const chk of result.checks) {
        assert.equal(chk.passed, true, `${chk.checkId} failed: ${chk.detail}`);
      }

      // Schema & migration ledger checks
      assert.equal(result.schema.migrationCount, 4);
      assert.deepEqual(
        result.schema.appliedMigrations.map((m) => m.migrationId),
        GATE3_MIGRATIONS.map((m) => m.id),
      );
      assert.equal(result.schema.integrityCheck, 'ok');
      assert.equal(result.schema.foreignKeyViolations, 0);
      assert.equal(result.schema.writeGuardEnforced, true);

      // Initial provisioning records
      assert.equal(result.provisioning.principalLabel, 'ramki-personal-local');
      assert.equal(result.provisioning.tenantId, 'ipd-personal-local');
      assert.equal(result.provisioning.canonicalOwnerId, 'ipd-owner-ramki-personal');
      assert.equal(result.provisioning.bindingId, identity.bindingId);
      assert.equal(result.provisioning.membershipId, identity.membershipId);
      assert.equal(result.provisioning.auditEventCount, 1);
      assert.equal(result.provisioning.auditChainValid, true);
      assert.equal(result.provisioning.initialAuditEventId, 1);
      assert.deepEqual(result.provisioning.portfolioCounts, {
        portfolios: 0,
        portfolioRevisions: 0,
        portfolioHoldings: 0,
        portfolioContributions: 0,
      });

      // Cross-check with existing Gate A' V-A2 validator (`validateStoreAtPath`)
      const preV2Hash = sha256OfFile(storePath);
      const va2Report = validateStoreAtPath(storePath);
      assert.equal(va2Report.status, 'PASS');
      assert.equal(va2Report.checks.every((c) => c.ok), true);
      assert.equal(sha256OfFile(storePath), preV2Hash);
    }));

  it('enforces SQLite partial-unique single-ACTIVE indexes, CHECK constraints, and FOREIGN KEY constraints', () =>
    withTempWorkspace((dir) => {
      const storePath = join(dir, 'constraints.sqlite');
      const identity = resolveDesignatedIdentityTriple();
      provisionUserPortfolioDatabase({ storePath, now: () => FIXED_ISO });

      const db = openDatabase(storePath);
      try {
        // Second ACTIVE binding must fail partial unique index idx_local_principal_bindings_single_active
        assert.throws(() => {
          db.prepare(
            `INSERT INTO local_principal_bindings
              (binding_id, principal_label, status, created_at, updated_at, revoked_at)
             VALUES ('second-binding-id', 'other-label', 'ACTIVE', ?, ?, NULL)`,
          ).run(FIXED_ISO, FIXED_ISO);
        }, /UNIQUE constraint failed/);

        // Second ACTIVE membership must fail partial unique index idx_local_principal_memberships_single_active
        assert.throws(() => {
          db.prepare(
            `INSERT INTO local_principal_memberships
              (membership_id, binding_id, tenant_id, canonical_owner_id, status, created_at, updated_at, revoked_at)
             VALUES ('second-membership-id', ?, 'other-tenant', 'other-owner', 'ACTIVE', ?, ?, NULL)`,
          ).run(identity.bindingId, FIXED_ISO, FIXED_ISO);
        }, /UNIQUE constraint failed/);

        // Invalid status CHECK constraint on portfolios
        assert.throws(() => {
          db.prepare(
            `INSERT INTO portfolios
              (portfolio_id, canonical_owner_id, tenant_id, portfolio_name, current_revision, status, created_at, updated_at)
             VALUES ('p1', ?, ?, 'Test', 0, 'BOGUS_STATUS', ?, ?)`,
          ).run(identity.canonicalOwnerId, identity.tenantId, FIXED_ISO, FIXED_ISO);
        }, /CHECK constraint failed/);

        // Foreign key enforcement on orphan portfolio_revisions row
        assert.throws(() => {
          db.prepare(
            `INSERT INTO portfolio_revisions
              (portfolio_id, canonical_owner_id, revision, operation, total_market_value, weight_sum_percentage, holdings_count, provenance_digest, created_at)
             VALUES ('missing-portfolio', ?, 1, 'INITIAL', 0, 0, 0, 'dig', ?)`,
          ).run(identity.canonicalOwnerId, FIXED_ISO);
        }, /FOREIGN KEY constraint failed/);
      } finally {
        closeDatabase();
      }
    }));

  it('boots full G3 startIpcServer against the provisioned database and serves IRR wire v1 portfolio.list', () =>
    withTempWorkspace(async (dir) => {
      const storePath = join(dir, 'ipc-ready.sqlite');
      provisionUserPortfolioDatabase({ storePath, now: () => FIXED_ISO });

      // Verify resolveActiveBinding directly
      const checkDb = openDatabase(storePath);
      const resolved = resolveActiveBinding(checkDb);
      assert.equal(resolved.canonicalOwnerId, 'ipd-owner-ramki-personal');
      assert.equal(resolved.tenantId, 'ipd-personal-local');
      closeDatabase();

      // Boot full production G3 IPC server entrypoint over the provisioned database
      const outcome = await startIpcServer({
        env: {
          IIPS_G2_IPC_ENDPOINT: 'iips-direct-p1-test',
          IIPS_G3_LOCAL_STATE_DIR: join(dir, 'ipc-state'),
          IIPS_G3_DATABASE_PATH: storePath,
        },
      });
      assert.equal(outcome.ok, true, `startIpcServer failed: ${outcome.error}`);
      assert.ok(outcome.target);

      try {
        const responseEnvelope = await new Promise<Record<string, unknown>>(
          (resolvePromise, rejectPromise) => {
            const client = connect({ path: outcome.target!.path, allowHalfOpen: true });
            let buf = Buffer.alloc(0);
            client.on('error', rejectPromise);
            client.on('connect', () => {
              const frame = encodeWireV1Frame({
                v: IPC_PROTOCOL_VERSION,
                op: 'portfolio.list',
                payload: {},
                requestId: 'req-direct-p1-1',
              });
              if (process.platform === 'win32') {
                client.write(frame);
              } else {
                client.end(frame);
              }
            });
            client.on('data', (chunk) => {
              buf = Buffer.concat([buf, chunk]);
              if (buf.length >= 4) {
                const frameLen = buf.readUInt32BE(0);
                if (buf.length >= 4 + frameLen) {
                  const body = buf.subarray(4, 4 + frameLen).toString('utf8');
                  const parsed = JSON.parse(body) as Record<string, unknown>;
                  client.destroy();
                  resolvePromise(parsed);
                }
              }
            });
          },
        );

        assert.equal(responseEnvelope.v, IPC_PROTOCOL_VERSION);
        assert.equal(responseEnvelope.op, 'portfolio.list');
        assert.equal(responseEnvelope.requestId, 'req-direct-p1-1');
        assert.equal(responseEnvelope.ok, true);
        assert.deepEqual(responseEnvelope.result, []);
      } finally {
        await outcome.handle?.stop();
        closeDatabase();
      }
    }));
});

describe('Direct P1 Provisioning — Atomic Transaction Rollback', () => {
  it('rolls back mid-transaction failure after binding insert, removes incomplete new DB file, and allows clean retry', () =>
    withTempWorkspace((dir) => {
      const storePath = join(dir, 'atomic-rollback.sqlite');

      assert.throws(
        () =>
          provisionUserPortfolioDatabase({
            storePath,
            now: () => FIXED_ISO,
            testHooks: {
              afterBindingInserted: () => {
                throw new Error('simulated mid-transaction fault after binding insert');
              },
            },
          }),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'PROVISIONING_TRANSACTION_FAILED',
      );

      // Fresh incomplete store was cleaned up so no half-initialized file lingers
      assert.equal(existsSync(storePath), false);

      // Subsequent direct provisioning succeeds cleanly
      const retryResult = provisionUserPortfolioDatabase({
        storePath,
        now: () => FIXED_ISO,
      });
      assert.equal(retryResult.ok, true);
      assert.equal(retryResult.status, 'PROVISIONED');
    }));

  it('rolls back mid-transaction failure after membership insert before audit commit', () =>
    withTempWorkspace((dir) => {
      const storePath = join(dir, 'atomic-rollback-2.sqlite');

      assert.throws(
        () =>
          provisionUserPortfolioDatabase({
            storePath,
            now: () => FIXED_ISO,
            testHooks: {
              afterMembershipInserted: (db) => {
                assert.equal(db.isTransaction, true);
                throw new Error('simulated mid-transaction fault before audit event');
              },
            },
          }),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'PROVISIONING_TRANSACTION_FAILED',
      );

      assert.equal(existsSync(storePath), false);
    }));
});

describe('Direct P1 Provisioning — Safe Repeat Invocation & Existing-Database Protection', () => {
  it('supports safe repeat invocation with zero byte mutation on an empty provisioned database', () =>
    withTempWorkspace((dir) => {
      const storePath = join(dir, 'repeat.sqlite');
      const first = provisionUserPortfolioDatabase({
        storePath,
        now: () => FIXED_ISO,
      });
      assert.equal(first.status, 'PROVISIONED');
      assert.equal(first.mutated, true);
      const initialHash = sha256OfFile(storePath);

      const second = provisionUserPortfolioDatabase({
        storePath,
        now: () => '2026-11-02T12:00:00.000Z',
      });
      assert.equal(second.ok, true);
      assert.equal(second.status, 'ALREADY_PROVISIONED');
      assert.equal(second.storeExistedBefore, true);
      assert.equal(second.mutated, false);
      assert.equal(second.fileSha256, initialHash);
      assert.equal(sha256OfFile(storePath), initialHash);
    }));

  it('preserves populated user portfolio rows, revisions, holdings, contributions, and audit events byte-for-byte on repeat invocation', () =>
    withTempWorkspace((dir) => {
      const storePath = join(dir, 'populated-user-data.sqlite');
      const identity = resolveDesignatedIdentityTriple();
      provisionUserPortfolioDatabase({ storePath, now: () => FIXED_ISO });

      // Populate real user portfolio data in the provisioned database
      const db = openDatabase(storePath);
      try {
        db.exec('BEGIN IMMEDIATE;');
        db.prepare(
          `INSERT INTO portfolios
            (portfolio_id, canonical_owner_id, tenant_id, portfolio_name, current_revision, status, created_at, updated_at, deleted_at)
           VALUES ('pf-001', ?, ?, 'Core India Equity', 1, 'ACTIVE', ?, ?, NULL)`,
        ).run(identity.canonicalOwnerId, identity.tenantId, FIXED_ISO, FIXED_ISO);

        db.prepare(
          `INSERT INTO portfolio_revisions
            (portfolio_id, canonical_owner_id, revision, operation, total_market_value, weight_sum_percentage, holdings_count, provenance_digest, content_digest, created_at)
           VALUES ('pf-001', ?, 1, 'INITIAL', 250000, 100, 1, 'prov-1', 'cont-1', ?)`,
        ).run(identity.canonicalOwnerId, FIXED_ISO);

        db.prepare(
          `INSERT INTO portfolio_holdings
            (canonical_owner_id, portfolio_id, revision, holding_key, symbol, company_id, quantity, average_buy_price, current_price, market_value, weight_percentage, active, source_broker, lineage_digest, identity_status, resolution_disposition, created_at)
           VALUES (?, 'pf-001', 1, 'hk-1', 'INFY', 'INE009A01021', 100, 1500, 2500, 250000, 100, 1, 'ZERODHA', 'lin-1', 'CANONICAL_RESOLVED', 'RESOLVED', ?)`,
        ).run(identity.canonicalOwnerId, FIXED_ISO);

        db.prepare(
          `INSERT INTO portfolio_contributions
            (canonical_owner_id, portfolio_id, contribution_id, amount, contributed_at, created_at, file_name, source_broker, content_digest, lineage_digest, imported_at, contribution_semantics)
           VALUES (?, 'pf-001', 'c-1', 150000, ?, ?, 'holdings.csv', 'ZERODHA', 'cont-1', 'lin-1', ?, 'SAVED_NEW_BATCH')`,
        ).run(identity.canonicalOwnerId, FIXED_ISO, FIXED_ISO, FIXED_ISO);

        appendAuditEvent(db, {
          eventType: 'broker_import.persisted',
          subjectType: 'portfolio',
          subjectId: 'pf-001',
          detail: { revision: 1 },
        });
        db.exec('COMMIT;');
      } finally {
        closeDatabase();
      }

      const populatedHash = sha256OfFile(storePath);

      // Repeat invocation must NOT overwrite or touch user data!
      const repeat = provisionUserPortfolioDatabase({ storePath });
      assert.equal(repeat.ok, true);
      assert.equal(repeat.status, 'ALREADY_PROVISIONED');
      assert.equal(repeat.mutated, false);
      assert.equal(repeat.fileSha256, populatedHash);
      assert.equal(sha256OfFile(storePath), populatedHash);
      assert.deepEqual(repeat.provisioning.portfolioCounts, {
        portfolios: 1,
        portfolioRevisions: 1,
        portfolioHoldings: 1,
        portfolioContributions: 1,
      });
      assert.equal(repeat.provisioning.auditEventCount, 2);
    }));

  it('protects arbitrary non-SQLite files, 0-byte files, foreign SQLite databases, partially migrated DBs, and tampered DBs without modifying a single byte', () =>
    withTempWorkspace((dir) => {
      // Case 1: Arbitrary plain-text user file
      const textFile = join(dir, 'notes.sqlite');
      writeFileSync(textFile, 'Important user notes — never overwrite!\n', 'utf8');
      const textHash = sha256OfFile(textFile);
      assert.throws(
        () => provisionUserPortfolioDatabase({ storePath: textFile }),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'EXISTING_DATABASE_PROTECTED',
      );
      assert.equal(sha256OfFile(textFile), textHash);

      // Case 2: 0-byte empty file
      const zeroFile = join(dir, 'empty.sqlite');
      writeFileSync(zeroFile, Buffer.alloc(0));
      const zeroHash = sha256OfFile(zeroFile);
      assert.throws(
        () => provisionUserPortfolioDatabase({ storePath: zeroFile }),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'EXISTING_DATABASE_PROTECTED',
      );
      assert.equal(sha256OfFile(zeroFile), zeroHash);

      // Case 3: Foreign SQLite database with unrelated user table
      const foreignDbPath = join(dir, 'foreign.sqlite');
      {
        const fdb = new DatabaseSync(foreignDbPath);
        fdb.exec('CREATE TABLE personal_notes (id INTEGER PRIMARY KEY, body TEXT);');
        fdb.exec("INSERT INTO personal_notes (body) VALUES ('keep safe');");
        fdb.close();
      }
      const foreignHash = sha256OfFile(foreignDbPath);
      assert.throws(
        () => provisionUserPortfolioDatabase({ storePath: foreignDbPath }),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'EXISTING_DATABASE_PROTECTED',
      );
      assert.equal(sha256OfFile(foreignDbPath), foreignHash);

      // Case 4: Partially migrated IPD database (only migrations 001..002)
      const partialDbPath = join(dir, 'partial.sqlite');
      {
        const pdb = new DatabaseSync(partialDbPath);
        ensureMigrations(pdb, GATE3_MIGRATIONS.slice(0, 2));
        pdb.close();
      }
      const partialHash = sha256OfFile(partialDbPath);
      assert.throws(
        () => provisionUserPortfolioDatabase({ storePath: partialDbPath }),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'EXISTING_DATABASE_PROTECTED',
      );
      assert.equal(sha256OfFile(partialDbPath), partialHash);

      // Case 5: Provisioned database whose audit_events row is subsequently tampered
      const tamperedDbPath = join(dir, 'tampered.sqlite');
      provisionUserPortfolioDatabase({ storePath: tamperedDbPath, now: () => FIXED_ISO });
      {
        const tdb = new DatabaseSync(tamperedDbPath);
        tdb.exec(
          `UPDATE audit_events SET entry_checksum = '0000000000000000000000000000000000000000000000000000000000000000' WHERE id = 1`,
        );
        tdb.close();
      }
      const tamperedHash = sha256OfFile(tamperedDbPath);
      const verifyTampered = verifyUserPortfolioDatabase(tamperedDbPath);
      assert.equal(verifyTampered.ok, false);
      assert.throws(
        () => provisionUserPortfolioDatabase({ storePath: tamperedDbPath }),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'EXISTING_DATABASE_PROTECTED',
      );
      assert.equal(sha256OfFile(tamperedDbPath), tamperedHash);

      // Case 6: Validly provisioned database when --require-fresh is passed
      const validDbPath = join(dir, 'valid-fresh-guard.sqlite');
      provisionUserPortfolioDatabase({ storePath: validDbPath, now: () => FIXED_ISO });
      const validHash = sha256OfFile(validDbPath);
      assert.throws(
        () =>
          provisionUserPortfolioDatabase({
            storePath: validDbPath,
            requireFresh: true,
          }),
        (err: unknown) =>
          err instanceof DirectProvisioningError &&
          err.code === 'EXISTING_DATABASE_PROTECTED',
      );
      assert.equal(sha256OfFile(validDbPath), validHash);
    }));
});

describe('Direct P1 Provisioning — Standalone CLI & Zero P1-F Coupling', () => {
  it('parses CLI flags cleanly and defaults to C:\\iips-data\\iips\\user-portfolio.sqlite on win32', () => {
    const winDefault = parseDirectProvisioningArgs([], { platform: 'win32' });
    assert.equal(winDefault.mode, 'provision');
    assert.equal(winDefault.storePath, 'C:\\iips-data\\iips\\user-portfolio.sqlite');
    assert.equal(winDefault.requireFresh, false);

    assert.throws(
      () => parseDirectProvisioningArgs(['--act-id=legacy-ceremony'], { platform: 'win32' }),
      (err: unknown) =>
        err instanceof DirectProvisioningError && err.code === 'ARGUMENT_INVALID',
    );
  });

  it('executes compiled CLI subprocess across provision, repeat provision, verify, and existing-file protection', () =>
    withTempWorkspace((dir) => {
      const dbPath = join(dir, 'cli-store.sqlite');

      // 1. Fresh CLI provision
      const run1 = spawnSync(
        process.execPath,
        [COMPILED_DIRECT_CLI_PATH, '--mode=provision', `--store=${dbPath}`],
        { encoding: 'utf8' },
      );
      assert.equal(run1.status, 0, `CLI stderr: ${run1.stderr}`);
      const json1 = JSON.parse(run1.stdout.trim()) as Record<string, unknown>;
      assert.equal(json1.ok, true);
      assert.equal(json1.status, 'PROVISIONED');
      assert.equal(json1.mutated, true);
      const createdHash = sha256OfFile(dbPath);

      // 2. Repeat CLI provision (idempotent, zero mutation)
      const run2 = spawnSync(
        process.execPath,
        [COMPILED_DIRECT_CLI_PATH, '--mode=provision', `--store=${dbPath}`],
        { encoding: 'utf8' },
      );
      assert.equal(run2.status, 0, `CLI stderr: ${run2.stderr}`);
      const json2 = JSON.parse(run2.stdout.trim()) as Record<string, unknown>;
      assert.equal(json2.ok, true);
      assert.equal(json2.status, 'ALREADY_PROVISIONED');
      assert.equal(json2.mutated, false);
      assert.equal(sha256OfFile(dbPath), createdHash);

      // 3. Independent CLI verify
      const run3 = spawnSync(
        process.execPath,
        [COMPILED_DIRECT_CLI_PATH, '--mode=verify', `--store=${dbPath}`],
        { encoding: 'utf8' },
      );
      assert.equal(run3.status, 0, `CLI stderr: ${run3.stderr}`);
      const json3 = JSON.parse(run3.stdout.trim()) as Record<string, unknown>;
      assert.equal(json3.ok, true);
      assert.equal(json3.status, 'VERIFIED');
      assert.equal(sha256OfFile(dbPath), createdHash);

      // 4. Existing non-SQLite file protection via CLI
      const foreignFile = join(dir, 'foreign-cli.sqlite');
      writeFileSync(foreignFile, 'do not touch', 'utf8');
      const foreignHash = sha256OfFile(foreignFile);
      const run4 = spawnSync(
        process.execPath,
        [COMPILED_DIRECT_CLI_PATH, '--mode=provision', `--store=${foreignFile}`],
        { encoding: 'utf8' },
      );
      assert.equal(run4.status, 1);
      const json4 = JSON.parse(run4.stdout.trim()) as Record<string, unknown>;
      assert.equal(json4.ok, false);
      assert.equal(json4.errorCode, 'EXISTING_DATABASE_PROTECTED');
      assert.equal(json4.mutated, false);
      assert.equal(sha256OfFile(foreignFile), foreignHash);
    }));

  it('has zero coupling to discontinued P1-F orchestration, tokens, claims, S2 pins, or historical provisioning entrypoints', () => {
    const tsSource = readFileSync(SOURCE_DIRECT_MODULE_PATH, 'utf8');
    const psSource = readFileSync(POWERSHELL_SCRIPT_PATH, 'utf8');

    // Never imports historical Gate 3 provisioning.ts or ceremonial gateAPrimeProvisioning.ts
    assert.doesNotMatch(tsSource, /from\s+['"]\.\/provisioning\.js['"]/);
    assert.doesNotMatch(tsSource, /from\s+['"]\.\/gateAPrimeProvisioning\.js['"]/);

    // Zero P1-F ceremonial identifiers in runtime code or PowerShell script
    const discontinuedArtifacts = [
      'execute-claim.json',
      'confirmation-token',
      'H:\\IIPS-P1-EVIDENCE',
      'a891802e2691bd9c65a67d6abff20d8ce0c26d7d',
      '76f083d7058e170d8212455c03bad1033136ee68',
      'Invoke-Cap03P1Execute',
      'Invoke-Cap03P1Preflight',
    ];
    for (const token of discontinuedArtifacts) {
      assert.equal(
        tsSource.includes(token),
        false,
        `directP1Provisioning.ts must not reference "${token}"`,
      );
      assert.equal(
        psSource.includes(token),
        false,
        `Invoke-DirectP1Provisioning.ps1 must not reference "${token}"`,
      );
    }

    const missingStoreRes = runDirectProvisioningCli([
      '--mode=verify',
      '--store=/tmp/does-not-exist-direct-p1.sqlite',
    ]);
    assert.equal(missingStoreRes.exitCode, 1);
    assert.equal(missingStoreRes.payload.ok, false);
  });

  it('does not leak directP1Provisioning into public npm package subpaths', async () => {
    const pitMod = (await import(
      pathToFileURL(join(REPO_ROOT, 'dist', 'package', 'src', 'pit', 'package.js')).href
    )) as Record<string, unknown>;
    const uiMod = (await import(
      pathToFileURL(
        join(REPO_ROOT, 'dist', 'package', 'src', 'ui', 'portfolio_ui_package.js'),
      ).href
    )) as Record<string, unknown>;
    assert.equal('provisionUserPortfolioDatabase' in pitMod, false);
    assert.equal('provisionUserPortfolioDatabase' in uiMod, false);
  });
});

describe('Direct P1 Provisioning — Windows PowerShell 5.1 Script Syntax & Constraint Validation', () => {
  it('validates pure ASCII encoding, balanced PowerShell 5.1 lexical tokens, and outer try/catch structure', () => {
    assert.equal(existsSync(POWERSHELL_SCRIPT_PATH), true);
    const psText = readFileSync(POWERSHELL_SCRIPT_PATH, 'utf8');

    for (let i = 0; i < psText.length; i += 1) {
      assert.ok(
        psText.charCodeAt(i) <= 127,
        `Non-ASCII character at index ${i} in Invoke-DirectP1Provisioning.ps1`,
      );
    }

    assert.match(psText, /^#Requires -Version 5\.1\r?\n/);

    const analysis = analyzePowerShell51Script(psText);
    assert.deepEqual(analysis.unclosedConstructs, []);

    const tryPositions = analysis.topLevelStatements
      .map((w, idx) => ({ w: w.toLowerCase(), idx }))
      .filter((x) => x.w === 'try' || x.w === 'catch');
    assert.deepEqual(
      tryPositions.map((x) => x.w),
      ['try', 'catch'],
      `Expected single top-level outer try/catch, found: ${JSON.stringify(analysis.topLevelStatements)}`,
    );
  });

  it('contains zero occurrences of forbidden keywords else, elseif, finally, exit, or break', () => {
    const psText = readFileSync(POWERSHELL_SCRIPT_PATH, 'utf8');
    const analysis = analyzePowerShell51Script(psText);

    const forbiddenSet = new Set(['else', 'elseif', 'finally', 'exit', 'break']);
    const offendingTokens = analysis.tokens.filter(
      (t) => t.kind === 'word' && forbiddenSet.has(t.value.toLowerCase()),
    );
    assert.deepEqual(
      offendingTokens,
      [],
      `Forbidden PowerShell keywords found: ${JSON.stringify(offendingTokens)}`,
    );

    const rawMatches = psText.match(/\b(else|elseif|finally|exit|break)\b/gi);
    assert.equal(rawMatches, null, `Unexpected raw word match: ${JSON.stringify(rawMatches)}`);
  });

  it('declares required CmdletBinding parameters, enforces ExpectedCommit SHA-1 pattern, avoids elevation/cloning, and protects existing DB', () => {
    const psText = readFileSync(POWERSHELL_SCRIPT_PATH, 'utf8');

    assert.match(psText, /\[CmdletBinding\(\)\]\s*param\s*\(/);
    assert.match(
      psText,
      /\[Parameter\(Mandatory\s*=\s*\$true\)\]\s*\[ValidatePattern\('\^\[0-9a-f\]\{40\}\$'\)\]\s*\[string\]\s*\$ExpectedCommit/,
    );
    assert.match(
      psText,
      /\[string\]\s*\$RepositoryRoot\s*=\s*\(Split-Path -Parent \$PSScriptRoot\)/,
    );
    assert.match(
      psText,
      /\[string\]\s*\$DatabasePath\s*=\s*'C:\\iips-data\\iips\\user-portfolio\.sqlite'/,
    );
    assert.match(psText, /\[string\]\s*\$NodeExecutable\s*=\s*''/);
    assert.match(psText, /\[switch\]\s*\$RequireFreshDatabase/);

    assert.match(psText, /Set-StrictMode -Version Latest/);
    assert.match(psText, /\$ErrorActionPreference = 'Stop'/);

    assert.doesNotMatch(psText, /#Requires\s+-RunAsAdministrator/i);
    assert.doesNotMatch(psText, /-Verb\s+RunAs/i);
    assert.doesNotMatch(psText, /\bgit(?:\.exe)?\s+clone\b/i);

    assert.match(psText, /DIRECT_P1_PROVISIONING_STATE=SUCCESS/);
    assert.match(psText, /DIRECT_P1_PROVISIONING_STATE=FAILURE/);
    assert.match(psText, /--mode=verify/);
    assert.match(psText, /--mode=provision/);
    assert.match(psText, /EXISTING_DATABASE_PROTECTED/);
  });
});
