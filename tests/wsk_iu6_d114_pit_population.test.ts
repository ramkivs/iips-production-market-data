/**
 * Institutional Investment Platform System (IIPS)
 * IU-6 — NON-PRODUCTION D114 -> PIT STORE POPULATION — Test Suite
 *
 * Governed under: AD-01..AD-18 / AD-CHARTER-2026-01 / AD-W1-AUTH-2026-01 / D114 / IU-6
 *
 * Proves the population seam that makes the EXISTING D114 historical ingestion
 * capability fill the EXISTING authoritative IPD `PointInTimeStore`, so the
 * already-completed IU-3 `PitReadService` read path has real D114 data to read:
 *
 *     D114 archive fixture
 *       -> existing parser (CM-UDiFF and Legacy Bhavcopy)
 *         -> existing canonical D01/D02 normalization
 *           -> HistoricalPitIngestionLoader
 *             -> PointInTimeStore.append()
 *               -> PitReadService
 *
 * ADDITIVE TESTS ONLY. No existing test is modified, weakened, or deleted.
 * Invariants already proven by IU-1 (PIT keying), IU-2 (series-aware identity)
 * and IU-3 (read boundary) are NOT re-proven here in the abstract; they are
 * exercised only as they now behave on D114-POPULATED data.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as zlib from 'node:zlib';

import {
  PointInTimeStore,
  PitReadService,
  buildPitKey,
  HistoricalPitIngestionLoader,
  UnifiedHistoricalAdapter,
  CmUdiffParser,
  isD114SecurityIdentity,
} from '../src/index.js';
import {
  createNonProductionD114PitStore,
  populateNonProductionD114Pit,
  ingestNonProductionD114Archives,
  NON_PRODUCTION_D114_ARCHIVES,
  NON_PRODUCTION_D114_DISPOSITION,
  NON_PRODUCTION_D114_SYMBOL,
  NON_PRODUCTION_D114_EQ,
  NON_PRODUCTION_D114_BL,
  NON_PRODUCTION_D114_DATE_1,
  NON_PRODUCTION_D114_VINTAGE_1,
  NON_PRODUCTION_D114_VINTAGE_2,
  NON_PRODUCTION_D114_VINTAGE_3,
} from '../src/d114/non_production_pit_population.js';

/** An instant strictly before every admitted vintage. */
const BEFORE_ALL = '2020-01-01T00:00:00.000Z';
/** An instant strictly after every admitted vintage. */
const AFTER_ALL = '2026-12-31T23:59:59.000Z';

/** Build a minimal STORED (uncompressed) PKZIP buffer around a CSV payload. */
function storedZip(filename: string, content: string): Buffer {
  const name = Buffer.from(filename, 'utf8');
  const data = Buffer.from(content, 'utf8');
  const crc = zlib.crc32 !== undefined ? zlib.crc32(data) : 0;
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // local file header signature
  header.writeUInt16LE(10, 4); // version needed
  header.writeUInt16LE(0, 6); // flags
  header.writeUInt16LE(0, 8); // compression method: stored
  header.writeUInt16LE(0, 10); // mod time
  header.writeUInt16LE(0, 12); // mod date
  header.writeUInt32LE(crc >>> 0, 14);
  header.writeUInt32LE(data.length, 18); // compressed size
  header.writeUInt32LE(data.length, 22); // uncompressed size
  header.writeUInt16LE(name.length, 26);
  header.writeUInt16LE(0, 28); // extra field length
  return Buffer.concat([header, name, data]);
}

// ===========================================================================
// 1. The D114 fixture/archive parses successfully through the EXISTING parsers
// ===========================================================================
describe('IU6-01 — D114 non-production archives parse through the existing parsers', () => {
  it('IU6-01a every frozen archive is recognised as its expected era', () => {
    assert.strictEqual(NON_PRODUCTION_D114_ARCHIVES.length, 3);
    for (const archive of NON_PRODUCTION_D114_ARCHIVES) {
      const parsed = UnifiedHistoricalAdapter.parseAndNormalize(archive.csv);
      assert.strictEqual(parsed.isValid, true, `${archive.sourceFilename} must parse`);
      assert.strictEqual(parsed.format, archive.expectedFormat);
      assert.strictEqual(parsed.totalRecords, 2, 'each archive carries one EQ and one BL row');
    }
  });

  it('IU6-01b both D114 eras are represented (no single-parser shortcut)', () => {
    const formats = NON_PRODUCTION_D114_ARCHIVES.map((a) => a.expectedFormat);
    assert.ok(formats.includes('LEGACY_BHAVCOPY'));
    assert.ok(formats.includes('CM_UDIFF'));
  });

  it('IU6-01c the real PKZIP archive path also parses and ingests', () => {
    const archive = NON_PRODUCTION_D114_ARCHIVES[1]!; // CM-UDiFF era
    const zip = storedZip(archive.sourceFilename, archive.csv);

    const extraction = CmUdiffParser.extractZipArchive(zip);
    assert.strictEqual(extraction.isValid, true, extraction.error);
    assert.strictEqual(extraction.rawCsvContent, archive.csv);

    const store = new PointInTimeStore<unknown>();
    const loader = new HistoricalPitIngestionLoader({
      quoteStore: store as never,
      candleStore: store as never,
    });
    const result = loader.ingestZipBuffer(zip, archive.dateIso, archive.sourceFilename);
    assert.strictEqual(result.success, true, result.error);
    assert.strictEqual(result.format, 'CM_UDIFF');
    assert.strictEqual(result.d01Count, 2);
    assert.strictEqual(result.d02Count, 2);
  });
});

// ===========================================================================
// 2 + 3. Canonical D01/D02 records are produced and reach the PIT store
// ===========================================================================
describe('IU6-02..03 — canonical D01/D02 records reach the authoritative store', () => {
  it('IU6-02 the parsers emit canonical D01 and D02 with series-aware identity', () => {
    for (const archive of NON_PRODUCTION_D114_ARCHIVES) {
      const parsed = UnifiedHistoricalAdapter.parseAndNormalize(archive.csv);
      assert.strictEqual(parsed.quotes.length, 2);
      assert.strictEqual(parsed.candles.length, 2);
      for (const quote of parsed.quotes) {
        assert.strictEqual(quote.companyId, NON_PRODUCTION_D114_SYMBOL);
        assert.ok(isD114SecurityIdentity(quote.securityIdentity));
      }
      for (const candle of parsed.candles) {
        assert.strictEqual(candle.interval, '1d');
        assert.ok(isD114SecurityIdentity(candle.securityIdentity));
      }
    }
  });

  it('IU6-03a every archive is admitted and the store is populated', () => {
    const { results, store } = createNonProductionD114PitStore();
    assert.strictEqual(results.length, 3);
    for (const result of results) {
      assert.strictEqual(result.success, true, result.error);
      assert.strictEqual(result.d01Count, 2);
      assert.strictEqual(result.d02Count, 2);
      assert.strictEqual(result.quarantinedCount, 0);
      assert.strictEqual(result.duplicateCount, 0);
    }
    // 3 dates x 2 series x 2 domains
    assert.strictEqual(store.getRecordCount(), 12);
  });

  it('IU6-03b the store is a real PointInTimeStore, not a substitute', () => {
    const { store, disposition } = createNonProductionD114PitStore();
    assert.ok(store instanceof PointInTimeStore);
    assert.strictEqual(disposition, NON_PRODUCTION_D114_DISPOSITION);
  });

  it('IU6-03c admitted keys use the authoritative IU-1 key grammar only', () => {
    const { store } = createNonProductionD114PitStore();
    const keys = store.listAdmittedSeriesKeys();
    const expected = [
      buildPitKey(NON_PRODUCTION_D114_SYMBOL, 'D01_QUOTES', NON_PRODUCTION_D114_BL),
      buildPitKey(NON_PRODUCTION_D114_SYMBOL, 'D01_QUOTES', NON_PRODUCTION_D114_EQ),
      buildPitKey(NON_PRODUCTION_D114_SYMBOL, 'D02_OHLCV', NON_PRODUCTION_D114_BL),
      buildPitKey(NON_PRODUCTION_D114_SYMBOL, 'D02_OHLCV', NON_PRODUCTION_D114_EQ),
    ].sort();
    assert.deepStrictEqual([...keys].sort(), expected);
  });
});

// ===========================================================================
// 4. PIT query retrieves the populated data through PitReadService
// ===========================================================================
describe('IU6-04 — PitReadService reads the D114-populated store', () => {
  it('IU6-04a resolves a D01_QUOTES record admitted by D114 ingestion', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService<Record<string, unknown>>(store as never);
    const result = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_EQ,
      domain: 'D01_QUOTES',
      asOf: AFTER_ALL,
    });
    assert.strictEqual(result.found, true);
    if (!result.found) return;
    assert.strictEqual(result.resolvedAsOf, NON_PRODUCTION_D114_VINTAGE_3);
    assert.strictEqual(result.payload.ltp, 4125.6);
  });

  it('IU6-04b resolves a D02_OHLCV record admitted by D114 ingestion', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService<Record<string, unknown>>(store as never);
    const result = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_EQ,
      domain: 'D02_OHLCV',
      asOf: AFTER_ALL,
    });
    assert.strictEqual(result.found, true);
    if (!result.found) return;
    assert.strictEqual(result.payload.close, 4125.6);
    assert.strictEqual(result.payload.interval, '1d');
  });
});

// ===========================================================================
// 6. BL/EQ isolation on D114-populated data
// ===========================================================================
describe('IU6-06 — series-aware isolation of D114-populated records', () => {
  it('IU6-06a BL and EQ are distinct PIT identities with distinct payloads', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService<Record<string, unknown>>(store as never);

    const eq = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_EQ,
      domain: 'D01_QUOTES',
      asOf: AFTER_ALL,
    });
    const bl = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_BL,
      domain: 'D01_QUOTES',
      asOf: AFTER_ALL,
    });

    assert.strictEqual(eq.found, true);
    assert.strictEqual(bl.found, true);
    if (!eq.found || !bl.found) return;

    assert.strictEqual(eq.securityId, NON_PRODUCTION_D114_EQ);
    assert.strictEqual(bl.securityId, NON_PRODUCTION_D114_BL);
    assert.notStrictEqual(eq.payload.ltp, bl.payload.ltp);
    assert.strictEqual(eq.payload.ltp, 4125.6);
    assert.strictEqual(bl.payload.ltp, 4131.05);
  });

  it('IU6-06b neither series overwrote the other during admission', () => {
    const { store } = createNonProductionD114PitStore();
    // Each of the 4 identities holds exactly 3 vintages; nothing was collapsed.
    for (const domain of ['D01_QUOTES', 'D02_OHLCV'] as const) {
      for (const securityId of [NON_PRODUCTION_D114_EQ, NON_PRODUCTION_D114_BL]) {
        const range = store.queryRange(
          NON_PRODUCTION_D114_SYMBOL,
          domain,
          BEFORE_ALL,
          AFTER_ALL,
          securityId,
        );
        assert.strictEqual(range.length, 3, `${domain}/${securityId} must retain 3 vintages`);
      }
    }
    assert.strictEqual(store.getRecordCount(), 12);
  });

  it('IU6-06c the series segment comes from the archive, never from a default', () => {
    // Remove the series column value from the CM-UDiFF fixture: no identity may
    // be manufactured, so no series-aware key may be admitted.
    const archive = NON_PRODUCTION_D114_ARCHIVES[1]!;
    const seriesless = archive.csv.replace(/,TCS,EQ,/g, ',TCS,,').replace(/,TCS,BL,/g, ',TCS,,');
    const store = new PointInTimeStore<unknown>();
    const loader = new HistoricalPitIngestionLoader({
      quoteStore: store as never,
      candleStore: store as never,
    });
    loader.ingestArchiveContent(seriesless, { dateIso: archive.dateIso });
    for (const key of store.listAdmittedSeriesKeys()) {
      assert.ok(!key.includes(':EQ'), `no EQ series may be invented: ${key}`);
      assert.ok(!key.includes(':BL'), `no BL series may be invented: ${key}`);
    }
  });
});

// ===========================================================================
// 7 + 8. Historical asOf selection; future vintages are never returned
// ===========================================================================
describe('IU6-07..08 — historical selection and future-vintage exclusion', () => {
  const cases: Array<{ asOf: string; expected: string; ltp: number }> = [
    { asOf: NON_PRODUCTION_D114_VINTAGE_1, expected: NON_PRODUCTION_D114_VINTAGE_1, ltp: 3812.4 },
    { asOf: '2025-01-01T00:00:00.000Z', expected: NON_PRODUCTION_D114_VINTAGE_1, ltp: 3812.4 },
    { asOf: NON_PRODUCTION_D114_VINTAGE_2, expected: NON_PRODUCTION_D114_VINTAGE_2, ltp: 4010.25 },
    { asOf: '2026-02-01T00:00:00.000Z', expected: NON_PRODUCTION_D114_VINTAGE_2, ltp: 4010.25 },
    { asOf: NON_PRODUCTION_D114_VINTAGE_3, expected: NON_PRODUCTION_D114_VINTAGE_3, ltp: 4125.6 },
  ];

  for (const { asOf, expected, ltp } of cases) {
    it(`IU6-07 asOf ${asOf} resolves vintage ${expected}`, () => {
      const { store } = createNonProductionD114PitStore();
      const service = new PitReadService<Record<string, unknown>>(store as never);
      const result = service.queryAsOf({
        securityId: NON_PRODUCTION_D114_EQ,
        domain: 'D01_QUOTES',
        asOf,
      });
      assert.strictEqual(result.found, true);
      if (!result.found) return;
      assert.strictEqual(result.resolvedAsOf, expected);
      assert.strictEqual(result.payload.ltp, ltp);
      assert.ok(Date.parse(result.resolvedAsOf) <= Date.parse(asOf), 'no future leakage');
    });
  }

  it('IU6-08 an asOf before every vintage is a fail-closed NOT_FOUND', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService<Record<string, unknown>>(store as never);
    const result = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_EQ,
      domain: 'D01_QUOTES',
      asOf: BEFORE_ALL,
    });
    assert.strictEqual(result.found, false);
    if (result.found) return;
    assert.strictEqual(result.reason, 'NOT_FOUND');
  });
});

// ===========================================================================
// 9 + 10 + 11. Fail-closed admission and fail-closed reads
// ===========================================================================
describe('IU6-09..11 — invalid inputs fail closed', () => {
  it('IU6-09 an invalid security identity never resolves a populated record', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService<Record<string, unknown>>(store as never);
    for (const bad of ['', 'INE467B01029', 'ISIN:INE467B01029', 'ISIN:INE467B01029:', 'ISIN:SHORT:EQ']) {
      const result = service.queryAsOf({ securityId: bad, domain: 'D01_QUOTES', asOf: AFTER_ALL });
      assert.strictEqual(result.found, false, `must reject ${JSON.stringify(bad)}`);
      if (result.found) continue;
      assert.strictEqual(result.reason, 'INVALID_IDENTITY');
    }
  });

  it('IU6-10 an invalid domain fails closed', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService<Record<string, unknown>>(store as never);
    const result = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_EQ,
      domain: 'D99_NOT_A_DOMAIN' as never,
      asOf: AFTER_ALL,
    });
    assert.strictEqual(result.found, false);
    if (result.found) return;
    assert.strictEqual(result.reason, 'INVALID_DOMAIN');
  });

  it('IU6-11a an impossible archive date is rejected at admission', () => {
    const store = new PointInTimeStore<unknown>();
    const loader = new HistoricalPitIngestionLoader({
      quoteStore: store as never,
      candleStore: store as never,
    });
    for (const bad of ['', 'not-a-date', '2026/01/05', '20260105']) {
      const result = loader.ingestArchiveContent(NON_PRODUCTION_D114_ARCHIVES[1]!.csv, {
        dateIso: bad,
      });
      assert.strictEqual(result.success, false, `must reject dateIso ${JSON.stringify(bad)}`);
      assert.strictEqual(result.quarantinedCount, 1);
    }
    assert.strictEqual(store.getRecordCount(), 0, 'nothing may be admitted from a bad date');
  });

  it('IU6-11b an unparseable asOf fails closed at the read boundary', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService<Record<string, unknown>>(store as never);
    const result = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_EQ,
      domain: 'D01_QUOTES',
      asOf: 'not-an-instant',
    });
    assert.strictEqual(result.found, false);
    if (result.found) return;
    assert.strictEqual(result.reason, 'INVALID_ASOF');
  });

  it('IU6-11c a malformed archive is quarantined and admits nothing', () => {
    const store = new PointInTimeStore<unknown>();
    const loader = new HistoricalPitIngestionLoader({
      quoteStore: store as never,
      candleStore: store as never,
    });
    const garbage = 'COL_A,COL_B\n1,2';
    const result = loader.ingestArchiveContent(garbage, { dateIso: NON_PRODUCTION_D114_DATE_1 });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.format, 'UNKNOWN');
    assert.strictEqual(store.getRecordCount(), 0);
  });

  it('IU6-11d a truncated/corrupt archive buffer is quarantined', () => {
    const store = new PointInTimeStore<unknown>();
    const loader = new HistoricalPitIngestionLoader({
      quoteStore: store as never,
      candleStore: store as never,
    });
    const result = loader.ingestZipBuffer(Buffer.from('not a zip'), NON_PRODUCTION_D114_DATE_1);
    assert.strictEqual(result.success, false);
    assert.strictEqual(store.getRecordCount(), 0);
  });
});

// ===========================================================================
// 12. Provenance survives population
// ===========================================================================
describe('IU6-12 — D114 provenance survives into the PIT read result', () => {
  it('IU6-12a provenance is the D114 offline-bootstrap provenance, verbatim', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService<Record<string, unknown>>(store as never);
    const result = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_BL,
      domain: 'D01_QUOTES',
      asOf: NON_PRODUCTION_D114_VINTAGE_2,
    });
    assert.strictEqual(result.found, true);
    if (!result.found) return;

    assert.strictEqual(result.provenance.sourceClassification, 'CANONICAL_MARKET_DATA');
    assert.strictEqual(result.provenance.vendorTier, 'OFFLINE_BOOTSTRAP');
    assert.strictEqual(result.provenance.dataVersion, 'v1.0.0-d114-historical');
    assert.strictEqual(result.provenance.asOf, NON_PRODUCTION_D114_VINTAGE_2);
    assert.strictEqual(result.provenance.qualityState, 'GOOD');
    assert.ok(
      typeof result.provenance.lineageHash === 'string' && result.provenance.lineageHash.length > 0,
      'a lineage hash must be present',
    );
  });

  it('IU6-12b lineage hashes differ across series (no lineage collapse)', () => {
    const { store } = createNonProductionD114PitStore();
    const service = new PitReadService<Record<string, unknown>>(store as never);
    const eq = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_EQ,
      domain: 'D01_QUOTES',
      asOf: NON_PRODUCTION_D114_VINTAGE_2,
    });
    const bl = service.queryAsOf({
      securityId: NON_PRODUCTION_D114_BL,
      domain: 'D01_QUOTES',
      asOf: NON_PRODUCTION_D114_VINTAGE_2,
    });
    assert.strictEqual(eq.found, true);
    assert.strictEqual(bl.found, true);
    if (!eq.found || !bl.found) return;
    assert.notStrictEqual(eq.provenance.lineageHash, bl.provenance.lineageHash);
  });
});

// ===========================================================================
// 13. Determinism and idempotency
// ===========================================================================
describe('IU6-13 — determinism and idempotency', () => {
  it('IU6-13a two independent populations are byte-identical', () => {
    const a = createNonProductionD114PitStore();
    const b = createNonProductionD114PitStore();
    const snapshot = (p: ReturnType<typeof createNonProductionD114PitStore>) =>
      JSON.stringify(
        p.store
          .listAdmittedSeriesKeys()
          .map((key) => key.split(':'))
          .map(([companyId, domain, ...rest]) =>
            p.store.queryRange(companyId!, domain as never, BEFORE_ALL, AFTER_ALL, rest.join(':')),
          ),
      );
    assert.strictEqual(snapshot(a), snapshot(b));
  });

  it('IU6-13b re-ingesting the same corpus admits nothing new', () => {
    const population = createNonProductionD114PitStore();
    const before = population.store.getRecordCount();

    const second = ingestNonProductionD114Archives(population.loader);
    for (const result of second) {
      assert.strictEqual(result.success, true, result.error);
      assert.strictEqual(result.d01Count, 0, 'no new D01 record on replay');
      assert.strictEqual(result.d02Count, 0, 'no new D02 record on replay');
      assert.strictEqual(result.duplicateCount, 4, 'all four rows are recognised duplicates');
    }
    assert.strictEqual(population.store.getRecordCount(), before);
  });

  it('IU6-13c the loader reports idempotent replay in its validation report', () => {
    const population = createNonProductionD114PitStore();
    ingestNonProductionD114Archives(population.loader);
    const report = population.loader.generateValidationReport({ secondRunNewLoaded: 0 });
    assert.strictEqual(report.metrics.canonicalD01Loaded, 6);
    assert.strictEqual(report.metrics.canonicalD02Loaded, 6);
    assert.strictEqual(report.metrics.idempotentlySkipped, 12);
    assert.strictEqual(report.metrics.rejectedRecords, 0);
    assert.strictEqual(report.replayVerification.idempotencyVerified, true);
    assert.strictEqual(report.governanceInvariants.externalProviderCalls, 0);
    assert.strictEqual(report.governanceInvariants.liveSocketsBound, 0);
    assert.strictEqual(report.governanceInvariants.productionHistoricalEligibility, 'NOT AUTHORIZED');
  });
});

// ===========================================================================
// 14. No duplicate PIT authority is created
// ===========================================================================
describe('IU6-14 — no second PIT authority', () => {
  it('IU6-14a population writes into the caller-supplied authoritative store', () => {
    const store = new PointInTimeStore<unknown>();
    const population = populateNonProductionD114Pit(store);
    assert.strictEqual(population.store, store, 'the very same store instance is used');
    assert.strictEqual(store.getRecordCount(), 12);
  });

  it('IU6-14b the loader admits into the injected store, not a private one', () => {
    const store = new PointInTimeStore<unknown>();
    const population = populateNonProductionD114Pit(store);
    assert.strictEqual(population.loader.getD01Store() as unknown, store);
    assert.strictEqual(population.loader.getD02Store() as unknown, store);
  });

  it('IU6-14c D01 and D02 share one store without colliding', () => {
    const { store } = createNonProductionD114PitStore();
    const keys = store.listAdmittedSeriesKeys();
    assert.strictEqual(keys.filter((k) => k.includes(':D01_QUOTES:')).length, 2);
    assert.strictEqual(keys.filter((k) => k.includes(':D02_OHLCV:')).length, 2);
    assert.strictEqual(new Set(keys).size, keys.length, 'every admitted key is unique');
  });
});
