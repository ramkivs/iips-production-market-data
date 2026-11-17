import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

import * as mig001 from '../src/persistence/migrations/001_initial_schema.ts';
import * as mig002 from '../src/persistence/migrations/002_audit_event_sequence.ts';
import * as mig003 from '../src/persistence/migrations/003_local_principal_bindings.ts';
import * as mig004 from '../src/persistence/migrations/004_portfolio_contribution_provenance.ts';
import * as mig005 from '../src/persistence/migrations/005_holding_security_identity.ts';
import * as mig006 from '../src/persistence/migrations/006_portfolio_restore.ts';

import {
  APPROVED_D02_TARGET,
  AUDIT_GENESIS_CHECKSUM,
  DESIGNATED_WINDOWS_DB_PATH,
  ESTABLISHED_S1_TUPLE,
  PINNED_REPOSITORY_MIGRATIONS,
  Q01_TO_Q14_CATALOG,
  SOURCE_REPORT_PATH,
  SOURCE_REPORT_SHA256,
} from '../scripts/d02-d5-d16-query-catalog.mjs';

const PS_OPERATOR_PATH = 'scripts/Invoke-D02D5D16ReadOnlyInventory.ps1';
const RUNNER_MJS_PATH = 'scripts/d02-d5-d16-readonly-inventory-runner.mjs';
const CATALOG_MJS_PATH = 'scripts/d02-d5-d16-query-catalog.mjs';
const OPERATOR_DOC_PATH =
  'docs/integration/IPD-D02-D5-D16-WINDOWS-HOST-OPERATOR-PACKAGE-2026-11-16.md';
const PUBLISHED_MANIFEST_PATH = 'evidence/d02-inventory-2026-11-16/sha256s.txt';

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function stripPowerShellCommentsAndStrings(raw: string): string {
  const out: string[] = [];
  let i = 0;
  const n = raw.length;
  while (i < n) {
    if (raw[i] === '<' && raw[i + 1] === '#') {
      const end = raw.indexOf('#>', i + 2);
      if (end === -1) return out.join('');
      for (let k = i; k < end + 2; k += 1) out.push(raw[k] === '\n' ? '\n' : ' ');
      i = end + 2;
      continue;
    }
    if (raw[i] === '#') {
      const nl = raw.indexOf('\n', i);
      if (nl === -1) return out.join('');
      out.push('\n');
      i = nl + 1;
      continue;
    }
    if (raw[i] === "'") {
      out.push(' ');
      i += 1;
      while (i < n) {
        if (raw[i] === "'" && raw[i + 1] === "'") {
          out.push('  ');
          i += 2;
          continue;
        }
        if (raw[i] === "'") {
          out.push(' ');
          i += 1;
          break;
        }
        out.push(raw[i] === '\n' ? '\n' : ' ');
        i += 1;
      }
      continue;
    }
    if (raw[i] === '"') {
      out.push(' ');
      i += 1;
      while (i < n) {
        if (raw[i] === '`') {
          out.push('  ');
          i += 2;
          continue;
        }
        if (raw[i] === '"') {
          out.push(' ');
          i += 1;
          break;
        }
        out.push(raw[i] === '\n' ? '\n' : ' ');
        i += 1;
      }
      continue;
    }
    out.push(raw[i]);
    i += 1;
  }
  return out.join('');
}

describe('IPD D02 D5/D16 Windows-host read-only operator package static conformance', () => {
  const reportText = readFileSync(SOURCE_REPORT_PATH, 'utf8');
  const runnerText = readFileSync(RUNNER_MJS_PATH, 'utf8');
  const psText = readFileSync(PS_OPERATOR_PATH, 'utf8');
  const docText = readFileSync(OPERATOR_DOC_PATH, 'utf8');
  const psProvisionSource = readFileSync('scripts/Invoke-DirectP1Provisioning.ps1', 'utf8');
  const bindingSource = readFileSync('src/persistence/binding.ts', 'utf8');

  it('matches every Q01-Q14 SQL statement in IPD-D02-D5-D16-READ-ONLY-INVENTORY-AND-BLOCKER-REPORT-2026-11-16.md verbatim', () => {
    assert.equal(sha256File(SOURCE_REPORT_PATH), SOURCE_REPORT_SHA256);

    const sqlBlocks = [...reportText.matchAll(/```sql\n([\s\S]*?)\n```/g)].map((m) => m[1]);
    assert.equal(sqlBlocks.length, 1, 'Expected unified Q01-Q14 SQL block in report §3.9.B');

    const reportStatements = sqlBlocks.flatMap((block) =>
      block
        .split(/;\s*(?:\n|$)/)
        .map((stmt) => stmt.replace(/^\s*--.*$/gm, '').trim())
        .filter(Boolean)
        .map((stmt) => `${stmt};`),
    );

    assert.equal(reportStatements.length, 21);
    assert.equal(Q01_TO_Q14_CATALOG.length, 21);
    assert.deepStrictEqual(
      Q01_TO_Q14_CATALOG.map((entry) => entry.sql),
      reportStatements,
    );

    const observedGroups = [...new Set(Q01_TO_Q14_CATALOG.map((entry) => entry.queryGroup))];
    assert.deepStrictEqual(observedGroups, [
      'Q01',
      'Q02',
      'Q03',
      'Q04',
      'Q05',
      'Q06',
      'Q07',
      'Q08',
      'Q09',
      'Q10',
      'Q11',
      'Q12',
      'Q13',
      'Q14',
    ]);
  });

  it('pins exact 001-006 migration SQL SHA-256 digests, S1 constants, D02 target, and genesis audit checksum', () => {
    const repoMigrations = [mig001, mig002, mig003, mig004, mig005, mig006].map(
      (ns) => Object.values(ns)[0] as { id: string; sql: string },
    );
    assert.equal(PINNED_REPOSITORY_MIGRATIONS.length, repoMigrations.length);
    repoMigrations.forEach((mig, idx) => {
      const actualSha = createHash('sha256').update(mig.sql, 'utf8').digest('hex');
      assert.equal(PINNED_REPOSITORY_MIGRATIONS[idx].migrationId, mig.id);
      assert.equal(PINNED_REPOSITORY_MIGRATIONS[idx].expectedChecksum, actualSha);
    });

    assert.equal(DESIGNATED_WINDOWS_DB_PATH, 'C:\\iips-data\\iips\\user-portfolio.sqlite');
    assert.equal(AUDIT_GENESIS_CHECKSUM, '0'.repeat(64));
    assert.ok(reportText.includes(ESTABLISHED_S1_TUPLE.bindingId));
    assert.ok(reportText.includes(ESTABLISHED_S1_TUPLE.membershipId));
    assert.ok(reportText.includes(ESTABLISHED_S1_TUPLE.principalLabel));
    assert.ok(reportText.includes(ESTABLISHED_S1_TUPLE.canonicalOwnerId));
    assert.ok(reportText.includes(ESTABLISHED_S1_TUPLE.tenantId));
    assert.ok(psProvisionSource.includes(ESTABLISHED_S1_TUPLE.canonicalOwnerId));
    assert.ok(bindingSource.includes(APPROVED_D02_TARGET.canonicalOwnerId));
    assert.ok(bindingSource.includes(APPROVED_D02_TARGET.tenantId));
    assert.equal(APPROVED_D02_TARGET.canonicalOwnerId, 'owner-4dc756b3');
    assert.equal(APPROVED_D02_TARGET.tenantId, 'ipd-personal-local');
  });

  it('enforces strict read-only, zero-startup, zero-mutation, and zero-inference invariants in the Node runner', () => {
    const runnerWithoutComments = runnerText
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const runnerExecutableTokens = runnerWithoutComments
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/`(?:\\.|[^`\\])*`/g, '``');

    // Must not import anything from src/ or dist/ or spawn child processes
    assert.doesNotMatch(runnerWithoutComments, /from\s+['"]\.\.?\/(?:src|dist)\//);
    assert.doesNotMatch(runnerWithoutComments, /node:child_process/);
    assert.doesNotMatch(
      runnerExecutableTokens,
      /\b(openDatabase|ensureMigrations|resolveActiveBinding|resolveActiveHoldingsBinding|startIpcServer)\s*\(/,
    );

    // Must enforce Windows host guard, Node >= 22.13.0, readOnly DatabaseSync, query_only, temp_store, BEGIN DEFERRED ... ROLLBACK
    assert.match(runnerText, /process\.platform\s*===\s*'win32'/);
    assert.match(runnerText, /new\s+DatabaseSync\(\s*dbPath\s*,\s*\{\s*open:\s*true\s*,\s*readOnly:\s*true\s*\}\s*\)/);
    assert.ok(runnerText.includes("db.exec('PRAGMA query_only = ON;');"));
    assert.ok(runnerText.includes("db.exec('PRAGMA temp_store = MEMORY;');"));
    assert.ok(runnerText.includes("db.exec('BEGIN DEFERRED;');"));
    assert.ok(runnerText.includes("db.exec('ROLLBACK;');"));

    // Must refuse -wal/-shm/-journal sidecars, verify 100-byte SQLite header, and verify pre/post SHA-256 equality
    assert.ok(runnerText.includes("'-wal'") && runnerText.includes("'-shm'") && runnerText.includes("'-journal'"));
    assert.ok(runnerText.includes("const SQLITE_HEADER_MAGIC = 'SQLite format 3\\0';"));
    assert.ok(runnerText.includes('POSTCONDITION_DB_SHA256_MISMATCH'));
    assert.ok(runnerText.includes('POSTCONDITION_SIDECAR_DETECTED'));

    // Must explicitly preserve gate separation and zero ownership inference
    assert.ok(runnerText.includes('ownershipInferredFromPortfolioNames: false'));
    assert.ok(runnerText.includes('d5Accepted: false'));
    assert.ok(runnerText.includes('d16DetailedSchemaApproved: false'));
    assert.ok(runnerText.includes('implementationAuthorized: false'));
    assert.ok(runnerText.includes('provisioningOrOwnerReassignmentExecuted: false'));
    assert.ok(runnerText.includes('d6IrrIntegrationStarted: false'));
  });

  it('enforces Windows PowerShell 5.1 structural rules and writer/sidecar/hash preflight-postflight guards', () => {
    assert.ok(!psText.includes('\r'), 'PowerShell script must use LF line endings without CRLF');
    assert.ok(!psText.includes('\t'), 'PowerShell script must not contain tab characters');
    assert.ok(psText.startsWith('#Requires -Version 5.1\n'));
    assert.ok(psText.includes('[CmdletBinding()]'));
    assert.ok(psText.includes('Set-StrictMode -Version Latest'));
    assert.ok(psText.includes("$ErrorActionPreference = 'Stop'"));
    assert.ok(psText.includes('[switch] $NoPause'));
    assert.ok(psText.includes('Write-IipsFinalStatus'));
    assert.ok(psText.includes("C:\\iips-data\\iips\\user-portfolio.sqlite"));
    assert.ok(psText.includes('[System.IO.FileShare]::Read'));
    assert.ok(psText.includes('--mode=capability-probe'));
    assert.ok(psText.includes('--mode=inventory'));
    assert.ok(psText.includes('sha256s.txt'));

    const strippedCode = stripPowerShellCommentsAndStrings(psText);
    for (const forbiddenKeyword of ['else', 'elseif', 'finally']) {
      assert.doesNotMatch(
        strippedCode,
        new RegExp(`(?<![\\w-])\\b${forbiddenKeyword}\\b(?![\\w-])`, 'i'),
        `Forbidden PowerShell keyword '${forbiddenKeyword}' present`,
      );
    }
    assert.doesNotMatch(
      strippedCode,
      /(?<![\w$-])\b(npm|npx|node)\b(?![\w.-])/,
      'Bare npm/npx/node token found in PowerShell script',
    );
  });

  it('pins current SHA-256 digests in operator documentation and preserves prior D02 manifest integrity', () => {
    const psSha = sha256File(PS_OPERATOR_PATH);
    const runnerSha = sha256File(RUNNER_MJS_PATH);
    const catalogSha = sha256File(CATALOG_MJS_PATH);

    assert.ok(docText.includes(psSha), `Operator doc missing PS script SHA-256 ${psSha}`);
    assert.ok(docText.includes(runnerSha), `Operator doc missing runner SHA-256 ${runnerSha}`);
    assert.ok(docText.includes(catalogSha), `Operator doc missing catalog SHA-256 ${catalogSha}`);
    assert.ok(docText.includes('NOT EXECUTED'));
    assert.ok(docText.includes('NOT YET COMPLETED'));

    const manifestLines = readFileSync(PUBLISHED_MANIFEST_PATH, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean);
    assert.equal(manifestLines.length, 5);
    for (const line of manifestLines) {
      const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
      assert.ok(match, `Invalid manifest line: ${line}`);
      const [, expectedSha, targetPath] = match;
      assert.ok(existsSync(targetPath), `Missing manifest target: ${targetPath}`);
      assert.equal(sha256File(targetPath), expectedSha, `Digest drift on ${targetPath}`);
    }
  });
});
