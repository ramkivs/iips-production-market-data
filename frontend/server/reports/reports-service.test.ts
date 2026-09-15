/**
 * UI08 (D82) — reports persistence, PIT pinning and byte-identity tests.
 *
 * Covers the D82 §16 criteria at the service layer: generation, persistence, retrieval,
 * deletion, restart/journal reconstruction, tenant isolation, owner scoping, cross-tenant
 * denial, lineage, PIT pinning and byte identity.
 *
 * Offline and deterministic — node:fs/os/path via the existing PersistenceService only.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { PersistenceService } from '../persistence/persistence-service';
import {
  PIT_LIMITATION,
  REPORT_TYPES,
  ReportValidationError,
  canonicalJson,
  compareRegeneration,
  deleteReport,
  isReportType,
  listReports,
  payloadHash,
  readReport,
  resetReportsPersistence,
  storeReport,
  verifyStoredIntegrity,
  type PitPinning,
} from './reports-service';

const TENANT_A = 'tenant-A';
const TENANT_B = 'tenant-B';
const OWNER_1 = 'user-1';
const OWNER_2 = 'user-2';

/** Shaped exactly like ReportingEngine.build() output. */
const GENERATED = {
  reportId: 'report-executive-PF-REAL',
  reportType: 'Executive',
  portfolioId: 'PF-REAL',
  payload: {
    portfolioId: 'PF-REAL',
    scenario: 'Balanced',
    diversificationScore: 71,
    avgConviction: 64,
    ranking: [{ companyId: 'Banking', conviction: 80 }],
  },
};

const PINNING: PitPinning = { dataVersion: 'v1.1-replay-baseline', asOf: '2026-08-09T00:00:00.000Z', mode: 'SNAPSHOT' };
const LINEAGE = {
  dataSource: 'governed:certified-v2.0-reference-universe',
  classification: 'REAL',
  contributingSnapshotIds: ['snap_Banking'] as readonly string[],
  generatedAt: '2026-09-15T00:00:00.000Z',
};

let dataDir: string;
const svc = () => new PersistenceService({ dataDir });
const store1 = (s: PersistenceService) => storeReport(TENANT_A, OWNER_1, GENERATED, PINNING, LINEAGE, s);

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui08-reports-'));
  resetReportsPersistence();
});
afterEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  resetReportsPersistence();
});

describe('UI08 — templates limited to existing PortfolioReport types', () => {
  it('exposes exactly the five platform report types', () => {
    expect([...REPORT_TYPES]).toEqual([
      'Executive', 'Investment Committee', 'Portfolio Summary', 'Allocation Recommendation', 'Sector Dashboard',
    ]);
  });

  it('rejects an invented report type', () => {
    expect(isReportType('Executive')).toBe(true);
    expect(isReportType('Custom Monthly Deck')).toBe(false);
    expect(() => storeReport(TENANT_A, OWNER_1, { ...GENERATED, reportType: 'Custom' }, PINNING, LINEAGE, svc()))
      .toThrow(ReportValidationError);
  });
});

describe('UI08 — generation, persistence, retrieval, deletion', () => {
  it('stores a generated report with its complete payload', () => {
    const s = svc();
    const r = store1(s);
    expect(r.reportType).toBe('Executive');
    expect(r.payload).toEqual(GENERATED.payload);
    expect(listReports(TENANT_A, OWNER_1, s)).toHaveLength(1);
  });

  it('retrieves a stored report by id', () => {
    const s = svc();
    const r = store1(s);
    expect(readReport(TENANT_A, OWNER_1, r.reportId, s)!.payload).toEqual(GENERATED.payload);
  });

  it('deletes a report and reports unknown deletes as false', () => {
    const s = svc();
    const r = store1(s);
    expect(deleteReport(TENANT_A, OWNER_1, r.reportId, s)).toBe(true);
    expect(listReports(TENANT_A, OWNER_1, s)).toHaveLength(0);
    expect(deleteReport(TENANT_A, OWNER_1, r.reportId, s)).toBe(false);
  });

  it('keys stored reports by vintage so a different as-of does not overwrite', () => {
    const s = svc();
    const a = store1(s);
    const b = storeReport(TENANT_A, OWNER_1, GENERATED, { ...PINNING, asOf: '2026-09-01T00:00:00.000Z' }, LINEAGE, s);
    expect(a.reportId).not.toBe(b.reportId);
    expect(listReports(TENANT_A, OWNER_1, s)).toHaveLength(2);
  });
});

describe('UI08 — PIT pinning, lineage and source/timestamp', () => {
  it('pins dataVersion, asOf and mode on the stored report', () => {
    expect(store1(svc()).pitPinning).toEqual(PINNING);
  });

  it('records lineage with source, classification, snapshots and generatedAt', () => {
    const r = store1(svc());
    expect(r.lineage.dataSource).toBe(LINEAGE.dataSource);
    expect(r.lineage.classification).toBe('REAL');
    expect(r.lineage.contributingSnapshotIds).toEqual(['snap_Banking']);
    expect(r.lineage.generatedAt).toBe(LINEAGE.generatedAt);
  });

  it('distinguishes generatedAt (wall clock) from asOf (data observation time)', () => {
    const r = store1(svc());
    expect(r.lineage.generatedAt).not.toBe(r.pitPinning.asOf);
  });

  it('states the historical-as-of limitation without claiming replay', () => {
    expect(PIT_LIMITATION.historicalAsOf).toMatch(/UNAVAILABLE/);
    expect(PIT_LIMITATION.historicalAsOf).toMatch(/No historical vintage is fabricated/);
    expect(PIT_LIMITATION.replayReproducibilityClaimed).toBe(false);
  });
});

describe('UI08 — byte identity', () => {
  it('canonical JSON is key-order independent', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
    expect(payloadHash({ b: 1, a: 2 })).toBe(payloadHash({ a: 2, b: 1 }));
  });

  it('distinct payloads hash differently', () => {
    expect(payloadHash({ a: 1 })).not.toBe(payloadHash({ a: 2 }));
  });

  it('a re-opened stored report is BYTE-IDENTICAL to what was generated', () => {
    const s = svc();
    const r = store1(s);
    const reopened = readReport(TENANT_A, OWNER_1, r.reportId, s)!;
    expect(canonicalJson(reopened.payload)).toBe(canonicalJson(GENERATED.payload));
    expect(reopened.payloadHash).toBe(payloadHash(GENERATED.payload));
    expect(verifyStoredIntegrity(reopened)).toBe(true);
  });

  it('integrity verification detects divergence from the recorded hash', () => {
    const r = store1(svc());
    expect(verifyStoredIntegrity({ ...r, payload: { ...r.payload, tampered: true } })).toBe(false);
  });

  it('same-vintage regeneration is byte-identical', () => {
    const r = store1(svc());
    const cmp = compareRegeneration(r, { ...GENERATED.payload }, PINNING);
    expect(cmp.sameVintage).toBe(true);
    expect(cmp.byteIdentical).toBe(true);
  });

  it('same-vintage regeneration with different content is reported as NOT byte-identical', () => {
    const r = store1(svc());
    const cmp = compareRegeneration(r, { ...GENERATED.payload, diversificationScore: 99 }, PINNING);
    expect(cmp.sameVintage).toBe(true);
    expect(cmp.byteIdentical).toBe(false);
  });

  it('a DIFFERENT vintage is not-comparable rather than a failure', () => {
    const r = store1(svc());
    const cmp = compareRegeneration(r, GENERATED.payload, { ...PINNING, asOf: '2026-01-01T00:00:00.000Z' });
    expect(cmp.sameVintage).toBe(false);
    expect(cmp.byteIdentical).toBeNull();
    expect(cmp.reason).toMatch(/historical as-of regeneration is unavailable/);
  });
});

describe('UI08 — restart / journal reconstruction', () => {
  it('a stored report survives a fresh service instance, byte-identically', () => {
    const r = store1(svc());
    const after = readReport(TENANT_A, OWNER_1, r.reportId, svc())!;
    expect(after.payloadHash).toBe(r.payloadHash);
    expect(canonicalJson(after.payload)).toBe(canonicalJson(GENERATED.payload));
    expect(after.pitPinning).toEqual(PINNING);
    expect(verifyStoredIntegrity(after)).toBe(true);
  });

  it('a deletion survives a restart — the report does not resurrect', () => {
    const first = svc();
    const r = store1(first);
    deleteReport(TENANT_A, OWNER_1, r.reportId, first);
    expect(listReports(TENANT_A, OWNER_1, svc())).toHaveLength(0);
  });
});

describe('UI08 — tenant isolation and owner scoping', () => {
  it('another tenant sees nothing', () => {
    const s = svc();
    const r = store1(s);
    expect(listReports(TENANT_B, OWNER_1, s)).toHaveLength(0);
    expect(readReport(TENANT_B, OWNER_1, r.reportId, s)).toBeUndefined();
  });

  it('another owner in the same tenant sees nothing', () => {
    const s = svc();
    const r = store1(s);
    expect(listReports(TENANT_A, OWNER_2, s)).toHaveLength(0);
    expect(readReport(TENANT_A, OWNER_2, r.reportId, s)).toBeUndefined();
  });

  it('another tenant cannot delete this tenant report', () => {
    const s = svc();
    const r = store1(s);
    expect(deleteReport(TENANT_B, OWNER_1, r.reportId, s)).toBe(false);
    expect(listReports(TENANT_A, OWNER_1, s)).toHaveLength(1);
  });

  it('ignores records written by another consumer of the same journal', () => {
    const s = svc();
    s.append({ tenantId: TENANT_A, ownerUserId: OWNER_1, dedupKey: 'notification\u0000n-1', payload: { kind: 'other' } });
    expect(listReports(TENANT_A, OWNER_1, s)).toHaveLength(0);
  });
});
