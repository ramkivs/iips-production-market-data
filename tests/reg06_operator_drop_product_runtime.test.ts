/**
 * REG-06 admission — Operator Drop product runtime, end to end (2026-11-01).
 *
 * Before admission the only caller of `OperatorDropParser` was the internal OQ
 * synthetic failover harness, which returns a report and persists nothing. This
 * test exercises the actual product runtime path:
 *
 *   drop package → checksum/canonicalization → series-qualified identity
 *     → durable PIT write → point-in-time screening read
 *
 * and verifies it across a simulated process restart, so the flow is proven
 * durable rather than merely in-memory.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildD114SecurityIdentity } from '../src/contracts/types.js';
import type { OperatorDropPayload } from '../src/operator_drop/parser.js';
import { resolveDropSecurityIdentity } from '../src/operator_drop/drop_ingestion.js';
import { OperatorDropProductRuntime } from '../src/operator_drop/product_runtime.js';

const ISIN = 'INE123456789';
const EQ = buildD114SecurityIdentity(ISIN, 'EQ')!;
const BL = buildD114SecurityIdentity(ISIN, 'BL')!;

const D1 = '2026-01-05T09:15:00.000Z';
const D2 = '2026-04-15T09:15:00.000Z';
const AS_OF_LATE = '2026-12-31T00:00:00.000Z';

let workDir: string;
let storePath: string;

function quote(companyId: string, ltp: number, identity?: { isin: string; series: string }): Record<string, unknown> {
  return {
    companyId,
    symbol: companyId,
    exchange: 'NSE',
    currency: 'INR',
    bid: ltp - 0.25,
    ask: ltp + 0.25,
    ltp,
    open: ltp - 5,
    high: ltp + 10,
    low: ltp - 10,
    close: ltp,
    previousClose: ltp - 12,
    volume: 1_000_000,
    change: 12,
    pctChange: 0.8,
    ...(identity ? { securityIdentity: buildD114SecurityIdentity(identity.isin, identity.series) } : {}),
  };
}

function pkg(batchId: string, droppedAt: string, records: unknown[]): OperatorDropPayload {
  const rawContent = JSON.stringify(records);
  return {
    manifest: {
      batchId,
      domain: 'D01_QUOTES',
      fileChecksumSha256: createHash('sha256').update(rawContent).digest('hex'),
      recordCount: records.length,
      droppedAt,
      operatorId: 'OPERATOR-1',
    },
    rawContent,
  };
}

before(() => {
  workDir = mkdtempSync(join(tmpdir(), 'iips-reg06-e2e-'));
  storePath = join(workDir, 'pit-market-data.sqlite');
});

after(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe('REG-06 Operator Drop — identity resolution is explicit and never inferred', () => {
  it('accepts a complete securityIdentity and separate isin+series', () => {
    const viaObject = resolveDropSecurityIdentity({ securityIdentity: EQ });
    assert.equal('identity' in viaObject && viaObject.identity?.securityId, EQ.securityId);

    const viaFields = resolveDropSecurityIdentity({ isin: ISIN, series: 'EQ' });
    assert.equal('identity' in viaFields && viaFields.identity?.securityId, EQ.securityId);
  });

  it('rejects a record with no identity fields, naming the reason', () => {
    const result = resolveDropSecurityIdentity({ companyId: 'INFY', symbol: 'INFY' });
    assert.equal('identity' in result && result.identity, null);
    assert.equal('reason' in result && result.reason, 'MISSING_IDENTITY_FIELDS');
  });

  const unusableRecords: ReadonlyArray<readonly [string, Record<string, unknown>]> = [
    ['a bare ISIN only', { isin: ISIN }],
    ['a series only', { series: 'EQ' }],
    ['a malformed ISIN', { isin: 'SHORT', series: 'EQ' }],
    ['a blank series', { isin: ISIN, series: '   ' }],
    ['a malformed securityIdentity', { securityIdentity: { securityId: ISIN, isin: ISIN, series: 'EQ' } }],
  ];
  for (const [label, record] of unusableRecords) {
    it(`rejects ${label}`, () => {
      const result = resolveDropSecurityIdentity(record);
      assert.equal('identity' in result && result.identity, null);
    });
  }
});

describe('REG-06 Operator Drop — end-to-end ingestion to screening', () => {
  it('ingests a valid package durably and screens it back by series identity', () => {
    const runtime = new OperatorDropProductRuntime<unknown>({ storePath, domain: 'D01_QUOTES' });

    const report = runtime.ingest(
      pkg('BATCH-1', D1, [
        quote('SWANENERGY', 120.5, { isin: ISIN, series: 'EQ' }),
        quote('SWANENERGY', 118.0, { isin: ISIN, series: 'BL' }),
      ]),
    );

    assert.equal(report.status, 'ACCEPTED');
    assert.equal(report.checksumVerified, true);
    assert.equal(report.totalRecords, 2);
    assert.equal(report.appended, 2);
    assert.equal(report.duplicates, 0);
    assert.equal(report.rejectedByIdentity, 0);
    assert.deepEqual([...report.admittedSecurityIds].sort(), [BL.securityId, EQ.securityId].sort());
    assert.equal(runtime.getRecordCount(), 2);

    const eq = runtime.screen({ securityId: EQ.securityId, domain: 'D01_QUOTES', asOf: AS_OF_LATE });
    assert.equal(eq.screened, true);
    if (eq.screened) {
      assert.equal((eq.result.payload as { ltp: number }).ltp, 120.5);
      assert.equal(eq.result.resolvedAsOf, D1);
    }

    const bl = runtime.screen({ securityId: BL.securityId, domain: 'D01_QUOTES', asOf: AS_OF_LATE });
    assert.equal(bl.screened, true);
    if (bl.screened) assert.equal((bl.result.payload as { ltp: number }).ltp, 118.0);

    runtime.close();
  });

  it('survives a restart: screened data comes from disk, not process memory', () => {
    assert.ok(existsSync(storePath), 'the durable PIT database must exist');

    const reopened = new OperatorDropProductRuntime<unknown>({ storePath, domain: 'D01_QUOTES' });
    assert.equal(reopened.getRecordCount(), 2);

    const hit = reopened.screen({ securityId: EQ.securityId, domain: 'D01_QUOTES', asOf: AS_OF_LATE });
    assert.equal(hit.screened, true);
    if (hit.screened) assert.equal((hit.result.payload as { ltp: number }).ltp, 120.5);

    assert.deepEqual(
      [...reopened.listAdmittedSeriesKeys()].sort(),
      [`SWANENERGY:D01_QUOTES:${BL.securityId}`, `SWANENERGY:D01_QUOTES:${EQ.securityId}`].sort(),
    );
    reopened.close();
  });

  it('re-ingesting the identical package is idempotent', () => {
    const runtime = new OperatorDropProductRuntime<unknown>({ storePath, domain: 'D01_QUOTES' });
    const before = runtime.getRecordCount();

    const report = runtime.ingest(
      pkg('BATCH-1', D1, [
        quote('SWANENERGY', 120.5, { isin: ISIN, series: 'EQ' }),
        quote('SWANENERGY', 118.0, { isin: ISIN, series: 'BL' }),
      ]),
    );

    assert.equal(report.appended, 0);
    assert.equal(report.duplicates, 2, 'both records must be recognised as already stored');
    assert.equal(runtime.getRecordCount(), before, 'a replay must not add vintages');
    runtime.close();
  });

  it('adds a later vintage and resolves point-in-time correctly across dates', () => {
    const runtime = new OperatorDropProductRuntime<unknown>({ storePath, domain: 'D01_QUOTES' });

    const second = runtime.ingest(pkg('BATCH-2', D2, [quote('SWANENERGY', 145.75, { isin: ISIN, series: 'EQ' })]));
    assert.equal(second.appended, 1);

    const early = runtime.screen({ securityId: EQ.securityId, domain: 'D01_QUOTES', asOf: '2026-02-01T00:00:00.000Z' });
    assert.equal(early.screened, true);
    if (early.screened) {
      assert.equal((early.result.payload as { ltp: number }).ltp, 120.5, 'the January vintage must resolve in February');
      assert.equal(early.result.resolvedAsOf, D1);
    }

    const late = runtime.screen({ securityId: EQ.securityId, domain: 'D01_QUOTES', asOf: AS_OF_LATE });
    assert.equal(late.screened, true);
    if (late.screened) {
      assert.equal((late.result.payload as { ltp: number }).ltp, 145.75, 'the April vintage must resolve later');
      assert.equal(late.result.resolvedAsOf, D2);
    }

    const history = runtime.history('SWANENERGY', EQ.securityId, 'D01_QUOTES', D1, AS_OF_LATE);
    assert.equal(history.length, 2, 'both vintages must remain readable');

    // The BL series must be untouched by the EQ vintage.
    const bl = runtime.screen({ securityId: BL.securityId, domain: 'D01_QUOTES', asOf: AS_OF_LATE });
    assert.equal(bl.screened, true);
    if (bl.screened) assert.equal((bl.result.payload as { ltp: number }).ltp, 118.0);

    runtime.close();
  });

  it('quarantines a record with no identity while admitting the valid ones', () => {
    const path = join(workDir, 'partial.sqlite');
    const runtime = new OperatorDropProductRuntime<unknown>({ storePath: path, domain: 'D01_QUOTES' });

    const report = runtime.ingest(
      pkg('BATCH-3', D1, [
        quote('INFY', 1520.35, { isin: 'INE009A01021', series: 'EQ' }),
        quote('TCS', 3850.5), // no identity at all
      ]),
    );

    assert.equal(report.status, 'REJECTED', 'a batch with an unidentified record is not fully accepted');
    assert.equal(report.appended, 1, 'the identified record is still admitted');
    assert.equal(report.rejectedByIdentity, 1);
    assert.equal(report.rejections.length, 1);
    assert.equal(report.rejections[0]?.reason, 'MISSING_IDENTITY_FIELDS');
    assert.equal(report.rejections[0]?.companyId, 'TCS');
    assert.equal(runtime.getRecordCount(), 1);

    const infy = runtime.screen({ securityId: 'ISIN:INE009A01021:EQ', domain: 'D01_QUOTES', asOf: AS_OF_LATE });
    assert.equal(infy.screened, true);
    runtime.close();
  });

  it('refuses a package with a corrupted checksum and writes nothing', () => {
    const path = join(workDir, 'corrupt.sqlite');
    const runtime = new OperatorDropProductRuntime<unknown>({ storePath: path, domain: 'D01_QUOTES' });

    const good = pkg('BATCH-4', D1, [quote('INFY', 1520.35, { isin: 'INE009A01021', series: 'EQ' })]);
    const corrupt: OperatorDropPayload = {
      manifest: { ...good.manifest, fileChecksumSha256: 'f'.repeat(64) },
      rawContent: good.rawContent,
    };

    const report = runtime.ingest(corrupt);
    assert.equal(report.status, 'REJECTED');
    assert.equal(report.checksumVerified, false);
    assert.equal(report.appended, 0);
    assert.equal(report.totalRecords, 0);
    assert.match(report.rejectionReason ?? '', /Checksum mismatch/);
    assert.equal(runtime.getRecordCount(), 0, 'nothing may be written from an unverified package');
    runtime.close();
  });

  it('refuses a package whose content is not a JSON array', () => {
    const path = join(workDir, 'notarray.sqlite');
    const runtime = new OperatorDropProductRuntime<unknown>({ storePath: path, domain: 'D01_QUOTES' });

    const rawContent = JSON.stringify({ companyId: 'INFY' });
    const report = runtime.ingest({
      manifest: {
        batchId: 'BATCH-5',
        domain: 'D01_QUOTES',
        fileChecksumSha256: createHash('sha256').update(rawContent).digest('hex'),
        recordCount: 1,
        droppedAt: D1,
        operatorId: 'OPERATOR-1',
      },
      rawContent,
    });

    assert.equal(report.status, 'REJECTED');
    assert.equal(report.appended, 0);
    assert.match(report.rejectionReason ?? '', /JSON array/);
    runtime.close();
  });

  it('fails closed when screening an unadmitted series instead of substituting', () => {
    const runtime = new OperatorDropProductRuntime<unknown>({ storePath, domain: 'D01_QUOTES' });
    const absent = buildD114SecurityIdentity(ISIN, 'ZZ')!.securityId;
    const miss = runtime.screen({ securityId: absent, domain: 'D01_QUOTES', asOf: AS_OF_LATE });
    assert.equal(miss.screened, false);
    if (!miss.screened) assert.equal(miss.reason, 'NOT_FOUND');

    const malformed = runtime.screen({ securityId: ISIN, domain: 'D01_QUOTES', asOf: AS_OF_LATE });
    assert.equal(malformed.screened, false);
    if (!malformed.screened) assert.equal(malformed.reason, 'INVALID_IDENTITY');
    runtime.close();
  });
});
