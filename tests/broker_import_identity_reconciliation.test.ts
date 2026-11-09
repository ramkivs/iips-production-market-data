/**
 * Broker Import — identity-resolution reconciliation guard.
 *
 * Pins the three distinct identity outcomes so they cannot be conflated, and so a
 * future edit cannot silently "improve" a measurement or drop a governance
 * disposition. The three results are three different measurements:
 *
 *   #1  Wave-1 master (2,250),  DHAN_WEB_UI_SUMMARY_V1 **name surface**  →  1 resolved / 67 unresolved
 *   #2  Authenticated master,   DHAN_WEB_UI_SUMMARY_V1 **name surface**  →  3 resolved / 65 unresolved
 *   #3  Authenticated master,   **exact-ISIN vector** (B-04 companion)   → 65 resolved /  3 unresolved
 *
 * #3 is NOT a re-run of #2. #2's input carries no ISIN and no exchange; #3 supplies
 * ISINs from a separate committed artifact joined 1:1 by exact normalized display
 * name. Conflating them would misstate both the broker surface's capability and the
 * scope of the PA-authorized reassessment.
 *
 * Read-only: this suite asserts committed evidence and does no network, no provider
 * access, no identity resolution and no persistence.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const DIR = 'evidence/integration/ws-a-dhan-68-row';
const f = (name: string): string => resolve(process.cwd(), DIR, name);
const readJson = (name: string): Record<string, unknown> =>
  JSON.parse(readFileSync(f(name), 'utf8')) as Record<string, unknown>;
const sha256 = (name: string): string =>
  createHash('sha256').update(readFileSync(f(name))).digest('hex');

interface RunRow {
  rowIndex: number;
  suppliedIdentifier: string;
  suppliedIsin: string | null;
  suppliedExchange: string | null;
  identifierClass: string;
  identityStatus?: string;
  status?: string;
  refusalCode: string | null;
  companyId?: string | null;
}
interface Run {
  label: string;
  identitySummary: {
    evaluated: number;
    resolved: number;
    unresolved: number;
    saveable: boolean;
    masterRevision?: string;
    refusalCodes: Record<string, number>;
  };
  rows: RunRow[];
}

const runsOf = (file: string): Run[] => readJson(file).runs as unknown as Run[];
const runNamed = (file: string, label: string): Run => {
  const run = runsOf(file).find((r) => r.label === label);
  assert.ok(run, `run '${label}' must exist in ${file}`);
  return run;
};
const statusOf = (row: RunRow): string => (row.identityStatus ?? row.status)!;

const WAVE1_MASTER = 'BATCH-D05-TIER2-BROAD-UNIVERSE-2026-09-22-001';
const AUTH_MASTER = 'BATCH-D05-REPLACEMENT-AUTHENTICATED-UNIVERSE-2026-11-08-001';

describe('Broker Import identity reconciliation — three distinct measurements', () => {
  it('pins the evidence artifacts the reconciliation depends on (byte-level)', () => {
    // `rows.json` and the B-04 companion export are the two inputs; the reassessment
    // artifact is the §9-A execution record cited by the PA disposition.
    assert.equal(sha256('rows.json'), 'bfd0496e080fdd2c01f1033cf9adf2e33a218c589b9154bb5ae9ff5532a8c4d0');
    assert.equal(
      sha256('identity-outcomes-reassessment-2026-11-08.json'),
      'e99989b9962a686d33df42b43746f9127929ebced9c0a99690a64e6270ae5c2e',
      'the PA-accepted §9-A reassessment artifact must not change',
    );
    const source = readFileSync(resolve(process.cwd(), 'evidence/operator_drop/wave2-2026-11-06/source.csv'));
    assert.equal(createHash('sha256').update(source).digest('hex'), '2dc1d1fba6e183cfa657652d0dab98daac570df6e3ef3adbbc8f2a397fcabd0d');
  });

  it('#1 Wave-1 name surface = 1 resolved / 67 unresolved, name-only input', () => {
    const run = runNamed('identity-outcomes.json', 'GOVERNED_D05_SECURITY_MASTER');
    assert.equal(run.identitySummary.evaluated, 68);
    assert.equal(run.identitySummary.resolved, 1);
    assert.equal(run.identitySummary.unresolved, 67);
    assert.ok(run.identitySummary.masterRevision?.startsWith(WAVE1_MASTER));
    assert.deepEqual(run.identitySummary.refusalCodes, { NO_AUTHORITATIVE_IDENTIFIER_MATCH: 67 });
    assert.equal(run.identitySummary.saveable, false);
    // Resolved set is exactly the single governed alias.
    const resolved = run.rows.filter((r) => statusOf(r) === 'RESOLVED');
    assert.deepEqual(resolved.map((r) => r.companyId), ['EQ_AGI_IN']);
  });

  it('#2 authenticated name surface = 3 resolved / 65 unresolved, SAME name-only input', () => {
    const run = runNamed('identity-outcomes-authenticated-2026-11-08.json', 'GOVERNED_AUTHENTICATED_MASTER_2026-11-08');
    assert.equal(run.identitySummary.evaluated, 68);
    assert.equal(run.identitySummary.resolved, 3);
    assert.equal(run.identitySummary.unresolved, 65);
    assert.ok(run.identitySummary.masterRevision?.startsWith(AUTH_MASTER));
    assert.deepEqual(run.identitySummary.refusalCodes, { NO_AUTHORITATIVE_IDENTIFIER_MATCH: 65 });
    assert.equal(run.identitySummary.saveable, false);
    const resolved = run.rows.filter((r) => statusOf(r) === 'RESOLVED');
    assert.deepEqual(resolved.map((r) => r.rowIndex), [1, 21, 40]);
    assert.deepEqual(resolved.map((r) => r.companyId), ['EQ_AGI_IN', 'EQ_GHCL_IN', 'EQ_KROSS_IN']);
  });

  it('#3 exact-ISIN reassessment = 65 resolved / 3 unresolved, DIFFERENT input and method', () => {
    const run = runNamed('identity-outcomes-reassessment-2026-11-08.json', 'GOVERNED_AUTHENTICATED_MASTER_2026-11-08');
    assert.equal(run.identitySummary.evaluated, 68);
    assert.equal(run.identitySummary.resolved, 65);
    assert.equal(run.identitySummary.unresolved, 3);
    assert.ok(run.identitySummary.masterRevision?.startsWith(AUTH_MASTER));
    assert.deepEqual(run.identitySummary.refusalCodes, { UNMAPPED_IDENTIFIER: 3 });
    assert.equal(run.identitySummary.saveable, false);
  });

  it('the summary surface (#1/#2) carries no ISIN and no exchange — it cannot produce #3', () => {
    for (const [file, label] of [
      ['identity-outcomes.json', 'GOVERNED_D05_SECURITY_MASTER'],
      ['identity-outcomes-authenticated-2026-11-08.json', 'GOVERNED_AUTHENTICATED_MASTER_2026-11-08'],
    ] as const) {
      const run = runNamed(file, label);
      assert.equal(run.rows.length, 68);
      for (const row of run.rows) {
        assert.equal(row.suppliedIsin, null, `${label} row ${row.rowIndex} must carry no ISIN`);
        assert.equal(row.suppliedExchange, null, `${label} row ${row.rowIndex} must carry no exchange`);
      }
    }
  });

  it('#3 is exclusively an ISIN-input measurement — no unscoped-name trial is relied on', () => {
    const run = runNamed('identity-outcomes-reassessment-2026-11-08.json', 'GOVERNED_AUTHENTICATED_MASTER_2026-11-08');
    assert.equal(run.rows.length, 68);
    for (const row of run.rows) {
      assert.equal(row.identifierClass, 'ISIN', `row ${row.rowIndex} must be assessed as ISIN`);
      assert.match(row.suppliedIsin ?? '', /^[A-Z0-9]{12}$/, `row ${row.rowIndex} must carry a 12-char ISIN`);
    }
  });

  it('the three unresolved ISIN cases retain their governance disposition, unchanged', () => {
    const artifact = readJson('identity-outcomes-reassessment-2026-11-08.json');
    const run = runNamed('identity-outcomes-reassessment-2026-11-08.json', 'GOVERNED_AUTHENTICATED_MASTER_2026-11-08');
    const unresolved = run.rows.filter((r) => statusOf(r) !== 'RESOLVED');
    assert.deepEqual(unresolved.map((r) => r.rowIndex), [44, 51, 63]);
    assert.deepEqual(unresolved.map((r) => r.suppliedIsin), ['INE721I01024', 'INE583V01021', 'INE562X01013']);
    for (const row of unresolved) {
      assert.equal(row.refusalCode, 'UNMAPPED_IDENTIFIER');
      assert.equal(row.companyId, null, 'a fail-closed row never carries an invented companyId');
    }

    // Declared out-of-scope set, with no alias and no exception created.
    const outOfScope = artifact.outOfScope as Record<string, unknown>;
    assert.deepEqual(outOfScope.rows, [44, 51, 63]);
    assert.equal(outOfScope.aliases, 'none');
    assert.equal(outOfScope.exceptions, 'none');
    assert.match(String(outOfScope.disposition), /EXCLUDED_FROM_UNIVERSE/);
    assert.match(String(outOfScope.behavior), /fail-closed UNMAPPED_IDENTIFIER/);

    // Change control: nothing widened, nothing authorized.
    const changeControl = artifact.changeControl as Record<string, unknown>;
    assert.equal(changeControl.ruleChanges, 'none');
    assert.equal(changeControl.aliasesAdded, 'none');
    assert.equal(changeControl.universeAltered, false);
    assert.equal(changeControl.fuzzyMatching, false);
    assert.equal(changeControl.saveable, false);

    // Zero persistence: resolving identities authorized no write.
    assert.equal(artifact.zeroPersistence, true);
    assert.equal((artifact.downstream as Record<string, unknown>).persistedRows, 0);
    assert.equal((artifact.downstream as Record<string, unknown>).importDisposition, 'REJECTED');
    assert.equal((artifact.downstream as Record<string, unknown>).saveable, false);
  });

  it('the 62 in-scope reassessed rows match Appendix A exactly and the 3 prior ids are preserved', () => {
    const run = readJson('identity-outcomes-reassessment-2026-11-08.json').runs as unknown as Array<
      Run & {
        appendixAVerification: Array<{ rowIndex: number; expected?: string; prior?: string; now: string }>;
        priorResolutionPreservation: Array<{ rowIndex: number; prior: string; now: string; identical: boolean }>;
      }
    >;
    const r = run[0]!;
    const withExpected = r.appendixAVerification.filter((e) => e.expected !== undefined);
    assert.equal(withExpected.length, 65, 'every non-out-of-scope row is reconciled');
    const mismatches = withExpected.filter((e) => e.expected !== e.now);
    assert.deepEqual(mismatches, [], 'Appendix A reconciliation must be exact');

    assert.equal(r.priorResolutionPreservation.length, 3);
    assert.ok(r.priorResolutionPreservation.every((p) => p.identical));
    // The artifact records the preserved outcome as `RESOLVED <companyId>`; the
    // canonical identity is the trailing token and must match the prior resolution.
    assert.deepEqual(
      r.priorResolutionPreservation.map((p) => p.now.split(' ').pop()),
      ['EQ_AGI_IN', 'EQ_GHCL_IN', 'EQ_KROSS_IN'],
    );
    assert.deepEqual(r.priorResolutionPreservation.map((p) => p.rowIndex), [1, 21, 40]);
  });

  it('the B-04 companion export is the ISIN source, and it is a different artifact from the summary', () => {
    const sourceCsv = readFileSync(resolve(process.cwd(), 'evidence/operator_drop/wave2-2026-11-06/source.csv'), 'utf8');
    const lines = sourceCsv.trim().split(/\r?\n/);
    assert.equal(lines[0], 'Scrip Name,ISIN Code,Quantity,Avg. Buy Rate,Buy Value,LTP,Current Value,P&L,P&L%');
    assert.equal(lines.length - 1, 68, 'exactly 68 position rows');
    const missingIsin = lines.slice(1).filter((l) => !/^[^,]+,[A-Z0-9]{12},/.test(l));
    assert.deepEqual(missingIsin, [], 'every companion row carries a 12-char ISIN');

    // The summary surface, by contrast, has an 8-column header with no ISIN/exchange.
    const summary = readFileSync(f('dhan-web-ui-summary-68-reconstructed.csv'), 'utf8');
    const header = summary.split(/\r?\n/)[0];
    assert.equal(header, 'Name,Quantity,Avg Price,Last Traded,Investment,Current Value,P&L,P&L %');
    assert.ok(!header.includes('ISIN'));
    assert.ok(!/exchange/i.test(header));
  });
});
