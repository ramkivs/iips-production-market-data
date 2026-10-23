/** CAP-02 B-1R: current-main PIT identity, read service and D114 package contracts. */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildD114SecurityIdentity,
  isD114SecurityIdentity,
  type DataDomain,
} from '../src/contracts/types.js';
import { createCanonicalEnvelope, type CanonicalEnvelope } from '../src/contracts/envelope.js';
import { buildPitKey, PointInTimeStore } from '../src/pit/pit_store.js';
import { PitReadService } from '../src/pit/pit_read_service.js';
import { CmUdiffParser } from '../src/d114/cm_udiff_parser.js';
import { LegacyBhavcopyParser } from '../src/d114/legacy_bhavcopy_parser.js';
import { UnifiedHistoricalAdapter } from '../src/d114/unified_historical_adapter.js';
import { HistoricalPitIngestionLoader } from '../src/d114/pit_ingestion_loader.js';
import {
  createNonProductionD114PitStore,
  populateNonProductionD114Pit,
  ingestNonProductionD114Archives,
  NON_PRODUCTION_D114_ARCHIVES,
  NON_PRODUCTION_D114_EQ,
  NON_PRODUCTION_D114_BL,
  NON_PRODUCTION_D114_VINTAGE_1,
  NON_PRODUCTION_D114_VINTAGE_2,
  NON_PRODUCTION_D114_VINTAGE_3,
} from '../src/d114/non_production_pit_population.js';
import * as pitPackage from '../src/pit/package.js';
import * as d114Package from '../src/d114/non_production_package.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ISIN = 'INE665A01038';
const BL = `ISIN:${ISIN}:BL`;
const EQ = `ISIN:${ISIN}:EQ`;
const T1 = '2026-01-05T09:15:00.000Z';
const T2 = '2026-02-10T11:30:00.000Z';
const T3 = '2026-03-20T14:45:00.000Z';

interface FixtureOptions {
  companyId?: string;
  securityId?: string;
  domain?: DataDomain;
  asOf?: string;
  payload?: unknown;
  version?: string;
}

function fixture(options: FixtureOptions = {}): CanonicalEnvelope<unknown> {
  const asOf = options.asOf ?? T1;
  const version = options.version ?? 'v1';
  return createCanonicalEnvelope({
    envelopeId: `fixture-${version}`,
    domain: options.domain ?? 'D01_QUOTES',
    mode: 'PIT',
    companyId: options.companyId ?? 'SWANENERGY',
    ...(options.securityId !== undefined ? { securityId: options.securityId } : {}),
    payload: options.payload ?? { value: version },
    provenance: {
      sourceClassification: 'DERIVED',
      vendorTier: 'MOCK_FIXTURE',
      asOf,
      receivedAt: asOf,
      evaluatedAt: asOf,
      dataVersion: version,
      lineageHash: `lineage-${version}`,
      qualityState: 'GOOD',
    },
    timestamp: asOf,
  });
}

function seriesStore(): PointInTimeStore<unknown> {
  const store = new PointInTimeStore<unknown>();
  store.append(fixture({ securityId: BL, asOf: T1, version: 'bl-1' }));
  store.append(fixture({ securityId: BL, asOf: T2, version: 'bl-2' }));
  store.append(fixture({ securityId: EQ, asOf: T1, version: 'eq-1' }));
  store.append(fixture({ securityId: EQ, asOf: T3, version: 'eq-2' }));
  return store;
}

function payloadOf(result: ReturnType<PitReadService<unknown>['queryAsOf']>): Record<string, unknown> {
  assert.strictEqual(result.found, true);
  if (!result.found) throw new Error('unreachable');
  return result.payload as Record<string, unknown>;
}

describe('CAP-02 B-1R identity construction and source propagation', () => {
  it('builds distinct explicit series identities without consulting companyId', () => {
    const eq = buildD114SecurityIdentity(ISIN, 'EQ');
    const bl = buildD114SecurityIdentity(ISIN, 'BL');
    assert.strictEqual(eq?.securityId, EQ);
    assert.strictEqual(bl?.securityId, BL);
    assert.notStrictEqual(eq?.securityId, bl?.securityId);
    assert.strictEqual(eq?.isinAuthority, 'NON_AUTHORITATIVE');
  });

  it('rejects missing, malformed and delimiter-bearing identity components', () => {
    for (const [isin, series] of [
      [ISIN, ''], [ISIN, '   '], [ISIN, undefined], [ISIN, 'EQ:BL'],
      ['SHORT', 'EQ'], ['INE665A0103!', 'EQ'], [undefined, 'EQ'],
    ] as const) {
      assert.strictEqual(buildD114SecurityIdentity(isin, series), null);
    }
  });

  it('rejects a security identity whose components disagree', () => {
    const identity = buildD114SecurityIdentity(ISIN, 'EQ');
    assert.ok(identity);
    assert.strictEqual(isD114SecurityIdentity(identity), true);
    assert.strictEqual(isD114SecurityIdentity({ ...identity, securityId: BL }), false);
    assert.strictEqual(isD114SecurityIdentity({ ...identity, isinAuthority: 'AUTHORITATIVE' }), false);
  });

  it('propagates source ISIN+series at all four D114 normalization seams', () => {
    const legacy = LegacyBhavcopyParser.parseCsv(NON_PRODUCTION_D114_ARCHIVES[0]!.csv).records[0]!;
    const contemporary = CmUdiffParser.parseCsv(NON_PRODUCTION_D114_ARCHIVES[1]!.csv).records[0]!;
    for (const payload of [
      LegacyBhavcopyParser.toCanonicalQuote(legacy),
      LegacyBhavcopyParser.toCanonicalOHLCV(legacy),
      CmUdiffParser.toCanonicalQuote(contemporary),
      CmUdiffParser.toCanonicalOHLCV(contemporary),
    ]) {
      assert.strictEqual(payload.securityIdentity?.securityId, NON_PRODUCTION_D114_EQ);
      assert.strictEqual(payload.companyId, 'TCS');
    }
  });

  it('rejects missing source series in either archive era instead of falling back', () => {
    const badLegacy = NON_PRODUCTION_D114_ARCHIVES[0]!.csv.replace('TCS,EQ,', 'TCS,,');
    const badContemporary = NON_PRODUCTION_D114_ARCHIVES[1]!.csv.replace(',EQ,', ',,');
    assert.strictEqual(UnifiedHistoricalAdapter.parseAndNormalize(badLegacy).isValid, false);
    assert.strictEqual(UnifiedHistoricalAdapter.parseAndNormalize(badContemporary).isValid, false);
  });

  it('keeps the canonical envelope additive and preserves the legacy shape', () => {
    const legacy = fixture({ version: 'legacy' });
    const series = fixture({ securityId: EQ, version: 'series' });
    assert.strictEqual('securityId' in legacy, false);
    assert.strictEqual(series.securityId, EQ);
    assert.strictEqual(series.companyId, 'SWANENERGY');
  });
});

describe('CAP-02 B-1R PointInTimeStore admission and query semantics', () => {
  it('preserves legacy company/domain as-of and range behavior', () => {
    const store = new PointInTimeStore<unknown>();
    store.append(fixture({ asOf: T2, version: 'legacy' }));
    assert.deepStrictEqual(
      store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T3 })?.payload,
      { value: 'legacy' },
    );
    assert.strictEqual(store.queryRange('SWANENERGY', 'D01_QUOTES', T1, T3).length, 1);
  });

  it('isolates same-ISIN series and orders vintages without future leakage', () => {
    const store = seriesStore();
    const bl = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', securityId: BL, asOf: T3 });
    const eq = store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', securityId: EQ, asOf: T3 });
    assert.deepStrictEqual(bl?.payload, { value: 'bl-2' });
    assert.deepStrictEqual(eq?.payload, { value: 'eq-2' });
    assert.strictEqual(store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', securityId: BL, asOf: '2020-01-01T00:00:00.000Z' }), undefined);
  });

  it('allows a sole-series legacy query but refuses a multi-series ambiguous query', () => {
    const sole = new PointInTimeStore<unknown>();
    sole.append(fixture({ securityId: EQ }));
    assert.deepStrictEqual(sole.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T1 })?.payload, { value: 'v1' });
    assert.throws(
      () => seriesStore().queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', asOf: T3 }),
      /Ambiguous PIT identity/,
    );
  });

  it('never falls back to another series or a company-only record', () => {
    const store = new PointInTimeStore<unknown>();
    store.append(fixture({ version: 'legacy' }));
    store.append(fixture({ securityId: BL, version: 'bl' }));
    assert.strictEqual(store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D01_QUOTES', securityId: EQ, asOf: T3 }), undefined);
    assert.strictEqual(store.queryAsOf({ companyId: 'SWANENERGY', domain: 'D02_OHLCV', securityId: BL, asOf: T3 }), undefined);
  });

  it('rejects malformed storage identity before admission', () => {
    const store = new PointInTimeStore<unknown>();
    assert.throws(() => store.append(fixture({ securityId: 'NOT-AN-ISIN' })), /exact ISIN/);
    assert.throws(() => buildPitKey('SWANENERGY', 'D01_QUOTES', ''), /exact ISIN/);
    assert.strictEqual(store.getRecordCount(), 0);
  });

  it('rejects missing or conflicting envelope/payload identity', () => {
    const identity = buildD114SecurityIdentity(ISIN, 'EQ')!;
    const missing = new PointInTimeStore<unknown>();
    assert.throws(() => missing.append(fixture({ payload: { securityIdentity: identity } })), /securityId is required/);

    const conflicting = new PointInTimeStore<unknown>();
    assert.throws(
      () => conflicting.append(fixture({ securityId: BL, payload: { securityIdentity: identity } })),
      /identities conflict/,
    );
    assert.strictEqual(missing.getRecordCount() + conflicting.getRecordCount(), 0);
  });

  it('enumerates only actual admitted keys deterministically and clears the index', () => {
    const empty = new PointInTimeStore<unknown>();
    assert.deepStrictEqual(empty.listAdmittedSeriesKeys(), []);
    const store = seriesStore();
    const keys = store.listAdmittedSeriesKeys();
    assert.deepStrictEqual(keys, [...keys].sort());
    assert.strictEqual(new Set(keys).size, 2);
    assert.ok(keys.every((key) => !key.endsWith(`ISIN:${ISIN}:ZZ`)));
    store.clear();
    assert.deepStrictEqual(store.listAdmittedSeriesKeys(), []);
    assert.strictEqual(store.getRecordCount(), 0);
  });
});

describe('CAP-02 B-1R read-only PIT service', () => {
  it('returns a typed hit with requested/resolved asOf and verbatim provenance', () => {
    const result = new PitReadService(seriesStore()).queryAsOf({ securityId: BL, domain: 'D01_QUOTES', asOf: T3 });
    assert.strictEqual(result.found, true);
    if (!result.found) return;
    assert.strictEqual(result.securityId, BL);
    assert.strictEqual(result.asOf, T3);
    assert.strictEqual(result.resolvedAsOf, T2);
    assert.strictEqual(result.provenance.dataVersion, 'bl-2');
    assert.strictEqual(result.provenance.lineageHash, 'lineage-bl-2');
    assert.strictEqual('companyId' in result, false);
  });

  it('isolates series and domains through the service', () => {
    const service = new PitReadService(seriesStore());
    assert.deepStrictEqual(payloadOf(service.queryAsOf({ securityId: EQ, domain: 'D01_QUOTES', asOf: T3 })), { value: 'eq-2' });
    assert.strictEqual(service.queryAsOf({ securityId: EQ, domain: 'D02_OHLCV', asOf: T3 }).found, false);
  });

  it('returns typed misses for malformed identity, domain and UTC instant', () => {
    const service = new PitReadService(seriesStore());
    for (const securityId of ['', ISIN, `ISIN:${ISIN}`, `ISIN:${ISIN}:`, `ISIN:${ISIN}:EQ:BL`]) {
      assert.deepStrictEqual(service.queryAsOf({ securityId, domain: 'D01_QUOTES', asOf: T3 }), { found: false, reason: 'INVALID_IDENTITY' });
    }
    assert.deepStrictEqual(
      service.queryAsOf({ securityId: EQ, domain: 'D99_INVALID' as DataDomain, asOf: T3 }),
      { found: false, reason: 'INVALID_DOMAIN' },
    );
    for (const asOf of ['not-a-date', '2026-02-30T12:00:00Z', '2026-02-10T11:30:00+05:30']) {
      assert.deepStrictEqual(service.queryAsOf({ securityId: EQ, domain: 'D01_QUOTES', asOf }), { found: false, reason: 'INVALID_ASOF' });
    }
  });

  it('distinguishes unknown identities and pre-first-vintage misses', () => {
    const service = new PitReadService(seriesStore());
    for (const request of [
      { securityId: `ISIN:${ISIN}:ZZ`, domain: 'D01_QUOTES', asOf: T3 },
      { securityId: EQ, domain: 'D01_QUOTES', asOf: '2020-01-01T00:00:00.000Z' },
    ] as const) {
      assert.deepStrictEqual(service.queryAsOf(request), { found: false, reason: 'NOT_FOUND' });
    }
    assert.deepStrictEqual(
      new PitReadService(new PointInTimeStore()).queryAsOf({ securityId: EQ, domain: 'D01_QUOTES', asOf: T3 }),
      { found: false, reason: 'NOT_FOUND' },
    );
  });

  it('fails closed when one security/domain maps to multiple company keys', () => {
    const store = new PointInTimeStore<unknown>();
    store.append(fixture({ companyId: 'COMPANY_A', securityId: EQ }));
    store.append(fixture({ companyId: 'COMPANY_B', securityId: EQ }));
    assert.deepStrictEqual(
      new PitReadService(store).queryAsOf({ securityId: EQ, domain: 'D01_QUOTES', asOf: T3 }),
      { found: false, reason: 'AMBIGUOUS' },
    );
  });

  it('does not expose legacy company-only records through a securityId read', () => {
    const store = new PointInTimeStore<unknown>();
    store.append(fixture({ version: 'legacy' }));
    assert.deepStrictEqual(
      new PitReadService(store).queryAsOf({ securityId: EQ, domain: 'D01_QUOTES', asOf: T3 }),
      { found: false, reason: 'NOT_FOUND' },
    );
  });
});

describe('CAP-02 B-1R deterministic non-production D114 population', () => {
  it('drives both real parser eras into one caller-supplied store', () => {
    const store = new PointInTimeStore<unknown>();
    const population = populateNonProductionD114Pit(store);
    assert.strictEqual(population.store, store);
    assert.strictEqual(store.getRecordCount(), 12);
    assert.deepStrictEqual(population.results.map((result) => result.format), ['LEGACY_BHAVCOPY', 'CM_UDIFF', 'CM_UDIFF']);
    assert.ok(population.results.every((result) => result.success && result.d01Count === 2 && result.d02Count === 2));
    assert.match(population.disposition, /NON_PRODUCTION/);
  });

  it('resolves exact D114 vintages, payload shapes and provenance', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService(store);
    const cases = [
      [NON_PRODUCTION_D114_VINTAGE_1, 3812.4],
      [NON_PRODUCTION_D114_VINTAGE_2, 4010.25],
      [NON_PRODUCTION_D114_VINTAGE_3, 4125.6],
    ] as const;
    for (const [asOf, ltp] of cases) {
      const result = service.queryAsOf({ securityId: NON_PRODUCTION_D114_EQ, domain: 'D01_QUOTES', asOf });
      assert.strictEqual(result.found, true);
      if (!result.found) continue;
      assert.strictEqual(result.resolvedAsOf, asOf);
      assert.strictEqual((result.payload as { ltp: number }).ltp, ltp);
      assert.strictEqual(result.provenance.vendorTier, 'OFFLINE_BOOTSTRAP');
      assert.strictEqual(result.provenance.dataVersion, 'v1.0.0-d114-historical');
    }
  });

  it('keeps EQ and BL payloads and lineage distinct', () => {
    const service = new PitReadService(createNonProductionD114PitStore().store);
    const eq = service.queryAsOf({ securityId: NON_PRODUCTION_D114_EQ, domain: 'D01_QUOTES', asOf: NON_PRODUCTION_D114_VINTAGE_3 });
    const bl = service.queryAsOf({ securityId: NON_PRODUCTION_D114_BL, domain: 'D01_QUOTES', asOf: NON_PRODUCTION_D114_VINTAGE_3 });
    assert.strictEqual(payloadOf(eq).ltp, 4125.6);
    assert.strictEqual(payloadOf(bl).ltp, 4131.05);
    assert.ok(eq.found && bl.found);
    assert.notStrictEqual(eq.provenance.lineageHash, bl.provenance.lineageHash);
  });

  it('is deterministic and idempotent through the returned loader', () => {
    const a = createNonProductionD114PitStore();
    const b = createNonProductionD114PitStore();
    assert.deepStrictEqual(a.store.listAdmittedSeriesKeys(), b.store.listAdmittedSeriesKeys());
    const replay = ingestNonProductionD114Archives(a.loader);
    assert.ok(replay.every((result) => result.success && result.d01Count === 0 && result.d02Count === 0 && result.duplicateCount === 4));
    assert.strictEqual(a.store.getRecordCount(), 12);
    const report = a.loader.generateValidationReport({ secondRunNewLoaded: 0 });
    assert.strictEqual(report.metrics.idempotentlySkipped, 12);
    assert.strictEqual(report.replayVerification.idempotencyVerified, true);
  });

  it('quarantines invalid dates and malformed archives without admissions', () => {
    for (const [csv, dateIso] of [
      [NON_PRODUCTION_D114_ARCHIVES[0]!.csv, '2026/01/05'],
      ['COL_A,COL_B\n1,2', '2026-01-05'],
    ] as const) {
      const store = new PointInTimeStore<unknown>();
      const loader = new HistoricalPitIngestionLoader({
        quoteStore: store as never,
        candleStore: store as never,
      });
      const result = loader.ingestArchiveContent(csv, { dateIso });
      assert.strictEqual(result.success, false);
      assert.strictEqual(store.getRecordCount(), 0);
    }
  });
});

describe('CAP-02 B-1R public entry and manifest conformance', () => {
  it('exports exactly the intended runtime symbols from the source entries', () => {
    assert.deepStrictEqual(Object.keys(pitPackage).sort(), ['PitReadService', 'PointInTimeStore'].sort());
    assert.deepStrictEqual(Object.keys(d114Package).sort(), [
      'createNonProductionD114PitStore',
      'populateNonProductionD114Pit',
      'ingestNonProductionD114Archives',
      'NON_PRODUCTION_D114_EQ',
      'NON_PRODUCTION_D114_BL',
      'NON_PRODUCTION_D114_VINTAGE_1',
      'NON_PRODUCTION_D114_VINTAGE_2',
      'NON_PRODUCTION_D114_VINTAGE_3',
    ].sort());
    assert.strictEqual(pitPackage.PointInTimeStore, PointInTimeStore);
    assert.strictEqual(pitPackage.PitReadService, PitReadService);
  });

  it('maps exact subpaths to real runtime and declaration artifacts', () => {
    const manifest = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
      exports: Record<string, { import: string; types: string }>;
    };
    assert.deepStrictEqual(Object.keys(manifest.exports), ['./portfolio-ui', './pit', './d114-non-production']);
    for (const entry of Object.values(manifest.exports)) {
      assert.ok(existsSync(resolve(REPO_ROOT, entry.import)), `missing ${entry.import}`);
      assert.ok(existsSync(resolve(REPO_ROOT, entry.types)), `missing ${entry.types}`);
    }
    assert.strictEqual(manifest.exports['./persistence'], undefined);
  });
});
